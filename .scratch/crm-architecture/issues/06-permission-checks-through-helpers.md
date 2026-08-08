# 06 — Route permission checks through `isSuper()`/`isMgr()`

**What to build:** Mechanical pass replacing every inline `CU && CU.role===...` / `CU.role==='agent'` check (~15 sites, including `index.html:1594`, `:1608`, `:2047`, `:2118`, `:3146`, `:3280–3304`, `:2865–2866`) with calls to the existing `isSuper()`/`isMgr()` helpers (`index.html:1576–1577`). Same predicate, one call site each — no behavior change. Adding a new role becomes a one-function change instead of a search-and-replace across every call site.

**Blocked by:** 01 (dedup must land first, since a couple of the inline checks live inside the now-deleted duplicate functions — no point editing code about to be removed)

**Status:** ready-for-agent

- [ ] Every inline role-comparison site identified in the spec (and any others found during the pass) now calls `isSuper()`/`isMgr()` instead of comparing `CU.role` directly
- [ ] No new permission behavior introduced — same predicate, same result, at every site
- [ ] Manually verify permission-gated UI for each role (super, manager, agent) looks and behaves identically to before
