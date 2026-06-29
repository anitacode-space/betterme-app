# BetterMe Application Plan

Welcome to the **BetterMe** development plan! This document outlines the step-by-step strategy for building your ultra-modern, mobile-first PWA with a robust Cloudflare Worker backend.

## 1. Project Architecture & File Structure
We will divide the project into two main components: the static frontend (deployed on GitHub Pages) and the backend API (deployed on Cloudflare Workers).

```text
betterme-app/
├── index.html          # Main UI layout
├── css/
│   └── styles.css      # Custom styles (glassmorphism, animations) overriding Tailwind
├── js/
│   ├── app.js          # Core frontend logic (Habit & To-Do management)
│   ├── api.js          # Cloudflare Worker API integration
│   ├── charts.js       # KPI tracking visualization (using Chart.js via CDN)
│   └── pwa.js          # Service Worker registration logic
├── manifest.json       # Web App Manifest for PWA installation
├── sw.js               # Service Worker for offline caching & basic PWA features
├── assets/
│   ├── icons/          # PWA icons (192x192, 512x512, etc.)
│   └── favicon.ico
└── api/                # Cloudflare Worker backend
    ├── src/
    │   └── index.js    # Worker API routing and database logic
    └── wrangler.toml   # Cloudflare deployment configuration
```

## 2. Phase 1: Frontend & UI/UX Development
- **Setup & Boilerplate**: Create the HTML scaffolding, importing Tailwind CSS and Chart.js via CDN.
- **Design System**: Establish a soft, minimal aesthetic. We'll use tailored HSL colors, soft shadows, and clean Google Fonts (e.g., *Inter* or *Outfit*) to create a focused, premium feel. 
- **Layout Construction**: Implement a mobile-first responsive layout consisting of:
  - A header with the current date and "BetterMe" branding.
  - A Daily Habit / To-Do section with interactive checkboxes.
  - A visual dashboard section for the KPI Growth Tracker.
- **Micro-Animations**: Add CSS transitions for task completion, hover effects on buttons, and smooth scrolling to make the app feel alive and responsive.

## 3. Phase 2: Core JavaScript Logic
- **State Management**: Create local state handlers to manage habit lists and daily completion scores.
- **DOM Updates**: Wire up the "Add Task", "Check Task", and "Delete Task" functionalities in `app.js`.
- **Chart Integration**: Use Chart.js in `charts.js` to render beautiful, responsive line or bar charts representing the user's daily progress and KPI score.

## 4. Phase 3: Progressive Web App (PWA) Features
- **Manifest File**: Create `manifest.json` defining the app's name, theme colors, display mode (`standalone`), and required icon paths.
- **Service Worker**: Implement a basic caching strategy in `sw.js` to allow the app shell to load fast and ensure the "Add to Home Screen" prompt can be triggered by mobile browsers.

## 5. Phase 4: Backend API (Cloudflare Workers + D1)
- **Worker Initialization**: Use Wrangler to initialize a new Cloudflare Worker inside the `/api` directory.
- **Database Selection (D1)**: We will use Cloudflare D1 (Serverless SQLite) instead of KV. While KV is great for simple key-values, D1 allows us to properly query historical KPI data over time, which is essential for rendering our growth charts.
- **API Endpoints**:
  - `GET /api/tasks` - Fetch current tasks.
  - `POST /api/tasks` - Add a new task or update task status.
  - `DELETE /api/tasks/:id` - Delete a task.
  - `GET /api/kpi` - Fetch historical scores for the chart.
- **CORS Setup**: Ensure the Worker includes proper CORS headers so GitHub Pages can securely communicate with it.

## 6. Phase 5: Integration & Deployment
- **API Integration**: Update `api.js` to replace local placeholder data with real API calls using `fetch()`.
- **GitHub Pages Deployment**: Commit the static frontend files and push them to a GitHub repository, enabling GitHub Pages on the `main` branch.
- **Cloudflare Deployment**: Deploy the API worker and run database migrations using `npx wrangler deploy`.
