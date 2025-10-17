# 404-Found
Capstone Project for the group 404 Found

## Quick Start

This is a static site (HTML/CSS/JS). You can open it directly or serve it locally for better routing and asset loading.

### Option A — Open the HTML file directly

1. In VS Code, right-click `Pages/home_page.html` and choose "Open With Live Preview" (if you have that extension), or simply open it in your browser by double-clicking it in Finder.

### Option B — Run a local static server

From the project root:

```sh
# Using Python 3's built-in server
python3 -m http.server 5500

# Or, if you have Node.js, using npx http-server (installs automatically if needed)
npx http-server -p 5500
```

Then open:

- http://localhost:5500/Pages/home_page.html

### File Structure

- `Pages/home_page.html` — main page
- `Pages/style.css` — styles
- `Pages/main.js` — client-side behavior
- `assets/images/` — logos and icons

### Notes

- If favicons/logos don't appear when opening the file directly, use Option B so relative paths resolve as expected.
