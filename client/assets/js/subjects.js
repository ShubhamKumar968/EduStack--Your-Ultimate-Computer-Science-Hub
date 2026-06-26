// /assets/js/subjects.js
document.addEventListener('DOMContentLoaded', () => {
  /* ================= SUBJECTS ================= */
  const subjects = [
    {n:"Engineering Mathematics I", sem:1, icon:"book"},
    {n:"Engineering Physics", sem:1, icon:"flask"},
    {n:"Engineering Chemistry", sem:1, icon:"flask"},
    {n:"Basic Electrical Engineering", sem:1, icon:"cpu"},
    {n:"Programming Fundamentals (C)", sem:1, icon:"code"},
    {n:"Engineering Mathematics II", sem:2, icon:"book"},
    {n:"Data Structures", sem:2, icon:"grid"},
    {n:"Digital Logic Design", sem:2, icon:"cpu"},
    {n:"Engineering Mechanics", sem:2, icon:"flask"},
    {n:"Environmental Science", sem:2, icon:"flask"},
    {n:"Discrete Mathematics", sem:3, icon:"book"},
    {n:"DSA in C++ (Advanced)", sem:3, icon:"grid"},
    {n:"Object-Oriented Programming", sem:3, icon:"code"},
    {n:"Computer Organization & Architecture", sem:3, icon:"cpu"},
    {n:"Probability & Statistics", sem:3, icon:"book"},
    {n:"Database Management Systems", sem:4, icon:"db"},
    {n:"Operating Systems", sem:4, icon:"cpu"},
    {n:"Design & Analysis of Algorithms", sem:4, icon:"grid"},
    {n:"Theory of Computation", sem:4, icon:"book"},
    {n:"Microprocessors", sem:4, icon:"cpu"},
    {n:"Computer Networks", sem:5, icon:"net"},
    {n:"Software Engineering", sem:5, icon:"layers"},
    {n:"Compiler Design", sem:5, icon:"code"},
    {n:"Artificial Intelligence", sem:5, icon:"brain"},
    {n:"Web Development", sem:5, icon:"layers"},
    {n:"Machine Learning", sem:6, icon:"brain"},
    {n:"Computer Graphics", sem:6, icon:"layers"},
    {n:"Cryptography & Network Security", sem:6, icon:"shield"},
    {n:"Distributed Systems", sem:6, icon:"net"},
    {n:"Cloud Computing", sem:6, icon:"net"},
    {n:"Big Data Analytics", sem:7, icon:"db"},
    {n:"Natural Language Processing", sem:7, icon:"brain"},
    {n:"Internet of Things", sem:7, icon:"net"},
    {n:"System Design", sem:7, icon:"layers"},
    {n:"Blockchain Technology", sem:7, icon:"shield"},
    {n:"Deep Learning", sem:8, icon:"brain"},
    {n:"Project Management", sem:8, icon:"layers"},
    {n:"Mobile App Development", sem:8, icon:"layers"},
    {n:"Ethical Hacking", sem:8, icon:"shield"},
    {n:"Capstone Project", sem:8, icon:"layers"},
  ];

  const icons = {
    book:'<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20"/>',
    flask:'<path d="M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-10V2"/><path d="M9 2h6M7 14h10"/>',
    cpu:'<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
    code:'<path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/>',
    grid:'<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/>',
    db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    net:'<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7 7.5L10.5 16M17 7.5L13.5 16M7.5 6h9"/>',
    brain:'<path d="M9 2a4 4 0 0 0-4 4 3 3 0 0 0-2 5 3 3 0 0 0 2 5 4 4 0 0 0 4 4M9 2v18M15 2a4 4 0 0 1 4 4 3 3 0 0 1 2 5 3 3 0 0 1-2 5 4 4 0 0 1-4 4M15 2v18"/>',
    shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    layers:'<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>'
  };
  const capIcon = '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5a6 3 0 0012 0v-5"/><path d="M22 10v6"/>';
  const heartIcon = '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>';
  const gradients = ['from-brand to-brand-soft','from-[#ff5f6d] to-brand-deep','from-brand-soft to-brand-light','from-brand-deep to-brand-deeper','from-brand to-brand-light','from-[#ff8a5c] to-brand'];

  const grid = document.getElementById('grid');
  const countLabel = document.getElementById('countLabel');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  let activeSem = 0;
  const favourites = new Set();

  function subjectCard(s, i){
    const rating = (4.5 + (i % 5) / 10).toFixed(1);
    const isFav = favourites.has(s.n);
    const path = window.location.pathname;
    
    // Determine the action buttons based on the page
    let buttonsHtml = '';
    
    if (path.includes('favourite-list.html')) {
      buttonsHtml = `
        <div class="flex gap-2 mb-3">
          <button class="flex-1 py-3 rounded-[10px] bg-[#20c997] text-white font-bold text-[13px] hover:bg-[#1aa179] transition-colors border-0 cursor-pointer flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Book Now
          </button>
          <button onclick="toggleFav('${s.n.replace(/'/g,"\\'")}')" class="flex-1 py-3 rounded-[10px] bg-red-50 dark:bg-red-900/10 text-brand font-bold text-[13px] hover:bg-red-100 transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-trash-can text-xs"></i> Remove
          </button>
        </div>
        <a href="/subject-detail.html?id=${encodeURIComponent(s.n)}" class="w-full block py-3 text-center rounded-[10px] bg-gray-100 dark:bg-[#2e2e2e] font-bold text-gray-700 dark:text-gray-300 text-[13px] hover:bg-gray-200 transition-colors no-underline text-inherit">
          <i class="fa-solid fa-circle-info mr-1"></i> View Full Details
        </a>
      `;
    } else if (path.includes('enrollments.html')) {
      buttonsHtml = `
        <div class="flex items-center justify-between mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div class="flex flex-col">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Remitted</span>
            <span class="font-black text-brand text-lg leading-none">Free</span>
          </div>
          <span class="bg-[#e6f4ea] text-[#137333] border border-[#ceead6] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-[#137333]"></div> Confirmed
          </span>
        </div>
      `;
    } else if (path.includes('subject-list.html')) {
      // 3-button layout for dedicated subject list page
      buttonsHtml = `
        <div class="flex gap-2 mb-2">
          <a href="/subject-detail.html?id=${encodeURIComponent(s.n)}" class="flex-[1.2] py-2.5 text-center rounded-[10px] bg-[#3b82f6] text-white font-bold text-[13px] hover:bg-blue-600 transition-colors no-underline block flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-circle-info text-[11px]"></i> Details
          </a>
          <button onclick="toggleFav('${s.n.replace(/'/g,"\\'")}')" class="flex-1 py-2.5 rounded-[10px] bg-brand text-white font-bold text-[13px] hover:bg-brand-deep transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-heart ${isFav ? 'text-black' : 'text-white'} text-[11px]"></i> ${isFav ? 'Remove' : 'Add'}
          </button>
        </div>
        <button class="w-full py-2.5 rounded-[10px] bg-[#20c997] text-white font-bold text-[13px] hover:bg-[#1aa179] transition-colors border-0 cursor-pointer flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Enroll Now
        </button>
      `;
    } else {
      // Original 2-button layout for index.html demo subjects
      buttonsHtml = `
        <div class="flex gap-2">
          <a href="/subject-detail.html?id=${encodeURIComponent(s.n)}" class="flex-1 py-3 text-center rounded-[10px] border border-gray-200 dark:border-gray-700 font-bold text-[13px] hover:bg-gray-50 dark:hover:bg-[#2e2e2e] transition-colors no-underline text-inherit block">View Details</a>
          <button class="flex-1 py-3 rounded-[10px] bg-brand text-white font-bold text-[13px] hover:bg-brand-deep transition-colors border-0 cursor-pointer">Enroll Free</button>
        </div>
      `;
    }

    // Hide rating and price if on enrollments page since they are replaced
    const isEnrollment = path.includes('enrollments.html');

    return `
    <div class="bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
      <div class="relative aspect-[16/10] flex items-center justify-center bg-gradient-to-br ${gradients[i % gradients.length]} overflow-hidden">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.4" class="w-28 h-28 opacity-15 absolute -bottom-4 -right-4">${icons[s.icon]}</svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" class="w-14 h-14 opacity-95 relative">${icons[s.icon]}</svg>
        ${!isEnrollment ? `
        <button onclick="toggleFav('${s.n.replace(/'/g,"\\'")}')" aria-label="Toggle favourite"
          class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/45 transition-colors border-0 cursor-pointer">
          <svg viewBox="0 0 24 24" fill="${isFav ? '#ff385c' : 'none'}" stroke="white" stroke-width="2" class="w-4 h-4">${heartIcon}</svg>
        </button>
        ` : ''}
      </div>
      <div class="p-5">
        <h3 class="font-extrabold text-[17px] mb-2 truncate">${s.n}</h3>
        <p class="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 dark:text-gray-400 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ff385c" stroke-width="2" class="w-3.5 h-3.5 flex-shrink-0">${capIcon}</svg>
          Semester ${s.sem}
        </p>
        
        ${!isEnrollment ? `
        <div class="flex items-center justify-between mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <span class="font-extrabold text-brand text-[15px]">Free <span class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] tracking-wide">forever</span></span>
          <span class="flex items-center gap-1 bg-[#ffcc4d]/20 text-[#5a4400] dark:text-[#ffcc4d] font-black text-xs px-2.5 py-1 rounded-md border border-[#ffcc4d]/30">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
            ${rating}
          </span>
        </div>
        ` : ''}
        
        ${buttonsHtml}
      </div>
    </div>`;
  }

  function applyFilters(){
    if(!grid) return;
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const list = subjects.filter(s => (activeSem === 0 || s.sem === activeSem) && s.n.toLowerCase().includes(q));
    grid.innerHTML = list.map((s,i) => subjectCard(s,i)).join('');
    if(countLabel) countLabel.textContent = `Showing ${list.length} of ${subjects.length} subjects`;
    if(emptyState) emptyState.classList.toggle('hidden', list.length !== 0);
  }

  const favGrid = document.getElementById('favGrid');

  function renderFavourites(){
    if(!favGrid) return;
    const favList = subjects.filter(s => favourites.has(s.n));
    if (favList.length === 0){
      favGrid.innerHTML = `<p class="col-span-full text-center text-gray-400 dark:text-gray-500 py-10">No favourites yet — tap the heart icon on any subject card to save it here.</p>`;
      return;
    }
    favGrid.innerHTML = favList.map((s,i) => subjectCard(s,i)).join('');
  }

  window.toggleFav = function(name){
    favourites.has(name) ? favourites.delete(name) : favourites.add(name);
    applyFilters();
    renderFavourites();
  };

    document.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSem = parseInt(btn.dataset.sem, 10);
        document.querySelectorAll('.pill').forEach(b => { b.classList.remove('bg-brand','text-white'); b.classList.add('bg-gray-100','dark:bg-[#2e2e2e]'); });
        btn.classList.remove('bg-gray-100','dark:bg-[#2e2e2e]');
        btn.classList.add('bg-brand','text-white');
        applyFilters();
      });
    });

    const demoGrid = document.getElementById('demoGrid');
    if (demoGrid) {
      demoGrid.innerHTML = subjects.slice(0, 6).map((s, i) => subjectCard(s, i)).join('');
    }

  if(searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  applyFilters();
  renderFavourites();

  /* ================= AI TOOLS ================= */
  const aiTools = [
    {
      name: "Claude", sub: "AI assistant by Anthropic",
      favicon: "https://www.google.com/s2/favicons?domain=claude.ai&sz=128",
      link: "https://claude.ai"
    },
    {
      name: "Gemini", sub: "Google's AI assistant",
      favicon: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128",
      link: "https://gemini.google.com"
    },
    {
      name: "ChatGPT", sub: "AI assistant by OpenAI",
      favicon: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128",
      link: "https://chatgpt.com"
    },
    {
      name: "Antigravity IDE", sub: "Agentic IDE by Google",
      favicon: "https://media.licdn.com/dms/image/v2/D560BAQG5wmEaqHfmDg/company-logo_200_200/B56ZqUSJh0I4AM-/0/1763424377586/google_antigravity_logo?e=2147483647&v=beta&t=09EGMp77uIgS77oquLNRli_4mMEV8oGvXklIXLBP6YM",
      link: "https://idx.google.com"
    },
    {
      name: "AI Detector", sub: "Check if text reads as AI-written",
      favicon: "https://www.google.com/s2/favicons?domain=gptzero.me&sz=128",
      link: "https://gptzero.me"
    },
    {
      name: "AI Humanizer", sub: "Rewrite text in a natural tone",
      favicon: "https://www.google.com/s2/favicons?domain=humanizeai.io&sz=128",
      link: "https://www.humanizeai.io"
    }
  ];

  const aiGrid = document.getElementById('aiGrid');
  if(aiGrid) {
    aiGrid.innerHTML = aiTools.map(t => `
      <a href="${t.link}" target="_blank" rel="noopener" class="bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col no-underline text-inherit group">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mb-4 overflow-hidden bg-gray-50 dark:bg-[#2e2e2e]">
          <img src="${t.favicon}" alt="${t.name}" class="w-10 h-10 object-contain">
        </div>
        <h3 class="font-extrabold text-lg mb-1.5 flex items-center justify-between">
          ${t.name}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${t.sub}</p>
        <span class="mt-auto text-sm font-bold text-brand flex items-center gap-1">Open <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>`).join('');
  }

  /* ================= PLACEMENT ================= */
  const placementCategories = [
    {name:"DSA", icon:"grid", subs:["All Patterns","Two Pointer","Sliding Window","Backtracking","Dynamic Programming","Graphs & Trees","Greedy","Binary Search"]},
    {name:"Web Development", icon:"layers", subs:["HTML/CSS/JS Basics","Node & Express","REST API Design","Authentication & JWT","Database Integration"]},
    {name:"CS Fundamentals", icon:"cpu", subs:["Operating Systems","DBMS","Computer Networks","OOPs Concepts"]},
    {name:"Aptitude", icon:"book", subs:["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Data Interpretation"]},
    {name:"System Design", icon:"net", subs:["Low-Level Design","High-Level Design","Case Studies","Scalability Patterns"]},
  ];
  const placementGrid = document.getElementById('placementGrid');
  if(placementGrid) {
    placementGrid.innerHTML = placementCategories.map((c,i) => `
      <div class="bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <button onclick="togglePlacement(${i})" class="w-full flex items-center justify-between p-5 border-0 bg-transparent cursor-pointer text-inherit">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff385c" stroke-width="1.8" class="w-5 h-5">${icons[c.icon]}</svg>
            </span>
            <span class="font-extrabold text-lg">${c.name}</span>
          </div>
          <svg id="chev-${i}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 chev"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div id="panel-${i}" class="hidden px-5 pb-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${c.subs.map(s => `<div class="px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#2e2e2e] text-sm font-semibold text-center hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer">${s}</div>`).join('')}
          </div>
        </div>
      </div>`).join('');
  }

  window.togglePlacement = function(i){
    document.getElementById(`panel-${i}`).classList.toggle('hidden');
    document.getElementById(`chev-${i}`).classList.toggle('rotate-open');
  };

  window.openRazorpayCheckout = function(){
    alert("Razorpay test checkout goes here — wire this up to your backend order endpoint.");
  };

  window.updateMap = function(){
    const loc = document.getElementById('locInput').value.trim();
    if (!loc) return;
    document.getElementById('mapFrame').src = `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&output=embed`;
  };
});
