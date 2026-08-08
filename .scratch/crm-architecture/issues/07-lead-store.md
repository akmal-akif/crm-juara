# 07 — Lead store: `addLead`/`updateLead`/`closeLead` + validation + state ownership

**What to build:** Extend `domain/leads.mjs` from a single shared function into a full Lead store. Move Lead validation (currently inline in `saveLead`, `index.html:3316–3361`: name length, phone length, room-allocation totals) into the module. UI code calls `addLead(data)`, `updateLead(id, patch)`, `closeLead(id)` instead of touching `allLeads`/`trashedLeads` directly; these internally call the existing `API.addLead`/`API.updateLead` Firestore routing (`index.html:2883–2972`), which stays as-is. `allLeads`/`trashedLeads` move behind the store's read accessor — `subscribe()` keeps owning the `onSnapshot` wiring but calls into the store to update state rather than mutating the arrays directly.

**Blocked by:** 03 (extends `domain/leads.mjs`, built in ticket 03)

**Status:** ready-for-agent

- [ ] `domain/leads.mjs` exports `addLead(data)`, `updateLead(id, patch)`, `closeLead(id)`, plus Lead validation moved from `saveLead`
- [ ] `saveLead` and other UI call sites use the store functions instead of mutating `allLeads`/`trashedLeads` or calling `API.*` directly
- [ ] `allLeads`/`trashedLeads` are read through the store's accessor; `subscribe()` calls into the store to update state instead of mutating the arrays directly
- [ ] Lead validation logic is unchanged (same rules, same error messages) — just relocated
- [ ] Unit tests for `addLead`/`updateLead`/`closeLead`/validation, exercising the public interface with plain data in, assertions on return value / resulting state out — no live Firestore connection, no DOM
- [ ] Manually verify in the running app: add a lead, edit a lead, close a lead — all behave identically to before
