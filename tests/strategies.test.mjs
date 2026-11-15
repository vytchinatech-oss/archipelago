// Повторимые прогоны и эталон (решение заместителя № 6, OFFICE.md, раздел 9а).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { load } from './harness.mjs';
import { play, sweep, STRATS, MAPS, GOVS, SEED, SHORT } from './strategies.mjs';

const base = JSON.parse(readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'));

test('в логике (src/sim) нет Math.random — только rnd() с зерном партии', () => {
  const dir = new URL('../src/sim/', import.meta.url);
  const bad = readdirSync(dir).filter(f => /Math\.random/.test(readFileSync(new URL(f, dir), 'utf8')));
  assert.deepEqual(bad, []);
});

test('одно зерно — одна партия, другое зерно — другая', () => {
  const a = play('smart', 0, 'demo', { months: SHORT, seed: 7 }), b = play('smart', 0, 'demo', { months: SHORT, seed: 7 });
  const c = play('smart', 0, 'demo', { months: SHORT, seed: 8 });
  assert.equal(a.fp, b.fp); assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.notEqual(a.fp, c.fp);
});

test('сохранение несёт поток случайности: загрузка посередине не меняет партию', () => {
  const go = mid => load()(`setup(1,'mon','norm',5);S.money=20000;grid();const ts=['house','farm','shop','house','wind','house','port'];
    for(let m=0;m<48;m++){if(m===24&&${mid})S=loadStr(saveStr());if(m%4==0)near(ts[m/4%ts.length],S.hall);const r=tick();computeCov();checkGoals(r.cen,r)}
    JSON.stringify([S.money,S.pop,S.happy,S.appr,S.rs,S.log.map(l=>l.t),S.nat.map(n=>[n.rel,n.money,n.cr])])`);
  assert.equal(go(1), go(0));
});

test('настоящее сохранение 0.5.3 (без зерна) открывается, получает поток и играет 5 лет', () => {
  // tests/fixtures/save-0.5.3.json снят кодом 0.5.3 (коммит 04209c5): карта 1, монархия, 36 месяцев игры.
  const sav = readFileSync(new URL('./fixtures/save-0.5.3.json', import.meta.url), 'utf8');
  const r = load()(`S=loadStr(${JSON.stringify(sav)});const had='rs' in S,m0=S.month;computeConn();computeCov();for(let m=0;m<60&&!S.over;m++){const r=tick();computeCov();checkGoals(r.cen,r)}
    JSON.stringify({had,v:S.v,rs:S.rs>=0,ok:isFinite(S.money)&&S.pop>0,months:S.month-m0})`);
  assert.deepEqual(JSON.parse(r), { had: false, v: 4, rs: true, ok: true, months: 60 });
});

test('тесты не подменяют Math.random: логика берёт случайность из rnd(), подмена молча не действует', () => {
  const dir = new URL('./', import.meta.url);
  const bad = readdirSync(dir).filter(f => f.endsWith('.mjs') && /Math\.random\s*=[^=]/.test(readFileSync(new URL(f, dir), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')));
  assert.deepEqual(bad, []);
});

test('newGame без зерна или с null берёт случайное зерно, с зерном — его', () => {
  const r = load()(`JSON.stringify([newGame(0,null).rs===newGame(0,null).rs,newGame(0).rs===newGame(0).rs,newGame(0,42).rs])`);
  assert.deepEqual(JSON.parse(r), [false, false, 42]);
});

test(`эталон: ${STRATS.length} стратегий × ${MAPS.length} карты × ${GOVS.length} строя по ${SHORT} мес. без сбоев и повторимо`, () => {
  const rows = sweep({ months: SHORT, seed: SEED });
  assert.equal(rows.length, STRATS.length * MAPS.length * GOVS.length);
  for (const r of rows) assert.ok(r.boredom >= 0 && r.boredom <= 1, 'скука вне 0..1');
  // Сверка идёт всегда, при любой версии: правила или бот поменялись — отпечатки разошлись, тест красный, пока эталон
  // не переснят (node tools/strategies.mjs --write); в коммит — итог --compare tests/baseline-0.5.3.json.
  const diff = rows.filter(r => base.short.fp[`${r.strat}/${r.mi}/${r.gov}`] !== r.fp).map(r => `${r.strat}/${r.mi}/${r.gov}`);
  // Отпечатки зависят от дробной арифметики Node: на другой основной версии расхождение — сначала проверить на версии эталона.
  const nodeNote = base.node && base.node.split('.')[0] !== process.versions.node.split('.')[0]
    ? `эталон снят на Node ${base.node}, сейчас ${process.versions.node}: эталон НЕ переснимать — прогоните на Node ${base.node.split('.')[0]} (.nvmrc). ` : '';
  assert.deepEqual(diff, [], nodeNote || `партии разошлись с эталоном ${base.version}: переснимите эталон и запишите разницу с 0.5.3`);
});
