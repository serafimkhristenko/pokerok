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

  // ── sticky header: solid background once scrolled ──
  const header = document.getElementById('site-header');

  if (reduce.matches) {                 // stacked fallback — native scroll, no pan
    window.addEventListener('scroll', () => {
      header.classList.toggle('solid', window.scrollY > 40);
    }, { passive: true });
    return;
  }

  const scroller = document.getElementById('scroller');
  const stage    = document.getElementById('stage');
  const pano      = document.getElementById('pano');
  const content   = document.getElementById('content');
  const beams     = document.getElementById('beams');
  const lbTop     = document.querySelector('.lb-top');
  const lbBot     = document.querySelector('.lb-bot');
  const hint      = document.getElementById('scroll-hint');
  const deckPanel = document.getElementById('deck-panel');
  const passPanel = document.getElementById('passage-panel');

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (x) => x * x * (3 - 2 * x);   // smoothstep
  let ticking = false;

  function render() {
    ticking = false;
    const vh = window.innerHeight;
    const y  = scroller.scrollTop;

    // 0 (deck) → 1 (cabin) across the whole stage
    const t = clamp(y / (stage.offsetHeight - vh), 0, 1);

    // narrow-zone factor — peaks (=1) at the middle passage
    const n = smooth(clamp(1 - Math.abs(t - 0.5) * 2, 0, 1));

    // camera sway — subtle horizontal drift driven by vertical scroll
    const sway = Math.sin(t * Math.PI * 2) * 8;

    // pan the background strip and the content up by two screens total
    const shift = -t * 2 * vh;
    pano.style.transform    = 'translate3d(' + (sway * 0.6) + 'px,' + shift + 'px,0)';
    content.style.transform = 'translate3d(' + (sway * 0.3) + 'px,' + shift + 'px,0)';

    // foreground beams sweep through the centre at t≈0.5 (faster → parallax)
    const beamsY = (0.5 - t) * 2 * vh;
    beams.style.transform = 'translate3d(' + sway + 'px,' + beamsY + 'px,0)';
    beams.style.opacity = n;

    // letterbox closes in on the passage
    const bar = (n * 15).toFixed(2) + 'vh';
    lbTop.style.height = bar;
    lbBot.style.height = bar;

    // neon teaser fades in only around the passage
    passPanel.style.opacity = clamp((n - 0.12) / 0.88, 0, 1);
    // deck content fades out as we leave the open deck
    deckPanel.style.opacity = clamp(1 - t * 2.4, 0, 1);

    hint.style.opacity = clamp(1 - t * 5, 0, 1);
    header.classList.toggle('solid', y > 40);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }

  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  render();
})();
