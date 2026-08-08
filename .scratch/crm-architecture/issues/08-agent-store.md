# 08 — Agent store: `renameAgent` cascade + validation + state ownership

**What to build:** Extend `domain/agents.mjs` from `isDuplicateAgent` alone into a full Agent store. Move Agent/user validation (from `saveUser` — previously duplicated and disagreeing at `index.html:3706–3717` and `:4185–4199`, now singular after ticket 01) into the module. Add `renameAgent(id, newName)`, owning the rename cascade currently inlined in `saveUser` (`:3706–3730`, previously duplicated at `:4185–4230`): update every lead assigned to the old name, patch `stateAssign`. Currently this cascade is only remembered by the one form handler that contains it. `allUsers`/`allAgents`/`stateAssign` move behind the store's read accessor, same pattern as the Lead store.

**Blocked by:** 01 (dedup must land first so there's one `saveUser` to rewire, not two disagreeing ones), 05 (extends `domain/agents.mjs`, built in ticket 05)

**Status:** ready-for-agent

- [ ] `domain/agents.mjs` exports Agent/user validation (single definition, no disagreement) and `renameAgent(id, newName)`
- [ ] `saveUser` calls the store's validation and `renameAgent` instead of inlining the cascade
- [ ] `renameAgent` updates every lead assigned to the old agent name and patches `stateAssign` as a single named operation
- [ ] `allUsers`/`allAgents`/`stateAssign` are read through the store's accessor; `subscribe()` calls into the store to update state instead of mutating the arrays directly
- [ ] Unit tests for validation and `renameAgent` (including the cascade to leads and `stateAssign`), exercising the public interface with plain data — no live Firestore connection
- [ ] Manually verify in the running app: add/edit an agent, rename an agent, confirm that agent's leads and negeri assignment update correctly
