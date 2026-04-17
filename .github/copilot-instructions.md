# Copilot Instructions for Kaizen Hotel Website Codebase

## Overview

This codebase is a multi-page hotel website for static hosting, using HTML, CSS, vanilla JS, and minimal PHP (for forms). Key features:
- All reservation and room selection logic is now handled exclusively in `odasecimi.html` and `odasecimi.js` (dynamic pricing, basket, counters, guest form, etc.)
- Animated Google reviews and virtual tours (Pannellum/Teliportme)
- Local attractions guide with grid/card layouts
- Minimal external dependencies; all assets are local except for some JS libraries (e.g., flatpickr)
- No build step; direct file editing and browser refresh for development

## Key Components
- `index.html`: Main landing page, navigation, reviews, and virtual tour entry
- `mersin-gezilecek-yerler.html`: Local attractions guide (CSS Grid, `.places-list`, `.place-card`)
- `odasecimi.html`, `odasecimi.js`: All reservation and room selection logic (dynamic pricing, basket, counters, guest form, etc.)
- `assets/js/script.js`: Google reviews animation, UI logic
- `assets/css/style.css`: Main styling, custom grid/card layouts, modern counter styles (see `.counter-modern`)
- `images/`, `video/`: All visual assets; reference with relative paths only
- `pano/`: Virtual tour pages (Pannellum integration, see `pannellum.html`)
- `form.php`: Basic PHP form handler (ensure server supports PHP)

## Patterns & Conventions
- **Reservation Logic**: All reservation, basket, and guest form logic is in `odasecimi.js` and rendered in `odasecimi.html`. No reservation code remains in other files.
- **Modern Counters**: Room/adult/child counters use `.counter-modern` styles and are rendered via JS in `odasecimi.js` (see `renderRooms`).
- **Basket Logic**: Room selections are managed in-memory (`basket` array), with summary and removal handled in JS.
- **Grid/Card Layouts**: Attractions and rooms use CSS Grid and card patterns (`.places-list`, `.place-card`, `.room-card`).
- **Image/Video Referencing**: All images must be in `images/` and videos in `video/`, referenced with relative paths.
- **Navigation**: Header navigation is duplicated across HTML files; update all for global changes.
- **Dynamic Pricing**: Room prices and logic in `odasecimi.js` (see `updateRoomPrice`, `changeCounter`).
- **Reviews Animation**: Google reviews animated in `assets/js/script.js` (fade-in/fade-out).
- **Virtual Tour**: Pannellum/Teliportme integrations in `pano/` HTML files.
- **Form Handling**: PHP form (`form.php`) for submissions; ensure server supports PHP if used.

## Developer Workflows
- **Edit & Refresh**: Directly edit HTML/CSS/JS files; refresh browser to see changes. No build or test step.
- **Image/Video Updates**: Add images to `images/`, videos to `video/`, update HTML/JS references.
- **Custom Styling**: Extend classes in `assets/css/style.css` (e.g., `.counter-modern`, `.room-card`).
- **Debugging**: Use browser dev tools for layout/JS debugging. No framework or bundler.
- **Reservation Logic**: All dynamic room selection, counters, basket, and guest form logic is in `odasecimi.js`/`odasecimi.html` only.
- **PHP Forms**: Use `form.php` for form submissions if server supports PHP.

## Integration Points
- **Google Reviews**: Animated in `assets/js/script.js`, data from `reviews.json` (static or fetched).
- **Virtual Tours**: Embedded via Pannellum/Teliportme in `pano/` HTML files.
- **Room Selection & Reservation**: All logic in `odasecimi.js`/`odasecimi.html`.
- **Form Submission**: Basic PHP handler (`form.php`).

## Examples
- Add a new attraction: Place image in `images/`, add a `.place-card` in `mersin-gezilecek-yerler.html`, update grid in `assets/css/style.css` if needed.
- Add a new room type: Update `rooms` array in `odasecimi.js`, add images to `images/`.
- Change room prices: Edit price values in `odasecimi.js`.
- Update navigation: Edit header in all HTML files.
- Update counter style: Edit `.counter-modern` in `assets/css/style.css`.

## Recommendations for AI Agents
- Always check for image/video existence in `images/` or `video/` before referencing.
- Use/extend `.counter-modern` for all new counters.
- Maintain consistent card/grid layouts for new sections.
- When updating navigation or global styles, propagate changes to all HTML files.
- Avoid framework-specific code; use only vanilla JS and CSS.
- For new dynamic features, follow patterns in `odasecimi.js` (in-memory state, direct DOM updates).
- For virtual tours, use Pannellum integration as in `pano/pannellum.html`.
- For forms, use PHP only if server supports it; otherwise, use JS-based solutions.

_Last updated: October 2025 (rezervasyon.js/html removed, all reservation logic unified in odasecimi.js/html)_
