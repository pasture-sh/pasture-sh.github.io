/* =========================================================
   Pasture — Pixel Art Hero Scene
   Mood: Pokémon Emerald ending credits · modern indie game
   Aesthetic: clean, readable, serene — not rough homebrew

   Canvas: 240×160 (GBA res) → CSS image-rendering:pixelated
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

  // =========================================================
  // Scene layout
  // =========================================================
  const SKY_END    = 95;   // sky occupies y 0–94 (~60%)
  const HILL_FAR_Y = 95;   // far hill band starts here
  const HILL_FAR_END  = 115;
  const HILL_NEAR_END = 130;
  const GROUND_Y   = 130;  // flat grass y=130–160

  // =========================================================
  // Palette
  // =========================================================
  const SKY       = '#5BBCD6';
  const SKY_HOR   = '#7DD4E8';   // single horizon edge row
  const HILL_FAR  = '#7DC95E';
  const HILL_NEAR = '#5BAF3A';
  const GROUND    = '#4A9A1E';
  const GROUND_SHD = '#3D8518'; // slight shadow strip at ground top

  // =========================================================
  // Hills — two sine-wave layers, precomputed each frame
  // =========================================================
  // Far hill: gentle, low amplitude
  const FAR_HILL = [
    { amp: 5,  freq: 0.020, phase: 0.0  },
    { amp: 3,  freq: 0.034, phase: 1.4  },
    { amp: 2,  freq: 0.051, phase: 3.1  },
  ];
  // Near hill: slightly more roll
  const NEAR_HILL = [
    { amp: 7,  freq: 0.017, phase: 0.7  },
    { amp: 4,  freq: 0.029, phase: 2.3  },
    { amp: 2,  freq: 0.047, phase: 4.0  },
  ];

  // Base y for each hill (midline of the sine)
  const FAR_BASE  = 103;  // mid of far band
  const NEAR_BASE = 119;  // mid of near band

  function hillY(waves, base, x, offset) {
    let y = base;
    for (const w of waves) {
      y += w.amp * Math.sin(x * w.freq + w.phase + offset);
    }
    return Math.round(y);
  }

  // =========================================================
  // Clouds — soft, rounded, minimal
  // 3 clouds, upper sky, drifting left
  // =========================================================
  const CLOUD_DEFS = [
    { ox:  20, y: 18, w: 52, h: 20, spd: 5.5 },
    { ox: 110, y: 12, w: 68, h: 24, spd: 3.8 },
    { ox: 200, y: 22, w: 40, h: 16, spd: 6.2 },
  ];

  // Cloud palette: 3-shade (white highlight · lavender body · soft shadow)
  function drawCloud(cx, cy, w, h) {
    cx = Math.floor(cx);
    cy = Math.floor(cy);

    // Shadow base
    ctx.fillStyle = '#C8BAE8';
    ctx.fillRect(cx + 5,               cy + h - 4, w - 10,           4);

    // Lavender-white body
    ctx.fillStyle = '#EDE6FF';
    ctx.fillRect(cx + 2,               cy + 5,     w - 4,            h - 5);

    // White bumps — left, centre (tallest), right
    const bh = h - 3;
    ctx.fillStyle = '#FFFFFF';
    // Left bump
    const lw = Math.ceil(w * 0.30);
    ctx.fillRect(cx + 4,               cy + 2,     lw,               bh - 2);
    // Centre bump
    const cw = Math.ceil(w * 0.36);
    ctx.fillRect(cx + Math.floor(w*0.28), cy,      cw,               bh);
    // Right bump
    const rw = Math.ceil(w * 0.24);
    ctx.fillRect(cx + Math.floor(w*0.63), cy + 4,  rw,               bh - 4);

    // Tiny pixel softening on sharp corners (1px trim)
    ctx.fillStyle = '#EDE6FF';
    ctx.fillRect(cx + 2, cy + 3, 2, 2);                      // top-left
    ctx.fillRect(cx + w - 4, cy + 4, 2, 2);                  // top-right
  }

  // =========================================================
  // Llama — procedural pixel art, 2-frame walk, facing right
  // Palette per spec: cream body, beige shading, brown accent
  // bx, by = top-left of 18×26 bounding box
  // =========================================================
  function drawLlama(bx, by, frame) {
    const B = '#F5ECD7';   // cream body
    const D = '#D4B896';   // beige shading
    const A = '#8B6340';   // brown accent / legs
    const E = '#2C1A08';   // dark eye

    function r(x, y, w, h, c) {
      ctx.fillStyle = c;
      ctx.fillRect(bx + x, by + y, w, h);
    }
    function p(x, y, c) {
      ctx.fillStyle = c;
      ctx.fillRect(bx + x, by + y, 1, 1);
    }

    // Ears
    r(9,  0, 2, 3, B);
    r(12, 0, 2, 4, D);

    // Head
    r(8,  3, 7, 5, B);
    r(8,  3, 7, 1, D);   // top shading line
    p(13, 5, E);          // pupil
    p(14, 4, '#FFFFFF');  // catchlight

    // Muzzle
    r(13, 6, 3, 2, D);
    p(14, 7, A);          // nostril dot

    // Neck
    r(9,  8, 4, 6, B);
    r(9,  8, 1, 6, D);   // left-edge shadow

    // Body
    r(0,  13, 14, 5, B);
    r(0,  17, 14, 1, D); // belly shadow
    r(0,  13, 1,  5, D); // left-edge shadow

    // Tail
    r(0,  14, 2, 3, D);

    // Legs — 2×7, walking alternation (1px vertical shift)
    const fwd = frame === 0 ? 0 : 1;
    const bck = frame === 0 ? 1 : 0;

    r(2,  18 + bck, 2, 6, A);  r(2,  23 + bck, 2, 1, E);
    r(5,  18 + fwd, 2, 6, A);  r(5,  23 + fwd, 2, 1, E);
    r(10, 18 + fwd, 2, 6, A);  r(10, 23 + fwd, 2, 1, E);
    r(13, 18 + bck, 2, 6, A);  r(13, 23 + bck, 2, 1, E);
  }

  // =========================================================
  // Animation loop
  // =========================================================
  let t0       = null;
  let llamaX   = -24;
  let legTimer = 0;
  let legFrame = 0;

  // Far/near hill scroll offsets (far moves slower)
  const FAR_SPD  = 0.008;
  const NEAR_SPD = 0.016;

  function tick(now) {
    if (!t0) t0 = now;
    const t = (now - t0) * 0.001;

    ctx.clearRect(0, 0, W, H);

    // ── Sky ──────────────────────────────────────────────
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, SKY_END);

    // Single clean horizon edge row
    ctx.fillStyle = SKY_HOR;
    ctx.fillRect(0, SKY_END - 1, W, 1);

    // ── Clouds ───────────────────────────────────────────
    CLOUD_DEFS.forEach(cloud => {
      const drift = t * cloud.spd;
      const rawX  = cloud.ox - drift;
      const loop  = W + cloud.w + 10;
      const x     = ((rawX % loop) + loop) % loop - cloud.w;
      drawCloud(x, cloud.y, cloud.w, cloud.h);
    });

    // ── Far hills ────────────────────────────────────────
    ctx.fillStyle = HILL_FAR;
    for (let x = 0; x < W; x++) {
      const y = hillY(FAR_HILL, FAR_BASE, x, t * FAR_SPD);
      const top = Math.max(HILL_FAR_Y, Math.min(HILL_FAR_END, y));
      ctx.fillRect(x, top, 1, HILL_FAR_END - top);
    }
    // Solid fill below far hills to HILL_FAR_END
    ctx.fillStyle = HILL_FAR;
    ctx.fillRect(0, HILL_FAR_END - 1, W, 2); // ensure no gap

    // ── Near hills ───────────────────────────────────────
    ctx.fillStyle = HILL_NEAR;
    for (let x = 0; x < W; x++) {
      const y = hillY(NEAR_HILL, NEAR_BASE, x, t * NEAR_SPD);
      const top = Math.max(HILL_FAR_END - 2, Math.min(HILL_NEAR_END, y));
      ctx.fillRect(x, top, 1, HILL_NEAR_END - top);
    }
    ctx.fillRect(0, HILL_NEAR_END - 1, W, 2); // ensure no gap

    // ── Flat ground ──────────────────────────────────────
    ctx.fillStyle = GROUND_SHD;
    ctx.fillRect(0, GROUND_Y, W, 3);           // thin shadow strip at top
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, GROUND_Y + 3, W, H - GROUND_Y - 3);

    // ── Llama ────────────────────────────────────────────
    llamaX += 0.22;                             // slower walk
    if (llamaX > W + 24) llamaX = -24;

    legTimer++;
    if (legTimer >= 13) { legFrame = (legFrame + 1) % 2; legTimer = 0; }

    // Feet at GROUND_Y, sprite 26px tall → top at GROUND_Y - 26
    drawLlama(Math.floor(llamaX), GROUND_Y - 26, legFrame);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
