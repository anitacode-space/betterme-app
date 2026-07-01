# BetterMe 🚀 — Ultra-Modern Habit & To-Do PWA

**BetterMe** is a Progressive Web App (PWA) designed to empower users on their self-improvement journey. It provides daily habit and to-do list management combined with **Micro-KPI Tracking** and interactive progress charts powered by **Chart.js**.

The application is structured as a decoupled architecture: a fast, responsive, and installable frontend PWA paired with a highly scalable serverless backend API.

---

## 🛠️ Tech Stack

- **Frontend**: 
  - **HTML5 & Vanilla Javascript**: High-performance core application logic.
  - **Tailwind CSS**: Utility-first styling supplemented with custom glassmorphism and modern transition effects in [css/styles.css](file:///C:/projects/betterme-app/css/styles.css).
  - **Chart.js**: Client-side interactive line charts to visualize historical self-improvement scores.
  - **PWA Features**: Fully installable with service-worker caching and offline fallback capabilities.
- **Backend**:
  - **Cloudflare Workers**: High-performance, edge-running serverless API endpoint routing.
  - **Cloudflare D1 Database**: SQLite database running on the edge for robust query performance.

---

## 📂 Project Architecture

```text
betterme-app/
├── index.html          # Main application UI layout
├── manifest.json       # PWA installer configuration (app names, icons, themes)
├── sw.js               # Service Worker for offline static asset caching
├── css/
│   └── styles.css      # Custom stylesheet for styling overrides & animations
├── js/
│   ├── app.js          # Core frontend task & habit tracking logic
│   ├── api.js          # Backend API client interface with offline failover
│   ├── charts.js       # Chart.js KPI visualization builder
│   └── pwa.js          # Service Worker registration & PWA lifecycle hooks
├── assets/
│   └── icons/          # PWA responsive icons and app logo assets
└── api/                # Cloudflare Worker backend API
    ├── src/
    │   └── index.js    # API routing (tasks endpoints, KPI history endpoints)
    ├── migrations/     # Database migration scripts
    │   └── 0001_init.sql
    ├── schema.sql      # Database SQLite schema definition
    └── wrangler.jsonc  # Wrangler deployment configuration
```

---

## ⚡ Offline Fallback Mode

To ensure that self-improvement tracking never halts due to network conditions, BetterMe implements a dual-layer offline fallback system:

1. **Static Asset Caching (Service Worker)**:
   The [sw.js](file:///C:/projects/betterme-app/sw.js) implements a **Stale-While-Revalidate** caching strategy. All frontend assets (HTML, CSS, JS, manifest, and icons) are cached locally. When the user visits the app, the cached version loads instantly (even offline), and the service worker fetches updates in the background.

2. **Dynamic Data Fallback (Local Storage)**:
   The API layer in [js/api.js](file:///C:/projects/betterme-app/js/api.js) automatically monitors connection health:
   - When the backend API is online, data is read from and saved to the Cloudflare D1 database.
   - If the API requests fail (due to network disconnection, timeout, or server downtime), the app transparently falls back to storing data locally in the browser's `localStorage` (`betterme_tasks` and `betterme_kpis`).
   - The user gets an uninterrupted experience, with the app continuing to compute Micro-KPIs and render the growth chart using cached historical values.

---

## 🚀 Setup & Local Development

Follow the instructions below to run both the frontend and backend of the application locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### 1. Backend API Setup (Cloudflare Workers + D1)

1. Open your terminal and navigate to the `api` directory:
   ```bash
   cd api
   ```
2. Install wrangler globally or run via `npx` (included in the setup commands below).
3. Apply the D1 database migrations locally to build your SQLite database schema:
   ```bash
   npx wrangler d1 migrations apply betterme-db --local
   ```
4. Start the backend developer server:
   ```bash
   npx wrangler dev
   ```
   The backend API will start up and run on **`http://localhost:8787`**.

---

### 2. Frontend Setup

1. Open a new terminal tab and navigate to the project's root directory:
   ```bash
   cd ..
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
   The development server will serve the frontend on **`http://localhost:3000`** (using the `serve` package configured in `package.json`).

---

## 🌐 Deployment

### Deploying the Backend API
To deploy the backend API and remote D1 database to Cloudflare:
1. Apply the database migrations to your live production D1 database:
   ```bash
   npx wrangler d1 migrations apply betterme-db --remote
   ```
2. Deploy the Worker script:
   ```bash
   npx wrangler deploy
   ```

### Deploying the Frontend PWA
The static frontend files (`index.html`, `js/`, `css/`, `manifest.json`, `sw.js`) can be hosted on **GitHub Pages**, **Cloudflare Pages**, or any static web hosting provider. Make sure to update the production API endpoint URL inside [js/api.js](file:///C:/projects/betterme-app/js/api.js) to match your deployed Worker URL.
