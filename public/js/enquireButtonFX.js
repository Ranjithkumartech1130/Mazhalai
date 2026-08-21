// ==========================================
// Mazhalai Preschool — Neon Liquid "Enquire" Button FX
// ==========================================
// Drives every .btn-enquire button on the page: the magnetic 3D hover
// tilt + cursor shine, and the sparkle burst (painted on a shared
// full-page canvas so N buttons don't need N canvases). Pure visual
// layer — click handling / opening the enquiry form lives in admissionForm.js
// and only depends on the outer element keeping the
// "js-open-admission-form" class, which this script never touches.
// ==========================================

(function () {
  const CYCLE_MS = 5000; // keep in sync with --eq-cycle in css/enquireButton.css
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injectDefsOnce() {
    if (document.getElementById('eqSvgDefs')) return;
    const wrap = document.createElement('div');
    wrap.id = 'eqSvgDefs';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    wrap.innerHTML =
      '<svg><defs>' +
      '<filter id="eqGoo">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />' +
      '<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />' +
      '<feComposite in="SourceGraphic" in2="goo" operator="atop"/>' +
      '</filter>' +
      '</defs></svg>';
    document.body.appendChild(wrap);
  }

  function layoutButton(btn) {
    const h = btn.offsetHeight;
    if (!h) return;
    btn.style.setProperty('--eq-head-px', h + 'px');
  }

  function layoutAll(buttons) {
    buttons.forEach(layoutButton);
  }

  /* -------------------- magnetic tilt + cursor shine -------------------- */
  function setupTilt(buttons) {
    const maxDist = 220;
    const maxTilt = 8;
    const maxMag = 8;

    function resetOne(btn) {
      btn.style.setProperty('--eq-tiltX', '0deg');
      btn.style.setProperty('--eq-tiltY', '0deg');
      btn.style.setProperty('--eq-magX', '0px');
      btn.style.setProperty('--eq-magY', '0px');
      const shine = btn.querySelector('.eq-cursor-shine');
      if (shine) shine.style.opacity = 0;
    }

    window.addEventListener('mousemove', (e) => {
      buttons.forEach((btn) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist > maxDist) { resetOne(btn); return; }

        const proximity = 1 - dist / maxDist;
        const tiltY = (dx / (r.width / 2)) * maxTilt;
        const tiltX = -(dy / (r.height / 2)) * maxTilt;
        const magX = (dx / maxDist) * maxMag * proximity;
        const magY = (dy / maxDist) * maxMag * proximity;

        btn.style.setProperty('--eq-tiltX', tiltX.toFixed(2) + 'deg');
        btn.style.setProperty('--eq-tiltY', tiltY.toFixed(2) + 'deg');
        btn.style.setProperty('--eq-magX', magX.toFixed(2) + 'px');
        btn.style.setProperty('--eq-magY', magY.toFixed(2) + 'px');

        const shine = btn.querySelector('.eq-cursor-shine');
        if (shine) {
          const px = ((e.clientX - r.left) / r.width) * 100;
          const py = ((e.clientY - r.top) / r.height) * 100;
          shine.style.setProperty('--eq-px', px + '%');
          shine.style.setProperty('--eq-py', py + '%');
          shine.style.opacity = (0.2 + proximity * 0.3).toFixed(2);
        }
      });
    });

    document.addEventListener('mouseleave', () => buttons.forEach(resetOne));
  }

  /* -------------------- sparkle burst (shared canvas) -------------------- */
  function setupSparkles(buttons) {
    const canvas = document.getElementById('eqSparkleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function burstFor(btn) {
      const r = btn.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return; // off-screen / hidden
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const count = 42;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        particles.push({
          x: cx + (Math.random() - 0.5) * r.width * 0.9,
          y: cy + (Math.random() - 0.5) * r.height * 1.4,
          vx: Math.cos(angle) * speed * 0.4,
          vy: Math.sin(angle) * speed * 0.4 - 0.6,
          r: 1 + Math.random() * 2.6,
          life: 0,
          maxLife: 40 + Math.random() * 40,
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }

    function drawStar(x, y, r, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.15, r * 0.15, r, 0);
        ctx.quadraticCurveTo(r * 0.15, -r * 0.15, 0, 0);
      }
      ctx.closePath();
      ctx.fillStyle = '#fff59d';
      ctx.shadowColor = '#FFE600';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01;
        p.twinkle += 0.2;
        const lifeRatio = p.life / p.maxLife;
        const alpha = Math.sin(Math.min(lifeRatio, 1) * Math.PI);
        const size = p.r * (1 + Math.sin(p.twinkle) * 0.3);
        drawStar(p.x, p.y, size * 3, Math.max(alpha, 0));
      });
      particles = particles.filter((p) => p.life < p.maxLife);
      requestAnimationFrame(tick);
    }
    tick();

    function loop() {
      buttons.forEach(burstFor);
    }
    setTimeout(function first() {
      loop();
      setInterval(loop, CYCLE_MS);
    }, CYCLE_MS * 0.5); // ~50% mark, right when the fill completes
  }

  function init() {
    const buttons = Array.from(document.querySelectorAll('.btn-enquire'));
    if (!buttons.length) return;

    injectDefsOnce();

    if (!document.getElementById('eqSparkleCanvas')) {
      const c = document.createElement('canvas');
      c.id = 'eqSparkleCanvas';
      document.body.appendChild(c);
    }

    layoutAll(buttons);
    window.addEventListener('resize', () => layoutAll(buttons));

    if (reduceMotion) return; // CSS already freezes the animations; skip the extra JS FX

    setupTilt(buttons);
    setupSparkles(buttons);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
