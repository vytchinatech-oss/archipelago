/* Меню, панель строительства, карточки клеток и областей, события, верхняя панель. */
const $=s=>document.querySelector(s);
const SAVE_KEY='archipelago-v3',MONTH_MS=40000;
let TOOL='inspect',CAT='base',ROADA=-1,SEL=-1,HOV=-1,SPEED=1,PICK=0,cv,ctx,DPR=1,VW=0,VH=0,Z=1,cam={x:0,y:0},acc=0,lastTs=0,sheetMode=null,LAYER=null;
let BOATS=[],SMOKE=[],smokeT=0;
const TNAME={inspect:'Осмотр',road:'Дорога',bull:'Снос'};
const LAYERS=[null,'power','work','shop','park','school','clinic','police','store'];
const LNAME={power:'энергия',work:'путь до работы',shop:'рынки',park:'парки',school:'школы',clinic:'больницы',police:'полиция',store:'склады'};
const LCOL={power:'244,182,63',shop:'224,90,71',park:'121,214,154',school:'106,168,255',clinic:'255,143,163',police:'143,179,255',store:'201,162,39'};
const layerOf=t=>t==='power'||t==='wind'||t==='sub'||t==='hall'?'power':RADN[t]?t:B[t]&&B[t].jobs&&t!=='hall'?'work':null;
const PREV=MAPS.map((m,k)=>genWorld(k));
const rd=k=>`<span class="res-dot" style="background:${RES[k].c}"></span>`;
const nm=id=>ND(natById(id)).n;

function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2400)}

/* ---------- menu ---------- */
function drawPreview(c,W){const g=c.getContext('2d'),s=c.width/N;
  for(let i=0;i<N*N;i++){const x=i%N,y=i/N|0,t=W.type[i];let f=1;
    if(t>=SAND&&!W.regions[W.reg[i]].own)f=.72;g.fillStyle=rgb(TERR[t].c,f);g.fillRect(x*s,y*s,s,s);
    if(t===HILL||t===MOUNT){g.fillStyle=rgb(MIN[W.regions[W.reg[i]].min].c,f);g.fillRect(x*s+1,y*s+1,s-2,s-2)}
    if(t>=SAND){g.fillStyle='rgba(255,236,190,.75)';if(x<N-1&&W.type[i+1]>=SAND&&W.reg[i+1]!==W.reg[i])g.fillRect((x+1)*s-.5,y*s,1,s);if(y<N-1&&W.type[i+N]>=SAND&&W.reg[i+N]!==W.reg[i])g.fillRect(x*s,(y+1)*s-.5,s,1)}}
  const hx=W.hall%N,hy=W.hall/N|0;g.fillStyle='#f4b63f';g.fillRect(hx*s-s*.5,hy*s-s*.5,s*2,s*2);g.strokeStyle='#2b1c02';g.strokeRect(hx*s-s*.5,hy*s-s*.5,s*2,s*2)}
function buildMenu(){
  const ver=$('#ver');if(ver&&typeof GAME_VERSION!=='undefined'){ver.textContent=tx('menu.version',{v:GAME_VERSION,date:BUILD_DATE});ver.dataset.tip=tx('menu.versionTip')}
  const box=$('#maps');box.innerHTML='';
  MAPS.forEach((m,k)=>{const b=document.createElement('button');b.type='button';b.className='map';b.setAttribute('aria-pressed',k===PICK);
    const W=PREV[k],cnt={coal:0,iron:0,gold:0};W.regions.forEach(g=>cnt[g.min]++);
    b.innerHTML=`<canvas width="176" height="176"></canvas><h3>${m.n}</h3><p>${m.d}</p><div class="tags">${m.tags.map(t=>`<span class="tag">${t}</span>`).join('')}<span class="tag">Тёплых областей: ${W.regions.filter(g=>g.warm).length}</span><span class="tag">Золото: ${cnt.gold}</span></div>`;
    drawPreview(b.querySelector('canvas'),W);b.onclick=()=>{PICK=k;box.querySelectorAll('.map').forEach((el,j)=>el.setAttribute('aria-pressed',j===k))};box.appendChild(b)});
  const sv=store(SAVE_KEY),bc=$('#b-cont');bc.hidden=true;
  if(sv){try{const o=JSON.parse(sv);if(o.v>=3&&!o.over){bc.hidden=false;bc.textContent=`Продолжить: ${MAPS[o.mi].n}, ${GOVS[o.gov].n.toLowerCase()}, ${MONTHS[o.month%12].toLowerCase()} года ${1+(o.month/12|0)}`}}catch(e){}}
}
function showMenu(){if(S)store(SAVE_KEY,saveStr());$('#game').hidden=true;$('#menu').hidden=false;sheet(null);buildMenu()}
function enterGame(){
  $('#menu').hidden=true;$('#game').hidden=false;computeConn();computeCov();initStatic();BOATS=[];SMOKE=[];ROADA=-1;SEL=-1;
  resize();const[hx,hy]=base(S.hall);cam.x=hx;cam.y=hy-S.elev[S.hall]*EH;Z=Math.max(.6,Math.min(1.25,VW/760));
  CAT='base';buildStats();$('#over').hidden=true;buildCats();setTool('inspect');info(-1);setLayer(null);refresh();
}

/* ---------- tools ---------- */
const CTIP={base:'Осмотр клеток, дороги, мосты и снос.',home:'Жильё разного класса: от дешёвых бараков до особняков богачей.',farm:'Еда и сельхозсырьё. Урожай зависит от плодородия и климата области.',
  mine:'Лес и полезные ископаемые. Шахты ставятся только на свои залежи в холмах.',ind:'Переработка сырья в дорогие товары для жителей и экспорта.',pow:'Электричество для зданий в ореоле.',
  svc:'Городские службы с ореолами: рынки, парки, школы, больницы, полиция.',com:'Склады и порт: хранение, логистика и внешняя торговля.',mil:'Казармы: солдаты, фракция военных и опора трона.'};
function toolTip(t){if(t==='inspect')return'Коснитесь клетки или здания: покажет, что там, как работает и что мешает.';
  if(t==='road')return`Дорога ${ROADK.land} кр, в лесу ${ROADK.forest}, мост по мелководью ${ROADK.shal}, по глубине ${ROADK.deep}. Два касания: начало и конец. Здания работают, только если дорога ведёт к ратуше.`;
  if(t==='bull')return`Снести здание или дорогу за ${ROADK.demolish} кр. Деньги за постройку не возвращаются.`;
  const d=B[t],p=[d.d,`Стоит ${fmt(d.cost)} кр, содержание ${d.up} кр/мес.`];
  if(d.jobs)p.push(`Рабочих мест: ${d.jobs}.`);if(d.pow<0)p.push(`Потребляет ${-d.pow} энергии.`);if(RAD[t])p.push(`Ореол ${RAD[t]} клеток.`);if(d.need)p.push(`Открывается при населении ${d.need}.`);
  return p.join(' ')}
const catTools=c=>c==='base'?['inspect','road','bull']:Object.keys(B).filter(k=>B[k].cat===c);
function buildCats(){const el=$('#cats');el.innerHTML='';
  for(const[c,n]of CATS){const b=document.createElement('button');b.type='button';b.className='cat';b.setAttribute('role','tab');b.setAttribute('aria-selected',c===CAT);b.textContent=n;b.dataset.c=c;b.dataset.tip=CTIP[c];
    b.onclick=()=>{CAT=c;el.querySelectorAll('.cat').forEach(x=>x.setAttribute('aria-selected',x===b));buildTools()};el.appendChild(b)}
  buildTools()}
function buildTools(){const nav=$('#tools');nav.innerHTML='';
  for(const t of catTools(CAT)){const b=document.createElement('button');b.type='button';b.className='tool';b.dataset.t=t;
    const cost=t==='road'?'5+':t==='bull'?'5':t==='inspect'?'':fmt(B[t].cost);
    b.innerHTML=`<canvas width="96" height="80"></canvas><span class="n">${TNAME[t]||B[t].n}</span><span class="c">${cost?cost+' кр':'&nbsp;'}</span>`;
    b.setAttribute('aria-pressed',t===TOOL);if(B[t]&&B[t].need&&S.pop<B[t].need)b.dataset.locked='';b.dataset.tip=toolTip(t);
    drawIcon(b.querySelector('canvas'),t);b.onclick=()=>setTool(t);nav.appendChild(b)}nav.scrollLeft=0}
function setTool(t){
  if(B[t]&&B[t].need&&S.pop<B[t].need){toast(`${B[t].n} откроется при населении ${B[t].need}`);return}
  TOOL=t;ROADA=-1;document.querySelectorAll('.tool').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===t));
  if(t==='inspect'||t==='bull'){if(t==='bull')infoText('Снос','Коснитесь здания или дороги, чтобы снести.');return}
  if(t==='road'){infoText('Дорога',`Коснитесь начала и конца дороги. Мост по мелководью ${ROADK.shal} кр. По дорогам рабочие едут к предприятиям: чем дальше, тем ниже выработка.`);return}
  const d=B[t],ly=layerOf(t);if(ly)setLayer(ly);
  infoText(d.n,d.d+(RAD[t]?` Ореол: ${RAD[t]} клеток.`:'')+(d.jobs&&!RAD[t]?' Рабочие приезжают по дорогам: до 6 клеток от жилья без потерь.':''));
}
const LDESC={null:'Обычная карта',power:'Где есть электричество',work:'Путь рабочих от жилья до предприятий',shop:'Снабжение домов товарами',park:'Пешая доступность парков',school:'Образование, выше налоги',clinic:'Здоровье жителей',police:'Защита от преступности',store:'Склады ускоряют предприятия'};
function setLayer(l){LAYER=l;$('#b-layer').textContent='Слой: '+(l?LNAME[l]:'нет')+' ▾';$('#b-layer').setAttribute('aria-pressed',!!l);if(!$('#lmenu').hidden)buildLayerMenu()}
function buildLayerMenu(){const el=$('#lmenu');el.innerHTML='';
  for(const l of LAYERS){const b=document.createElement('button');b.type='button';b.className='lopt';b.setAttribute('role','option');b.setAttribute('aria-selected',l===LAYER);
    const col=l==='work'?'linear-gradient(90deg,#79d69a,#f4b63f,#ff7d68)':l?`rgb(${LCOL[l]})`:'transparent';
    b.innerHTML=`<i style="background:${col};${l?'':'box-shadow:inset 0 0 0 1.5px var(--muted)'}"></i><b>${l?LNAME[l][0].toUpperCase()+LNAME[l].slice(1):'Без слоя'}</b><small>${LDESC[l]}</small>`;
    b.onclick=()=>{setLayer(l);toggleLayerMenu(false)};el.appendChild(b)}}
function toggleLayerMenu(on){const el=$('#lmenu');el.hidden=!on;$('#b-layer').setAttribute('aria-expanded',on);if(on)buildLayerMenu()}

/* ---------- info card ---------- */
function infoText(h,p,extra=''){const el=$('#info'),sc=el.scrollTop;el.hidden=false;el.innerHTML=`<div class="card-h"><h4>${h}</h4><button class="ibtn" type="button" id="i-x" aria-label="Закрыть">✕</button></div><p>${p}</p>${extra}`;
  el.scrollTop=sc;$('#i-x').onclick=()=>{el.hidden=true;SEL=-1}}
const kv=rows=>`<div class="kv">${rows.map(r=>`<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div>`;
const pill=(t,c='')=>`<span class="pill ${c}">${t}</span>`;
function regTraits(g){return`<div class="traits">${pill(g.warm?'Тёплый климат':'Умеренный климат',g.warm?'mid':'')}${pill('Залежи: '+MIN[g.min].n.toLowerCase(),g.min==='gold'?'mid':'')}${pill('Плодородие '+Math.round(g.fert*100)+'%',g.fert<.9?'bad':'')}</div>`}
function info(i){
  const el=$('#info');SEL=i;if(i<0){el.hidden=true;return}
  const t=S.type[i],rg=regOf(i),b=S.bld[i],c=census();
  if(!rg.own){infoText(`Область «${rg.n}»`,`Суша: ${rg.land} клеток. ${rg.warm?'Тут растут кофе и хлопок.':'Кофе здесь не растёт.'} В холмах и горах: ${MIN[rg.min].n.toLowerCase()}.`,
    regTraits(rg)+kv([['Цена',fmt(rg.price)+' кр'],['В казне',fmt(S.money)+' кр']])+`<button class="btn" type="button" id="i-buy" data-tip="Область станет вашей навсегда: в ней можно строить. Залежи, климат и плодородие указаны выше." ${S.money<rg.price?'disabled':''}>Купить за ${fmt(rg.price)} кр</button>`);
    $('#i-buy').onclick=()=>{if(buyRegion(S.reg[i])){dirty=true;toast(`Область «${rg.n}» ваша`);info(-1);refresh()}else toast('Не хватает денег')};return}
  if(b){bInfo(i,b,c);return}
  const allow=Object.keys(B).filter(k=>k!=='hall'&&B[k].on.includes(t)&&(!B[k].dep||B[k].dep===depAt(i))&&(!B[k].warm||rg.warm)).map(k=>B[k].n.toLowerCase());
  const road=S.road[i]?(S.road[i]===2?'Мост. ':'Дорога. ')+(NET[i]?'Связана с ратушей.':'Не связана с ратушей.'):'';
  const halos=Object.keys(COV).filter(k=>COV[k][i]).map(k=>RADN[k]);if(PW[i])halos.unshift('энергия');
  const rows=[['Область',rg.n],['Климат',rg.warm?'тёплый':'умеренный']];
  if(t>=SAND&&t<=HILL)rows.push(['Плодородие',Math.round(fert(i)*100)+'%']);if(depAt(i))rows.push(['Залежи',MIN[depAt(i)].n]);rows.push(['Ореолы',halos.join(', ')||'нет']);
  infoText(road?(S.road[i]===2?'Мост':'Дорога'):TERR[t].n,road||(allow.length?'Можно строить: '+allow.join(', ')+'.':t<=SHAL?'Здесь можно проложить мост.':'Здесь ничего не построить.'),kv(rows));
}

/* ---------- events ---------- */
function evTip(e,y){const t=e.t,X=EVN[t],R=v=>`Отношения ${v>0?'+':'−'}${Math.abs(v)}.`;
  if(X){const rel=R(X.rel[y?0:1]),no=X.rel[1]?rel:'Ничего не изменится.';if(!y)return t==='mediate'?'Никто не обидится всерьёз. '+rel:'Всё останется как есть. '+no;
    return({order:`Получите ${fmt(e.amt*e.price)} кр, партия уйдёт со склада. `,bargain:`Заплатите ${fmt(e.amt*e.price)} кр, партия придёт на склад. `,relief:`${e.amt} ед. уйдут со склада. `,summit:`Расход ${fmt(X.cost)} кр. `,dumping:`Расход ${fmt(e.cost)} кр. `,envoy:`Расход ${fmt(X.cost)} кр. `,border:`Довольство военных −${X.mil}. `,debt:`Вернут на ${fmt(e.amt)} кр меньше. `,mediate:`Отношения со второй страной ${X.other}. `})[t]+rel}
  if(t==='loan')return y?`Отдадите ${fmt(e.amt)} кр, вернут ${fmt(e.amt*(1+e.rate))} кр за ${DIPA.lendMonths} месяцев. Отношения +${DIPA.lendRel}.`:`Деньги останутся у вас. Отношения −${-EVX.loan.no}.`;
  if(t==='deal')return y?`Пошлины между вами обнуляются, их товары дешевле на ${PCT(1-NATK.sellDeal)}%, отношения +${DIPA.dealRel} сразу и растут каждый месяц.`:'Ничего не изменится, предложение может повториться.';
  if(t==='tariff')return y?`Ваша импортная пошлина станет ${PCT(EVX.tariff.to)}%: меньше доход казны, зато мир и отношения +${EVX.tariff.yes}.`:`Год их пошлина на ваши товары будет ${PCT(EVX.tariff.hike)}%, отношения −${-EVX.tariff.no}.`;
  return y?`Население +${e.amt}, отношения +${EVX.ref.yes}. Беженцам нужно жильё, иначе они начнут уезжать.`:`Отношения −${-EVX.ref.no}.`}
function showEvent(){const el=$('#event');if(!S.ev){el.hidden=true;return}
  const[h,p,y,n]=evText(S.ev),d=ND(natById(S.ev.nid));
  el.hidden=false;el.innerHTML=`<div class="card-h"><span class="flag" style="background:${d.col}"></span><h4>${h}</h4></div><p>${p} Срок ответа: ${MONTHS[S.ev.exp%12].toLowerCase()}.</p><div class="btns"><button class="btn" type="button" id="ev-y" data-tip="${evTip(S.ev,1)}">${y}</button><button class="btn ghost" type="button" id="ev-n" data-tip="${evTip(S.ev,0)}">${n}</button></div>`;
  $('#ev-y').onclick=()=>{{const m=evLack(S.ev);if(m){toast(m);return}}evAnswer(true);showEvent();refresh()};
  $('#ev-n').onclick=()=>{evAnswer(false);showEvent();refresh()}}

/* ---------- hud ---------- */
function refresh(){
  const c=census(),r=S.rep;
  $('#money').textContent=fmt(S.money)+' кр';
  const d=$('#delta');if(r){d.textContent=(r.net>=0?'+':'−')+fmt(Math.abs(r.net))+' кр/мес';d.className='d '+(r.net>=0?'up':'dn')}else{d.textContent='первый месяц';d.className='d'}
  $('#date').textContent=`${MONTHS[S.month%12]}, год ${1+(S.month/12|0)}`;
  $('#s-pop').textContent=`${fmt(S.pop)}/${fmt(c.home)}`;$('#s-job').textContent=`${fmt(c.emp)}/${fmt(c.jobs)}`;
  const m=$('#s-mood');m.textContent=Math.round(S.happy)+'%';m.style.color=S.happy>=60?'var(--good)':S.happy>=40?'var(--paper)':'var(--bad)';
  const p=$('#s-pow');p.textContent=`${fmt(c.use)}/${fmt(c.sup)}`;p.style.color=c.pr<1||c.unpow?'var(--bad)':'';
  const G=GOALS[S.goal];$('#goal').innerHTML=G?`Цель ${S.goal+1}/${GOALS.length}: ${G.t} · <b>+${fmt(G.rw)} кр</b>`:'<b>Пилот пройден.</b> Развивайте город и дипломатию дальше.';
  const a=advisor(c),ad=$('#advice');ad.hidden=!a;ad.textContent=a;
  document.querySelectorAll('.tool').forEach(b=>{const t=b.dataset.t;if(B[t]&&B[t].need&&S.pop<B[t].need)b.dataset.locked='';else delete b.dataset.locked});
  refreshGov(c);showEvent();if(sheetMode)renderSheet();
}
function doTick(){
  if(S.over)return;
  const r=tick();computeCov();const done=checkGoals(r.cen,r);done.forEach(G=>toast(`Цель выполнена: ${G.t}. +${fmt(G.rw)} кр`));
  if(r.expV>0||r.impV>0)for(const i of r.cen.list)if(S.bld[i]&&S.bld[i].t==='port'){if(r.expV>0)spawnBoat(i,1);if(r.impV>0)spawnBoat(i,0)}
  if(r.alert)toast(r.alert);refresh();if(SEL>=0&&!$('#info').hidden&&TOOL==='inspect')info(SEL);store(SAVE_KEY,saveStr());
}
