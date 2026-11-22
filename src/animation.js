// Planta pixel-art en verdes oscuros. El mosaico de sombras se desplaza
// suavemente en bucle continuo hasta que el usuario presiona ENTER.
// La planta NUNCA se apaga ni se vuelve transparente: el cuerpo siempre
// queda visible (verde medio/oscuro) y solo cambia el patrón de sombra.
// Sin dependencias.

const W = 27;
const H = 15;

// Niveles: 0 = vacío, 1 = borde, 2 = anillo, 3 = interior.
function buildLevels() {
  const filled = Array.from({ length: H }, () => Array(W).fill(false));

  // Elipse con rotación para hojas naturales y no simétricas.
  const ell = (cx, cy, rx, ry, on, angle = 0) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const u = dx * cos + dy * sin;
        const v = -dx * sin + dy * cos;
        if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) filled[y][x] = on;
      }
    }
  };

  const dot = (cx, cy, r) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) filled[y][x] = true;
      }
    }
  };

  const stroke = (x0, y0, x1, y1, r) => {
    const steps = 60;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      dot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r);
    }
  };

  // Hojas distintas: la derecha es más alta, pequeña e inclinada hacia arriba;
  // la izquierda queda más abajo, más grande y caída hacia fuera.
  ell(20.4, 4, 5.9, 3.4, true, 0.2);
  ell(5.9, 8.4, 6.4, 3.7, true, -0.22);

  // Tallo largo, ligeramente inclinado, y peciolo de la hoja izquierda.
  stroke(13.4, 12.2, 14.6, 4.8, 1);
  stroke(11.7, 9.4, 13.9, 9.4, 0.55);

  // Montículo.
  ell(13.5, 17, 12.2, 4.8, true);

  const isFilled = (x, y) => x >= 0 && x < W && y >= 0 && y < H && filled[y][x];
  const isEdge = (x, y) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isFilled(x + dx, y + dy));

  const levels = Array.from({ length: H }, () => Array(W).fill(0));
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (!filled[y][x]) continue;
      if (isEdge(x, y)) {
        levels[y][x] = 1;
        continue;
      }
      const nearEdge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isEdge(x + dx, y + dy));
      levels[y][x] = nearEdge ? 2 : 3;
    }
  }

  return levels;
}

const LEVELS = buildLevels();

const RESET = '\x1b[0m';
const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';
const CLEAR = '\x1b[2K';
const BLOCK_HEIGHT = H; // alto del bloque en modo frames (pruebas)
const ENTER_ALT = '\x1b[?1049h';
const LEAVE_ALT = '\x1b[?1049l';

// Verdes oscuros: cuerpo siempre visible (40/34), borde más oscuro (28/22).
const COLOR = {
  '░': '\x1b[38;5;22m',
  '▒': '\x1b[38;5;28m',
  '▓': '\x1b[38;5;34m',
  '█': '\x1b[38;5;40m',
};

// Paleta del panel, alineada a la derecha de la planta.
const TITLE_COLOR = '\x1b[1m\x1b[97m';
const BODY_COLOR = '\x1b[38;5;252m';
const MUTED_COLOR = '\x1b[38;5;244m';
const CMD_COLOR = '\x1b[38;5;40m';
const PROMPT_COLOR = '\x1b[3m\x1b[97m';

const PANEL_GAP = '    ';
const COMMAND_COLUMN = 15;

function commandRow(command, description) {
  return [
    { text: command, color: CMD_COLOR },
    { text: ' '.repeat(Math.max(2, COMMAND_COLUMN - command.length)), color: '' },
    { text: description, color: MUTED_COLOR },
  ];
}

// Cada fila del panel corresponde a una fila de la planta.
const PANEL = {
  0: [{ text: 'Welcome to Spec-Driven Agility', color: TITLE_COLOR }],
  1: [{ text: 'A lightweight spec-driven framework', color: MUTED_COLOR }],
  3: [{ text: 'This setup will configure:', color: BODY_COLOR }],
  4: [{ text: '  • Agent Skills for AI tools', color: MUTED_COLOR }],
  5: [{ text: '  • Workflow commands for /sda-*', color: MUTED_COLOR }],
  7: [{ text: 'Quick start after setup:', color: BODY_COLOR }],
  8: commandRow('/sda-sprint', 'Plan the sprint backlog'),
  9: commandRow('/sda-explore', 'Explore the approach'),
  10: commandRow('/sda-spec', 'Write spec, design & tasks'),
  11: commandRow('/sda-build', 'Implement with TDD'),
  12: commandRow('/sda-end', 'Validate and sync specs'),
  14: [{ text: 'Press Enter to continue...', color: PROMPT_COLOR }],
};

// Layouts responsivos: full (planta + panel), compact (solo texto) o skip.
const PANEL_WIDTH = Math.max(
  ...Object.values(PANEL).map((row) => row.reduce((width, part) => width + part.text.length, 0)),
);
const COMPACT_ROWS = Object.keys(PANEL)
  .map(Number)
  .sort((a, b) => a - b);

const FULL_MIN_COLUMNS = W + PANEL_GAP.length + PANEL_WIDTH + 1;
const FULL_MIN_ROWS = H;
const COMPACT_MIN_COLUMNS = PANEL_WIDTH + 1;
const COMPACT_MIN_ROWS = COMPACT_ROWS.length + 1;

function detectLayout(stream) {
  const columns = stream && stream.columns;
  const rows = stream && stream.rows;
  if (!columns || !rows) return 'skip';
  if (columns >= FULL_MIN_COLUMNS && rows >= FULL_MIN_ROWS) return 'full';
  if (columns >= COMPACT_MIN_COLUMNS && rows >= COMPACT_MIN_ROWS) return 'compact';
  return 'skip';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canAnimate(stream) {
  if (!stream || !stream.isTTY) return false;
  if (process.env.CI) return false;
  if (process.env.TERM === 'dumb') return false;
  return true;
}

function formatPanelRow(y) {
  const row = PANEL[y];
  if (!row) return '';
  let out = '';
  for (const part of row) {
    out += part.color ? `${part.color}${part.text}${RESET}` : part.text;
  }
  return out;
}

function lineFor(y, phase) {
  let out = '';
  for (let x = 0; x < W; x += 1) {
    const level = LEVELS[y][x];
    if (level === 0) {
      out += ' ';
      continue;
    }
    let ch;
    if (level === 1) ch = '░';
    else if (level === 2) ch = '▒';
    else ch = (x + y + phase) % 2 === 0 ? '█' : '▓';
    out += COLOR[ch] + ch + RESET;
  }

  if (PANEL[y]) {
    out += `${PANEL_GAP}${formatPanelRow(y)}`;
  }

  return out;
}

// Modo full: posicionamiento absoluto dentro del buffer alternativo.
function drawFrameAbsolute(stream, phase) {
  for (let y = 0; y < H; y += 1) {
    stream.write(`\x1b[${y + 1};1H${CLEAR}${lineFor(y, phase)}`);
  }
}

// Modo frames (pruebas): salida secuencial reutilizando el borrado por cursor.
function drawFrameSequential(stream, phase) {
  for (let y = 0; y < H; y += 1) {
    stream.write(`\r${CLEAR}${lineFor(y, phase)}\n`);
  }
}

function erase(stream) {
  stream.write(`\x1b[${BLOCK_HEIGHT}A`);
  for (let i = 0; i < BLOCK_HEIGHT; i += 1) {
    stream.write(`\r${CLEAR}\n`);
  }
  stream.write(`\x1b[${BLOCK_HEIGHT}A`);
}

async function drawLoop(
  stream,
  { frames, delay = 110, stopWhen, render, cursorUp = false, checkLayout = false } = {},
) {
  let first = true;
  let frame = 0;

  while (true) {
    if (stopWhen && stopWhen()) break;
    if (frames !== undefined && frame >= frames) break;
    if (checkLayout && detectLayout(stream) !== 'full') return { aborted: true };

    if (!first && cursorUp) stream.write(`\x1b[${BLOCK_HEIGHT}A`);
    // La sombra se desplaza cada 3 frames: movimiento lento y continuo.
    const phase = Math.floor(frame / 3) % 2;
    render(stream, phase);
    first = false;
    frame += 1;
    await sleep(delay);
  }

  return { aborted: false };
}

function restoreTerminalOnAbort(stream, cleanup, fromAltScreen = false) {
  cleanup();
  stream.write(`${fromAltScreen ? LEAVE_ALT : ''}${SHOW}`);
  process.exit(130);
}

// Modo compact: texto estático y espera de ENTER.
function waitForKey(stdin, stream) {
  return new Promise((resolve) => {
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    };

    const onData = (key) => {
      if (key === '\u0003') restoreTerminalOnAbort(stream, cleanup);
      if (key === '\r' || key === '\n') {
        cleanup();
        resolve();
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
  });
}

// Modo full: espera ENTER, Ctrl+C o un resize que ya no permita el layout full.
function waitForExit(stdin, stream) {
  return new Promise((resolve) => {
    let poll;

    const cleanup = () => {
      clearInterval(poll);
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    };

    const onData = (key) => {
      if (key === '\u0003') restoreTerminalOnAbort(stream, cleanup, true);
      if (key === '\r' || key === '\n') {
        cleanup();
        resolve('enter');
      }
    };

    poll = setInterval(() => {
      if (detectLayout(stream) !== 'full') {
        cleanup();
        resolve('resize');
      }
    }, 250);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
  });
}

async function runCompact(stream, stdin) {
  for (const y of COMPACT_ROWS) {
    stream.write(`${formatPanelRow(y)}\n`);
  }

  if (stdin.isTTY) {
    await waitForKey(stdin, stream);
  } else {
    await sleep(1500);
  }

  return true;
}

/**
 * Intro animada: planta pixel-art con sombra en movimiento hasta ENTER.
 * Responsiva: sin ancho suficiente muestra solo el texto; si es demasiado
 * pequeña se omite y la instalación continúa directamente. También se omite
 * en CI, salidas no interactivas o con `--no-animation`.
 */
export async function playIntro({
  enabled = true,
  stream = process.stdout,
  stdin = process.stdin,
  frames,
} = {}) {
  if (!enabled || !canAnimate(stream)) return false;

  if (frames !== undefined) {
    stream.write(HIDE);
    try {
      await drawLoop(stream, {
        frames,
        delay: 80,
        render: drawFrameSequential,
        cursorUp: true,
      });
      erase(stream);
      stream.write(SHOW);
      return true;
    } catch {
      stream.write(SHOW);
      return false;
    }
  }

  const layout = detectLayout(stream);
  if (layout === 'skip') return false;
  if (layout === 'compact') return runCompact(stream, stdin);

  stream.write(`${ENTER_ALT}${HIDE}\x1b[2J`);

  try {
    let stop = false;
    const loop = drawLoop(stream, {
      stopWhen: () => stop,
      render: drawFrameAbsolute,
      checkLayout: true,
    });

    const outcome = stdin.isTTY
      ? await waitForExit(stdin, stream)
      : await sleep(2000).then(() => 'timeout');

    stop = true;
    const { aborted } = await loop;
    stream.write(LEAVE_ALT + SHOW);

    if (!aborted && outcome !== 'resize') return true;

    if (detectLayout(stream) === 'compact') return runCompact(stream, stdin);
    return false;
  } catch {
    stream.write(LEAVE_ALT + SHOW);
    return false;
  }
}
