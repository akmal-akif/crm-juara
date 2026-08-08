# 02 — Delete dead backup HTML files

**What to build:** Remove the drifted, unreferenced HTML snapshots sitting at the repo root and under `public/` so they stop showing up as noise when navigating the codebase.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Confirm `index (11).html` and `public/index-backup20.html`, `index-backup21.html`, `index-backup22.html`, `index-backup24.html` are not referenced anywhere (no imports, no links, no build/deploy step reads them)
- [ ] Delete all five files
- [ ] `firebase.json` / deploy config does not reference any of the deleted files (spot-check after deletion)
