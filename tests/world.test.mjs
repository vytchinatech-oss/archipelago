// Генерация карт и долгие прогоны экономики.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';

for (const mi of [0, 1, 2]) {
  test(`карта ${mi}: 7 областей, ратуша в своей области, есть тёплые, старт без золота`, () => {
    const r = load()(`const W=genWorld(${mi});({n:W.regions.length,own:W.regions[W.reg[W.hall]].own,warm:W.regions.some(g=>g.warm),gold:W.regions[W.start].min==='gold',land:W.type[W.hall]>=SAND})`);
    assert.equal(r.n, 7); assert.equal(r.own, 1); assert.ok(r.warm); assert.equal(r.gold, false); assert.ok(r.land);
  });
}

/* Разумная игра: бот строит по нуждам города, как подсказывает советник. Резерв в казне, порт с самого начала, налог правит как министр финансов:
   дефицит — подоходный выше (до 20%), полная казна — ниже, лишние деньги идут на больницы, парки и школы. */
const BOT = `var BOTK={reserve:500*CAP,rich:2000*CAP,spare:300,taxMax:.2,taxStep:.01};
  var bigGrid=()=>{const h=S.hall,hx=h%N,hy=h/N|0,R=12,at=(x,y)=>Math.max(0,Math.min(N-1,y))*N+Math.max(0,Math.min(N-1,x)),lay=(a,b)=>{for(const j of roadPath(a,b))if(!S.road[j]&&!S.bld[j]&&S.type[j]>SHAL&&canBuild('road',j).ok)place('road',j)};
    for(const d of[-R,-6,0,6,R]){lay(at(hx-R,hy+d),at(hx+R,hy+d));lay(at(hx+d,hy-R),at(hx+d,hy+R))}};
  var litWind=()=>{for(let i=0;i<N*N;i++){const b=S.bld[i];if(!b||!CONN[i]||!(B[b.t].pow<0)||PW[i])continue;
      for(let j=0;j<N*N;j++){const d=Math.abs(j%N-i%N)+Math.abs((j/N|0)-(i/N|0));if(d<RAD.wind&&nb4(j).some(k=>NET[k])&&canBuild('wind',j).ok){place('wind',j);return}}}};
  var botPick=c=>{const r=S.rep,un=c.work?(c.work-c.emp)/c.work:0,sv=S.pop?c.serve/S.pop:1;
    if(c.pr<1)return'wind';if(c.unpow&&S.money>B.wind.cost)return'lit';if(r&&r.short.food>ADV.food/2)return'farm';if(S.money<BOTK.reserve)return'';
    if(sv<.9&&S.pop>30)return'shop';
    if(un>.08){const g=r&&surplusK(r),p=g&&PROC[g];if(p&&!c.cnt[p])return p;return['farm','saw','cotton','coffee','fish','ranch'][S.month/2%6|0]}
    if(c.log<ADV.log)return'store';if(S.pop>=B.police.need&&c.cv.police<ADV.police)return'police';if(c.cv.park<.4&&S.pop>40)return'park';if(S.pop>=B.school.need&&c.cv.school<.4)return'school';
    if(S.money>BOTK.rich*2&&r&&r.net>BOTK.spare){if(S.pop>=B.clinic.need&&c.cv.clinic<.6)return'clinic';if(c.cv.park<.7)return'park';if(c.cv.school<.7&&S.pop>=B.school.need)return'school'}
    return'house'};
  var botMove=()=>{const c=census(),r=S.rep,t=botPick(c),T=S.tax;
    if(r&&r.net<0&&S.money<BOTK.rich&&T.inc<BOTK.taxMax)T.inc=+(T.inc+BOTK.taxStep).toFixed(2);else if(r&&r.net>0&&S.money>BOTK.rich&&T.inc>TAXK.incFree)T.inc=+(T.inc-BOTK.taxStep).toFixed(2);
    if(t==='lit')litWind();else if(t&&near(t,S.hall)<0&&B[t].out)near(['farm','saw','cotton','ranch'][S.month%4],S.hall)};
  var botGame=(mi,gov,months)=>{setup(mi,gov,'norm');S.money=1e6;bigGrid();S.money=START.money;S.hh=START.hh;portUp();let low=Infinity;
    for(let m=0;m<months&&!S.over;m++){if(m%2==0)botMove();const r=tick();computeCov();checkGoals(r.cen,r);low=Math.min(low,S.money);
      for(const k of RK)if(!(S.stock[k]>=0)||!isFinite(S.dom[k]))throw new Error('ресурс '+k);
      if(!isFinite(S.money)||!isFinite(S.happy)||!isFinite(S.appr)||S.pop<0)throw new Error('ядро на месяце '+m);
      for(const n of S.nat)if(!isFinite(n.money)||n.rel>100||n.rel<-100)throw new Error('страна '+n.id)}
    return{over:S.over,pop:S.pop,low,money:S.money}};`;

for (const gov of ['demo', 'parl', 'mon']) {
  test(`${gov}: 30 лет разумной игры без сбоев, без свержения и без разорения казны`, () => {
    const r = load()(`${BOT};botGame(1,'${gov}',360)`);
    assert.equal(r.over, null, r.over && r.over.reason);
    assert.ok(r.pop > 100, 'население ' + r.pop);
    assert.ok(r.low > 0, 'казна опускалась до ' + Math.round(r.low));
  });
}

for (const mi of [0, 2]) {
  test(`карта ${mi}: 20 лет разумной игры, казна не уходит в минус`, () => {
    const r = load()(`${BOT};botGame(${mi},'parl',240)`);
    assert.equal(r.over, null, r.over && r.over.reason);
    assert.ok(r.low > 0, 'казна опускалась до ' + Math.round(r.low));
  });
}

test('20 лет на всех картах с полным набором зданий, деньги сходятся каждый месяц', () => {
  const run = load();
  for (const mi of [0, 1, 2]) run(`setup(${mi});S.money=50000*CAP;grid();const ts2=Object.keys(B).filter(k=>k!=='hall');
    for(let m=0;m<240&&!S.over;m++){if(m%2==0)near(ts2[m/2%ts2.length],S.hall);const t0=S.money+S.hh,r=tick();computeCov();
      if(!isFinite(S.money)||!isFinite(S.happy)||!isFinite(S.hh)||!isFinite(S.wage))throw new Error('карта ${mi} месяц '+m);
      if(Math.abs(S.money+S.hh-t0-r.fx)>1e-6*Math.max(1,Math.abs(t0)))throw new Error('карта ${mi}: деньги не сошлись на месяце '+m);
      if(S.hh<0||S.wage<WAGE.min-1e-9||S.wage>WAGE.max+1e-9)throw new Error('карта ${mi}: кошелёк или ставка вне пределов '+S.hh+' '+S.wage)}`);
});
