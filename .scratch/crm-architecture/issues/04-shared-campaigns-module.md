# 04 — Shared `normCampaignName()`/`canonicalCampaigns()` module

**What to build:** Move `normCampaignName()` and `canonicalCampaigns()` (currently `index.html:1544–1564`) into a new `domain/campaigns.mjs` ES module, imported back into `index.html`. Unchanged logic — this is a pure extraction.

**Blocked by:** None — can start immediately

**Status:** done

- [x] `public/domain/campaigns.mjs` exports `normCampaignName(n)` and `canonicalCampaigns(camps)` — logic identical to the original, except `canonicalCampaigns` now takes the campaigns array as an explicit parameter instead of reading the global `allCamps` (needed to make it a pure, testable module function, same pattern as ticket 03's `closedDate(lead)`; also fixed an incidental inefficiency where the original computed the campaign grouping twice per call — same result, computed once). `campaignUpdatedMs(k)` moved too (a dependency, and independently used elsewhere in `index.html`); the internal `campaignGroups()` helper is not exported since nothing outside `canonicalCampaigns` called it.
- [x] `index.html` imports `normCampaignName`/`campaignUpdatedMs`/`canonicalCampaigns` from `domain/campaigns.mjs` via the same `<script type="module">` block used for ticket 03, exposing them as `window.X`. Since `canonicalCampaigns` needs `allCamps` (a `let`-declared global not visible inside a module script), kept a one-line classic-script wrapper `function canonicalCampaigns(){ return window._canonicalCampaigns(allCamps); }` so all ~9 existing zero-arg call sites (`canonicalCampaigns()`) keep working unchanged.
- [x] Unit tests: 13 new tests in `public/domain/campaigns.test.mjs` covering `normCampaignName` (dash normalization for en-dash/em-dash/minus, whitespace collapsing, empty input) and `canonicalCampaigns` (grouping, duplicate-field backfill, max spend/budget fallback, duplicate id/count tracking, sort order, empty input). 25/25 tests passing overall (12 from ticket 03 + 13 new).
- [x] No visible behavior change — verified in a real Chrome tab: Kempen Iklan page renders correctly with campaigns deduplicated/grouped as before, no console errors.
