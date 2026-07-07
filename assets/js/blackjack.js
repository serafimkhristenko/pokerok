/* Cabin blackjack: one hand against the dealer; a win reveals the +$600 bonus
   and the primary CTA (see #cabin-panel in index.html). Fair single-deck rules:
   dealer stands on 17, player 21 off the deal wins outright. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const root = $('bj');
  if (!root) return;

  const dealerRow = $('bj-dealer-cards'), playerRow = $('bj-player-cards');
  const dealerScore = $('bj-dealer-score'), playerScore = $('bj-player-score');
  const status = $('bj-status'), controls = $('bj-controls');
  const win = $('bj-win'), winHow = $('bj-win-how');
  const btnDeal = $('bj-deal'), btnHit = $('bj-hit'), btnStand = $('bj-stand'), btnAgain = $('bj-again');

  const SUITS = ['♠', '♥', '♦', '♣'];
  const RED = { '♥': 1, '♦': 1 };
  const RANKS = [['2',2],['3',3],['4',4],['5',5],['6',6],['7',7],['8',8],['9',9],['10',10],['В',10],['Д',10],['К',10],['Т',11]];

  let deck = [], player = [], dealer = [], holeEl = null, playing = false;

  function shuffle() {
    deck = [];
    for (const s of SUITS) for (const [r, v] of RANKS) deck.push({ r, s, v });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
  }
  // aces soften from 11 to 1 while the hand is bust
  function score(hand) {
    let sum = 0, aces = 0;
    for (const c of hand) { sum += c.v; if (c.v === 11) aces++; }
    while (sum > 21 && aces--) sum -= 10;
    return sum;
  }
  function cardEl(c, down) {
    const el = document.createElement('div');
    if (down) { el.className = 'bj-card bj-card--back'; return el; }
    el.className = 'bj-card' + (RED[c.s] ? ' bj-card--red' : '');
    el.innerHTML = '<span class="bj-card-rank">' + c.r + c.s + '</span><span class="bj-card-suit">' + c.s + '</span>';
    return el;
  }
  function draw(hand, row, down) {
    const c = deck.pop(); hand.push(c);
    const el = cardEl(c, down); row.appendChild(el);
    return el;
  }
  function revealHole() {
    if (!holeEl) return;
    holeEl.replaceWith(cardEl(dealer[1], false));
    holeEl = null;
  }
  function updateScores(showDealer) {
    playerScore.textContent = String(score(player));
    dealerScore.textContent = showDealer ? String(score(dealer))
      : (dealer.length ? score([dealer[0]]) + ' + ?' : '?');
  }
  // state: 'idle' | 'play' | 'over' (lost/push, replayable) | 'won'
  function setState(state) {
    btnDeal.hidden = state === 'play' || state === 'won';
    btnDeal.textContent = state === 'over' ? 'Сыграть ещё' : 'Раздать карты';
    btnHit.hidden = btnStand.hidden = state !== 'play';
    controls.hidden = state === 'won';
    status.hidden = state === 'won';
    win.hidden = state !== 'won';
  }
  function say(t) { status.textContent = t; }

  // pre-deal invitation: two face-down cards per row so the table never looks empty
  function idle() {
    playing = false; holeEl = null; player = []; dealer = [];
    dealerRow.innerHTML = ''; playerRow.innerHTML = '';
    for (let i = 0; i < 2; i++) { dealerRow.appendChild(cardEl(null, true)); playerRow.appendChild(cardEl(null, true)); }
    dealerScore.textContent = '?'; playerScore.textContent = '—';
    setState('idle');
    say('Одна раздача решает: обыграй дилера — и $600 твои.');
  }
  function deal() {
    shuffle(); player = []; dealer = []; playing = true;
    dealerRow.innerHTML = ''; playerRow.innerHTML = '';
    draw(player, playerRow); draw(dealer, dealerRow);
    draw(player, playerRow); holeEl = draw(dealer, dealerRow, true);
    updateScores(false);
    if (score(player) === 21) { revealHole(); updateScores(true); return won('Блэкджек с раздачи!'); }
    setState('play');
    say('Ещё карту или хватит?');
  }
  function hit() {
    if (!playing) return;
    draw(player, playerRow); updateScores(false);
    const p = score(player);
    if (p > 21) return lost('Перебор — ' + p + '. Дилеру повезло, возьми реванш!');
    if (p === 21) return stand();
    say('У тебя ' + p + '. Ещё карту или хватит?');
  }
  function stand() {
    if (!playing) return;
    revealHole();
    while (score(dealer) < 17) draw(dealer, dealerRow);
    updateScores(true);
    const p = score(player), d = score(dealer);
    if (d > 21) return won('У дилера перебор — ' + d);
    if (p > d) return won('Твои ' + p + ' против ' + d);
    if (p === d) { playing = false; setState('over'); return say('Ничья — ' + p + ' на ' + d + '. Решающая раздача?'); }
    lost('Дилер удержал ' + d + ' против твоих ' + p + '. Реванш?');
  }
  function lost(msg) {
    playing = false; revealHole(); updateScores(true);
    setState('over'); say(msg);
  }
  function won(how) {
    playing = false;
    winHow.textContent = how;
    setState('won');
  }

  btnDeal.addEventListener('click', deal);
  btnHit.addEventListener('click', hit);
  btnStand.addEventListener('click', stand);
  btnAgain.addEventListener('click', deal);
  idle();
})();
