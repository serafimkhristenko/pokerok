(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ── lazily load the cabin background once the browser is idle ──
  const cabinBg    = document.querySelector('#cabin-screen .bg');
  const cabinPanel = document.getElementById('cabin-panel');
  const cabinSrc = getComputedStyle(document.documentElement)
    .getPropertyValue('--cabin-src').trim().replace(/^['"]|['"]$/g, '');
  function loadCabin() {
    const img = new Image();
    img.onload = () => {
      const url = "url('" + cabinSrc + "')";
      if (cabinBg) cabinBg.style.backgroundImage = url;
      if (reduce.matches && cabinPanel) cabinPanel.style.backgroundImage = url;
    };
    img.src = cabinSrc;
  }
  if ('requestIdleCallback' in window) requestIdleCallback(loadCabin, { timeout: 1500 });
  else setTimeout(loadCabin, 600);

  const header = document.getElementById('site-header');

  // ── count-up: animates [data-count] numbers when revealed ──
  function countUp(el, dur) {
    if (el._counted) return; el._counted = true;
    const end = +el.getAttribute('data-count');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const group  = el.getAttribute('data-group');
    const fmt = (n) => {
      n = Math.round(n);
      return group ? n.toLocaleString('ru-RU') : String(n);
    };
    if (reduce.matches || !window.gsap) { el.textContent = prefix + fmt(end) + suffix; return; }
    const o = { v: 0 };
    window.gsap.to(o, { v: end, duration: dur || 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = prefix + fmt(o.v) + suffix; } });
  }
  const counters = Array.from(document.querySelectorAll('[data-count]'));

  // ════════════════════════════════════════════════
  // reduced-motion: stacked fallback, no scroll-jack
  // ════════════════════════════════════════════════
  if (reduce.matches || !window.gsap || !window.ScrollTrigger) {
    counters.forEach((el) => countUp(el));
    window.addEventListener('scroll', () => {
      header.classList.toggle('solid', window.scrollY > 40);
    }, { passive: true });
    return;
  }

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  // ── Lenis smooth scroll, wired into GSAP's ticker + ScrollTrigger ──
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.4 });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const stage   = document.getElementById('stage');
  const pano     = document.getElementById('pano');
  const content  = document.getElementById('content');
  const beams    = document.getElementById('beams');
  const lbTop    = document.querySelector('.lb-top');
  const lbBot    = document.querySelector('.lb-bot');
  const hint     = document.getElementById('scroll-hint');
  const deckPanel = document.getElementById('deck-panel');
  const passPanel = document.getElementById('passage-panel');
  const props    = Array.from(document.querySelectorAll('.prop'));

  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (x) => x * x * (3 - 2 * x);

  let mx = 0, my = 0;          // mouse offset, -1..1
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let progress = 0;

  function render() {
    const vh = window.innerHeight;
    const t = progress;
    const n = smooth(clamp(1 - Math.abs(t - 0.5) * 2, 0, 1));   // narrow-zone peak at middle
    const sway = Math.sin(t * Math.PI * 2) * 8;
    const shift = -t * 2 * vh;

    pano.style.transform    = 'translate3d(' + (sway * 0.6) + 'px,' + shift + 'px,0)';
    content.style.transform = 'translate3d(' + (sway * 0.3) + 'px,' + shift + 'px,0)';

    const beamsY = (0.5 - t) * 2 * vh;
    beams.style.transform = 'translate3d(' + sway + 'px,' + beamsY + 'px,0)';
    beams.style.opacity = n;

    const bar = (n * 15).toFixed(2) + 'vh';
    lbTop.style.height = bar; lbBot.style.height = bar;

    passPanel.style.opacity = clamp((n - 0.12) / 0.88, 0, 1);
    deckPanel.style.opacity = clamp(1 - t * 2.4, 0, 1);
    hint.style.opacity = clamp(1 - t * 5, 0, 1);
    header.classList.toggle('solid', t > 0.02);
  }

  // floating props run on every frame (mouse parallax + idle bob + scroll drift)
  const depths = props.map((p) => +p.getAttribute('data-depth') || 0.2);
  function updateProps(time) {
    const t = progress;
    const deckVis = clamp(1 - t * 2.2, 0, 1);
    for (let i = 0; i < props.length; i++) {
      const d = depths[i];
      const bob = Math.sin(time / 900 + i) * 10 * deckVis;
      const px = mx * d * 60 * deckVis;
      const py = my * d * 60 * deckVis + bob - t * d * 240;
      props[i].style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
    }
  }
  gsap.ticker.add(updateProps);

  // master scrubbed timeline driving the descent
  window.ScrollTrigger.create({
    trigger: stage, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => {
      progress = self.progress;
      render();
      // reveal acts + fire count-ups at the right moments
      deckPanel.classList.toggle('in', progress < 0.25);
      const cabinIn = progress > 0.78;
      cabinPanel.classList.toggle('in', cabinIn);
      if (cabinIn) counters.filter((c) => c.closest('#cabin-panel')).forEach((c) => countUp(c));
    }
  });

  // neon sign breathing pulse in the passage
  const neon = document.querySelector('.neon-sign');
  if (neon) gsap.to(neon, { filter: 'brightness(1.18)', duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // hero badge count-up shortly after load
  gsap.delayedCall(0.5, () => counters.filter((c) => c.closest('#deck-panel')).forEach((c) => countUp(c)));
  // deck pillars reveal on load
  gsap.delayedCall(0.3, () => deckPanel.classList.add('in'));

  render();
  window.addEventListener('resize', () => { window.ScrollTrigger.refresh(); render(); });
})();
