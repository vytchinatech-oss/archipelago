/* Действия на карте, отрисовка кадра, эффекты, игровой цикл, управление. */
/* ---------- actions ---------- */
function tap(sx,sy){
  const i=pick(sx,sy);if(i<0){info(-1);return}
  if(!regOf(i).own){info(i);return}
  if(TOOL==='inspect'){info(i);return}
  if(TOOL==='road'){
    if(ROADA<0){ROADA=i;toast('Теперь коснитесь конца дороги');return}
    const path=roadPath(ROADA,i);ROADA=-1;let n=0,cost=0,skip=0;
    for(const j of path){if(S.road[j])continue;const q=place('road',j);if(q.ok){n++;cost+=q.cost}else skip++}
    toast(n?`Проложено ${n} ${plural(n,'клетка','клетки','клеток')} · −${fmt(cost)} кр`+(skip?`, пропущено ${skip}`:''):'Здесь дорогу не проложить');
    dirty=true;refresh();return}
  const wasForest=S.type[i]===FOREST,hadRoad=S.road[i];
  const q=place(TOOL,i);if(!q.ok){toast(q.why);return}
  if(wasForest||hadRoad||TOOL==='bull')dirty=true;
  if(TOOL!=='bull'){const d=B[TOOL];
    if(!CONN[i])toast(`${d.n} построен, но не связан дорогой с ратушей`);
    else if(d.pow<0&&!PW[i])toast(`${d.n} вне зоны электричества`);
    else if(d.out&&wdist(i)>6)toast(`${d.n}: до жилья ${wdist(i)} кл., выработка ${Math.round(dfac(wdist(i))*100)}%`)}
  refresh();
}
function pick(sx,sy){
  const wx=cam.x+(sx-VW/2)/Z,wy=cam.y+(sy-VH/2)/Z,px=wx-OX,py0=wy-OY;
  const gx=Math.floor((px/(TW/2)+py0/(TH/2))/2),gy=Math.floor((py0/(TH/2)-px/(TW/2))/2);let best=-1,bs=-1;
  for(let dy=-1;dy<=5;dy++)for(let dx=-1;dx<=5;dx++){const x=gx+dx,y=gy+dy;if(x<0||y<0||x>=N||y>=N)continue;const i=y*N+x,py=py0+eAt(i)*EH;
    if(Math.floor((px/(TW/2)+py/(TH/2))/2)===x&&Math.floor((py/(TH/2)-px/(TW/2))/2)===y&&x+y>bs){bs=x+y;best=i}}
  return best;
}
function spawnBoat(i,out){
  const w=nb4(i).find(j=>S.type[j]<=SHAL);if(w===undefined)return;
  const x=w%N,y=w/N|0,ds=[[x,-1,0],[N-1-x,1,0],[y,0,-1],[N-1-y,0,1]].sort((a,b)=>a[0]-b[0])[0];
  const ex=Math.max(0,Math.min(N-1,x+ds[1]*N)),ey=Math.max(0,Math.min(N-1,y+ds[2]*N));
  const a=base(w),b=base(ey*N+ex),A=[a[0],a[1]+TH/2],Bp=[b[0],b[1]+TH/2];
  if(BOATS.length<12)BOATS.push({a:out?A:Bp,b:out?Bp:A,t:0,d:5200,out});
}

/* ---------- render ---------- */
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=cv.clientWidth;VH=cv.clientHeight;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR)}
function clampCam(){cam.x=Math.max(0,Math.min(CW,cam.x));cam.y=Math.max(0,Math.min(CH,cam.y))}
function drawLayer(g,V){
  const arr=LAYER==='power'?PW:COV[LAYER],col=LCOL[LAYER];
  for(let i=0;i<N*N;i++){const[cx,by]=base(i);if(cx<V.x0-TW||cx>V.x1+TW||by<V.y0-TH||by>V.y1+TH)continue;
    if(LAYER==='work'){const b=S.bld[i];if(!b||!B[b.t].out)continue;const f=dfac(wdist(i));outline(g,i,f>=.95?'rgba(121,214,154,.95)':f>=.6?'rgba(244,182,63,.95)':'rgba(255,125,104,.95)',f>=.95?'rgba(121,214,154,.35)':f>=.6?'rgba(244,182,63,.35)':'rgba(255,125,104,.35)');continue}
    if(arr&&arr[i]&&S.type[i]>=SAND){const cy=by-eAt(i)*EH;poly(g,dia(cx,cy,.94),`rgba(${col},.30)`)}
    else if(arr&&!arr[i]&&S.bld[i]&&(LAYER==='power'?B[S.bld[i].t].pow<0:B[S.bld[i].t].home))outline(g,i,'rgba(255,125,104,.95)','rgba(255,125,104,.25)')}
}
function haloPreview(g,i,R,col){const x=i%N,y=i/N|0;g.lineWidth=1;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R+R)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;const j=Y*N+X;if(S.type[j]<SAND)continue;
    const[cx,by]=base(j);poly(g,dia(cx,by-eAt(j)*EH,.94),`rgba(${col},.22)`)}}
function render(ts){
  if(!S||$('#game').hidden)return;if(dirty)renderCache();
  const g=ctx;g.setTransform(1,0,0,1,0,0);g.fillStyle='#1b5571';g.fillRect(0,0,cv.width,cv.height);
  g.setTransform(DPR*Z,0,0,DPR*Z,DPR*(VW/2-cam.x*Z),DPR*(VH/2-cam.y*Z));
  g.drawImage(cache,0,0,CW,CH);
  const V={x0:cam.x-VW/2/Z,x1:cam.x+VW/2/Z,y0:cam.y-VH/2/Z,y1:cam.y+VH/2/Z},tt=ts/1000;
  g.lineWidth=1.3;for(const w of WAVES){const[cx,by]=base(w.i);if(cx<V.x0||cx>V.x1||by<V.y0||by>V.y1)continue;const a=.18+.16*Math.sin(tt*1.3+w.ph),y=by+TH/2,x=cx+w.dx+Math.sin(tt*.6+w.ph)*4;
    g.strokeStyle=`rgba(225,242,246,${a.toFixed(3)})`;g.beginPath();g.moveTo(x-9,y);g.quadraticCurveTo(x-4,y-2.5,x,y);g.quadraticCurveTo(x+4,y+2.5,x+9,y);g.stroke()}
  if(LAYER)drawLayer(g,V);
  const pr=S.rep?S.rep.cen.pr:1;
  if(TOOL==='road'&&ROADA>=0){const end=HOV>=0?HOV:ROADA;for(const j of roadPath(ROADA,end)){const q=canBuild('road',j);outline(g,j,q.ok||S.road[j]?'rgba(244,182,63,.95)':'rgba(255,125,104,.95)','rgba(244,182,63,.18)')}}
  else if(HOV>=0&&TOOL!=='inspect'){const q=canBuild(TOOL,HOV);if(q.ok&&RAD[TOOL])haloPreview(g,HOV,RAD[TOOL],LCOL[layerOf(TOOL)]||'244,182,63');outline(g,HOV,q.ok?'rgba(121,214,154,.95)':'rgba(255,125,104,.95)',q.ok?'rgba(121,214,154,.18)':'rgba(255,125,104,.12)')}
  if(SEL>=0&&!$('#info').hidden&&TOOL==='inspect'){const b=S.bld[SEL];if(b&&RAD[b.t])haloPreview(g,SEL,RAD[b.t],LCOL[layerOf(b.t)]||'244,182,63');outline(g,SEL,'rgba(244,182,63,1)')}
  drawObjects(g,V,pr);
  for(const p of SMOKE){const k=p.l/p.m;g.fillStyle=`rgba(226,230,226,${(.42*(1-k)).toFixed(3)})`;g.beginPath();g.arc(p.x,p.y,p.r*(1+k*1.8),0,6.3);g.fill()}
  for(const b of BOATS){const k=b.t/b.d,x=b.a[0]+(b.b[0]-b.a[0])*k,y=b.a[1]+(b.b[1]-b.a[1])*k+Math.sin(tt*3+b.d)*1.2,al=Math.min(1,k*6,(1-k)*6);g.globalAlpha=al;
    g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(x,y+3,13,3,0,0,6.3);g.fill();
    poly(g,[x-10,y-1,x+10,y-1,x+7,y+4,x-7,y+4],'#6e4429');poly(g,[x-1,y-17,x-1,y-2,x+9,y-4],b.out?'#f7f2e6':'#f4b63f');poly(g,[x-2,y-14,x-2,y-2,x-9,y-4],b.out?'#e2dccd':'#d99a2b');g.globalAlpha=1}
}
function updateFx(dt){
  for(const b of BOATS)b.t+=dt*(SPEED?Math.max(1,SPEED*.7):0);BOATS=BOATS.filter(b=>b.t<b.d);
  for(const p of SMOKE){p.l+=dt;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000}SMOKE=SMOKE.filter(p=>p.l<p.m);
  smokeT+=dt;if(smokeT>320&&SPEED>0&&S.rep){smokeT=0;
    for(const i of S.rep.cen.list){const bb=S.bld[i];if(!bb)continue;const t=bb.t,ind=t==='factory'||t==='textile'||t==='cannery';
      if((ind&&(S.rep.run[t]||0)>0)||(t==='power'&&S.rep.fuel>0)){if(SMOKE.length>180)break;const[cx,by]=base(i),my=by-S.elev[i]*EH+TH/2;
      const pts=ind?[[cx+(.18+.4)*TW/2,my+(.18-.4)*TH/2-46]]:[[cx+(-.18+.24)*TW/2,my+(-.42)*TH/2-29],[cx+(.22+.14)*TW/2,my+(.08)*TH/2-32]];
      for(const[x,y]of pts)SMOKE.push({x,y,vx:6+Math.random()*6,vy:-14-Math.random()*6,r:3+Math.random()*1.5,l:0,m:2600})}}}
}
const KEYS=new Set();
let errShown=false;
function guard(fn){try{fn()}catch(err){console.error(err);if(!errShown){errShown=true;toast('Сбой в игре, но она продолжает работать. Напишите, что вы делали.')}}}
function loop(ts){
  requestAnimationFrame(loop);
  const dt=Math.min(100,ts-(lastTs||ts));lastTs=ts;
  if(!S||$('#game').hidden)return;
  if(SPEED>0&&!S.over){acc+=dt*SPEED;let n=0;while(acc>=MONTH_MS&&n<3){acc-=MONTH_MS;n++;guard(doTick)}if(acc>=MONTH_MS)acc=0}
  if(KEYS.size){let mx=0,my=0;for(const k of KEYS){const v={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[k];if(v){mx+=v[0];my+=v[1]}}
    const l=Math.hypot(mx,my)||1,sp=700*dt/1000/Z;cam.x+=mx/l*sp;cam.y+=my/l*sp;clampCam()}
  guard(()=>updateFx(dt));guard(()=>render(ts));
}

/* ---------- input ---------- */
function setupInput(){
  const P=new Map();let pan=null,pinch=null;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(P.size===1)pan={x:e.offsetX,y:e.offsetY,cx:cam.x,cy:cam.y,moved:false};
    else if(P.size===2){const[a,b]=[...P.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:Z,wx:cam.x+((a.x+b.x)/2-VW/2)/Z,wy:cam.y+((a.y+b.y)/2-VH/2)/Z};if(pan)pan.moved=true}});
  cv.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse'&&!P.size){HOV=pick(e.offsetX,e.offsetY);return}
    if(!P.has(e.pointerId))return;P.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(pinch&&P.size>=2){const[a,b]=[...P.values()];Z=Math.max(.4,Math.min(2.6,pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;cam.x=pinch.wx-(mx-VW/2)/Z;cam.y=pinch.wy-(my-VH/2)/Z;clampCam();return}
    if(pan){const dx=e.offsetX-pan.x,dy=e.offsetY-pan.y;if(!pan.moved&&Math.hypot(dx,dy)>7)pan.moved=true;if(pan.moved){cam.x=pan.cx-dx/Z;cam.y=pan.cy-dy/Z;clampCam()}}
    if(e.pointerType==='mouse')HOV=pick(e.offsetX,e.offsetY)});
  const up=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);
    if(P.size===0){if(pan&&!pan.moved&&e.type==='pointerup'){if(e.pointerType!=='mouse')HOV=-1;guard(()=>tap(e.offsetX,e.offsetY))}pan=null;pinch=null}
    else if(P.size===1){pinch=null;const[a]=[...P.values()];pan={x:a.x,y:a.y,cx:cam.x,cy:cam.y,moved:true}}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')HOV=-1});
  cv.addEventListener('wheel',e=>{e.preventDefault();const wx=cam.x+(e.offsetX-VW/2)/Z,wy=cam.y+(e.offsetY-VH/2)/Z;Z=Math.max(.4,Math.min(2.6,Z*Math.exp(-e.deltaY*.0015)));cam.x=wx-(e.offsetX-VW/2)/Z;cam.y=wy-(e.offsetY-VH/2)/Z;clampCam()},{passive:false});
  window.addEventListener('resize',()=>{if(S)resize()});
  const MK={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
  const typing=e=>e.target.closest&&e.target.closest('input,textarea,select');
  window.addEventListener('keydown',e=>{if(!S||$('#game').hidden||typing(e))return;
    if(MK[e.code]){e.preventDefault();KEYS.add(e.code)}
    else if(e.code==='Equal'||e.code==='NumpadAdd'){Z=Math.min(2.6,Z*1.15)}else if(e.code==='Minus'||e.code==='NumpadSubtract'){Z=Math.max(.4,Z/1.15)}});
  window.addEventListener('keyup',e=>KEYS.delete(e.code));
  window.addEventListener('blur',()=>KEYS.clear());
  window.addEventListener('keydown',e=>{if(!S||$('#game').hidden||e.target.tagName==='INPUT')return;if(e.key==='Escape'){if(!$('#lmenu').hidden)toggleLayerMenu(false);else if(sheetMode)sheet(null);else{setTool('inspect');info(-1)}}if(e.key===' '){e.preventDefault();setSpeed(SPEED?0:1)}});
}
function setSpeed(s){SPEED=s;document.querySelectorAll('[data-spd]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.spd===s))}
