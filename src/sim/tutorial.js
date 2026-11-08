/* Обучение: состояние S.tut и проверки шагов по состоянию города. Без DOM. */
// Сколько зданий данных типов связано дорогой с ратушей.
function tutCount(types){let n=0;for(let i=0;i<N*N;i++){const b=S.bld[i];if(b&&types.includes(b.t)&&CONN[i])n++}return n}
function tutRoads(){let n=0;for(let i=0;i<N*N;i++)if(S.road[i]&&NET[i])n++;return n}
// Шаги, которые проверяются по городу. Остальные — интерфейсом или кнопкой «Дальше».
const TUTOK={
  road:()=>tutRoads()>=S.tut.b.road+3,
  house:()=>tutCount(['house','hut','villa','tower'])>=S.tut.b.home+1,
  food:()=>tutCount(['farm','veg','ranch','fish'])>=1,
  power:()=>tutCount(['wind','power'])>=1,
  shop:()=>tutCount(['shop'])>=1,
  time:()=>S.month>=S.tut.at+1,
  saw:()=>tutCount(['saw','coalmine','ironmine','goldmine'])>=1,
  port:()=>tutCount(['port'])>=1,
  tax:()=>Object.keys(S.tax).some(k=>Math.abs(S.tax[k]-S.tut.tax0[k])>.005),
};
function tutStart(s,course){computeConn();
  s.tut={c:course,k:0,at:s.month,tax0:Object.assign({},s.tax),b:{road:tutRoads(),home:tutCount(['house','hut','villa','tower'])}}}
const tutStep=()=>S&&S.tut?TUT_COURSES[S.tut.c].steps[S.tut.k]:null;
// Переход к следующему шагу; в конце курса обучение выключается.
function tutAdvance(){if(!S.tut)return null;S.tut.k++;S.tut.at=S.month;S.tut.tax0=Object.assign({},S.tax);
  if(S.tut.k>=TUT_COURSES[S.tut.c].steps.length){S.tut=null;return null}return tutStep()}
const tutStateOk=id=>!!(TUTOK[id]&&TUTOK[id]());
// Время стоит, пока не дошли до шага «время».
function tutLocksTime(){if(!S||!S.tut)return false;const st=TUT_COURSES[S.tut.c].steps,t=st.indexOf('time');return t>S.tut.k}
