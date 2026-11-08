// Сборка игры в один файл dist/index.html.
// Модули — обычные скрипты с общими глобальными именами, порядок важен.
// Запуск: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Ядро и данные: константы и таблицы баланса.
export const CORE = ['core/constants.js', 'core/util.js'];
export const DATA = ['data/rules.js', 'data/resources.js', 'data/buildings.js', 'data/maps.js', 'data/nations.js', 'data/government.js', 'data/tutorial.js', 'data/texts.js'];
// Симуляция: чистая логика без DOM. Её грузят тесты.
export const SIM = ['sim/world.js', 'sim/nations.js', 'sim/economy.js', 'sim/politics.js', 'sim/tutorial.js'];
// Отрисовка и интерфейс: работают только в браузере.
export const VIEW = ['render/terrain.js', 'render/buildings.js',
  'ui/app.js', 'ui/building-card.js', 'ui/power.js', 'ui/tooltips.js', 'ui/sheets.js', 'ui/map.js', 'ui/tutorial.js', 'ui/boot.js'];

export const read = f => readFileSync(join(ROOT, 'src', f), 'utf8');
export const bundle = files => "'use strict';\n" + files.map(f => `/* ===== ${f} ===== */\n` + read(f)).join('\n');

// Номер версии — из package.json, дата сборки — момент сборки (по Москве).
export function buildInfo(now = new Date()) {
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const date = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).replace(' г.', '');
  return { version, date };
}

export function build() {
  const info = buildInfo();
  const js = `const GAME_VERSION=${JSON.stringify(info.version)},BUILD_DATE=${JSON.stringify(info.date)};\n` + bundle([...CORE, ...DATA, ...SIM, ...VIEW]);
  const html = read('shell.html').replace('/*STYLES*/', read('styles.css')).replace('/*SCRIPTS*/', js);
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  writeFileSync(join(ROOT, 'dist', 'index.html'), html);
  return { bytes: Buffer.byteLength(html), js, info };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { bytes, info } = build();
  console.log(`dist/index.html собран: ${(bytes / 1024).toFixed(0)} КБ, версия ${info.version}, ${info.date}`);
}
