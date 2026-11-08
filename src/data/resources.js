/* Ресурсы и базовые цены, залежи. Баланс меняется здесь. */
const RES={
  food:{n:'Еда',base:5,c:'#d8b85c'},coffee:{n:'Кофе',base:24,c:'#7a4a2c'},cotton:{n:'Хлопок',base:8,c:'#ece6d6'},
  wood:{n:'Древесина',base:6,c:'#a87a4d'},coal:{n:'Уголь',base:7,c:'#3a3634'},iron:{n:'Железо',base:11,c:'#9a4e32'},
  gold:{n:'Золото',base:48,c:'#e2b33c'},goods:{n:'Товары',base:20,c:'#3f7f9a'},cloth:{n:'Ткани',base:17,c:'#b0568f'},
  cans:{n:'Консервы',base:15,c:'#c44f3a'}};
const RK=Object.keys(RES);
const MIN={coal:{n:'Уголь',c:[52,48,46]},iron:{n:'Железо',c:[160,80,50]},gold:{n:'Золото',c:[232,184,58]}};
const LANDB=[SAND,GRASS,FOREST,HILL];
