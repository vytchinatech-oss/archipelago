// Счётчик строк вне словаря — «храповик» в npm test (решение CEO № 19 и № 30, условие 4; задача 5 этапа 0а).
// Ослабить или убрать защиту — только решением заместителя (предложение продюсера № 18в).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripJs, stripHtml, scanJs, countTexts, cyrLines, countAll, compare, listFiles } from '../tools/text-count.mjs';
import { CORE, SIM, VIEW } from '../build.mjs';

const SRC = new URL('../src/', import.meta.url);
const BASE = JSON.parse(readFileSync(new URL('./text-count.json', import.meta.url), 'utf8'));

test('строк с кириллицей вне словаря не больше эталона tests/text-count.json (и эталон не отстал)', () => {
  const bad = compare(countAll(), BASE);
  assert.deepEqual(bad, [], 'Новый текст для игрока — в src/data/texts.js через tx(); убавилось — node tools/text-count.mjs --write');
});

test('разбор: комментарии не считаются, строки, шаблоны и регулярки — считаются', () => {
  const src = [
    "// Комментарий строкой",                          // 1 — нет
    "/* Блочный",                                      // 2 — нет
    "   комментарий */ var a='Текст';",                // 3 — да: код после комментария
    "var u='http://x.ru'; // хвост по-русски",         // 4 — нет: // внутри строки, кириллица в комментарии
    "var t=`раз ${b?'два':`три ${c}`} четыре`;",       // 5 — да
    "var r=/[а-я]+\\/\\*/g; var k=2/3; // Ура",        // 6 — да: регулярка с кириллицей; /* внутри неё не комментарий
    "var s='/* не комментарий */';",                   // 7 — да: это строка, а не комментарий
    "var x=1; /* Тут */ var y=2;",                     // 8 — нет
    "var m=`много",                                    // 9 — да: шаблон на две строки
    "строк` + tx('menu.key');",                            // 10 — да
  ].join('\n');
  assert.deepEqual(cyrLines(src).map(r => r.line), [3, 5, 6, 7, 9, 10]);
  assert.equal(stripJs(src).length, src.length, 'номера строк и позиции не сдвигаются');
  const html = "<!-- Заметка -->\n<p>Привет</p>\n<script>// Комм\nvar a='Б';</script>\n<style>/* Цвет */ a{}</style>";
  assert.deepEqual(cyrLines(html, 'a.html').map(r => r.line), [2, 4]);
  assert.deepEqual(cyrLines("/* Цвет */\na::after{content:'Новое'}", 'a.css').map(r => r.line), [2]);
  assert.equal(stripHtml(html).length, html.length);
  // Тексты (заместитель № 25): шаблон — один текст по своим частям, строки в ${…} — отдельно; комментарии — нет.
  assert.equal(scanJs(src).texts, 7, "'Текст', `раз…четыре`, 'два', `три`, /[а-я]+/, '/* не комментарий */', `много строк`");
  assert.equal(countTexts(html, 'a.html'), 2);
  assert.equal(countTexts('<b title="Подсказка">Да</b> <i>x</i>', 'a.html'), 2);
  assert.equal(countTexts('<h1 title=Название>x</h1>', 'a.html'), 1, 'атрибут без кавычек (qa, повторный круг)');
});

test('слияние двух строк с текстом в одну освобождает строку, но не текст: новая строка — красный (заместитель № 25)', () => {
  const was = "var a='Первый';\nvar b='Второй';", now = "var a='Первый', b='Второй';\nvar c='Новый';";
  const cnt = s => ({ 'f.js': { lines: cyrLines(s).length, texts: scanJs(s).texts } });
  const bad = compare(cnt(now), cnt(was));
  assert.equal(bad.length, 1, bad.join('\n'));
  assert.match(bad[0], /текстов с кириллицей 3, в эталоне 2/);
});

test('разбор не ломает код: каждый файл src без комментариев остаётся разборчивым JS', () => {
  const bad = [];
  for (const f of readdirSync(SRC, { recursive: true }).filter(f => f.endsWith('.js'))) {
    const s = readFileSync(new URL(f, SRC), 'utf8');
    try { new Function(stripJs(s)); } catch (e) { bad.push(`${f}: ${e.message}`); }
  }
  assert.deepEqual(bad, []);
});

test('подмена: новая строка с текстом в копии src — красный; та же строка в комментарии или через tx() — нет', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'arch-text-')), src = join(dir, 'src');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(SRC, src, { recursive: true });
  const url = pathToFileURL(src + '/');
  assert.deepEqual(compare(countAll(url), BASE), [], 'копия совпадает с эталоном');
  const add = (f, line) => (mkdirSync(dirname(join(src, f)), { recursive: true }), writeFileSync(join(src, f), (existsSync(join(src, f)) ? readFileSync(join(src, f), 'utf8') : '') + '\n' + line + '\n'));
  add('ui/app.js', "// Новая подсказка игроку\nconst HINT_OK=tx('hint.new');");
  assert.deepEqual(compare(countAll(url), BASE), [], 'комментарий и tx() не считаются');
  add('ui/app.js', "const HINT_BAD='Новая подсказка игроку';");
  add('ui/fresh.js', "toast(`Готово`);");
  add('shell.html', '<p>Новый абзац</p>');
  add('game/new.mjs', "export const t='Новый каталог';");
  add('styles.css', "b::after{content:'Новое'}");
  add('data/texts.js', "const X='словарь не считается';");
  const bad = compare(countAll(url), BASE), files = [...new Set(bad.map(l => l.split(':')[0]))].sort();
  assert.deepEqual(files, ['game/new.mjs', 'shell.html', 'styles.css', 'ui/app.js', 'ui/fresh.js'], bad.join('\n'));
  assert.ok(bad.every(l => /в словарь/.test(l)), bad.join('\n'));
  assert.match(bad.join('\n'), /game\/new\.mjs.*новый файл/);
  assert.match(bad.join('\n'), /styles\.css/);
  assert.match(bad.join('\n'), /ui\/app\.js.*в словарь/);
  assert.match(bad.join('\n'), /ui\/fresh\.js.*новый файл/);
  assert.match(bad.join('\n'), /shell\.html/);
});

test('счёт видит каждый файл сборки вне src/data (списки build.mjs), shell.html и styles.css', () => {
  const seen = new Set(listFiles());
  const miss = [...CORE, ...SIM, ...VIEW, 'shell.html', 'styles.css'].filter(f => !seen.has(f));
  assert.deepEqual(miss, []);
});

test('храповик: меньше эталона — тоже красный, пока эталон не опущен', () => {
  const f = Object.keys(BASE)[0], now = { ...BASE, [f]: { ...BASE[f], texts: BASE[f].texts - 1 } };
  assert.match(compare(now, BASE).join('\n'), /опустите эталон/);
});
