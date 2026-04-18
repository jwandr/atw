# Travel Guide

A static travel planning site. No build step. Push to GitHub, it deploys automatically.

## Setup (one time)

1. **Create a GitHub repository** and push this folder to the `main` branch.

2. **Enable GitHub Pages**
   - Go to your repo → Settings → Pages
   - Source: **GitHub Actions**
   - The `deploy.yml` workflow handles everything else.

3. **Enable Actions write permissions** (for the safety sync)
   - Settings → Actions → General → Workflow permissions
   - Select **Read and write permissions**

That's it. Your site will be live at `https://yourusername.github.io/your-repo-name/`.

---

## Adding a new destination

### 1. Create the data file
Copy `data/patagonia.json` to `data/newplace.json` and fill it in.

Key fields to update:
```json
{
  "id":                    "newplace",
  "title":                 "New Place",
  "tagline":               "One evocative sentence.",
  "country":               "Country Name",
  "smartraveller_country": "Country Name",   ← must match Smartraveller exactly
  "climate": { "lat": 0.0, "lon": 0.0 },    ← for weather data
  "currency": { "code": "USD", "label": "US Dollar" }
}
```

### 2. Create the destination page
Copy `destinations/patagonia.html` to `destinations/newplace.html`.
Change the one line: `<body data-dest="newplace">`.

### 3. Add a card to the index
Open `index.html` and add an entry to the `DESTINATIONS` array:
```js
{
  id:      'newplace',
  title:   'New Place',
  tagline: 'One evocative sentence.',
  emoji:   '🌴',
  tags:    ['🗓 Oct–Apr', '⏱ 7 days', '💰 $$', '🏖 Beach'],
},
```

### 4. Add a hero image (optional)
Drop `img/newplace.jpg` into the repo. Recommended: 1200×500px minimum.

### 5. Push
```bash
git add .
git commit -m "add newplace destination"
git push
```

Done. GitHub Pages redeploys in ~30 seconds.

---

## How it works

```
index.html              — destination listing (edit DESTINATIONS array)
guides.css              — all styles, shared across every page
dest.js                 — shared rendering engine (loaded by every destination page)
template.html           — reference template (not used in production, for reference)

destinations/
  patagonia.html        — stub: just sets data-dest="patagonia", loads dest.js
  athens.html           — stub: sets data-dest="athens"

data/
  patagonia.json        — all curated content for Patagonia
  athens.json           — all curated content for Athens
  safety-cache.json     — auto-updated nightly by GitHub Action

img/
  patagonia.jpg         — hero images (you provide)
  athens.jpg

.github/workflows/
  deploy.yml            — auto-deploys on push to main
  sync-safety.yml       — fetches Smartraveller data nightly, commits to data/
```

## Live data sources

| Panel | Source | API key needed? |
|---|---|---|
| Safety advice | Smartraveller (cached nightly) | No |
| Climate data | Open-Meteo climate API | No |
| Exchange rate | Frankfurter (ECB data) | No |

All three are free and require no signup.

## Customising the curated content

Edit the JSON files directly in GitHub (click the file → pencil icon → commit).
Changes deploy automatically within ~30 seconds.

For bulk editing, you can maintain a Google Sheet and use a small script to export
each row as a JSON file — but the direct JSON approach is simpler for a small number
of destinations.
