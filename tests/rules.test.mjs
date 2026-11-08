// Правила игры: каждое правило — отдельный сценарий.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const TRADE = `var trade=()=>{for(const n of S.nat){n.xy={goods:700,food:700,coal:500,iron:500,coffee:400};n.my={coal:700,iron:700,goods:500,food:500}}};`;

test('соседи пишут не чаще раза в год и не повторяются подряд', () => {
  const r = load()(`${TRADE}setup();grid();portUp();dip('lend','sol',5000);const seen=[];let at=S.evAt;
    for(let m=0;m<600;m++){for(const k of RK)S.stock[k]=120;S.money=1e6;S.happy=80;S.nat.forEach((n,j)=>{n.rel=[50,5,-20][(m+j)%3];n.happy=m%5?60:20});S.lent[0]&&(S.lent[0].left=2000);trade();S.tax.imp=.2;S.over=null;tick();computeCov();if(S.evAt!==at){at=S.evAt;seen.push([S.month,S.ev.t])}if(S.ev)evAnswer(m%2===0,true)}
    let gap=1e9,rep=0;for(let i=1;i<seen.length;i++){gap=Math.min(gap,seen[i][0]-seen[i-1][0]);if(seen[i][1]===seen[i-1][1])rep++}
    ({n:seen.length,gap,rep,kinds:new Set(seen.map(x=>x[1])).size})`);
  assert.ok(r.n > 15, JSON.stringify(r)); assert.ok(r.gap >= 12, JSON.stringify(r)); assert.equal(r.rep, 0); assert.ok(r.kinds >= 8, JSON.stringify(r));
});

test('все виды сообщений читаются и применяются без сбоев', () => {
  const r = load()(`${TRADE}setup();grid();portUp();for(const k of RK)S.stock[k]=120;dip('lend','sol',5000);const bad=[],kinds={};S.month=10;S.happy=90;
    for(let i=0;i<6000;i++){const m=i%6;S.nat.forEach((n,j)=>{n.rel=[60,30,5,-20,-35,-5][(m+j)%6];n.deal=0;n.met=0;n.cr=i%3?{t:Object.keys(CRISES)[i%4],m:3}:null;n.money=i%2?3000:90000;n.happy=i%4?60:20});trade();S.lent[0].left=2000;
      S.ev=null;S.evHist=[];S.tax.imp=.2;makeEvent();const e=S.ev;if(!e)continue;kinds[e.t]=1;const x=evText(e);if(x.length!==4||/undefined|NaN/.test(x.join()))bad.push(e.t+':'+x[1]);
      evAnswer(i%2===0);S.money=1e6;for(const k of RK)S.stock[k]=120;if(!S.nat.every(n=>isFinite(n.rel)&&n.rel>=-100&&n.rel<=100))bad.push('rel '+e.t)}
    ({bad:bad.slice(0,3).join(' | '),kinds:Object.keys(kinds).sort().join()})`);
  assert.equal(r.bad, '');
  assert.equal(r.kinds, ['border','bargain','deal','debt','dumping','envoy','loan','mediate','order','ref','relief','summit','tariff'].sort().join());
});

const COUNT = `var kinds=(N=400)=>{const c={};for(let i=0;i<N;i++){S.ev=null;S.evHist=[];makeEvent();if(S.ev)c[S.ev.t]=1}return Object.keys(c).sort().join()};`;

test('сообщения приходят только с причиной', () => {
  const r = load()(`${COUNT}setup();S.month=100;S.tax.imp=.2;const none=kinds();
    const k=natById('kar');k.my={coal:800};const onlyBuy=kinds();k.xy={food:800};const both=kinds();
    k.xy={coffee:800};const notTheirs=kinds();k.xy={coal:800};const theirs=kinds();
    S.nat.forEach(n=>{n.xy={};n.my={}});const a=natById('ava');a.cr={t:'unrest',m:3};a.happy=20;a.money=150000;a.rel=30;const richLoan=kinds();
    a.money=2000;const poorLoan=kinds();({none,onlyBuy,both,notTheirs,theirs,richLoan,poorLoan})`);
  assert.doesNotMatch(r.none, /tariff|deal|dumping|loan/, r.none);
  assert.doesNotMatch(r.onlyBuy, /tariff/, r.onlyBuy); assert.match(r.both, /tariff/, r.both);
  assert.doesNotMatch(r.notTheirs, /dumping/, r.notTheirs); assert.match(r.theirs, /dumping/, r.theirs);
  assert.doesNotMatch(r.richLoan, /loan/, r.richLoan); assert.match(r.poorLoan, /loan/, r.poorLoan);
});

test('ультиматум называет реальную торговлю', () => {
  const t = load()(`setup();S.month=100;S.tax.imp=.2;const k=natById('kar');k.rel=-5;k.my={coal:1000,iron:500};k.xy={food:800};let e;for(let i=0;i<500&&!(e&&e.t==='tariff');i++){S.ev=null;S.evHist=[];makeEvent();e=S.ev}evText(e)[1]`);
  assert.match(t, /1\D500 кр/); assert.match(t, /уголь и железо/); assert.match(t, /20%/); assert.match(t, /300 кр/); assert.match(t, /еда/);
});

test('торговля копится за год и затухает', () => {
  const r = load()(`setup();const n=natById('sol');for(let i=0;i<60;i++)tradeYear(n.xy,{food:100});const full=n.xy.food;for(let i=0;i<120;i++)tradeYear(n.xy,{});({full,left:n.xy.food||0})`);
  assert.ok(r.full > 1100 && r.full <= 1200, JSON.stringify(r)); assert.ok(r.left < 1200 * .001 + 1);
});

test('согласие без денег или товара равно отказу', () => {
  const r = load()(`setup();const n=natById('sol');n.rel=10;S.money=0;S.ev={t:'summit',nid:'sol',exp:99};evAnswer(true);const a=n.rel;S.stock.food=0;S.ev={t:'order',nid:'sol',k:'food',amt:30,price:9,exp:99};evAnswer(true);({a,b:n.rel,m:S.money,f:S.stock.food})`);
  assert.equal(r.a, 9); assert.equal(r.b, 7); assert.equal(r.m, 0); assert.equal(r.f, 0);
});

test('к стране можно обратиться раз в год, неудачная попытка год не тратит', () => {
  const r = load()(`setup();const s=natById('sol'),k=natById('kar');k.rel=0;const fail=dip('deal','kar');const free=dipWait(k);
    dip('aid','sol');const rel=s.rel,m=S.money,again=dip('lend','sol',2000);const same=s.rel===rel&&S.money===m;const other=dip('aid','ava');
    S.month+=11;const w=dipWait(s);S.month+=1;const later=dip('aid','sol');({free,again,same,other,w,later,fail})`);
  assert.equal(r.free, 0); assert.match(r.again, /через 12 месяцев/); assert.ok(r.same);
  assert.match(r.other, /Отношения/); assert.equal(r.w, 1); assert.match(r.later, /Отношения/);
});

test('министр не ломается, когда страна на перерыве', () => {
  const r = load()(`setup();S.money=-5000;for(const n of S.nat){n.actAt=S.month;n.rel=30}let ok=1;try{for(const p in POSTS)for(let i=0;i<3;i++){tick();computeCov()}}catch(e){ok=e.message}({ok,loans:S.loans.length})`);
  assert.equal(r.ok, 1);
});

test('старое сохранение без новых полей загружается', () => {
  const r = load()(`setup();const o=JSON.parse(saveStr());delete o.evAt;delete o.evHist;delete o.evNid;o.nat.forEach(n=>{delete n.actAt;delete n.xy;delete n.my});o.ev={t:'tariff',nid:'kar',exp:99};
    S=loadStr(JSON.stringify(o));computeConn();computeCov();tick();({at:S.evAt,h:Array.isArray(S.evHist),w:dipWait(S.nat[0]),ev:S.ev&&S.ev.r,xy:typeof S.nat[0].xy})`);
  assert.equal(r.at, -99); assert.ok(r.h); assert.equal(r.w, 0); assert.ok(!r.ev); assert.equal(r.xy, 'object');
});

// ---------- Стандарты правил: Н12, Н15–Н19 ----------
const plain = v => JSON.parse(JSON.stringify(v));

test('Н12: строки бюджета складываются в итог, деньги сходятся с казной', () => {
  const r = load()(`setup(0,'mon');grid();for(let k=0;k<4;k++)near('house',S.hall);near('farm',S.hall);S.pop=30;
    for(const p of['fin','soc','en']){hire(p,S.cand[p][0].id);S.min[p].hon=false}S.min.soc.auto=1;S.guard=1;
    let bad=[],saw={sal:0,theft:0,guard:0};
    for(let m=0;m<24&&!S.over;m++){const m0=S.money,x=tick();computeCov();const L=budgetLines(x),sum=L.inc.reduce((a,l)=>a+l[1],0)-L.out.reduce((a,l)=>a+l[1],0);
      if(Math.abs(sum-x.net)>1e-6)bad.push('строки '+sum+' итог '+x.net);if(Math.abs(S.money-m0-x.net-x.auto)>1e-6)bad.push('казна');for(const k in saw)saw[k]=Math.max(saw[k],x[k]);if(m===0&&!L.out.some(l=>l[0]==='Гвардия'))bad.push('нет гвардии')}
    ({bad:bad.slice(0,3).join(),saw})`);
  assert.equal(r.bad, ''); assert.ok(r.saw.sal > 0); assert.ok(r.saw.theft > 0); assert.equal(r.saw.guard, 80);
});

test('Н15: названия отношений и пороги из единой шкалы', () => {
  const r = load()(`setup();const L=v=>relLabel(v)[0];const n=natById('sol');n.money=1e6;
    const can=v=>{n.rel=v;n.actAt=-99;n.deal=0;const a=dip('deal','sol');const ok=n.deal===1;n.deal=0;return ok};
    const borrow=v=>{n.rel=v;n.actAt=-99;const c=S.loans.length;dip('borrow','sol',1000);return S.loans.length>c};
    const offer=v=>{S.month=100;n.rel=v;n.deal=0;n.xy={food:900};n.my={food:900};let got=0;for(let i=0;i<300;i++){S.ev=null;S.evHist=[];makeEvent();if(S.ev&&S.ev.t==='deal'&&S.ev.nid==='sol')got=1}return got};
    ({l:[L(50),L(49),L(25),L(24),L(-15),L(-16),L(-50),L(-51)],deal:[can(24),can(25)],borrow:[borrow(-51),borrow(-50)],offer:[offer(24),offer(25)]})`);
  assert.deepEqual(plain(r.l), ['Союзник', 'Дружба', 'Дружба', 'Нейтралитет', 'Нейтралитет', 'Напряжённость', 'Напряжённость', 'Вражда']);
  assert.deepEqual(plain(r.deal), [false, true]); assert.deepEqual(plain(r.borrow), [false, true]); assert.deepEqual(plain(r.offer), [0, 1]);
});

test('Н15: граница «только друзьям» открыта от 25', () => {
  const r = load()(`const go=v=>{setup();grid();for(let k=0;k<8;k++)near('house',S.hall);near('wind',S.hall);computeCov();S.pop=5;S.happy=95;S.mig='allies';for(const n of S.nat){n.rel=v;n.happy=40;n.cr=null}return Object.values(tick().mig).reduce((a,b)=>a+Math.max(0,b),0)};({a:go(24),b:go(25)})`);
  assert.equal(r.a, 0); assert.ok(r.b > 0);
});

test('Н15: договор и заём дают один эффект через кнопку и через сообщение', () => {
  const r = load()(`setup();const n=natById('sol');const reset=()=>{n.rel=30;n.deal=0;n.actAt=-99;S.lent=[]};
    reset();dip('deal','sol');const d1=n.rel;reset();S.ev={t:'deal',nid:'sol',exp:99,r:1};evAnswer(true);const d2=n.rel;
    reset();dip('lend','sol',2000);const l1=n.rel,p1=JSON.stringify(S.lent);reset();S.ev={t:'loan',nid:'sol',amt:2000,rate:DIPA.lendRate,exp:99,r:1};evAnswer(true);({d1,d2,l1,l2:n.rel,p1,p2:JSON.stringify(S.lent)})`);
  assert.equal(r.d1, 35); assert.equal(r.d2, 35); assert.equal(r.l1, 36); assert.equal(r.l2, 36); assert.equal(r.p1, r.p2);
});

test('Н16: гвардия исчезает вместе с монархией и не появляется при других строях', () => {
  const r = load()(`setup(0,'mon');S.guard=1;S.army=90;S.appr=90;S.money=1e6;const msg=reform('demo');const a=S.guard;const t=toggleGuard();
    const o=JSON.parse(saveStr());o.guard=1;const old=loadStr(JSON.stringify(o)).guard;
    setup(0,'mon');const on=toggleGuard();({msg,a,t,old,on,g:S.guard})`);
  assert.equal(r.a, 0); assert.match(r.t, /монархии/); assert.equal(r.old, 0); assert.equal(r.on, 'Гвардия набрана'); assert.equal(r.g, 1);
});

test('Н17: автопилот не трогает выключатели вывоза и ввоза', () => {
  const r = load()(`setup();grid();near('power',S.hall);near('factory',S.hall);for(let k=0;k<5;k++)near('house',S.hall);S.pop=40;S.stock.food=0;S.stock.coal=0;
    for(const p in POSTS){hire(p,S.cand[p][0].id);S.min[p].auto=1;S.min[p].hon=true;S.min[p].loy=true}
    for(const k of RK)S.trade[k]={e:0,i:0};for(let m=0;m<6&&!S.over;m++){tick();computeCov()}RK.filter(k=>S.trade[k].e||S.trade[k].i).join()`);
  assert.equal(r, '');
});

test('Н17: пойманного вора снимают с поста, описания не обещают лишнего', () => {
  const r = load()(`setup();hire('ind',S.cand.ind[0].id);S.min.ind.hon=false;S.min.ind.loy=true;const a0=S.appr;Math.random=()=>0;tick();({left:!!S.min.ind,caught:S.log.some(l=>/снят с поста/.test(l.t)),a:POSTS.mvd.a,agr:POSTS.agr.a})`);
  assert.equal(r.left, false); assert.ok(r.caught); assert.doesNotMatch(r.a, /гасит/); assert.doesNotMatch(r.agr, /включает/);
});

test('Н18: в логике нет дробных коэффициентов', () => {
  const r = load()(`1`);
  const src = ['economy', 'nations', 'politics'].map(f => readFileSync(new URL(`../src/sim/${f}.js`, import.meta.url), 'utf8')).join('\n');
  const found = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '').replace(/Math\.random\(\)-\.5/g, '').match(/(?<![\w.'"`])\d*\.\d+/g) || [];
  assert.equal(r, 1); assert.deepEqual(found, []);
});

test('Н19: наценка лежит на области с золотом', () => {
  const r = load()(`const bad=[];for(const mi of[0,1,2]){const W=genWorld(mi);W.regions.forEach((g,k)=>{const base=Math.round((REGK.base+g.land*REGK.perTile)/REGK.round)*REGK.round,want=g.min==='gold'?Math.round(base*REGK.goldMul/REGK.round)*REGK.round:base;if(g.price!==want)bad.push(mi+':'+k+' '+g.min+' '+g.price+'/'+want)})}bad.join()`);
  assert.equal(r, '');
});

test('шкалы: протесты растут только при кризисе настроения, жители уезжают ниже 40', () => {
  const r = load()(`const un=h=>{setup();grid();for(let k=0;k<6;k++)near('house',S.hall);S.stock.food=500;S.pop=20;S.money=5000;S.fac.peo.sat=50;S.appr=50;S.unrest=20;S.happy=h;const f=S.happy;Object.defineProperty(S,'happy',{get:()=>f,set(){},configurable:true,enumerable:true});tick();return S.unrest-20};
    ({at26:un(26),at24:un(24),kinds:[SCALE.crisis,SCALE.bad,SCALE.good,SCALE.top],leave:POPK.leaveBelow,grow:POPK.growFrom,coup:ARMY.coupBelow,parl:[GOVK.parlLo,GOVK.parlLo+GOVK.parlSpan],speed:[MOODK.speed,APPR.speed,GOVK.satSpeed,ARMY.speed]})`);
  assert.ok(r.at26 < 0, JSON.stringify(r)); assert.ok(r.at24 > r.at26, JSON.stringify(r));
  assert.deepEqual(plain(r.kinds), [25, 40, 60, 75]); assert.equal(r.leave, 40); assert.equal(r.grow, 40); assert.equal(r.coup, 40);
  assert.deepEqual(plain(r.parl), [25, 75]); assert.deepEqual(plain(r.speed), [.3, .3, .3, .3]);
});
