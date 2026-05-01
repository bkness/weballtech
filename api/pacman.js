const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME     = 'bkness';
const TARGET_REPO  = 'bkness';


const defs = `
<defs>
  <linearGradient id="ghostRed" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff5c5c"/>
    <stop offset="100%" stop-color="#b30000"/>
  </linearGradient>
</defs>
`;

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
    if (row % 2 !== 0) cols.reverse(); // alternate direction each row
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
  if (count < 3)  return '#0e4429';
  if (count < 6)  return '#006d32';
  if (count < 9)  return '#26a641';
  return                 '#39d353';
}

// ── pacman path string ───────────────────────────────────────────────────────

function pacmanSVG(path, STEP, HDR, R, DUR) {
  const total = path.length;

  const frames = path.map(([col, row], i) => {
    const cx = col * STEP + R;
    const cy = HDR + row * STEP + R;
    const angle = row % 2 === 0 ? 0 : 180;

    return `
      <g transform="translate(${cx},${cy}) rotate(${angle})">
        <!-- body -->
        <circle r="${R}" fill="#f1c40f"/>

        <!-- mouth (animated wedge cutout) -->
        <path fill="#0d1117">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; 18; 0"
            dur="0.25s"
            repeatCount="indefinite"
          />
          <path d="
            M 0 0
            L ${R} ${-R/2}
            A ${R} ${R} 0 1 1 ${R} ${R/2}
            Z
          "/>
        </path>

        <!-- eye -->
        <circle cx="${R * 0.25}" cy="${-R * 0.25}" r="1.2" fill="#222"/>
      </g>
    `;
  });

  const txVals = path
    .map(([c, r]) => `${c * STEP},${HDR + r * STEP}`)
    .join(';');

  return `
    <g>
      <animateTransform
        attributeName="transform"
        type="translate"
        values="${txVals}"
        dur="${DUR}"
        repeatCount="indefinite"
        calcMode="discrete"
      />
      ${frames[0]}
    </g>
  `;
}

// ── ghost shape (local coords 0,0 → CELL,CELL) ──────────────────────────────

function ghostBodyD(CELL) {
  const R  = CELL / 2;
  const s1 = CELL / 3;          // 1/3 mark
  const s2 = CELL * 2 / 3;      // 2/3 mark
  const pk = CELL * 0.72;       // scallop peak y (from top)
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

function ghostSVG(path, delay, fill, STEP, HDR, DUR, CELL) {
  const TOTAL   = path.length;
  const R       = CELL / 2;
  const shifted = path.map((_, i) => path[(i + TOTAL - delay) % TOTAL]);
  const txVals  = shifted.map(([c, r]) => `${c * STEP},${HDR + r * STEP}`).join(';');

  const body = ghostBodyD(CELL);
  const ex1  = (R * 0.58).toFixed(1);
  const ex2  = (R * 1.42).toFixed(1);
  const ey   = (R * 0.72).toFixed(1);
  const er   = (R * 0.42).toFixed(1);
  const pr   = (R * 0.22).toFixed(1);

  return `<g>
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.2; 0 0" dur="1.2s" repeatCount="indefinite" calcMode="discrete"/>
    <path d="${body}" fill="${fill}"/>
    <circle cx="${ex1}" cy="${ey}" r="${er}" fill="white"/>
    <circle cx="${ex2}" cy="${ey}" r="${er}" fill="white"/>
    <circle cx="${ex1}" cy="${ey}" r="${pr}" fill="url(#ghostRed)"/>
    <circle cx="${ex2}" cy="${ey}" r="${pr}" fill="url(#ghostRed)"/>
  </g>`;
}

// ── svg generation ───────────────────────────────────────────────────────────

function generateSVG(weeks, dark = true) {
  const CELL  = 11;
  const GAP   = 2;
  const STEP  = CELL + GAP;
  const R     = CELL / 2;
  const HDR   = 15;   // month-label header height

  const bg       = dark ? '#0d1117' : '#ffffff';
  const cellBg   = dark ? '#161b22' : '#ebedf0';
  const gridLine = dark ? '#21262d' : '#d0d7de';
  const textCol  = dark ? '#8b949e' : '#57606a';

  const grid  = weeks.map(w => w.contributionDays.map(d => d.contributionCount));
  const path  = buildPath(weeks);
  const COLS  = grid.length;
  const W     = COLS * STEP;
  const H     = HDR + 7 * STEP;
  const TOTAL = path.length;
  const DUR   = `${(TOTAL * 0.085).toFixed(1)}s`;

  // Index each cell to the frame Pac-Man eats it
  const eatAt = new Map(path.map(([c, r], i) => [`${c},${r}`, i]));

  // ── month labels ─────────────────────────────────────────────────────────
  const monthLabels = getMonthLabels(weeks)
    .map(({ col, name }) =>
      `<text x="${col * STEP + 1}" y="${HDR - 3}" fill="${textCol}" font-family="sans-serif" font-size="9">${name}</text>`
    ).join('');

  // ── background ───────────────────────────────────────────────────────────
  let out = `<rect width="${W}" height="${H}" fill="${bg}"/>`;

  // ── cell tiles (static dark squares forming the maze) ───────────────────
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      const x = col * STEP;
      const y = HDR + row * STEP;
     out += pacmanSVG(path, STEP, HDR, R, DUR);
    }
  }

  // ── pellets (contribution dots that get eaten) ────────────────────────────
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      const count = grid[col][row];
      if (count === 0) continue;

      const color = countToColor(count);
      const cx    = col * STEP + R;
      const cy    = HDR + row * STEP + R;
      const frame = eatAt.get(`${col},${row}`);

      if (frame === undefined) {
        out += `<circle cx="${cx}" cy="${cy}" r="2.2" fill="${color}"/>`;
        continue;
      }

      const ops = Array.from({ length: TOTAL }, (_, f) => (f < frame ? 1 : 0)).join(';');
      out += `
        <circle cx="${cx}" cy="${cy}" r="2.2" fill="${color}">
          <animate attributeName="r"
            values="2.2;2.5;2.2"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
        `;
    }
  }

  // ── ghosts ────────────────────────────────────────────────────────────────
  // Blinky (red) 7 steps behind, Pinky (pink) 14 steps behind
  out += ghostSVG(path,  7, '#e84040', STEP, HDR, DUR, CELL);
  out += ghostSVG(path, 14, '#ff9ecf', STEP, HDR, DUR, CELL);

  // ── pac-man ───────────────────────────────────────────────────────────────
  // Even rows move right (0°), odd rows move left (180°)
  const dVals = path.map(([col, row], i) => {
    const cx   = col * STEP + R;
    const cy   = HDR + row * STEP + R;
    const dir  = row % 2 === 0 ? 0 : 180;
    const open = i % 2 === 0;
    return pacmanD(cx, cy, R, dir, open);
  }).join(';');

  out += `<path fill="#f1c40f"><animate attributeName="d" values="${dVals}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/></path>`;

  // ── eye (follows pac-man) ─────────────────────────────────────────────────
  const eyeCx = path.map(([col, row]) => {
    const base = col * STEP + R;
    return (row % 2 === 0 ? base + 1.8 : base - 1.8).toFixed(1);
  }).join(';');
  const eyeCy = path.map(([, row]) => (HDR + row * STEP + R - 2.2).toFixed(1)).join(';');

  out += `<circle r="1.3" fill="#333">` +
    `<animate attributeName="cx" values="${eyeCx}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>` +
    `<animate attributeName="cy" values="${eyeCy}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>` +
    `</circle>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
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
    const weeks   = await fetchContributions();
    const darkSVG = generateSVG(weeks, true);
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
