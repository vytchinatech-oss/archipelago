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

// ---------- Фракции 2.0 ----------
test('казармы дают места военным, без них у военных 0 мест; всего мест 100', () => {
  const r = load()(`setup();grid();for(let k=0;k<6;k++)near('house',S.hall);S.pop=60;tick();const a=S.seats.mil;
    S.pop=60;near('barracks',S.hall);computeCov();tick();({a,b:S.seats.mil,sum:Object.values(S.seats).reduce((x,y)=>x+y,0)})`);
  assert.equal(r.a, 0); assert.ok(r.b > 0); assert.equal(r.sum, 100);
});

test('экспорт еды в страну делает её любимой у аграриев', () => {
  const r = load()(`setup();grid();portUp();for(let k=0;k<6;k++)near('house',S.hall);near('wind',S.hall);computeCov();
    for(let m=0;m<20;m++){S.stock.food=600;S.pop=50;tick();computeCov()}const best=S.nat.slice().sort((a,b)=>S.fatt.agr[b.id]-S.fatt.agr[a.id])[0];
    ({att:S.fatt.agr[best.id]})`);
  assert.ok(r.att > .3);
});

test('ссора с главным покупателем еды злит аграриев', () => {
  const r = load()(`const sat=rel=>{setup();for(const n of S.nat){S.fatt.agr[n.id]=n.id==='kar'?1:0;n.rel=n.id==='kar'?rel:0}for(let m=0;m<6;m++){natById('kar').rel=rel;tick()}return S.fac.agr.sat};
    ({good:sat(60),bad:sat(-80)})`);
  assert.ok(r.good - r.bad > 5, JSON.stringify(r));
});

test('военные против договора с враждебным Кардоном', () => {
  const r = load()(`setup();const k=natById('kar');for(let m=0;m<12;m++)tick();const a=natEff('mil');k.deal=1;k.rel=30;const b=natEff('mil');({a,b})`);
  assert.ok(r.b < r.a);
});

test('злые аграрии саботируют поля: −10% урожая', () => {
  const r = load()(`setup();grid();const f=near('farm',S.hall);S.pop=30;S.fac.agr.sat=60;const a=tick().bs[f].out.food;S.pop=30;S.fac.agr.sat=10;const b=tick().bs[f].out.food;({a,b})`);
  assert.ok(Math.abs(r.b / r.a - .9) < .03, JSON.stringify(r));
});

test('монархия: недовольные военные снижают лояльность армии', () => {
  const r = load()(`const army=sat=>{setup(0,'mon');for(let m=0;m<12;m++){S.fac.mil.sat=sat;tick()}return S.army};({hi:army(90),lo:army(10)})`);
  assert.ok(r.hi - r.lo > 15, JSON.stringify(r));
});

test('сохранение v3 загружается с новыми фракциями', () => {
  const r = load()(`setup();const o=JSON.parse(saveStr());o.v=3;delete o.fac.mil;delete o.fac.int;delete o.seats.mil;delete o.seats.int;delete o.fatt;
    S=loadStr(JSON.stringify(o));computeConn();computeCov();tick();({v:S.v,mil:S.fac.mil.sat>=0,att:typeof S.fatt.int.kar})`);
  assert.equal(r.v, 4); assert.ok(r.mil); assert.equal(r.att, 'number');
});

test('обучение: у каждого шага есть текст и способ завершиться', () => {
  const r = load()(`const bad=[];for(const c in TUT_COURSES)for(const id of TUT_COURSES[c].steps){const st=TUT[id];if(!st||!st.h||!st.p||!(st.next||st.ui||TUTOK[id]))bad.push(c+':'+id)}
    ({bad:bad.join(','),time:Object.values(TUT_COURSES).every(c=>c.steps.includes('time'))})`);
  assert.equal(r.bad, ''); assert.ok(r.time);
});

test('обучение: шаги стройки засчитываются по городу, время стоит до шага «время»', () => {
  const r = load()(`S=newGame(0);govInit(S,'demo','norm');computeConn();computeCov();tutStart(S,'short');
    const go=id=>{while(tutStep()!==id)tutAdvance()};const out={};
    go('road');out.lock=tutLocksTime();out.road0=tutStateOk('road');grid();out.road1=tutStateOk('road');
    go('house');out.house0=tutStateOk('house');near('house',S.hall);out.house1=tutStateOk('house');
    go('time');out.lockAtTime=tutLocksTime();out.t0=tutStateOk('time');tick();out.t1=tutStateOk('time');
    go('done');out.end=tutAdvance();out.tut=S.tut;
    S=loadStr(saveStr());out.saved=S.tut;out`);
  assert.equal(r.lock, true); assert.equal(r.road0, false); assert.equal(r.road1, true);
  assert.equal(r.house0, false); assert.equal(r.house1, true);
  assert.equal(r.lockAtTime, false); assert.equal(r.t0, false); assert.equal(r.t1, true);
  assert.equal(r.end, null); assert.equal(r.tut, null); assert.equal(r.saved, null);
});

test('обучение: налоговый шаг ждёт изменения налога', () => {
  const r = load()(`setup();tutStart(S,'full');while(tutStep()!=='tax')tutAdvance();const a=tutStateOk('tax');S.tax.inc+=.03;({a,b:tutStateOk('tax')})`);
  assert.equal(r.a, false); assert.equal(r.b, true);
});
