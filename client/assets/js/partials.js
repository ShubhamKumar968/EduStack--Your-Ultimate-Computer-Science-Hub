// /assets/js/partials.js
document.addEventListener('DOMContentLoaded', () => {
  try {
    const path = window.location.pathname;
    const isSubfolder = path.includes('/auth/') || path.includes('/guest/') || path.includes('/admin/');
    const base = isSubfolder ? '../' : './';
    
    const isGuest = path.includes('/guest/');
    const isAdmin = path.includes('/admin/');

    // Inject Head
    const headHtml = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    `;
    document.head.insertAdjacentHTML('beforeend', headHtml);

    // Helper for active nav states
    const getNavItem = (href, icon, label, targetStr) => {
      const isActive = path.includes(targetStr);
      const linkClass = isActive 
        ? "flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline bg-gray-100 dark:bg-[#222222] text-brand"
        : "flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline hover:bg-gray-50 dark:hover:bg-[#222222] text-gray-700 dark:text-gray-300";
      const iconClass = isActive ? "text-brand" : "text-gray-400";
      return `
            <li>
              <a href="${base}${href}" class="${linkClass}">
                <i class="${icon} ${iconClass}"></i> ${label}
              </a>
            </li>`;
    };

    // Inject Nav
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
      const navHtml = `
        <nav class="flex items-center justify-between px-6 md:px-12 py-4 border-b border-gray-100 dark:border-gray-800 relative z-50">
          <a href="${base}index.html" class="flex items-center gap-2.5 no-underline text-inherit">
            <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand to-brand-soft flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5">
                <rect x="3" y="15" width="18" height="4" rx="1.5" fill="white"/>
                <rect x="5" y="9" width="14" height="4" rx="1.5" fill="white" opacity="0.85"/>
                <rect x="7" y="3" width="10" height="4" rx="1.5" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <div class="flex flex-col justify-center">
              <div class="text-xl font-extrabold tracking-tight leading-none">Edu<span class="text-brand">Stack</span></div>
              <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Pushing knowledge, Popping success.</span>
            </div>
          </a>
          
          <ul class="hidden md:flex items-center gap-2 list-none text-[15px] font-bold">
            ${isGuest ? `
            ${getNavItem('guest/subject-list.html', 'fa-solid fa-list-ul', 'Subject-list', 'guest/subject-list')}
            ${getNavItem('guest/favourite-list.html', 'fa-solid fa-heart', 'Favourites', 'guest/favourite-list')}
            ${getNavItem('guest/enrollments.html', 'fa-solid fa-calendar-check', 'Enrollments', 'guest/enrollments')}
            ` : isAdmin ? `
            ${getNavItem('admin/subject-list.html', 'fa-solid fa-list-ul', 'Subject-list', 'admin/subject-list')}
            ${getNavItem('admin/host-subjects.html', 'fa-solid fa-house', 'Host Subjects', 'admin/host-subjects')}
            ${getNavItem('admin/add-subject.html', 'fa-solid fa-circle-plus', 'Add Subject', 'admin/add-subject')}
            ` : `
            <li>
              <a href="${base}index.html#resources" class="nav-link-hash flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline hover:bg-gray-50 dark:hover:bg-[#222222] text-gray-700 dark:text-gray-300" data-hash="#resources">
                <i class="fa-solid fa-folder-open text-gray-400"></i> Resources
              </a>
            </li>
            <li>
              <a href="${base}index.html#ai-tools" class="nav-link-hash flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline hover:bg-gray-50 dark:hover:bg-[#222222] text-gray-700 dark:text-gray-300" data-hash="#ai-tools">
                <i class="fa-solid fa-robot text-gray-400"></i> AI Tools
              </a>
            </li>
            <li>
              <a href="${base}index.html#placement" class="nav-link-hash flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline hover:bg-gray-50 dark:hover:bg-[#222222] text-gray-700 dark:text-gray-300" data-hash="#placement">
                <i class="fa-solid fa-briefcase text-gray-400"></i> Placement
              </a>
            </li>
            <li>
              <a href="${base}index.html#about" class="nav-link-hash flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline hover:bg-gray-50 dark:hover:bg-[#222222] text-gray-700 dark:text-gray-300" data-hash="#about">
                <i class="fa-solid fa-circle-info text-gray-400"></i> About
              </a>
            </li>
            `}
          </ul>

          <div class="flex items-center gap-3 md:gap-5">
            <button id="themeToggle" aria-label="Toggle dark mode" class="w-[52px] h-7 rounded-full bg-gray-200 dark:bg-gray-700 relative flex-shrink-0">
              <span id="thumb" class="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white dark:bg-[#1a1a1a] shadow flex items-center justify-center transition-all duration-300">
                <svg id="thumbIcon" viewBox="0 0 24 24" fill="none" class="w-3.5 h-3.5"><circle cx="12" cy="12" r="5" fill="#ffb199"/></svg>
              </span>
            </button>
            
            ${(isGuest || isAdmin) ? `
            <div class="relative group">
              <div class="flex items-center gap-2.5 px-2 py-1.5 pr-3 border border-gray-200 dark:border-gray-700 rounded-full hover:shadow-md transition-all cursor-pointer bg-gray-50 dark:bg-[#1a1a1a]">
                <div class="w-[34px] h-[34px] rounded-full overflow-hidden">
                  <img src="https://ui-avatars.com/api/?name=${isAdmin ? 'Shubham+Kumar' : 'Aman+Kumar'}&background=14b8a6&color=fff&bold=true" alt="Avatar" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col justify-center">
                  <span class="text-[13px] font-bold leading-none text-gray-900 dark:text-white mb-[3px]">${isAdmin ? 'Shubham Kumar' : 'Aman Kumar'}</span>
                  <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider leading-none">${isAdmin ? 'HOST' : 'GUEST'}</span>
                </div>
                <i class="fa-solid fa-chevron-down text-[10px] text-gray-400 ml-1"></i>
              </div>
              
              <!-- Dropdown Menu -->
              <div class="absolute right-0 top-[120%] w-60 bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100">
                <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Logged in as</p>
                  <p class="text-[13px] font-bold text-gray-800 dark:text-gray-200 truncate">${isAdmin ? 'shubham.host@edustack.com' : 'aman.guest@edustack.com'}</p>
                </div>
                <div class="p-2 space-y-1">
                  <a href="#" class="flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors no-underline">
                    <i class="fa-solid fa-user-pen w-4 text-center"></i> Edit Profile
                  </a>
                  <a href="${base}index.html" class="flex items-center gap-3 px-4 py-2.5 text-[14px] font-black text-brand hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors no-underline">
                    <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log Out
                  </a>
                </div>
              </div>
            </div>
            ` : `
            <a href="${base}auth/login.html" class="hidden sm:flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-brand transition-colors no-underline">
              <i class="fa-solid fa-arrow-right-to-bracket text-gray-400"></i>
              Login
            </a>
            <a href="${base}auth/register.html" class="flex items-center gap-1.5 text-[15px] font-bold text-white bg-brand px-6 py-2.5 rounded-full hover:bg-brand-deep transition-colors shadow-sm no-underline">
              <i class="fa-solid fa-user-plus text-sm"></i>
              Sign Up
            </a>
            `}
          </div>
        </nav>
      `;
      navPlaceholder.innerHTML = navHtml;
      
      // Handle hash based active states for index page nav
      if (!isGuest && !isAdmin) {
        const updateHashNav = () => {
          const currentHash = window.location.hash;
          document.querySelectorAll('.nav-link-hash').forEach(link => {
            const icon = link.querySelector('i');
            if (currentHash && link.getAttribute('data-hash') === currentHash) {
              link.className = "nav-link-hash flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline bg-gray-100 dark:bg-[#222222] text-brand";
              if (icon) {
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-brand');
              }
            } else {
              link.className = "nav-link-hash flex items-center gap-2 px-4 py-2 rounded-full transition-colors no-underline hover:bg-gray-50 dark:hover:bg-[#222222] text-gray-700 dark:text-gray-300";
              if (icon) {
                icon.classList.remove('text-brand');
                icon.classList.add('text-gray-400');
              }
            }
          });
        };
        
        window.addEventListener('hashchange', updateHashNav);
        document.querySelectorAll('.nav-link-hash').forEach(link => {
          link.addEventListener('click', () => {
            setTimeout(updateHashNav, 10);
          });
        });
        updateHashNav();
      }

      // Re-attach theme toggle listener after injecting nav
      if (window.initThemeToggle) {
        window.initThemeToggle();
      }
    }
  } catch (error) {
    console.error('Error loading partials:', error);
  }
});
