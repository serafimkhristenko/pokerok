(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.getElementById('site-header');

  // image-relative focal points of each act (fractions of the panorama height)
  const DECK_F = 0.10;   // deck: start at the very top so faces/sky stay in frame
  const METAL_F = 0.583; // narrow metal passage (pipes)
  const CABIN_F = 0.80;  // cabin: poker table

  // ── count-up: animates [data-count] numbers when revealed ──
  function countUp(el, dur) {
    if (el._counted) return; el._counted = true;
    const end = +el.getAttribute('data-count');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const group  = el.getAttribute('data-group');
    const fmt = (n) => { n = Math.round(n); return group ? n.toLocaleString('ru-RU') : String(n); };
    if (reduce.matches || !window.gsap) { el.textContent = prefix + fmt(end) + suffix; return; }
    const o = { v: 0 };
    window.gsap.to(o, { v: end, duration: dur || 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = prefix + fmt(o.v) + suffix; } });
  }
  const counters = Array.from(document.querySelectorAll('[data-count]'));

  const pad = (n) => String(n).padStart(2, '0');

  // ── FOMO countdown — personal 60-min deadline persisted in localStorage ──
  (function startFomoClock() {
    const el = document.getElementById('fomo-clock');
    if (!el) return;
    const KEY = 'pokerok_fomo_deadline';
    const WINDOW = 60 * 60 * 1000; // 60 minutes
    function deadline() {
      let d = parseInt(localStorage.getItem(KEY) || '', 10);
      if (!d || isNaN(d) || d - Date.now() > WINDOW) { d = Date.now() + WINDOW; localStorage.setItem(KEY, d); }
      return d;
    }
    function tick() {
      let left = Math.floor((deadline() - Date.now()) / 1000);
      if (left <= 0) { localStorage.setItem(KEY, Date.now() + WINDOW); left = WINDOW / 1000; } // soft restart
      el.textContent = pad(Math.floor(left / 60)) + ':' + pad(left % 60);
    }
    tick(); setInterval(tick, 1000);
  })();

  // ── live counters — start fixed, then grow over time (social proof) ──
  (function startLiveStats() {
    const players = document.getElementById('ls-players');
    const paid = document.getElementById('ls-paid');
    if (!players && !paid) return;
    let p = 154280, m = 24680500;
    const fmt = (n) => n.toLocaleString('ru-RU');
    function tick() {
      p += Math.floor(Math.random() * 31) - 12;           // drifts, net upward
      if (p < 154280) p = 154280 + Math.floor(Math.random() * 20);
      m += Math.floor(Math.random() * 9000) + 1500;       // always ticks up
      if (players) players.textContent = fmt(p);
      if (paid) paid.textContent = '$' + fmt(m);
    }
    tick(); setInterval(tick, 2600);
  })();

  // ════════ reduced-motion: stacked fallback, no scroll-jack ════════
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
  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.4 });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const stage    = document.getElementById('stage');
  const pano     = document.getElementById('pano');
  const panoImg  = document.getElementById('pano-img');
  const content  = document.getElementById('content');
  const lbTop    = document.querySelector('.lb-top');
  const lbBot    = document.querySelector('.lb-bot');
  const hint     = document.getElementById('scroll-hint');
  const deckPanel = document.getElementById('deck-panel');
  const cabinPanel = document.getElementById('cabin-panel');
  const passPanel = document.getElementById('passage-panel');

  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (x) => x * x * (3 - 2 * x);
  const lerp   = (a, b, u) => a + (b - a) * u;

  let progress = 0;

  function render() {
    const vh = window.innerHeight;
    const t = progress;
    const n = smooth(clamp(1 - Math.abs(t - 0.5) * 2, 0, 1));   // narrow-zone peak at the metal passage
    const sway = Math.sin(t * Math.PI * 2) * 8;

    // background: pan the single strip so each act's focal point sits centred
    const imgH = pano.offsetHeight || (pano.clientWidth * 2.9425);
    const centerF = t < 0.5 ? lerp(DECK_F, METAL_F, t / 0.5)
                            : lerp(METAL_F, CABIN_F, (t - 0.5) / 0.5);
    let bgY = -(centerF * imgH - vh / 2);
    bgY = clamp(bgY, -(imgH - vh), 0);
    pano.style.transform = 'translate3d(' + (sway * 0.5) + 'px,' + bgY + 'px,0)';

    // content panels ride along (deck @0, passage @100vh, cabin @200vh)
    content.style.transform = 'translate3d(' + (sway * 0.3) + 'px,' + (-t * 2 * vh) + 'px,0)';

    const bar = (n * 15).toFixed(2) + 'vh';
    lbTop.style.height = bar; lbBot.style.height = bar;

    passPanel.style.opacity = clamp((n - 0.12) / 0.88, 0, 1);
    deckPanel.style.opacity = clamp(1 - t * 2.4, 0, 1);
    hint.style.opacity = clamp(1 - t * 5, 0, 1);
    header.classList.toggle('solid', t > 0.02);
  }

  window.ScrollTrigger.create({
    trigger: stage, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => {
      progress = self.progress;
      render();
      deckPanel.classList.toggle('in', progress < 0.25);
      const cabinIn = progress > 0.78;
      cabinPanel.classList.toggle('in', cabinIn);
      if (cabinIn) counters.filter((c) => c.closest('#cabin-panel')).forEach((c) => countUp(c));
    }
  });

  const neon = document.querySelector('.neon-sign');
  if (neon) gsap.to(neon, { filter: 'brightness(1.18)', duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // primary CTA — gentle pulse so it reads as THE action
  gsap.to('.cta--primary', { scale: 1.045, duration: 0.95, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  gsap.delayedCall(0.5, () => counters.filter((c) => c.closest('#deck-panel')).forEach((c) => countUp(c)));
  gsap.delayedCall(0.3, () => deckPanel.classList.add('in'));

  // recompute once the panorama image has its real height
  function refresh() { window.ScrollTrigger.refresh(); render(); }
  if (panoImg.complete) refresh(); else panoImg.addEventListener('load', refresh);
  render();
  window.addEventListener('resize', refresh);
})();
