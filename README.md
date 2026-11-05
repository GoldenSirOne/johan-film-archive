# FRAME — Johan's Personal Film Archive 

A responsive, interactive movie library built from the supplied movie-rating spreadsheet.

## Features
- Overview dashboard with collection statistics and rating distribution
- Poster-inspired visual library with search, genre/rating filters, sorting, pagination and grid/list views
- Film detail modal with all supplied metadata
- Full personal ranking table
- Insights for decades, directors, genre mix, runtime and personal-vs-IMDb ratings
- Responsive desktop and mobile layouts
- Light/dark contrast toggle

## Run locally
Because the app loads `data/movies.json` with `fetch`, serve the folder through a local web server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy with GitHub Pages
1. Create a GitHub repository and upload the contents of this folder to its root.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`, then Save.
5. GitHub Pages will publish the app at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

## Data integrity
The app uses the 1,253 supplied movie rows and retains the original source fields. It does not fetch or fabricate movie ratings. Poster artwork is an original abstract typographic treatment rather than third-party film poster imagery. Numeric averages exclude blank/non-numeric values.
