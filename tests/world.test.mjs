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

const BOT = `const ts=['house','house','farm','shop','wind','house','park','saw','port','house','store','school','coalmine','police','house'];
  for(let m=0;m<MONTHS_N&&!S.over;m++){if(m%3==0)near(ts[m/3%ts.length],S.hall);const r=tick();computeCov();checkGoals(r.cen,r);
    for(const k of RK)if(!(S.stock[k]>=0)||!isFinite(S.dom[k]))throw new Error('ресурс '+k);
    if(!isFinite(S.money)||!isFinite(S.happy)||!isFinite(S.appr)||S.pop<0)throw new Error('ядро на месяце '+m);
    for(const n of S.nat)if(!isFinite(n.money)||n.rel>100||n.rel<-100)throw new Error('страна '+n.id)}`;

for (const gov of ['demo', 'parl', 'mon']) {
  test(`${gov}: 30 лет разумной игры без сбоев и без свержения`, () => {
    const r = load()(`setup(1,'${gov}','norm');S.money=20000;grid();const MONTHS_N=360;${BOT};({over:S.over,pop:S.pop,years:S.month/12})`);
    assert.equal(r.over, null, r.over && r.over.reason);
    assert.ok(r.pop > 100);
  });
}

test('20 лет на всех картах с полным набором зданий', () => {
  const run = load();
  for (const mi of [0, 1, 2]) run(`setup(${mi});S.money=50000;grid();const ts2=Object.keys(B).filter(k=>k!=='hall');
    for(let m=0;m<240&&!S.over;m++){if(m%2==0)near(ts2[m/2%ts2.length],S.hall);const r=tick();computeCov();
      if(!isFinite(S.money)||!isFinite(S.happy))throw new Error('карта ${mi} месяц '+m)}`);
});
