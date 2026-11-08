/* Словарь текстов для игрока. С этапа 0а все новые тексты — здесь, не строкой в коде.
   Ключ → строка; {имя} подставляется из vars. Другие языки — отдельные таблицы с теми же ключами. */
const TEXTS={
  ru:{
    'menu.version':'Версия {v} · сборка {date}',
    'menu.versionTip':'Номер версии и дата сборки. Назовите их, когда сообщаете об ошибке.',
  },
};
let LANG='ru';
function tx(key,vars){const s=(TEXTS[LANG]&&TEXTS[LANG][key])??TEXTS.ru[key]??key;return vars?s.replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m):s}
