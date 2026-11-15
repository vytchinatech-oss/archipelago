// Защита «число тестов не меньше эталона» (решение CEO № 18, задача 4 этапа 0а; урок qa — заместитель № 15).
// Сверяет счёт последнего npm test (.test-count.json, пишет tools/count-reporter.mjs) с эталоном tests/test-count.json
// по каждому файлу: меньше — красный (тест удалён, выключен или файл не запустился); больше — тоже красный, пока эталон
// не поднят: node tools/test-count.mjs --write. Опускать эталон — только решением заместителя (предложение № 18в).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const NOW = new URL('.test-count.json', ROOT), BASE = new URL('tests/test-count.json', ROOT);

export function compare(now, base) {
  const out = [];
  for (const f of Object.keys(base).sort()) {
    const a = now[f] || 0, b = base[f];
    if (a < b) out.push(`${f}: тестов ${a}, в эталоне ${b} — тест удалён, выключен или файл не запустился`);
    else if (a > b) out.push(`${f}: тестов ${a}, в эталоне ${b} — поднимите эталон: node tools/test-count.mjs --write`);
  }
  for (const f of Object.keys(now).sort()) if (!(f in base)) out.push(`${f}: новый файл (${now[f]}) — внесите в эталон: node tools/test-count.mjs --write`);
  return out;
}

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(NOW)) { console.error('Нет .test-count.json: запустите npm test.'); process.exit(1); }
  const now = JSON.parse(readFileSync(NOW, 'utf8'));
  if (process.argv.includes('--write')) {
    const old = existsSync(BASE) ? JSON.parse(readFileSync(BASE, 'utf8')) : {};
    const down = Object.keys(old).filter(f => (now[f] || 0) < old[f]);
    if (down.length && !process.argv.includes('--allow-less')) {
      console.error(`Эталон опустился бы (${down.join(', ')}). Только решением заместителя: --allow-less, номер решения — в коммит.`);
      process.exit(1);
    }
    writeFileSync(BASE, JSON.stringify(now, Object.keys(now).sort(), 1) + '\n');
    console.log(`Эталон числа тестов записан: ${sum(now)} (${Object.entries(now).map(([f, n]) => f + ' ' + n).join(', ')}).`);
  } else {
    const base = JSON.parse(readFileSync(BASE, 'utf8')), bad = compare(now, base);
    if (bad.length) { console.error('Число тестов разошлось с эталоном tests/test-count.json:\n  ' + bad.join('\n  ')); process.exit(1); }
    console.log(`Число тестов сходится с эталоном: ${sum(now)}.`);
  }
}
