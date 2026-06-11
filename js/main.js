// ── Theme Switcher Functions for Custom Toggle ───────────────
function applyLightTheme() {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
  const checkbox = document.getElementById('toggle');
  if (checkbox) checkbox.checked = false;
}

function applyDarkTheme() {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
  const checkbox = document.getElementById('toggle');
  if (checkbox) checkbox.checked = true;
}

function toggleDarkMode() {
  const checkbox = document.getElementById('toggle');
  if (checkbox && checkbox.checked) {
    applyDarkTheme();
  } else {
    applyLightTheme();
  }
}

// Sync toggle checkbox state on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const isDark = document.documentElement.classList.contains('dark');
  const checkbox = document.getElementById('toggle');
  if (checkbox) checkbox.checked = isDark;
});

// Sync theme in real-time across open tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    if (e.newValue === 'dark') {
      applyDarkTheme();
    } else {
      applyLightTheme();
    }
  }
});
