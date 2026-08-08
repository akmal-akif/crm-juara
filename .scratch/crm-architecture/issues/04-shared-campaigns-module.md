# 04 — Shared `normCampaignName()`/`canonicalCampaigns()` module

**What to build:** Move `normCampaignName()` and `canonicalCampaigns()` (currently `index.html:1544–1564`) into a new `domain/campaigns.mjs` ES module, imported back into `index.html`. Unchanged logic — this is a pure extraction.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `domain/campaigns.mjs` exports `normCampaignName(n)` and `canonicalCampaigns(...)` with logic identical to the current inline definitions
- [ ] `index.html` imports both from `domain/campaigns.mjs` instead of defining them inline
- [ ] Unit tests for `normCampaignName` (dash normalization, whitespace collapsing, case-folding) and `canonicalCampaigns`
- [ ] No visible behavior change (campaign names/grouping display identically)
