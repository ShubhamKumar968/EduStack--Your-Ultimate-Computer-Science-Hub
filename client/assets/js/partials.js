window.triggerEduStackAIAssistant = function() {
  const aiSection = document.getElementById('ai-tools');
  if (aiSection) {
    aiSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    const isSubfolder = window.location.pathname.includes('/public/') || 
                        window.location.pathname.includes('/auth/') || 
                        window.location.pathname.includes('/guest/') || 
                        window.location.pathname.includes('/admin/');
    const redirectUrl = (isSubfolder ? '/' : './') + 'index.html#ai-tools';
    window.location.href = redirectUrl;
  }
};

window.showAuthModal = function(action) {
  const existing = document.getElementById('auth-guard-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'auth-guard-modal';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);padding:16px;
  `;
  overlay.innerHTML = `
    <div style="background:linear-gradient(to bottom, #ffffff, #f9fafb);border-radius:28px;padding:36px 32px;max-width:400px;width:100%;
                box-shadow:0 25px 60px rgba(0,0,0,0.3);text-align:center;position:relative;border:1px solid #f3f4f6;" class="dark:bg-[#222222] dark:border-gray-800">
      <button onclick="document.getElementById('auth-guard-modal').remove()"
        style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;
               font-size:20px;color:#888;line-height:1;" aria-label="Close">✕</button>
      <div style="width:68px;height:68px;border-radius:50%;background:#fff0f3;
                  display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:30px;box-shadow:0 4px 12px rgba(255,56,92,0.15);">
        🔒
      </div>
      <h2 style="font-size:22px;font-weight:900;color:#111;margin:0 0 10px;" class="dark:text-white">
        Login Required
      </h2>
      <p style="color:#666;font-size:13.5px;margin:0 0 24px;line-height:1.6;" class="dark:text-gray-300">
        Please <strong>log in or sign up</strong> to ${action || 'access this feature'}.<br>
        It's 100% free for all students!
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/auth/login.html"
          style="background:#ff385c;color:#fff;font-weight:800;padding:12px 24px;border-radius:50px;
                 text-decoration:none;font-size:13px;box-shadow:0 4px 15px rgba(255,56,92,0.35);">
          Login Now
        </a>
        <a href="/auth/register.html"
          style="background:#111;color:#fff;font-weight:800;padding:12px 24px;border-radius:50px;
                 text-decoration:none;font-size:13px;" class="dark:bg-gray-800">
          Sign Up Free
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

window.requireAuth = function(action, label) {
  if (window.currentUser) {
    action();
  } else {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d && d.success && d.data && d.data.user) {
          window.currentUser = d.data.user;
          action();
        } else {
          window.showAuthModal(label || 'access this feature');
        }
      })
      .catch(() => window.showAuthModal(label || 'access this feature'));
  }
};
window.showToast = function(message, type = 'info', duration = 4000) {
  if (!message) return;
  
  let container = document.getElementById('edustack-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'edustack-toast-container';
    container.className = 'fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4';
    document.body.appendChild(container);
  }

  const isError = type === 'error' || message.includes('❌') || message.includes('⛔') || message.includes('failed') || message.includes('Error');
  const isSuccess = type === 'success' || message.includes('🎉') || message.includes('✅') || message.includes('success') || message.includes('Congratulations');

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-x-12 opacity-0 backdrop-blur-md ${
    isError 
      ? 'bg-red-900/90 text-white border-red-700/50 dark:bg-red-950/90 shadow-red-950/30' 
      : isSuccess 
      ? 'bg-emerald-900/90 text-white border-emerald-700/50 dark:bg-emerald-950/90 shadow-emerald-950/30' 
      : 'bg-gray-900/90 text-white border-gray-700/50 dark:bg-[#222]/95 shadow-gray-950/30'
  }`;

  const iconClass = isError 
    ? 'fa-circle-xmark text-red-400' 
    : isSuccess 
    ? 'fa-circle-check text-emerald-400' 
    : 'fa-circle-info text-blue-400';

  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-white/10">
      <i class="fa-solid ${iconClass}"></i>
    </div>
    <div class="flex-grow text-xs font-extrabold leading-snug tracking-wide">
      ${message}
    </div>
    <button class="text-white/60 hover:text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-0 cursor-pointer bg-transparent transition" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-12', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.remove('translate-x-0', 'opacity-100');
    toast.classList.add('translate-x-12', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Override native browser alert globally across all pages
window.alert = function(msg) {
  window.showToast(msg);
};

// Global Custom Modal Utility (Replaces browser alert popup with Real-World UI)
window.showCustomModal = function(options = {}) {
  const {
    title = '🔒 Authentication Required',
    message = 'Please log in to your EduStack account to access this feature.',
    icon = 'fa-solid fa-lock',
    iconColor = 'text-brand',
    iconBg = 'bg-brand/10',
    primaryText = 'Log In Now',
    primaryLink = '/auth/login.html',
    primaryAction = null,
    cancelText = 'Close'
  } = options;

  let modalOverlay = document.getElementById('edustack-global-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'edustack-global-modal';
    modalOverlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 opacity-0 pointer-events-none';
    modalOverlay.innerHTML = `
      <div id="edustack-modal-card" class="bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center transform scale-90 transition-all duration-300 relative overflow-hidden">
        <button id="edustack-modal-x" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-0 cursor-pointer transition">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div id="edustack-modal-icon-box" class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl shadow-sm">
          <i id="edustack-modal-icon" class="fa-solid fa-lock"></i>
        </div>
        <h3 id="edustack-modal-title" class="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Authentication Required</h3>
        <p id="edustack-modal-message" class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Please log in to your account.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button id="edustack-modal-cancel" class="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">Cancel</button>
          <a id="edustack-modal-primary" href="/auth/login.html" class="px-6 py-2.5 rounded-full bg-brand text-white font-extrabold text-xs shadow-md shadow-brand/20 hover:bg-brand-deep transition no-underline flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-right-to-bracket"></i> <span id="edustack-modal-btn-text">Log In Now</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const card = document.getElementById('edustack-modal-card');
  const iconBox = document.getElementById('edustack-modal-icon-box');
  const iconEl = document.getElementById('edustack-modal-icon');
  const titleEl = document.getElementById('edustack-modal-title');
  const messageEl = document.getElementById('edustack-modal-message');
  const cancelBtn = document.getElementById('edustack-modal-cancel');
  const primaryBtn = document.getElementById('edustack-modal-primary');
  const btnText = document.getElementById('edustack-modal-btn-text');
  const closeX = document.getElementById('edustack-modal-x');

  iconBox.className = `w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl shadow-sm ${iconBg} ${iconColor}`;
  iconEl.className = icon;
  titleEl.textContent = title;
  messageEl.textContent = message;
  btnText.textContent = primaryText;
  cancelBtn.textContent = cancelText;

  if (primaryLink) {
    primaryBtn.setAttribute('href', primaryLink);
    primaryBtn.onclick = null;
  } else if (primaryAction) {
    primaryBtn.setAttribute('href', 'javascript:void(0)');
    primaryBtn.onclick = (e) => {
      e.preventDefault();
      closeModal();
      primaryAction();
    };
  }

  function closeModal() {
    modalOverlay.classList.add('opacity-0', 'pointer-events-none');
    card.classList.add('scale-90');
    card.classList.remove('scale-100');
  }

  cancelBtn.onclick = closeModal;
  closeX.onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };

  modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    card.classList.remove('scale-90');
    card.classList.add('scale-100');
  }, 10);
};

// Global Razorpay Gateway Modal Component (Fail-proof, Zero about:blank popup errors)
window.showRazorpayModal = function() {
  let modalOverlay = document.getElementById('edustack-rzp-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'edustack-rzp-modal';
    modalOverlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 opacity-0 pointer-events-none';
    modalOverlay.innerHTML = `
      <div id="edustack-rzp-card" style="background:#fff;border-radius:24px;max-width:420px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.35);overflow:hidden;transform:scale(0.9);transition:transform 0.3s ease, opacity 0.3s ease;position:relative;" class="dark-rzp-card">
        <!-- Header: gradient bg using inline styles so Tailwind purge never removes it -->
        <div style="background:linear-gradient(135deg,#1d4ed8 0%,#4338ca 50%,#0f172a 100%);color:#fff;padding:24px;position:relative;">
          <button id="rzp-modal-close" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.12);border:none;border-radius:50%;width:32px;height:32px;color:rgba(255,255,255,0.8);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.2s;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.22)'" onmouseout="this.style.color='rgba(255,255,255,0.8)';this.style.background='rgba(255,255,255,0.12)'">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:20px;color:#93c5fd;flex-shrink:0;">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h4 style="font-weight:800;font-size:15px;line-height:1.2;margin:0 0 3px;">Razorpay Secure Gateway</h4>
              <p style="font-size:11px;color:#bfdbfe;margin:0;display:flex;align-items:center;gap:5px;">
                <i class="fa-solid fa-lock" style="color:#34d399;"></i> 256-Bit SSL Encrypted Payment
              </p>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(255,255,255,0.12);">
            <div>
              <span style="display:block;font-size:10px;text-transform:uppercase;font-weight:700;color:#bfdbfe;letter-spacing:0.05em;margin-bottom:3px;">Merchant</span>
              <span style="font-weight:800;font-size:13px;color:#fff;">EduStack Premium Access</span>
            </div>
            <div style="text-align:right;">
              <span style="display:block;font-size:10px;text-transform:uppercase;font-weight:700;color:#bfdbfe;letter-spacing:0.05em;margin-bottom:3px;">Amount</span>
              <span style="font-weight:900;font-size:22px;color:#34d399;">₹5.00</span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:24px;display:flex;flex-direction:column;gap:16px;background:#fff;" class="rzp-body-bg">
          <div>
            <label style="display:block;font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Select Payment Method</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <button type="button" style="padding:12px;border-radius:14px;border:2px solid #2563eb;background:rgba(37,99,235,0.06);text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.2s;">
                <i class="fa-solid fa-qrcode" style="color:#2563eb;font-size:18px;flex-shrink:0;"></i>
                <div>
                  <span style="display:block;font-weight:700;font-size:12px;color:#111827;">UPI / QR Code</span>
                  <span style="display:block;font-size:10px;color:#9ca3af;">GPay, PhonePe, Paytm</span>
                </div>
              </button>
              <button type="button" style="padding:12px;border-radius:14px;border:1.5px solid #e5e7eb;background:#fff;text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.2s;" onmouseover="this.style.borderColor='#2563eb'" onmouseout="this.style.borderColor='#e5e7eb'">
                <i class="fa-solid fa-credit-card" style="color:#10b981;font-size:18px;flex-shrink:0;"></i>
                <div>
                  <span style="display:block;font-weight:700;font-size:12px;color:#111827;">Cards / NetBanking</span>
                  <span style="display:block;font-size:10px;color:#9ca3af;">Visa, RuPay, SBI</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;">Enter VPA / UPI ID or Mobile Number</label>
            <input type="text" id="rzp-upi-id" value="success@razorpay" placeholder="e.g. 9876543210@upi"
              style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:12px;border:1.5px solid #d1d5db;background:#f9fafb;font-size:12px;font-weight:600;outline:none;color:#111827;transition:border-color 0.2s;"
              onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.12)'"
              onblur="this.style.borderColor='#d1d5db';this.style.boxShadow='none'">
          </div>

          <div id="rzp-msg-box" style="display:none;padding:12px;border-radius:12px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:700;text-align:center;"></div>

          <button id="rzp-submit-btn"
            style="width:100%;background:linear-gradient(90deg,#2563eb,#4f46e5);color:#fff;font-weight:800;padding:14px;border-radius:16px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;box-shadow:0 4px 15px rgba(37,99,235,0.35);transition:all 0.2s;"
            onmouseover="this.style.background='linear-gradient(90deg,#1d4ed8,#4338ca)';this.style.transform='translateY(-1px)'"
            onmouseout="this.style.background='linear-gradient(90deg,#2563eb,#4f46e5)';this.style.transform='translateY(0)'">
            <i class="fa-solid fa-lock"></i> Pay ₹5.00 & Unlock Premium
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const card = document.getElementById('edustack-rzp-card');
  const closeBtn = document.getElementById('rzp-modal-close');
  const submitBtn = document.getElementById('rzp-submit-btn');
  const msgBox = document.getElementById('rzp-msg-box');

  function closeModal() {
    modalOverlay.classList.add('opacity-0', 'pointer-events-none');
    card.style.transform = 'scale(0.9)';
  }

  closeBtn.onclick = closeModal;

  submitBtn.onclick = async () => {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authorizing ₹5.00 Transaction...`;
    msgBox.style.display = 'block';
    msgBox.style.background = '#eff6ff';
    msgBox.style.color = '#2563eb';
    msgBox.textContent = 'Connecting to Razorpay Banking Gateway...';

    try {
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        msgBox.style.background = '#ecfdf5';
        msgBox.style.color = '#059669';
        msgBox.textContent = '🎉 Payment Successful! Premium Access Granted.';
        submitBtn.style.background = 'linear-gradient(90deg,#059669,#047857)';
        setTimeout(() => {
          closeModal();
          window.location.href = '/premium-dsa-sheet.html';
        }, 800);
      } else {
        msgBox.style.background = '#fef2f2';
        msgBox.style.color = '#dc2626';
        msgBox.textContent = `❌ ${data.message || 'Payment processing failed.'}`;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.background = 'linear-gradient(90deg,#2563eb,#4f46e5)';
        submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₹5.00 & Unlock Premium`;
      }
    } catch (err) {
      msgBox.style.background = '#fef2f2';
      msgBox.style.color = '#dc2626';
      msgBox.textContent = '❌ Network error during payment processing.';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.background = 'linear-gradient(90deg,#2563eb,#4f46e5)';
      submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₹5.00 & Unlock Premium`;
    }
  };

  modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    card.style.transform = 'scale(1)';
  }, 10);
};

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
      <style>
        /* ── Uniform Subject Card Heights ── */
        .subject-card-grid .subject-card {
          height: 365px !important;
          min-height: 365px !important;
          max-height: 365px !important;
        }
        /* Subject list page cards are taller */
        .subject-list-grid .subject-card {
          height: 400px !important;
          min-height: 400px !important;
          max-height: 400px !important;
        }
        /* Card thumbnail always fixed height */
        .subject-card .card-thumb {
          height: 176px !important; /* h-44 = 176px */
          min-height: 176px !important;
          max-height: 176px !important;
          flex-shrink: 0;
          overflow: hidden;
        }
        .subject-card .card-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        /* ── Navbar fix: right section never overflows ── */
        #nav-right-section {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          margin-left: auto;
          min-width: 0;
        }
        #themeToggle {
          flex-shrink: 0 !important;
        }
        #nav-auth-container {
          flex-shrink: 0 !important;
          min-width: 0;
        }
        /* Profile pill: round circular button on all screens */
        #nav-auth-container .profile-pill {
          width: 36px;
          height: 36px;
          border-radius: 50% !important;
          padding: 2px !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Mobile Sidebar ── */
        #sidebar-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          pointer-events: none;
        }
        #sidebar-overlay.open {
          pointer-events: auto;
        }
        #sidebar-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          opacity: 0;
          transition: opacity 0.32s ease;
        }
        #sidebar-overlay.open #sidebar-backdrop {
          opacity: 1;
        }
        #sidebar-panel {
          position: relative;
          width: 300px;
          max-width: 85vw;
          height: 100%;
          background: #fff;
          box-shadow: 4px 0 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
          overflow-y: auto;
        }
        .dark #sidebar-panel {
          background: #181818;
          box-shadow: 4px 0 32px rgba(0,0,0,0.55);
        }
        #sidebar-overlay.open #sidebar-panel {
          transform: translateX(0);
        }

        /* sidebar nav links */
        .sb-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 20px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          color: #374151;
          transition: background 0.18s, color 0.18s;
          margin: 2px 0;
        }
        .dark .sb-link { color: #d1d5db; }
        .sb-link:hover { background: #f3f4f6; color: #ff385c; }
        .dark .sb-link:hover { background: #222222; color: #ff385c; }
        .sb-link.active { background: #f3f4f6; color: #ff385c; }
        .dark .sb-link.active { background: #222222; color: #ff385c; }
        .sb-link i { width: 20px; text-align: center; font-size: 14px; color: #9ca3af; flex-shrink: 0; }
        .sb-link:hover i, .sb-link.active i { color: #ff385c; }

        /* hamburger button */
        #hamburger-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: transparent;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
          flex-shrink: 0;
        }
        .dark #hamburger-btn { border-color: #374151; }
        #hamburger-btn:hover { background: #f3f4f6; }
        .dark #hamburger-btn:hover { background: #222222; }
        @media (max-width: 767px) {
          #hamburger-btn { display: flex; }
        }

        /* sidebar close button */
        #sidebar-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.18s;
          flex-shrink: 0;
        }
        .dark #sidebar-close-btn { border-color: #374151; }
        #sidebar-close-btn:hover { background: #fee2e2; }
        .dark #sidebar-close-btn:hover { background: #450a0a; }

        /* sidebar divider */
        .sb-divider {
          height: 1px;
          background: #f3f4f6;
          margin: 8px 0;
        }
        .dark .sb-divider { background: #2d2d2d; }

        /* sidebar section label */
        .sb-section-label {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
          padding: 6px 20px 4px;
        }
      </style>
    `;
    document.head.insertAdjacentHTML('beforeend', headHtml);

    // Helper for active nav states
    const getNavItem = (href, icon, label, targetStr, colorClass = "nav-item-brand", iconColorStyle = "color:#ff385c;") => {
      const isActive = path.includes(targetStr);
      return `
            <li>
              <a href="${base}${href}" class="${colorClass} flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all no-underline text-gray-700 dark:text-gray-200 ${isActive ? 'font-black opacity-100' : ''}">
                <i class="${icon}" style="${iconColorStyle}"></i> ${label}
              </a>
            </li>`;
    };

    // Build sidebar nav links HTML
    const buildSidebarLinks = () => {
      if (isGuest) {
        return `
          <span class="sb-section-label">Navigation</span>
          <a href="${base}guest/subject-list.html" class="sb-link ${path.includes('guest/subject-list') ? 'active' : ''}">
            <i class="fa-solid fa-list-ul"></i> Subject-list
          </a>
          <a href="${base}guest/favourite-list.html" class="sb-link ${path.includes('guest/favourite-list') ? 'active' : ''}">
            <i class="fa-solid fa-heart"></i> Favourites
          </a>
          <a href="${base}guest/enrollments.html" class="sb-link ${path.includes('guest/enrollments') ? 'active' : ''}">
            <i class="fa-solid fa-calendar-check"></i> Enrollments
          </a>`;
      } else if (isAdmin) {
        return `
          <span class="sb-section-label">Navigation</span>
          <a href="${base}admin/subject-list.html" class="sb-link ${path.includes('admin/subject-list') ? 'active' : ''}">
            <i class="fa-solid fa-list-ul"></i> Subject-list
          </a>
          <a href="${base}admin/host-subjects.html" class="sb-link ${path.includes('admin/host-subjects') ? 'active' : ''}">
            <i class="fa-solid fa-house"></i> Host Subjects
          </a>
          <a href="${base}admin/add-subject.html" class="sb-link ${path.includes('admin/add-subject') ? 'active' : ''}">
            <i class="fa-solid fa-circle-plus"></i> Add Subject
          </a>`;
      } else {
        return `
          <span class="sb-section-label">Sections</span>
          <a href="${base}index.html#demo-subjects" class="sb-link sb-hash-link" data-hash="#demo-subjects">
            <i class="fa-solid fa-book-open" style="color:#ff385c;"></i> Explore Subjects
          </a>
          <a href="${base}index.html#college-websites" onclick="event.preventDefault(); window.requireAuth(function(){ window.location.href='${base}index.html#college-websites'; }, 'access College Useful Links')" class="sb-link sb-hash-link" data-hash="#college-websites">
            <img src="https://upload.wikimedia.org/wikipedia/en/b/b5/National_Institute_of_Technology%2C_Patna_Logo.png" alt="NITP" style="width:18px;height:18px;object-fit:contain;display:inline-block;"> College Useful Links
          </a>
          <a href="${base}index.html#resources" class="sb-link sb-hash-link" data-hash="#resources">
            <i class="fa-solid fa-folder-open" style="color:#3b82f6;"></i> Resources
          </a>
          <a href="${base}index.html#ai-tools" class="sb-link sb-hash-link" data-hash="#ai-tools">
            <i class="fa-solid fa-robot" style="color:#8b5cf6;"></i> AI Tools
          </a>
          <a href="${base}public/premium-dsa-sheet.html" onclick="event.preventDefault(); window.requireAuth(function(){ window.location.href='${base}public/premium-dsa-sheet.html'; }, 'access Ultimate DSA Sheet')" class="sb-link">
            <i class="fa-solid fa-star" style="color:#eab308;"></i> Ultimate DSA Sheet
          </a>
          <a href="${base}contribute.html" onclick="event.preventDefault(); window.requireAuth(function(){ window.location.href='${base}contribute.html'; }, 'contribute notes & PYQs')" class="sb-link">
            <i class="fa-solid fa-cloud-arrow-up" style="color:#10b981;"></i> Contribute Notes
          </a>
          <a href="${base}index.html#about" class="sb-link sb-hash-link" data-hash="#about">
            <i class="fa-solid fa-circle-info" style="color:#f97316;"></i> About Me
          </a>
          <a href="${base}index.html#contact" class="sb-link sb-hash-link" data-hash="#contact">
            <i class="fa-solid fa-address-card" style="color:#ec4899;"></i> Contact
          </a>
          <div class="sb-divider"></div>
          <span class="sb-section-label">Account</span>
          <a href="${base}auth/login.html" class="sb-link">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Login
          </a>
          <a href="${base}auth/register.html" class="sb-link" style="color:#ff385c;">
            <i class="fa-solid fa-user-plus" style="color:#ff385c;"></i> Sign Up
          </a>`;
      }
    };

    // Sidebar HTML
    const sidebarHtml = `
      <div id="sidebar-overlay">
        <div id="sidebar-backdrop"></div>
        <div id="sidebar-panel">
          <!-- Sidebar Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid #f3f4f6;" class="dark-border-fix">
            <a href="${base}index.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;" onclick="closeSidebar()">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ff385c,#ff6b81);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;">
                  <rect x="3" y="15" width="18" height="4" rx="1.5" fill="white"/>
                  <rect x="5" y="9" width="14" height="4" rx="1.5" fill="white" opacity="0.85"/>
                  <rect x="7" y="3" width="10" height="4" rx="1.5" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <div>
                <div style="font-size:18px;font-weight:900;line-height:1;letter-spacing:-0.5px;">Edu<span style="color:#ff385c;">Stack</span></div>
                <div style="font-size:10px;color:#9ca3af;margin-top:2px;font-weight:500;">Pushing knowledge, Popping success.</div>
              </div>
            </a>
            <button id="sidebar-close-btn" onclick="closeSidebar()" aria-label="Close sidebar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:16px;height:16px;color:#6b7280;">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <!-- Sidebar Nav Links -->
          <nav style="padding:12px 12px;flex:1;">
            ${buildSidebarLinks()}
          </nav>
          <!-- Sidebar Footer -->
          <div style="padding:14px 20px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;font-weight:600;">
            © 2026 EduStack · <span style="color:#ff385c;">Shubham Kumar</span>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

    // Inject Nav
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
      const navHtml = `
        <nav style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(0,0,0,0.07);position:relative;z-index:999;flex-wrap:nowrap;width:100%;box-sizing:border-box;gap:6px;overflow:visible;" class="bg-white dark:bg-[#181818] dark-border-fix">

          <!-- LEFT: Logo + hamburger -->
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;min-width:0;">
            <button id="hamburger-btn" onclick="openSidebar()" aria-label="Open menu" style="flex-shrink:0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:18px;height:18px;">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <a href="${base}index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;flex-shrink:0;">
              <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#ff385c,#ff6b81);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;">
                  <rect x="3" y="15" width="18" height="4" rx="1.5" fill="white"/>
                  <rect x="5" y="9" width="14" height="4" rx="1.5" fill="white" opacity="0.85"/>
                  <rect x="7" y="3" width="10" height="4" rx="1.5" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <div style="display:flex;flex-direction:column;justify-content:center;flex-shrink:0;">
                <div style="font-size:18px;font-weight:900;line-height:1;letter-spacing:-0.5px;">Edu<span style="color:#ff385c;">Stack</span></div>
                <span style="font-size:10px;color:#9ca3af;font-weight:500;white-space:nowrap;" class="hidden-xs">Pushing knowledge, Popping success.</span>
              </div>
            </a>
          </div>

          <!-- CENTER: Nav links (desktop only) -->
          <ul style="display:none;align-items:center;gap:0px;list-style:none;margin:0;padding:0;font-size:12px;font-weight:700;flex:1;min-width:0;justify-content:center;" class="desktop-nav-links">
            ${isGuest ? `
            ${getNavItem('guest/subject-list.html', 'fa-solid fa-list-ul', 'Subject-list', 'guest/subject-list', 'nav-item-purple', 'color:#8b5cf6;')}
            ${getNavItem('guest/favourite-list.html', 'fa-solid fa-heart', 'Favourites', 'guest/favourite-list', 'nav-item-brand', 'color:#ff385c;')}
            ${getNavItem('guest/enrollments.html', 'fa-solid fa-calendar-check', 'Enrollments', 'guest/enrollments', 'nav-item-blue', 'color:#3b82f6;')}
            ` : isAdmin ? `
            ${getNavItem('admin/subject-list.html', 'fa-solid fa-list-ul', 'Subject-list', 'admin/subject-list', 'nav-item-purple', 'color:#8b5cf6;')}
            ${getNavItem('admin/host-subjects.html', 'fa-solid fa-house', 'Host Subjects', 'admin/host-subjects', 'nav-item-indigo', 'color:#6366f1;')}
            ${getNavItem('admin/add-subject.html', 'fa-solid fa-circle-plus', 'Add Subject', 'admin/add-subject', 'nav-item-emerald', 'color:#10b981;')}
            ` : `
            <li><a href="${base}index.html#demo-subjects" class="nav-link-hash nav-item-brand" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;" data-hash="#demo-subjects"><i class="fa-solid fa-book-open" style="color:#ff385c;font-size:11px;"></i> Explore Subjects</a></li>
            <li><a href="${base}index.html#college-websites" onclick="event.preventDefault(); window.requireAuth(function(){ window.location.href='${base}index.html#college-websites'; }, 'access College Useful Links')" class="nav-link-hash nav-item-amber" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;" data-hash="#college-websites"><img src="https://upload.wikimedia.org/wikipedia/en/b/b5/National_Institute_of_Technology%2C_Patna_Logo.png" alt="NITP" style="width:14px;height:14px;object-fit:contain;display:inline-block;"> College Links</a></li>
            <li><a href="${base}index.html#resources" class="nav-link-hash nav-item-blue" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;" data-hash="#resources"><i class="fa-solid fa-folder-open" style="color:#3b82f6;font-size:11px;"></i> Resources</a></li>
            <li><a href="${base}index.html#ai-tools" class="nav-link-hash nav-item-purple" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;" data-hash="#ai-tools"><i class="fa-solid fa-robot" style="color:#8b5cf6;font-size:11px;"></i> AI Tools</a></li>
            <li><a href="${base}public/premium-dsa-sheet.html" onclick="event.preventDefault(); window.requireAuth(function(){ window.location.href='${base}public/premium-dsa-sheet.html'; }, 'access Ultimate DSA Sheet')" class="nav-item-amber" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:900;font-size:12px;white-space:nowrap;"><i class="fa-solid fa-crown" style="color:#f59e0b;font-size:12px;"></i> <span style="background:linear-gradient(135deg,#f59e0b,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">DSA Sheet</span></a></li>
            <li><a href="${base}contribute.html" onclick="event.preventDefault(); window.requireAuth(function(){ window.location.href='${base}contribute.html'; }, 'contribute notes & PYQs')" class="nav-item-emerald" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;"><i class="fa-solid fa-cloud-arrow-up" style="color:#10b981;font-size:11px;"></i> Contribute</a></li>
            <li><a href="${base}index.html#about" class="nav-link-hash nav-item-orange" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;" data-hash="#about"><i class="fa-solid fa-circle-info" style="color:#f97316;font-size:11px;"></i> About</a></li>
            <li><a href="${base}index.html#contact" class="nav-link-hash nav-item-pink" style="display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:50px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap;" data-hash="#contact"><i class="fa-solid fa-address-card" style="color:#ec4899;font-size:11px;"></i> Contact</a></li>
            `}
          </ul>

          <!-- RIGHT: Theme Picker + Theme toggle + AI Assistant + Auth (always flex, never wraps) -->
          <div id="nav-right-section" style="display:flex;align-items:center;gap:6px;flex-shrink:0;">

            <!-- EduStack AI Assistant Button in Header -->
            <button onclick="window.triggerEduStackAIAssistant()"
              title="EduStack AI Assistant"
              class="nav-ai-btn"
              style="align-items:center;gap:5px;font-size:11px;font-weight:800;color:#ffffff !important;background:linear-gradient(135deg,#9333ea,#ec4899);padding:5px 11px;border-radius:50px;border:1px solid rgba(255,255,255,0.25);cursor:pointer;box-shadow:0 2px 10px rgba(147,51,234,0.3);transition:transform 0.2s, box-shadow 0.2s;white-space:nowrap;"
              onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <i class="fa-solid fa-wand-magic-sparkles" style="font-size:10px;color:#fef08a;"></i>
              <span class="hidden-xs" style="color:#ffffff !important;">AI Assistant</span>
              <span class="nav-ai-live-tag" style="background:#ffffff !important;color:#3b0764 !important;font-size:8.5px;padding:2px 6px;border-radius:10px;text-transform:uppercase;font-weight:900;letter-spacing:0.6px;display:inline-block;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.2);">LIVE</span>
            </button>

            <!-- Theme Picker Button -->
            <div style="position:relative;flex-shrink:0;" id="theme-picker-wrapper">
              <button id="theme-picker-btn" title="Select Accent Theme"
                style="width:32px;height:32px;border-radius:50%;border:2px solid #e5e7eb;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;"
                onmouseover="this.style.borderColor='var(--brand,#ff385c)'" onmouseout="this.style.borderColor=document.documentElement.classList.contains('dark')?'#374151':'#e5e7eb'">
                <i class="fa-solid fa-palette" style="font-size:13px;color:var(--brand,#ff385c);"></i>
              </button>
              <!-- Theme Picker Popup -->
              <div id="theme-picker-popup" style="display:none;position:absolute;top:calc(100% + 10px);right:0;min-width:230px;background:var(--tp-bg,#fff);border:1px solid var(--tp-border,#e5e7eb);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,0.15);padding:14px 16px;z-index:99999;">
                <p style="font-size:10px;font-weight:900;color:var(--tp-label,#9ca3af);text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px 0;">Select Accent Theme</p>
                <!-- Accent Color Row -->
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;" id="accent-swatches"></div>
                <hr style="border:none;border-top:1px solid var(--tp-border,#e5e7eb);margin:10px 0;">
                <p style="font-size:10px;font-weight:900;color:var(--tp-label,#9ca3af);text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px 0;">Background Style</p>
                <!-- Background (light/dark combos) Row -->
                <div style="display:flex;gap:8px;flex-wrap:wrap;" id="bg-swatches"></div>
              </div>
            </div>

            <!-- Theme Toggle -->
            <button id="themeToggle" aria-label="Toggle dark mode"
              style="width:42px;height:24px;border-radius:50px;background:#e5e7eb;border:none;position:relative;cursor:pointer;flex-shrink:0;display:flex;align-items:center;transition:background 0.2s;">
              <span id="thumb"
                style="position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:transform 0.25s;">
                <i id="thumbIcon" class="fa-solid fa-sun" style="color:#f59e0b;font-size:10px;"></i>
              </span>
            </button>

            <!-- Notification Bell & Dropdown (Always Visible) -->
            <div class="relative flex items-center" style="flex-shrink:0;">
              <button id="notif-bell-btn" aria-label="Notifications" title="Notifications" class="btn-notif-bell">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;display:block;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span id="notif-badge" class="hidden absolute -top-1 -right-1 bg-brand text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#181818] shadow-sm">0</span>
              </button>
              
              <div id="notif-dropdown" class="notif-dropdown-panel hidden bg-white dark:bg-[#222222] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl z-[99999] overflow-hidden">
                <div class="p-3 px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h4 class="font-extrabold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <i class="fa-solid fa-bell text-brand"></i> Notifications
                  </h4>
                  <button id="btn-mark-all-read" class="text-[11px] font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer">Mark all read</button>
                </div>
                <div id="notif-list" class="max-h-80 overflow-y-auto p-2 space-y-1.5 text-xs">
                  <p class="text-center text-gray-400 py-6">No new notifications.</p>
                </div>
              </div>
            </div>

            <!-- Auth Container (login+signup for guests, profile for logged-in) -->
            <div id="nav-auth-container" style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <a href="${base}auth/login.html" class="login-link-desktop">
                <i class="fa-solid fa-arrow-right-to-bracket text-brand" style="font-size:12px;"></i>
                Login
              </a>
              <a href="${base}auth/register.html"
                class="nav-signup-btn"
                style="align-items:center;gap:6px;font-size:13px;font-weight:700;color:#fff;background:#ff385c;padding:8px 18px;border-radius:50px;text-decoration:none;white-space:nowrap;box-shadow:0 2px 8px rgba(255,56,92,0.25);">
                <i class="fa-solid fa-user-plus" style="font-size:11px;"></i>
                Sign Up
              </a>
            </div>
          </div>
        </nav>
      `;
      navPlaceholder.innerHTML = navHtml;

      // Apply responsive nav visibility via CSS
      const navStyle = document.createElement('style');
      navStyle.textContent = `
        html, body {
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        /* ── Accent CSS Variables (defaults) ── */
        :root {
          --brand: #ff385c;
          --brand-soft: #ff6b81;
          --brand-rgb: 255,56,92;
        }
        .hidden-xs { display: none !important; }
        @media (min-width: 768px) {
          .hidden-xs { display: inline-block !important; }
        }
        /* Nav links: flex-shrink allowed so they compress before hiding */
        .desktop-nav-links { display: none !important; }
        @media (min-width: 1024px) {
          .desktop-nav-links { display: flex !important; }
        }
        .login-link-desktop { display: none !important; }
        @media (min-width: 1280px) {
          .login-link-desktop { display: flex !important; }
        }
        .nav-ai-btn { display: none !important; }
        @media (min-width: 640px) {
          .nav-ai-btn { display: flex !important; }
        }
        .nav-signup-btn { display: none !important; }
        @media (min-width: 480px) {
          .nav-signup-btn { display: flex !important; }
        }
        /* Fit all nav items inside viewport without overflow */
        nav { max-width: 100vw; }
        #nav-right-section { flex-shrink: 0; }
        .dark nav { border-color:#2d2d2d; }
        .dark-nav-link:hover { background:#222 !important; color:var(--brand,#ff385c) !important; }
        .dark #themeToggle { background:#374151 !important; }

        /* ── Notification Dropdown: Mobile-first responsive positioning ── */
        .notif-dropdown-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          max-width: calc(100vw - 16px);
        }
        @media (max-width: 380px) {
          .notif-dropdown-panel {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100vw - 24px);
            max-width: 320px;
          }
        }
        @media (min-width: 480px) {
          .notif-dropdown-panel { width: 360px; }
        }

        /* ── Profile Dropdown: Round circular avatar button on all screens ── */
        .profile-name-col { display: none !important; }
        .profile-chevron { display: none !important; }
        .profile-pill {
          padding: 2px !important;
          border-radius: 50% !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .profile-dropdown-panel { max-width: calc(100vw - 16px); z-index: 99999 !important; }
        @media (max-width: 360px) {
          .profile-dropdown-panel {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100vw - 24px);
          }
        }

        /* ── Theme Picker Popup ── */
        #theme-picker-popup {
          --tp-bg: #ffffff;
          --tp-border: #e5e7eb;
          --tp-label: #6b7280;
          --tp-text: #111827;
          background: var(--tp-bg) !important;
          border-color: var(--tp-border) !important;
          color: var(--tp-text) !important;
          box-shadow: 0 14px 40px rgba(0,0,0,0.25) !important;
          z-index: 99999 !important;
        }
        .dark #theme-picker-popup {
          --tp-bg: #1a1a24;
          --tp-border: #333348;
          --tp-label: #9ca3af;
          --tp-text: #ffffff;
          background: var(--tp-bg) !important;
          border-color: var(--tp-border) !important;
          color: var(--tp-text) !important;
        }
        .theme-swatch {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .theme-swatch:hover { transform: scale(1.18); }
        .theme-swatch.active {
          border-color: #fff;
          box-shadow: 0 0 0 2px var(--brand,#ff385c), 0 0 8px rgba(var(--brand-rgb,255,56,92),0.5);
          transform: scale(1.1);
        }
        .bg-swatch {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 10px;
          border: 1.5px solid var(--tp-border,#e5e7eb);
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          color: var(--tp-text,#374151);
          background: transparent;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .dark .bg-swatch { color: #d1d5db; }
        .bg-swatch:hover, .bg-swatch.active {
          border-color: var(--brand,#ff385c);
          background: rgba(var(--brand-rgb,255,56,92),0.08);
          color: var(--brand,#ff385c);
        }
        /* ── Theme Picker popup on small screens: position left instead of right ── */
        @media (max-width: 480px) {
          #theme-picker-popup {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            min-width: calc(100vw - 32px);
          }
        }
      `;
      document.head.appendChild(navStyle);

      // ── Theme Picker Engine ───────────────────────────────────────────
      (function initThemePicker() {
        const ACCENT_THEMES = [
          { name: 'Rose Red',        color: '#ff385c', soft: '#ff6b81', light: '#fca5a5', rgb: '255,56,92' },
          { name: 'Emerald Green',   color: '#10b981', soft: '#34d399', light: '#a7f3d0', rgb: '16,185,129' },
          { name: 'Electric Violet', color: '#8b5cf6', soft: '#c084fc', light: '#ddd6fe', rgb: '139,92,246' },
          { name: 'Sky Cyan',        color: '#06b6d4', soft: '#38bdf8', light: '#bae6fd', rgb: '6,182,212' },
          { name: 'Sunset Orange',   color: '#ff6b35', soft: '#ff9f1c', light: '#ffd166', rgb: '255,107,53' },
          { name: 'Royal Blue',      color: '#2563eb', soft: '#60a5fa', light: '#93c5fd', rgb: '37,99,235' },
        ];
        const BG_THEMES = [
          // Light variants
          { name: '☀️ Default',   dark: false, bg: '#ffffff', navBg: '#ffffff', bodyBg: '#f9fafb' },
          { name: '🌿 Warm',      dark: false, bg: '#fffbf5', navBg: '#fffbf5', bodyBg: '#fef3e2' },
          { name: '🧊 Cool',      dark: false, bg: '#f0f9ff', navBg: '#f0f9ff', bodyBg: '#e0f2fe' },
          // Dark variants
          { name: '🌑 Charcoal',  dark: true,  bg: '#181818', navBg: '#181818', bodyBg: '#111111' },
          { name: '🌌 Midnight',  dark: true,  bg: '#0f0f1a', navBg: '#0f0f1a', bodyBg: '#08080f' },
          { name: '🌲 Forest',    dark: true,  bg: '#0d1f1a', navBg: '#0d1f1a', bodyBg: '#081510' },
        ];

        const ROOT = document.documentElement;
        const LS_ACCENT = 'edustack_accent';
        const LS_BG     = 'edustack_bg';

        function applyAccent(t) {
          ROOT.style.setProperty('--brand',       t.color);
          ROOT.style.setProperty('--brand-soft',  t.soft);
          ROOT.style.setProperty('--brand-light', t.light || t.soft);
          ROOT.style.setProperty('--brand-rgb',    t.rgb);

          // Dynamic global brand CSS overrides for Light & Dark mode
          let brandStyleEl = document.getElementById('edustack-brand-override');
          if (!brandStyleEl) {
            brandStyleEl = document.createElement('style');
            brandStyleEl.id = 'edustack-brand-override';
            document.head.appendChild(brandStyleEl);
          }
          brandStyleEl.textContent = `
            :root {
              --brand: ${t.color} !important;
              --brand-soft: ${t.soft} !important;
              --brand-light: ${t.light || t.soft} !important;
              --brand-rgb: ${t.rgb} !important;
            }
            .bg-brand,
            .bg-\\[\\#ff385c\\],
            .dark .bg-brand,
            .dark .dark\\:bg-brand,
            .dark .dark\\:bg-\\[\\#ff385c\\] {
              background-color: ${t.color} !important;
            }

            .text-brand,
            .text-\\[\\#ff385c\\],
            .dark .text-brand,
            .dark .dark\\:text-brand,
            .dark .dark\\:text-rose-400,
            .dark .dark\\:text-rose-500,
            .dark .dark\\:text-\\[\\#ff385c\\] {
              color: ${t.color} !important;
            }

            .border-brand,
            .border-\\[\\#ff385c\\],
            .dark .border-brand,
            .dark .dark\\:border-brand,
            .dark .dark\\:border-rose-500\\/30 {
              border-color: ${t.color} !important;
            }

            /* Tailwind Gradient Dynamic Overrides */
            .from-brand {
              --tw-gradient-from: ${t.color} var(--tw-gradient-from-position) !important;
              --tw-gradient-to: rgba(${t.rgb}, 0) var(--tw-gradient-to-position) !important;
              --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
            }
            .from-brand\\/40 {
              --tw-gradient-from: rgba(${t.rgb}, 0.4) var(--tw-gradient-from-position) !important;
              --tw-gradient-to: rgba(${t.rgb}, 0) var(--tw-gradient-to-position) !important;
              --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
            }
            .via-brand-soft {
              --tw-gradient-to: rgba(${t.rgb}, 0) var(--tw-gradient-to-position) !important;
              --tw-gradient-stops: var(--tw-gradient-from), ${t.soft} var(--tw-gradient-via-position), var(--tw-gradient-to) !important;
            }
            .to-brand-light {
              --tw-gradient-to: ${t.light || t.soft} var(--tw-gradient-to-position) !important;
            }
            .to-brand {
              --tw-gradient-to: ${t.color} var(--tw-gradient-to-position) !important;
            }
            .to-brand-soft {
              --tw-gradient-to: ${t.soft} var(--tw-gradient-to-position) !important;
            }

            .hover\\:bg-brand:hover,
            .hover\\:bg-\\[\\#ff385c\\]:hover,
            .dark .dark\\:hover\\:bg-brand:hover {
              background-color: ${t.color} !important;
            }

            .hover\\:text-brand:hover,
            .hover\\:text-\\[\\#ff385c\\]:hover,
            .dark .dark\\:hover\\:text-brand:hover {
              color: ${t.color} !important;
            }

            .hover\\:border-brand:hover,
            .dark .dark\\:hover\\:border-brand:hover {
              border-color: ${t.color} !important;
            }

            .shadow-brand\\/20 {
              --tw-shadow-color: rgba(${t.rgb}, 0.2) !important;
              box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 4px 14px rgba(${t.rgb}, 0.25) !important;
            }
            .shadow-brand\\/15, .hover\\:shadow-brand\\/15:hover {
              box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 10px 25px rgba(${t.rgb}, 0.18) !important;
            }

            .accent-brand {
              accent-color: ${t.color} !important;
            }

            .bg-brand\\/5, .dark .dark\\:bg-brand\\/10 {
              background-color: rgba(${t.rgb}, 0.08) !important;
            }
            .bg-brand\\/10, .dark .dark\\:bg-brand\\/20 {
              background-color: rgba(${t.rgb}, 0.16) !important;
            }
            .bg-brand\\/20 {
              background-color: rgba(${t.rgb}, 0.24) !important;
            }
            .border-brand\\/10, .border-brand\\/20, .border-brand\\/30 {
              border-color: rgba(${t.rgb}, 0.28) !important;
            }

            .notif-dropdown-panel #btn-mark-all-read {
              color: ${t.color} !important;
            }
          `;

          // Update palette icon color live
          const icon = document.querySelector('#theme-picker-btn i');
          if (icon) icon.style.color = t.color;

          // Highlight active swatch
          document.querySelectorAll('#accent-swatches .theme-swatch').forEach(el => {
            const isMatch = el.getAttribute('data-color') === t.color;
            el.classList.toggle('active', isMatch);
          });
          localStorage.setItem(LS_ACCENT, JSON.stringify(t));
        }

        // Remember user's last selected dark/light background variants
        let lastDarkBg = BG_THEMES[3];  // Charcoal
        let lastLightBg = BG_THEMES[0]; // Default

        function applyBg(b) {
          if (b.dark) {
            lastDarkBg = b;
            ROOT.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            lastLightBg = b;
            ROOT.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }

          let bgStyleEl = document.getElementById('edustack-bg-style');
          if (!bgStyleEl) {
            bgStyleEl = document.createElement('style');
            bgStyleEl.id = 'edustack-bg-style';
            document.head.appendChild(bgStyleEl);
          }

          if (b.dark) {
            bgStyleEl.textContent = `
              body {
                background-color: ${b.bodyBg} !important;
                color: #f3f4f6 !important;
              }
              nav.bg-white,
              nav.dark\\:bg-\\[\\#181818\\],
              header {
                background-color: ${b.navBg} !important;
              }
              .dark .bg-white,
              .dark .dark\\:bg-\\[\\#181818\\],
              .dark .dark\\:bg-\\[\\#161622\\],
              .dark .dark\\:bg-\\[\\#1a1a24\\],
              .dark .dark\\:bg-\\[\\#1a1a2e\\],
              .dark .dark\\:bg-\\[\\#222222\\] {
                background-color: ${b.bg} !important;
              }
            `;
          } else {
            bgStyleEl.textContent = `
              body {
                background-color: ${b.bodyBg} !important;
                color: #111827 !important;
              }
              nav.bg-white,
              header {
                background-color: ${b.navBg} !important;
              }
            `;
          }

          if (typeof window.updateThemeToggleUI === 'function') {
            window.updateThemeToggleUI(b.dark);
          }

          document.querySelectorAll('#bg-swatches .bg-swatch').forEach(el => {
            const isMatch = el.getAttribute('data-bg') === b.name;
            el.classList.toggle('active', isMatch);
          });
          localStorage.setItem(LS_BG, JSON.stringify(b));
        }

        // Global theme synchronizer called when #themeToggle is clicked
        window.syncThemeStyles = function(isDark) {
          const savedBg = (() => { try { return JSON.parse(localStorage.getItem(LS_BG)); } catch { return null; } })();
          let matchingBgTheme;
          if (isDark) {
            matchingBgTheme = (savedBg && savedBg.dark) ? savedBg : lastDarkBg;
          } else {
            matchingBgTheme = (savedBg && !savedBg.dark) ? savedBg : lastLightBg;
          }
          applyBg(matchingBgTheme);
        };

        function buildSwatches() {
          const accentEl = document.getElementById('accent-swatches');
          const bgEl     = document.getElementById('bg-swatches');
          if (!accentEl || !bgEl) return;

          const savedAccent = (() => { try { return JSON.parse(localStorage.getItem(LS_ACCENT)); } catch { return null; } })();
          const activeAccentColor = savedAccent ? savedAccent.color : '#ff385c';
          const savedBg = (() => { try { return JSON.parse(localStorage.getItem(LS_BG)); } catch { return null; } })();

          accentEl.innerHTML = ACCENT_THEMES.map((t, idx) => `
            <button class="theme-swatch ${activeAccentColor.toLowerCase() === t.color.toLowerCase() ? 'active' : ''}"
              data-accent-idx="${idx}" data-color="${t.color}" title="${t.name}"
              style="background:${t.color};">
            </button>`).join('');

          bgEl.innerHTML = BG_THEMES.map((b, idx) => `
            <button class="bg-swatch ${savedBg && savedBg.name === b.name ? 'active' : ''}"
              data-bg-idx="${idx}" data-bg="${b.name}">
              ${b.name}
            </button>`).join('');
        }

        // Restore saved preferences immediately
        const savedAccent = (() => { try { return JSON.parse(localStorage.getItem(LS_ACCENT)); } catch { return null; } })();
        const savedBg     = (() => { try { return JSON.parse(localStorage.getItem(LS_BG));     } catch { return null; } })();
        if (savedAccent) applyAccent(savedAccent);
        if (savedBg) {
          if (savedBg.dark) lastDarkBg = savedBg;
          else lastLightBg = savedBg;
          applyBg(savedBg);
        }

        // Open/close theme picker popup & click handler
        document.addEventListener('click', (e) => {
          const btn   = document.getElementById('theme-picker-btn');
          const popup = document.getElementById('theme-picker-popup');
          if (!btn || !popup) return;
          if (btn.contains(e.target)) {
            const isOpen = popup.style.display !== 'none';
            popup.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) buildSwatches();
          } else if (!popup.contains(e.target)) {
            popup.style.display = 'none';
          }
        });

        // Event delegation inside theme-picker-popup for swatches
        setTimeout(() => {
          const popup = document.getElementById('theme-picker-popup');
          if (popup) {
            popup.addEventListener('click', (e) => {
              e.stopPropagation();
              const accentBtn = e.target.closest('[data-accent-idx]');
              if (accentBtn) {
                const idx = parseInt(accentBtn.dataset.accentIdx, 10);
                if (ACCENT_THEMES[idx]) {
                  applyAccent(ACCENT_THEMES[idx]);
                  popup.style.display = 'none';
                }
                return;
              }
              const bgBtn = e.target.closest('[data-bg-idx]');
              if (bgBtn) {
                const idx = parseInt(bgBtn.dataset.bgIdx, 10);
                if (BG_THEMES[idx]) {
                  applyBg(BG_THEMES[idx]);
                  popup.style.display = 'none';
                }
                return;
              }
            });
          }
        }, 100);
      })();
      // ─────────────────────────────────────────────────────────────────


      fetch('/api/auth/me', { credentials: 'include' })
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success && resData.data && resData.data.user) {
            const u = resData.data.user;
            // Store user info globally for easy page access
            window.currentUser = u;
            const container = document.getElementById('nav-auth-container');
            if (container) {
              let rawName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
              if (!rawName && u.email) {
                const handle = u.email.split('@')[0];
                rawName = handle.split(/[\._\-]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
              const displayName = rawName || 'Student';
              const avatar = (u.avatar && u.avatar !== 'default-avatar.png') ? u.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ff385c&color=fff&bold=true`;
              
              const roleLabel = u.role === 'admin' ? 'HOST / ADMIN' : (u.isPremium ? '★ PREMIUM' : 'STUDENT');
              const roleColor = u.role === 'admin' ? 'text-amber-500 font-extrabold' : (u.isPremium ? 'text-amber-400 font-bold' : 'text-brand font-bold');
              const roleIcon  = u.role === 'admin' ? '<i class="fa-solid fa-crown text-amber-500 text-xs" title="Host Admin Account"></i>' : '<i class="fa-solid fa-circle-check text-blue-500 text-xs" title="Verified Student Account"></i>';

              container.innerHTML = `
                <div class="relative" id="user-profile-menu" style="flex-shrink:0;">
                  <div class="profile-pill" id="profile-pill-btn" title="${displayName} (${roleLabel})" onclick="event.stopPropagation(); const d=document.getElementById('user-profile-dropdown'); if(d) d.classList.toggle('hidden');" style="display:flex;align-items:center;justify-content:center;padding:2px;border:2px solid var(--brand,#ff385c);border-radius:50%;cursor:pointer;background:#ffffff;transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s;width:36px;height:36px;box-sizing:border-box;" onmouseenter="this.style.transform='scale(1.06)';this.style.boxShadow='0 0 10px rgba(var(--brand-rgb,255,56,92),0.35)'" onmouseleave="this.style.transform='scale(1)';this.style.boxShadow='none'">
                    <div style="width:28px;height:28px;border-radius:50%;overflow:hidden;flex-shrink:0;">
                      <img src="${avatar}" alt="${displayName}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <div style="display:none;" class="profile-name-col">
                      <span style="font-size:12px;font-weight:800;line-height:1;color:#111827;display:flex;align-items:center;gap:4px;" class="dark:text-white">
                        ${displayName}
                        ${roleIcon}
                      </span>
                      <span style="font-size:9px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;line-height:1;margin-top:2px;" class="${roleColor}">
                        ${roleLabel}
                      </span>
                    </div>
                    <i class="fa-solid fa-chevron-down profile-chevron" style="display:none;font-size:9px;color:#9ca3af;margin-left:2px;"></i>
                  </div>
                  
                  <div id="user-profile-dropdown" class="profile-dropdown-panel hidden absolute right-0 top-[115%] w-64 bg-white dark:bg-[#1a1a24] text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl transition-all duration-200 z-[99999]" onclick="event.stopPropagation()">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800/80 bg-gradient-to-r from-rose-50/80 via-purple-50/50 to-indigo-50/80 dark:from-[#241c26] dark:via-[#1f1b2d] dark:to-[#1a1a2e] rounded-t-2xl flex items-center gap-3">
                      <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid var(--brand,#ff385c);flex-shrink:0;" class="shadow-sm">
                        <img src="${avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;">
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-[13px] font-black text-gray-900 dark:text-white truncate flex items-center gap-1.5 mb-0.5">
                          ${displayName} ${roleIcon}
                        </p>
                        <p class="text-[10px] font-extrabold ${roleColor} uppercase tracking-wider mb-0.5">
                          ${roleLabel}
                        </p>
                        <p class="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">${u.email}</p>
                      </div>
                    </div>
                    <div class="p-2 space-y-1">
                      ${u.role === 'admin' ? `
                      <a href="${base}admin/add-subject.html" class="dropdown-item-indigo flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-plus-circle w-4 text-center text-indigo-500"></i> Add New Subject
                      </a>` : ''}
                      ${u.role === 'admin' || u.role === 'contributor' ? `
                      <a href="${base}admin/admin-subject-list.html" class="dropdown-item-purple flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-list-check w-4 text-center text-purple-500"></i> Manage Subjects
                      </a>` : ''}
                      ${u.role === 'admin' ? `
                      <a href="${base}admin/broadcast-notification.html" class="dropdown-item-rose flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-bullhorn w-4 text-center text-rose-500"></i> Broadcast Notification
                      </a>` : ''}
                      ${u.role === 'contributor' || u.role === 'admin' ? `
                      <a href="/contribute.html" class="dropdown-item-emerald flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-cloud-arrow-up w-4 text-center text-emerald-500"></i> Contribute Resources
                      </a>` : `
                      <a href="/contribute.html" class="dropdown-item-emerald flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-handshake w-4 text-center text-emerald-500"></i> Become a Contributor
                      </a>`}
                      ${u.isPremium ? `
                      <a href="/premium-dsa-sheet.html" class="dropdown-item-amber flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-star w-4 text-center text-amber-500"></i> Premium DSA Sheet
                      </a>` : ''}
                      <a href="${base}guest/enrollments.html" class="dropdown-item-blue flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-graduation-cap w-4 text-center text-blue-500"></i> My Enrollments
                      </a>
                      <a href="${base}guest/favourite-list.html" class="dropdown-item-brand flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-heart w-4 text-center text-brand"></i> My Favourites
                      </a>
                      <a href="${base}auth/edit-profile.html" class="dropdown-item-emerald flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all no-underline">
                        <i class="fa-solid fa-user-pen w-4 text-center text-emerald-500"></i> Edit Profile
                      </a>
                      <button onclick="fetch('/api/auth/logout',{method:'POST',credentials:'include'}).then(()=>window.location.href='/')" class="dropdown-item-rose w-full text-left flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-extrabold text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer bg-transparent border-0">
                        <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              `;

              // Initialize Notification Bell Click & Fetcher
              setTimeout(() => {
                const bellBtn = document.getElementById('notif-bell-btn');
                const notifDropdown = document.getElementById('notif-dropdown');
                const notifList = document.getElementById('notif-list');
                const notifBadge = document.getElementById('notif-badge');
                const markAllBtn = document.getElementById('btn-mark-all-read');

                if (bellBtn && notifDropdown) {
                  bellBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notifDropdown.classList.toggle('hidden');
                  });

                  document.addEventListener('click', (e) => {
                    const profDropdown = document.getElementById('user-profile-dropdown');
                    const profBtn = document.getElementById('profile-pill-btn');
                    if (profDropdown && profBtn && !profDropdown.contains(e.target) && !profBtn.contains(e.target)) {
                      profDropdown.classList.add('hidden');
                    }
                    if (!notifDropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                      notifDropdown.classList.add('hidden');
                    }
                  });

                  const loadNotifs = async () => {
                    try {
                      const nRes = await fetch('/api/notifications', { credentials: 'include' });
                      const nData = await nRes.json();
                      if (nRes.ok && nData.success && nData.data) {
                        const { unreadCount, notifications } = nData.data;
                        if (unreadCount > 0) {
                          notifBadge.textContent = unreadCount;
                          notifBadge.classList.remove('hidden');
                        } else {
                          notifBadge.classList.add('hidden');
                        }

                        if (notifications.length === 0) {
                          notifList.innerHTML = '<p class="text-center text-gray-400 py-6">No new notifications.</p>';
                          return;
                        }

                        notifList.innerHTML = notifications.map(n => `
                          <div class="p-3 rounded-xl ${n.isRead ? 'bg-transparent text-gray-500' : 'bg-brand/5 dark:bg-brand/10 border border-brand/10'} transition-all flex flex-col gap-1">
                            <div class="flex items-center justify-between">
                              <span class="font-black text-gray-900 dark:text-white text-[12px] flex items-center gap-1.5">
                                ${n.type === 'alert' ? '⚠️' : (n.type === 'update' ? '🚀' : '📢')} ${n.title}
                              </span>
                              <span class="text-[9px] text-gray-400">${new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p class="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">${n.message}</p>
                            ${n.link ? `<a href="${n.link}" class="text-[10px] font-bold text-brand hover:underline mt-0.5 inline-block">View Details →</a>` : ''}
                          </div>
                        `).join('');
                      }
                    } catch (err) {}
                  };

                  loadNotifs();

                  if (markAllBtn) {
                    markAllBtn.addEventListener('click', async () => {
                      await fetch('/api/notifications/read-all', { method: 'PUT', credentials: 'include' });
                      loadNotifs();
                    });
                  }
                }
              }, 100);
            }

            // Real-world RBAC Client Page Guard
            if (isAdmin) {
              if (u.role !== 'admin') {
                alert('⛔ Access Denied: Admin privileges required. Redirecting to home...');
                window.location.href = '/';
              }
            }
          } else {
            if (isAdmin) {
              alert('🔒 Access Restricted: Please log in with an Admin account.');
              window.location.href = `${base}auth/login.html`;
            }
          }
        })
          if (isAdmin) {
            window.showCustomModal({
              title: '⛔ Admin Access Restricted',
              message: 'Please log in with an Admin / Host account to access the administrative dashboard.',
              icon: 'fa-solid fa-user-shield',
              iconColor: 'text-amber-500',
              iconBg: 'bg-amber-500/10',
              primaryText: 'Log In as Admin',
              primaryLink: `${base}auth/login.html`
            });
          }
      
      // Handle hash based active states for index page nav
      if (!isGuest && !isAdmin) {
        const updateHashNav = () => {
          const currentHash = window.location.hash;
          document.querySelectorAll('.nav-link-hash').forEach(link => {
            if (currentHash && link.getAttribute('data-hash') === currentHash) {
              link.classList.add('font-black');
            } else {
              link.classList.remove('font-black');
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

        // Sidebar hash link active state
        const updateSidebarHash = () => {
          const currentHash = window.location.hash;
          document.querySelectorAll('.sb-hash-link').forEach(link => {
            const hashAttr = link.getAttribute('data-hash');
            if (currentHash && hashAttr === currentHash) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        };
        window.addEventListener('hashchange', updateSidebarHash);
        updateSidebarHash();
      }

      // Re-attach theme toggle listener after injecting nav
      if (window.initThemeToggle) {
        window.initThemeToggle();
      }
    }

    // ── Sidebar open / close logic ──
    window.openSidebar = function () {
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    window.closeSidebar = function () {
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    // Close on backdrop click
    document.addEventListener('click', (e) => {
      const overlay = document.getElementById('sidebar-overlay');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (overlay && overlay.classList.contains('open') && e.target === backdrop) {
        window.closeSidebar();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.closeSidebar();
    });

    // Close sidebar when a sidebar link is clicked (smooth UX)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sb-link')) {
        window.closeSidebar();
      }
    });

  } catch (error) {
    console.error('Error loading partials:', error);
  }
});

// ============================================================
// 🤖 RENDER FREE-TIER ML SERVICE STATUS WIDGET
// ============================================================
// Shows a floating status indicator for the Python ML microservice.
// On Render free tier, services sleep after 15 min of inactivity.
// The "Wake Up AI" button pings the /health endpoint to wake it.
// Status: 🔴 blinking = sleeping/offline | 🟢 pulsing = online
// ============================================================
(function initMLStatusWidget() {
  let ML_URL = ''; // Initialized empty — set from /api/config before any ML call
  let _statusInterval = null;
  let _isOnline = false;
  let _waking = false;

  // Fetch ML service URL from server config first
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => { if (cfg && cfg.mlServiceUrl) ML_URL = cfg.mlServiceUrl; })
    .catch(() => {})
    .finally(() => {
      injectWidget();
      checkMLStatus();
      // Poll every 30 seconds
      _statusInterval = setInterval(checkMLStatus, 30000);
    });

  function injectWidget() {
    if (document.getElementById('edustack-ml-status-widget')) return;

    const style = document.createElement('style');
    style.textContent = `
      #edustack-ml-status-widget {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 99998;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }
      #ml-status-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #1e1b4b, #2e1065);
        backdrop-filter: blur(16px);
        border: 1.5px solid #a855f7;
        border-radius: 50px;
        padding: 8px 16px;
        color: #ffffff;
        font-size: 11px;
        font-weight: 900;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(168, 85, 247, 0.4);
        cursor: default;
        transition: all 0.3s ease;
        min-width: 160px;
        justify-content: space-between;
      }
      #ml-status-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex-shrink: 0;
        transition: background 0.4s ease;
      }
      #ml-status-dot.online {
        background: #22c55e;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
        animation: ml-pulse-green 2s infinite;
      }
      #ml-status-dot.offline {
        background: #ef4444;
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        animation: ml-pulse-red 1s infinite;
      }
      #ml-status-dot.waking {
        background: #f59e0b;
        animation: ml-pulse-amber 0.7s infinite;
      }
      @keyframes ml-pulse-green {
        0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
        70%  { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
      }
      @keyframes ml-pulse-red {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
        50%       { opacity: 0.5; box-shadow: 0 0 0 6px rgba(239,68,68,0); }
      }
      @keyframes ml-pulse-amber {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.4; }
      }
      #ml-wakeup-btn {
        display: none;
        align-items: center;
        gap: 7px;
        background: linear-gradient(135deg, #ff385c, #e11d48, #8b5cf6);
        background-size: 200% 200%;
        animation: ml-gradient-shift 4s ease infinite, ml-slide-up 0.3s ease forwards;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 50px;
        padding: 10px 18px;
        font-size: 11px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(255, 56, 92, 0.45), 0 0 15px rgba(139, 92, 246, 0.3);
        transition: all 0.25s ease;
        font-family: inherit;
        letter-spacing: 0.3px;
      }
      @keyframes ml-gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      #ml-wakeup-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
      #ml-wakeup-btn:active { transform: scale(0.97); }
      @keyframes ml-slide-up {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    const widget = document.createElement('div');
    widget.id = 'edustack-ml-status-widget';
    widget.innerHTML = `
      <button id="ml-wakeup-btn" onclick="window.wakeUpMLService()" title="Click to wake up the AI service">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
        </svg>
        Wake Up AI
      </button>
      <div id="ml-status-badge" title="EduStack AI Service Status">
        <div style="display:flex;align-items:center;gap:7px;">
          <span id="ml-status-dot" class="offline"></span>
          <span id="ml-status-text">AI Checking...</span>
        </div>
        <span id="ml-status-label" style="font-size:9px;font-weight:900;color:#e9d5ff;background:rgba(233,213,255,0.15);padding:2px 7px;border-radius:10px;margin-left:4px;">ML</span>
      </div>
    `;
    document.body.appendChild(widget);
  }

  async function checkMLStatus() {
    if (_waking) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(ML_URL + '/health', { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      setOnline(data.status === 'healthy' || res.ok);
    } catch {
      setOffline();
    }
  }

  function setOnline(val) {
    _isOnline = val;
    const dot = document.getElementById('ml-status-dot');
    const text = document.getElementById('ml-status-text');
    const btn = document.getElementById('ml-wakeup-btn');
    if (!dot || !text) return;

    if (val) {
      dot.className = 'online';
      text.textContent = 'AI Online';
      if (btn) btn.style.display = 'none';
    } else {
      setOffline();
    }
  }

  function setOffline() {
    _isOnline = false;
    const dot = document.getElementById('ml-status-dot');
    const text = document.getElementById('ml-status-text');
    const btn = document.getElementById('ml-wakeup-btn');
    if (!dot || !text) return;
    dot.className = 'offline';
    text.textContent = 'AI Sleeping';
    if (btn) btn.style.display = 'flex';
  }

  window.wakeUpMLService = async function() {
    if (_waking) return;
    _waking = true;
    const dot = document.getElementById('ml-status-dot');
    const text = document.getElementById('ml-status-text');
    const btn = document.getElementById('ml-wakeup-btn');
    if (dot) dot.className = 'waking';
    if (text) text.textContent = 'Waking up...';
    if (btn) { btn.disabled = true; btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Waking...'; }

    // Inject spin animation if not present
    if (!document.getElementById('ml-spin-style')) {
      const s = document.createElement('style');
      s.id = 'ml-spin-style';
      s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }

    // Fire and forget — Render needs time to boot
    fetch(ML_URL + '/health').catch(() => {});

    // Poll every 3s for up to 45s
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(ML_URL + '/health', { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          clearInterval(poll);
          _waking = false;
          setOnline(true);
          if (typeof window.showToast === 'function') {
            window.showToast('🤖 AI Service is now online!', 'success');
          }
          if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg> Wake Up AI'; }
        }
      } catch {}
      if (attempts >= 15) {
        clearInterval(poll);
        _waking = false;
        setOffline();
        if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg> Wake Up AI'; }
      }
    }, 3000);
  };
})();
