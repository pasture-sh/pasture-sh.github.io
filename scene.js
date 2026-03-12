/* =========================================================
   Pasture — Pixel Art Hero Scene
   ========================================================= */

(function () {
  'use strict';

  const canvas = document.getElementById('gba-scene');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 240, H = 160;
  canvas.width  = W;
  canvas.height = H;

  // ── Layout ────────────────────────────────────────────────
  const FAR_BASE  = 103;
  const NEAR_BASE = 119;
  const GROUND_Y  = 130;

  // ── Palette ───────────────────────────────────────────────
  const SKY        = '#5BBCD6';
  const SKY_HOR    = '#7DD4E8';
  const HILL_FAR   = '#7DC95E';
  const HILL_NEAR  = '#5BAF3A';
  const GROUND     = '#4A9A1E';
  const GROUND_SHD = '#3D8518';

  // ── Hills — sine-wave silhouettes ─────────────────────────
  const FAR_WAVES  = [
    { amp: 5, freq: 0.020, phase: 0.0 },
    { amp: 3, freq: 0.034, phase: 1.4 },
    { amp: 2, freq: 0.051, phase: 3.1 },
  ];
  const NEAR_WAVES = [
    { amp: 7, freq: 0.017, phase: 0.7 },
    { amp: 4, freq: 0.029, phase: 2.3 },
    { amp: 2, freq: 0.047, phase: 4.0 },
  ];

  function hillY(waves, base, x, offset) {
    let y = base;
    for (const w of waves) y += w.amp * Math.sin(x * w.freq + w.phase + offset);
    return Math.round(y);
  }

  // ── Clouds ────────────────────────────────────────────────
  // Fewer, more spread out, upper sky only
  const CLOUD_DEFS = [
    { ox:  15, y: 16, w: 58, h: 22, spd: 4.5 },
    { ox: 140, y: 11, w: 44, h: 18, spd: 3.2 },
    { ox: 220, y: 20, w: 36, h: 14, spd: 5.8 },
  ];

  function drawCloud(cx, cy, w, h) {
    cx = Math.floor(cx); cy = Math.floor(cy);
    // Shadow base
    ctx.fillStyle = '#C8BAE8';
    ctx.fillRect(cx + 5, cy + h - 3, w - 10, 3);
    // Body
    ctx.fillStyle = '#EDE6FF';
    ctx.fillRect(cx + 2, cy + 5, w - 4, h - 6);
    // White bumps — drawn fully within body so they can't leak outside
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + 5,              cy + 2, Math.ceil(w * 0.28), h - 5);
    ctx.fillRect(cx + Math.floor(w * 0.30), cy,     Math.ceil(w * 0.34), h - 3);
    ctx.fillRect(cx + Math.floor(w * 0.64), cy + 4, Math.ceil(w * 0.24), h - 7);
  }

  // ── Llama ─────────────────────────────────────────────────
  // Draws facing right; pass flip=true to mirror
  function drawLlama(bx, by, frame, flip) {
    const B = '#F5ECD7';
    const D = '#D4B896';
    const A = '#8B6340';
    const E = '#2C1A08';

    if (flip) {
      ctx.save();
      ctx.translate(bx + 18, 0);
      ctx.scale(-1, 1);
      bx = 0;
    }

    function r(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(bx+x, by+y, w, h); }
    function p(x, y, c)        { ctx.fillStyle = c; ctx.fillRect(bx+x, by+y, 1, 1); }

    // Ears
    r(9,  0, 2, 3, B); r(12, 0, 2, 4, D);
    // Head
    r(8,  3, 7, 5, B); r(8, 3, 7, 1, D);
    p(13, 5, E);        p(14, 4, '#FFFFFF');
    // Muzzle
    r(13, 6, 3, 2, D);  p(14, 7, A);
    // Neck
    r(9,  8, 4, 6, B);  r(9, 8, 1, 6, D);
    // Body
    r(0, 13, 14, 5, B); r(0, 17, 14, 1, D); r(0, 13, 1, 5, D);
    // Tail
    r(0, 14, 2, 3, D);
    // Legs
    const fwd = frame === 0 ? 0 : 1;
    const bck = 1 - fwd;
    r(2,  18+bck, 2, 6, A); r(2,  23+bck, 2, 1, E);
    r(5,  18+fwd, 2, 6, A); r(5,  23+fwd, 2, 1, E);
    r(10, 18+fwd, 2, 6, A); r(10, 23+fwd, 2, 1, E);
    r(13, 18+bck, 2, 6, A); r(13, 23+bck, 2, 1, E);

    if (flip) ctx.restore();
  }

  // ── Llama state machine ───────────────────────────────────
  // States: 'walk' | 'graze'
  // Grazing = stopped, head bobs slowly
  let llX          = 85;
  let llVX         = 0.14;
  let llFaceRight  = true;
  let llState      = 'walk';
  let llTimer      = 0;
  let llDuration   = randDur('walk');
  let legTimer     = 0;
  let legFrame     = 0;

  function randDur(state) {
    // walk: 4–12 s at 60fps ≈ 240–720 frames
    // graze: 3–9 s ≈ 180–540 frames
    return state === 'walk'
      ? 240 + Math.floor(Math.random() * 480)
      : 180 + Math.floor(Math.random() * 360);
  }

  function pickNextState() {
    if (llState === 'graze') {
      // After grazing, start walking (slight right preference)
      llState      = 'walk';
      llFaceRight  = Math.random() > 0.35;
      llVX         = (0.10 + Math.random() * 0.14) * (llFaceRight ? 1 : -1);
    } else {
      // After walking: 40% chance to graze, else change direction or keep going
      if (Math.random() < 0.4) {
        llState = 'graze';
        llVX    = 0;
      } else {
        llFaceRight = Math.random() > 0.35;
        llVX        = (0.10 + Math.random() * 0.14) * (llFaceRight ? 1 : -1);
      }
    }
    llDuration = randDur(llState);
    llTimer    = 0;
  }

  function updateLlama() {
    llTimer++;
    if (llTimer >= llDuration) pickNextState();

    if (llState === 'walk') {
      llX += llVX;
      // Soft wrap — fade out at edges
      if (llX > W + 30) llX = -30;
      if (llX < -30)    llX = W + 30;

      // Leg animation
      legTimer++;
      if (legTimer >= 13) { legFrame = (legFrame + 1) % 2; legTimer = 0; }
    }
    // While grazing, legs stay still (legFrame unchanged)
  }

  // ── Animation loop ────────────────────────────────────────
  const FAR_SPD  = 0.008;
  const NEAR_SPD = 0.016;
  let t0 = null;

  function tick(now) {
    if (!t0) t0 = now;
    const t = (now - t0) * 0.001;

    // Fill entire canvas with sky first — eliminates any white-pixel bleed
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);

    // Clouds (only drawn in sky zone — y < 95)
    CLOUD_DEFS.forEach(cloud => {
      const loop = W + cloud.w + 8;
      const x    = ((cloud.ox - t * cloud.spd) % loop + loop) % loop - cloud.w;
      drawCloud(x, cloud.y, cloud.w, cloud.h);
    });

    // Far hills — fill from silhouette to canvas bottom
    // (near hills + ground will overdraw; this guarantees no gaps)
    ctx.fillStyle = HILL_FAR;
    for (let x = 0; x < W; x++) {
      const y = hillY(FAR_WAVES, FAR_BASE, x, t * FAR_SPD);
      ctx.fillRect(x, y, 1, H - y);
    }

    // Near hills — same pattern, overwrites far hill in their zone
    ctx.fillStyle = HILL_NEAR;
    for (let x = 0; x < W; x++) {
      const y = hillY(NEAR_WAVES, NEAR_BASE, x, t * NEAR_SPD);
      ctx.fillRect(x, y, 1, H - y);
    }

    // Flat ground — overwrites bottom of near hills
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Llama
    updateLlama();

    // Grazing head bob: offset y by 1px on a slow 1.5s cycle
    const graze_bob = llState === 'graze'
      ? Math.round(Math.sin(t * 2.1) * 0.8)
      : 0;

    drawLlama(Math.floor(llX), GROUND_Y - 26 + graze_bob, legFrame, !llFaceRight);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
