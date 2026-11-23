import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Raíz del paquete (donde vive package.json). */
export const PACKAGE_ROOT = path.resolve(here, '..');

/** Carpeta con todo lo que se instala en un proyecto. */
export const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'templates');

/** Plantillas de comandos `/sda-*`. */
export const COMMANDS_DIR = path.join(TEMPLATES_DIR, 'commands');

/** Plantillas de skills `sda-*`. */
export const SKILLS_DIR = path.join(TEMPLATES_DIR, 'skills');

/** Definiciones de subagentes `sda-*`. */
export const AGENTS_DIR = path.join(TEMPLATES_DIR, 'agents');

