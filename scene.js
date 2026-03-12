/* =========================================================
   Pasture — GBA Pixel Art Scene
   Pokémon Emerald ending credits aesthetic:
   wide cerulean sky · water horizon · jagged grass · llama
   240×160 native GBA resolution, scaled up via CSS.
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
  // Scene layout (Y coordinates in canvas pixels)
  // Sky:        0  → WATER_Y        (~55% of H)
  // Water:      WATER_Y → GRASS_Y   (~8% of H)
  // Grass edge: GRASS_Y → GROUND_Y  (~6% of H — jagged spikes)
  // Ground:     GROUND_Y → H        (~37% of H — flat fill)
  // =========================================================
  const WATER_Y  = 88;   // sky → water
  const GRASS_Y  = 101;  // water → grass spike zone
  const GROUND_Y = 112;  // flat grass starts here

  // =========================================================
  // Palette — Pokémon Emerald daytime
  // =========================================================
  const SKY_TOP   = '#5BBCD6';
  const SKY_HOR   = '#7ECFE0';   // lighter near horizon
  const WATER     = '#4A7FC1';
  const WATER_MID = '#5A9AD4';   // shimmer highlight row
  const CLOUD_W   = '#FFFFFF';
  const CLOUD_LAV = '#E8DFF5';
  const CLOUD_SHD = '#C4B4E8';
  const GRASS_TIP = '#2D5A0E';   // dark spike tips
  const GRASS_MID_COL = '#4A9A1E';
  const GRASS_BRT = '#6DCB3A';   // bright top of ground
  const GRASS_FLT = '#4A9A1E';   // mid flat ground
  const GRASS_DRK = '#3A7A14';   // lower flat ground

  // =========================================================
  // Clouds — four, placed in lower half of sky
  // Each: ox (base x, loops), y, w, h, spd (drift speed px/s)
  // =========================================================
  const CLOUD_DEFS = [
    { ox:  10, y: 52, w: 46, h: 18, spd: 6  },
    { ox:  85, y: 44, w: 60, h: 20, spd: 4  },
    { ox: 165, y: 58, w: 38, h: 14, spd: 7  },
    { ox: 215, y: 50, w: 28, h: 12, spd: 5  },
  ];

  // Draw one GBA-style chunky cloud at canvas position (cx, cy)
  function drawCloud(cx, cy, w, h) {
    cx = Math.floor(cx);
    cy = Math.floor(cy);

    // Bottom shadow band
    ctx.fillStyle = CLOUD_SHD;
    ctx.fillRect(cx + 4,             cy + h - 3, w - 8,            3);

    // Lavender mid-body
    ctx.fillStyle = CLOUD_LAV;
    ctx.fillRect(cx + 2,             cy + 5,     w - 4,            h - 5);

    // White bumps — left, centre-left, centre-right
    ctx.fillStyle = CLOUD_W;
    // Left bump
    ctx.fillRect(cx + 4,             cy + 2,     Math.ceil(w*0.28), h - 4);
    // Centre bump (tallest)
    ctx.fillRect(cx + Math.floor(w*0.28), cy,    Math.ceil(w*0.34), h - 2);
    // Right bump
    ctx.fillRect(cx + Math.floor(w*0.60), cy + 3, Math.ceil(w*0.26), h - 5);

    // Top highlight pixel row on tallest bump
    ctx.fillStyle = CLOUD_W;
    ctx.fillRect(cx + Math.floor(w*0.30), cy, Math.ceil(w*0.28), 1);
  }

  // =========================================================
  // Grass spike edge — pre-generated, deterministic
  // =========================================================
  // Seeded LCG so the pattern is consistent across frames
  let _rng = 31337;
  function rand() {
    _rng = (_rng * 1664525 + 1013904223) & 0x7fffffff;
    return _rng / 0x7fffffff;
  }

  // Generate spikes across 2× width for seamless tiling
  const SPIKES = [];
  let sx = 0;
  while (sx < W * 2 + 10) {
    const sw = 1 + Math.floor(rand() * 3);   // 1–3 px wide
    const sh = 3 + Math.floor(rand() * 9);   // 3–11 px tall
    SPIKES.push({ x: sx, w: sw, h: sh });
    sx += sw + (rand() < 0.3 ? 1 : 0);       // tiny gap occasionally
  }

  // =========================================================
  // Llama — procedural pixel art, 2-frame right-facing walk
  // bx, by = top-left corner of 18×26 bounding box
  // =========================================================
  function drawLlama(bx, by, frame) {
    const B = '#F5ECD7';   // off-white body
    const D = '#C4A882';   // darker beige shading
    const A = '#8B6340';   // brown accent / legs / eye
    const E = '#2C1A08';   // pupil

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
    r(12, 0, 2, 4, D);   // right ear, slightly darker

    // Head
    r(8,  3, 7, 5, B);
    r(8,  3, 7, 1, D);   // top shading
    p(13, 5, E);          // pupil
    p(14, 5, '#FFFFFF');  // eye highlight

    // Snout / muzzle
    r(13, 6, 3, 2, D);
    p(14, 7, A);          // nostril

    // Neck
    r(9,  8, 4, 6, B);
    r(9,  8, 1, 6, D);   // neck left-edge shadow

    // Body
    r(0,  13, 14, 5, B);
    r(0,  17, 14, 1, D); // belly shadow line
    r(0,  13, 1,  5, D); // left-edge shadow

    // Tail
    r(0, 14, 2, 3, D);
    p(0, 13, D);

    // Legs — 2 px wide × 7 px tall, 4 legs
    // Walking: alternating pairs shift 1 px vertically
    const fwd = frame === 0 ? 0 : 1;
    const bck = frame === 0 ? 1 : 0;

    // Back-left
    r(2,  18 + bck, 2, 6, A);
    r(2,  23 + bck, 2, 1, E);  // hoof
    // Back-right
    r(5,  18 + fwd, 2, 6, A);
    r(5,  23 + fwd, 2, 1, E);
    // Front-left
    r(10, 18 + fwd, 2, 6, A);
    r(10, 23 + fwd, 2, 1, E);
    // Front-right
    r(13, 18 + bck, 2, 6, A);
    r(13, 23 + bck, 2, 1, E);
  }

  // =========================================================
  // Draw sky — flat cerulean, dithered lighter near horizon
  // =========================================================
  function drawSky() {
    // Main sky fill
    ctx.fillStyle = SKY_TOP;
    ctx.fillRect(0, 0, W, WATER_Y);

    // Subtle horizon glow: dither SKY_TOP / SKY_HOR in last 10 rows
    const DITHER_START = WATER_Y - 10;
    for (let y = DITHER_START; y < WATER_Y; y++) {
      const progress = (y - DITHER_START) / 10; // 0→1
      // Checkerboard density increases toward horizon
      for (let x = 0; x < W; x++) {
        const threshold = Math.round(progress * 2); // 0,1, or 2
        if ((x + y) % 3 < threshold) {
          ctx.fillStyle = SKY_HOR;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  // =========================================================
  // Draw water band + shimmer
  // =========================================================
  function drawWater() {
    // Dithered 1-row transition: sky → water at WATER_Y
    for (let x = 0; x < W; x++) {
      ctx.fillStyle = (x % 2 === 0) ? SKY_HOR : WATER;
      ctx.fillRect(x, WATER_Y, 1, 1);
    }

    // Water body
    ctx.fillStyle = WATER;
    ctx.fillRect(0, WATER_Y + 1, W, GRASS_Y - WATER_Y - 2);

    // Shimmer highlight — a band of lighter pixels near vertical midpoint
    const shimY = Math.floor((WATER_Y + GRASS_Y) / 2);
    ctx.fillStyle = WATER_MID;
    for (let x = 0; x < W; x++) {
      if ((x + shimY) % 3 !== 0) ctx.fillRect(x, shimY, 1, 1);
    }
    // Faint second shimmer row
    ctx.fillStyle = '#8BBCE8';
    for (let x = 0; x < W; x++) {
      if ((x + shimY + 1) % 4 === 0) ctx.fillRect(x, shimY + 1, 1, 1);
    }

    // Dithered 1-row transition: water → grass at GRASS_Y - 1
    for (let x = 0; x < W; x++) {
      ctx.fillStyle = ((x + GRASS_Y) % 2 === 0) ? WATER : GRASS_TIP;
      ctx.fillRect(x, GRASS_Y - 1, 1, 1);
    }
  }

  // =========================================================
  // Draw grass spikes + flat ground fill
  // =========================================================
  function drawGrass(scrollOff) {
    // Flat ground fill first (everything from GRASS_Y down)
    ctx.fillStyle = GRASS_BRT;
    ctx.fillRect(0, GROUND_Y, W, 4);           // bright top strip

    ctx.fillStyle = GRASS_FLT;
    ctx.fillRect(0, GROUND_Y + 4, W, 10);     // mid ground

    ctx.fillStyle = GRASS_DRK;
    ctx.fillRect(0, GROUND_Y + 14, W, H - GROUND_Y - 14); // lower fill

    // Spike edge — drawn from GRASS_Y upward
    const off = Math.floor(scrollOff) % (W * 2);
    SPIKES.forEach(spike => {
      const x = ((spike.x - off) % (W * 2) + W * 2) % (W * 2);
      if (x >= W) return;

      // Dark tip (top 2px of spike)
      ctx.fillStyle = GRASS_TIP;
      ctx.fillRect(x, GRASS_Y - spike.h, spike.w, 2);

      // Mid-green body
      ctx.fillStyle = GRASS_MID_COL;
      ctx.fillRect(x, GRASS_Y - spike.h + 2, spike.w, spike.h - 2);
    });
  }

  // =========================================================
  // Animation loop
  // =========================================================
  let t0       = null;
  let llamaX   = -24;
  let legTimer = 0;
  let legFrame = 0;
  let grassScroll = 0; // grass spikes scroll very slowly

  function tick(now) {
    if (!t0) t0 = now;
    const elapsed = now - t0;
    const t = elapsed * 0.001; // seconds

    ctx.clearRect(0, 0, W, H);

    // 1 — Sky
    drawSky();

    // 2 — Clouds (drift left)
    CLOUD_DEFS.forEach(cloud => {
      const drift = t * cloud.spd;
      const rawX  = cloud.ox - drift;
      const x     = ((rawX % (W + cloud.w + 8)) + (W + cloud.w + 8)) % (W + cloud.w + 8) - cloud.w;
      drawCloud(x, cloud.y, cloud.w, cloud.h);
    });

    // 3 — Water
    drawWater();

    // 4 — Grass (spikes scroll very slowly for subtle ground motion)
    grassScroll = t * 8; // 8 px/s
    drawGrass(grassScroll);

    // 5 — Llama
    llamaX += 0.38;
    if (llamaX > W + 24) llamaX = -24;

    legTimer++;
    if (legTimer >= 11) { legFrame = (legFrame + 1) % 2; legTimer = 0; }

    // Feet land on GROUND_Y, sprite is 26px tall → top at GROUND_Y - 26
    drawLlama(Math.floor(llamaX), GROUND_Y - 26, legFrame);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
