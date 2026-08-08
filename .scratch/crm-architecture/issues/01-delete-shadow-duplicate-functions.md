# 01 — Delete shadow-duplicate render/edit function definitions

**What to build:** `index.html` currently defines `renderDash`, `renderTeam`, `openAddUser`, `editUser`, and `saveUser` two or three times each (later `<script>` blocks overwrite earlier ones). Delete every non-executing duplicate so each function has exactly one definition, and remove the now-empty IIFE wrappers left behind. This is a pure prefactor — no visible behavior changes, since only the dead copies are removed.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `renderDash` exists once (the version currently at `index.html:4041`); the shadowed copy at `:1905` is gone
- [ ] `renderTeam` exists once (the version currently at `index.html:4286`); the shadowed copies at `:2149` and `:4094` are gone
- [ ] `openAddUser`, `editUser`, `saveUser` each exist once (the versions currently at `:4149`/`:4163`/`:4185`); the shadowed copies at `:3687`/`:3696`/`:3706` are gone
- [ ] Empty IIFE wrappers that only existed to reassign the now-deleted duplicates are removed
- [ ] Manually verify in the running app: dashboard renders, team view renders, adding/editing a user still works exactly as before
