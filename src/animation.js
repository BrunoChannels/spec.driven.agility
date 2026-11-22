import readline from 'node:readline';

// Planta que crece en una maceta. Todas las frames tienen la misma altura
// para poder redibujarse en el sitio sin que el cursor derive.
const FRAMES = [
  [
    '           ',
    '           ',
    '           ',
    '           ',
    '           ',
    '   .-----. ',
    '   \\_____/ ',
  ],
  [
    '           ',
    '           ',
    '           ',
    '           ',
    '      .    ',
    '   .-----. ',
    '   \\_____/ ',
  ],
  [
    '           ',
    '           ',
    '           ',
    '      |    ',
    '      |    ',
    '   .-----. ',
    '   \\_____/ ',
  ],
  [
    '           ',
    '           ',
    '     \\|/  ',
    '      |    ',
    '      |    ',
    '   .-----. ',
    '   \\_____/ ',
  ],
  [
    '           ',
    '    \\ | / ',
    '     \\|/  ',
    '      |    ',
    '      |    ',
    '   .-----. ',
    '   \\_____/ ',
  ],
  [
    '      @    ',
    '     \\|/  ',
    '      |    ',
    '      |    ',
    '      |    ',
    '   .-----. ',
    '   \\_____/ ',
  ],
];

const ESC = {
  hide: '\x1b[?25l',
  show: '\x1b[?25h',
  up: (n) => `\x1b[${n}A`,
  clear: '\x1b[2K',
};

const HEIGHT = FRAMES[0].length;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canAnimate(stream) {
  if (!stream || !stream.isTTY) return false;
  if (process.env.CI) return false;
  if (process.env.TERM === 'dumb') return false;
  return true;
}

async function animate(stream, frameDelay = 110) {
  stream.write(ESC.hide);
  stream.write(`${FRAMES[0].join('\n')}\n`);

  for (let frame = 1; frame < FRAMES.length; frame += 1) {
    await sleep(frameDelay);
    stream.write(ESC.up(HEIGHT));
    for (let line = 0; line < HEIGHT; line += 1) {
      stream.write(`\r${ESC.clear}${FRAMES[frame][line]}\n`);
    }
  }

  stream.write(ESC.show);
}

function waitForEnter() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\n  Presiona ENTER para continuar... ', () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Reproduce la intro animada de la planta y espera ENTER.
 * Se omite sola en CI, salidas no interactivas o con `--no-animation`.
 */
export async function playIntro({ enabled = true, stream = process.stdout, waitEnter = true } = {}) {
  if (!enabled || !canAnimate(stream)) return false;

  try {
    await animate(stream);
    if (waitEnter && process.stdin.isTTY) await waitForEnter();
    return true;
  } catch {
    stream.write(ESC.show);
    return false;
  }
}
