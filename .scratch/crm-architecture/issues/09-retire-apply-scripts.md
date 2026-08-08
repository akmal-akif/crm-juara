# 09 — Retire `apply_*.mjs`/`apply_login_google.py` scripts

**What to build:** The nine feature-patch scripts (`apply_branding.mjs`, `apply_levels.mjs`, `apply_login_google.mjs`/`.py`, `apply_negeri_routing.mjs`, `apply_negeri_ui.mjs`, `apply_notif.mjs`, `apply_request_access.mjs`, `apply_revert_branding.mjs`, `apply_splash.mjs`) patch `index.html` by exact-substring replacement and rewrite the whole file — no compiler feedback, no reviewable diff. Verify each script's target strings no longer match the current `public/index.html` (i.e., each script's `die()` guard would fire if run now, confirming its patch was already applied), then delete it. From this point on, new features are implemented as direct edits to `index.html`/the domain modules with a normal git diff.

**Blocked by:** None — can start immediately (this is a verify-then-delete step; it doesn't technically require the domain module work from other tickets, though it's most meaningful once there's real module code worth editing directly instead)

**Status:** ready-for-agent

- [ ] For each of the nine scripts, confirm its target substring(s) are absent from the current `public/index.html` (already applied)
- [ ] Delete all nine scripts once confirmed
- [ ] Spot-check `public/index.html` still reflects the features each script was meant to apply (branding, levels, Google login, negeri routing/UI, notifications, request access, splash) — nothing regresses
