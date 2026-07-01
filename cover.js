/* ===========================================================================
   QVAC Hackathon - generative project covers
   ---------------------------------------------------------------------------
   No project images yet, and we do NOT want AI-slop stock art. Instead every
   project gets a deterministic, on-brand cover built from its name + track:
   the QVAC "memory matrix" cell-grid texture, flat teal/track geometry, and a
   monogram. Same name always yields the same cover. If a project later has a
   real `image`, the layouts use that instead and skip this.

   Public API:
     qvacCover(project, color) -> SVG string (fills its container)
     monogram(name)            -> 1-2 letter initials
   =========================================================================== */
(function () {
  // FNV-1a string hash -> uint32 seed
  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  // mulberry32 PRNG
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function monogram(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "Q";
    if (words.length === 1) {
      const w = words[0];
      // split camelCase / internal caps (e.g. SnapChef -> SC)
      const caps = w.replace(/[^A-Za-z]/g, "").match(/[A-Z]/g);
      if (caps && caps.length >= 2) return (caps[0] + caps[1]).toUpperCase();
      return w.slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function qvacCover(project, color) {
    const W = 400, H = 240;
    const c = color || "#16E3C1";
    const seed = hash(project.id || project.name || "qvac");
    const rand = rng(seed);
    const uid = "c" + (seed % 100000) + (project.id ? "" : Math.floor(rand() * 999));
    const variant = seed % 4;       // 0..3 layout archetype
    const mono = monogram(project.name);

    // a seeded "memory matrix" chip: a rounded rect filled with the track
    // gradient + the QVAC cell-grid texture, placed differently per variant.
    const chip = [
      { x: 232, y: 40,  w: 132, h: 160 },   // right column
      { x: 40,  y: 120, w: 320, h: 86  },   // bottom band
      { x: 250, y: 96,  w: 110, h: 110 },   // right square
      { x: 40,  y: 40,  w: 150, h: 120 },   // left block
    ][variant];

    // a scatter of small flat cells (the "data" flowing toward the chip)
    let cells = "";
    const n = 5 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const s = 10 + Math.floor(rand() * 16);
      const x = 28 + Math.floor(rand() * 180);
      const y = 30 + Math.floor(rand() * 170);
      const filled = rand() > 0.55;
      const col = rand() > 0.5 ? c : "#16E3C1";
      cells += filled
        ? `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="${hexA(col, 0.18 + rand() * 0.22)}"/>`
        : `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="none" stroke="${hexA(col, 0.5)}" stroke-width="1.2"/>`;
    }
    // one or two thin connector lines toward the chip
    let lines = "";
    const cx = chip.x + chip.w / 2, cy = chip.y + chip.h / 2;
    for (let i = 0; i < 2; i++) {
      const x = 40 + Math.floor(rand() * 150);
      const y = 50 + Math.floor(rand() * 150);
      lines += `<path d="M${x} ${y} H${(x + cx) / 2} V${cy}" fill="none" stroke="${hexA(c, 0.35)}" stroke-width="1.2"/>`;
    }

    return `
<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(project.name || "Project").replace(/"/g, "")} cover">
  <defs>
    <linearGradient id="g_${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c}"/>
      <stop offset="0.55" stop-color="${c}" stop-opacity="0.86"/>
      <stop offset="1" stop-color="#0bbf9e" stop-opacity="0.9"/>
    </linearGradient>
    <pattern id="grid_${uid}" width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M9 0H0V9" fill="none" stroke="rgba(8,19,15,.55)" stroke-width="1"/>
    </pattern>
    <pattern id="faint_${uid}" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.035)" stroke-width="1"/>
    </pattern>
    <radialGradient id="amb_${uid}" cx="0.78" cy="0.12" r="0.9">
      <stop offset="0" stop-color="${hexA(c, 0.18)}"/>
      <stop offset="0.6" stop-color="${hexA(c, 0)}"/>
    </radialGradient>
    <clipPath id="chip_${uid}"><rect x="${chip.x}" y="${chip.y}" width="${chip.w}" height="${chip.h}" rx="10"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="#1b1f1c"/>
  <rect width="${W}" height="${H}" fill="url(#faint_${uid})"/>
  <rect width="${W}" height="${H}" fill="url(#amb_${uid})"/>

  ${lines}
  ${cells}

  <!-- the matrix chip -->
  <g clip-path="url(#chip_${uid})">
    <rect x="${chip.x}" y="${chip.y}" width="${chip.w}" height="${chip.h}" fill="url(#g_${uid})"/>
    <rect x="${chip.x}" y="${chip.y}" width="${chip.w}" height="${chip.h}" fill="url(#grid_${uid})"/>
  </g>
  <rect x="${chip.x}" y="${chip.y}" width="${chip.w}" height="${chip.h}" rx="10" fill="none" stroke="${hexA(c, 0.55)}" stroke-width="1"/>

  <!-- monogram -->
  <text x="34" y="210" font-family="Geist, ui-sans-serif, sans-serif" font-size="64" font-weight="700"
        fill="#ECF1EE" fill-opacity="0.9" letter-spacing="-2">${mono}</text>

  <!-- QVAC mark, faint -->
  <g transform="translate(350,24)" opacity="0.5">
    <path d="M22 8.2H19.6V4.1c0-.22-.08-.43-.23-.59L15.6.07A.86.86 0 0 0 14.98 0H1.94C1.7 0 1.47.1 1.31.27L.07 3.6A.84.84 0 0 0 0 3.93v6.02c0 .22.08.42.23.58l1.24 1.33c.16.17.39.27.62.27h12.84c.24 0 .47-.1.62-.27 0 0-1.98-2.23-2.13-2.23ZM15 9.95c0 .47-.38.85-.86.85H4.18a.86.86 0 0 1-.85-.85v-.53c0-.47.38-.85.85-.85h9.96c.24 0 .46.09.61.25l.01.01c.16.17.25.39.25.62v.5Z" fill="#16E3C1"/>
  </g>
</svg>`;
  }

  window.qvacCover = qvacCover;
  window.monogram = monogram;
})();
