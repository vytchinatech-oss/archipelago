// Прогон стратегий игрока: стратегии × карты × строи, одно зерно.
//   node tools/strategies.mjs                 — таблица, 30 лет
//   node tools/strategies.mjs --months 60     — короче
//   node tools/strategies.mjs --write         — переснять эталон tests/baseline.json
//   node tools/strategies.mjs --compare [файл] — сравнить с эталоном (по умолчанию tests/baseline.json;
//                                               эталон правил 0.5.3 навсегда лежит в tests/baseline-0.5.3.json)
// tests/baseline.json сверяется в npm test всегда: правила или бот поменялись — тест красный, пока эталон не переснят;
// в коммит — итог --compare против 0.5.3. Отпечатки зависят от дробной арифметики Node: на другой Node эталон может разойтись.
import { readFileSync, writeFileSync } from 'node:fs';
import { sweep, NAMES, SEED, SHORT } from '../tests/strategies.mjs';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const months = +(opt('--months') || 360), FILE = new URL('../tests/baseline.json', import.meta.url);
const CMP = args.includes('--compare') && opt('--compare') && !opt('--compare').startsWith('--') ? new URL('../' + opt('--compare'), import.meta.url) : FILE;
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const t0 = Date.now(), rows = sweep({ months, seed: SEED });
const GOV = { demo: 'демократия', parl: 'республика', mon: 'монархия' };
const line = r => [NAMES[r.strat].padEnd(16), `карта ${r.mi}`, GOV[r.gov].padEnd(10),
  (r.over ? `пал на ${r.overAt} мес.` : 'у власти').padEnd(15), `цели ${r.goals}/9`.padEnd(9),
  `нас. ${r.pop}`.padEnd(10), `казна ${r.money}`.padEnd(14), `мин ${r.low}`.padEnd(11), `скука ${Math.round(r.boredom * 100)}%`.padEnd(10), `неудач ${r.fails}`].join(' ');

if (args.includes('--compare')) {
  const base = JSON.parse(readFileSync(CMP, 'utf8')), key = r => `${r.strat}/${r.mi}/${r.gov}`, old = new Map(base.runs.map(r => [key(r), r]));
  console.log(`Эталон: версия ${base.version}, ${base.months} мес., зерно ${base.seed}. Сейчас: ${pkg.version}, ${months} мес.`);
  let same = 0;
  for (const r of rows) { const o = old.get(key(r)); if (o && o.fp === r.fp) { same++; continue; }
    console.log('было  ' + (o ? line(o) : '—')); console.log('стало ' + line(r)); }
  console.log(`Совпало ${same} из ${rows.length}.`);
} else {
  for (const r of rows) console.log(line(r));
  if (args.includes('--write')) {
    const short = Object.fromEntries(sweep({ months: SHORT, seed: SEED }).map(r => [`${r.strat}/${r.mi}/${r.gov}`, r.fp]));
    writeFileSync(FILE, JSON.stringify({ version: pkg.version, months, seed: SEED, date: new Date().toISOString().slice(0, 10),
      short: { months: SHORT, fp: short }, runs: rows }, null, 1) + '\n');
    console.log('Эталон записан: tests/baseline.json');
  }
}
console.log(`${rows.length} партий за ${((Date.now() - t0) / 1000).toFixed(1)} с`);
