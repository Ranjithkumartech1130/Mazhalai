// ==========================================
// Mazhalai Preschool – Supabase Client (Public Website)
// ==========================================
// IMPORTANT: Replace the two placeholders below with your actual
// Supabase Project URL and Anon Key from:
//   Supabase Dashboard → Project Settings → API
// ==========================================

const SUPABASE_URL = 'https://plzstexzohxghbkdiqfl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsenN0ZXh6b2h4Z2hia2RpcWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMjg3NjksImV4cCI6MjEwMDcwNDc2OX0.t1czIUHo2G2JBm5YEqTbqw3otzSXCygdCvU8ZCrygvg';

// ── Internal flag: skip all Supabase calls if credentials are not configured ──
const _configured = (
  SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
);

const supabaseClient = _configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ──────────────────────────────────────────────────────────────
// UTILITY: Show / hide a loading overlay inside a container
// ──────────────────────────────────────────────────────────────
function showLoader(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="supabase-loader">
      <div class="supabase-spinner"></div>
      <p>Loading…</p>
    </div>`;
}

// ──────────────────────────────────────────────────────────────
// 1. FETCH SITE CONTENT (hero title, subtitle, contact)
// ──────────────────────────────────────────────────────────────
async function fetchSiteContent() {
  if (!_configured) return;
  try {
    const { data, error } = await supabaseClient
      .from('site_content')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) { console.error('Site content error:', error.message); return; }
    if (!data) return;

    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && data.hero_title) heroTitle.textContent = data.hero_title;

    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroSubtitle && data.hero_subtitle) heroSubtitle.textContent = data.hero_subtitle;

    document.querySelectorAll('.dynamic-phone').forEach(el => el.textContent = data.phone || '');
    document.querySelectorAll('.dynamic-email').forEach(el => el.textContent = data.email || '');
    document.querySelectorAll('.dynamic-address').forEach(el => {
      el.innerHTML = (data.address || '').replace(/\n/g, '<br>');
    });

    if (data.hero_image_url) {
      const heroImg = document.getElementById('hero-image');
      if (heroImg) heroImg.src = data.hero_image_url;
    }

    if (data.about_image_url) {
      const aboutImg = document.getElementById('about-image');
      if (aboutImg) aboutImg.src = data.about_image_url;
    }
  } catch (err) {
    console.error('Unexpected error fetching site content:', err);
  }
}

// ──────────────────────────────────────────────────────────────
// 2. FETCH GALLERY PHOTOS
// ──────────────────────────────────────────────────────────────
// Category → CSS data-category mapping (must match filter buttons in HTML)
const CATEGORY_SLUG_MAP = {
  'Annual Day':   'annual-day',
  'Sports Day':   'sports-day',
  'Art & Craft':  'art-craft',
  'Celebrations': 'cultural',
  'Activities':   'learning',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

function buildGalleryCard(item) {
  const catSlug = CATEGORY_SLUG_MAP[item.category]
    || (item.category || 'all').toLowerCase().replace(/[\s&]+/g, '-');

  const title       = item.title || item.event_name || item.category || 'Special Event';
  const description = item.description || 'A cherished moment captured at Mazhalai Preschool.';
  const badge       = item.category || 'Event';

  // Prefer explicit date, fall back to created_at
  const rawDate = item.date || item.created_at;
  const dateLabel = rawDate ? `📅 ${formatDate(rawDate)}` : '';

  return `
    <div class="gallery-card reveal" data-category="${catSlug}">
      <div class="gallery-img-wrap">
        <img
          src="${item.image_url}"
          alt="${title}"
          loading="lazy"
          onerror="this.src='assets/classroom-about.png'"
        >
        <div class="gallery-badge">${badge}</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>${title}</h3>
            <p>${description}</p>
            ${dateLabel ? `<span class="gallery-date">${dateLabel}</span>` : ''}
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>`;
}

async function fetchGallery() {
  if (!_configured) return;

  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;

  // Show a loading state
  galleryGrid.innerHTML = `
    <div class="gallery-loading" style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
      <div style="font-size:2rem;margin-bottom:0.5rem">📸</div>
      <p>Loading gallery…</p>
    </div>`;

  try {
    const { data, error } = await supabaseClient
      .from('gallery')
      .select('id, image_url, title, description, category, album, event_name, year, date, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      // Restore static fallback cards if DB is empty
      galleryGrid.innerHTML = getStaticGalleryHTML();
      return;
    }

    galleryGrid.innerHTML = data.map(buildGalleryCard).join('');

    // Re-apply the active filter
    const activeFilterBtn = document.querySelector('.gallery-filter-btn.active');
    const currentFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
    applyGalleryFilter(currentFilter);

  } catch (err) {
    console.error('Gallery fetch error:', err.message);
    // Restore static fallback on error
    galleryGrid.innerHTML = getStaticGalleryHTML();
  }
}

// ──────────────────────────────────────────────────────────────
// 3. GALLERY FILTER (works for both static & dynamic cards)
// ──────────────────────────────────────────────────────────────
function applyGalleryFilter(filterValue) {
  const cards = document.querySelectorAll('.gallery-card');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canAnimate = typeof gsap !== 'undefined' && !reduceMotion;

  cards.forEach(card => {
    const cat = card.getAttribute('data-category');
    const shouldShow = filterValue === 'all' || cat === filterValue;
    const isHidden = card.classList.contains('hide');

    if (shouldShow && isHidden) {
      card.classList.remove('hide');
      if (canAnimate) {
        gsap.fromTo(card,
          { opacity: 0, scale: 0.9, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)' });
      }
    } else if (!shouldShow && !isHidden) {
      if (canAnimate) {
        gsap.to(card, {
          opacity: 0, scale: 0.9, duration: 0.2, ease: 'power1.in',
          onComplete: () => card.classList.add('hide'),
        });
      } else {
        card.classList.add('hide');
      }
    }
  });
}

function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
      }
      applyGalleryFilter(btn.getAttribute('data-filter'));
    });
  });
}

// ──────────────────────────────────────────────────────────────
// 4. FETCH EVENTS (for the Events section on the public site)
// ──────────────────────────────────────────────────────────────
function buildEventCard(ev) {
  const dateLabel = ev.event_date
    ? new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const coverHtml = ev.cover_image_url
    ? `<img src="${ev.cover_image_url}" alt="${ev.title}" loading="lazy" onerror="this.parentElement.style.display='none'">`
    : `<div class="event-card-no-img">📅</div>`;

  return `
    <div class="event-card reveal">
      <div class="event-card-img-wrap">
        ${coverHtml}
        <span class="event-card-badge">${ev.category || 'Event'}</span>
      </div>
      <div class="event-card-body">
        <h3 class="event-card-title">${ev.title}</h3>
        ${dateLabel ? `<span class="event-card-date">📅 ${dateLabel}</span>` : ''}
        ${ev.description ? `<p class="event-card-desc">${ev.description}</p>` : ''}
      </div>
    </div>`;
}

async function fetchEvents() {
  if (!_configured) return;

  const eventsGrid = document.getElementById('eventsGrid');
  if (!eventsGrid) return;

  try {
    const { data, error } = await supabaseClient
      .from('events')
      .select('id, title, description, event_date, cover_image_url, category')
      .order('event_date', { ascending: false })
      .limit(12); // show latest 12 events

    if (error) throw error;

    if (!data || data.length === 0) {
      const eventsSection = document.getElementById('events');
      if (eventsSection) eventsSection.style.display = 'none';
      return;
    }

    // Show events section if it was hidden
    const eventsSection = document.getElementById('events');
    if (eventsSection) eventsSection.style.display = '';

    eventsGrid.innerHTML = data.map(buildEventCard).join('');

    // Trigger reveal animation for new cards
    document.querySelectorAll('#eventsGrid .reveal').forEach(el => {
      el.classList.add('active');
    });

  } catch (err) {
    console.error('Events fetch error:', err.message);
  }
}

// ──────────────────────────────────────────────────────────────
// 5. FETCH PROGRAMS (optional dynamic override)
// ──────────────────────────────────────────────────────────────
async function fetchPrograms() {
  if (!_configured) return;

  const programsGrid = document.getElementById('programsGrid');
  if (!programsGrid) return;

  try {
    const { data, error } = await supabaseClient
      .from('programs')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      programsGrid.innerHTML = '';
      const colors = ['bg-yellow', 'bg-black', 'bg-yellow'];
      data.forEach((prog, index) => {
        const bgColor = colors[index % colors.length];
        const textColor = bgColor === 'bg-black' ? 'text-white' : '';
        const themeWrap = bgColor === 'bg-black' ? 'black-wrap' : 'yellow-wrap';
        const txtYellow = bgColor === 'bg-black' ? 'text-yellow' : '';
        
        const tags = prog.tags ? prog.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        programsGrid.insertAdjacentHTML('beforeend', `
          <div class="program-card reveal reveal-pop">
            <div class="card-icon-wrap ${themeWrap}">${prog.icon || '🌱'}</div>
            <div class="card-header ${bgColor}">
              <h3 class="${textColor}">${prog.title}</h3>
              <span class="age-tag ${textColor} ${txtYellow}">${prog.age_group}</span>
            </div>
            <div class="card-body">
              <p>${prog.description}</p>
              ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
            </div>
          </div>`);
      });
    }
  } catch (err) {
    console.error('Programs fetch error:', err.message);
  }
}

// ──────────────────────────────────────────────────────────────
// 6. STATIC FALLBACK GALLERY HTML
//    Shown when Supabase is unconfigured or returns empty data
// ──────────────────────────────────────────────────────────────
function getStaticGalleryHTML() {
  return `
    <div class="gallery-card reveal" data-category="annual-day">
      <div class="gallery-img-wrap">
        <img src="assets/annual-day.png" alt="Annual Day Celebration" loading="lazy">
        <div class="gallery-badge">Annual Day</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>Grand Annual Stage Celebration</h3>
            <p>Children shining bright in colorful performance costumes on stage.</p>
            <span class="gallery-date">📅 March 2026</span>
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>
    <div class="gallery-card reveal" data-category="sports-day">
      <div class="gallery-img-wrap">
        <img src="assets/sports-day.png" alt="Annual Sports Day Race" loading="lazy">
        <div class="gallery-badge">Sports Day</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>Fun &amp; Fitness Sports Meet</h3>
            <p>Toddlers participating in cheerful races with colorful balloons &amp; ribbons.</p>
            <span class="gallery-date">📅 January 2026</span>
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>
    <div class="gallery-card reveal" data-category="art-craft">
      <div class="gallery-img-wrap">
        <img src="assets/art-craft.png" alt="Finger Painting Workshop" loading="lazy">
        <div class="gallery-badge">Art &amp; Craft</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>Creative Finger Painting &amp; Art</h3>
            <p>Hands-on sensory art sessions unleashing young imaginations.</p>
            <span class="gallery-date">📅 February 2026</span>
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>
    <div class="gallery-card reveal" data-category="cultural">
      <div class="gallery-img-wrap">
        <img src="assets/cultural-fest.png" alt="Cultural Festival Celebration" loading="lazy">
        <div class="gallery-badge">Cultural Fest</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>Traditional Cultural Celebration</h3>
            <p>Little stars dressed in festive ethnic attire celebrating Indian culture.</p>
            <span class="gallery-date">📅 Pongal / Diwali Fest</span>
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>
    <div class="gallery-card reveal" data-category="learning">
      <div class="gallery-img-wrap">
        <img src="assets/science-play.png" alt="Sensory Science Discovery" loading="lazy">
        <div class="gallery-badge">Learning &amp; Play</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>Sensory Science &amp; Discovery</h3>
            <p>Curious young minds discovering nature and science through fun experiments.</p>
            <span class="gallery-date">📅 Science Week</span>
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>
    <div class="gallery-card reveal" data-category="learning">
      <div class="gallery-img-wrap">
        <img src="assets/classroom-about.png" alt="Interactive Classroom Learning" loading="lazy">
        <div class="gallery-badge">Learning &amp; Play</div>
        <div class="gallery-overlay">
          <div class="gallery-info">
            <h3>Interactive Group Learning</h3>
            <p>Joyful everyday classroom activities guided by loving teachers.</p>
            <span class="gallery-date">📅 Everyday Activity</span>
          </div>
          <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
        </div>
      </div>
    </div>`;
}

// ──────────────────────────────────────────────────────────────
// INITIALIZE – runs when DOM is ready
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Always initialize gallery filter buttons (works for static cards too)
  initGalleryFilters();

  if (!_configured) {
    console.info('[Mazhalai] Supabase not configured — showing static content.');
    return;
  }

  fetchSiteContent();
  fetchPrograms();
  fetchGallery();
  fetchEvents();
});
