/* ============================================
   MAZHALAI PRESCHOOL — ADMIN PANEL JS
   ============================================ */

let sessionEditCount = 0;
const activityLog = [];

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  initLogin();
  initPasswordToggle();
  initSidebar();
  initNavigation();
  initSectionLinks();
  initLivePreview();
  initGalleryUpload();
  setCurrentDate();
});

/* ─── DATE ─────────────────────────────── */
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─── PASSWORD TOGGLE ───────────────────── */
function initPasswordToggle() {
  const toggle = document.getElementById('eyeToggle');
  const input = document.getElementById('password');
  if (!toggle || !input) return;
  toggle.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(hidden));
    const icon = toggle.querySelector('.input-icon--eye');
    if (icon && window.lucide) {
      icon.setAttribute('data-lucide', hidden ? 'eye-off' : 'eye');
      lucide.createIcons();
    }
  });
}

/* ─── LOGIN ────────────────────────────── */
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    if (!email.value.trim() || !password.value.trim()) {
      showToast('⚠️ Please enter your email and password.');
      return;
    }
    if (!email.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showToast('⚠️ Please enter a valid email address.');
      email.focus();
      return;
    }
    if (password.value.length < 6) {
      showToast('⚠️ Password must be at least 6 characters.');
      password.focus();
      return;
    }

    const name = email.value.split('@')[0].replace(/[._-]/g, ' ').trim();
    const displayName = name.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Admin';
    const initials = displayName.split(' ').slice(0, 2)
      .map(w => w.charAt(0)).join('').toUpperCase();

    document.getElementById('welcomeTitle').textContent = `Welcome back, ${displayName}!`;
    document.getElementById('sidebarName').textContent = displayName;
    document.getElementById('sidebarInitials').textContent = initials;
    document.getElementById('topbarAvatar').textContent = initials;

    showToast('✅ Login successful! Opening admin panel...');
    setTimeout(() => enterDashboard(), 700);
  });
}

function enterDashboard() {
  const auth = document.getElementById('authScreen');
  const dash = document.getElementById('dashboardShell');
  auth.classList.add('is-hidden');
  dash.classList.remove('is-hidden');
  dash.setAttribute('aria-hidden', 'false');
  activateView('dashboard');
  if (window.lucide) lucide.createIcons();
}

/* ─── LOGOUT ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const auth = document.getElementById('authScreen');
      const dash = document.getElementById('dashboardShell');
      auth.classList.remove('is-hidden');
      dash.classList.add('is-hidden');
      document.getElementById('loginForm').reset();
      sessionEditCount = 0;
      document.getElementById('editCount').textContent = '0';
      activityLog.length = 0;
      renderActivity();
      showToast('👋 You have been logged out.');
    });
  }
});

/* ─── SIDEBAR TOGGLE (MOBILE) ──────────── */
function initSidebar() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });

  // Close sidebar on backdrop click on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 &&
      sidebar.classList.contains('is-open') &&
      !sidebar.contains(e.target) &&
      !toggle.contains(e.target)) {
      sidebar.classList.remove('is-open');
    }
  });
}

/* ─── NAVIGATION ────────────────────────── */
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      if (!section) return;
      activateView(section);
      // Close sidebar on mobile after nav
      if (window.innerWidth <= 900) {
        document.querySelector('.sidebar')?.classList.remove('is-open');
      }
    });
  });
}

function activateView(viewName) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('is-active', btn.getAttribute('data-section') === viewName);
  });

  // Update views
  document.querySelectorAll('.view').forEach(view => {
    const isActive = view.getAttribute('data-view') === viewName;
    view.classList.toggle('is-active', isActive);
    view.classList.toggle('is-hidden', !isActive);
  });

  // Update topbar title
  const titles = {
    dashboard: 'Dashboard',
    hero: 'Hero / Banner Editor',
    about: 'About Us Editor',
    programs: 'Programs Editor',
    strengths: 'Why Choose Us Editor',
    leadership: 'Leadership Editor',
    contact: 'Contact & Footer Editor',
    gallery: 'Gallery Manager',
    admissions: 'Admissions Manager',
  };
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = titles[viewName] || 'Admin Panel';

  // Re-render icons
  if (window.lucide) lucide.createIcons();
}

/* ─── SECTION QUICK LINKS ──────────────── */
function initSectionLinks() {
  document.querySelectorAll('.section-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      if (section) activateView(section);
    });
  });
}

/* ─── SAVE SECTION ──────────────────────── */
function saveSection(section) {
  sessionEditCount++;
  document.getElementById('editCount').textContent = sessionEditCount;

  const sectionNames = {
    hero: 'Hero / Banner',
    about: 'About Us',
    programs: 'Programs',
    strengths: 'Why Choose Us',
    leadership: 'Leadership',
    contact: 'Contact & Footer',
    gallery: 'Gallery',
    admissions: 'Admissions',
  };

  const name = sectionNames[section] || section;
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  activityLog.unshift({ section: name, time });
  renderActivity();
  showToast(`✅ "${name}" section saved successfully!`);
}

function renderActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;

  if (activityLog.length === 0) {
    list.innerHTML = `
      <div class="activity-empty">
        <i data-lucide="inbox"></i>
        <p>No edits yet. Start by selecting a section above!</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  list.innerHTML = activityLog.slice(0, 8).map(item => `
    <div class="activity-item">
      <i data-lucide="check-circle-2"></i>
      <span><strong>${item.section}</strong> section was saved</span>
      <time>${item.time}</time>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

/* ─── LIVE PREVIEW (HERO) ──────────────── */
function initLivePreview() {
  const map = {
    'hero-heading1': null,
    'hero-heading2': null,
    'hero-desc': 'prev-hero-desc',
    'hero-badge': 'prev-hero-badge',
    'hero-btn1': 'prev-hero-btn1',
    'hero-btn2': 'prev-hero-btn2',
  };

  // Heading combo
  function updateHeading() {
    const h1 = document.getElementById('hero-heading1')?.value || '';
    const h2 = document.getElementById('hero-heading2')?.value || '';
    const prev = document.getElementById('prev-hero-h1');
    if (prev) prev.innerHTML = `${h1} <span class="hl">${h2}</span>`;
  }

  const h1Input = document.getElementById('hero-heading1');
  const h2Input = document.getElementById('hero-heading2');
  if (h1Input) h1Input.addEventListener('input', updateHeading);
  if (h2Input) h2Input.addEventListener('input', updateHeading);

  // Others
  Object.entries(map).forEach(([srcId, tgtId]) => {
    if (!tgtId) return;
    const src = document.getElementById(srcId);
    const tgt = document.getElementById(tgtId);
    if (!src || !tgt) return;
    src.addEventListener('input', () => { tgt.textContent = src.value; });
  });

  // Btn1 preview prefix
  const btn1 = document.getElementById('hero-btn1');
  const prevBtn1 = document.getElementById('prev-hero-btn1');
  if (btn1 && prevBtn1) {
    btn1.addEventListener('input', () => { prevBtn1.textContent = '✏ ' + btn1.value; });
  }
  const btn2 = document.getElementById('hero-btn2');
  const prevBtn2 = document.getElementById('prev-hero-btn2');
  if (btn2 && prevBtn2) {
    btn2.addEventListener('input', () => { prevBtn2.textContent = '📖 ' + btn2.value; });
  }
}

/* ─── GALLERY UPLOAD ────────────────────── */
function initGalleryUpload() {
  const input = document.getElementById('galleryUpload');
  const thumbs = document.getElementById('galleryThumbs');
  if (!input || !thumbs) return;

  input.addEventListener('change', () => {
    const files = Array.from(input.files);
    if (!files.length) return;

    // Remove placeholder if present
    const placeholder = thumbs.querySelector('.gallery-placeholder');
    if (placeholder) placeholder.remove();

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'gallery-thumb-item';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'thumb-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove image';
        removeBtn.addEventListener('click', () => {
          div.remove();
          if (thumbs.children.length === 0) {
            thumbs.innerHTML = `<div class="gallery-placeholder"><p>No images uploaded yet.</p></div>`;
          }
        });
        div.appendChild(img);
        div.appendChild(removeBtn);
        thumbs.appendChild(div);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be re-added
    input.value = '';
    showToast(`🖼️ ${files.length} image(s) added to gallery.`);
  });
}

/* ─── TOAST ─────────────────────────────── */
let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
