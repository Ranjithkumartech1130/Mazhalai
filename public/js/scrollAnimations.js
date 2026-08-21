// ==========================================
// Mazhalai Preschool — GSAP ScrollTrigger FX
// ==========================================
// Two things live here:
//   1. Reveal-on-scroll for every .reveal element (upgrades the old
//      one-shot IntersectionObserver to GSAP's ScrollTrigger.batch so
//      elements that enter the viewport together cascade in with a
//      stagger, matching the brand's existing fade+rise CSS).
//   2. The hero's signature parallax: a handful of small yellow/black
//      brand shapes that drift at different speeds as you scroll,
//      inspired by gsap.com's "mesmerising effects" showcase.
// Falls back to a plain IntersectionObserver (no stagger) if the
// GSAP CDN fails to load, so content is never stuck invisible.
// ==========================================

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fallbackReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => observer.observe(el));
  }

  function initReveals() {
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((el, i) => {
          el.style.setProperty('--reveal-delay', (i * 0.1) + 's');
          el.classList.add('active');
        });
      },
    });
  }

  function initHeroParallax() {
    if (reduceMotion) return;
    const wraps = gsap.utils.toArray('.hero-parallax .hp-wrap');
    if (!wraps.length) return;

    wraps.forEach((wrap) => {
      const speed = parseFloat(wrap.dataset.speed) || 1;
      gsap.to(wrap, {
        y: (speed - 1) * 180,
        rotation: speed >= 1 ? 12 * speed : -10 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    });
  }

  // "Why Train With Mazhalai Academy" — pins the section in place for a
  // stretch of scroll distance while the two chip rows play out (row 1
  // slides left, row 2 mirrors it sliding right), then releases and lets
  // the page continue normally into Afterschool. scrub: true keeps it
  // locked 1:1 to scroll with no lag, so nothing moves except while
  // you're actively scrolling, and nothing advances past this section
  // until the scroll runway (the `end` distance below) is used up.
  //
  // The decorative .hp-wrap shapes (av1-av5) are deliberately NOT tweened
  // here — they sit at their static CSS positions and stay put through
  // the whole pin. Only the marquee tracks move.
  function initAcademyValuesPin() {
    if (reduceMotion) return;
    const wrap = document.querySelector('.academy-values-wrap');
    const track1 = document.getElementById('academyMarquee');
    const track2 = document.getElementById('academyMarquee2');
    if (!wrap || !track1 || !track2) return;

    // Snap points: one per REAL chip in row 1 (the aria-hidden duplicates
    // exist only to make the loop seamless and are excluded). Row 1's
    // xPercent runs 0 -> -50 across the pin, i.e. exactly across the width
    // of its real half — so a chip's offsetLeft as a fraction of that
    // half's total width is precisely the scroll progress (0-1) at which
    // translating the track by that many pixels lands the chip flush
    // against the track's own left edge. Snapping scroll progress to
    // these fractions means both rows can only ever come to rest with a
    // chip flush left (row 1) / flush right (row 2's mirrored motion),
    // never mid-word — whether that's the very first load state
    // (progress 0) or any point after the user stops scrolling.
    const realChips = Array.from(track1.children).filter((c) => c.getAttribute('aria-hidden') !== 'true');
    const halfWidth = track1.scrollWidth / 2;
    const snapPoints = halfWidth > 0 ? realChips.map((chip) => chip.offsetLeft / halfWidth) : [0];

    // Row 2 starts pre-shifted to -50% and animates back to 0% — the
    // mirror image of row 1's 0 -> -50 — so it visibly slides the
    // opposite direction while staying seamless (the track's content is
    // duplicated, so -50% and 0% are the same loop point).
    gsap.set(track2, { xPercent: -50 });

    // start must equal the fixed nav's own height exactly (not a bit
    // more): pin only freezes .academy-values-wrap itself — any gap
    // between the nav and the wrap's pinned top is NOT part of that
    // frozen element, so whatever sits there (the diploma cards) keeps
    // scrolling normally underneath it. Zero gap is the only way nothing
    // but the marquee moves while this is locked.
    //
    // end distance: .academy-values-wrap is only ~150-200px tall (heading
    // + two short chip rows), so this pin runway must stay short — a long
    // one (this used to be 1400) holds the page still for far more scroll
    // than that little block needs, and since nothing else lives inside
    // the pinned element, the rest of the viewport below it renders as a
    // long dead stretch of blank page for the whole excess distance.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'top 80px',
        end: '+=550',
        scrub: true,
        pin: true,
        anticipatePin: 1,
        // A single fast wheel/trackpad scroll can now cover this whole
        // 550px runway in one input event (it used to be 1400px, wide
        // enough that no ordinary scroll gesture crossed it in one go).
        // Without this, ScrollTrigger tries to render every in-between
        // scrub frame for that jump, and the pin/unpin handoff can land
        // mid-transition, showing a torn frame — chip row cut off under
        // the nav, CTA overlapping. fastScrollEnd makes it snap straight
        // to the nearest end (pinned-start or unpinned-past-end) instead
        // whenever scroll velocity is high, so the release is always a
        // clean cut, never a torn in-between frame.
        fastScrollEnd: true,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.15, max: 0.4 },
          ease: 'power1.inOut',
        },
      },
    });
    tl.to(track1, { xPercent: -50, ease: 'none' }, 0);
    tl.to(track2, { xPercent: 0, ease: 'none' }, 0);
  }

  // Lets visitors grab the chip row and swipe/drag it sideways themselves,
  // independent of the vertical-scroll-driven slide above. Pointer Events
  // cover mouse + touch + pen in one code path. The drag layer only ever
  // gets a plain `x` translate here; it springs back to 0 on release
  // rather than staying wherever it was dropped, so it reads as "nudge to
  // peek" rather than a second, competing way to permanently reposition
  // the marquee.
  function initMarqueeDrag() {
    // Two rows now, each with its own drag layer — wire the same
    // grab-and-release behavior onto every one independently.
    document.querySelectorAll('[data-marquee-drag]').forEach((layer) => {
      let startX = 0;
      let dragging = false;

      layer.addEventListener('pointerdown', (e) => {
        dragging = true;
        startX = e.clientX;
        gsap.killTweensOf(layer);
        layer.setPointerCapture(e.pointerId);
      });

      layer.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        gsap.set(layer, { x: e.clientX - startX });
      });

      const release = () => {
        if (!dragging) return;
        dragging = false;
        gsap.to(layer, reduceMotion
          ? { x: 0, duration: 0.2, ease: 'power1.out' }
          : { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.7)' });
      };
      layer.addEventListener('pointerup', release);
      layer.addEventListener('pointercancel', release);
    });
  }

  function initVmParallax() {
    if (reduceMotion) return;
    const shape1 = document.querySelector('.vm-shape-1');
    const shape2 = document.querySelector('.vm-shape-2');
    if (!shape1 && !shape2) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#vision-mission',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8,
      },
    });
    if (shape1) tl.to(shape1, { y: 120, x: 40, ease: 'none' }, 0);
    if (shape2) tl.to(shape2, { y: -100, x: -30, ease: 'none' }, 0);

    const lines = gsap.utils.toArray('.vm-divider-line');
    if (lines.length) {
      // Plain `scale` (not scaleY) so this animates correctly whether the
      // divider is vertical (desktop, scaleY starts at 0) or horizontal
      // (mobile, scaleX starts at 0 — see scrollFx.css) — GSAP reads each
      // axis's real starting value off the element before tweening it to 1.
      gsap.to(lines, {
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '.vm-divider',
          start: 'top 85%',
          once: true,
        },
      });
    }
  }

  // Vision/Mission divider — a spinning, drifting windmill, brand
  // yellow/black petals standing in for the blue/pink ones on
  // gsap.com/scroll's rotate demo.
  //
  // This originally used `pin: true` to lock it in place while the cards
  // scrolled past (matching the reference demo exactly), but pinning a
  // small element inside a CSS grid cell proved too fragile in real-world
  // scrolling — it broke twice (once from a transformed ancestor hijacking
  // its fixed positioning, once from stutter that turned out to be CSS
  // `scroll-behavior: smooth` fighting ScrollTrigger) — and pinning is also
  // exactly what leaves a gap: GSAP inserts a spacer element to hold the
  // pinned item's place in the document while it's fixed on screen.
  //
  // This version drops `pin` entirely and instead moves the windmill with
  // plain transforms (rotate + a vertical drift) driven by scrub, the same
  // technique already working everywhere else on the site (hero shapes,
  // CTA doodles, the vm-shape blobs above). Transforms are compositor-only —
  // they never affect layout — so there is nothing that could reserve extra
  // space and leave a gap, while the windmill still visibly moves as you
  // scroll.
  function initVmWindmill() {
    const wrap = document.getElementById('vmWindmillWrap');
    const svg = document.getElementById('vmWindmillSvg');
    if (!wrap || !svg) return;
    if (reduceMotion) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#vision-mission',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
    tl.to(svg, { rotation: 3600, ease: 'none' }, 0);
    tl.to(wrap, { y: 60, ease: 'none' }, 0);
  }

  function initCtaParallax() {
    if (reduceMotion) return;
    const wraps = gsap.utils.toArray('.cta-doodle-wrap');
    if (!wraps.length) return;

    wraps.forEach((wrap) => {
      const speed = parseFloat(wrap.dataset.speed) || 1;
      gsap.to(wrap, {
        y: (speed - 1) * 140,
        rotation: speed >= 1 ? 10 * speed : -8 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: '.cta',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    });
  }

  // Cards that are already in the DOM at page load are handled by
  // initReveals()/fallbackReveal() above (true scroll-triggered). But
  // gallery/program grids can get their content swapped out *later* by
  // supabaseClient.js once a Supabase fetch resolves — those replacement
  // nodes never passed through the initial scroll-trigger setup, so a
  // MutationObserver picks them up and fades them in with the same
  // stagger the rest of the site uses (no scroll-position check, since by
  // the time data arrives the section may already be on screen).
  function revealNewNodes(container) {
    const nodes = container.querySelectorAll('.reveal:not(.active):not(.reveal-observed)');
    if (!nodes.length) return;
    nodes.forEach((el, i) => {
      el.classList.add('reveal-observed');
      el.style.setProperty('--reveal-delay', (i * 0.08) + 's');
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('active')));
    });
  }

  // Swapping in Supabase-fetched cards can change a grid's height (different
  // card count/text length than the static fallback). If that happens while
  // a pinned ScrollTrigger's start/end points were measured against the old
  // layout, its math goes stale — refresh once things settle so the vm
  // windmill pin (and everything else) stays lined up with the real page.
  function scheduleScrollTriggerRefresh() {
    if (typeof ScrollTrigger === 'undefined') return;
    clearTimeout(scheduleScrollTriggerRefresh._t);
    scheduleScrollTriggerRefresh._t = setTimeout(() => ScrollTrigger.refresh(), 250);
  }

  function initDynamicGridReveals() {
    ['galleryGrid', 'programsGrid', 'eventsGrid'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      // Mark whatever is already here (handled by the batch/IO above) so
      // the observer only ever reacts to nodes inserted from this point on.
      el.querySelectorAll('.reveal').forEach((node) => node.classList.add('reveal-observed'));
      new MutationObserver(() => {
        revealNewNodes(el);
        scheduleScrollTriggerRefresh();
      }).observe(el, { childList: true });
    });
  }

  function initPlaneTrail() {
    if (reduceMotion || typeof MotionPathPlugin === 'undefined') return;
    const plane = document.querySelector('.plane-icon');
    const path = document.querySelector('#planeTrailPath');
    if (!plane || !path) return;

    gsap.registerPlugin(MotionPathPlugin);
    const pathLength = path.getTotalLength();
    gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

    gsap.timeline({
      scrollTrigger: {
        trigger: '.about',
        start: 'top 90%',
        end: 'bottom 10%',
        scrub: 0.7,
      },
    })
      .to(path, { strokeDashoffset: 0, ease: 'none' }, 0)
      .to(plane, {
        motionPath: {
          path: path,
          align: path,
          autoRotate: true,
          alignOrigin: [0.5, 0.5],
        },
        ease: 'none',
      }, 0);
  }

  // Programs -> Academy — a glowing ball travels down a winding tube, the
  // tube itself drawing in via the same stroke-dashoffset trick as the
  // plane trail above. Deliberately stops at #wormTrailEnd (the "Why
  // Train With Mazhalai Academy" heading) rather than running through
  // the marquee/CTA and into Afterschool — .worm-vertical-wrap still
  // spans all three sections (that's unrelated layout scaffolding), but
  // the trail's own height is measured off #wormTrailEnd's position
  // instead of the wrap's full height.
  //
  // The ball is plain HTML (not an SVG shape moved with MotionPathPlugin):
  // the tube's viewBox (90 wide) gets stretched non-uniformly to match
  // its real rendered height via CSS (width: 90px, height: 100%), so an
  // SVG circle riding that same coordinate space would get squashed into
  // an ellipse. Reading points off the path with getPointAtLength() and
  // placing a normal round div with plain top/left math sidesteps that
  // entirely — only the y-axis needs a scale correction (real height /
  // viewBox height), x is already 1:1 since the SVG's width matches its
  // viewBox width exactly. #wormBall only ever gets a translate() here;
  // the pulsing glow lives on the nested .worm-ball-core in CSS so the
  // two transforms don't stomp on each other.
  function initWormTrail() {
    if (reduceMotion) return;
    if (window.innerWidth < 1400) return;
    const wrap = document.querySelector('.worm-vertical-wrap');
    const fx = document.querySelector('.worm-vertical-fx');
    const endMark = document.getElementById('wormTrailEnd');
    const path = document.getElementById('wormTrailPath');
    const ball = document.getElementById('wormBall');
    if (!wrap || !fx || !endMark || !path || !ball) return;

    const trailHeight = endMark.getBoundingClientRect().top
      - wrap.getBoundingClientRect().top - 30;
    fx.style.height = trailHeight + 'px';

    const viewBoxHeight = path.ownerSVGElement.viewBox.baseVal.height;
    const pathLength = path.getTotalLength();
    gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

    const state = { progress: 0 };
    gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'top 80%',
        endTrigger: endMark,
        end: 'top 70%',
        scrub: 0.6,
      },
    })
      .to(path, { strokeDashoffset: 0, ease: 'none' }, 0)
      .to(state, {
        progress: 1,
        ease: 'none',
        onUpdate: () => {
          const pt = path.getPointAtLength(pathLength * state.progress);
          const yScale = trailHeight / viewBoxHeight;
          ball.style.transform = `translate(${pt.x - 15}px, ${pt.y * yScale - 15}px)`;
        },
      }, 0);
  }

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      fallbackReveal();
      initDynamicGridReveals();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    initReveals();
    initHeroParallax();
    initPlaneTrail();
    initWormTrail();
    initVmParallax();
    initVmWindmill();
    initCtaParallax();
    initAcademyValuesPin();
    initMarqueeDrag();
    initDynamicGridReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
