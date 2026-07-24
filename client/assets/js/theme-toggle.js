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
    let thumbIcon = document.getElementById('thumbIcon');

    // Update toggle track background (works for both Tailwind-class and inline-style navs)
    if (toggle) {
      toggle.style.background = isDark ? '#374151' : '#e5e7eb';
    }

    if (thumb) {
      // Calculate translate: toggle width (46px) - thumb width (20px) - offset (3px*2) = 20px
      thumb.style.transform = isDark ? 'translateX(20px)' : 'translateX(0px)';
      // Also handle Tailwind-class based toggles (larger)
      const toggleW = toggle.offsetWidth || 46;
      const thumbW  = thumb.offsetWidth  || 20;
      const offset  = 3;
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
