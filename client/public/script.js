// Configuration
const API_BASE_URL = process.env.API_URL || '/api';

// DOM Elements
const dateInput = document.getElementById('dateInput');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const pairingsContainer = document.getElementById('pairingsContainer');
const themeToggle = document.getElementById('themeToggle');
const exhaustionBar = document.getElementById('exhaustionBar');
const exhaustionText = document.getElementById('exhaustionText');

// Set today's date as default
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// Theme Management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.toggle('dark-mode', savedTheme === 'dark');
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark-mode');
  const currentTheme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
});

// API Functions
async function fetchPairings(date) {
  try {
    const response = await fetch(`${API_BASE_URL}/pairings?date=${date}`);
    const data = await response.json();
    return data.pairings || [];
  } catch (error) {
    console.error('Error fetching pairings:', error);
    showNotification('Error loading pairings', 'error');
    return [];
  }
}

async function generatePairings() {
  const date = dateInput.value;
  if (!date) {
    showNotification('Please select a date', 'warning');
    return;
  }

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    // For demo, use the sample file path
    const response = await fetch(`${API_BASE_URL}/pairings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csvPath: './examples/sample_participants.csv',
        runDate: date,
      }),
    });

    const data = await response.json();
    showNotification(`Generated ${data.count} pairings`, 'success');
    await displayPairings(date);
    exportBtn.disabled = false;
    copyBtn.disabled = false;
  } catch (error) {
    console.error('Error generating pairings:', error);
    showNotification('Error generating pairings', 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Pairings';
  }
}

async function resetPairings() {
  if (!confirm('Are you sure you want to reset all pairings? This cannot be undone.')) {
    return;
  }

  try {
    resetBtn.disabled = true;
    await fetch(`${API_BASE_URL}/pairings/reset`, { method: 'POST' });
    pairingsContainer.innerHTML = '<p class="empty-state">No pairings generated yet. Select a date and click "Generate Pairings".</p>';
    exportBtn.disabled = true;
    copyBtn.disabled = true;
    showNotification('All pairings have been reset', 'success');
    await updateExhaustion();
  } catch (error) {
    console.error('Error resetting pairings:', error);
    showNotification('Error resetting pairings', 'error');
  } finally {
    resetBtn.disabled = false;
  }
}

async function exportPairings() {
  const date = dateInput.value;
  try {
    const response = await fetch(`${API_BASE_URL}/pairings/export?date=${date}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pairings-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('CSV downloaded successfully', 'success');
  } catch (error) {
    console.error('Error exporting pairings:', error);
    showNotification('Error exporting pairings', 'error');
  }
}

async function copyPairingsToClipboard() {
  const date = dateInput.value;
  try {
    const pairings = await fetchPairings(date);
    let text = 'Coffee Chat Pairings\n';
    text += `Date: ${date}\n`;
    text += '='.repeat(50) + '\n\n';

    pairings.forEach((pair, index) => {
      text += `${index + 1}. ${pair.person1} (${pair.department1}) ↔ ${pair.person2} (${pair.department2})\n`;
    });

    await navigator.clipboard.writeText(text);
    showNotification('Pairings copied to clipboard!', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showNotification('Error copying to clipboard', 'error');
  }
}

async function displayPairings(date) {
  const pairings = await fetchPairings(date);

  if (pairings.length === 0) {
    pairingsContainer.innerHTML = '<p class="empty-state">No pairings for this date. Generate new pairings to see them here.</p>';
    return;
  }

  pairingsContainer.innerHTML = pairings
    .map(
      (pair, index) => `
    <div class="pairing-card">
      <div class="person">
        <div class="person-name">${escapeHtml(pair.person1)}</div>
        <div class="person-dept">${escapeHtml(pair.department1)}</div>
      </div>
      <div class="pairing-divider">↔</div>
      <div class="person">
        <div class="person-name">${escapeHtml(pair.person2)}</div>
        <div class="person-dept">${escapeHtml(pair.department2)}</div>
      </div>
    </div>
  `
    )
    .join('');
}

async function updateExhaustion() {
  try {
    const response = await fetch(`${API_BASE_URL}/exhaustion`);
    const data = await response.json();
    const percentage = Math.round(data.exhaustionPercentage);

    exhaustionBar.style.width = `${percentage}%`;
    exhaustionText.textContent = `${percentage}% of pairing combinations exhausted`;
  } catch (error) {
    console.error('Error updating exhaustion:', error);
  }
}

function showNotification(message, type) {
  // Simple notification (can be enhanced with a toast library)
  const color = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  };

  console.log(`[${type.toUpperCase()}] ${message}`);

  // Visual feedback - flash the relevant button
  const button =
    {
      success: generateBtn,
      error: generateBtn,
      warning: dateInput,
    }[type] || generateBtn;

  button.style.borderColor = color[type];
  setTimeout(() => {
    button.style.borderColor = '';
  }, 2000);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Event Listeners
generateBtn.addEventListener('click', generatePairings);
resetBtn.addEventListener('click', resetPairings);
exportBtn.addEventListener('click', exportPairings);
copyBtn.addEventListener('click', copyPairingsToClipboard);

dateInput.addEventListener('change', async () => {
  await displayPairings(dateInput.value);
});

// Initialize
initializeTheme();
updateExhaustion();
displayPairings(today);
