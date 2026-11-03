# Responsive Internship Board

An accessible internship listing page built with plain HTML, CSS and JavaScript (no framework).

## Features
- Internship cards rendered from `data/internships.json` (reusable card template in `app.js`)
- Search by title, skill, location, domain or mode
- Domain chips + work-mode dropdown filters
- Loading, empty and error states (with Retry button)
- Keyboard support: skip link, visible focus, `/` focuses search, `Esc` clears it, arrow keys move between domain chips
- Labelled form controls, `aria-live` status updates, `aria-pressed` on chips
- Responsive layout: 1 column on mobile, 2 on tablet, 3 on desktop

## Run locally
The page loads data with `fetch`. If you open index.html directly from disk it falls back to `data/internships.js`; on a server it uses `data/internships.json`. For the most accurate test, use a local server:

```
python3 -m http.server 8000
```
Then open http://localhost:8000

## Files
- `index.html` – page structure
- `styles.css` – responsive styles
- `app.js` – data loading, filtering, rendering
- `data/internships.json` – seed records

- `data/internships.js` – same records, used only when opened from disk (file://)

Record IDs (e.g. `INT-101`) from the seed are kept unchanged and shown in each card's details dialog.

## Details dialog
"View details" opens a native `<dialog>`: focus is trapped inside, `Esc` or Close dismisses it, and focus returns to the button that opened it.

## Manual test checklist
- [ ] Tab through the page: skip link, search, mode, chips, reset, View details buttons
- [ ] Search "SQL" returns 2 cards; "zzz" shows the empty state
- [ ] Rename `data/internships.json` temporarily (on a server) to see the error state, then Retry
- [ ] Click Apply: it turns green and says "Applied ✓" (click again to withdraw; it is remembered after refresh)
- [ ] Open "Details", press Esc, confirm focus returns to the button
- [ ] Resize to 360px, 768px, 1200px: no horizontal scrolling at 360px

## Accessibility evidence
- Skip link to the listings; every control has a visible label
- Visible focus outline on all interactive elements; touch targets are at least 44px tall
- Result count announced through an `aria-live` region; chips expose `aria-pressed`
- Keyboard-only flow works for search, filters, cards and the details dialog
- Add your own screenshots / Lighthouse accessibility score here before submitting
