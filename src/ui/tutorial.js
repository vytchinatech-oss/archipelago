/* Обучение: карточка шага, подсветка кнопок, проверки по интерфейсу, выбор курса в меню. */
let TUTCUR=null,TUTSEEN=false,TUTCAM=null,tutT=0;
const TUTSHEET={econ:'econ',gov:'gov',gov2:'gov',world:'world',world2:'world'};
// Проверки шагов, которые зависят от интерфейса, а не от города.
const TUTUI={
  cam:()=>TUTCAM&&(Math.hypot(cam.x-TUTCAM.x,cam.y-TUTCAM.y)>80||Math.abs(Z-TUTCAM.z)>.05),
  inspect:()=>TOOL==='inspect'&&SEL>=0&&!!S.bld[SEL]&&!$('#info').hidden,
  layer:()=>{if(!$('#lmenu').hidden)TUTSEEN=true;return TUTSEEN&&$('#lmenu').hidden&&LAYER!==null},
  region:()=>SEL>=0&&!regOf(SEL).own&&!$('#info').hidden,
};
function tutUiOk(id){const m=TUTSHEET[id];if(m){if(sheetMode===m)TUTSEEN=true;return TUTSEEN&&sheetMode!==m}return!!(TUTUI[id]&&TUTUI[id]())}
function tutTargets(st){
  if(st.tool){if(TOOL===st.tool)return[];return[CAT!==st.cat?`[data-c="${st.cat}"]`:`[data-t="${st.tool}"]`]}
  if(TUTSHEET[TUTCUR]&&sheetMode)return['#sh-x'];
  return st.hl||[]}
function tutHighlight(st){const want=new Set();if(st)for(const q of tutTargets(st))document.querySelectorAll(q).forEach(e=>want.add(e));
  document.querySelectorAll('.tut-hl').forEach(e=>{if(!want.has(e))e.classList.remove('tut-hl')});want.forEach(e=>e.classList.add('tut-hl'))}
function tutCard(){const el=$('#tut'),id=tutStep();if(!id){el.hidden=true;return}
  const st=TUT[id],steps=TUT_COURSES[S.tut.c].steps,last=S.tut.k===steps.length-1;
  el.hidden=false;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
  el.innerHTML=`<div class="card-h"><div class="tut-t"><span class="eyebrow">Обучение · ${S.tut.k+1} из ${steps.length}</span><h4>${st.h}</h4></div>${st.next?'':`<button class="tut-skip" type="button" id="tut-s" data-tip="Пропустить этот шаг, если не получается или уже знаете, как это делать.">Пропустить</button>`}<button class="ibtn" type="button" id="tut-x" aria-label="Выйти из обучения" data-tip="Выйти из обучения. Город останется, пройти обучение снова можно из меню.">✕</button></div>
    <div class="tut-bar"><i style="width:${Math.round(S.tut.k/(steps.length-1)*100)}%"></i></div><p>${st.p}</p>
    ${st.next?`<div class="btns"><button class="btn" type="button" id="tut-n" data-tip="${last?'Закончить обучение и играть дальше.':'Перейти к следующему шагу.'}">${last?'Играть':'Дальше'}</button></div>`:''}`;
  $('#tut-x').onclick=()=>{S.tut=null;tutFrame(true);toast('Обучение закрыто. Пройти снова можно из меню')};
  const nx=$('#tut-n')||$('#tut-s');nx.onclick=()=>{tutAdvance();tutFrame(true)}}
// Раз в 200 мс: проверить шаг, перейти дальше, обновить подсветку.
function tutFrame(force){
  const id=tutStep();
  if(id!==TUTCUR||force){if(id!==TUTCUR){TUTSEEN=false;TUTCAM={x:cam.x,y:cam.y,z:Z}}TUTCUR=id;tutCard();if(!id){tutHighlight(null);if(force!==true)toast('Обучение пройдено! Дальше ведут цели вверху');return}}
  if(!id)return;
  if(tutLocksTime()&&SPEED>0)setSpeed(0);
  const st=TUT[id];
  if(!st.next&&(tutStateOk(id)||(st.ui&&tutUiOk(id)))){const nx=tutAdvance();if(nx)toast('Готово! '+TUT[nx].h);tutFrame()}
  else tutHighlight(st)}
function tutTick(dt){if(!S||!S.tut&&!TUTCUR)return;tutT+=dt;if(tutT<200)return;tutT=0;tutFrame()}
// Меню: выбор курса.
function buildTutPick(){const box=$('#tut-pick');box.innerHTML='';
  for(const c of Object.keys(TUT_COURSES)){const C=TUT_COURSES[c],b=document.createElement('button');b.type='button';b.className='tut-opt';
    b.dataset.tip=`Новый город на выбранной карте с обучением: ${C.d}`;b.innerHTML=`<b>${C.n}</b><small>${C.d}</small>`;
    b.onclick=()=>{S=newGame(PICK);govInit(S,PGOV,PDIFF);S.gov0=PGOV;tutStart(S,c);TUTCUR=null;enterGame();setSpeed(0);tutFrame()};box.appendChild(b)}}
