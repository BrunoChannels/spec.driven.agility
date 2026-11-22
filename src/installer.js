import fs from 'node:fs';
import path from 'node:path';
import { COMMANDS_DIR, SKILLS_DIR } from './templates.js';

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

function installCommands(targetDir) {
  const dest = path.join(targetDir, '.opencode', 'commands');
  ensureDir(dest);
  const files = listCommandFiles();
  for (const name of files) {
    copyFile(path.join(COMMANDS_DIR, name), path.join(dest, name));
  }
  return files.length;
}

function installSkills(targetDir) {
  const destRoot = path.join(targetDir, '.opencode', 'skills');
  ensureDir(destRoot);
  const dirs = listSkillDirs();
  let count = 0;
  for (const name of dirs) {
    const src = path.join(SKILLS_DIR, name, 'SKILL.md');
    if (!fs.existsSync(src)) continue;
    copyFile(src, path.join(destRoot, name, 'SKILL.md'));
    count += 1;
  }
  return count;
}

function scaffoldDirs(targetDir) {
  const created = [];
  for (const name of ['Backlog', 'specs']) {
    const dir = path.join(targetDir, name);
    if (fs.existsSync(dir)) continue;
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, '.gitkeep'), '');
    created.push(name);
  }
  return created;
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
  const dirs = scaffoldDirs(targetDir);

  console.log(`  ✔ ${commands} comandos en .opencode/commands/`);
  console.log(`  ✔ ${skills} skills en .opencode/skills/`);
  console.log(
    dirs.length
      ? `  ✔ carpetas: ${dirs.join(', ')}`
      : '  • Backlog/ y specs/ ya existían',
  );
  console.log('');
  console.log('  Siguiente paso: en opencode, ejecuta /sda-sprint.');
  console.log('  (El framework e2e lo defines o heredas ahí.)');
  console.log('');
}

export function runUpdate(targetDir) {
  printHeader(targetDir);

  const commands = installCommands(targetDir);
  const skills = installSkills(targetDir);

  console.log(`  ✔ ${commands} comandos re-sincronizados`);
  console.log(`  ✔ ${skills} skills re-sincronizadas`);
  console.log('  • Backlog/ y specs/ no se tocaron');
  console.log('');
}
