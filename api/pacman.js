const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME     = 'bkness';
const TARGET_REPO  = 'bkness';

// ── contribution data ────────────────────────────────────────────────────────

async function fetchContributions() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `{
        user(login: "${USERNAME}") {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }`,
    }),
  });
  const json = await res.json();
  return json.data.user.contributionsCollection.contributionCalendar.weeks;
}

// ── path: row-by-row (horizontal, like real Pac-Man) ─────────────────────────

function buildPath(weeks) {
  const path = [];
  for (let row = 0; row < 7; row++) {
    const cols = [];
    for (let col = 0; col < weeks.length; col++) {
      if (row < weeks[col].contributionDays.length) cols.push(col);
    }
    if (row % 2 !== 0) cols.reverse();
    for (const col of cols) path.push([col, row]);
  }
  return path;
}

// ── month labels ─────────────────────────────────────────────────────────────

function getMonthLabels(weeks) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const labels = [];
  let lastMonth = -1;
  for (let col = 0; col < weeks.length; col++) {
    const days = weeks[col].contributionDays;
    if (!days.length) continue;
    const month = new Date(days[0].date).getUTCMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      labels.push({ col, name: MONTHS[month] });
    }
  }
  return labels;
}

// ── color ────────────────────────────────────────────────────────────────────

function countToColor(count) {
  if (count === 0) return null;
  if (count < 3)   return '#0e4429';
  if (count < 6)   return '#006d32';
  if (count < 9)   return '#26a641';
  return                  '#39d353';
}

// ── pac-man path shape ───────────────────────────────────────────────────────

function pacmanD(cx, cy, R, dir, open) {
  const angle = open ? Math.PI / 7 : 0.01;
  const cos   = Math.cos(angle);
  const sin   = Math.sin(angle);
  const sign  = dir === 0 ? 1 : -1;
  const x1    = (cx + sign * R * cos).toFixed(2);
  const y1    = (cy - R * sin).toFixed(2);
  const x2    = (cx + sign * R * cos).toFixed(2);
  const y2    = (cy + R * sin).toFixed(2);
  const sweep = dir === 0 ? 0 : 1;
  return `M${cx},${cy} L${x1},${y1} A${R},${R} 0 1,${sweep} ${x2},${y2} Z`;
}

// ── ghost body path ──────────────────────────────────────────────────────────

function ghostBodyD(SZ) {
  const R  = SZ / 2;
  const s1 = SZ / 3;
  const s2 = (SZ * 2) / 3;
  const pk = SZ * 0.72;
  return [
    `M0,${SZ}`,
    `L0,${R}`,
    `A${R},${R} 0 0,1 ${SZ},${R}`,
    `L${SZ},${SZ}`,
    `Q${(s2 + s1 / 2).toFixed(2)},${pk.toFixed(2)} ${s2.toFixed(2)},${SZ}`,
    `Q${(s1 + s1 / 2).toFixed(2)},${pk.toFixed(2)} ${s1.toFixed(2)},${SZ}`,
    `Q${(s1 / 2).toFixed(2)},${pk.toFixed(2)} 0,${SZ}`,
    `Z`,
  ].join(' ');
}

// ── ghost AI: pre-compute frame positions ────────────────────────────────────
//
// Each ghost has a personality:
//   blinky (red)   — direct chaser: 5 steps behind pac-man
//   pinky  (pink)  — ambusher:      targets 4 steps ahead of pac-man
//   inky   (cyan)  — flanker:       12 steps behind, scatter mid-right
//   clyde  (orange)— patrol:        18 steps behind, retreats to corner when close
//
// Scatter/chase cycle mirrors real Pac-Man (~7s scatter, ~20s chase at 0.085s/frame)

function ghostPositions(path, mode, COLS) {
  const TOTAL   = path.length;
  const SCATTER = 82;    // ~7s
  const CHASE   = 235;   // ~20s
  const CYCLE   = SCATTER + CHASE;

  const corners = {
    blinky: [COLS - 2, 0],
    pinky:  [1,        0],
    inky:   [COLS - 2, 6],
    clyde:  [1,        6],
  };

  return Array.from({ length: TOTAL }, (_, i) => {
    const inScatter = (i % CYCLE) < SCATTER;
    if (inScatter) return corners[mode];

    switch (mode) {
      case 'blinky':
        return path[(i + TOTAL - 5) % TOTAL];
      case 'pinky':
        return path[(i + 4) % TOTAL];
      case 'inky':
        return path[(i + TOTAL - 12) % TOTAL];
      case 'clyde': {
        const myPos  = path[(i + TOTAL - 18) % TOTAL];
        const pacPos = path[i];
        const dist   = Math.abs(myPos[0] - pacPos[0]) + Math.abs(myPos[1] - pacPos[1]);
        return dist < 8 ? corners.clyde : myPos;
      }
      default:
        return path[(i + TOTAL - 8) % TOTAL];
    }
  });
}

// ── ghost SVG element ────────────────────────────────────────────────────────

function ghostSVG(positions, fill, DUR, STEP, HDR, SZ) {
  const R      = SZ / 2;
  const off    = (STEP - SZ) / 2;   // center ghost (slightly wider than grid cell)
  const txVals = positions.map(([c, r]) =>
    `${(c * STEP + off).toFixed(1)} ${(HDR + r * STEP + off).toFixed(1)}`
  ).join(';');
  const body   = ghostBodyD(SZ);
  const ex1    = (R * 0.50).toFixed(1);
  const ex2    = (R * 1.50).toFixed(1);
  const ey     = (R * 0.68).toFixed(1);
  const er     = (R * 0.38).toFixed(1);
  const pr     = (R * 0.20).toFixed(1);

  return `<g>
  <animateTransform attributeName="transform" type="translate"
    values="${txVals}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
  <path d="${body}" fill="${fill}"/>
  <circle cx="${ex1}" cy="${ey}" r="${er}" fill="white"/>
  <circle cx="${ex2}" cy="${ey}" r="${er}" fill="white"/>
  <circle cx="${ex1}" cy="${ey}" r="${pr}" fill="url(#ghostPupil)"/>
  <circle cx="${ex2}" cy="${ey}" r="${pr}" fill="url(#ghostPupil)"/>
</g>`;
}

// ── maze wall overlay ────────────────────────────────────────────────────────
//
// Outer border, ghost house with pink door, vertical pillars, and T-wall stubs
// that evoke the classic Pac-Man maze without disrupting the grid layout.

function mazeWalls(W, HDR, STEP, COLS) {
  const C  = '#1a6fd4';
  const sw = 2.5;
  const lc = 'round';

  const ghCol = Math.floor(COLS / 2) - 2;
  const ghX   = ghCol * STEP;
  const ghY   = HDR + 2 * STEP;
  const ghW   = 5 * STEP;
  const ghH   = 3 * STEP;
  const gapW  = STEP;
  const gapX  = ghX + (ghW - gapW) / 2;

  const lines = [
    // outer border
    `<rect x="1.5" y="${(HDR + 1.5).toFixed(1)}" width="${W - 3}" height="${(7 * STEP - 1).toFixed(1)}" fill="none" stroke="${C}" stroke-width="3" rx="6"/>`,

    // ghost house — U-shape (sides + bottom)
    `<path d="M${ghX},${ghY} L${ghX},${ghY + ghH} L${ghX + ghW},${ghY + ghH} L${ghX + ghW},${ghY}" fill="none" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}" stroke-linejoin="round"/>`,

    // ghost house door (pink centre segment)
    `<line x1="${ghX}"          y1="${ghY}" x2="${gapX}"          y2="${ghY}" stroke="${C}"     stroke-width="${sw}"/>`,
    `<line x1="${gapX + gapW}"  y1="${ghY}" x2="${ghX + ghW}"     y2="${ghY}" stroke="${C}"     stroke-width="${sw}"/>`,
    `<line x1="${gapX}"         y1="${ghY}" x2="${gapX + gapW}"   y2="${ghY}" stroke="#ff9ecf" stroke-width="${sw + 0.5}"/>`,

    // left vertical pillar
    `<line x1="${5.5 * STEP}" y1="${HDR + STEP * 1.5}" x2="${5.5 * STEP}" y2="${HDR + STEP * 5.5}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,
    // right vertical pillar (mirror)
    `<line x1="${(COLS - 5.5) * STEP}" y1="${HDR + STEP * 1.5}" x2="${(COLS - 5.5) * STEP}" y2="${HDR + STEP * 5.5}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,

    // upper-left horizontal stub
    `<line x1="${6.5 * STEP}" y1="${HDR + 2.5 * STEP}" x2="${10 * STEP}" y2="${HDR + 2.5 * STEP}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,
    // upper-right horizontal stub
    `<line x1="${(COLS - 10) * STEP}" y1="${HDR + 2.5 * STEP}" x2="${(COLS - 6.5) * STEP}" y2="${HDR + 2.5 * STEP}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,

    // lower-left horizontal stub
    `<line x1="${6.5 * STEP}" y1="${HDR + 4.5 * STEP}" x2="${10 * STEP}" y2="${HDR + 4.5 * STEP}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,
    // lower-right horizontal stub
    `<line x1="${(COLS - 10) * STEP}" y1="${HDR + 4.5 * STEP}" x2="${(COLS - 6.5) * STEP}" y2="${HDR + 4.5 * STEP}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,

    // flanking stubs beside ghost house
    `<line x1="${ghX - 2.5 * STEP}" y1="${HDR + 3.5 * STEP}" x2="${ghX - 0.5 * STEP}" y2="${HDR + 3.5 * STEP}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,
    `<line x1="${ghX + ghW + 0.5 * STEP}" y1="${HDR + 3.5 * STEP}" x2="${ghX + ghW + 2.5 * STEP}" y2="${HDR + 3.5 * STEP}" stroke="${C}" stroke-width="${sw}" stroke-linecap="${lc}"/>`,
  ];

  return lines.join('\n');
}

// ── svg generation ───────────────────────────────────────────────────────────

function generateSVG(weeks, dark = true) {
  const CELL     = 11;
  const GAP      = 2;
  const STEP     = CELL + GAP;   // 13

  // character geometry — slightly larger than one grid cell for that arcade feel
  const PAC_R    = 8.5;
  const GHOST_SZ = 15;
  const DOT_R    = 2.0;          // contribution pellet circle radius
  const DIM_R    = 1.2;          // zero-day dim dot
  const POWER_R  = 4.5;          // power pellet
  const BLINK    = 6;            // frames between power pellet blink states
  const HDR      = 20;           // month label area height

  const bg      = dark ? '#0d1117' : '#ffffff';
  const gameBg  = '#0a0a12';    // arcade board is always dark
  const textCol = dark ? '#8b949e' : '#57606a';
  const dimDot  = 'rgba(255,255,255,0.09)';

  const grid  = weeks.map(w => w.contributionDays.map(d => d.contributionCount));
  const path  = buildPath(weeks);
  const COLS  = grid.length;
  const W     = COLS * STEP;
  const H     = HDR + 7 * STEP + 4;
  const TOTAL = path.length;
  const DUR   = `${(TOTAL * 0.085).toFixed(1)}s`;

  const eatAt      = new Map(path.map(([c, r], i) => [`${c},${r}`, i]));
  const powerCells = new Set([[1,0],[1,6],[COLS-2,0],[COLS-2,6]].map(([c,r]) => `${c},${r}`));

  // ── defs ─────────────────────────────────────────────────────────────────
  const defs = `<defs>
  <radialGradient id="ghostPupil" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#3399ff"/>
    <stop offset="100%" stop-color="#003399"/>
  </radialGradient>
  <radialGradient id="pacGrad" cx="40%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#ffe566"/>
    <stop offset="100%" stop-color="#e6a000"/>
  </radialGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="2.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softglow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="1.2" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;

  // ── month labels ─────────────────────────────────────────────────────────
  const monthLabels = getMonthLabels(weeks)
    .map(({ col, name }) =>
      `<text x="${col * STEP + 1}" y="${HDR - 5}" fill="${textCol}" font-family="monospace,sans-serif" font-size="9">${name}</text>`
    ).join('');

  let out = '';

  // ── backgrounds ──────────────────────────────────────────────────────────
  out += `<rect width="${W}" height="${H}" fill="${bg}"/>`;
  out += `<rect x="0" y="${HDR}" width="${W}" height="${7 * STEP + 4}" fill="${gameBg}"/>`;

  // ── zero-day dim dots (skip power pellet positions) ───────────────────────
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      if (grid[col][row] === 0 && !powerCells.has(`${col},${row}`)) {
        const cx = (col * STEP + STEP / 2).toFixed(1);
        const cy = (HDR + row * STEP + STEP / 2).toFixed(1);
        out += `<circle cx="${cx}" cy="${cy}" r="${DIM_R}" fill="${dimDot}"/>`;
      }
    }
  }

  // ── contribution pellets (circles, disappear when eaten) ─────────────────
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      if (powerCells.has(`${col},${row}`)) continue;
      const color = countToColor(grid[col][row]);
      if (!color) continue;
      const frame = eatAt.get(`${col},${row}`);
      if (frame === undefined) continue;
      const cx  = (col * STEP + STEP / 2).toFixed(1);
      const cy  = (HDR + row * STEP + STEP / 2).toFixed(1);
      const ops = Array.from({ length: TOTAL }, (_, f) => (f < frame ? 1 : 0)).join(';');
      out += `<circle cx="${cx}" cy="${cy}" r="${DOT_R}" fill="${color}" filter="url(#softglow)">
  <animate attributeName="opacity" values="${ops}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
</circle>`;
    }
  }

  // ── maze walls (over cells, under characters) ─────────────────────────────
  out += mazeWalls(W, HDR, STEP, COLS);

  // ── power pellets — blink then disappear when eaten ───────────────────────
  for (const [c, r] of [[1,0],[1,6],[COLS-2,0],[COLS-2,6]]) {
    const cx    = (c * STEP + STEP / 2).toFixed(1);
    const cy    = (HDR + r * STEP + STEP / 2).toFixed(1);
    const frame = eatAt.get(`${c},${r}`) ?? TOTAL;
    const ops   = Array.from({ length: TOTAL }, (_, f) => {
      if (f >= frame) return 0;
      return Math.floor(f / BLINK) % 2 === 0 ? 1 : 0.18;
    }).join(';');
    out += `<circle cx="${cx}" cy="${cy}" r="${POWER_R}" fill="#ffffff" filter="url(#glow)">
  <animate attributeName="opacity" values="${ops}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
</circle>`;
  }

  // ── ghosts with AI ────────────────────────────────────────────────────────
  const ghosts = [
    { mode: 'blinky', fill: '#e84040' },
    { mode: 'pinky',  fill: '#ff9ecf' },
    { mode: 'inky',   fill: '#00e5cc' },
    { mode: 'clyde',  fill: '#ffb852' },
  ];
  for (const { mode, fill } of ghosts) {
    const positions = ghostPositions(path, mode, COLS);
    out += ghostSVG(positions, fill, DUR, STEP, HDR, GHOST_SZ);
  }

  // ── pac-man body ──────────────────────────────────────────────────────────
  const dVals = path.map(([col, row], i) => {
    const cx  = col * STEP + STEP / 2;
    const cy  = HDR + row * STEP + STEP / 2;
    const dir = row % 2 === 0 ? 0 : 180;
    return pacmanD(cx, cy, PAC_R, dir, i % 2 === 0);
  }).join(';');

  out += `<path fill="url(#pacGrad)" filter="url(#glow)">
  <animate attributeName="d" values="${dVals}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
</path>`;

  // ── pac-man eye ───────────────────────────────────────────────────────────
  const eyeCx = path.map(([col, row]) => {
    const base = col * STEP + STEP / 2;
    return (row % 2 === 0 ? base + 2.8 : base - 2.8).toFixed(1);
  }).join(';');
  const eyeCy = path.map(([, row]) =>
    (HDR + row * STEP + STEP / 2 - 4).toFixed(1)
  ).join(';');

  out += `<circle r="1.5" fill="#1a1200">
  <animate attributeName="cx" values="${eyeCx}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
  <animate attributeName="cy" values="${eyeCy}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
</circle>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  ${monthLabels}
  ${out}
</svg>`;
}

// ── github commit ────────────────────────────────────────────────────────────

async function getFileSHA(filename) {
  const res = await fetch(
    `https://api.github.com/repos/${USERNAME}/${TARGET_REPO}/contents/${filename}`,
    { headers: { Authorization: `bearer ${GITHUB_TOKEN}` } }
  );
  if (res.status === 404) return null;
  const json = await res.json();
  return json.sha;
}

async function commitFile(filename, content, sha) {
  const encoded = Buffer.from(content).toString('base64');
  const res = await fetch(
    `https://api.github.com/repos/${USERNAME}/${TARGET_REPO}/contents/${filename}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: regenerate ${filename}`,
        content: encoded,
        ...(sha ? { sha } : {}),
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`commitFile ${filename} failed: ${res.status} ${text}`);
  }
  return res.ok;
}

// ── handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const weeks    = await fetchContributions();
    const darkSVG  = generateSVG(weeks, true);
    const lightSVG = generateSVG(weeks, false);

    // Sequential commits — parallel writes to the same repo can race
    const darkSHA  = await getFileSHA('github-pacman-dark.svg');
    const darkOk  = await commitFile('github-pacman-dark.svg', darkSVG,  darkSHA);

    const lightSHA = await getFileSHA('github-pacman.svg');
    const lightOk  = await commitFile('github-pacman.svg',      lightSVG, lightSHA);

    res.status(200).json({ ok: true, dark: darkOk, light: lightOk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
