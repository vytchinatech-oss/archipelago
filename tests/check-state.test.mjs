// Скрипт сверки состояния (tools/check-state.mjs, задача 1 этапа 0а) читает STATUS.md.
// Если формат строк STATUS.md поменяется, сверка не должна молча ослепнуть.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseStatus, lockFree, latestAudit, branchMentioned, checkLessons, notDoneTasks, falseDone, stageKey } from '../tools/check-state.mjs';

const status = readFileSync(new URL('../docs/STATUS.md', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

test('сверка: STATUS.md читается — версия, тесты, замок, стопы', () => {
  const st = parseStatus(status);
  assert.equal(st.version, pkg, 'строка «Версия» в STATUS.md = package.json');
  assert.ok(Number.isInteger(st.tests) && st.tests > 0, 'строка «Тестов в `main`: N»');
  assert.ok(st.lockCode != null && st.lockDesign != null, 'обе строки замка «Код (этап …)» и «Дизайн (этап …)»');
  assert.ok(st.stops != null, 'строка «**Стопы:** …»');
  assert.match(st.artifact ?? '', /^https:\/\/claude\.ai\/artifact\//, 'ссылка на опубликованную игру');
});

test('сверка: замок и аудит разбираются', () => {
  assert.equal(lockFree('никто.'), true);
  assert.equal(lockFree('чат «кошельки», main, с 15.11 12:00'), false);
  assert.equal(latestAudit(['README.md', '2026-11-11.md', '2026-11-09.md']), '2026-11-11');
  assert.equal(latestAudit(['README.md']), null);
  assert.equal(branchMentioned('ветка `money-merge` не влита', 'money'), false, 'ветка не засчитывается по чужому имени');
  assert.equal(branchMentioned('ветка `money-merge` не влита', 'money-merge'), true);
  const st = parseStatus('Обновлено: 1 мая. Версия 1.2.3.\n- Код (этап 1): чат X, с 1.05\n- Дизайн (этап 2): никто.\n**Стопы:** нет.\nТестов в `main`: 7.\n');
  assert.deepEqual([st.version, st.tests, st.lockCode, lockFree(st.lockDesign)], ['1.2.3', 7, 'чат X, с 1.05', true]);
});

test('сверка: урок «действует» без места в репозитории — находка (У21)', () => {
  const head = '| № | Дата | Что | Повод | Мера | Где | Статус |\n|---|---|---|---|---|---|---|\n';
  const rows = [
    '| У1 | 1.1 | а | промах | тест | `tests/rules.test.mjs` | действует |',
    '| У2 | 1.1 | б | промах | тест | `tests/нет-такого.mjs` | действует |',
    '| У3 | 1.1 | в | промах | навык | навык Архипелага | действует |',
    '| У4 | 1.1 | г | промах | тест | `tests/` (задача) | действует |',
    '| У5 | 1.1 | д | промах | навык | навык Архипелага | ждёт CEO |',
    // исходный промах У21: черновик навыка в репозитории не подтверждает навык в аккаунте
    '| У6 | 15.11 | е | промах | навык | навык Архипелага, шаг «Замок» (предложенная редакция — `docs/skill/archipelago.md`) | действует |',
  ].join('\n');
  const have = new Set(['tests/rules.test.mjs', 'docs/skill/archipelago.md']);
  const bad = checkLessons(head + rows, (f) => have.has(f));
  assert.deepEqual(bad.map((b) => b.id), ['У2', 'У3', 'У4', 'У6']);
  assert.deepEqual(bad[0].missing, ['tests/нет-такого.mjs']);
  // в настоящем журнале нет урока «действует» с пропавшим файлом
  const real = checkLessons(readFileSync(new URL('../docs/LESSONS.md', import.meta.url), 'utf8'),
    (f) => ['', 'docs/', '.claude/agents/'].some((d) => existsSync(new URL('../' + d + f, import.meta.url))));
  assert.deepEqual(real.filter((b) => b.missing.length), [], 'файлы из «Где» у уроков «действует» существуют');
});

test('сверка: STATUS.md не называет сделанной задачу, которая в docs/stages не «сделано» (У22)', () => {
  const stage = '| № | Задача | Источник | Статус |\n|---|---|---|---|\n| 1 | скрипт | CEO | сделано 15.11 |\n| 2 | навык | CEO | предложено 15.11 |\n| 4 | защиты | CEO | ожидает |\n';
  const nd = notDoneTasks(stage);
  assert.deepEqual([...nd].sort((a, b) => a - b), [2, 4]);
  // номера задач свои у каждого этапа: в этапе 1 задача 2 сделана
  const stages = new Map([[stageKey('0a'), nd], [stageKey('1'), notDoneTasks('| 2 | x | y | сделано |\n| 4 | x | y | ожидает |')]]);
  const tasks = (txt) => falseDone(txt, stages, '0а').map((b) => b.task);
  // исходный промах: «задачи 1–2 сделаны» при задаче 2 «предложено»
  assert.deepEqual(tasks('после задачи 4 (задачи 1–2 сделаны 15.11)'), [2]);
  assert.deepEqual(tasks('задача 1 сделана 15.11, задача 2 предложена и ждёт CEO'), []);
  assert.deepEqual(tasks('задача 2 этапа 1 сделана'), []);
  assert.deepEqual(tasks('задача 2 этапа 0а сделана'), [2]);
  assert.deepEqual(tasks('задача 2 — сделана; задачи 1, 4 уже сделаны; задача 2: «сделано»'), [2, 4, 2]);
  // настоящие файлы сходятся
  const real = new Map([[stageKey('0a'), notDoneTasks(readFileSync(new URL('../docs/stages/0a.md', import.meta.url), 'utf8'))]]);
  assert.deepEqual(falseDone(status, real, '0а'), [], 'STATUS.md не опережает docs/stages/0a.md');
});
