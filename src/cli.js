import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from './templates.js';
import { runInit, runUpdate } from './installer.js';
import { playIntro } from './animation.js';

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  return pkg.version;
}

function printHelp() {
  console.log(`
Spec-Driven Agility (SDA) — v${readVersion()}

Uso:
  sda <comando> [ruta]

Comandos:
  init [ruta]     Instala los comandos /sda-*, las skills, el subagente y las
                  carpetas backlog/ y specs/. Por defecto usa el directorio
                  actual. Usa --no-animation para omitir la intro animada.
  update [ruta]   Re-sincroniza comandos, skills y subagente. No toca config
                  ni datos.
  version         Muestra la versión instalada.
  help            Muestra esta ayuda.

Ejemplos:
  sda init
  sda init ./mi-proyecto
  sda update
`);
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const flag = rest.find((arg) => !arg.startsWith('-'));
  const target = path.resolve(flag || '.');

  switch (command) {
    case undefined:
    case '-h':
    case '--help':
    case 'help':
      printHelp();
      return;
    case '-V':
    case '--version':
    case 'version':
      console.log(readVersion());
      return;
    case 'init':
      await playIntro({ enabled: !rest.includes('--no-animation') });
      runInit(target);
      return;
    case 'update':
      runUpdate(target);
      return;
    default:
      console.error(`Comando desconocido: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}
