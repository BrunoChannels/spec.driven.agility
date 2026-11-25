import fs from 'node:fs';
import path from 'node:path';
import { AGENTS_DIR, COMMANDS_DIR, SKILLS_DIR } from './templates.js';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function listCommandFiles() {
  return fs
    .readdirSync(COMMANDS_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort();
}

function listSkillDirs() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listAgentFiles() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort();
}

function installCommands(targetDir) {
  const dest = path.join(targetDir, '.opencode', 'commands');
  ensureDir(dest);
  const files = listCommandFiles();
  for (const name of files) {
    copyFile(path.join(COMMANDS_DIR, name), path.join(dest, name));
  }
  return files.length;
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(from, to);
    else if (entry.isFile()) copyFile(from, to);
  }
}

function installSkills(targetDir) {
  const destRoot = path.join(targetDir, '.opencode', 'skills');
  ensureDir(destRoot);
  const dirs = listSkillDirs();
  let count = 0;
  for (const name of dirs) {
    const src = path.join(SKILLS_DIR, name);
    if (!fs.existsSync(path.join(src, 'SKILL.md'))) continue;
    copyDirRecursive(src, path.join(destRoot, name));
    count += 1;
  }
  return count;
}

function installAgents(targetDir) {
  const dest = path.join(targetDir, '.opencode', 'agents');
  const files = listAgentFiles();
  if (!files.length) return 0;
  ensureDir(dest);
  for (const name of files) {
    copyFile(path.join(AGENTS_DIR, name), path.join(dest, name));
  }
  return files.length;
}

function hasLegacyBacklogDir(targetDir) {
  if (!fs.existsSync(targetDir)) return false;
  const entries = fs.readdirSync(targetDir);
  return entries.includes('Backlog') && !entries.includes('backlog');
}

function printHeader(targetDir) {
  console.log('');
  console.log('  Spec-Driven Agility (SDA)');
  console.log(`  Proyecto: ${targetDir}`);
  console.log('');
}

export function runInit(targetDir) {
  printHeader(targetDir);

  const commands = installCommands(targetDir);
  const skills = installSkills(targetDir);
  const agents = installAgents(targetDir);
  const legacyBacklog = hasLegacyBacklogDir(targetDir);

  console.log(`  ✔ ${commands} comandos en .opencode/commands/`);
  console.log(`  ✔ ${skills} skills en .opencode/skills/`);
  if (agents) {
    console.log(
      `  ✔ ${agents} subagente${agents === 1 ? '' : 's'} en .opencode/agents/`,
    );
  }
  console.log('  • backlog/ la crea /sda-sprint · specs/ la crea /sda-end');
  if (legacyBacklog) {
    console.log(
      '  ! Detecté Backlog/ de una versión anterior: renómbrala a backlog/ para que los skills la encuentren.',
    );
  }
  console.log('');
  console.log('  Siguiente paso: en opencode, ejecuta /sda-sprint.');
  console.log('  (La estrategia de tests la defines o heredas ahí.)');
  console.log('');
}

export function runUpdate(targetDir) {
  printHeader(targetDir);

  const commands = installCommands(targetDir);
  const skills = installSkills(targetDir);
  const agents = installAgents(targetDir);

  console.log(`  ✔ ${commands} comandos re-sincronizados`);
  console.log(`  ✔ ${skills} skills re-sincronizadas`);
  if (agents) {
    console.log(`  ✔ ${agents} subagente${agents === 1 ? '' : 's'} re-sincronizado${agents === 1 ? '' : 's'}`);
  }
  console.log('  • backlog/ y specs/ no se tocaron');
  console.log('');
}
