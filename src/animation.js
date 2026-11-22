// Planta de bloques en verde fosforescente: parpadea en bucle continuo
// hasta que el usuario presiona ENTER. Sin dependencias.

// Sprite (27x15). Se dibuja con bloques llenos y se colorea por frame.
const SPRITE = [
  '                           ',
  '     ██████      ██████    ',
  '   █████            █████  ',
  '  ███████          ███████ ',
  ' █████████        █████████',
  ' █████████        █████████',
  '███████████      ██████████',
  ' ███████████    ███████████',
  ' ███████████    ███████████',
  '  ████████████████████████ ',
  '   ██████████████████████  ',
  '     ██████  ██  ██████    ',
  '             ██            ',
  '       ██████████████      ',
  '    ████████████████████   ',
];

const PROMPT = '   Presiona ENTER para continuar...  ';

// Pulso fosforescente: verde neón brillante -> oscuro -> neón.
const PALETTE = [
  '\x1b[1m\x1b[38;5;46m',
  '\x1b[1m\x1b[38;5;82m',
  '\x1b[38;5;118m',
  '\x1b[38;5;46m',
  '\x1b[38;5;34m',
  '\x1b[38;5;22m',
  '\x1b[2m\x1b[38;5;22m',
  '\x1b[38;5;22m',
  '\x1b[38;5;34m',
  '\x1b[38;5;46m',
  '\x1b[38;5;118m',
  '\x1b[1m\x1b[38;5;82m',
];

const RESET = '\x1b[0m';
const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';
const CLEAR = '\x1b[2K';
const DIM = '\x1b[2m';
const BLOCK_HEIGHT = SPRITE.length + 1; // sprite + línea del prompt

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canAnimate(stream) {
  if (!stream || !stream.isTTY) return false;
  if (process.env.CI) return false;
  if (process.env.TERM === 'dumb') return false;
  return true;
}

function drawFrame(stream, color) {
  for (const line of SPRITE) {
    stream.write(`\r${CLEAR}${color}${line}${RESET}\n`);
  }
  stream.write(`\r${CLEAR}${DIM}${PROMPT}${RESET}\n`);
}

function erase(stream) {
  stream.write(`\x1b[${BLOCK_HEIGHT}A`);
  for (let i = 0; i < BLOCK_HEIGHT; i += 1) {
    stream.write(`\r${CLEAR}\n`);
  }
  stream.write(`\x1b[${BLOCK_HEIGHT}A`);
}

async function drawLoop(stream, { frames, delay = 105, stopWhen } = {}) {
  let first = true;
  let frame = 0;

  while (true) {
    if (stopWhen && stopWhen()) break;
    if (frames !== undefined && frame >= frames) break;

    if (!first) stream.write(`\x1b[${BLOCK_HEIGHT}A`);
    drawFrame(stream, PALETTE[frame % PALETTE.length]);
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
 * Intro animada: planta fosforescente que parpadea hasta ENTER.
 * Se omite en CI, salidas no interactivas o con `--no-animation`.
 * `frames` permite un modo de prueba con un número fijo de frames.
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
