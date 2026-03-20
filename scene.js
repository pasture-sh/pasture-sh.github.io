/* =========================================================
   Pasture — Environment Scene
   Theme is polled every rAF frame — no MutationObserver,
   no event timing races. lerpPalette() always blends the
   two constant palette objects so parseHex never sees NaN.
   ========================================================= */

(function () {
  'use strict';

  // ── Palettes ──────────────────────────────────────────────

  const MORNING = {
    skyTop:      '#BFD8E2',
    skyBottom:   '#8FB5C1',
    horizonGlow: '#F7E8C8',
    farLayer:    '#B8C9A7',
    midLayer:    '#91A97D',
    nearLayer:   '#718D63',
  };

  const EVENING = {
    skyTop:      '#5C7A9A',
    skyBottom:   '#C4905E',
    horizonGlow: '#F0B040',
    farLayer:    '#A08E74',
    midLayer:    '#7D6D52',
    nearLayer:   '#5B5040',
  };

  // ── Color helpers ─────────────────────────────────────────

  function parseHex(h) {
    const c = h.replace('#', '');
    return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
  }

  function lerpColor(a, b, t) {
    const ca = parseHex(a), cb = parseHex(b);
    return 'rgb(' +
      Math.round(ca[0]+(cb[0]-ca[0])*t) + ',' +
      Math.round(ca[1]+(cb[1]-ca[1])*t) + ',' +
      Math.round(ca[2]+(cb[2]-ca[2])*t) + ')';
  }

  // Always blends MORNING → EVENING using raw hex strings
  function lerpPalette(t) {
    if (t <= 0) return MORNING;
    if (t >= 1) return EVENING;
    const out = {};
    for (const k of Object.keys(MORNING)) out[k] = lerpColor(MORNING[k], EVENING[k], t);
    return out;
  }

  function hexToRgba(hex, a) {
    const [r,g,b] = parseHex(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── Theme state ───────────────────────────────────────────

  const TRANS_MS  = 420;
  let themeTarget = 0;   // 0 = morning, 1 = evening (desired)
  let themeVisual = 0;   // current rendered position [0..1]
  let transFrom   = 0;   // visual position at transition start
  let transStart  = -1;  // rAF timestamp when transition began

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // ── Canvas + context ──────────────────────────────────────

  const heroCanvas = document.getElementById('pasture-scene');
  const dlCanvas   = document.getElementById('dl-scene');
  const heroCtx    = heroCanvas ? heroCanvas.getContext('2d') : null;
  const dlCtx      = dlCanvas   ? dlCanvas.getContext('2d')   : null;

  function syncSize(canvas) {
    const w = canvas.offsetWidth  | 0;
    const h = canvas.offsetHeight | 0;
    if (canvas.width  !== w) canvas.width  = w;
    if (canvas.height !== h) canvas.height = h;
    return [w, h];
  }

  // ── Drawing ───────────────────────────────────────────────

  function drawSky(ctx, w, h, pal) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.skyTop);
    g.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawVignette(ctx, w, h) {
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.35);
    top.addColorStop(0, 'rgba(0,0,0,0.14)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h);
    const bot = ctx.createLinearGradient(0, h * 0.72, 0, h);
    bot.addColorStop(0, 'rgba(0,0,0,0)');
    bot.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGlow(ctx, w, h, pal, yFrac) {
    const cx = w * 0.5, cy = h * yFrac;
    const rx = w * 0.75, ry = h * 0.18;
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0,   hexToRgba(pal.horizonGlow, 0.36));
    g.addColorStop(0.5, hexToRgba(pal.horizonGlow, 0.10));
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLayer(ctx, w, h, color, yPos, crestH, baseH, ox) {
    const ov = w * 0.18, hy = h * yPos, cr = h * crestH;
    ctx.beginPath();
    ctx.moveTo(-ov+ox,       hy+cr*0.30);
    ctx.bezierCurveTo(w*0.08+ox, hy-cr*0.10, w*0.20+ox, hy-cr*0.62, w*0.32+ox, hy-cr*0.58);
    ctx.bezierCurveTo(w*0.47+ox, hy-cr*0.54, w*0.60+ox, hy+cr*0.06, w*0.72+ox, hy-cr*0.12);
    ctx.bezierCurveTo(w*0.85+ox, hy-cr*0.28, w*0.97+ox, hy+cr*0.14, w+ov+ox,   hy+cr*0.18);
    ctx.lineTo(w+ov+ox, h+h*baseH);
    ctx.lineTo(-ov+ox,  h+h*baseH);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function renderScene(ctx, w, h, pal, farOff, nearOff, glowY, layers) {
    drawSky     (ctx, w, h, pal);
    drawVignette(ctx, w, h);
    drawGlow    (ctx, w, h, pal, glowY);
    for (const L of layers) drawLayer(ctx, w, h, pal[L.key], L.y, L.ch, L.bh, L.ox(farOff, nearOff));
  }

  const HERO_LAYERS = [
    { key: 'farLayer',  y: 0.60, ch: 0.16, bh: 0.25, ox: (f)  =>  f },
    { key: 'midLayer',  y: 0.70, ch: 0.18, bh: 0.28, ox: (f,n) => -n * 0.25 },
    { key: 'nearLayer', y: 0.80, ch: 0.20, bh: 0.31, ox: (f,n) => -n },
  ];

  const DL_LAYERS = [
    { key: 'farLayer',  y: 0.38, ch: 0.16, bh: 0.55, ox: (f)   =>  f },
    { key: 'midLayer',  y: 0.52, ch: 0.18, bh: 0.44, ox: (f,n)  => -n * 0.25 },
    { key: 'nearLayer', y: 0.65, ch: 0.20, bh: 0.35, ox: (f,n)  => -n },
  ];

  // ── Animation loop ────────────────────────────────────────

  function tick(now) {
    // Poll theme every frame — no MutationObserver timing issues
    const target = isDark() ? 1 : 0;

    if (target !== themeTarget) {
      themeTarget = target;
      transFrom   = themeVisual;
      transStart  = now;
    }

    if (transStart >= 0) {
      const t   = Math.min((now - transStart) / TRANS_MS, 1);
      themeVisual = transFrom + (themeTarget - transFrom) * t;
      if (t >= 1) { themeVisual = themeTarget; transStart = -1; }
    }

    const pal = lerpPalette(themeVisual);

    if (heroCtx) {
      const [w, h] = syncSize(heroCanvas);
      if (w && h) {
        const f = w * 0.07 * Math.sin(now / 18000 * Math.PI * 2);
        const n = w * 0.08 * Math.sin(now / 12000 * Math.PI * 2);
        renderScene(heroCtx, w, h, pal, f, n, 0.62, HERO_LAYERS);
      }
    }

    if (dlCtx) {
      const [w, h] = syncSize(dlCanvas);
      if (w && h) {
        const f = w * 0.07 * Math.sin(now / 18000 * Math.PI * 2);
        const n = w * 0.08 * Math.sin(now / 12000 * Math.PI * 2);
        renderScene(dlCtx, w, h, pal, f, n, 0.42, DL_LAYERS);
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

})();
