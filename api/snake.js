const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const USERNAME      = 'bkness';
const TARGET_REPO   = 'bkness';

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
                  weekday
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

// ── snake path ───────────────────────────────────────────────────────────────

function buildSnakePath(weeks) {
  const path = [];
  for (let col = 0; col < weeks.length; col++) {
    const days = weeks[col].contributionDays;
    const rows = col % 2 === 0
      ? [0, 1, 2, 3, 4, 5, 6]
      : [6, 5, 4, 3, 2, 1, 0];
    for (const row of rows) {
      if (row < days.length) path.push([col, row]);
    }
  }
  return path;
}

// ── color ────────────────────────────────────────────────────────────────────

function countToColor(count, dark) {
  if (count === 0) return dark ? '#161b22' : '#ebedf0';
  if (count < 3)   return dark ? '#0e4429' : '#9be9a8';
  if (count < 6)   return dark ? '#006d32' : '#40c463';
  if (count < 9)   return dark ? '#26a641' : '#30a14e';
  return                  dark ? '#39d353' : '#216e39';
}

// ── svg generation ───────────────────────────────────────────────────────────

function generateSVG(weeks, dark = false) {
  const CELL        = 10;
  const GAP         = 3;
  const STEP        = CELL + GAP;
  const SNAKE_LEN   = 16;
  const snakeColor  = dark ? '#3fb950' : '#2ea043';
  const snakeHead   = dark ? '#58e06a' : '#56d364';
  const bg          = dark ? '#0d1117' : '#ffffff';

  const grid = weeks.map(w => w.contributionDays.map(d => d.contributionCount));
  const path = buildSnakePath(weeks);

  const COLS = grid.length;
  const W    = COLS * STEP;
  const H    = 7 * STEP;

  // contribution cells
  let cells = '';
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < (grid[col]?.length ?? 0); row++) {
      const x     = col * STEP;
      const y     = row * STEP;
      const color = countToColor(grid[col][row], dark);
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${color}"/>`;
    }
  }

  // snake segments — SMIL discrete animation through path
  const TOTAL  = path.length + SNAKE_LEN;
  const DUR    = `${(TOTAL * 0.12).toFixed(1)}s`;

  let snakeSegs = '';
  for (let seg = 0; seg < SNAKE_LEN; seg++) {
    const isHead  = seg === SNAKE_LEN - 1;
    const color   = isHead ? snakeHead : snakeColor;
    const opacity = +(1 - ((SNAKE_LEN - 1 - seg) / SNAKE_LEN) * 0.55).toFixed(2);

    const xs = [], ys = [], ops = [];
    for (let frame = 0; frame < TOTAL; frame++) {
      const idx = frame - (SNAKE_LEN - 1 - seg);
      if (idx < 0 || idx >= path.length) {
        xs.push(-20); ys.push(-20); ops.push(0);
      } else {
        const [col, row] = path[idx];
        xs.push(col * STEP); ys.push(row * STEP); ops.push(opacity);
      }
    }

    snakeSegs += `
  <rect width="${CELL}" height="${CELL}" rx="${isHead ? 3 : 2}" fill="${color}">
    <animate attributeName="x"       values="${xs.join(';')}"  dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
    <animate attributeName="y"       values="${ys.join(';')}"  dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
    <animate attributeName="opacity" values="${ops.join(';')}" dur="${DUR}" repeatCount="indefinite" calcMode="discrete"/>
  </rect>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background:${bg}">
  ${cells}
  ${snakeSegs}
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
  try {
    const weeks   = await fetchContributions();
    const lightSVG = generateSVG(weeks, false);
    const darkSVG  = generateSVG(weeks, true);

    const [lightSHA, darkSHA] = await Promise.all([
      getFileSHA('github-snake.svg'),
      getFileSHA('github-snake-dark.svg'),
    ]);

    const [lightOk, darkOk] = await Promise.all([
      commitFile('github-snake.svg',      lightSVG, lightSHA),
      commitFile('github-snake-dark.svg', darkSVG,  darkSHA),
    ]);

    res.status(200).json({ ok: true, light: lightOk, dark: darkOk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
