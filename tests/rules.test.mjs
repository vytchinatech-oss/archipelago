// Правила игры: каждое правило — отдельный сценарий.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';

test('рынок вне зоны электричества не обслуживает дома', () => {
  const run = load();
  const r = run(`setup();grid();let far=-1;for(let i=0;i<N*N;i++)if(!PW[i]&&nb4(i).some(j=>NET[j])&&canBuild('shop',i).ok){place('shop',i);far=i;break}
    const c=census();({far,cov:far<0?0:COV.shop[far],off:c.off})`);
  assert.ok(r.far >= 0, 'нашлось место вне зоны энергии');
  assert.equal(r.cov, 0); assert.equal(r.off, 1);
});

test('богачи из особняков не входят в рабочую силу', () => {
  const r = load()(`setup();grid();S.pop=100;for(let k=0;k<4;k++)near('villa',S.hall);S.pop=30;const c=census();({rich:c.richPop,work:c.work})`);
  assert.ok(r.rich > 0); assert.equal(r.work, Math.floor((30 - r.rich) * .62));
});

test('торговый договор обнуляет нашу пошлину на ввоз от партнёра', () => {
  const r = load()(`setup();grid();portUp();S.stock.food=0;S.pop=100;S.tax.imp=.2;let a=tick().dImp;natById('sol').deal=1;S.stock.food=0;({a,b:tick().dImp})`);
  assert.ok(r.a > 0); assert.ok(r.b < r.a * .5);
});

test('импорт стоит денег жителям даже без пошлины', () => {
  const v = load()(`setup();grid();portUp();S.tax.imp=0;S.pop=100;S.stock.food=0;tick().F.find(x=>x[0]==='Траты на импорт')[1]`);
  assert.ok(v < 0);
});

test('разорённые страны не покупают экспорт', () => {
  const v = load()(`setup();grid();portUp();for(const n of S.nat)n.money=-25000;S.stock.food=500;S.pop=20;tick().expV`);
  assert.equal(v, 0);
});

test('выплаты по нашему займу получает кредитор', () => {
  const r = load()(`setup();dip('borrow','ava',3000);const a=natById('ava').money,left=S.loans[0].left;tick();({left,now:S.loans[0].left})`);
  assert.ok(r.now < r.left);
});

test('партнёр по договору не ставит ультиматумов по пошлинам', () => {
  const n = load()(`setup();const k=natById('kar');k.deal=1;k.rel=50;S.tax.imp=.3;let bad=0;for(let i=0;i<300;i++){S.ev=null;S.month=10;makeEvent();if(S.ev&&S.ev.t==='tariff')bad++}bad`);
  assert.equal(n, 0);
});

test('рабочие сначала идут на фермы, а не на заводы', () => {
  const r = load()(`setup();grid();near('farm',S.hall);near('factory',S.hall);near('factory',S.hall);S.pop=20;const c=census();
    const f=c.list.find(i=>S.bld[i].t==='farm'),z=c.list.find(i=>S.bld[i].t==='factory');({farm:c.st[f],fac:c.st[z]})`);
  assert.ok(r.farm > r.fac, 'ферма укомплектована лучше завода');
});

test('ТЭС без рабочих и угля не даёт отрицательной энергии', () => {
  const r = load()(`setup();grid();near('power',S.hall);for(let k=0;k<8;k++)near('house',S.hall);S.pop=5;S.stock.coal=0;const x=tick();({sup:x.cen.sup,pr:x.cen.pr})`);
  assert.ok(r.sup >= 0); assert.ok(r.pr >= 0 && r.pr <= 1);
});

test('дом без электричества и рынка заселён частично', () => {
  const v = load()(`setup();let i=-1;for(let j=0;j<N*N;j++)if(!PW[j]&&canBuild('house',j).ok){place('house',j);i=j;break}homeF(i)`);
  assert.ok(v < 1);
});

test('протесты на 100% свергают власть', () => {
  const r = load()(`setup();S.happy=5;S.unrest=99;tick();S.over&&S.over.reason`);
  assert.ok(r && r.length > 5);
});

test('выборы: проигрыш при низком рейтинге', () => {
  const r = load()(`setup();S.nextEl=S.month;S.appr=10;S.happy=20;tick();S.over&&S.over.reason`);
  assert.match(r, /выборы/);
});
