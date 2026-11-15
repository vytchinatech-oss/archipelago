// Счётчик строк вне словаря — «храповик» (решение CEO № 19 и № 30, условие 4; задача 5 этапа 0а).
// Считает строки кода с кириллицей вне комментариев и тексты — строковые литералы с кириллицей (заместитель № 25) — во всех файлах src (.js, .mjs, .html, .css), кроме src/data,
// и сверяет с эталоном tests/text-count.json по каждому файлу. Новый каталог в src попадает в счёт сам.
// Больше эталона — красный: новый текст для игрока идёт в словарь (src/data/texts.js, функция tx), а не строкой в коде.
// Меньше эталона — тоже красный, пока эталон не опущен: node tools/text-count.mjs --write (храповик не оставляет запаса).
// Поднять эталон или внести новый файл с кириллицей — только решением заместителя: --write --allow-more, номер решения — в коммит.
// src/data — таблицы (названия зданий, обучение, сам словарь) — не считается: их перевод — отдельная работа этапа М.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const BASE = new URL('tests/text-count.json', ROOT);
export const SKIP = ['data/'];
export const EXT = /\.(m?js|html|css)$/;
const CYR = /[А-Яа-яЁё]/;

/* Разбор JS: код без комментариев (заменены пробелами, переводы строк сохранены — номера строк не сдвигаются)
   и число текстов — строковых литералов с кириллицей (решение заместителя № 25). Шаблон `…${…}…` — один текст,
   если кириллица в его собственных частях; строки внутри ${…} считаются отдельно. Регулярка с кириллицей — тоже текст.
   Понимает строки '…', "…", шаблоны с вложенностью и регулярные выражения /…/. */
export function scanJs(s) {
  let out = '', i = 0, n = s.length, prev = '', texts = 0;
  const stack = []; // подстановки `${ … }`: { depth — глубина фигурных скобок внутри, tpl — шаблон, к которому вернуться }
  const blank = t => t.replace(/[^\n]/g, ' ');
  const regexOk = () => !prev || /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(?:return|typeof|case|do|else|in|of|void|yield|await|delete|new)$/.test(prev);
  while (i < n) {
    const c = s[i], d = s[i + 1], top = stack[stack.length - 1];
    if (c === '/' && d === '/') { let j = s.indexOf('\n', i); if (j < 0) j = n; out += blank(s.slice(i, j)); i = j; continue; }
    if (c === '/' && d === '*') { let j = s.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; out += blank(s.slice(i, j)); i = j; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && s[j] !== c && s[j] !== '\n') j += s[j] === '\\' ? 2 : 1;
      const lit = s.slice(i, j + 1); if (CYR.test(lit)) texts++;
      out += lit; i = j + 1; prev = 'x'; continue;
    }
    if (c === '`' || (c === '}' && top && top.depth === 0)) {
      const tpl = c === '`' ? { cyr: false } : stack.pop().tpl;
      let j = i + 1;
      while (j < n && s[j] !== '`' && !(s[j] === '$' && s[j + 1] === '{')) j += s[j] === '\\' ? 2 : 1;
      if (CYR.test(s.slice(i + 1, j))) tpl.cyr = true;
      if (s[j] === '$') { out += s.slice(i, j + 2); i = j + 2; stack.push({ depth: 0, tpl }); prev = '{'; }
      else { out += s.slice(i, j + 1); i = j + 1; prev = 'x'; if (tpl.cyr) texts++; }
      continue;
    }
    if (c === '/' && regexOk()) {
      let j = i + 1, cls = false;
      while (j < n && s[j] !== '\n' && (cls || s[j] !== '/')) { if (s[j] === '\\') j++; else if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; j++; }
      const lit = s.slice(i, j + 1); if (CYR.test(lit)) texts++;
      out += lit; i = j + 1; prev = 'x'; continue;
    }
    if (top) { if (c === '{') top.depth++; else if (c === '}') top.depth--; }
    out += c; i++;
    if (!/\s/.test(c)) prev = /[\w$]/.test(c) && /[\w$]$/.test(prev) ? prev + c : c;
  }
  return { code: out, texts };
}
export const stripJs = s => scanJs(s).code;

/* HTML без комментариев <!-- … -->; внутри <script> и <style> — тот же разбор, что для JS (блочные и строчные комментарии). */
export const stripHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
  .replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (m, a, t, body, b) => a + stripJs(body) + b);

/* CSS без комментариев. */
export const stripCss = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));

const stripFor = f => f.endsWith('.html') ? stripHtml : f.endsWith('.css') ? stripCss : stripJs;

/* Строки с кириллицей вне комментариев: [{line, text}]; file — имя файла (по нему выбирается разбор). */
export function cyrLines(src, file = 'x.js') {
  if (file === true) file = 'x.html';
  const code = stripFor(file)(src).split('\n'), raw = src.split('\n');
  return code.flatMap((l, k) => CYR.test(l) ? [{ line: k + 1, text: raw[k].trim().slice(0, 120) }] : []);
}

/* Все считаемые файлы src (пути через «/»). */
export const listFiles = (srcUrl = new URL('src/', ROOT)) => readdirSync(srcUrl, { recursive: true })
  .map(f => f.split('\\').join('/')).filter(f => EXT.test(f) && !SKIP.some(d => f.startsWith(d))).sort();

/* Тексты с кириллицей (решение заместителя № 25): JS — строковые литералы (scanJs); CSS — строки в кавычках;
   HTML — куски текста между тегами и значения атрибутов, внутри <script> — как JS. */
const quoted = t => (t.match(/(["'])(?:\\.|(?!\1)[^\\\n])*\1/g) || []).filter(q => CYR.test(q)).length;
export function countTexts(src, file = 'x.js') {
  if (file.endsWith('.css')) return quoted(stripCss(src));
  if (!file.endsWith('.html')) return scanJs(src).texts;
  let n = 0;
  const rest = src.replace(/<!--[\s\S]*?-->/g, ' ').replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (m, a, t, body) => {
    n += t.toLowerCase() === 'script' ? scanJs(body).texts : quoted(stripCss(body)); return ' ';
  });
  for (const m of rest.matchAll(/>([^<]*)</g)) if (CYR.test(m[1])) n++;
  for (const m of rest.matchAll(/<[^>]*>/g)) n += quoted(m[0]) + (m[0].match(/=\s*[^\s"'>]+/g) || []).filter(v => CYR.test(v)).length;
  return n;
}

/* Счёт по файлам: { 'ui/app.js': { lines: 43, texts: 51 }, … }; файлы без кириллицы не пишутся. */
export function countAll(srcUrl = new URL('src/', ROOT)) {
  const out = {};
  for (const f of listFiles(srcUrl)) {
    const s = readFileSync(new URL(f, srcUrl), 'utf8'), lines = cyrLines(s, f).length, texts = countTexts(s, f);
    if (lines || texts) out[f] = { lines, texts };
  }
  return out;
}

const WHAT = { lines: 'строк с кириллицей', texts: 'текстов с кириллицей' };

export function compare(now, base) {
  const out = [];
  for (const f of Object.keys(now).sort()) for (const k of Object.keys(WHAT)) {
    const a = now[f][k], b = base[f]?.[k] || 0;
    if (a > b) out.push(`${f}: ${WHAT[k]} ${a}, в эталоне ${b}${base[f] ? '' : ' (новый файл)'} — новый текст для игрока — в словарь src/data/texts.js через tx('ключ')`);
  }
  for (const f of Object.keys(base).sort()) for (const k of Object.keys(WHAT)) {
    const a = now[f]?.[k] || 0, b = base[f][k];
    if (a < b) out.push(`${f}: ${WHAT[k]} ${a}, в эталоне ${b} — хорошо; опустите эталон: node tools/text-count.mjs --write`);
  }
  return out;
}

const sum = (o, k) => Object.values(o).reduce((a, b) => a + b[k], 0);
const total = o => `строк ${sum(o, 'lines')}, текстов ${sum(o, 'texts')}`;
const sorted = o => Object.fromEntries(Object.keys(o).sort().map(f => [f, o[f]]));

if (import.meta.url === `file://${process.argv[1]}`) {
  const now = countAll(), args = process.argv.slice(2);
  if (args.includes('--list')) {
    const f = args[args.indexOf('--list') + 1];
    if (!f || !existsSync(new URL('src/' + f, ROOT))) { console.error(`Укажите файл из src, например: node tools/text-count.mjs --list ui/app.js${f ? ` (файла src/${f} нет)` : ''}`); process.exit(1); }
    for (const r of cyrLines(readFileSync(new URL('src/' + f, ROOT), 'utf8'), f)) console.log(`${f}:${r.line}  ${r.text}`);
  } else if (args.includes('--write')) {
    const old = existsSync(BASE) ? JSON.parse(readFileSync(BASE, 'utf8')) : null;
    const up = old ? [...new Set(compare(now, old).filter(l => !l.includes('опустите')).map(l => l.split(':')[0]))] : [];
    if (up.length && !args.includes('--allow-more')) {
      console.error(`Эталон поднялся бы (${up.join(', ')}). Текст — в словарь. Поднять — только решением заместителя: --allow-more, номер решения — в коммит.`);
      process.exit(1);
    }
    writeFileSync(BASE, JSON.stringify(sorted(now), null, 1).replace(/\{\n\s+("lines": \d+),\n\s+("texts": \d+)\n\s+\}/g, '{ $1, $2 }') + '\n');
    console.log(`Эталон вне словаря записан: ${total(now)}.`);
  } else {
    const base = JSON.parse(readFileSync(BASE, 'utf8')), bad = compare(now, base);
    if (bad.length) { const f = bad[0].split(':')[0];
      console.error('Строки вне словаря разошлись с эталоном tests/text-count.json:\n  ' + bad.join('\n  ') + `\n  Посмотреть строки файла: node tools/text-count.mjs --list ${f}`); process.exit(1); }
    console.log(`Вне словаря: ${total(now)} — не больше эталона.`);
  }
}
