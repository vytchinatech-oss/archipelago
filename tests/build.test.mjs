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
  assert.ok(js.startsWith(`const GAME_VERSION=${JSON.stringify(version)},BUILD_DATE=`));
  assert.ok(js.includes("tx('menu.version'"));
});
