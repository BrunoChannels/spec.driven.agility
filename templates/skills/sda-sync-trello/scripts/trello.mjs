#!/usr/bin/env node
/**
 * sda-sync-trello — puente entre el backlog de Spec-Driven Agility y un tablero de Trello.
 *
 * Sin dependencias: Node 18+ (fetch nativo, fs, os, path).
 * Dry-run por defecto en todo lo que escribe: sin --apply no se toca Trello.
 *
 * Credenciales (en este orden):
 *   1. variables de entorno TRELLO_KEY / TRELLO_TOKEN
 *   2. ~/.sda/credentials.json  →  { "trello": { "key": "...", "token": "..." } }
 *
 * Configuración por proyecto: <proyecto>/.opencode/trello.json
 *
 * Comandos:
 *   login --key <key> --token <token> [--apply]
 *   logout [--apply]
 *   doctor
 *   setup --board <url|shortLink> [--todo "…"] [--doing "…"] [--review "…"] [--done "…"] [--create-missing-lists] [--apply]
 *   plan [--sprint <nombre>] [--json]
 *   state [--json]
 *   seed [--apply]
 *   sync-hu --hu HU3 [--move todo|doing|review|done|<lista>] [--checklist] [--comment "…"] [--link <url>] [--desc] [--apply]
 *   archive-sprint [--apply]
 *   snapshot [--out <ruta>] [--apply]
 *
 * Globales: --root <dir>  --help
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API = 'https://api.trello.com/1';
const CREDENTIALS_PATH = path.join(os.homedir(), '.sda', 'credentials.json');
const CONFIG_RELATIVE = path.join('.opencode', 'trello.json');
const THROTTLE_MS = 130;
const DESCRIPTION_LIMIT = 16384;

const LIST_KEYS = ['todo', 'doing', 'review', 'done'];
const LIST_LABELS = { todo: 'Por Hacer', doing: 'En proceso', review: 'En revisión', done: 'Finalizado' };
const LIST_ALIASES = {
  todo: ['por hacer', 'to do', 'todo', 'backlog', 'pendiente', 'pendientes'],
  doing: ['en proceso', 'en progreso', 'doing', 'in progress', 'en curso', 'desarrollo'],
  review: ['en revision', 'revision', 'review', 'validacion', 'qa'],
  done: ['finalizado', 'finalizada', 'hecho', 'done', 'completado', 'listo'],
};
const EFFORT_COLORS = { 1: 'green', 2: 'lime', 3: 'yellow', 5: 'orange', 8: 'red' };
const PHASE_COLORS = ['blue', 'purple', 'sky', 'pink', 'black', 'green', 'orange', 'lime'];
const SPRINT_COLORS = ['purple', 'blue', 'sky', 'pink', 'black', 'green', 'orange', 'lime', 'yellow', 'red'];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const norm = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
const mask = (value) => (value ? `${value.slice(0, 4)}…${value.slice(-3)}` : '—');
const truncate = (text, max = 100) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
};
const cardUrl = (card) => card?.shortUrl ?? (card?.shortLink ? `https://trello.com/c/${card.shortLink}` : (card?.id ?? '—'));

function fail(message) {
  console.error(`\n[error] ${message}\n`);
  process.exitCode = 1;
  throw Object.assign(new Error(message), { handled: true });
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[arg.slice(2)] = next;
      index += 1;
    } else {
      flags[arg.slice(2)] = true;
    }
  }
  return { flags, positional };
}

const printHelp = () => console.log(`
sda-sync-trello — sincroniza el backlog SDA con un tablero de Trello

Uso:
  node trello.mjs <comando> [opciones] [--root <proyecto>]

Comandos:
  login       Guarda API key y token en ~/.sda/credentials.json (valida antes de escribir).
  logout      Borra las credenciales guardadas.
  doctor      Diagnóstico: credenciales, tablero, listas, etiquetas y tarjetas mapeadas.
  setup       Valida el tablero, mapea las 4 listas y escribe .opencode/trello.json.
  plan        Lee backlog/<sprint>/plan.md y lista las HUs (texto, esfuerzo, requiere, estado).
  state       Matriz HU × plan × artefactos × tarjeta × lista, con acción sugerida.
  seed        Crea o actualiza las tarjetas del sprint (idempotente).
  sync-hu     Mueve/actualiza la tarjeta de una HU (checklist, comentario, enlaces).
  archive-sprint  Archiva las tarjetas finalizadas del sprint.
  snapshot    Exporta el estado actual a markdown.

Sin --apply nada se escribe en Trello.

Ejemplos:
  node trello.mjs login --key $TRELLO_KEY --token $TRELLO_TOKEN --apply
  node trello.mjs setup --board https://trello.com/b/XXXXXXXX/tablero --apply
  node trello.mjs seed
  node trello.mjs sync-hu --hu HU3 --move review --checklist --apply
`);

// ---------------------------------------------------------------------------
// Credenciales
// ---------------------------------------------------------------------------
let credentialsCache;

function loadCredentials() {
  if (credentialsCache !== undefined) return credentialsCache;

  const envKey = process.env.TRELLO_KEY?.trim();
  const envToken = process.env.TRELLO_TOKEN?.trim();
  if (envKey && envToken) {
    credentialsCache = { key: envKey, token: envToken, source: 'variables de entorno' };
    return credentialsCache;
  }

  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
      const trello = parsed.trello ?? parsed;
      if (trello.key && trello.token) {
        credentialsCache = { key: trello.key, token: trello.token, source: CREDENTIALS_PATH };
        return credentialsCache;
      }
    } catch (error) {
      console.warn(`[warn] no se pudo leer ${CREDENTIALS_PATH}: ${error.message}`);
    }
  }

  credentialsCache = null;
  return null;
}

function requireCredentials() {
  const creds = loadCredentials();
  if (!creds) {
    fail(
      'Faltan credenciales de Trello. Ejecuta `login --key <key> --token <token> --apply` o define TRELLO_KEY y TRELLO_TOKEN.',
    );
  }
  return creds;
}

function saveCredentials(key, token) {
  fs.mkdirSync(path.dirname(CREDENTIALS_PATH), { recursive: true });
  fs.writeFileSync(
    CREDENTIALS_PATH,
    `${JSON.stringify({ trello: { key, token, savedAt: new Date().toISOString() } }, null, 2)}\n`,
    { mode: 0o600 },
  );
}

// ---------------------------------------------------------------------------
// API de Trello
// ---------------------------------------------------------------------------
async function api(pathname, { method = 'GET', query, body } = {}) {
  const creds = requireCredentials();
  const url = new URL(`${API}${pathname}`);
  url.searchParams.set('key', creds.key);
  url.searchParams.set('token', creds.token);
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 429) {
      await sleep(1000 * (attempt + 1));
      continue;
    }

    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`Trello ${method} ${pathname} → ${response.status}: ${text.slice(0, 240)}`);
      error.status = response.status;
      throw error;
    }
    return text ? JSON.parse(text) : null;
  }

  throw new Error(`Trello ${method} ${pathname} → límite de peticiones excedido`);
}

function boardRef(value) {
  const raw = String(value ?? '').trim();
  const fromUrl = raw.match(/trello\.com\/b\/([A-Za-z0-9]+)/);
  return fromUrl ? fromUrl[1] : raw;
}

// ---------------------------------------------------------------------------
// Configuración del proyecto
// ---------------------------------------------------------------------------
const configPath = (root) => path.join(root, CONFIG_RELATIVE);

function readConfig(root) {
  const file = configPath(root);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`La configuración ${file} no es JSON válido: ${error.message}`);
  }
}

function writeConfig(root, config) {
  const file = configPath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  return file;
}

function resolveRoot(flags) {
  return path.resolve(typeof flags.root === 'string' ? flags.root : process.cwd());
}

// ---------------------------------------------------------------------------
// Plan del sprint
// ---------------------------------------------------------------------------
function findSprint(root, preferred) {
  const backlog = path.join(root, 'backlog');
  if (!fs.existsSync(backlog)) fail('No existe backlog/. Ejecuta /sda-sprint primero.');

  const sprints = fs
    .readdirSync(backlog, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => {
      const dir = path.join(backlog, entry.name);
      const planFile = path.join(dir, 'plan.md');
      if (!fs.existsSync(planFile)) return null;
      return { name: entry.name, dir, planFile, mtime: fs.statSync(planFile).mtimeMs };
    })
    .filter(Boolean);

  if (sprints.length === 0) fail('No hay ningún backlog/<sprint>/plan.md.');

  if (typeof preferred === 'string') {
    const hit = sprints.find((sprint) => norm(sprint.name) === norm(preferred));
    if (!hit) fail(`No existe el sprint "${preferred}". Disponibles: ${sprints.map((s) => s.name).join(', ')}`);
    return hit;
  }

  sprints.sort((a, b) => b.mtime - a.mtime);
  return sprints[0];
}

const HU_SDA = /^[-*]\s*\[([ xX])\]\s*\*\*HU[ _-]?0*(\d+)\*\*\s*[—–-]+\s*(.+)$/;
const HU_NUMBERED = /^[-*]\s*\[([ xX])\]\s*(\d+)\.\s+(.+)$/;
const PHASE_HEADING = /^#{2,4}\s+Fase\s+(\d+)\s*[—–-]\s*(.+)$/i;

function parsePlan(markdown) {
  const hus = [];
  let phase = null;
  let inFence = false;
  let sdaHits = 0;
  let numberedHits = 0;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (line.includes('~~') && /\*\*HU[ _-]?0*\d+\*\*/.test(line)) {
      const discarded = line.match(/HU[ _-]?0*(\d+)/);
      if (discarded) {
        const body = line
          .replace(/^[-*]\s*(?:\[[ xX]\]\s*)?/, '')
          .replace(/\*\*HU[ _-]?0*\d+\*\*\s*[—–-]?\s*/, '')
          .replace(/~~/g, '')
          .trim();
        hus.push({ num: Number(discarded[1]), discarded: true, text: body, requires: [] });
      }
      continue;
    }

    const phaseMatch = line.match(PHASE_HEADING);
    if (phaseMatch) {
      phase = { num: Number(phaseMatch[1]), name: phaseMatch[2].trim() };
      continue;
    }

    const sda = line.match(HU_SDA);
    if (sda) {
      sdaHits += 1;
      const body = sda[3].trim();
      const effortMatch = body.match(/\(Esfuerzo:\s*(\d+)\)/i);
      const requiresMatch = body.match(/\(Requiere:\s*([^)]+)\)/i);
      const requires = requiresMatch ? (requiresMatch[1].match(/\d+/g) ?? []).map(Number) : [];
      hus.push({
        num: Number(sda[2]),
        text: body
          .replace(/\s*_?\(Esfuerzo:[^)]*\)_?/i, '')
          .replace(/\s*_?\(Requiere:[^)]*\)_?/i, '')
          .trim(),
        effort: effortMatch ? Number(effortMatch[1]) : null,
        requires,
        done: sda[1].toLowerCase() === 'x',
        phase,
        discarded: false,
      });
      continue;
    }

    const numbered = line.match(HU_NUMBERED);
    if (numbered) {
      numberedHits += 1;
      const body = numbered[3].trim();
      const requiresMatch = body.match(/Requires?:\s*([^)]+)$/i);
      const requires = requiresMatch ? (requiresMatch[1].match(/\d+/g) ?? []).map(Number) : [];
      hus.push({
        num: Number(numbered[2]),
        text: body.replace(/\s*Requires?:\s*[#\d,\s]+$/i, '').trim(),
        effort: null,
        requires,
        done: numbered[1].toLowerCase() === 'x',
        phase,
        discarded: false,
      });
    }
  }

  const format = sdaHits > 0 ? 'sda' : numberedHits > 0 ? 'numbered' : 'unknown';
  hus.sort((a, b) => a.num - b.num);
  return { hus, format };
}

function huFolder(sprintDir, num) {
  if (!fs.existsSync(sprintDir)) return null;
  const roots = [sprintDir, path.join(sprintDir, 'archive')].filter((dir) => fs.existsSync(dir));
  for (const root of roots) {
    const match = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .find((name) => {
        const found = name.match(/^HU[ _-]?0*(\d+)$/i);
        return found && Number(found[1]) === num;
      });
    if (match) return path.join(root, match);
  }
  return null;
}

function parseTasks(markdown) {
  const sections = [];
  let current = null;
  let inFence = false;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = line.match(/^##\s+(?:(\d+)\.\s*)?(.+)$/);
    if (heading) {
      current = { num: heading[1] ? Number(heading[1]) : null, title: heading[2].trim(), items: [] };
      sections.push(current);
      continue;
    }

    const task = line.match(/^[-*]\s*\[([ xX])\]\s+(?:(\d+\.\d+)\s+)?(.+)$/);
    if (task && current) {
      current.items.push({
        id: task[2] ?? null,
        text: task[3].trim(),
        complete: task[1].toLowerCase() === 'x',
        manual: /manual/i.test(current.title),
      });
    }
  }

  return sections;
}

function tasksSummary(sections) {
  const auto = sections.filter((section) => !/manual/i.test(section.title));
  const manual = sections.filter((section) => /manual/i.test(section.title));
  const total = auto.reduce((sum, section) => sum + section.items.length, 0);
  const done = auto.reduce((sum, section) => sum + section.items.filter((item) => item.complete).length, 0);
  const manualPending = manual.reduce((sum, section) => sum + section.items.filter((item) => !item.complete).length, 0);
  return { total, done, manualPending, sections };
}

function buildDescription(hu, sprint, artifacts = {}) {
  const lines = ['**Historia**', hu.text, '', '**Esfuerzo**', hu.effort ? `${hu.effort} pts` : '—', '', '**Requiere**'];
  lines.push(hu.requires.length ? hu.requires.map((num) => `HU${num}`).join(', ') : '—');
  lines.push('', '**Sprint**', sprint.name);
  if (hu.phase) lines.push('', '**Fase**', `Fase ${hu.phase.num} — ${hu.phase.name}`);
  if (artifacts.dir) {
    const rel = path.relative(path.dirname(sprint.dir), artifacts.dir).split(path.sep).join('/');
    lines.push('', '**Artefactos**', `backlog/${rel}/`);
  }
  const description = lines.join('\n');
  return description.length > DESCRIPTION_LIMIT ? description.slice(0, DESCRIPTION_LIMIT) : description;
}

// ---------------------------------------------------------------------------
// Tarjetas y etiquetas
// ---------------------------------------------------------------------------
const cardNumber = (name) => {
  const match = String(name ?? '').match(/^HU[ _-]?0*(\d+)\b/i);
  return match ? Number(match[1]) : null;
};

async function listBoardCards(boardId) {
  const cards = await api(`/boards/${boardId}/cards`, {
    query: { fields: 'name,desc,idList,idLabels,closed,shortLink,shortUrl', limit: 1000 },
  });
  return cards.filter((card) => !card.closed);
}

function indexCards(cards) {
  const byNumber = new Map();
  const duplicates = new Set();
  for (const card of cards) {
    const num = cardNumber(card.name);
    if (num === null) continue;
    if (byNumber.has(num)) duplicates.add(num);
    else byNumber.set(num, card);
  }
  return { byNumber, duplicates };
}

function sprintColor(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return SPRINT_COLORS[hash % SPRINT_COLORS.length];
}

async function ensureLabels(config, { sprintName, effortValues, phases, apply }) {
  const existing = await api(`/boards/${config.board.id}/labels`, { query: { fields: 'name,color', limit: 1000 } });
  const byName = new Map(existing.map((label) => [norm(label.name), label]));

  const wanted = [{ key: 'sprint', name: `Sprint ${sprintName}`, color: sprintColor(sprintName) }];
  for (const value of [...effortValues].sort((a, b) => a - b)) {
    wanted.push({ key: `effort:${value}`, name: `${value} pts`, color: EFFORT_COLORS[value] ?? 'sky' });
  }
  for (const phase of phases) {
    wanted.push({
      key: `phase:${phase.num}`,
      name: `Fase ${phase.num} — ${phase.name}`,
      color: PHASE_COLORS[(phase.num - 1) % PHASE_COLORS.length],
    });
  }

  const ids = new Map();
  for (const label of wanted) {
    const found = byName.get(norm(label.name));
    if (found) {
      ids.set(label.key, found.id);
      if (found.color !== label.color && apply) {
        await api(`/labels/${found.id}`, { method: 'PUT', body: { color: label.color } });
        await sleep(THROTTLE_MS);
      }
      continue;
    }
    if (!apply) continue;
    const created = await api('/labels', {
      method: 'POST',
      body: { idBoard: config.board.id, name: label.name, color: label.color },
    });
    ids.set(label.key, created.id);
    await sleep(THROTTLE_MS);
  }
  return { ids, wanted };
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------
async function cmdLogin(flags) {
  const key = typeof flags.key === 'string' ? flags.key.trim() : process.env.TRELLO_KEY?.trim();
  const token = typeof flags.token === 'string' ? flags.token.trim() : process.env.TRELLO_TOKEN?.trim();
  if (!key || !token) fail('Uso: login --key <api-key> --token <token> [--apply]');

  credentialsCache = { key, token, source: 'login en curso' };
  let member;
  try {
    member = await api('/members/me', { query: { fields: 'username,fullName,url' } });
  } catch (error) {
    credentialsCache = undefined;
    fail(`Trello rechazó las credenciales (${error.message}). La key y el token deben ser del mismo usuario.`);
  }

  console.log(`Credenciales válidas para ${member.fullName} (@${member.username}) — key=${mask(key)}`);

  if (!flags.apply) {
    console.log('\nDry-run: no se guardó nada. Añade --apply para escribir ~/.sda/credentials.json.\n');
    return;
  }

  saveCredentials(key, token);
  console.log(`Guardadas en ${CREDENTIALS_PATH}\n`);
}

function cmdLogout(flags) {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log('No hay credenciales guardadas.\n');
    return;
  }
  if (!flags.apply) {
    console.log(`Dry-run: se borraría ${CREDENTIALS_PATH}. Añade --apply para confirmar.\n`);
    return;
  }
  fs.rmSync(CREDENTIALS_PATH);
  credentialsCache = undefined;
  console.log(`Credenciales eliminadas de ${CREDENTIALS_PATH}\n`);
}

async function cmdDoctor(flags) {
  const root = resolveRoot(flags);
  const creds = loadCredentials();
  const problems = [];

  console.log(`\nProyecto: ${root}`);
  console.log(`Credenciales: ${creds ? `${creds.source} (key=${mask(creds.key)})` : 'no configuradas ✖'}`);
  if (!creds) problems.push('sin credenciales (login --apply o TRELLO_KEY/TRELLO_TOKEN)');

  if (creds) {
    try {
      const member = await api('/members/me', { query: { fields: 'username,fullName' } });
      console.log(`Cuenta: ${member.fullName} (@${member.username})`);
    } catch (error) {
      console.log(`Cuenta: ✖ ${error.message}`);
      problems.push('credenciales rechazadas por Trello');
    }
  }

  const config = readConfig(root);
  if (!config) {
    console.log(`Configuración: ${CONFIG_RELATIVE} no existe ✖`);
    problems.push('sin configuración de tablero (setup --board <url> --apply)');
  } else {
    console.log(`Configuración: ${CONFIG_RELATIVE} ✔`);
    console.log(`Tablero: ${config.board.name} (${config.board.shortLink})`);
  }

  if (config && creds) {
    try {
      const board = await api(`/boards/${config.board.shortLink}`, {
        query: { fields: 'id,name', lists: 'open', list_fields: 'id,name' },
      });
      const lists = board.lists ?? [];
      for (const key of LIST_KEYS) {
        const id = config.lists?.[key];
        const name = lists.find((list) => list.id === id)?.name;
        if (id && name) {
          console.log(`  ${key.padEnd(6)} → "${name}" ✔`);
        } else {
          console.log(`  ${key.padEnd(6)} → id ${id ?? '—'} no existe ✖`);
          problems.push(`lista "${key}" sin mapear o eliminada del tablero`);
        }
      }
      const cards = await listBoardCards(board.id);
      const { byNumber } = indexCards(cards);
      const mapped = Object.keys(config.cards ?? {}).length;
      console.log(`Tarjetas del tablero: ${cards.length} · HUs reconocidas: ${byNumber.size} · mapeadas: ${mapped}`);
    } catch (error) {
      console.log(`Tablero: ✖ ${error.message}`);
      problems.push('el tablero configurado no responde');
    }
  }

  if (problems.length) {
    console.log('\nProblemas:');
    for (const problem of problems) console.log(`  - ${problem}`);
    console.log('');
    process.exitCode = 1;
    return;
  }
  console.log('\nTodo listo.\n');
}

async function cmdSetup(flags) {
  const root = resolveRoot(flags);
  const existing = readConfig(root);
  const ref = boardRef(
    typeof flags.board === 'string' ? flags.board : (existing?.board?.shortLink ?? process.env.TRELLO_BOARD ?? ''),
  );
  if (!ref) fail('Falta el tablero: setup --board https://trello.com/b/<id>/<nombre>');

  const board = await api(`/boards/${ref}`, {
    query: { fields: 'id,name,url,shortLink', lists: 'open', list_fields: 'id,name,pos' },
  });
  const lists = board.lists ?? [];

  console.log(`\nTablero: ${board.name} (${board.shortLink})`);
  console.log(`Listas abiertas: ${lists.map((list) => list.name).join(' | ') || '(ninguna)'}\n`);

  const mapping = {};
  const missing = [];

  for (const key of LIST_KEYS) {
    const explicit = typeof flags[key] === 'string' ? flags[key] : null;
    const candidates = explicit ? [norm(explicit)] : LIST_ALIASES[key];
    const found = lists.find((list) => candidates.includes(norm(list.name))) ?? null;

    if (found) {
      mapping[key] = { id: found.id, name: found.name };
      console.log(`  ${key.padEnd(6)} → "${found.name}"`);
      continue;
    }

    missing.push({ key, name: explicit ?? LIST_LABELS[key] });
  }

  for (const item of missing) console.log(`  ${item.key.padEnd(6)} → "${item.name}" no existe`);

  if (missing.length && !flags['create-missing-lists']) {
    fail(
      `Faltan listas: ${missing.map((item) => item.key).join(', ')}. ` +
        'Añade --create-missing-lists para crearlas o mapea las existentes con --todo/--doing/--review/--done "<nombre>".',
    );
  }

  if (!flags.apply) {
    console.log('\nDry-run: no se escribió nada. Añade --apply para guardar la configuración.\n');
    return;
  }

  for (const item of missing) {
    const created = await api('/lists', { method: 'POST', body: { idBoard: board.id, name: item.name, pos: 'bottom' } });
    mapping[item.key] = { id: created.id, name: created.name };
    console.log(`  creada lista "${created.name}"`);
    await sleep(THROTTLE_MS);
  }

  const config = {
    board: { id: board.id, shortLink: board.shortLink, name: board.name, url: board.url },
    lists: Object.fromEntries(LIST_KEYS.map((key) => [key, mapping[key].id])),
    listNames: Object.fromEntries(LIST_KEYS.map((key) => [key, mapping[key].name])),
    labels: existing?.labels ?? {},
    cards: existing?.cards ?? {},
    sprint: existing?.sprint ?? null,
    updatedAt: new Date().toISOString(),
  };

  const file = writeConfig(root, config);
  console.log(`\nConfiguración guardada en ${file}\n`);
}

function loadPlanContext(flags) {
  const root = resolveRoot(flags);
  const sprint = findSprint(root, flags.sprint);
  const plan = parsePlan(fs.readFileSync(sprint.planFile, 'utf8'));
  if (plan.hus.length === 0) fail(`No se detectaron HUs en ${sprint.planFile}`);
  return { root, sprint, plan, config: readConfig(root) };
}

function huArtifacts(sprint, num) {
  const dir = huFolder(sprint.dir, num);
  if (!dir) return { dir: null, files: [], tasks: null };
  const files = ['spec.md', 'design.md', 'tasks.md'].filter((name) => fs.existsSync(path.join(dir, name)));
  let tasks = null;
  const tasksFile = path.join(dir, 'tasks.md');
  if (fs.existsSync(tasksFile)) tasks = tasksSummary(parseTasks(fs.readFileSync(tasksFile, 'utf8')));
  return { dir, files, tasks };
}

async function cmdPlan(flags) {
  const { sprint, plan } = loadPlanContext(flags);
  const active = plan.hus.filter((hu) => !hu.discarded);
  const total = active.reduce((sum, hu) => sum + (hu.effort ?? 0), 0);
  const done = active.filter((hu) => hu.done).reduce((sum, hu) => sum + (hu.effort ?? 0), 0);

  if (flags.json) {
    console.log(JSON.stringify({ sprint: sprint.name, format: plan.format, hus: plan.hus, total, done }, null, 2));
    return;
  }

  console.log(`\nSprint: ${sprint.name} · formato ${plan.format} · ${active.length} HUs · ${total} pts (${done} implementados)\n`);
  for (const hu of plan.hus) {
    const status = hu.discarded ? 'descartada' : hu.done ? 'hecha' : 'pendiente';
    const effort = hu.effort ? `${hu.effort} pts` : '—';
    const requires = hu.requires.length ? ` · requiere HU${hu.requires.join(', HU')}` : '';
    const phase = hu.phase ? ` · Fase ${hu.phase.num}` : '';
    console.log(`  HU${hu.num}  [${status}]  ${effort}${phase}${requires}  ${truncate(hu.text, 70)}`);
  }
  console.log('');
}

async function cmdState(flags) {
  const { sprint, plan, config } = loadPlanContext(flags);
  const active = plan.hus.filter((hu) => !hu.discarded);

  let cards = [];
  let byNumber = new Map();
  let duplicates = new Set();

  if (config) {
    const board = await api(`/boards/${config.board.shortLink}`, { query: { fields: 'id,name' } });
    cards = await listBoardCards(board.id);
    const indexed = indexCards(cards);
    byNumber = indexed.byNumber;
    duplicates = indexed.duplicates;
  }

  const listName = (id) => {
    for (const key of LIST_KEYS) if (config?.lists?.[key] === id) return config.listNames?.[key] ?? key;
    return id ? `otra (${id.slice(0, 6)}…)` : '—';
  };

  const rows = active.map((hu) => {
    const artifacts = huArtifacts(sprint, hu.num);
    const card = byNumber.get(hu.num) ?? null;
    const tasksDone = artifacts.tasks?.done ?? 0;
    const tasksTotal = artifacts.tasks?.total ?? 0;
    let suggestion = 'sin cambios';

    if (!card) suggestion = 'crear tarjeta';
    else if (hu.done && card.idList !== config?.lists?.done) suggestion = 'mover a Finalizado';
    else if (
      !hu.done &&
      tasksTotal > 0 &&
      tasksDone === tasksTotal &&
      card.idList !== config?.lists?.review &&
      card.idList !== config?.lists?.done
    ) {
      suggestion = 'mover a En revisión';
    } else if (!hu.done && tasksDone > 0 && tasksDone < tasksTotal && card.idList === config?.lists?.todo) {
      suggestion = 'mover a En proceso';
    }

    return {
      hu: `HU${hu.num}`,
      plan: hu.done ? 'hecha' : 'pendiente',
      effort: hu.effort,
      artifacts: artifacts.files.join('·') || '—',
      tasks: tasksTotal ? `${tasksDone}/${tasksTotal}` : '—',
      card: card ? card.id : null,
      url: card ? cardUrl(card) : null,
      list: card ? listName(card.idList) : '—',
      suggestion,
    };
  });

  if (flags.json) {
    console.log(JSON.stringify({ sprint: sprint.name, configured: Boolean(config), rows }, null, 2));
    return;
  }

  if (!config) console.log('\n[aviso] Sin .opencode/trello.json: se muestra solo el estado local.\n');
  console.log(`\nSprint: ${sprint.name}\n`);
  console.log('  HU     Plan       Esf  Tareas  Artefactos            Lista Trello     Acción');
  for (const row of rows) {
    console.log(
      `  ${row.hu.padEnd(6)} ${row.plan.padEnd(10)} ${String(row.effort ?? '—').padEnd(4)} ${row.tasks.padEnd(7)} ` +
        `${row.artifacts.padEnd(21)} ${row.list.padEnd(16)} ${row.suggestion}`,
    );
  }
  if (duplicates.size) {
    console.log(`\n  [!] HUs con más de una tarjeta: ${[...duplicates].map((num) => `HU${num}`).join(', ')}`);
  }
  const pending = rows.filter((row) => row.suggestion !== 'sin cambios');
  console.log(`\n  ${pending.length} HU(s) con acciones pendientes de ${rows.length}.\n`);
}

async function cmdSeed(flags) {
  const { root, sprint, plan, config } = loadPlanContext(flags);
  if (!config) fail('Sin configuración de tablero: ejecuta setup --board <url> --apply');

  const active = plan.hus.filter((hu) => !hu.discarded);
  const phases = [...new Map(active.filter((hu) => hu.phase).map((hu) => [hu.phase.num, hu.phase])).values()];
  const efforts = new Set(active.map((hu) => hu.effort).filter(Boolean));

  console.log(`\nSprint: ${sprint.name} · ${active.length} HUs · tablero ${config.board.name}\n`);

  const cards = await listBoardCards(config.board.id);
  const { byNumber, duplicates } = indexCards(cards);
  if (duplicates.size) {
    fail(`HUs duplicadas en el tablero: ${[...duplicates].map((num) => `HU${num}`).join(', ')}. Resuélvelas antes de sembrar.`);
  }

  const labels = await ensureLabels(config, {
    sprintName: sprint.name,
    effortValues: efforts,
    phases,
    apply: Boolean(flags.apply),
  });
  const state = flags.apply ? 'listas' : `existentes (dry-run: ${labels.ids.size}/${labels.wanted.length})`;
  console.log(`Etiquetas: ${labels.wanted.length} requeridas · ${state}`);

  const items = active.map((hu) => {
    const artifacts = huArtifacts(sprint, hu.num);
    const description = buildDescription(hu, sprint, artifacts);
    const card = byNumber.get(hu.num) ?? null;
    const labelIds = [
      labels.ids.get('sprint'),
      labels.ids.get(`effort:${hu.effort}`),
      hu.phase ? labels.ids.get(`phase:${hu.phase.num}`) : null,
    ].filter(Boolean);

    if (!card) return { hu, description, action: 'crear', card: null, labelIds };
    const changed = (card.desc ?? '').trim() !== description.trim();
    const merged = [...new Set([...(card.idLabels ?? []), ...labelIds])].sort().join(',');
    const labelsChanged = merged !== [...(card.idLabels ?? [])].sort().join(',');
    return { hu, description, action: changed || labelsChanged ? 'actualizar' : 'sin cambios', card, labelIds };
  });

  const toCreate = items.filter((item) => item.action === 'crear');
  const toUpdate = items.filter((item) => item.action === 'actualizar');
  console.log(
    `Crear: ${toCreate.length} · Actualizar: ${toUpdate.length} · Sin cambios: ${items.length - toCreate.length - toUpdate.length}\n`,
  );
  for (const item of [...toCreate, ...toUpdate]) {
    console.log(`  ${item.action.padEnd(10)} HU${item.hu.num}  ${truncate(item.hu.text, 60)}`);
  }

  if (!flags.apply) {
    console.log('\nDry-run: no se escribió nada. Añade --apply para aplicar.\n');
    return;
  }

  const cardsMap = { ...(config.cards ?? {}) };
  let created = 0;
  let updated = 0;

  for (const item of toCreate) {
    const body = {
      idList: config.lists.todo,
      name: `HU${item.hu.num} — ${truncate(item.hu.text)}`,
      desc: item.description,
      pos: 'bottom',
    };
    if (item.labelIds.length) body.idLabels = item.labelIds.join(',');
    const card = await api('/cards', { method: 'POST', body });
    cardsMap[`HU${item.hu.num}`] = { id: card.id, url: cardUrl(card), lastSync: new Date().toISOString() };
    created += 1;
    console.log(`  creada      HU${item.hu.num} → ${cardUrl(card)}`);
    await sleep(THROTTLE_MS);
  }

  for (const item of toUpdate) {
    const body = { desc: item.description };
    const merged = [...new Set([...(item.card.idLabels ?? []), ...item.labelIds])];
    if (merged.length) body.idLabels = merged.join(',');
    await api(`/cards/${item.card.id}`, { method: 'PUT', body });
    cardsMap[`HU${item.hu.num}`] = { id: item.card.id, url: cardUrl(item.card), lastSync: new Date().toISOString() };
    updated += 1;
    console.log(`  actualizada HU${item.hu.num} → ${cardUrl(item.card)}`);
    await sleep(THROTTLE_MS);
  }

  writeConfig(root, {
    ...config,
    labels: { ...(config.labels ?? {}), ...Object.fromEntries(labels.ids) },
    cards: cardsMap,
    sprint: sprint.name,
    updatedAt: new Date().toISOString(),
  });

  console.log(`\nResumen: ${created} creadas · ${updated} actualizadas · configuración al día.\n`);
}

async function resolveCard(config, num) {
  const cards = await listBoardCards(config.board.id);
  const { byNumber, duplicates } = indexCards(cards);
  if (duplicates.has(num)) fail(`Hay más de una tarjeta para HU${num}: resuélvelo en Trello antes de sincronizar.`);
  return byNumber.get(num) ?? null;
}

async function syncChecklist(card, sections, apply) {
  const manual = sections.filter((section) => /manual/i.test(section.title));
  const auto = sections.filter((section) => !/manual/i.test(section.title));
  const items = auto.flatMap((section) =>
    section.items.map((item) => ({ name: `${item.id ?? ''} ${item.text}`.trim(), complete: item.complete })),
  );
  const manualPending = manual.reduce((sum, section) => sum + section.items.filter((item) => !item.complete).length, 0);
  if (items.length === 0) return { added: 0, updated: 0, manualPending };

  const checklists = await api(`/cards/${card.id}/checklists`, {
    query: { fields: 'id,name', checkItem_fields: 'id,name,state' },
  });
  let checklist = checklists.find((item) => norm(item.name) === 'tasks.md') ?? null;

  if (!apply) {
    const existing = new Set((checklist?.checkItems ?? []).map((item) => norm(item.name)));
    const added = items.filter((item) => !existing.has(norm(item.name))).length;
    return { added, updated: 0, manualPending };
  }

  if (!checklist) {
    checklist = await api('/checklists', { method: 'POST', body: { idCard: card.id, name: 'tasks.md' } });
    await sleep(THROTTLE_MS);
    checklist.checkItems = [];
  }

  const byName = new Map((checklist.checkItems ?? []).map((item) => [norm(item.name), item]));
  let added = 0;
  let updated = 0;

  for (const item of items) {
    const found = byName.get(norm(item.name));
    if (!found) {
      await api(`/checklists/${checklist.id}/checkItems`, {
        method: 'POST',
        body: { name: item.name, checked: item.complete, pos: 'bottom' },
      });
      added += 1;
      await sleep(THROTTLE_MS);
      continue;
    }
    const state = item.complete ? 'complete' : 'incomplete';
    const current = found.state === 'complete' ? 'complete' : 'incomplete';
    if (current !== state) {
      await api(`/checklists/${checklist.id}/checkItem/${found.id}`, { method: 'PUT', body: { state } });
      updated += 1;
      await sleep(THROTTLE_MS);
    }
  }

  return { added, updated, manualPending };
}

async function cmdSyncHu(flags) {
  const { root, sprint, plan, config } = loadPlanContext(flags);
  if (!config) fail('Sin configuración de tablero: ejecuta setup --board <url> --apply');

  const raw = String(flags.hu ?? '').replace(/^HU[ _-]?0*/i, '');
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) fail('Falta la HU: sync-hu --hu HU3');

  const hu = plan.hus.find((item) => item.num === num && !item.discarded);
  if (!hu) fail(`HU${num} no existe en ${sprint.planFile}`);

  const card = await resolveCard(config, num);
  if (!card) fail(`HU${num} no tiene tarjeta en Trello. Ejecuta seed --apply primero.`);

  const artifacts = huArtifacts(sprint, num);
  const currentListKey = LIST_KEYS.find((key) => config.lists[key] === card.idList);
  const actions = [];

  let targetList = null;
  if (typeof flags.move === 'string') {
    const value = norm(flags.move);
    const key = LIST_KEYS.find((item) => item === value || norm(config.listNames?.[item] ?? '') === value);
    targetList = key ? config.lists[key] : (config.lists[value] ?? null);
    if (!targetList) fail(`No reconozco la lista "${flags.move}". Usa todo|doing|review|done o el nombre exacto.`);
    if (targetList !== card.idList) actions.push({ type: 'mover', detail: `→ ${config.listNames?.[key] ?? flags.move}` });
  }

  const description = buildDescription(hu, sprint, artifacts);
  const descriptionChanged = (card.desc ?? '').trim() !== description.trim();
  if (flags.desc) {
    actions.push({
      type: 'descripción',
      detail: descriptionChanged ? 'sincronizar con plan.md' : 'ya está al día',
    });
  }

  let checklistPreview = null;
  const checklistWanted = Boolean(flags.checklist) && Boolean(artifacts.tasks?.sections?.length);
  if (flags.checklist && !checklistWanted) actions.push({ type: 'checklist', detail: 'sin tasks.md: omitido' });
  if (checklistWanted) {
    checklistPreview = await syncChecklist(card, artifacts.tasks.sections, false);
    actions.push({
      type: 'checklist',
      detail: `+${checklistPreview.added} nuevos · ${checklistPreview.manualPending} manuales pendientes (no se marcan)`,
    });
  }

  const comment = typeof flags.comment === 'string' ? flags.comment : null;
  if (comment) actions.push({ type: 'comentario', detail: truncate(comment, 60) });

  const link = typeof flags.link === 'string' ? flags.link : null;
  if (link) actions.push({ type: 'enlace', detail: link });

  console.log(`\nHU${num} — ${truncate(hu.text, 70)}`);
  console.log(`Tarjeta: ${cardUrl(card)} · lista actual "${config.listNames?.[currentListKey] ?? card.idList}"`);
  console.log(
    `Plan: ${hu.done ? 'hecha' : 'pendiente'} · Esfuerzo ${hu.effort ?? '—'} pts · Artefactos: ${artifacts.files.join(', ') || 'ninguno'}`,
  );

  if (actions.length === 0) {
    console.log('\nSin acciones que aplicar.\n');
    return;
  }

  console.log('\nAcciones:');
  for (const action of actions) console.log(`  - ${action.type}: ${action.detail}`);

  if (!flags.apply) {
    console.log('\nDry-run: no se escribió nada. Añade --apply para aplicar.\n');
    return;
  }

  if (targetList) {
    await api(`/cards/${card.id}`, { method: 'PUT', body: { idList: targetList } });
    console.log(`  ✔ movida a ${config.listNames?.[LIST_KEYS.find((key) => config.lists[key] === targetList)] ?? targetList}`);
    await sleep(THROTTLE_MS);
  }

  if (flags.desc && descriptionChanged) {
    await api(`/cards/${card.id}`, { method: 'PUT', body: { desc: description } });
    console.log('  ✔ descripción sincronizada');
    await sleep(THROTTLE_MS);
  }

  if (checklistWanted) {
    const result = await syncChecklist(card, artifacts.tasks.sections, true);
    console.log(
      `  ✔ checklist tasks.md: +${result.added} nuevos, ${result.updated} actualizados, ${result.manualPending} manuales pendientes`,
    );
  }

  if (comment) {
    await api(`/cards/${card.id}/actions/comments`, { method: 'POST', body: { text: comment } });
    console.log('  ✔ comentario añadido');
    await sleep(THROTTLE_MS);
  }

  if (link) {
    await api(`/cards/${card.id}/actions/comments`, { method: 'POST', body: { text: `🔗 ${link}` } });
    console.log('  ✔ enlace añadido');
    await sleep(THROTTLE_MS);
  }

  const nextConfig = { ...config, cards: { ...(config.cards ?? {}) } };
  nextConfig.cards[`HU${num}`] = { id: card.id, url: cardUrl(card), lastSync: new Date().toISOString() };
  nextConfig.updatedAt = new Date().toISOString();
  writeConfig(root, nextConfig);
  console.log('');
}

async function cmdArchiveSprint(flags) {
  const { plan, config } = loadPlanContext(flags);
  if (!config) fail('Sin configuración de tablero: ejecuta setup --board <url> --apply');

  const doneNumbers = new Set(plan.hus.filter((hu) => hu.done).map((hu) => hu.num));
  const cards = await listBoardCards(config.board.id);
  const targets = cards.filter((card) => {
    const num = cardNumber(card.name);
    return num !== null && doneNumbers.has(num) && card.idList === config.lists.done;
  });

  console.log(`\nTarjetas finalizadas del sprint: ${targets.length}`);
  for (const card of targets) console.log(`  ${card.name} → ${cardUrl(card)}`);

  if (targets.length === 0) {
    console.log('');
    return;
  }
  if (!flags.apply) {
    console.log('\nDry-run: no se archivó nada. Añade --apply para archivar.\n');
    return;
  }
  for (const card of targets) {
    await api(`/cards/${card.id}`, { method: 'PUT', body: { closed: true } });
    console.log(`  archivada ${card.name}`);
    await sleep(THROTTLE_MS);
  }
  console.log('');
}

async function cmdSnapshot(flags) {
  const { root, sprint, plan, config } = loadPlanContext(flags);
  const active = plan.hus.filter((hu) => !hu.discarded);
  const lines = [
    `# Trello — ${sprint.name}`,
    '',
    `Sincronizado: ${new Date().toISOString()}`,
    config ? `Tablero: ${config.board.name} — ${config.board.url}` : 'Tablero: sin configurar',
    '',
    '| HU | Plan | Esfuerzo | Tarjeta | Lista |',
    '|---|---|---|---|---|',
  ];

  let cards = [];
  if (config) cards = await listBoardCards(config.board.id);
  const { byNumber } = indexCards(cards);

  for (const hu of active) {
    const card = byNumber.get(hu.num);
    const list = card ? (config?.listNames?.[LIST_KEYS.find((key) => config?.lists?.[key] === card.idList)] ?? '—') : '—';
    lines.push(`| HU${hu.num} | ${hu.done ? 'hecha' : 'pendiente'} | ${hu.effort ?? '—'} | ${card ? cardUrl(card) : '—'} | ${list} |`);
  }

  const out =
    typeof flags.out === 'string'
      ? path.resolve(flags.out)
      : path.join(root, 'backlog', `${sprint.name}-trello.md`);
  const content = `${lines.join('\n')}\n`;

  if (!flags.apply) {
    console.log(content);
    console.log(`Dry-run: se escribiría ${out}. Añade --apply para guardarlo.\n`);
    return;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
  console.log(`Snapshot guardado en ${out}\n`);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------
async function main(argv) {
  const [command, ...rest] = argv;
  const { flags } = parseArgs(rest);

  if (!command || command === 'help' || flags.help) {
    printHelp();
    return;
  }

  if (typeof flags.root === 'string') process.chdir(resolveRoot(flags));

  switch (command) {
    case 'login':
      await cmdLogin(flags);
      return;
    case 'logout':
      cmdLogout(flags);
      return;
    case 'doctor':
      await cmdDoctor(flags);
      return;
    case 'setup':
      await cmdSetup(flags);
      return;
    case 'plan':
      await cmdPlan(flags);
      return;
    case 'state':
      await cmdState(flags);
      return;
    case 'seed':
      await cmdSeed(flags);
      return;
    case 'sync-hu':
      await cmdSyncHu(flags);
      return;
    case 'archive-sprint':
      await cmdArchiveSprint(flags);
      return;
    case 'snapshot':
      await cmdSnapshot(flags);
      return;
    default:
      console.error(`Comando desconocido: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

main(process.argv.slice(2)).catch((error) => {
  if (!process.exitCode) process.exitCode = 1;
  if (!error.handled) console.error(`\n[error] ${error.message}\n`);
});
