// Постоянные защиты в npm test (решение CEO № 18, задача 4 этапа 0а; заместитель № 15 и № 18г).
// Ослабить или убрать защиту — только решением заместителя (предложение продюсера № 18в).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { load } from './harness.mjs';
import { STRAT_CODE } from './strategies.mjs';
import { compare } from '../tools/test-count.mjs';

const src = new URL('../src/', import.meta.url);
const files = readdirSync(src, { recursive: true }).filter(f => f.endsWith('.js')).map(f => [f, readFileSync(new URL(f, src), 'utf8')]);

/* Текст без тела функции name (по парным скобкам). */
const cutFn = (s, name) => { const i = s.indexOf(`function ${name}(`); if (i < 0) return s;
  let j = s.indexOf('{', i), d = 0; for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && !--d) break; }
  return s.slice(0, i) + s.slice(j + 1); };

test('защита версии ловит число справа и слева, в литерале и сразу после migrateSave', () => {
  const src = "function migrateSave(o){if(o.v===3){o.v=4}\n/* комм */}\nvar f=o=>o.v===4;var g=o=>4>=o.v;var h={v:4};var k=S.v<=SAVE_V;";
  const found = [...cutFn(src, 'migrateSave').matchAll(/(?:\.v\s*(?:[=!]==?|[<>]=?|=)|[{,]\s*v\s*:)\s*\d+|\d+\s*(?:[=!]==?|[<>]=?)\s*[\w$.]*\.v\b/g)].map(m => m[0]);
  assert.deepEqual(found, ['.v===4', '4>=o.v', '{v:4']);
});

test('версия сохранения — одна константа SAVE_V: число не повторяется в коде, кроме шагов перевода', () => {
  const defs = files.filter(([, s]) => /\bSAVE_V\s*=|\bSAVE_MIN\s*=/.test(s)).map(([f]) => f);
  assert.deepEqual(defs, ['core/constants.js'], 'SAVE_V и SAVE_MIN задаются ровно в одном месте');
  // Шаги перевода (migrateSave: «если v===3 … v=4») — единственное место, где номера версий пишутся числом.
  const bad = [];
  for (const [f, s] of files) {
    for (const m of cutFn(s, 'migrateSave').matchAll(/(?:\.v\s*(?:[=!]==?|[<>]=?|=)|[{,]\s*v\s*:)\s*\d+|\d+\s*(?:[=!]==?|[<>]=?)\s*[\w$.]*\.v\b/g)) bad.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(bad, [], 'номер версии сохранения числом вне SAVE_V');
});

test('версия сохранения: новая партия и перевод старой дают SAVE_V; новее SAVE_V, старше SAVE_MIN и без версии — не открывается', () => {
  const sav = readFileSync(new URL('./fixtures/save-0.5.3.json', import.meta.url), 'utf8');
  const r = load()(`S=newGame(0,1);govInit(S,'demo','norm');const fresh=S.v;const old=loadStr(${JSON.stringify(sav)}).v;
    const no=v=>{const o=JSON.parse(saveStr());o.v=v;try{loadStr(JSON.stringify(o));return ''}catch(e){return e.message}};
    JSON.stringify({fresh,old,bare:newGame(0,1).v===SAVE_V,same:fresh===SAVE_V&&old===SAVE_V,newer:no(SAVE_V+1),older:no(SAVE_MIN-1),none:no(undefined)})`);
  assert.deepEqual(JSON.parse(r), { fresh: 4, old: 4, bare: true, same: true,
    newer: 'сохранение новее игры: v5', older: 'сохранение слишком старое: v2', none: 'в сохранении нет версии' });
});

test('цели: у каждой есть проверка ok и доля пути pr; выполненная цель — доля 1 (стратегии считают скуку по GOALS)', () => {
  // Умный бот 15 лет на карте 1: каждый месяц сверяем ok и pr у всех целей.
  const r = JSON.parse(load()(STRAT_CODE + `
    const shape=GOALS.every(g=>typeof g.ok==='function'&&typeof g.pr==='function'&&g.t&&g.rw>0);
    S=newGame(1,1);govInit(S,'mon','norm');computeConn();computeCov();P={acts:0,fails:0};BOTS.smart.start();
    let c=census(),r=null;const hit=new Set(),bad=[];
    for(let m=0;m<180&&!S.over;m++){BOTS.smart.move(m,c,r);r=tick();computeCov();c=r.cen||census();
      GOALS.forEach((g,k)=>{const ok=!!g.ok(c,r),full=g.pr(c,r)>=1;if(ok)hit.add(k);if(ok!==full)bad.push(k+':'+m+(ok?' ok, доля<1':' не ok, доля 1'))});checkGoals(c,r)}
    JSON.stringify({shape,hit:hit.size,bad:bad.slice(0,5)})`));
  assert.equal(r.shape, true, 'у цели нет ok, pr, текста или награды');
  assert.deepEqual(r.bad, [], 'доля пути 1 должна быть ровно тогда, когда цель выполнена');
  assert.ok(r.hit >= 6, `проверено только ${r.hit} целей из 9 — бот не дошёл до большинства`);
});

test('стратегии берут долю пути из GOALS: подмена pr в целях меняет то, что видят стратегии', () => {
  const r = load()(STRAT_CODE + `S=newGame(0,1);govInit(S,'demo','norm');computeConn();computeCov();
    GOALS.forEach((g,k)=>{g.pr=()=>(k+1)/100});JSON.stringify(goalProg(census(),null))`);
  assert.deepEqual(JSON.parse(r), [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09]);
});

test('число тестов: меньше эталона, больше эталона и новый файл — находка; ровно — нет', () => {
  const base = { 'a.test.mjs': 3, 'b.test.mjs': 2 };
  assert.deepEqual(compare({ 'a.test.mjs': 3, 'b.test.mjs': 2 }, base), []);
  const less = compare({ 'a.test.mjs': 2, 'b.test.mjs': 2 }, base);
  assert.equal(less.length, 1); assert.match(less[0], /в эталоне 3 — тест удалён/);
  assert.match(compare({ 'a.test.mjs': 3 }, base)[0], /^b\.test\.mjs: тестов 0/, 'файл не запустился — красный');
  assert.match(compare({ 'a.test.mjs': 4, 'b.test.mjs': 2 }, base)[0], /поднимите эталон/);
  assert.match(compare({ ...base, 'c.test.mjs': 1 }, base)[0], /новый файл/);
});

test('эталон числа тестов и эталон партий на месте; эталон партий помнит версию Node, она же в engines и .nvmrc', () => {
  const cnt = JSON.parse(readFileSync(new URL('./test-count.json', import.meta.url), 'utf8'));
  for (const f of readdirSync(new URL('./', import.meta.url)).filter(f => f.endsWith('.test.mjs'))) assert.ok(cnt[f] > 0, `${f} нет в tests/test-count.json`);
  const base = JSON.parse(readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'));
  assert.match(base.node ?? '', /^\d+\.\d+\.\d+$/, 'в tests/baseline.json нет версии Node (node tools/strategies.mjs --write)');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  // Отпечатки зависят от Node: основная версия эталона закреплена в engines и .nvmrc (замечание техдиректора).
  const major = base.node.split('.')[0], nvm = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim();
  assert.equal(pkg.engines.node, `${major}.x`, 'engines в package.json не совпадает с Node эталона партий');
  assert.equal(nvm, major, '.nvmrc не совпадает с Node эталона партий');
  assert.match(pkg.scripts.test, /count-reporter\.mjs[\s\S]*&& node tools\/test-count\.mjs$/, 'сверка числа тестов выпала из npm test');
});
