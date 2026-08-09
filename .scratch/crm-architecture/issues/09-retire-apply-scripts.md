# 09 — Retire `apply_*.mjs`/`apply_login_google.py` scripts

**What to build:** The nine feature-patch scripts (`apply_branding.mjs`, `apply_levels.mjs`, `apply_login_google.mjs`/`.py`, `apply_negeri_routing.mjs`, `apply_negeri_ui.mjs`, `apply_notif.mjs`, `apply_request_access.mjs`, `apply_revert_branding.mjs`, `apply_splash.mjs`) patch `index.html` by exact-substring replacement and rewrite the whole file — no compiler feedback, no reviewable diff. Verify each script's target strings no longer match the current `public/index.html` (i.e., each script's `die()` guard would fire if run now, confirming its patch was already applied), then delete it. From this point on, new features are implemented as direct edits to `index.html`/the domain modules with a normal git diff.

**Blocked by:** None — can start immediately (this is a verify-then-delete step; it doesn't technically require the domain module work from other tickets, though it's most meaningful once there's real module code worth editing directly instead)

**Status:** done

Note: there are actually 10 files (the spec's "nine" undercounts `apply_login_google.mjs` and `apply_login_google.py` as one item) — all 10 verified and deleted.

Each script's guards were traced in execution order (not just the "already applied" flag near the top — a script can pass that check and still die on its first `replaceOnce` target lookup, which equally proves it's safe: it makes zero changes to the file if run):

| Script | First guard that fires | Why |
|---|---|---|
| `apply_branding.mjs` | `if(!html.includes('id="splash"')) die(...)` | Splash screen marker absent |
| `apply_levels.mjs` | first `replaceOnce` target (`u-role` DOM id) | Login UI restructured since; `_isSuper=_role==='superadmin'`-style code is gone too (the role helpers were rewritten as `isSuper`/`CU.role`, ticket 06) |
| `apply_login_google.mjs` | `if (html.includes("loginGoogle") \|\| html.includes("BOOTSTRAP_ADMIN_EMAIL")) die(...)` | Both present — already applied |
| `apply_login_google.py` | same guard, Python | Same reason |
| `apply_negeri_routing.mjs` | `if(html.includes("function nextAgentForState")) die(...)` | Present — already applied |
| `apply_negeri_ui.mjs` | `if(!html.includes("function renderNegeriAssign(")) die(...)` | That function no longer exists (UI refactored since) |
| `apply_notif.mjs` | first `replaceOnce` target (`"let negeriOpen=new Set();"`) | String absent |
| `apply_request_access.mjs` | `if(!html.includes("_isSuper=_role==='superadmin'")) die(...)` | That exact string is gone (role-check code rewritten since, see ticket 06) |
| `apply_revert_branding.mjs` | `if(!html.includes("#c8102e")) die(...)` | Red brand color absent |
| `apply_splash.mjs` | first `replaceOnce` target (`` `<!-- LOGIN -->\n<div id="lp">` ``) | `id="lp"` doesn't exist anywhere — login screen restructured (now `id="login"`) since this script was written |

- [x] All 10 scripts confirmed safe to delete — each would abort before writing anything if run against current `public/index.html`. First 9 verified by a dedicated sub-agent that read every script fully and traced guard order; `apply_splash.mjs` (missed in that pass, caught on a recount) verified directly.
- [x] Deleted all 10 via `git rm` (recoverable from git history).
- [x] Spot-check: the features these scripts were meant to apply are all confirmed present in current `index.html` by other means — Google login (`loginGoogle`/`BOOTSTRAP_ADMIN_EMAIL`), 3-level roles (`isSuper`/`isMgr`/`isAgent`, ticket 06), negeri auto-routing (`nextAgentForState`), branding (Juara Travel logo — see note below). Two features' *original* markers are gone (splash screen `id="splash"`, negeri-assignment UI `renderNegeriAssign`) — worth a human eyeballing the live app to confirm these aren't actually missing/regressed rather than just renamed; this session didn't have a logged-in path to visually confirm the splash screen or negeri-assignment panel specifically.

**Side finding, not acted on**: `public/logo-juara.png` exists on disk but is referenced by nothing in `index.html` — the actual logo is inlined as a base64 `data:image/png` URI in two places (login screen, sidebar). This file is dead weight (same category as ticket 02's deleted backups) but wasn't in ticket 02's original list, so left alone rather than unilaterally expanding scope — flagging for a follow-up decision.
