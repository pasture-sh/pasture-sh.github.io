/* =========================================================
   Pasture — GBA Pixel Art Scene
   Canvas renders at 240×160 (GBA native resolution).
   CSS scales it up with image-rendering: pixelated for
   authentic chunky-pixel look.

   Aesthetic: Pokémon Emerald ending credits — layered
   rolling hills, golden-hour dusk sky, wandering llama.
   ========================================================= */

(function () {
  'use strict';

  const canvas = document.getElementById('gba-scene');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // --- Virtual resolution (GBA native) ---
  const W = 240;
  const H = 160;
  canvas.width  = W;
  canvas.height = H;

  // =========================================================
  // Palette — warm Pokémon Emerald dusk
  // =========================================================

  // Sky: horizontal color bands, top → bottom
  const SKY_BANDS = [
    { y:  0, col: '#fce860' }, // bright gold
    { y: 14, col: '#f8b838' }, // amber
    { y: 28, col: '#f09030' }, // orange
    { y: 42, col: '#e86840' }, // red-orange
    { y: 56, col: '#d04858' }, // coral
    { y: 70, col: '#a03470' }, // rose
    { y: 82, col: '#6c2478' }, // purple
    { y: 94, col: '#3c1460' }, // deep indigo
  ];

  // Hill layers: far (pale, warm) → near (dark, cool)
  const HILL_COL = [
    '#a0d060', // 0 far — sunlit pale green
    '#72b048', // 1
    '#4e9038', // 2
    '#307028', // 3
    '#1c4c18', // 4 near — dark forest
  ];

  // Tree colours per hill layer
  const TREE_COL = ['#286828', '#205820', '#185018', '#104010', '#0c3010'];
  const TRUNK_COL = '#2c1008';

  // =========================================================
  // Hill geometry — sine-wave combo for organic rolls
  // =========================================================
  // Each layer: { base (0‒1 of H), amp, freq, phase, speed }
  const LAYERS = [
    { base: 0.60, amp:  7, freq: 0.013, phase: 0.00, spd: 0.06 },
    { base: 0.67, amp: 10, freq: 0.017, phase: 1.80, spd: 0.11 },
    { base: 0.74, amp: 12, freq: 0.022, phase: 0.70, spd: 0.18 },
    { base: 0.82, amp:  9, freq: 0.028, phase: 3.20, spd: 0.28 },
    { base: 0.90, amp:  7, freq: 0.016, phase: 1.10, spd: 0.42 },
  ];

  function hillY(layer, x, t) {
    const s = x * layer.freq + layer.phase + t * layer.spd;
    return Math.round(H * layer.base + layer.amp * (Math.sin(s) + 0.55 * Math.sin(s * 1.73 + 0.4)));
  }

  // =========================================================
  // Clouds — blocky pixel-art rectangles
  // =========================================================
  const CLOUDS = [
    { ox: 18,  y: 14, w: 34, h: 9,  spd: 0.20 },
    { ox: 130, y:  8, w: 24, h: 7,  spd: 0.14 },
    { ox: 72,  y: 26, w: 18, h: 6,  spd: 0.26 },
    { ox: 195, y: 18, w: 16, h: 5,  spd: 0.18 },
  ];

  function drawCloud(cx, cy, w, h) {
    ctx.fillStyle = '#f8f0d0';
    cx = Math.floor(cx);
    cy = Math.floor(cy);
    // Base rectangle
    ctx.fillRect(cx,           cy + 3,           w,            h - 3);
    // Left bump
    ctx.fillRect(cx + 3,       cy,               Math.ceil(w * 0.42), h - 2);
    // Right bump
    ctx.fillRect(cx + Math.floor(w * 0.40), cy + 2, Math.ceil(w * 0.32), h - 4);
  }

  // =========================================================
  // Sun — pixel circle with dithered glow halo
  // =========================================================
  const SUN_X = 168, SUN_Y = 22, SUN_R = 10;

  function drawSun() {
    // Dithered halo rings
    for (let ring = SUN_R + 1; ring <= SUN_R + 8; ring++) {
      const frac = (SUN_R + 8 - ring) / 8; // 1 at inner edge, 0 at outer
      ctx.fillStyle = ring <= SUN_R + 4 ? '#f8e040' : '#f4b820';
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > ring - 0.7 && d < ring + 0.7) {
            // Checkerboard dither weighted by frac
            if ((dx + dy + ring) % Math.max(1, Math.round(1 / frac)) === 0) {
              ctx.fillRect(SUN_X + dx, SUN_Y + dy, 1, 1);
            }
          }
        }
      }
    }
    // Sun body
    ctx.fillStyle = '#fff8a0';
    for (let dy = -SUN_R; dy <= SUN_R; dy++) {
      for (let dx = -SUN_R; dx <= SUN_R; dx++) {
        if (dx * dx + dy * dy <= SUN_R * SUN_R) {
          ctx.fillRect(SUN_X + dx, SUN_Y + dy, 1, 1);
        }
      }
    }
    // Bright pixel centre
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(SUN_X - 3, SUN_Y - 3, 6, 6);
  }

  // =========================================================
  // Trees — pixel-art triangle + trunk
  // =========================================================
  function drawTree(tx, ty, layerIdx) {
    const sz = Math.max(2, 5 - layerIdx); // farther = smaller
    // Trunk
    ctx.fillStyle = TRUNK_COL;
    ctx.fillRect(tx, ty - sz, 2, sz);
    // Canopy: triangle using horizontal rows
    ctx.fillStyle = TREE_COL[layerIdx];
    for (let row = 0; row < sz * 3; row++) {
      const hw = Math.ceil(row * 0.55);
      ctx.fillRect(tx - hw, ty - sz - row, hw * 2 + 2, 1);
    }
  }

  // Tree anchor offsets per layer (spread across 2× width for seamless tiling)
  const TREE_OFFSETS = [
    [40, 110, 185],        // layer 0 (far)
    [25, 80, 145, 210],    // layer 1
    [15, 68, 130, 200],    // layer 2
    [30, 95, 160],         // layer 3
    [],                    // layer 4 (none on near ground)
  ];

  function drawTreesForLayer(layerIdx, t) {
    const layer = LAYERS[layerIdx];
    TREE_OFFSETS[layerIdx].forEach(ox => {
      // Scroll at half the hill scroll speed so they move with terrain
      const rawX = ox - t * layer.spd * 25;
      const x = Math.floor(((rawX % (W + 30)) + (W + 30)) % (W + 30));
      if (x >= W) return;
      const y = hillY(layer, x, t);
      drawTree(x, y, layerIdx);
    });
  }

  // =========================================================
  // Llama — procedural pixel art, 2-frame walk
  // Drawn from bottom of feet upward.
  // =========================================================
  function drawLlama(bx, by, frame) {
    const B = '#d4a848'; // tan body
    const D = '#a87830'; // shadow / legs
    const S = '#7c5420'; // deep shadow / hooves
    const E = '#1c1008'; // eye

    function r(x, y, w, h, c) {
      ctx.fillStyle = c;
      ctx.fillRect(bx + x, by + y, w, h);
    }
    function p(x, y, c) {
      ctx.fillStyle = c;
      ctx.fillRect(bx + x, by + y, 1, 1);
    }

    // Llama faces right. bx,by = top-left of a 18×26 bounding box.
    // by + 26 = ground level (feet bottom).

    // --- Ears (top-left of head area) ---
    r(9, 0, 2, 3, B);   // left ear
    r(12, 0, 2, 4, B);  // right ear (slightly taller)

    // --- Head ---
    r(8, 3, 7, 5, B);
    p(13, 4, E);         // eye
    p(14, 4, '#ffffff'); // eye highlight (1px)
    // Snout / muzzle
    r(13, 6, 3, 2, D);
    p(14, 7, S);         // nostril

    // --- Neck ---
    r(9, 8, 4, 5, B);

    // --- Body ---
    r(1, 12, 13, 5, B);
    // Belly shadow
    r(2, 16, 11, 1, D);
    // Tail
    r(0, 13, 2, 3, D);
    p(0, 12, D);

    // --- Legs (4 legs, 2px wide × 6px tall) ---
    // Walking: frame 0 = back legs fwd / front legs back
    //          frame 1 = back legs back / front legs fwd
    const fwd = frame === 0 ? 1 : 0;  // 1 = shifted 1px down (swing forward)
    const bck = frame === 0 ? 0 : 1;

    // Back-left leg
    r(2,  18 + bck, 2, 6, D);
    r(2,  23 + bck, 2, 1, S); // hoof
    // Back-right leg
    r(5,  18 + fwd, 2, 6, D);
    r(5,  23 + fwd, 2, 1, S);
    // Front-left leg
    r(10, 18 + fwd, 2, 6, D);
    r(10, 23 + fwd, 2, 1, S);
    // Front-right leg
    r(13, 18 + bck, 2, 6, D);
    r(13, 23 + bck, 2, 1, S);
  }

  // =========================================================
  // Sky draw with dithered band transitions
  // =========================================================
  function drawSky() {
    // Fill solid bands
    for (let i = 0; i < SKY_BANDS.length; i++) {
      const y0 = SKY_BANDS[i].y;
      const y1 = (i + 1 < SKY_BANDS.length) ? SKY_BANDS[i + 1].y : H;
      ctx.fillStyle = SKY_BANDS[i].col;
      ctx.fillRect(0, y0, W, y1 - y0);
    }
    // Dither 2-row transition at each band boundary
    for (let i = 0; i < SKY_BANDS.length - 1; i++) {
      const y   = SKY_BANDS[i + 1].y;
      const c0  = SKY_BANDS[i].col;
      const c1  = SKY_BANDS[i + 1].col;
      for (let x = 0; x < W; x++) {
        // Row y: checkerboard
        ctx.fillStyle = ((x + y) % 2 === 0) ? c0 : c1;
        ctx.fillRect(x, y, 1, 1);
        // Row y+1: inverted checkerboard
        ctx.fillStyle = ((x + y) % 2 === 0) ? c1 : c0;
        ctx.fillRect(x, y + 1, 1, 1);
      }
    }
  }

  // =========================================================
  // Hills + trees
  // =========================================================
  function drawHillsAndTrees(t) {
    // Draw far → near so each layer overdrawing the previous
    for (let li = 0; li < LAYERS.length; li++) {
      const layer = LAYERS[li];
      ctx.fillStyle = HILL_COL[li];
      for (let x = 0; x < W; x++) {
        const y = Math.max(0, Math.min(H - 1, hillY(layer, x, t)));
        ctx.fillRect(x, y, 1, H - y);
      }
      // Trees sit on top of this layer's fill,
      // but will be overdrawn by nearer hills — correct parallax behaviour
      drawTreesForLayer(li, t);
    }
  }

  // =========================================================
  // Main animation loop
  // =========================================================
  let t0 = null;
  let llamaX  = -20;   // logical x in GBA canvas pixels
  let legTimer = 0;
  let legFrame = 0;

  function tick(now) {
    if (!t0) t0 = now;
    const t = (now - t0) * 0.001; // seconds

    ctx.clearRect(0, 0, W, H);

    // 1. Sky
    drawSky();

    // 2. Sun
    drawSun();

    // 3. Clouds (drift left to right slowly)
    CLOUDS.forEach(cloud => {
      const rawX = cloud.ox + t * cloud.spd * 8;
      const x = ((rawX % (W + cloud.w + 4)) + (W + cloud.w + 4)) % (W + cloud.w + 4) - cloud.w;
      drawCloud(x, cloud.y, cloud.w, cloud.h);
    });

    // 4. Hills & trees
    drawHillsAndTrees(t);

    // 5. Llama — walks on the near hill (layer 4)
    llamaX += 0.45;
    if (llamaX > W + 24) llamaX = -24;

    legTimer++;
    if (legTimer >= 10) { legFrame = (legFrame + 1) % 2; legTimer = 0; }

    const nearLayer = LAYERS[4];
    const safeX     = Math.max(0, Math.min(W - 1, Math.floor(llamaX + 9)));
    const groundY   = hillY(nearLayer, safeX, t);
    drawLlama(Math.floor(llamaX), groundY - 26, legFrame);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
