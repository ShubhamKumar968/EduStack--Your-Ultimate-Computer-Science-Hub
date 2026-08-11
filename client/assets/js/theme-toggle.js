// /assets/js/theme-toggle.js
window.initThemeToggle = function() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const html = document.documentElement;

  // Initialize state from localStorage or OS preference
  const isDarkSaved = localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkSaved) {
    html.classList.add('dark');
    updateToggleUI(true);
  } else {
    html.classList.remove('dark');
    updateToggleUI(false);
  }

  toggle.onclick = function() {
    const popup = document.getElementById('theme-picker-popup');
    if (popup) popup.style.display = 'none';

    const isDark = html.classList.contains('dark');
    const newIsDark = !isDark;
    if (newIsDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    updateToggleUI(newIsDark);
    if (typeof window.syncThemeStyles === 'function') {
      window.syncThemeStyles(newIsDark);
    }
  };

  window.updateThemeToggleUI = updateToggleUI;

  function updateToggleUI(isDark) {
    const thumb = document.getElementById('thumb');
    let thumbIcon = document.getElementById('thumbIcon');

    // Update toggle track background (works for both Tailwind-class and inline-style navs)
    if (toggle) {
      toggle.style.background = isDark ? '#374151' : '#e5e7eb';
    }

    if (thumb) {
      const toggleW = toggle.offsetWidth || 42;
      const thumbW  = thumb.offsetWidth  || 20;
      const offset  = 2;
      const tx = isDark ? (toggleW - thumbW - offset * 2) : 0;
      thumb.style.transform = `translateX(${tx}px)`;

      const iconHtml = isDark
        ? '<i id="thumbIcon" class="fa-solid fa-moon" style="color:#93c5fd;font-size:10px;"></i>'
        : '<i id="thumbIcon" class="fa-solid fa-sun" style="color:#f59e0b;font-size:10px;"></i>';
      if (thumbIcon) {
        thumbIcon.outerHTML = iconHtml;
      } else {
        thumb.innerHTML = iconHtml;
      }
    }
  }
};

// Apply theme ASAP to prevent flash of wrong theme (FOUC)
(function() {
  const isDark = localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

