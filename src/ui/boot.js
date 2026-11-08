/* Запуск приложения. Подключается последним. */
/* ---------- boot ---------- */
function start(data){
  cv=$('#view');ctx=cv.getContext('2d');setupInput();
  $('#b-start').onclick=()=>{S=newGame(PICK);govInit(S,PGOV,PDIFF);S.gov0=PGOV;enterGame();toast('Город основан. Ведите дороги от ратуши');showTipHint()};
  $('#b-cont').onclick=()=>{try{S=loadStr(store(SAVE_KEY));enterGame()}catch(e){toast('Сохранение повреждено, начните заново')}};
  $('#b-menu').onclick=showMenu;$('#b-econ').onclick=()=>sheet(sheetMode==='econ'?null:'econ');$('#b-gov').onclick=()=>sheet(sheetMode==='gov'?null:'gov');$('#b-world').onclick=()=>sheet(sheetMode==='world'?null:'world');
  $('#b-layer').onclick=()=>toggleLayerMenu($('#lmenu').hidden);
  cv.addEventListener('pointerdown',()=>{if(!$('#lmenu').hidden)toggleLayerMenu(false)});
  document.querySelectorAll('[data-spd]').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.spd));
  buildOpts();buildMenu();buildTutPick();
  $('#b-tut').onclick=()=>{const p=$('#tut-pick'),on=p.hidden;p.hidden=!on;$('#b-tut').setAttribute('aria-expanded',on)};
  if(data&&data.s){try{S=loadStr(data.s);if(S.v===4)enterGame();else S=null}catch(e){S=null}}
  requestAnimationFrame(loop);
}
window.claude?.hot?.snapshot?.(()=>S?{s:saveStr()}:{});
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
