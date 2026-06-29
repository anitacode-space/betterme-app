let growthChartInstance = null;

// Convert date strings to user-friendly weekday labels
function getProcessedChartData(kpiData) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7Days.push({
      dateStr: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }

  const labels = [];
  const values = [];

  last7Days.forEach(day => {
    labels.push(day.label);
    const match = kpiData.find(k => k.date === day.dateStr);
    values.push(match ? match.score : 0);
  });

  return { labels, values };
}

// Calculate trending percentage and update UI badges
function updateGrowthRateBadge(values) {
  const rateBadge = document.getElementById('growth-rate-badge');
  const rateSpan = document.getElementById('growth-rate');
  const indicatorIcon = rateBadge ? rateBadge.querySelector('i') : null;
  
  if (!rateBadge || !rateSpan) return;
  
  const lastVal = values[values.length - 1];
  const previousDays = values.slice(0, -1).filter(v => v > 0);
  
  if (previousDays.length === 0) {
    rateSpan.textContent = 'Steady';
    rateBadge.className = 'flex items-center gap-1 text-stone-500 font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-lg';
    return;
  }
  
  const avg = previousDays.reduce((sum, val) => sum + val, 0) / previousDays.length;
  
  if (avg === 0) {
    if (lastVal > 0) {
      rateSpan.textContent = `+${Math.round(lastVal)}%`;
      rateBadge.className = 'flex items-center gap-1 text-teal-600 font-bold text-xs bg-teal-50 px-2 py-0.5 rounded-lg';
    } else {
      rateSpan.textContent = 'Steady';
      rateBadge.className = 'flex items-center gap-1 text-stone-500 font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-lg';
    }
    return;
  }

  const diff = lastVal - avg;
  const percentage = Math.round((diff / avg) * 100);

  if (diff > 0) {
    rateSpan.textContent = `+${percentage}%`;
    rateBadge.className = 'flex items-center gap-1 text-teal-600 font-bold text-xs bg-teal-50 px-2 py-0.5 rounded-lg';
  } else if (diff < 0) {
    rateSpan.textContent = `${percentage}%`;
    rateBadge.className = 'flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-lg';
  } else {
    rateSpan.textContent = 'Steady';
    rateBadge.className = 'flex items-center gap-1 text-stone-500 font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-lg';
  }
}

// Draw the growth tracker chart
function drawGrowthChart(kpiData) {
  const canvas = document.getElementById('growthChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const processed = getProcessedChartData(kpiData);

  // Gradient fill underneath the growth line
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)'); // Indigo
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

  const config = {
    type: 'line',
    data: {
      labels: processed.labels,
      datasets: [{
        label: 'Growth Index',
        data: processed.values,
        borderColor: '#6366f1',
        borderWidth: 2.5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: '#ffffff',
        tension: 0.35,
        fill: true,
        backgroundColor: gradient,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1c1917',
          titleFont: { family: 'Inter', weight: 'bold', size: 11 },
          bodyFont: { family: 'Inter', size: 11 },
          padding: 8,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Growth KPI: ${Math.round(context.parsed.y)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { family: 'Inter', size: 9 },
            color: '#78716c'
          }
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { family: 'Inter', size: 9 },
            color: '#78716c',
            callback: (val) => `${val}%`
          },
          grid: {
            color: 'rgba(231, 229, 228, 0.6)',
            lineWidth: 0.5
          }
        }
      }
    }
  };

  if (growthChartInstance) {
    growthChartInstance.destroy();
  }
  growthChartInstance = new Chart(ctx, config);
  updateGrowthRateBadge(processed.values);
}

// Exposed update wrapper
window.updateGrowthChart = (kpiData) => {
  drawGrowthChart(kpiData);
};
