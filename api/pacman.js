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
// dir: 0=right, 180=left | open: mouth open or closed

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

function ghostBodyD(CELL) {
  const R  = CELL / 2;
  const s1 = CELL / 3;
  const s2 = (CELL * 2) / 3;
  const pk = CELL * 0.72;
  return [
    `M0,${CELL}`,
    `L0,${R}`,
    `A${R},${R} 0 0,1 ${CELL},${R}`,
    `L${CELL},${CELL}`,
    `Q${(s2 + s1 / 2).toFixed(2)},${pk.toFixed(2)} ${s2.toFixed(2)},${CELL}`,
    `Q${(s1 + s1 / 2).toFixed(2)},${pk.toFixed(2)} ${s1.toFixed(2)},${CELL}`,
    `Q${(s1 / 2).toFixed(2)},${pk.toFixed(2)} 0,${CELL}`,
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
    blinky: [COLS - 2, 0],   // top-right
    pinky:  [1,        0],   // top-left
    inky:   [COLS - 2, 6],   // bottom-right
    clyde:  [1,        6],   // bottom-left
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

function ghostSVG(positions, fill, DUR, STEP, HDR, CELL) {
  const R      = CELL / 2;
  const txVals = positions.map(([c, r]) => `${c * STEP} ${HDR + r * STEP}`).join(';');
  const body   = ghostBodyD(CELL);
  const ex1    = (R * 0.58).toFixed(1);
  const ex2    = (R * 1.42).toFixed(1);
  const ey     = (R * 0.72).toFixed(1);
  const er     = (R * 0.42).toFixed(1);
  const pr     = (R * 0.22).toFixed(1);

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
// Renders the outer border, ghost house with pink door, and T-wall stubs
// that evoke the classic Pac-Man maze without disrupting the grid layout.

function mazeWalls(W, HDR, STEP, CELL, COLS) {
  const C    = '#1a6fd4';   // classic Pac-Man blue
  const sw   = 2;

  // Ghost house: 5 cols wide, 3 rows tall, horizontally centred
  const ghCol = Math.floor(COLS / 2) - 2;
  const ghX   = ghCol * STEP;
  const ghY   = HDR + 2 * STEP;
  const ghW   = 5 * STEP;
  const ghH   = 3 * STEP;
  const gapW  = STEP;
  const gapX  = ghX + (ghW - gapW) / 2;

  const lines = [
    // outer border
    `<rect x="1" y="${HDR + 1}" width="${W - 2}" height="${7 * STEP - 2}" fill="none" stroke="${C}" stroke-width="3" rx="4"/>`,

    // ghost house sides + bottom
    `<line x1="${ghX}"      y1="${ghY}"      x2="${ghX}"      y2="${ghY + ghH}" stroke="${C}" stroke-width="${sw}"/>`,
    `<line x1="${ghX + ghW}" y1="${ghY}"     x2="${ghX + ghW}" y2="${ghY + ghH}" stroke="${C}" stroke-width="${sw}"/>`,
    `<line x1="${ghX}"      y1="${ghY + ghH}" x2="${ghX + ghW}" y2="${ghY + ghH}" stroke="${C}" stroke-width="${sw}"/>`,

    // ghost house top (split with door gap)
    `<line x1="${ghX}"          y1="${ghY}" x2="${gapX}"          y2="${ghY}" stroke="${C}"       stroke-width="${sw}"/>`,
    `<line x1="${gapX + gapW}"  y1="${ghY}" x2="${ghX + ghW}"     y2="${ghY}" stroke="${C}"       stroke-width="${sw}"/>`,
    `<line x1="${gapX}"         y1="${ghY}" x2="${gapX + gapW}"   y2="${ghY}" stroke="#ff9ecf"   stroke-width="${sw}"/>`,

    // left vertical pillar (cols 4-5, rows 2-4)
    `<line x1="${5 * STEP}" y1="${HDR + 2 * STEP}" x2="${5 * STEP}" y2="${HDR + 5 * STEP}" stroke="${C}" stroke-width="${sw}"/>`,

    // right vertical pillar (mirror)
    `<line x1="${(COLS - 6) * STEP + CELL}" y1="${HDR + 2 * STEP}" x2="${(COLS - 6) * STEP + CELL}" y2="${HDR + 5 * STEP}" stroke="${C}" stroke-width="${sw}"/>`,

    // upper-left horizontal stub
    `<line x1="${6 * STEP}" y1="${HDR + 2 * STEP + STEP * 0.5}" x2="${10 * STEP}" y2="${HDR + 2 * STEP + STEP * 0.5}" stroke="${C}" stroke-width="${sw}"/>`,

    // upper-right horizontal stub
    `<line x1="${(COLS - 11) * STEP}" y1="${HDR + 2 * STEP + STEP * 0.5}" x2="${(COLS - 7) * STEP}" y2="${HDR + 2 * STEP + STEP * 0.5}" stroke="${C}" stroke-width="${sw}"/>`,

    // lower-left horizontal stub
    `<line x1="${6 * STEP}" y1="${HDR + 4 * STEP + STEP * 0.5}" x2="${10 * STEP}" y2="${HDR + 4 * STEP + STEP * 0.5}" stroke="${C}" stroke-width="${sw}"/>`,

    // lower-right horizontal stub
    `<line x1="${(COLS - 11) * STEP}" y1="${HDR + 4 * STEP + STEP * 0.5}" x2="${(COLS - 7) * STEP}" y2="${HDR + 4 * STEP + STEP * 0.5}" stroke="${C}" stroke-width="${sw}"/>`,
  ];

  return lines.join('\n');
}

// ── svg generation ───────────────────────────────────────────────────────────

function generateSVG(weeks, dark = true) {
  const CELL  = 11;
  const GAP   = 2;
  const STEP  = CELL + GAP;
  const R     = CELL / 2;
  const HDR   = 15;

  const bg      = dark ? '#0d1117' : '#ffffff';
  const cellBg  = dark ? '#161b22' : '#ebedf0';
  const textCol = dark ? '#8b949e' : '#57606a';

  const grid  = weeks.map(w => w.contributionDays.map(d => d.contributionCount));
  const path  = buildPath(weeks);
  const COLS  = grid.length;
  const W     = COLS * STEP;
  const H     = HDR + 7 * STEP;
  const TOTAL = path.length;
  const DUR   = `${(TOTAL * 0.085).toFixed(1)}s`;

  const eatAt = new Map(path.map(([c, r], i) => [`${c},${r}`, i]));

  // ── defs ─────────────────────────────────────────────────────────────────
  const defs = `<defs>
  <radialGradient id="ghostPupil" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#3399ff"/>
    <stop offset="100%" stop-color="#003399"/>
  </radialGradient>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="1.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;

  // ── month labels ─────────────────────────────────────────────────────────
  const monthLabels = getMonthLabels(weeks)
    .map(({ col, name }) =>
      `<text x="${col * STEP + 1}" y="${HDR - 3}" fill="${textCol}" font-family="sans-serif" font-size="9">${name}</text>`
    ).join('');

  // ── background ───────────────────────────────────────────────────────────
  let out = `<rect width="${W}" height="${H}" fill="${bg}"/>`;

  // ── cell tiles (dark base) ────────────────────────────────────────────────
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      out += `<rect x="${col * STEP}" y="${HDR + row * STEP}" width="${CELL}" height="${CELL}" rx="2" fill="${cellBg}"/>`;
    }
  }

  // ── green squares — disappear when pac-man eats them ─────────────────────
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      const color = countToColor(grid[col][row]);
      if (!color) continue;

      const frame = eatAt.get(`${col},${row}`);
      if (frame === undefined) continue;

      const ops = Array.from({ length: TOTAL }, (_, f) => (f < frame ? 1 : 0)).join(';');
      out += `<rect x="${col * STEP}" y="${HDR + row * STEP}" width="${CELL}" height="${CELL}" rx="2" fill="${color}">
  <animate attributeName="opacity" values="${ops}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
</rect>`;
    }
  }

  // ── maze walls (drawn over cells, under characters) ───────────────────────
  out += mazeWalls(W, HDR, STEP, CELL, COLS);

  // ── power pellets — blinking white dots at the 4 corners ─────────────────
  for (const [c, r] of [[1,0],[1,6],[COLS-2,0],[COLS-2,6]]) {
    const cx = c * STEP + R;
    const cy = HDR + r * STEP + R;
    out += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#fff" filter="url(#glow)">
  <animate attributeName="opacity" values="1;0.15;1" dur="0.6s" repeatCount="indefinite"/>
</circle>`;
  }

  // ── ghosts with AI ────────────────────────────────────────────────────────
  const ghosts = [
    { mode: 'blinky', fill: '#e84040' },  // Blinky — red,    direct chaser
    { mode: 'pinky',  fill: '#ff9ecf' },  // Pinky  — pink,   ambusher
    { mode: 'inky',   fill: '#00e5cc' },  // Inky   — cyan,   flanker
    { mode: 'clyde',  fill: '#ffb852' },  // Clyde  — orange, patrol/scatter
  ];

  for (const { mode, fill } of ghosts) {
    const positions = ghostPositions(path, mode, COLS);
    out += ghostSVG(positions, fill, DUR, STEP, HDR, CELL);
  }

  // ── pac-man body (discrete d animation = position + mouth) ───────────────
  const dVals = path.map(([col, row], i) => {
    const cx  = col * STEP + R;
    const cy  = HDR + row * STEP + R;
    const dir = row % 2 === 0 ? 0 : 180;
    return pacmanD(cx, cy, R, dir, i % 2 === 0);
  }).join(';');

  out += `<path fill="#f1c40f" filter="url(#glow)">
  <animate attributeName="d" values="${dVals}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
</path>`;

  // ── pac-man eye ───────────────────────────────────────────────────────────
  const eyeCx = path.map(([col, row]) => {
    const base = col * STEP + R;
    return (row % 2 === 0 ? base + 1.8 : base - 1.8).toFixed(1);
  }).join(';');
  const eyeCy = path.map(([, row]) => (HDR + row * STEP + R - 2.5).toFixed(1)).join(';');

  out += `<circle r="1.3" fill="#333">
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
  return res.ok;
}

// ── handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const weeks    = await fetchContributions();
    const darkSVG  = generateSVG(weeks, true);
    const lightSVG = generateSVG(weeks, false);

    const [darkSHA, lightSHA] = await Promise.all([
      getFileSHA('github-pacman-dark.svg'),
      getFileSHA('github-pacman.svg'),
    ]);

    const [darkOk, lightOk] = await Promise.all([
      commitFile('github-pacman-dark.svg', darkSVG,  darkSHA),
      commitFile('github-pacman.svg',      lightSVG, lightSHA),
    ]);

    res.status(200).json({ ok: true, dark: darkOk, light: lightOk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
