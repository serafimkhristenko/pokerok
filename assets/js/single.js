(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  // header solid on scroll
  const header = document.getElementById('site-header');
  const onScroll = () => header.classList.toggle('solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ── count-up when a number scrolls into view ──
  function countUp(el) {
    if (el._done) return; el._done = true;
    const end = +el.getAttribute('data-count');
    const prefix = el.getAttribute('data-prefix') || '';
    const group = el.getAttribute('data-group');
    const fmt = (n) => { n = Math.round(n); return group ? n.toLocaleString('ru-RU') : String(n); };
    if (reduce) { el.textContent = prefix + fmt(end); return; }
    const dur = 1500, t0 = performance.now();
    (function frame(t) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = prefix + fmt(end * e);
      if (k < 1) requestAnimationFrame(frame);
    })(t0);
  }

  // ── reveal + count-up triggers ──
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll && en.target.querySelectorAll('[data-count]').forEach(countUp);
        if (en.target.hasAttribute && en.target.hasAttribute('data-count')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    document.querySelectorAll('[data-count]').forEach(countUp);
  }

  // ── FOMO countdown — personal 60-min deadline in localStorage ──
  (function fomo() {
    const el = document.getElementById('fomo-clock');
    if (!el) return;
    const KEY = 'pokerok_fomo_deadline', WINDOW = 60 * 60 * 1000;
    const deadline = () => {
      let d = parseInt(localStorage.getItem(KEY) || '', 10);
      if (!d || isNaN(d) || d - Date.now() > WINDOW) { d = Date.now() + WINDOW; localStorage.setItem(KEY, d); }
      return d;
    };
    function tick() {
      let s = Math.floor((deadline() - Date.now()) / 1000);
      if (s <= 0) { localStorage.setItem(KEY, Date.now() + WINDOW); s = WINDOW / 1000; }
      el.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }
    tick(); setInterval(tick, 1000);
  })();

  // ── live counters — grow over time ──
  (function live() {
    const players = document.getElementById('ls-players');
    const paid = document.getElementById('ls-paid');
    if (!players && !paid) return;
    let p = 154280, m = 24680500;
    const fmt = (n) => n.toLocaleString('ru-RU');
    function tick() {
      p += Math.floor(Math.random() * 31) - 12; if (p < 154280) p = 154280 + Math.floor(Math.random() * 20);
      m += Math.floor(Math.random() * 9000) + 1500;
      if (players) players.textContent = fmt(p);
      if (paid) paid.textContent = '$' + fmt(m);
    }
    tick(); setInterval(tick, 2600);
  })();
})();
