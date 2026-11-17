# Setup

The page is static HTML, CSS and JavaScript modules, with no build step. The UV table is produced once by a Python script.

## Run the page

```bash
npm run serve        # python3 -m http.server 8765
```

Open http://localhost:8765. The page fetches `data/*.json`, so it needs a web server; opening `index.html` as a file will not load the data.

## Tests

```bash
npm install
npm test             # Vitest: model, links, descriptions
npm run coverage     # coverage, 80% threshold
uv run --no-project --with pandas --with pytest pytest pipeline -q
```

## Rebuild the UV data

1. Download the yearly one-minute files from data.gov.au (search "Ultraviolet Radiation Index"). Save each as `data/raw/<city>-<year>.csv`, for example `data/raw/brisbane-2025.csv`. The raw files are git-ignored.
2. Run the pipeline:

   ```bash
   uv run --no-project --with pandas python pipeline/build_uv_peaks.py data/raw data/uv_peaks.json
   ```

City keys are listed in `CITIES` in the script. Hobart uses the `kingston` station.

## Other scripts

- `node scripts/scenarios.mjs` prints the scenario results quoted in the README.
- `uv run --no-project --with pillow python scripts/make_og_image.py` redraws the link-preview image.

## Layout

```
index.html, css/site.css   page
js/model.js                pure model functions
js/random.js               seeded random people
js/params.js               reads data/parameters.json
js/hash.js                 shareable links
js/describe.js             chart descriptions for screen readers
js/controls.js, main.js    wiring
js/charts/                 day, tube, bottle and sun charts
data/                      uv_peaks.json (generated), parameters.json (sources)
pipeline/                  ARPANSA -> uv_peaks.json, with tests
tests/                     Vitest tests
```

No API keys or environment variables are needed.
