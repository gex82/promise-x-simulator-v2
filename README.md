# PromiseX Simulator (v2)

This repository contains an enhanced, lightweight React application demonstrating **PromiseX** — a concept vision that orchestrates Fulfillment assets to deliver smarter promises.  Compared to the original prototype, this version:

- Adds a short **persona guide** with clear descriptions and bullets so users know what each tab is about.
- Replaces the simplistic shipping estimate chart with a **probability density plot** for the ETA window.  The peak height reflects likelihood and the vertical marker shows the median (P50) delivery day.
- Improves the **risk heatmap** by labeling rows and columns, showing row/column averages, colouring stages by risk, and listing the top three hotspots with suggested actions.  A 14‑day OTP/risk trend helps you see how interventions cut risk.
- Augments the **Sales & RM** tab with SLA gap, penalty exposure, upsell recommendations and a simple carbon/OTP contract report.  The SLA target slider directly changes these calculations, and the risk badge tells you at a glance whether the predicted on‑time performance meets your target.

Everything is dark‑themed with high contrast so it pops against a black screen, and all sliders and toggles recompute the underlying metrics.  Charts animate lightly, respecting the user's **prefers‑reduced‑motion** setting.

## Project structure

```
promise-x-simulator-v2/
├── src/                    # React source code
│   ├── components/
│   │   └── ui/             # Minimal UI primitives (Card, Tabs, Button, etc.)
│   ├── App.tsx             # Main application (PromiseX)
│   ├── index.css           # Tailwind CSS imports
│   └── main.tsx            # Entrypoint for Vite
├── index.html              # HTML template used by Vite
├── package.json            # Project metadata and scripts
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

## Local development

1. Install **Node.js ≥ 18** and **npm ≥ 8**.
2. Navigate into the project directory in your terminal:

   ```bash
   cd promise-x-simulator-v2
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start a development server:

   ```bash
   npm run dev
   ```

5. Open the URL printed in your terminal (usually `http://localhost:5173`) in Chrome or Edge.  The app will hot‑reload when you edit source files.

## Building for production

To generate an optimised build, run:

```bash
npm run build
```

This produces static files in the `dist/` directory.  You can preview the build locally with:

```bash
npm run preview
```

## Deploying to Cloudflare Pages

Cloudflare Pages provides a free static hosting tier with a `<project>.pages.dev` subdomain.  There are two common ways to deploy: via Git integration or via the Wrangler CLI.

### Option A: Git integration (easiest)

1. Create a new repository on GitHub (e.g. `promise-x-simulator-v2`).
2. Push the contents of this project to that repository:

   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/promise-x-simulator-v2.git
   git add .
   git commit -m "Initial commit"
   git push -u origin master
   ```

3. Log in to your Cloudflare dashboard and create a new **Pages** project.
4. Choose **Git** as the source, select your repository and accept the defaults.
5. When prompted for a **framework preset**, choose **Other** (or **React** if available).  Set the **build command** to `npm run build` and the **build output directory** to `dist`.
6. Click **Save and Deploy**.  Cloudflare will install dependencies, build the project and host it at `https://<your‑project>.pages.dev`.

### Option B: Wrangler CLI (manual but flexible)

1. Install the Cloudflare CLI globally:

   ```bash
   npm install -g wrangler
   ```

2. Authenticate with your Cloudflare account (this opens a browser window):

   ```bash
   wrangler login
   ```

3. Create a new Pages project (replace `promise-x-simulator-v2` with your desired name):

   ```bash
   wrangler pages project create promise-x-simulator-v2
   ```

4. Build the project locally:

   ```bash
   npm run build
   ```

5. Deploy the static files in `dist/` to your Pages project:

   ```bash
   wrangler pages deploy dist --project-name promise-x-simulator-v2
   ```

After deployment, you’ll receive a unique URL like `https://<project>.pages.dev`.  You can later add custom domains in the Cloudflare dashboard.

## Publishing from GitBash (for dummies)

If you’re new to Git and Bash, here’s a concise “for dummies” workflow to get your site live:

1. Open **Git Bash** and navigate to where you unzipped this project:

   ```bash
   cd path/to/promise-x-simulator-v2
   ```

2. Initialise a new Git repository and stage all files:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. Create a new repository on GitHub from the web interface.  Copy the repository URL (it will look like `https://github.com/youruser/promise-x-simulator-v2.git`).

4. Add the remote and push your code:

   ```bash
   git remote add origin https://github.com/youruser/promise-x-simulator-v2.git
   git push -u origin master
   ```

5. In the Cloudflare dashboard, create a new **Pages** project and hook it up to your GitHub repo.  Use `npm run build` as the build command and `dist` as the output directory.

6. After Cloudflare finishes building, visit the provided URL in your browser.  That’s it!

## Troubleshooting

* **Dependency installation fails** — ensure your network connection allows access to the npm registry.  Running behind a proxy may require additional npm configuration (`npm config set proxy http://proxy.example.com:8080`).
* **Build errors** — the app uses TypeScript and Vite.  Make sure you installed the dev dependencies and that your Node.js version is up to date.  If errors mention missing modules, run `npm install` again.
* **Cloudflare deployment fails** — double‑check the project name and that you’re authenticated (`wrangler whoami`).  You can also deploy via Git integration (Option A) if CLI deployment is problematic.

Enjoy exploring the PromiseX simulator!