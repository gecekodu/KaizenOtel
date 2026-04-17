# Folder Conventions

This document defines what should stay in each top-level folder.

## Runtime (do not move without reference updates)

- Root `*.html` and runtime server/config files
- `assets/`
- `content/`
- `netlify/`
- `data/`

## Non-runtime

- `docs/`: setup and operational notes
- `tools/`: helper scripts
- `archive/`: backups, exports, and old bundles

## Current housekeeping changes

- Moved `MAIL_SETUP.md` to `docs/MAIL_SETUP.md`
- Moved `scraping_example.py` to `tools/scraping_example.py`
- Moved `.rar` and placeholder archive files to `archive/`
- Moved shared styles to `assets/css/`
- Moved frontend scripts to `assets/js/`

## Recommendation

If you later want a full refactor (moving root CSS/JS/HTML into `pages/`, `styles/`, `scripts/`), do it in one pass and update all internal links together.
