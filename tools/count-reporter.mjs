// Репортёр node --test: считает тесты верхнего уровня по файлам и пишет JSON (защита этапа 0а, задача 4).
// Пропущенные (skip) и «todo» не считаются: выключенный тест — ослабленная защита.
// Подключается в package.json вторым репортёром; сверку с эталоном делает tools/test-count.mjs.
import { basename } from 'node:path';

export default async function* countReporter(source) {
  const files = {};
  for await (const ev of source) {
    if (ev.type !== 'test:pass' && ev.type !== 'test:fail') continue;
    const d = ev.data;
    if (d.nesting !== 0 || d.skip || d.todo || !d.file) continue;
    const f = basename(d.file);
    files[f] = (files[f] || 0) + 1;
  }
  yield JSON.stringify(files, Object.keys(files).sort(), 1) + '\n';
}
