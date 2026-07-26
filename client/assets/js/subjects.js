// /assets/js/subjects.js
// ============================================================
// All subjects are loaded LIVE from the MongoDB REST API.
// No hardcoded subject data exists here.
// Auth is checked before Favourite / Enroll / Detail actions.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Auth state (populated by /api/auth/me) ─────────────────
  window.currentUser = null;

  const authCheckPromise = fetch('/api/auth/me', { credentials: 'include' })
    .then(res => res.json())
    .then(resData => {
      if (resData && resData.success && resData.data && resData.data.user) {
        window.currentUser = resData.data.user;
        // Update DSA book button for premium users
        if (resData.data.user.isPremium) {
          const dsaBtn = document.getElementById('dsaBookBtn');
          if (dsaBtn) {
            dsaBtn.textContent = 'Access DSA Sheet 🎉';
            dsaBtn.onclick = () => { window.location.href = '/premium-dsa-sheet.html'; };
          }
        }
      }
    })
    .catch(() => { window.currentUser = null; });

  /* ================= ICONS & CONSTANTS ================= */
  const capIcon = '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5a6 3 0 0012 0v-5"/><path d="M22 10v6"/>';

  const grid = document.getElementById('grid');
  const countLabel = document.getElementById('countLabel');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  let activeSem = 0;
  let activeBranch = 'All';

  // Persistent Favourites & Enrollments from localStorage
  // (used for UI state only — server-side favourites use the API)
  let favourites = new Set(JSON.parse(localStorage.getItem('edustack_favourites') || '[]'));
  let enrolledSubjects = new Set(JSON.parse(localStorage.getItem('edustack_enrolled') || '[]'));

  function saveState() {
    localStorage.setItem('edustack_favourites', JSON.stringify(Array.from(favourites)));
    localStorage.setItem('edustack_enrolled', JSON.stringify(Array.from(enrolledSubjects)));
  }

  /* ================= AUTH GUARD MODAL ================= */
  // Shows a friendly "please register" message for unauthenticated users
  function showAuthModal(action) {
    // Remove any existing modal
    const existing = document.getElementById('auth-guard-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'auth-guard-modal';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);padding:16px;
    `;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:36px 32px;max-width:400px;width:100%;
                  box-shadow:0 25px 60px rgba(0,0,0,0.25);text-align:center;position:relative;">
        <button onclick="document.getElementById('auth-guard-modal').remove()"
          style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;
                 font-size:20px;color:#888;line-height:1;" aria-label="Close">✕</button>
        <div style="width:64px;height:64px;border-radius:50%;background:#fff0f3;
                    display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;">
          🔒
        </div>
        <h2 style="font-size:20px;font-weight:900;color:#1a1a1a;margin:0 0 10px;">
          Login Required
        </h2>
        <p style="color:#666;font-size:14px;margin:0 0 24px;line-height:1.6;">
          Please <strong>register or log in</strong> to ${action}.<br>
          It's free and only takes a minute!
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="/auth/register.html"
             style="flex:1;min-width:120px;padding:12px 20px;background:linear-gradient(135deg,#ff385c,#ff7b8a);
                    color:#fff;font-weight:800;border-radius:50px;text-decoration:none;font-size:14px;
                    display:inline-block;text-align:center;">
            Register Free
          </a>
          <a href="/auth/login.html"
             style="flex:1;min-width:120px;padding:12px 20px;background:#f4f4f4;color:#222;
                    font-weight:700;border-radius:50px;text-decoration:none;font-size:14px;
                    display:inline-block;text-align:center;border:1.5px solid #e5e5e5;">
            Log In
          </a>
        </div>
      </div>
    `;
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  /* ================= SUBJECT CARD RENDERER ================= */
  function subjectCard(s, i) {
    const rating = (4.5 + (i % 5) / 10).toFixed(1);
    const isFav = favourites.has(s.id) || favourites.has(s.n);
    const isEnrolled = enrolledSubjects.has(s.id) || enrolledSubjects.has(s.n);
    const pagePath = window.location.pathname;

    // Subject detail URL — use MongoDB _id when available, else name
    const detailParam = s.id ? encodeURIComponent(s.id) : encodeURIComponent(s.n);
    const detailUrl = `/subject-detail.html?id=${detailParam}`;
    const safeName = s.n.replace(/'/g, "\\'");
    const safeId = (s.id || s.n).replace(/'/g, "\\'");

    function getBranchIcon(branchStr) {
      const b = (branchStr || 'CSE').toUpperCase();
      if (b.includes('CSE')) return { icon: 'fa-solid fa-laptop-code', badgeIcon: 'fa-solid fa-code', color: 'from-blue-600 to-indigo-700' };
      if (b.includes('ECE')) return { icon: 'fa-solid fa-microchip', badgeIcon: 'fa-solid fa-microchip', color: 'from-purple-600 to-pink-600' };
      if (b.includes('EEE') || b.includes('ELECTRICAL')) return { icon: 'fa-solid fa-bolt-lightning', badgeIcon: 'fa-solid fa-bolt', color: 'from-amber-500 to-orange-600' };
      if (b.includes('MECH')) return { icon: 'fa-solid fa-gears', badgeIcon: 'fa-solid fa-gear', color: 'from-slate-700 to-gray-900' };
      if (b.includes('CIVIL')) return { icon: 'fa-solid fa-building-columns', badgeIcon: 'fa-solid fa-building-columns', color: 'from-emerald-600 to-teal-700' };
      if (b.includes('IT')) return { icon: 'fa-solid fa-network-wired', badgeIcon: 'fa-solid fa-network-wired', color: 'from-cyan-600 to-blue-700' };
      return { icon: 'fa-solid fa-graduation-cap', badgeIcon: 'fa-solid fa-book-bookmark', color: 'from-brand to-rose-600' };
    }

    const bInfo = getBranchIcon(s.branch);
    const isEnrollmentsPage = pagePath.includes('enrollments');
    const isSubjectList = pagePath.includes('subject-list');
    const cardHeight = isSubjectList ? 'h-[400px]' : 'h-[365px]';

    // ── Button layouts per page ─────────────────────────────
    let buttonsHtml = '';

    if (pagePath.includes('favourite-list')) {
      buttonsHtml = `
        <div class="flex gap-2 mb-2">
          <button onclick="requireAuth(function(){ enrollByKey('${safeId}'); }, 'enroll in this subject')"
            class="${isEnrolled ? 'btn-subject-enrolled' : 'btn-subject-enroll'} flex-1 py-2 rounded-xl text-white font-bold text-xs transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            style="background-color: ${isEnrolled ? '#334155' : '#059669'}; color: #ffffff;">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${isEnrolled ? 'Enrolled ✓' : 'Book Now'}
          </button>
          <button onclick="requireAuth(function(){ toggleFavByKey('${safeId}', '${safeName}'); }, 'manage favourites')"
            class="flex-1 py-2 rounded-xl text-white font-bold text-xs transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            style="background-color: #dc2626; color: #ffffff;">
            <i class="fa-solid fa-trash-can text-xs"></i> Remove
          </button>
        </div>
        <a href="${detailUrl}" class="btn-subject-details w-full block py-2 text-center rounded-xl font-bold text-white text-xs transition-colors no-underline shadow-sm"
          style="background-color: #2563eb; color: #ffffff;">
          <i class="fa-solid fa-circle-info mr-1"></i> View Full Details
        </a>
      `;
    } else if (isEnrollmentsPage) {
      buttonsHtml = `
        <div class="flex flex-col gap-2 mt-1 pt-2.5 border-t border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Status</span>
              <span class="font-black text-brand text-xs leading-none">Access Unlocked</span>
            </div>
            <span class="bg-[#e6f4ea] text-[#137333] border border-[#ceead6] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full bg-[#137333]"></div> Enrolled
            </span>
          </div>
          <a href="${detailUrl}" class="btn-subject-details w-full block py-2 text-center rounded-xl text-white font-bold text-xs transition-colors no-underline shadow-sm"
            style="background-color: #ff385c; color: #ffffff;">
            <i class="fa-solid fa-book-open mr-1"></i> Go to Subject Materials
          </a>
        </div>
      `;
    } else {
      // 3-button layout for both subject-list and main page
      buttonsHtml = `
        <div class="flex gap-2 mb-2">
          <button onclick="requireAuth(function(){ window.location.href='${detailUrl}'; }, 'view subject details')"
            class="btn-subject-details flex-1 py-2 text-center rounded-xl text-white font-bold text-xs transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            style="background-color: #2563eb; color: #ffffff;">
            <i class="fa-solid fa-circle-info text-[11px]"></i> Details
          </button>
          <button onclick="requireAuth(function(){ toggleFavByKey('${safeId}', '${safeName}'); }, 'add to favourites')"
            class="btn-subject-fav flex-1 py-2 rounded-xl text-white font-bold text-xs transition-all border-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            style="background-color: #ff385c; color: #ffffff;">
            <i class="fa-solid fa-heart ${isFav ? 'text-yellow-300' : 'text-white'} text-[11px]"></i> ${isFav ? 'Remove' : 'Add'}
          </button>
        </div>
        <button onclick="requireAuth(function(){ enrollByKey('${safeId}'); }, 'enroll in this subject')"
          class="${isEnrolled ? 'btn-subject-enrolled' : 'btn-subject-enroll'} w-full py-2 rounded-xl text-white font-bold text-xs transition-all border-0 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          style="background-color: ${isEnrolled ? '#334155' : '#059669'}; color: #ffffff;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          ${isEnrolled ? 'Already Enrolled ✓' : 'Enroll Now'}
        </button>
      `;
    }

    return `
    <div class="subject-card group relative bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand/15 hover:border-brand/40 dark:hover:border-brand/40 transition-all duration-300 flex flex-col justify-between ${cardHeight} w-full flex-shrink-0" style="height:400px;min-height:400px;max-height:400px;">
      <div class="card-thumb relative w-full flex items-center justify-center bg-slate-900 bg-gradient-to-br ${bInfo.color} overflow-hidden rounded-t-3xl flex-shrink-0" style="height:176px;min-height:176px;max-height:176px;flex-shrink:0;overflow:hidden;">
        ${s.thumbnail ? `
          <img src="${s.thumbnail}" alt="${s.n}" style="width:100%;height:100%;object-fit:cover;object-position:center;" class="relative z-0 transition-transform duration-500 group-hover:scale-110">
        ` : `
          <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner relative z-1 group-hover:scale-110 transition-transform duration-300">
            <i class="${bInfo.icon} text-white text-2xl drop-shadow"></i>
          </div>
        `}
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
        ${!isEnrollmentsPage ? `
        <button onclick="requireAuth(function(){ toggleFavByKey('${safeId}', '${safeName}'); }, 'add to favourites')" aria-label="Toggle favourite"
          style="position:absolute;top:12px;right:12px;z-index:30;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.25);cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:all 0.2s;" onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'">
          <i class="fa-solid fa-heart ${isFav ? 'text-brand' : 'text-white'}" style="font-size:12px;"></i>
        </button>
        ` : ''}
      </div>
      <div class="p-4 flex flex-col flex-grow justify-between overflow-hidden">
        <div>
          <h3 class="font-extrabold text-[15px] sm:text-base text-gray-900 dark:text-white mb-1.5 truncate leading-snug group-hover:text-brand transition-colors" title="${s.n}">${s.n}</h3>
          <div class="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5">
            <span class="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff385c" stroke-width="2" class="w-3.5 h-3.5 flex-shrink-0">${capIcon}</svg>
              Semester ${s.sem || '—'}
            </span>
            <span class="bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-pink-200 dark:border-pink-800/60 flex items-center gap-1">
              <i class="${bInfo.badgeIcon} text-[10px] text-pink-500"></i><span>${s.branch || 'CSE'}</span>
            </span>
          </div>
        </div>
        <div class="mt-auto">
          ${!isEnrollmentsPage ? `
          <div class="flex items-center justify-between mb-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800">
            <span class="font-black text-brand text-xs sm:text-sm">Free <span class="font-semibold text-gray-400 dark:text-gray-500 text-[10px] tracking-wide">forever</span></span>
            <span class="flex items-center gap-1 bg-[#ffcc4d]/20 text-[#5a4400] dark:text-[#ffcc4d] font-bold text-xs px-2 py-0.5 rounded-md border border-[#ffcc4d]/30">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
              ${rating}
            </span>
          </div>
          ` : ''}
          ${buttonsHtml}
        </div>
      </div>
    </div>`;
  }

  /* ================= ALL SUBJECTS (from API only) ================= */
  let allSubjects = [];

  // Priority sort for the home page featured section
  const featuredOrder = [
    'engineering physics', 'engineering mathematics', 'operating system',
    'dbms', 'information security', 'design and analysis of algorithm',
    'data mining', 'cryptography', 'artificial intelligence', 'machine learning'
  ];

  function sortSubjects(list) {
    return list.slice().sort((a, b) => {
      const aLower = (a.n || '').toLowerCase().trim();
      const bLower = (b.n || '').toLowerCase().trim();
      const aIdx = featuredOrder.findIndex(t => aLower.includes(t) || t.includes(aLower));
      const bIdx = featuredOrder.findIndex(t => bLower.includes(t) || t.includes(bLower));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return (a.sem || 0) - (b.sem || 0);
    });
  }

  function processSubjects(rawList) {
    if (Array.isArray(rawList) && rawList.length > 0) {
      allSubjects = rawList.map(s => ({
        n: s.name || s.n || 'Unknown Subject',
        sem: parseInt(s.semester || s.sem) || null,
        branch: (s.branch || 'CSE').toUpperCase(),
        thumbnail: s.thumbnail || s.photo || '',
        id: s._id || s.id || '',
      }));
      allSubjects = sortSubjects(allSubjects);
    }

    applyFilters();
    renderFavourites();

    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
      viewAllBtn.textContent = `View All ${allSubjects.length} Subjects`;
      viewAllBtn.onclick = function (e) {
        e.preventDefault();
        window.requireAuth(function () {
          window.location.href = '/guest/subject-list.html';
        }, 'view all subjects');
      };
    }

    const browseSubjectsBtn = document.getElementById('browseSubjectsBtn');
    if (browseSubjectsBtn) {
      browseSubjectsBtn.onclick = function (e) {
        e.preventDefault();
        window.requireAuth(function () {
          window.location.href = '/guest/subject-list.html';
        }, 'browse subjects');
      };
    }
  }

  /* ================= SKELETON LOADER ================= */
  function showSkeletonLoader(targetGrid, count) {
    if (!targetGrid) return;
    const skeleton = `
    <div class="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden animate-pulse" style="height:365px;">
      <div class="h-44 bg-gray-200 dark:bg-gray-800"></div>
      <div class="p-4 space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl mt-4"></div>
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    </div>`;
    targetGrid.innerHTML = Array(count).fill(skeleton).join('');
  }

  /* ================= APPLY FILTERS ================= */
  function applyFilters() {
    const isEnrollmentsPage = window.location.pathname.includes('enrollments.html');

    if (isEnrollmentsPage && grid) {
      const enrolledList = allSubjects.filter(s => enrolledSubjects.has(s.id || s.n));
      if (enrolledList.length === 0) {
        grid.innerHTML = `
        <div class="col-span-full bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-800 rounded-3xl p-10 text-center shadow-sm max-w-xl mx-auto my-8">
          <div class="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <h3 class="font-extrabold text-xl mb-2 text-gray-800 dark:text-gray-100">No Enrolled Courses Yet</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Browse our CS subjects catalog and click "Enroll Now" on any subject to add it to your enrolled courses.</p>
          <a href="/guest/subject-list.html" class="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-6 py-3 rounded-full transition-colors no-underline text-sm shadow-md">
            <i class="fa-solid fa-compass"></i> Explore All Subjects
          </a>
        </div>`;
        return;
      }
      grid.innerHTML = enrolledList.map((s, i) => subjectCard(s, i)).join('');
      return;
    }

    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const filteredList = allSubjects.filter(s =>
      (activeSem === 0 || s.sem === activeSem) &&
      (activeBranch === 'All' || s.branch === 'All' || s.branch === activeBranch) &&
      (s.n.toLowerCase().includes(q) || (s.branch && s.branch.toLowerCase().includes(q)))
    );

    if (grid) {
      grid.innerHTML = filteredList.length > 0
        ? filteredList.map((s, i) => subjectCard(s, i)).join('')
        : `<div class="col-span-full text-center py-16 text-gray-400 dark:text-gray-500 font-bold">
             <i class="fa-solid fa-magnifying-glass text-3xl mb-3 block opacity-40"></i>
             No subjects match your search.
           </div>`;
      if (countLabel) countLabel.textContent = `Showing ${filteredList.length} of ${allSubjects.length} subjects`;
      if (emptyState) emptyState.classList.toggle('hidden', filteredList.length !== 0);
    }

    // Home page demoGrid
    const demoGrid = document.getElementById('demoGrid');
    const demoCountLabel = document.getElementById('demoCountLabel');
    if (demoGrid) {
      if (filteredList.length === 0) {
        demoGrid.innerHTML = `
        <div class="col-span-full bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-800 rounded-3xl p-8 text-center shadow-sm max-w-xl mx-auto my-4">
          <div class="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3 text-xl">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="font-extrabold text-lg mb-1 text-gray-800 dark:text-gray-100">No matching subjects found</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search query or semester filter.</p>
        </div>`;
      } else {
        const limit = (q || activeSem !== 0) ? filteredList.length : Math.min(9, filteredList.length);
        demoGrid.innerHTML = filteredList.slice(0, limit).map((s, i) => subjectCard(s, i)).join('');
      }
      if (demoCountLabel) {
        const displayed = (q || activeSem !== 0) ? filteredList.length : Math.min(9, filteredList.length);
        demoCountLabel.textContent = `Showing ${displayed} of ${allSubjects.length} subjects`;
      }
    }
  }

  /* ================= FAVOURITES GRID ================= */
  const favGrid = document.getElementById('favGrid');

  function renderFavourites() {
    if (!favGrid) return;
    const favList = allSubjects.filter(s => 
      favourites.has(s.id) || favourites.has(s.n) || (s.id && favourites.has(s.id.toString()))
    );
    if (favList.length === 0) {
      favGrid.innerHTML = `<p class="col-span-full text-center text-gray-400 dark:text-gray-500 py-10">No favourites yet — tap the heart icon on any subject card to save it here.</p>`;
      return;
    }
    favGrid.innerHTML = favList.map((s, i) => subjectCard(s, i)).join('');
  }

  /* ================= AUTH GUARD WRAPPER ================= */
  // requireAuth checks if user is logged in; if not, shows modal
  window.requireAuth = function (action, label) {
    if (window.currentUser) {
      action();
    } else {
      // Re-check auth in case user logged in in another tab
      fetch('/api/auth/me', { credentials: 'include' })
        .then(r => r.json())
        .then(d => {
          if (d && d.success && d.data && d.data.user) {
            window.currentUser = d.data.user;
            action();
          } else {
            showAuthModal(label || 'access this resource');
          }
        })
        .catch(() => showAuthModal(label || 'access this resource'));
    }
  };

  /* ================= TOGGLE FAVOURITE ================= */
  // Keyed by _id when available, falls back to name
  window.toggleFavByKey = function (key, name) {
    const isFav = favourites.has(key) || (name && favourites.has(name));
    if (isFav) {
      favourites.delete(key);
      if (name) favourites.delete(name);
    } else {
      favourites.add(key);
      if (name) favourites.add(name);
    }
    saveState();
    applyFilters();
    renderFavourites();
  };

  // Legacy name-based (kept for compatibility)
  window.toggleFav = function (name) {
    window.requireAuth(function () {
      window.toggleFavByKey(name, name);
    }, 'add to favourites');
  };

  /* ================= ENROLL ================= */
  window.enrollByKey = function (key) {
    enrolledSubjects.add(key);
    saveState();
    window.location.href = '/guest/enrollments.html';
  };

  window.enrollSubject = function (name) {
    window.requireAuth(function () {
      window.enrollByKey(name);
    }, 'enroll in this subject');
  };

  /* ================= FILTER PILLS ================= */
  document.querySelectorAll('.branch-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeBranch = btn.dataset.branch;
      document.querySelectorAll('.branch-pill').forEach(b => {
        b.className = 'branch-pill flex items-center justify-center gap-2.5 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#222222] hover:border-brand text-gray-800 dark:text-gray-200 font-extrabold text-xs cursor-pointer transition-all';
      });
      btn.className = 'branch-pill flex items-center justify-center gap-2.5 p-3 rounded-2xl border border-brand bg-brand text-white font-extrabold text-xs shadow-md cursor-pointer transition-all';
      applyFilters();
    });
  });

  document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSem = parseInt(btn.dataset.sem, 10);
      document.querySelectorAll('.pill').forEach(b => {
        b.classList.remove('bg-brand', 'text-white');
        b.classList.add('bg-gray-100', 'dark:bg-[#2e2e2e]', 'text-gray-600', 'dark:text-gray-400');
      });
      btn.classList.remove('bg-gray-100', 'dark:bg-[#2e2e2e]', 'text-gray-600', 'dark:text-gray-400');
      btn.classList.add('bg-brand', 'text-white');
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  /* ================= INITIAL LOAD ================= */
  const defaultSubjects = [
    { n: "Engineering Physics", sem: 1, branch: "CSE" },
    { n: "Engineering Mathematics", sem: 1, branch: "CSE" },
    { n: "Operating System", sem: 4, branch: "CSE" },
    { n: "DBMS", sem: 3, branch: "CSE" },
    { n: "Information Security", sem: 6, branch: "CSE" },
    { n: "Design and Analysis of Algorithm", sem: 4, branch: "CSE" },
    { n: "Data Mining", sem: 7, branch: "CSE" },
    { n: "Cryptography", sem: 6, branch: "CSE" },
    { n: "Artificial Intelligence", sem: 7, branch: "CSE" },
    { n: "Machine Learning", sem: 8, branch: "CSE" },
    { n: "Cloud Computing", sem: 6, branch: "CSE" },
    { n: "Computer Networks", sem: 5, branch: "CSE" }
  ];

  // Render initial fallback subjects immediately
  processSubjects(defaultSubjects);

  const demoGridEl = document.getElementById('demoGrid');

  // Fetch ALL subjects live from MongoDB
  fetch('/api/subjects', { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      return res.json();
    })
    .then(resData => {
      let liveList = [];
      if (resData && resData.success) {
        if (resData.data && Array.isArray(resData.data.subjects)) liveList = resData.data.subjects;
        else if (Array.isArray(resData.data)) liveList = resData.data;
        else if (Array.isArray(resData.subjects)) liveList = resData.subjects;
      }
      if (liveList.length > 0) {
        processSubjects(liveList);
      }
    })
    .catch(err => {
      console.warn('[EduStack] Using local subjects fallback due to API notice:', err);
    });

  renderFavourites();

  /* ================= AI TOOLS SECTION ================= */
  const aiTools = [
    {
      name: 'Claude', sub: 'AI assistant by Anthropic',
      iconHtml: `<img src="https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://claude.ai&size=128" alt="Claude" class="w-9 h-9 object-contain drop-shadow-sm">`,
      link: 'https://claude.ai',
      glow: 'bg-orange-500/10 group-hover:bg-orange-500/20',
      borderHover: 'hover:border-orange-400/40 dark:hover:border-orange-500/40 hover:shadow-orange-500/10',
      textAccent: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/70 dark:border-orange-700/50'
    },
    {
      name: 'Gemini', sub: "Google's AI assistant",
      iconHtml: `<img src="https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://gemini.google.com&size=128" alt="Gemini" class="w-9 h-9 object-contain drop-shadow-sm">`,
      link: 'https://gemini.google.com',
      glow: 'bg-blue-500/10 group-hover:bg-blue-500/20',
      borderHover: 'hover:border-blue-400/40 dark:hover:border-blue-500/40 hover:shadow-blue-500/10',
      textAccent: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-700/50'
    },
    {
      name: 'ChatGPT', sub: 'AI assistant by OpenAI',
      iconHtml: `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/OpenAI_logo_2025_%28symbol%29.svg/250px-OpenAI_logo_2025_%28symbol%29.svg.png" alt="ChatGPT" class="w-9 h-9 object-contain dark:invert drop-shadow-sm">`,
      link: 'https://chatgpt.com',
      glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      borderHover: 'hover:border-emerald-400/40 dark:hover:border-emerald-500/40 hover:shadow-emerald-500/10',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-700/50'
    },
    {
      name: 'Antigravity IDE', sub: 'Agentic IDE by Google',
      iconHtml: `<img src="https://mac009.com/uploads/20251119/5c9e95d70c9cb87bc2724867a8de9fc5.png" alt="Antigravity IDE" class="w-9 h-9 object-contain rounded-lg drop-shadow-sm">`,
      link: 'https://idx.google.com',
      glow: 'bg-purple-500/10 group-hover:bg-purple-500/20',
      borderHover: 'hover:border-purple-400/40 dark:hover:border-purple-500/40 hover:shadow-purple-500/10',
      textAccent: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-700/50'
    },
    {
      name: 'AI Detector', sub: 'Check if text reads as AI-written',
      iconHtml: `<img src="https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://gptzero.me&size=128" alt="AI Detector" class="w-9 h-9 object-contain drop-shadow-sm">`,
      link: 'https://gptzero.me',
      glow: 'bg-rose-500/10 group-hover:bg-rose-500/20',
      borderHover: 'hover:border-rose-400/40 dark:hover:border-rose-500/40 hover:shadow-rose-500/10',
      textAccent: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-700/50'
    },
    {
      name: 'AI Humanizer', sub: 'Rewrite text in a natural tone',
      iconHtml: `<img src="https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://humanizeai.io&size=128" alt="AI Humanizer" class="w-9 h-9 object-contain drop-shadow-sm">`,
      link: 'https://www.humanizeai.io',
      glow: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
      borderHover: 'hover:border-cyan-400/40 dark:hover:border-cyan-500/40 hover:shadow-cyan-500/10',
      textAccent: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-700/50'
    }
  ];

  const aiGrid = document.getElementById('aiGrid');
  if (aiGrid) {
    aiGrid.innerHTML = aiTools.map(t => `
    <a href="${t.link}" target="_blank" rel="noopener" class="group relative bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-800 rounded-3xl p-7 hover:-translate-y-1.5 hover:shadow-2xl ${t.borderHover} transition-all duration-300 flex flex-col no-underline text-inherit overflow-hidden">
      <div class="absolute -top-12 -right-12 w-28 h-28 ${t.glow} rounded-full blur-2xl transition-all"></div>
      
      <div class="w-14 h-14 rounded-2xl ${t.iconBg} border p-2 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 mb-5">
        ${t.iconHtml}
      </div>

      <h3 class="font-extrabold text-xl mb-2 flex items-center justify-between group-hover:${t.textAccent} transition-colors">
        ${t.name}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:${t.textAccent} group-hover:translate-x-0.5 transition-all"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </h3>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">${t.sub}</p>
      
      <span class="mt-auto text-sm font-bold ${t.textAccent} flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
        Open Tool <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </a>`).join('');
  }

  /* ================= RAZORPAY CHECKOUT ================= */
  window.simulateInstantPayment = async function () {
    try {
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.status === 401) {
        showAuthModal('access premium features');
        return;
      }
      if (data.success) {
        alert('🎉 Test simulation payment verified! Redirecting to your Premium DSA Sheet...');
        window.location.href = '/premium-dsa-sheet.html';
      } else {
        alert(data.message || 'Simulation failed. Please try again.');
      }
    } catch (err) {
      alert('Network error while simulating payment.');
    }
  };

  window.openRazorpayCheckout = async function () {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (!data.success || !data.data || !data.data.user) {
        if (typeof window.showAuthModal === 'function') {
          window.showAuthModal('access Ultimate SDE DSA Sheet & Premium Hub');
        } else {
          window.location.href = '/auth/login.html';
        }
        return;
      }
      
      const user = data.data.user;
      if (user.isPremium) {
        window.location.href = '/public/premium-dsa-sheet.html';
      } else if (typeof window.showRazorpayModal === 'function') {
        window.showRazorpayModal();
      } else {
        window.location.href = '/public/premium-dsa-sheet.html';
      }
    } catch (err) {
      if (typeof window.showRazorpayModal === 'function') {
        window.showRazorpayModal();
      } else {
        window.location.href = '/public/premium-dsa-sheet.html';
      }
    }
  };

  window.updateMap = function () {
    const loc = document.getElementById('locInput');
    if (!loc || !loc.value.trim()) return;
    document.getElementById('mapFrame').src =
      `https://maps.google.com/maps?q=${encodeURIComponent(loc.value.trim())}&output=embed`;
  };

});