# Kaizen Hotel Website

Static hotel website built with HTML, CSS, vanilla JavaScript, and minimal Netlify/PHP integrations.

## Project Structure

- `index.html`, `rezervasyon.html`, other `*.html`: Main pages
- `assets/css/`: Shared page styles (`style.css`, `app.css`, `guide-pages.css`, etc.)
- `assets/js/`: Frontend scripts (`script.js`, `rezervasyon.js`)
- `odasecimi.js`: Additional reservation-related frontend logic
- `assets/`: Images and videos used by pages
- `content/`: Secondary content pages
- `data/`: Reservation data files
- `netlify/`: Netlify serverless function config and code
- `docs/`: Documentation files
- `tools/`: Utility scripts used during development
- `archive/`: Legacy/export/archive files (not used by runtime)

## Development Notes

- No build step is required for frontend pages.
- Refresh browser after edits.
- Keep runtime files in root unless references are updated across pages.
