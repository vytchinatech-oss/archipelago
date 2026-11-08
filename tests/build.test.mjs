// Сборка: файл собирается, скрипт компилируется, все модули на месте.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build, CORE, DATA, SIM, VIEW } from '../build.mjs';

test('сборка даёт валидный скрипт и укладывается в лимит артефакта', () => {
  const { bytes, js } = build();
  assert.doesNotThrow(() => new vm.Script(js, { filename: 'bundle.js' }));
  assert.ok(bytes < 16 * 1024 * 1024);
  for (const f of [...CORE, ...DATA, ...SIM, ...VIEW]) assert.ok(js.includes(`===== ${f} =====`), f);
});

test('в игре есть номер версии из package.json и дата сборки', async () => {
  const { readFileSync } = await import('node:fs');
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const { js, info } = build();
  assert.equal(info.version, version);
  assert.match(info.date, /\d{4}$/);
  assert.ok(js.startsWith(`'use strict';\nconst GAME_VERSION=${JSON.stringify(version)},BUILD_DATE=`), 'строгий режим должен остаться первым');
  assert.equal(new vm.Script(js.split('\n').slice(0, 2).join('\n') + '\n(function(){return this===undefined})()').runInNewContext({}), true);
  assert.ok(js.includes("tx('menu.version'"));
});

test('словарь текстов: подстановка, запасной русский, неизвестный ключ', async () => {
  const { load } = await import('./harness.mjs');
  const run = load();
  assert.equal(run("tx('menu.version',{v:'1.2',date:'1 мая'})"), 'Версия 1.2 · сборка 1 мая');
  assert.equal(run("tx('нет.такого')"), 'нет.такого');
  assert.equal(run("LANG='en';const r=tx('menu.version',{v:'1'});LANG='ru';r").startsWith('Версия 1'), true);
  assert.equal(run("tx('menu.version',{v:'1'})").includes('{date}'), true);
});
