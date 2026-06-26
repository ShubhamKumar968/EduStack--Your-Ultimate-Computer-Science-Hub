// /assets/js/theme-toggle.js
window.initThemeToggle = function() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const html = document.documentElement;
  const sunSVG = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#ffb199"/></svg>';
  const moonSVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" fill="#cfd3ff"/></svg>';
  
  // Initialize state from local storage or class
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
    updateToggleUI(true);
  } else {
    html.classList.remove('dark');
    updateToggleUI(false);
  }

  toggle.addEventListener('click', () => {
    const isDark = html.classList.contains('dark');
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateToggleUI(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateToggleUI(true);
    }
  });

  function updateToggleUI(isDark) {
    const thumb = document.getElementById('thumb');
    const thumbIcon = document.getElementById('thumbIcon');
    if (thumb && thumbIcon) {
      thumb.style.transform = isDark ? 'translateX(0px)' : 'translateX(24px)';
      thumbIcon.outerHTML = (isDark ? sunSVG : moonSVG).replace('<svg', '<svg id="thumbIcon" class="w-3.5 h-3.5"');
    }
  }
};

// Check theme as early as possible to avoid FOUC
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
