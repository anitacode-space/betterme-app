let habitsList = [];
const defaultHabits = [];

let appState = {
  currentTab: 'habits',
  tasks: [],
  kpis: []
};

// Date display configuration
function updateHeaderDate() {
  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }
}

// Sync mode badge updater
function updateSyncStatus() {
  setSyncStatusIndicator(!BetterMeAPI.isLocalMode());
}

function setSyncStatusIndicator(synced) {
  const syncIndicator = document.getElementById('sync-indicator');
  const syncText = document.getElementById('sync-text');
  if (!syncIndicator || !syncText) return;
  
  if (synced) {
    syncIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
    syncText.textContent = 'Synced';
  } else {
    syncIndicator.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    syncText.textContent = 'Local Mode';
  }
}

// Core App Initialization
async function initApp() {
  updateHeaderDate();
  updateSyncStatus();
  
  // Retrieve initial data via live API fetch calls
  await fetchHabits();
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Tabs toggle logic
function switchTab(tab) {
  appState.currentTab = tab;
  
  const tabHabits = document.getElementById('tab-habits');
  const tabTodos = document.getElementById('tab-todos');
  const itemInput = document.getElementById('item-input');
  
  if (tab === 'habits') {
    tabHabits.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all bg-white text-stone-800 shadow-sm';
    tabTodos.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all text-stone-500 hover:text-stone-700';
    itemInput.placeholder = 'Add a new daily habit...';
  } else {
    tabTodos.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all bg-white text-stone-800 shadow-sm';
    tabHabits.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all text-stone-500 hover:text-stone-700';
    itemInput.placeholder = 'Add a new to-do task...';
  }
  
  renderList();
}

// Main list rendering engine
function renderList() {
  const container = document.getElementById('list-container');
  if (!container) return;
  
  const filtered = appState.tasks.filter(t => t.type === appState.currentTab);
  
  if (filtered.length === 0) {
    const icon = appState.currentTab === 'habits' ? 'calendar-plus' : 'check-square';
    const text = appState.currentTab === 'habits' 
      ? 'No habits set up for today. Add one below!' 
      : 'Your to-do list is clean! Add a task below.';
      
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-stone-400/80 gap-2">
        <i data-lucide="${icon}" class="w-8 h-8 opacity-60"></i>
        <p class="text-xs font-semibold text-stone-500">${text}</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }
  
  container.innerHTML = filtered.map(item => `
    <div class="habit-item flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200/40 shadow-sm ${item.completed ? 'checked-active' : ''}" data-id="${item.id}">
      <div class="flex items-center gap-3 cursor-pointer flex-1" onclick="toggleItem('${item.id}')">
        <div class="checkbox-box w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 bg-white hover:border-emerald-400'}">
          <i data-lucide="check" class="check-icon w-3.5 h-3.5 stroke-[3] text-white transition-all duration-300 ${item.completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}"></i>
        </div>
        <span class="checked-text text-sm font-semibold text-stone-800 select-none">${item.text}</span>
      </div>
      <button class="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all ml-2" onclick="deleteItem('${item.id}')">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');
  
  if (window.lucide) lucide.createIcons();
}

// Calculate streak based on historical score inputs
function calculateStreak() {
  const kpis = [...appState.kpis].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  
  let checkDate = new Date();
  
  const todayKpi = kpis.find(k => k.date === todayStr);
  if (todayKpi && todayKpi.score >= 50) {
    streak = 1;
  } else {
    // If today is incomplete, verify if yesterday kept the streak going
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  let i = 0;
  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    const record = kpis.find(k => k.date === checkStr);
    
    // A daily score >= 50% keeps the habit streak active
    if (record && record.score >= 50) {
      if (checkStr === todayStr && todayKpi && todayKpi.score >= 50) {
        // Skip adding today again
      } else {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    
    i++;
    if (i > 365) break; // Limit safety boundary
  }
  
  return streak;
}

// Compute progress indicators and save current day metrics
async function updateProgressMetrics() {
  const total = appState.tasks.length;
  const completed = appState.tasks.filter(t => t.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('completion-percentage').textContent = `${percentage}% Done`;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
  document.getElementById('stat-completed').textContent = `${completed}/${total}`;
  document.getElementById('stat-kpi').textContent = percentage;
  
  const todayStr = new Date().toISOString().split('T')[0];
  await BetterMeAPI.saveDailyKpi(percentage, todayStr);
  
  // Fetch fresh KPI logs and update charts
  appState.kpis = await BetterMeAPI.getKpiHistory();
  
  const streak = calculateStreak();
  document.getElementById('stat-streak').textContent = `${streak}d`;

  if (window.updateGrowthChart) {
    window.updateGrowthChart(appState.kpis);
  }
}

// ==========================================
// live Cloudflare Worker API & D1 database integration with LocalStorage Fallback
// ==========================================

async function fetchHabits() {
  try {
    const res = await fetch(`${API_URL}/api/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    appState.tasks = await res.json();
    setSyncStatusIndicator(true);
  } catch (err) {
    console.warn('API error fetching habits, falling back to LocalStorage:', err);
    appState.tasks = JSON.parse(localStorage.getItem('betterme_tasks') || '[]');
    setSyncStatusIndicator(false);
  }
  habitsList = appState.tasks;
  renderList();
  await updateProgressMetrics();
}

async function addHabit(text) {
  const tempItem = {
    id: '_' + Math.random().toString(36).substr(2, 9),
    text: text,
    type: appState.currentTab,
    completed: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tempItem)
    });
    if (!res.ok) throw new Error('Failed to add habit');
    const saved = await res.json();
    setSyncStatusIndicator(true);
    await fetchHabits();
    return saved;
  } catch (err) {
    console.warn('API error adding habit, saving to LocalStorage:', err);
    const localTasks = JSON.parse(localStorage.getItem('betterme_tasks') || '[]');
    localTasks.push(tempItem);
    localStorage.setItem('betterme_tasks', JSON.stringify(localTasks));
    setSyncStatusIndicator(false);
    await fetchHabits();
    return tempItem;
  }
}

async function toggleHabit(id) {
  const item = appState.tasks.find(t => t.id === id);
  if (!item) return;
  
  item.completed = !item.completed;
  
  // Instant visual feedback in-place
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    const checkboxBox = el.querySelector('.checkbox-box');
    const checkIcon = el.querySelector('.check-icon');
    
    if (item.completed) {
      el.classList.add('checked-active');
      if (checkboxBox) {
        checkboxBox.classList.remove('border-stone-300', 'bg-white', 'hover:border-emerald-400');
        checkboxBox.classList.add('bg-emerald-500', 'border-emerald-500');
      }
      if (checkIcon) {
        checkIcon.classList.remove('scale-0', 'opacity-0');
        checkIcon.classList.add('scale-100', 'opacity-100');
      }
    } else {
      el.classList.remove('checked-active');
      if (checkboxBox) {
        checkboxBox.classList.add('border-stone-300', 'bg-white', 'hover:border-emerald-400');
        checkboxBox.classList.remove('bg-emerald-500', 'border-emerald-500');
      }
      if (checkIcon) {
        checkIcon.classList.remove('scale-100', 'opacity-100');
        checkIcon.classList.add('scale-0', 'opacity-0');
      }
    }
  }
  
  try {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to toggle habit');
    setSyncStatusIndicator(true);
    await updateProgressMetrics();
  } catch (err) {
    console.warn('API error toggling habit, saving to LocalStorage:', err);
    const localTasks = JSON.parse(localStorage.getItem('betterme_tasks') || '[]');
    const idx = localTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      localTasks[idx].completed = item.completed;
    } else {
      localTasks.push(item);
    }
    localStorage.setItem('betterme_tasks', JSON.stringify(localTasks));
    setSyncStatusIndicator(false);
    await updateProgressMetrics();
  }
}

async function deleteHabit(id) {
  try {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete habit');
    setSyncStatusIndicator(true);
    await fetchHabits();
  } catch (err) {
    console.warn('API error deleting habit, updating LocalStorage:', err);
    const localTasks = JSON.parse(localStorage.getItem('betterme_tasks') || '[]');
    const filtered = localTasks.filter(t => t.id !== id);
    localStorage.setItem('betterme_tasks', JSON.stringify(filtered));
    setSyncStatusIndicator(false);
    await fetchHabits();
  }
}



// Handle interactive item clicks
async function toggleItem(id) {
  await toggleHabit(id);
}

// Handle delete clicks
async function deleteItem(id) {
  await deleteHabit(id);
}

// Form submit event hook
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('item-input');
  const text = input.value.trim();
  if (!text) return;
  
  input.value = '';
  await addHabit(text);
});

// Helper inputs
function focusInput() {
  const input = document.getElementById('item-input');
  if (input) input.focus();
}

// Register global event hooks
window.switchTab = switchTab;
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.focusInput = focusInput;
window.fetchHabits = fetchHabits;
window.addHabit = addHabit;
window.toggleHabit = toggleHabit;
window.deleteHabit = deleteHabit;

// Start app binding
window.addEventListener('DOMContentLoaded', initApp);
