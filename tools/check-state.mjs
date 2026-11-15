#!/usr/bin/env node
// Сверка состояния одной командой — ворота 0 и 4, аудит (docs/OFFICE.md, раздел 5а; п. 7 — уроки, У21; п. 8 — статусы задач, У22).
//
//   npm run check                         ворота 0: начало чата
//   npm run check -- --gate 4             ворота 4: перед пушем (рабочая копия новее main — это ожидаемо)
//   npm run check -- --published 0.5.4    версия из заголовка артефакта (скрипт сам его не видит)
//   npm run check -- --tests              ещё прогнать npm test и сверить число тестов
//   npm run check -- --no-fetch           без git fetch (ls-remote по веткам всё равно идёт в сеть)
//
// Код выхода: 0 — всё сходится; 1 — есть находки (позвать контролёра, работать дальше);
// 2 — СТОП: расхождение версии или main, сначала сказать CEO (OFFICE.md, раздел 5, ворота 0);
// 3 — неверный вызов скрипта.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DAY = 24 * 3600 * 1000;
export const LIMITS = { auditDays: 8, lockHours: 24, branchDays: 7 };

// ---------- разбор STATUS.md (чистые функции, проверяются в tests/check-state.test.mjs) ----------

export function parseStatus(text) {
  const pick = (re) => { const m = text.match(re); return m ? m[1].trim() : null; };
  const waits = text.match(/Ждут ответа CEO[^\n]*\n((?:- .*\n?)+)/);
  return {
    updated: pick(/^Обновлено:\s*([^.\n]+?)\.\s/m),
    version: pick(/Версия\s+(\d+\.\d+\.\d+)/),
    published: pick(/Опубликована\s+(\d+\.\d+\.\d+)/),
    artifact: pick(/(https:\/\/claude\.ai\/artifact\/[A-Za-z0-9_-]+)/),
    tests: (() => { const v = pick(/Тестов в `main`:\s*(\d+)/); return v == null ? null : Number(v); })(),
    lockCode: pick(/^- Код\s*\(этап[^)]*\):\s*(.+)$/m),
    lockDesign: pick(/^- Дизайн\s*\(этап[^)]*\):\s*(.+)$/m),
    stops: pick(/^\*\*Стопы:\*\*\s*(.+)$/m),
    waitingCEO: waits ? waits[1].split('\n').filter((l) => l.startsWith('- ')).length : 0,
  };
}

// Уроки (У21, заместитель № 19): у строки LESSONS.md со статусом «действует» место из колонки «Где»
// должно быть в репозитории. Возвращает [{id, missing: [...], unchecked: [...]}] — только строки с проблемами.
export function checkLessons(text, exists) {
  const out = [];
  for (const line of text.split('\n')) {
    const c = line.split('|').map((x) => x.trim());
    if (c.length < 9 || !/^У\d+$/.test(c[1]) || !/^действует/i.test(c[7])) continue;
    const missing = [], unchecked = [];
    for (const part of c[6].split(';').map((x) => x.trim()).filter(Boolean)) {
      const files = [...part.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((n) => /\.\w+$|\/$/.test(n));
      const words = part.replace(/`[^`]*`/g, ''); // место вне репозитория: файл-черновик рядом его не подтверждает
      if (/задач|навык|аккаунт|карточк|предлож/i.test(words) || !files.length) { unchecked.push(part); continue; }
      for (const f of files) if (!exists(f)) missing.push(f);
    }
    if (missing.length || unchecked.length) out.push({ id: c[1], missing, unchecked });
  }
  return out;
}

// У22 (заместитель № 20): задача, у которой в docs/stages/*.md статус не «сделано»,
// не должна называться сделанной в STATUS.md («задача 2 сделана», «задачи 1–2 сделаны»).
export function notDoneTasks(stageText) {
  const ids = new Set();
  for (const line of stageText.split('\n')) {
    const c = line.split('|').map((x) => x.trim());
    if (c.length >= 5 && /^\d+$/.test(c[1]) && !/^сделано/i.test(c[c.length - 2])) ids.add(Number(c[1]));
  }
  return ids;
}

// Ключ этапа: имя файла docs/stages/<этап>.md или слово после «этапа»; латинская «a» = кириллическая «а».
export const stageKey = (s) => s.toLowerCase().replace(/a/g, 'а').replace(/[^0-9а-яё]/g, '');

// notDone — Map: этап → Set номеров не «сделано»; без «этапа X» в фразе — этап defaultStage.
// Ловит «задача N [этапа X] [—:«уже] сделана/готова» и «задачи N–M | N и M | N, M …».
export function falseDone(statusText, notDone, defaultStage) {
  const out = [];
  const re = /задач[аи]\s+(\d+)((?:\s*(?:[–-]|и|,)\s*\d+)*)(?:\s+этапа\s+([0-9A-Za-zА-Яа-яЁё]+))?[\s—:«»"]*(?:уже\s+)?(?:сделан|готов)/gi;
  for (const m of statusText.matchAll(re)) {
    const nums = [Number(m[1])];
    for (const t of m[2].matchAll(/([–-]|и|,)\s*(\d+)/g)) {
      const n = Number(t[2]);
      if (/[–-]/.test(t[1])) for (let k = nums[nums.length - 1] + 1; k <= n; k++) nums.push(k); else nums.push(n);
    }
    const set = notDone.get(stageKey(m[3] || defaultStage)) || new Set();
    for (const n of nums) if (set.has(n)) out.push({ task: n, text: m[0] });
  }
  return out;
}

export const branchMentioned = (text, b) => new RegExp(`(^|[^\\w-])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w-])`).test(text);

export const lockFree = (line) => line != null && /^никто\.?$/i.test(line.trim());

export function latestAudit(names) {
  const dates = names.map((n) => n.match(/^(\d{4}-\d{2}-\d{2})\.md$/)).filter(Boolean).map((m) => m[1]).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// ---------- обращения к git и файлам ----------

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
const tryRaw = (...args) => { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch { return null; } };

function run(argv) {
  try { return check(argv); } catch (e) { console.error(`check-state: ${e.message}`); return 3; }
}

function check(argv) {
  const opt = { gate: 0, published: null, tests: false, fetch: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { const x = argv[++i]; if (x == null || x.startsWith('--')) throw new Error(`${a}: нужно значение`); return x; };
    if (a === '--gate') opt.gate = Number(val());
    else if (a === '--published') opt.published = val();
    else if (a === '--tests') opt.tests = true;
    else if (a === '--no-fetch') opt.fetch = false;
    else if (a === '-h' || a === '--help') { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).join('\n').replace(/^\/\/ ?/gm, '')); return 0; }
    else throw new Error(`неизвестный ключ ${a}`);
  }
  if (opt.gate !== 0 && opt.gate !== 4) throw new Error('--gate: 0 или 4');

  const rows = []; // [уровень, пункт, текст]: ok | find | stop | info
  const add = (lvl, item, text) => rows.push([lvl, item, text]);
  const now = Date.now();

  const statusText = readFileSync(join(ROOT, 'docs/STATUS.md'), 'utf8');
  const st = parseStatus(statusText);

  // 1. main
  if (opt.fetch) {
    const f = spawnSync('git', ['fetch', '-q', 'origin'], { cwd: ROOT, encoding: 'utf8' });
    if (f.status !== 0) add('find', 1, `git fetch не прошёл: ${(f.stderr || '').trim().split('\n')[0]}`);
  } else add('info', 1, 'git fetch пропущен (--no-fetch): origin/main может быть старым');
  const om = tryGit('log', '-1', '--format=%h|%an|%cI|%s', 'origin/main');
  const branch = tryGit('rev-parse', '--abbrev-ref', 'HEAD');
  if (!om) add('stop', 1, 'нет origin/main');
  else {
    const [h, who, when, subj] = om.split('|');
    add('info', 1, `origin/main: ${h} — ${who}, ${when.replace('T', ' ').slice(0, 16)} — «${subj}»`);
    if (branch !== 'main') add('find', 1, `рабочая ветка — ${branch}, не main`);
    const counts = tryGit('rev-list', '--left-right', '--count', 'HEAD...origin/main');
    if (counts) {
      const [ahead, behind] = counts.split(/\s+/).map(Number);
      if (behind > 0) add('stop', 1, `в origin/main ${behind} коммит(ов), которых нет здесь — git pull --rebase и прочитать их (чужая работа?)`);
      if (ahead > 0 && opt.gate === 0) add('stop', 1, `здесь ${ahead} незапушенных коммит(ов) — на воротах 0 рабочая копия должна совпадать с main`);
      if (ahead > 0 && opt.gate === 4) add('info', 1, `здесь ${ahead} коммит(ов) новее origin/main — на воротах 4 это ожидаемо`);
      if (!ahead && !behind) add('ok', 1, 'рабочая копия = origin/main');
    }
    const dirty = (tryRaw('status', '--porcelain') || '').split('\n').filter(Boolean).map((l) => l.slice(3));
    if (dirty.length) add(opt.gate === 0 ? 'find' : 'info', 1, `незакоммиченные файлы: ${dirty.length} (${dirty.slice(0, 4).join(', ')}${dirty.length > 4 ? ', …' : ''})`);
  }

  // 2. версия
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  const pkgMain = (() => { const t = tryGit('show', 'origin/main:package.json'); try { return t ? JSON.parse(t).version : null; } catch { return null; } })();
  const distFile = join(ROOT, 'dist/index.html');
  const dist = existsSync(distFile) ? (readFileSync(distFile, 'utf8').match(/GAME_VERSION="([^"]+)"/) || [])[1] || null : null;
  const v = { 'package.json': pkg, 'package.json в origin/main': pkgMain, 'STATUS «Версия»': st.version, 'STATUS «Опубликована»': st.published, 'dist/index.html': dist };
  if (opt.published) v['артефакт (--published)'] = opt.published;
  add('info', 2, Object.entries(v).map(([k, x]) => `${k} ${x ?? '—'}`).join('; '));
  const mustEqual = opt.gate === 0
    ? ['package.json', 'package.json в origin/main', 'STATUS «Версия»', 'STATUS «Опубликована»', 'артефакт (--published)']
    : ['package.json', 'STATUS «Версия»'];
  const diff = mustEqual.filter((k) => k in v && v[k] !== pkg);
  if (diff.length) add('stop', 2, `версии не сходятся с package.json (${pkg}): ${diff.join(', ')}`);
  else add('ok', 2, `версия ${pkg} сходится: ${mustEqual.filter((k) => k in v).join(', ')}`);
  if (opt.gate === 4 && st.published && st.published !== pkg) add('info', 2, `STATUS «Опубликована ${st.published}» — до публикации ${pkg} это ожидаемо; после публикации исправить строку`);
  if (dist && dist !== pkg) add('find', 2, `dist/index.html собран для ${dist}, а package.json — ${pkg}: npm run build`);
  if (!opt.published) add('info', 2, `версию артефакта скрипт не видит: сверить заголовок «Архипелаг ${pkg}» по ${st.artifact ?? 'ссылке из STATUS.md'} (или --published)`);

  // 3. тесты
  if (st.tests == null) add('find', 3, 'в STATUS.md нет строки «Тестов в `main`: N»');
  if (opt.tests) {
    const r = spawnSync('npm', ['test'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
    const out = (r.stdout || '') + (r.stderr || '');
    const pass = Number((out.match(/^# pass (\d+)/m) || [])[1] ?? NaN);
    const fail = Number((out.match(/^# fail (\d+)/m) || [])[1] ?? NaN);
    const cnt = (out.match(/Число тестов разошлось[^\n]*\n((?:\s+[^\n]+\n?)*)/) || [])[1];
    if (r.status !== 0 || fail > 0) add('find', 3, `npm test красный: прошло ${pass}, упало ${fail}` + (cnt ? `; число тестов разошлось с эталоном: ${cnt.trim().split(/\n\s*/).join('; ')}` : ''));
    else if (st.tests != null && pass !== st.tests) add('find', 3, `npm test зелёный, тестов ${pass}, а в STATUS.md ${st.tests}`);
    else add('ok', 3, `npm test зелёный, тестов ${pass} = STATUS.md`);
  } else add('info', 3, `тесты не запускались (ключ --tests); в STATUS.md — ${st.tests ?? '—'}`);

  // 4. ветки и замок
  const lsr = tryGit('ls-remote', '--heads', 'origin');
  const heads = [];
  if (lsr == null) add('find', 4, 'ветки на GitHub не проверены: git ls-remote не прошёл (нет сети?)');
  for (const [sha, b] of (lsr || '').split('\n').filter(Boolean).map((l) => l.split('\trefs/heads/'))) {
    let when = tryGit('log', '-1', '--format=%cI', sha);
    if (!when && opt.fetch) { tryGit('fetch', '-q', '--depth=1', 'origin', b); when = tryGit('log', '-1', '--format=%cI', sha); }
    heads.push({ b, sha, when });
  }
  for (const { b, sha, when } of heads.filter((h) => h.b !== 'main')) {
    const days = when ? (now - Date.parse(when)) / DAY : null;
    const tag = `ветка ${b} (${sha.slice(0, 7)}${when ? ', ' + when.slice(0, 10) : ''})`;
    if (!branchMentioned(statusText, b)) add('find', 4, `${tag} не упомянута в STATUS.md`);
    else if (days != null && days <= LIMITS.branchDays) add('info', 4, `${tag}: коммиты за ${LIMITS.branchDays} дн., в STATUS.md описана`);
    else add('ok', 4, `${tag}: в STATUS.md описана`);
  }
  // простой замка — от последнего коммита в любой ветке на GitHub (чат с замком может работать не в main)
  const dates = [tryGit('log', '-1', '--format=%cI', 'origin/main'), ...heads.map((h) => h.when)].filter(Boolean).map(Date.parse);
  const idle = dates.length ? (now - Math.max(...dates)) / 3600000 : null;
  for (const [name, line] of [['Код', st.lockCode], ['Дизайн', st.lockDesign]]) {
    if (line == null) { add('find', 4, `в STATUS.md нет строки замка «${name} (этап …)»`); continue; }
    if (lockFree(line)) { add('ok', 4, `замок «${name}»: свободен`); continue; }
    if (idle != null && idle > LIMITS.lockHours) add('find', 4, `замок «${name}» занят: ${line} — коммитов нет ни в одной ветке ${Math.round(idle)} ч (> ${LIMITS.lockHours}): позвать controller`);
    else add('info', 4, `замок «${name}» занят: ${line} — твой? если чужой и свежий — не начинать, сказать CEO; простой смотри по времени в строке`);
  }

  // 5. стопы и вопросы CEO — актуальность решает человек, скрипт только показывает
  add(st.stops ? 'info' : 'find', 5, st.stops ? `Стопы: ${st.stops}` : 'в STATUS.md нет строки «**Стопы:** …»');
  add('info', 5, `Ждут ответа CEO: ${st.waitingCEO} пункт(ов) — проверь, что они ещё открыты`);

  // 6. аудит
  const auditDir = join(ROOT, 'docs/audits');
  const last = existsSync(auditDir) ? latestAudit(readdirSync(auditDir)) : null;
  if (!last) add('find', 6, 'в docs/audits/ нет отчётов: позвать controller');
  else {
    const days = Math.floor((now - Date.parse(last + 'T00:00:00+03:00')) / DAY);
    if (days > LIMITS.auditDays) add('find', 6, `последний аудит ${last} — ${days} дн. назад (> ${LIMITS.auditDays}): позвать controller, работать дальше`);
    else add('ok', 6, `последний аудит ${last} (${days} дн.)`);
  }

  // 7. уроки «действует» — место существует (У21)
  const lessonsFile = join(ROOT, 'docs/LESSONS.md');
  if (existsSync(lessonsFile)) {
    const exists = (f) => ['', 'docs/', '.claude/agents/'].some((d) => existsSync(join(ROOT, d + f)));
    const bad = checkLessons(readFileSync(lessonsFile, 'utf8'), exists);
    const miss = bad.filter((b) => b.missing.length);
    const unch = bad.filter((b) => b.unchecked.length);
    if (miss.length) add('find', 7, `уроки «действует», но места нет в репозитории: ${miss.map((b) => `${b.id} (${b.missing.join(', ')})`).join('; ')}`);
    if (unch.length) add('find', 7, `уроки «действует», место не проверено скриптом (вне репозитория или «задача»): ${unch.map((b) => b.id).join(', ')} — сверить вручную или сменить статус`);
    if (!bad.length) add('ok', 7, 'уроки «действует»: места на месте');
  }

  // 8. статусы задач этапа в STATUS.md (У22)
  const stagesDir = join(ROOT, 'docs/stages');
  if (existsSync(stagesDir)) {
    const notDone = new Map();
    for (const f of readdirSync(stagesDir).filter((n) => n.endsWith('.md'))) notDone.set(stageKey(f.replace(/\.md$/, '')), notDoneTasks(readFileSync(join(stagesDir, f), 'utf8')));
    const cur = (statusText.match(/^- Код\s*\(этап\s+([^)]+)\)/m) || [])[1] || '';
    const bad = falseDone(statusText, notDone, cur);
    if (bad.length) add('find', 8, `STATUS.md называет сделанными задачи, которые в docs/stages не «сделано»: ${bad.map((b) => `${b.task} («${b.text}»)`).join('; ')}`);
    else add('ok', 8, 'статусы задач этапа в STATUS.md не опережают docs/stages');
  }

  // итог
  const mark = { ok: '✔', info: '·', find: '⚠', stop: '✖' };
  console.log(`Сверка состояния — ворота ${opt.gate} (OFFICE.md, 5а)\n`);
  for (const [lvl, item, text] of rows.sort((a, b) => a[1] - b[1])) console.log(`${mark[lvl]} ${item}. ${text}`);
  const stops = rows.filter((r) => r[0] === 'stop').length;
  const finds = rows.filter((r) => r[0] === 'find').length;
  console.log('');
  if (stops) { console.log(`ИТОГ: СТОП (${stops}) — расхождение версии или main. Сначала сказать CEO и исправить.`); return 2; }
  if (finds) { console.log(`ИТОГ: НАХОДКИ (${finds}) — позвать controller в этом чате и работать дальше.`); return 1; }
  console.log('ИТОГ: СХОДИТСЯ.');
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = run(process.argv.slice(2));
