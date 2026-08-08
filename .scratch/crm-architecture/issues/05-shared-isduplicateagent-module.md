# 05 — Shared `isDuplicateAgent()` module — reconcile duplicate-detection disagreement

**What to build:** `cleanup-agents.mjs:29,38` and `cleanup-dupes.mjs:34–59` each reinvent their own ad hoc name-normalization/completeness-scoring for "are these two agent records duplicates," and can disagree with each other. Create a real `isDuplicateAgent(a, b)` definition in `domain/agents.mjs` (foundation — full agent store comes later in ticket 08) and have both scripts import it.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `domain/agents.mjs` exports `isDuplicateAgent(a, b)`, consolidating the logic currently duplicated across `cleanup-agents.mjs` and `cleanup-dupes.mjs`
- [ ] `cleanup-agents.mjs` imports and uses the shared `isDuplicateAgent` instead of its own inline check
- [ ] `cleanup-dupes.mjs` imports and uses the shared `isDuplicateAgent` instead of its own inline check
- [ ] Unit tests for `isDuplicateAgent` covering the cases the two scripts previously disagreed on
- [ ] Dry-run both scripts against current data and confirm the set of flagged duplicates is sane (no new dupes flagged, no previously-flagged dupes dropped, unless the disagreement itself explains a diff — document any such diff)
