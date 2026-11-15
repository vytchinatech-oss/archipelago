// Стратегии игрока для прогонов (решение заместителя № 6, OFFICE.md, раздел 9а).
// Код выполняется внутри симуляции (tests/harness.mjs → load()), видит S, tick, place, near и т.д.
// Все стратегии стартуют честно: казна START, одна своя область, зерно случайности задано.
// «Скука» считается здесь одинаково для всех: доля месяцев, в которые стратегия не сделала
// ни одного полезного действия (постройка, улица, налог, договор, покупка области, ответ на событие),
// и ни один показатель невыполненной цели не сдвинулся хотя бы на 1% пути. Неудачные попытки (нет места или денег)
// от скуки не спасают и считаются отдельно (fails): высокая скука при многих неудачах — застой бота, а не игры.
import { load } from './harness.mjs';

export const STRATS = ['passive', 'smart', 'greedy', 'builder', 'reasonable'];
export const NAMES = { passive: 'Пассивный', smart: 'Умный + договор', greedy: 'Жадный', builder: 'Строитель', reasonable: 'Разумная игра' };
export const GOVS = ['demo', 'parl', 'mon'];
export const MAPS = [0, 1, 2];
export const SEED = 1;
/* Короткая партия для npm test: 5 лет. */
export const SHORT = 60;

const CODE = `
var P={acts:0,fails:0};
/* Действия игрока: считаются для метрики скуки. */
/* Как near() из harness (ближайшая к ратуше клетка у дороги, при равенстве — меньший номер), но без 40 проходов по карте.
   Клетки улиц (каждая третья линия от ратуши) не застраиваются, кроме зданий у воды: так дорогам всегда есть куда расти. */
var put=t=>{const d=B[t];if(S.money<d.cost||(d.need&&S.pop<d.need))return -1;const h=S.hall,hx=h%N,hy=h/N|0,cand=[];
  const street=i=>!d.coast&&(!((i%N-hx)%3)||!(((i/N|0)-hy)%3));
  for(let i=0;i<N*N;i++){if(S.bld[i]||S.road[i]||street(i))continue;let ok=0;for(const j of nb4(i))if(NET[j]){ok=1;break}if(ok)cand.push([Math.max(Math.abs(i%N-hx),Math.abs((i/N|0)-hy)),i])}
  cand.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);for(const[,i]of cand)if(canBuild(t,i).ok){place(t,i);return i}return -1};
/* Нет места у дороги — кратчайшая новая дорога (поиск в ширину от сети, не длиннее 14 клеток, в обход зданий, мостом через мелководье) до клетки,
   рядом с которой здание встанет, и стройка там. */
var reach=t=>{const d=B[t];if(S.money<d.cost+100||(d.need&&S.pop<d.need))return -1;
  const prev=new Int32Array(N*N).fill(-2),dist=new Uint8Array(N*N),q=[];for(let i=0;i<N*N;i++)if(S.road[i]&&NET[i]){prev[i]=-1;q.push(i)}
  for(let h=0;h<q.length;h++){const i=q[h];
    if(!S.road[i]){for(const k of nb4(i))if(!S.bld[k]&&!S.road[k]&&prev[k]===-2&&(d.coast||(k%N-S.hall%N)%3&&((k/N|0)-(S.hall/N|0))%3)&&canBuild(t,k).ok){
      const path=[];for(let j=i;j>=0&&!S.road[j];j=prev[j])path.push(j);let cost=0;for(const j of path)cost+=canBuild('road',j).cost;
      if(S.money<cost+canBuild(t,k).cost)return -1;for(const j of path.reverse())place('road',j);return place(t,k).ok?k:-1}}
    if(dist[i]>=14)continue;
    for(const j of nb4(i))if(prev[j]===-2&&!S.bld[j]&&!S.road[j]&&S.type[j]>DEEP&&canBuild('road',j).ok){prev[j]=i;dist[j]=dist[i]+1;q.push(j)}}
  return -1};
var doBuild=t=>{let i=put(t);if(i<0&&!B[t].coast&&S.money>=B[t].cost+200&&expand())i=put(t);if(i<0)i=reach(t);if(i>=0)P.acts++;else P.fails++;return i};
/* Порт: если у дороги нет берега, бот ведёт дорогу от сети к ближайшему к ратуше месту для порта и ставит его. */
var putPort=()=>{if(put('port')>=0)return 1;if(S.money<B.port.cost+100)return 0;const h=S.hall;let best=-1,bd=1e9;
  for(let i=0;i<N*N;i++){if(!canBuild('port',i).ok)continue;const d=Math.abs(i%N-h%N)+Math.abs((i/N|0)-(h/N|0));if(d<bd){bd=d;best=i}}if(best<0)return 0;
  const land=nb4(best).find(j=>S.type[j]>=SAND&&S.type[j]<MOUNT&&!S.bld[j]&&regOf(j).own);if(land===undefined)return 0;
  let from=-1,fd=1e9;for(let i=0;i<N*N;i++)if(NET[i]&&S.road[i]){const d=Math.abs(i%N-land%N)+Math.abs((i/N|0)-(land/N|0));if(d<fd){fd=d;from=i}}if(from<0)return 0;
  const path=roadPath(from,land);if(path.some(j=>!S.road[j]&&(S.bld[j]||!canBuild('road',j).ok)))return 0;
  for(const j of path)if(!S.road[j])place('road',j);return place('port',best).ok?1:0};
/* Здание вне зоны электричества (как litWind в ветке wip): подстанция или ветряк в радиусе от него, у дороги. */
var lit=()=>{for(let i=0;i<N*N;i++){const b=S.bld[i];if(!b||!CONN[i]||!(B[b.t].pow<0)||PW[i])continue;
    for(const t of['sub','wind']){if(S.money<B[t].cost)continue;const R=RAD[t]||RAD.wind;for(let j=0;j<N*N;j++){const d=Math.abs(j%N-i%N)+Math.abs((j/N|0)-(i/N|0));
      if(d<R&&!S.bld[j]&&!S.road[j]&&nb4(j).some(k=>NET[k])&&canBuild(t,j).ok){place(t,j);P.acts++;return 1}}}}return 0};
var doPort=()=>{const ok=putPort();if(ok)P.acts++;return ok?1:-1};
/* Первое, что удалось построить из списка; дома не встали — растим улицы. */
var tryList=ts=>{for(const t of ts){if((t==='port'?doPort():doBuild(t))>=0)return t}return ''};
var doTax=(k,v)=>{v=+Math.max(0,v).toFixed(2);if(S.tax[k]!==v){S.tax[k]=v;P.acts++}};
var doAnswer=yes=>{if(!S.ev)return;evAnswer(yes);P.acts++};
var doDeals=()=>{for(const n of S.nat)if(!n.deal&&!n.emb&&n.rel>=RELK.friend&&!dipWait(n)&&dip('deal',n.id)==='Договор подписан')P.acts++};
var doRegion=reserve=>{let k=-1;S.regions.forEach((g,j)=>{if(!g.own&&(k<0||g.price<S.regions[k].price))k=j});if(k>=0&&S.money-S.regions[k].price>reserve&&buyRegion(k)){computeConn();computeCov();P.acts++}};
/* Дороги растут кварталами: улицы через каждые 3 клетки от ратуши, ближние к ратуше — первыми, до 8 клеток за ход. */
var expand=()=>{const h=S.hall,hx=h%N,hy=h/N|0,cand=[];
  for(let i=0;i<N*N;i++){const x=i%N,y=i/N|0;if(S.road[i]||S.bld[i]||((x-hx)%3&&(y-hy)%3))continue;if(!nb4(i).some(j=>NET[j]&&S.road[j]))continue;
    if(canBuild('road',i).ok&&S.type[i]>SHAL)cand.push([Math.abs(x-hx)+Math.abs(y-hy),i])}
  cand.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let n=0;for(const[,i]of cand){if(n>=8||S.money<200)break;if(canBuild('road',i).ok){place('road',i);n++}}
  if(n)P.acts++;return n>0};
var unemp=c=>c.work?(c.work-c.emp)/c.work:0;
var raw=['farm','saw','cotton','coalmine','ironmine','fish','ranch'];

var BOTS={
  /* Пассивный: старт и дальше ничего; сообщения истекают сами. */
  passive:{start(){},move(){}},

  /* Умный + договор: бот из money-wallets-wip (c83ed81), переложенный на правила main, плюс договоры, ответы на сообщения
     по evWise (как советует игра), покупка второй области и расширение дорог. Налог правит как министр финансов. */
  smart:{start(){grid()},move(m,c,r){const T=S.tax;
    if(S.ev)doAnswer(evWise(S.ev,false,c));doDeals();
    if(m%2)return;
    if(r&&r.net<0&&S.money<2000&&T.inc<.2)doTax('inc',T.inc+.01);else if(r&&r.net>0&&S.money>4000&&T.inc>TAXK.incFree)doTax('inc',T.inc-.01);
    if(S.goal>=4)doRegion(3000);
    if((c.unpow||c.off)&&S.money>=B.sub.cost&&lit())return;
    const w=[];if(c.pr<1)w.push('wind');if(r&&r.short.food>ADV.food/2)w.push('farm','fish');
    /* Жильё полно — сначала дома; службы с работниками — только если есть кому работать (иначе стоят пустые). */
    const full=c.home-S.pop<5,hands=unemp(c)>.03;
    if(S.money>=500){if(full){if(S.pop>=B.tower.need&&S.money>3000)w.push('tower');w.push('house')}
      if(!c.cnt.port&&S.pop>=40)w.push('port');if(hands&&S.pop>30&&c.serve/S.pop<.9)w.push('shop');
      if(unemp(c)>.08){if(!(r&&r.short.inputs>ADV.inputs))w.push(...['textile','cannery','factory'].filter(t=>!c.cnt[t]));w.push(raw[m/2%raw.length|0],...raw)}
      if(hands&&S.pop>=B.police.need&&c.cv.police<ADV.police)w.push('police');if(c.cv.park<.4&&S.pop>40)w.push('park');if(hands&&S.pop>=B.school.need&&c.cv.school<.4)w.push('school');
      if(S.money>8000&&r&&r.net>300){if(hands&&S.pop>=B.clinic.need&&c.cv.clinic<.6)w.push('clinic');if(c.cv.park<.7)w.push('park')}
      if(S.pop>=B.tower.need&&S.money>3000)w.push('tower');w.push('house')}
    const got=tryList(w);if(!got&&S.money>=500&&!expand())doRegion(1500)}},

  /* Жадный: налоги на максимум (как позволяют ползунки), траты на минимум: только жильё и поля, на сообщения «нет». */
  greedy:{start(){grid();doTax('inc',.3);doTax('biz',.3);doTax('imp',.5);doTax('exp',.3)},move(m,c,r){
    if(S.ev)doAnswer(false);if(m%3)return;if(c.pr<1){doBuild('wind');return}doBuild(m%2?'house':'farm')}},

  /* Строитель: строит всё подряд, пока есть деньги, без запаса. */
  builder:{start(){grid()},move(m,c){if(S.ev)doAnswer(true);
    const ks=Object.keys(B).filter(k=>k!=='hall');let n=0;for(let q=0;q<ks.length&&n<3;q++){if(doBuild(ks[(m*3+q)%ks.length])>=0)n++}if(!n&&S.money>200)expand()}},

  /* Разумная игра: сценарий DESIGN.md, «Ворота 1» (п. 1–4). Министры не назначаются. Ход раз в месяц по шагам сценария.
     П. 4 (подоходный 20%, на прибыль 20%) — налоги правил 0а. На правилах 0.5.3 подоходный 20% сразу роняет настроение ниже 40
     (MOODK.incTax), город тает и проигрывает выборы на 10-м году, поэтому до кода 0а бот держит налоги START. RSN_TAX0A=1 включает п. 4. */
  reasonable:{start(){grid();if(typeof RSN_TAX0A!=='undefined'&&RSN_TAX0A){doTax('inc',.2);doTax('biz',.2)}
      for(const t of['house','house','house','house','house','house','farm','farm','fish','wind','shop'])if(doBuild(t)<0&&t==='fish')doBuild('farm')},
    move(m,c,r){if(S.ev)doAnswer(evWise(S.ev,false,c));
      if(S.pop>=60&&!P.step2){P.step2=1;for(const t of['school','store','port','saw'])t==='port'?doPort():doBuild(t);for(const k of RK){S.trade[k].e=1;S.trade[k].i=1}}
      if(c.pr<1)doBuild('wind');
      if(c.home&&(c.home-S.pop)/c.home<.1&&doBuild('house')<0)expand();
      if(S.pop>=120*((c.cnt.shop||0)+1))doBuild('shop');
      if(m%12===11&&S.pop>0&&S.money>500){const y=m/12|0,rw=[...raw.slice(y%raw.length),...raw.slice(0,y%raw.length)];
        if(r&&r.sat.food<1)tryList(['farm','fish','ranch']);else if(r&&r.short.inputs>0)tryList(rw);else tryList(['textile','cannery','factory',...rw])}}},
};

/* Показатели пути к каждой цели, 0..1 (повторяют GOALS из src/data/rules.js; тест сверяет число целей). */
var goalProg=(c,r)=>{const f=[()=>S.pop/60,()=>c.emp/40,()=>(c.cnt.port?.5:0)+(r&&r.expV>0?.5:0),()=>r&&(r.prod.goods+r.prod.cloth+r.prod.cans)>0?1:0,
  ()=>S.regions.filter(x=>x.own).length/2,()=>S.nat.some(n=>n.deal)?1:0,()=>S.pop/300,()=>r?Math.max(0,r.net)/400:0,()=>S.pop/1000];return f.map(x=>Math.min(1,x()||0))};

/* Отпечаток состояния: одинаковое зерно обязано давать одинаковый отпечаток. */
var fingerprint=()=>{const parts=[S.mi,S.gov,S.month,S.money,S.pop,S.happy,S.appr,S.unrest,S.goal,S.rs,RK.map(k=>S.stock[k]+':'+S.dom[k]).join(','),
  S.nat.map(n=>n.rel+':'+n.money+':'+n.pop).join(','),S.bld.map((b,i)=>b?i+b.t:'').join(''),Array.from(S.road).join(''),S.log.length];let h=2166136261;const s=parts.join('|');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)};

var play=(strat,mi,gov,diff,seed,months)=>{S=newGame(mi,seed);govInit(S,gov,diff);computeConn();computeCov();P={acts:0,fails:0};const bot=BOTS[strat];bot.start();
  let idle=0,played=0,low=S.money,neg=0,negRun=0,negMax=0,lastProg=null,goalM=[],answered=0,events=0,elWon=0,closedSum=0,closedN=0,c=census(),r=null;
  for(let m=0;m<months&&!S.over;m++){const a0=P.acts,f0=P.fails,g0=S.goal,ev0=S.ev;bot.move(m,c,r);if(ev0&&!S.ev)answered++;
    const e0=S.evAt;r=tick();computeCov();c=r.cen||census();checkGoals(c,r);if(S.evAt!==e0)events++;played++;
    for(let k=g0;k<S.goal;k++)goalM.push(S.month);
    const pr=goalProg(c,r),moved=S.goal>g0||!!lastProg&&pr.some((v,k)=>k>=S.goal&&v-lastProg[k]>=.01);lastProg=pr;if(P.acts===a0&&!moved)idle++;
    low=Math.min(low,S.money);if(S.money<0){neg++;negRun++;negMax=Math.max(negMax,negRun)}else negRun=0;
    if(S.month%12===0){let all=0,shut=0;for(const i of c.list){const d=B[S.bld[i].t];if(!d.out)continue;all++;if(!(c.st[i]>0)||(r.run[i]!==undefined&&r.run[i]<.05))shut++}if(all){closedSum+=shut/all;closedN++}}
    for(const k of RK)if(!(S.stock[k]>=0)||!isFinite(S.dom[k]))throw new Error('ресурс '+k+' на месяце '+m);
    if(!isFinite(S.money)||!isFinite(S.happy)||!isFinite(S.appr)||S.pop<0)throw new Error('ядро на месяце '+m)}
  return{strat,mi,gov,diff,seed,months:played,over:S.over?S.over.reason:null,overAt:S.over?S.over.month:null,goals:S.goal,goalM,
    pop:S.pop,money:Math.round(S.money),low:Math.round(low),negMonths:neg,negMax,unemp:+(unemp(c)).toFixed(3),closed:closedN?+(closedSum/closedN).toFixed(3):0,
    boredom:+(idle/Math.max(1,played)).toFixed(3),acts:P.acts,fails:P.fails,events,answered,elWon:S.elWon||0,appr:Math.round(S.appr),happy:Math.round(S.happy),fp:fingerprint()}};
`;

/** Одна партия в свежей симуляции. */
export function play(strat, mi, gov, { diff = 'norm', seed = SEED, months = 360 } = {}) {
  // В строгом режиме eval держит var внутри себя, поэтому код стратегий и вызов идут одной строкой.
  return load()(CODE + `play(${JSON.stringify(strat)},${mi},${JSON.stringify(gov)},${JSON.stringify(diff)},${seed},${months})`);
}

/** Полный набор: стратегии × карты × строи. */
export function sweep({ strats = STRATS, maps = MAPS, govs = GOVS, months = 360, seed = SEED } = {}) {
  const out = [];
  for (const s of strats) for (const mi of maps) for (const gov of govs) out.push(play(s, mi, gov, { months, seed }));
  return out;
}

export { CODE as STRAT_CODE };
