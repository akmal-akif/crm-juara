# 06 — Route permission checks through `isSuper()`/`isMgr()`

**What to build:** Mechanical pass replacing every inline `CU && CU.role===...` / `CU.role==='agent'` check (~15 sites, including `index.html:1594`, `:1608`, `:2047`, `:2118`, `:3146`, `:3280–3304`, `:2865–2866`) with calls to the existing `isSuper()`/`isMgr()` helpers (`index.html:1576–1577`). Same predicate, one call site each — no behavior change. Adding a new role becomes a one-function change instead of a search-and-replace across every call site.

**Blocked by:** 01 (dedup must land first, since a couple of the inline checks live inside the now-deleted duplicate functions — no point editing code about to be removed)

**Status:** done

- [x] Every remaining inline role-comparison site (re-audited after tickets 01/03/04 shifted line numbers) went through `isSuper()`/`isMgr()`. All other `CU.role` sites turned out to already be `isSuper()`/`isMgr()` calls from prior work — the only pattern still inline everywhere was `CU && CU.role === 'agent'` (8 sites), which had **no existing helper** (`isSuper`/`isMgr` only cover the admin tiers, not the inverse — `!isMgr()` isn't equivalent, since it's `true` when `CU` is null but the inline check is `false` when `CU` is null). Added a third helper `const isAgent = () => CU && CU.role === 'agent';` right next to `isSuper`/`isMgr`, then replaced all 8 call sites with `isAgent()`.
- [x] **Caught and fixed during self-review**: a `replace_all` edit swept up the occurrence of the exact same expression *inside the new `isAgent` definition itself*, producing `const isAgent = () => isAgent();` — infinite recursion the instant it was called. Caught before running any test, by re-reading the diff.
- [x] No new permission behavior — verified in a real browser: before login (`CU` unset) `isSuper()`/`isMgr()`/`isAgent()` all return falsy without throwing (same short-circuit as the original `CU && ...`); logged in as demo superadmin, `visLeads()` returns all 36 leads; with `CU.role` temporarily forced to `'agent'`, `visLeads()` correctly narrows to only that agent's 8 leads and the advanced-filter "Agent" dropdown is correctly hidden (`isAgent()` gate).
- [x] `npm test` (34 tests) unaffected, still passing.
