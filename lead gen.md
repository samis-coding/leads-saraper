```md
# Maps Lead Scraper — Chrome Extension (MV3) Build Specification

> Save as `maps-lead-scraper-spec.md`

This is a refined version of the original prompt. Changes from the original: added global constraints, explicit file tree, centralized selector strategy, storage/export failure modes, and a final Definition of Done. The 8-phase iterative loop and the 5-step per-phase process are preserved.

Work in an iterative loop. Do **not** write all the code in one pass. For each phase below:

1. Propose the plan/approach in 2–4 sentences.
2. Implement it.
3. Self-review the code for bugs, fragile selectors, or MV3 policy violations.
4. State what you tested or would test.
5. Only then move to the next phase.

If a phase reveals a problem in an earlier phase, go back and fix it before continuing — do not patch around it.

---

## 0. Global constraints

- Manifest V3 only. No remote code, no `eval`, no inline scripts in extension pages.
- Default extension-page CSP. Tailwind must be build-time compiled; no CDN.
- Minimal permissions: request only what each feature actually uses. Do not add `tabs`, `notifications`, `unlimitedStorage`, or broad host permissions unless a later phase proves them necessary.
- All Google Maps DOM selectors live in one module: `src/content/selectors.ts`. Selectors are versioned and ordered by stability: structural attributes (`role`, `href`, `aria-label`) > text matching > obfuscated classes.
- Shared data model in `src/shared/types.ts` is the single source of truth for `Lead`, `ScrapeJob`, `ScrapeStatus`, and export formats.
- Every async user action must handle cancellation, timeout, and failure without killing the service worker.

---

## Phase 1 — Scaffold

Implement only the file/folder structure, TypeScript config, MV3 manifest, empty functions with JSDoc responsibilities, and Tailwind build setup. No business logic yet.

### Proposed structure

```
/
├── manifest.json
├── src/
│   ├── popup.html
│   ├── popup/
│   │   └── popup.ts
│   ├── content/
│   │   ├── content.ts
│   │   ├── selectors.ts
│   │   └── extractor.ts
│   ├── background/
│   │   ├── background.ts
│   │   ├── search.ts
│   │   ├── storage.ts
│   │   ├── exporter.ts
│   │   └── webhook.ts
│   ├── shared/
│   │   └── types.ts
│   └── styles/
│       └── tailwind.css
├── tests/
│   ├── fixtures/
│   │   └── maps-*.html
│   └── maps-scraper.spec.ts
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Review

- Are all required files present?
- Does the MV3 manifest declare only the permissions actually needed at this stage — likely `storage`, `identity`, and host permission for `https://www.google.com/maps/*`?
- Is the CSP unchanged from the MV3 default?
- Does the Vite config emit MV3-compatible assets with `@crxjs/vite-plugin`?

### Test

- `npm run build` succeeds.
- `npm run dev` loads the unpacked extension without errors.
- Popup opens with placeholder text.
- Background service worker starts and stays idle without errors.

---

## Phase 2 — Popup UI

Build the popup with:

- Country, City, and Niche/Category inputs.
- Start and Stop buttons.
- Results table.
- Live lead counter.

Use vanilla DOM manipulation and build-time Tailwind.

### Review

- Is state managed cleanly between popup and background worker?
- Does the popup survive close/reopen without losing the current run status?
- Do Start/Stop actions send explicit messages to the background worker rather than directly manipulating background state?
- Are input values validated before starting a scrape?

### Test

- Opening the popup restores the current job status from storage.
- Start disables the Start button and enables Stop.
- Stop disables Stop and re-enables Start.
- Live counter updates as background reports new leads.

---

## Phase 3 — Search navigation

Implement logic to build the Google Maps search URL and open/navigate the correct tab.

### URL strategy

```ts
const query = [niche, city, country].filter(Boolean).join(' ');
const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
```

### Review

- Does it handle special characters such as `&`, `#`, `/`, `?`, `%`, and apostrophes?
- Does it handle multi-word cities and niches correctly?
- Does it handle re-runs correctly? If a tab already exists, reuse or update it instead of opening a duplicate.
- Does it wait for the tab to finish loading before injecting/content-script interaction?
- Is the tab ID stored so later phases can target the correct tab?

### Test

- Searches with `Café & Bakery`, `São Paulo`, `Saint-Louis-du-Senegal` build valid URLs.
- Re-running reuses the same tab instead of opening a new one.
- Navigation is complete before scraping begins.

---

## Phase 4 — Scraping engine

Build a content script that:

- Scrolls the Maps results panel.
- Waits for lazy-loaded listings.
- Extracts `Name`, `Category`, `Address`, `Phone`, `Website`, `Rating`, `Reviews`, `Place URL`.

### Selector strategy

- Centralize all selectors in `src/content/selectors.ts`.
- Prefer structural selectors:
  - Results feed container: `[role="feed"]` or `div[aria-label*="Results for"]`.
  - Result cards: `a[href*="/maps/place/"]` or `article`.
  - Name: from the card's `a[href*="/maps/place/"]` text or `h3`.
  - Category/address: sibling text within the card.
  - Website: `a[href^="http"][data-value*="Website"]` or text `Website`.
  - Phone: element containing `tel:` or text matching phone pattern.
- Use optional chaining and nullish coalescing everywhere. Missing fields must be `null`, not throw.
- Mark sponsored/ad listings as `isAd: true` and exclude them from export by default.

### Edge cases to handle without crashing

1. **No website listed** — `website` becomes `null`.
2. **No phone listed** — `phone` becomes `null`.
3. **Sponsored/ad listing** — detected via text `Sponsored` or `Ad`; marked `isAd`, not exported.

### Review

- Does the extractor return a complete `Lead` object even when optional fields are missing?
- Does the scroller scroll the results feed container, not the whole page?
- Does it stop when no new results are found after N consecutive scrolls?
- Is there a timeout to avoid infinite scrolling?
- Are selector fallbacks documented in the selector module?

### Test

- Playwright tests against saved Maps HTML snapshots:
  - A normal listing with all fields.
  - A listing without website.
  - A listing without phone.
  - A sponsored/ad listing.
  - A lazy-loaded list that adds cards after scrolling.

---

## Phase 5 — Dedup + storage

Implement:

- Deduplication by normalized `name + address`.
- Persistence to `chrome.storage.local`.
- Graceful handling of the ~10 MB soft cap.

### Review

- Is the dedup key stable across small formatting differences?
  - Normalize to lowercase.
  - Remove punctuation and extra whitespace.
  - Collapse multiple spaces.
- What happens with 1,000+ leads?
  - Storage writes happen incrementally, not as one giant blob.
  - A quota error triggers a user-facing warning and pauses scraping.
  - The popup offers export/clear actions when storage is nearly full.
- Does the storage module expose a clear schema?
  - Example: `leads` key stores an array of `Lead`.
  - Example: `jobStatus` key stores current run state.

### Test

- Inserting 1,000 leads completes without crashing.
- Duplicate leads are skipped.
- Forced quota error is caught and surfaced.
- Stored data survives background service worker suspension.

---

## Phase 6 — Export features

Implement:

- CSV export.
- Google Sheets OAuth export.
- Clipboard copy.

### CSV export

- Use `papaparse` bundled with the extension.
- Generate CSV from the current lead list.
- Trigger download from the popup.

### Google Sheets export

- Use `chrome.identity.getAuthToken({ interactive: true })`.
- Require scope: `https://www.googleapis.com/auth/spreadsheets`.
- Write rows to a new or user-selected spreadsheet.
- If the user denies OAuth permission, fail gracefully with an error message in the popup. Do not throw an unhandled rejection.

### Clipboard copy

- Use `navigator.clipboard.writeText` with fallback to `document.execCommand('copy')`.
- Show a success/failure toast.

### Review

- Does OAuth fail gracefully if permission is denied?
- Are all export actions disabled while a scrape is running?
- Does CSV export escape commas, quotes, and newlines correctly via papaparse?

### Test

- Export 1 lead and 100 leads to CSV.
- Deny Sheets permission and confirm the popup shows an error.
- Copy 1 lead and 50 leads to clipboard.

---

## Phase 7 — Reliability pass

Add:

- Rate-limiting/delays between scroll actions.
- Error handling for DOM structure changes.
- Mid-run interrupt for Stop Scraping.

### Rate limiting

- Default delay: randomized `1200–2200 ms` between scroll/extract cycles.
- Make delay configurable from popup advanced settings.
- Do not use `alert`, `confirm`, or blocking dialogs.

### Stop Scraping

- Content script checks a `stop` flag before each scroll and extraction cycle.
- Background sets the `stop` flag on `chrome.storage.local`.
- In-flight extraction finishes the current card and then exits.
- Popup status changes to `Stopped` and results table remains.

### DOM structure change detection

- If the results container is found but extraction yields zero while cards are still present, try fallback selectors.
- If all selector sets fail, emit a structured warning:
  - `SelectorVersionChangeDetected`
  - Store which selector set failed.
  - Notify popup that Google Maps markup may have changed.
- Most likely to break first: obfuscated CSS classes. Structural `role`/`href` selectors should be primary.

### Review

- Re-read Phase 4 selectors. Which are most fragile? What is the fallback order?
- Does Stop interrupt cleanly without leaving partial state?
- Are all delays cancellable?

### Test

- Run a long scrape and press Stop mid-run. Confirm no new leads are added after Stop.
- Simulate a selector failure with a saved fixture that contains no extractable cards; confirm fallback chain runs and error is reported.

---

## Phase 8 — Final integration review

Read through all files together as a senior engineer doing final PR review.

### Checklist

- Race conditions:
  - Popup closes while background writes.
  - Content script injected before the page is ready.
  - Stop command arrives mid-extraction.
- Service worker lifecycle:
  - No unbounded async work.
  - All listeners registered at top level.
- Message port cleanup:
  - All `chrome.runtime.onMessage` handlers return `true` only when needed.
  - No orphaned ports.
- Unhandled promise rejections:
  - Every promise has a `.catch` or `try/catch`.
- Duplicate messages:
  - Start/Stop operations are idempotent.
- Memory leaks:
  - No accumulating arrays beyond storage limits.
  - Scroll loop terminates correctly.
- Error boundaries:
  - Every user-facing action has a success/failure path.

Fix all remaining bugs, race conditions, and unhandled edge cases before finishing.

---

## Final summary

After all 8 phases, provide a final summary covering:

- What is solid and ready for real use.
- What is fragile and will need future maintenance, especially selectors.
- What should be manually tested against live Google Maps before relying on this for real leads.
```