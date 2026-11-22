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

  const ell = (cx, cy, rx, ry, on) => {
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) filled[y][x] = on;
      }
    }
  };

  // Dos hojas.
  ell(7.5, 6, 7.5, 5.5, true);
  ell(19.5, 6, 7.5, 5.5, true);

  // V central entre las hojas.
  for (let y = 2; y <= 9; y += 1) {
    const half = Math.max(0, (9 - y) * 0.7);
    for (let x = Math.floor(13.5 - half); x <= Math.ceil(13.5 + half); x += 1) {
      if (filled[y] && filled[y][x] !== undefined) filled[y][x] = false;
    }
  }

  // Tallo.
  for (let y = 9; y <= 12; y += 1) {
    for (let x = 13; x <= 14; x += 1) filled[y][x] = true;
  }

  // Montículo.
  ell(13.5, 17, 12, 5, true);

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
const BLOCK_HEIGHT = H + 1; // sprite + línea del prompt

// Verdes oscuros: cuerpo siempre visible (40/34), borde más oscuro (28/22).
const COLOR = {
  '░': '\x1b[38;5;22m',
  '▒': '\x1b[38;5;28m',
  '▓': '\x1b[38;5;34m',
  '█': '\x1b[38;5;40m',
};
const PROMPT_COLOR = '\x1b[38;5;28m';
const PROMPT = '   Presiona ENTER para continuar...  ';

// Panel a la derecha de la planta.
const PANEL_GAP = '    ';
const PANEL = {
  6: { text: 'Spec Driven Agility', color: '\x1b[1m\x1b[38;5;40m' },
  8: { text: 'Injecting commands and skills', color: '\x1b[38;5;34m' },
  9: { text: 'into the repository root.', color: '\x1b[38;5;34m' },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canAnimate(stream) {
  if (!stream || !stream.isTTY) return false;
  if (process.env.CI) return false;
  if (process.env.TERM === 'dumb') return false;
  return true;
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

  const panel = PANEL[y];
  if (panel) {
    out += `${PANEL_GAP}${panel.color}${panel.text}${RESET}`;
  }

  return out;
}

function drawFrame(stream, phase) {
  for (let y = 0; y < H; y += 1) {
    stream.write(`\r${CLEAR}${lineFor(y, phase)}\n`);
  }
  stream.write(`\r${CLEAR}${PROMPT_COLOR}${PROMPT}${RESET}\n`);
}

function erase(stream) {
  stream.write(`\x1b[${BLOCK_HEIGHT}A`);
  for (let i = 0; i < BLOCK_HEIGHT; i += 1) {
    stream.write(`\r${CLEAR}\n`);
  }
  stream.write(`\x1b[${BLOCK_HEIGHT}A`);
}

async function drawLoop(stream, { frames, delay = 110, stopWhen } = {}) {
  let first = true;
  let frame = 0;

  while (true) {
    if (stopWhen && stopWhen()) break;
    if (frames !== undefined && frame >= frames) break;

    if (!first) stream.write(`\x1b[${BLOCK_HEIGHT}A`);
    // La sombra se desplaza cada 3 frames: movimiento lento y continuo.
    const phase = Math.floor(frame / 3) % 2;
    drawFrame(stream, phase);
    first = false;
    frame += 1;
    await sleep(delay);
  }
}

function waitForKey(stdin) {
  return new Promise((resolve) => {
    const onData = (key) => {
      if (key === '\u0003') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write(SHOW);
        process.exit(130);
      }
      if (key === '\r' || key === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        resolve();
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
  });
}

/**
 * Intro animada: planta pixel-art con sombra en movimiento hasta ENTER.
 * Se omite en CI, salidas no interactivas o con `--no-animation`.
 */
export async function playIntro({
  enabled = true,
  stream = process.stdout,
  stdin = process.stdin,
  frames,
} = {}) {
  if (!enabled || !canAnimate(stream)) return false;

  stream.write(HIDE);

  try {
    if (frames !== undefined) {
      await drawLoop(stream, { frames, delay: 80 });
      erase(stream);
      stream.write(SHOW);
      return true;
    }

    let stop = false;
    const loop = drawLoop(stream, { stopWhen: () => stop });

    if (stdin.isTTY) {
      await waitForKey(stdin);
    } else {
      await sleep(2000);
    }

    stop = true;
    await loop;
    erase(stream);
    stream.write(SHOW);
    return true;
  } catch {
    stream.write(SHOW);
    return false;
  }
}
