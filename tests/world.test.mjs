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

/* Сценарий «разумной игры» из DESIGN.md, «Ворота 1». Министры не назначаются: проверяем правила, а не автопилот. */
const REASONABLE = `S.money=START.money;grid();
  {const h=S.hall;for(const[a,b]of[[h-5+8*N,h-5+16*N],[h+3+8*N,h+11+8*N],[h+3,h+11],[h-5,h-13],[h-5+16*N,h+11+16*N],[h+11+8*N,h+11+16*N]])for(const j of roadPath(a,b))if(S.type[j]>=SAND&&S.type[j]<MOUNT&&canBuild('road',j).ok)place('road',j);
   let site=-1,bd=1e9;for(let i=0;i<N*N;i++){if(!canBuild('port',i).ok)continue;const d=Math.abs(i%N-h%N)+Math.abs((i/N|0)-(h/N|0));if(d<bd){bd=d;site=i}}
   const land=nb4(site).find(j=>S.type[j]>=SAND&&S.type[j]<MOUNT);for(const j of roadPath(h+1,land))if(!S.road[j]&&!S.bld[j])place('road',j);computeConn()}
  const b=t=>near(t,S.hall),CH=['saw','cotton','textile','ironmine','coalmine','factory','cannery','coffee','cotton','textile','saw','ironmine','factory','goldmine'],KEEP=2000*CAP;
  for(let k=0;k<6;k++)b('house');b('farm');b('farm');b('fish');b('wind');b('shop');computeConn();computeCov();
  let ci=0,st2=0,neg=0,negMax=0,unemp=0;
  for(let m=0;m<360&&!S.over;m++){
    if(!st2&&S.pop>=60){b('school');b('store');const p=b('port');computeConn();computeCov();if(p>=0&&!PW[p])b('wind');b('saw');st2=1;computeConn();computeCov()}
    const r0=S.rep;
    if(st2&&m%12==11&&r0&&S.money>KEEP){const c=r0.cen;
      if(r0.sat.food<1)b('farm');else if(c.work>=c.jobs){let g=0;while(g++<CH.length){const t=CH[ci++%CH.length];if(S.money>B[t].cost+KEEP&&b(t)>=0)break}}
      if((c.home-S.pop)/Math.max(1,c.home)<.1){b('house');b('house')}
      if((c.cnt.shop||0)*120<S.pop)b('shop');
      if(c.use>c.sup)b('wind');computeConn();computeCov()}
    const t0=S.money+S.hh,r=tick();computeCov();
    if(Math.abs(S.money+S.hh-t0-r.fx)>1e-6*Math.max(1,Math.abs(t0)))throw new Error('кошельки не сошлись на месяце '+m);
    checkGoals(r.cen,r);
    if(!isFinite(S.money)||!isFinite(S.happy)||!isFinite(S.appr)||S.pop<0)throw new Error('ядро на месяце '+m);
    neg=S.money<0?neg+1:0;negMax=Math.max(negMax,neg);unemp=r.unemp}
  ({over:S.over,pop:S.pop,negMax,unemp})`;

for (const gov of ['demo', 'parl', 'mon']) {
  test(`${gov}: 30 лет разумной игры: у власти, казна не в минусе дольше года, безработица ниже 15%, кошельки сходятся`, () => {
    const r = load()(`setup(1,'${gov}','norm');${REASONABLE}`);
    assert.equal(r.over, null, r.over && r.over.reason);
    assert.ok(r.pop > 100, 'население ' + r.pop);
    assert.ok(r.negMax <= 12, 'месяцев подряд в минусе: ' + r.negMax);
    assert.ok(r.unemp < .15, 'безработица ' + r.unemp);
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
