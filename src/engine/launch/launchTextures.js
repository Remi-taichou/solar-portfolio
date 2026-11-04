import * as THREE from 'three';

// Paints the rocket hull, the concrete pad and the steam noise onto canvases.
export function makeNoiseMap() {
  const S = 256, grid = (x, y, cells, seed) => {
    const fx = x / S * cells, fy = y / S * cells, xi = Math.floor(fx), yi = Math.floor(fy), u = fx - xi, v = fy - yi;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), w = a => (a % cells + cells) % cells;
    const h = (a, b) => { const n = Math.sin(w(a) * 127.1 + w(b) * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = grid(x, y, 6, 1) * .52 + grid(x, y, 12, 2) * .27 + grid(x, y, 24, 3) * .14 + grid(x, y, 48, 4) * .07, k = (y * S + x) * 4;
    data[k] = data[k + 1] = data[k + 2] = v * 255; data[k + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

function canvasTexture(canvas, srgb, renderer) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Paints the booster's paint, panel joints, rivets, soot and the owner's name, as colour, relief and gloss maps.
export function paintHull(renderer, small, name) {
  const W = small ? 1024 : 2048, H = small ? 2048 : 4096, sx = W / 2048, sy = H / 4096;
  const make = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  const colour = make(), relief = make(), gloss = make();
  const a = colour.getContext("2d"), b = relief.getContext("2d"), g = gloss.getContext("2d");
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  function paint() {
    a.setTransform(1, 0, 0, 1, 0, 0); b.setTransform(1, 0, 0, 1, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    a.fillStyle = "#dcd9d0"; a.fillRect(0, 0, W, H);
    b.fillStyle = "#808080"; b.fillRect(0, 0, W, H);
    g.fillStyle = "#8c8c8c"; g.fillRect(0, 0, W, H);
    // Long streaks from the tanks and from handling.
    for (let i = 0; i < 620; i++) {
      const x = rand() * W, y = rand() * H, len = (80 + rand() * 900) * sy, dark = rand() < .62;
      a.fillStyle = dark ? `rgba(70,66,60,${.012 + rand() * .035})` : `rgba(255,254,250,${.02 + rand() * .05})`;
      a.fillRect(x, y, (1 + rand() * 9) * sx, len);
      g.fillStyle = `rgba(${dark ? "200,200,200" : "60,60,60"},${.03 + rand() * .05})`;
      g.fillRect(x, y, (2 + rand() * 12) * sx, len);
    }
    // Panel joints running around the hull, each with a row of rivets.
    const rings = 13, seams = 8;
    for (let r = 1; r < rings; r++) {
      const y = Math.round(r / rings * H);
      a.fillStyle = "rgba(60,58,55,.42)"; a.fillRect(0, y, W, 3 * sy);
      a.fillStyle = "rgba(255,255,250,.3)"; a.fillRect(0, y + 3 * sy, W, 2 * sy);
      b.fillStyle = "#2c2c2c"; b.fillRect(0, y, W, 4 * sy);
      for (let x = 0; x < W; x += 15 * sx) {
        b.fillStyle = "#bdbdbd"; b.fillRect(x, y - 13 * sy, 4 * sx, 4 * sy); b.fillRect(x, y + 13 * sy, 4 * sx, 4 * sy);
      }
    }
    for (let s = 0; s < seams; s++) {
      const x = Math.round((s + .125) / seams * W);
      a.fillStyle = "rgba(60,58,55,.26)"; a.fillRect(x, 0, 2 * sx, H);
      b.fillStyle = "#4a4a4a"; b.fillRect(x, 0, 3 * sx, H);
    }
    // Frost bands where the cold propellant tanks sit.
    [[.14, .05], [.62, .04]].forEach(([top, h]) => {
      const f = a.createLinearGradient(0, top * H, 0, (top + h) * H);
      f.addColorStop(0, "rgba(255,255,255,0)"); f.addColorStop(.5, "rgba(244,248,255,.34)"); f.addColorStop(1, "rgba(255,255,255,0)");
      a.fillStyle = f; a.fillRect(0, top * H, W, h * H);
    });
    // Soot rising from the engines.
    const soot = a.createLinearGradient(0, H, 0, H * .78);
    soot.addColorStop(0, "rgba(20,19,18,.86)"); soot.addColorStop(.32, "rgba(30,28,26,.42)"); soot.addColorStop(1, "rgba(40,38,36,0)");
    a.fillStyle = soot; a.fillRect(0, H * .78, W, H * .22);
    for (let i = 0; i < 240; i++) {
      a.fillStyle = `rgba(22,20,18,${.03 + rand() * .1})`;
      const x = rand() * W, l = (160 + rand() * 720) * sy; a.fillRect(x, H - l, (3 + rand() * 18) * sx, l);
    }
    // Black band and the name, painted down the side facing the camera.
    a.fillStyle = "#16161a"; a.fillRect(0, H * .845, W, H * .012);
    const text = String(name).toUpperCase();
    a.save();
    a.translate(W * .5, H * .43);
    a.scale(.59, 1);
    a.rotate(-Math.PI / 2);
    let size = 340 * sy;
    a.font = `${size}px Bartomes, "Helvetica Neue", Arial, sans-serif`;
    const fit = H * .56 / Math.max(1, a.measureText(text).width);
    if (fit < 1) { size *= fit; a.font = `${size}px Bartomes, "Helvetica Neue", Arial, sans-serif`; }
    a.textAlign = "center"; a.textBaseline = "middle"; a.fillStyle = "#17181d";
    a.fillText(text, 0, 0);
    a.restore();
  }
  paint();
  const maps = { map: canvasTexture(colour, true, renderer), bumpMap: canvasTexture(relief, false, renderer), roughnessMap: canvasTexture(gloss, false, renderer) };
  // The name is repainted once the font has arrived.
  if (document.fonts && document.fonts.load) document.fonts.load("100px Bartomes").then(() => { paint(); Object.values(maps).forEach(t => { t.needsUpdate = true; }); });
  return maps;
}

export function paintApron(renderer, small) {
  const S = small ? 1024 : 2048, c = document.createElement("canvas"); c.width = c.height = S;
  const a = c.getContext("2d"), rand = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  a.fillStyle = "#b5afa4"; a.fillRect(0, 0, S, S);
  for (let i = 0; i < 26000; i++) { a.fillStyle = `rgba(${rand() < .5 ? "25,24,23" : "190,186,178"},${rand() * .05})`; const r = 1 + rand() * 7; a.fillRect(rand() * S, rand() * S, r, r); }
  for (let i = 0; i < 90; i++) {
    const x = rand() * S, y = rand() * S, r = (30 + rand() * 170) * S / 2048, gr = a.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(30,28,26,${.05 + rand() * .1})`); gr.addColorStop(1, "rgba(30,28,26,0)"); a.fillStyle = gr; a.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Expansion joints between concrete slabs.
  a.strokeStyle = "rgba(24,23,22,.55)"; a.lineWidth = 2 * S / 2048;
  for (let i = 0; i <= 18; i++) { const p = i / 18 * S; a.beginPath(); a.moveTo(p, 0); a.lineTo(p, S); a.moveTo(0, p); a.lineTo(S, p); a.stroke(); }
  // Burn marks fanning out from the flame trench.
  const mid = S / 2, burn = a.createRadialGradient(mid, mid, S * .02, mid, mid, S * .3);
  burn.addColorStop(0, "rgba(10,9,9,.92)"); burn.addColorStop(.45, "rgba(18,16,15,.55)"); burn.addColorStop(1, "rgba(20,18,17,0)");
  a.save(); a.translate(mid, mid); a.scale(1.5, .62); a.translate(-mid, -mid); a.fillStyle = burn; a.fillRect(-S, -S, S * 3, S * 3); a.restore();
  // The trench itself, and the road leading to the pad.
  a.fillStyle = "#0b0b0c"; a.fillRect(mid - S * .13, mid - S * .022, S * .26, S * .044);
  a.fillStyle = "rgba(42,41,40,.9)"; a.fillRect(mid - S * .03, mid + S * .06, S * .06, S * .44);
  a.fillStyle = "rgba(205,178,105,.16)"; for (let y = mid + S * .07; y < S; y += S * .03) a.fillRect(mid - S * .002, y, S * .004, S * .014);
  // Fade the edge of the slab into the surrounding ground.
  const edge = a.createRadialGradient(mid, mid, S * .3, mid, mid, S * .5);
  edge.addColorStop(0, "rgba(38,36,34,0)"); edge.addColorStop(1, "rgba(38,36,34,1)"); a.fillStyle = edge; a.fillRect(0, 0, S, S);
  return canvasTexture(c, true, renderer);
}
