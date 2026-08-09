# 02 — Delete dead backup HTML files

**What to build:** Remove the drifted, unreferenced HTML snapshots sitting at the repo root and under `public/` so they stop showing up as noise when navigating the codebase.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Confirmed `index (11).html` and `public/index-backup20.html`, `index-backup21.html`, `index-backup22.html`, `index-backup24.html` are not referenced anywhere — grepped the whole repo for each filename, only match was this ticket file itself
- [x] Deleted all five files via `git rm` (fully recoverable from git history if ever needed)
- [x] Spot-checked `firebase.json` (`"public": "public"`, ignore list, catch-all rewrite to `/index.html`) and `.firebaserc` — neither references any of the deleted files
