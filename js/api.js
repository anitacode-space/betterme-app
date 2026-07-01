// Cloudflare Worker API Endpoint Configuration
// If empty, the app operates in Local Storage fallback mode
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8787'
  : 'https://betterme-api.betterme-app.workers.dev';

function isLocalMode() {
  return !API_URL;
}

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Local Storage Core Operations
function getLocalTasks() {
  return JSON.parse(localStorage.getItem('betterme_tasks') || '[]');
}

function saveLocalTasks(tasks) {
  localStorage.setItem('betterme_tasks', JSON.stringify(tasks));
}

function getLocalKpis() {
  return JSON.parse(localStorage.getItem('betterme_kpis') || '[]');
}

function saveLocalKpis(kpis) {
  localStorage.setItem('betterme_kpis', JSON.stringify(kpis));
}

// BetterMe API Interface
const BetterMeAPI = {
  isLocalMode: isLocalMode,

  getTasks: async () => {
    if (isLocalMode()) {
      return getLocalTasks();
    }
    try {
      const res = await fetch(`${API_URL}/api/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return await res.json();
    } catch (err) {
      console.warn('API connection failed, loading from LocalStorage instead:', err);
      return getLocalTasks();
    }
  },

  saveTask: async (task) => {
    if (!task.id) {
      task.id = generateId();
    }

    if (isLocalMode()) {
      const tasks = getLocalTasks();
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        tasks[idx] = task;
      } else {
        tasks.push(task);
      }
      saveLocalTasks(tasks);
      return task;
    }

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!res.ok) throw new Error('Failed to save task');
      return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local save:', err);
      const tasks = getLocalTasks();
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        tasks[idx] = task;
      } else {
        tasks.push(task);
      }
      saveLocalTasks(tasks);
      return task;
    }
  },

  deleteTask: async (id) => {
    if (isLocalMode()) {
      const tasks = getLocalTasks();
      const filtered = tasks.filter(t => t.id !== id);
      saveLocalTasks(filtered);
      return true;
    }

    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return true;
    } catch (err) {
      console.warn('API error, falling back to local delete:', err);
      const tasks = getLocalTasks();
      const filtered = tasks.filter(t => t.id !== id);
      saveLocalTasks(filtered);
      return true;
    }
  },

  getKpiHistory: async () => {
    if (isLocalMode()) {
      return getLocalKpis();
    }
    try {
      const res = await fetch(`${API_URL}/api/kpi`);
      if (!res.ok) throw new Error('Failed to fetch KPI history');
      return await res.json();
    } catch (err) {
      console.warn('API connection failed, loading local KPI history:', err);
      return getLocalKpis();
    }
  },

  saveDailyKpi: async (score, dateStr) => {
    const kpiEntry = { date: dateStr, score: score };

    if (isLocalMode()) {
      const kpis = getLocalKpis();
      const idx = kpis.findIndex(k => k.date === dateStr);
      if (idx !== -1) {
        kpis[idx].score = score;
      } else {
        kpis.push(kpiEntry);
      }
      // Sort and truncate historical entries to prevent local storage bloat
      kpis.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (kpis.length > 30) kpis.shift();
      saveLocalKpis(kpis);
      return kpiEntry;
    }

    try {
      const res = await fetch(`${API_URL}/api/kpi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpiEntry)
      });
      if (!res.ok) throw new Error('Failed to save KPI score');
      return await res.json();
    } catch (err) {
      console.warn('API error, caching score to LocalStorage:', err);
      const kpis = getLocalKpis();
      const idx = kpis.findIndex(k => k.date === dateStr);
      if (idx !== -1) {
        kpis[idx].score = score;
      } else {
        kpis.push(kpiEntry);
      }
      kpis.sort((a, b) => new Date(a.date) - new Date(b.date));
      saveLocalKpis(kpis);
      return kpiEntry;
    }
  }
};
