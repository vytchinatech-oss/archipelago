/* Подсказки: наведение, долгое касание, фокус. */
/* ---------- tooltips: hover on desktop, long-press on touch, focus on keyboard ---------- */
(function(){
  const tip=document.getElementById('tip');let timer=0,hideT=0,cur=null,suppress=false,sx=0,sy=0;
  function show(el){const t=el.getAttribute('data-tip');if(!t)return;cur=el;tip.textContent=t;tip.hidden=false;
    const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,vw=innerWidth,vh=innerHeight;
    let x=Math.max(12,Math.min(vw-w-12,r.left+r.width/2-w/2)),y=r.top-h-8;if(y<8)y=Math.min(vh-h-8,r.bottom+8);
    tip.style.left=x+'px';tip.style.top=y+'px'}
  function hide(){clearTimeout(timer);tip.hidden=true;cur=null}
  const target=e=>e.target.closest&&e.target.closest('[data-tip]');
  document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const el=target(e);if(!el||el===cur)return;clearTimeout(timer);timer=setTimeout(()=>show(el),cur?60:380)});
  document.addEventListener('pointerout',e=>{if(e.pointerType!=='mouse')return;const el=target(e);if(el&&!el.contains(e.relatedTarget))hide()});
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){hide();return}const el=target(e);hide();suppress=false;if(!el)return;sx=e.clientX;sy=e.clientY;
    timer=setTimeout(()=>{show(el);suppress=true;clearTimeout(hideT);hideT=setTimeout(hide,3500)},450)},true);
  document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'&&Math.hypot(e.clientX-sx,e.clientY-sy)>10)clearTimeout(timer)},true);
  document.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')clearTimeout(timer)},true);
  document.addEventListener('click',e=>{if(suppress){suppress=false;e.preventDefault();e.stopPropagation()}},true);
  document.addEventListener('contextmenu',e=>{if(target(e))e.preventDefault()});
  document.addEventListener('focusin',e=>{const el=target(e);if(el&&el.matches(':focus-visible'))show(el)});
  document.addEventListener('focusout',hide);
  document.addEventListener('scroll',hide,true);
  window.showTipHint=()=>{try{if(matchMedia('(hover: none)').matches&&!localStorage.getItem('tiphint')){localStorage.setItem('tiphint','1');setTimeout(()=>toast('Удерживайте палец на кнопке, чтобы увидеть подсказку'),2600)}}catch(e){}};
})();
