/* Состояние игры S, дороги, ореолы, найм, месячный расчёт экономики, цели, правила стройки. */
let S=null,CONN=new Uint8Array(N*N),NET=new Uint8Array(N*N);
function nb4(i){const x=i%N,r=[];if(x>0)r.push(i-1);if(x<N-1)r.push(i+1);if(i>=N)r.push(i-N);if(i<N*N-N)r.push(i+N);return r}
function computeConn(){
  const net=new Uint8Array(N*N),q=[S.hall];net[S.hall]=1;
  while(q.length){const i=q.pop();for(const j of nb4(i))if(!net[j]&&S.road[j]){net[j]=1;q.push(j)}}
  const con=new Uint8Array(N*N);
  for(let i=0;i<N*N;i++){const b=S.bld[i];if(!b)continue;if(b.t==='hall'){con[i]=1;continue}
    for(const j of nb4(i))if(net[j]){con[i]=1;break}}
  NET=net;CONN=con;
}
function forestNear(i){let c=0;const x=i%N,y=i/N|0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;const j=Y*N+X;if(S.type[j]===FOREST&&!S.bld[j]&&!S.road[j])c++}
  return Math.min(1,c/7)}
function waterNear(i){const x=i%N,y=i/N|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;if(S.type[Y*N+X]<=SHAL)return true}return false}
let PW=new Uint8Array(N*N),COV={},WDIST=new Uint16Array(N*N);
function disk(i,R,arr){const x=i%N,y=i/N|0;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R+R)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;arr[Y*N+X]=1}}
function computeCov(){
  PW=new Uint8Array(N*N);COV={};for(const k of['shop','park','school','clinic','police','store'])COV[k]=new Uint8Array(N*N);
  const subs=[];
  for(let i=0;i<N*N;i++){const b=S.bld[i];if(!b||!CONN[i])continue;const t=b.t;
    if(t==='hall'||t==='power'||t==='wind')disk(i,RAD[t],PW);else if(t==='sub')subs.push(i)}
  const done=new Set();let ch=1;while(ch){ch=0;for(const k of subs)if(PW[k]&&!done.has(k)){done.add(k);disk(k,RAD.sub,PW);ch=1}}
  for(let i=0;i<N*N;i++){const b=S.bld[i];if(b&&CONN[i]&&COV[b.t]&&live(i))disk(i,RAD[b.t],COV[b.t])}
  WDIST=new Uint16Array(N*N).fill(999);const q=[];
  for(let i=0;i<N*N;i++){const b=S.bld[i];if(b&&B[b.t].home&&CONN[i]){WDIST[i]=0;q.push(i)}}
  for(let h=0;h<q.length;h++){const i=q[h];for(const j of nb4(i))if(S.road[j]&&WDIST[j]>WDIST[i]+1){WDIST[j]=WDIST[i]+1;q.push(j)}}
}
function wdist(i){let m=999;for(const j of nb4(i))if(WDIST[j]<m)m=WDIST[j];return Math.min(999,m+1)}
const live=i=>{const d=B[S.bld[i].t];return !(d.pow<0)||PW[i]};
const dfac=d=>Math.max(.3,Math.min(1,1-(d-6)*.025));
const PRI=t=>{const d=B[t];if(t==='hall')return 0;if(d.out&&d.out.food)return 1;if(d.cat==='pow')return 2;if(d.cat==='svc'||d.cat==='com'||d.cat==='mil')return 3;if(d.cat==='ind')return 5;return 4};
const homeF=i=>(PW[i]?1:.5)*(COV.shop[i]?1:.6);
function census(){
  const c={coalSup:0,off:0,home:0,homeFull:0,poor:0,unpow:0,cv:{shop:0,park:0,school:0,clinic:0,police:0},jobs:0,sup:0,use:0,serve:0,parks:0,ports:0,stores:0,prodN:0,rich:0,huts:0,coalPl:0,cnt:{},dis:0,list:[]};
  for(let i=0;i<N*N;i++){const b=S.bld[i];if(!b)continue;const d=B[b.t];c.cnt[b.t]=(c.cnt[b.t]||0)+1;
    if(!CONN[i]){c.dis++;continue}
    if(d.home){const hf=homeF(i),h=d.home*hf;c.home+=h;c.homeFull+=d.home;if(hf<1)c.poor++;if(d.rich)c.rich+=h;if(b.t==='hut')c.huts+=h;
      for(const k of['shop','park','school','clinic','police'])if(COV[k][i])c.cv[k]+=h}
    if(d.jobs)c.jobs+=d.jobs;if(d.pow<0){if(PW[i])c.use-=d.pow;else c.unpow++}if(d.fuel)c.coalPl++;
    if(d.park)c.parks++;if(d.out)c.prodN++;c.list.push(i)}
  c.home=Math.round(c.home);for(const k in c.cv)c.cv[k]=c.home?Math.min(1,c.cv[k]/c.home):0;
  c.richPop=c.home?Math.min(S.pop,c.home)*c.rich/c.home:0;c.work=Math.floor((S.pop-c.richPop)*.62);c.emp=Math.min(c.work,c.jobs);c.staff=c.jobs?c.emp/c.jobs:0;
  const jl=c.list.filter(i=>B[S.bld[i].t].jobs).map(i=>[i,PRI(S.bld[i].t),wdist(i)]).sort((a,b)=>a[1]-b[1]||a[2]-b[2]);
  let left=c.emp;c.st={};for(const[i]of jl){const j=B[S.bld[i].t].jobs,a=Math.min(j,left);left-=a;c.st[i]=a/j}
  for(const i of c.list){const t=S.bld[i].t,d=B[t],s=d.jobs?c.st[i]:1,on=d.pow<0?PW[i]:1;
    if(d.pow>0){const p=t==='hall'?d.pow:d.pow*s*(1+.04*M('en'));c.sup+=p;if(d.fuel)c.coalSup+=p}
    if(on){if(d.serve)c.serve+=d.serve*s;if(d.cap)c.ports+=d.cap*s;if(d.stor&&s>=.5)c.stores++}else if(d.serve||d.cap||d.stor)c.off++}
  const fT=facM('trd');c.serve*=fT;if(c.ports)c.ports=Math.round((c.ports+c.stores*25)*fT);
  c.pr=c.use>0?Math.min(1,c.sup/c.use):1;
  c.log=1;c.cap=300+300*c.stores;
  return c;
}
const addNK=(o,id,k,v)=>{const x=o[id]||(o[id]={});x[k]=(x[k]||0)+v};
function upkeep(){let u=0;for(let i=0;i<N*N;i++){const b=S.bld[i];if(b)u+=B[b.t].up;if(S.road[i])u+=S.road[i]===2?1:.25}return u}

function tick(){
  const c=census(),T=S.tax,st=S.stock,z=()=>Object.fromEntries(RK.map(k=>[k,0]));
  const r={bs:{},impH:0,impB:0,inc:0,biz:0,dImp:0,dExp:0,up:0,int:0,loanIn:0,loanOut:0,prod:z(),cons:z(),exp:z(),imp:z(),need:z(),expV:0,impV:0,
    best:{},dest:{},xn:{},mn:{},sat:{},short:{food:0,inputs:0},run:{},ev:[],mig:{}};
  if(!S.nat[0].dl.food)refreshMarkets();
  c.ports=Math.round(c.ports*(1+.05*M('trd')));let cap=c.ports;const port=cap>0;
  const buy=(k,q,who)=>{q=Math.ceil(q);if(!port||!S.trade[k].i||q<=0)return;
    const ns=S.nat.filter(n=>canTrade(n)&&n.sl[k]>0).sort((a,b)=>natSell(a,k)-natSell(b,k));
    for(const n of ns){if(q<=0||cap<=0)break;const x=Math.min(q,cap,n.sl[k]);const p=natSell(n,k),v=x*p;
      const du=n.deal?0:T.imp;n.sl[k]-=x;cap-=x;q-=x;st[k]+=x;r.imp[k]+=x;r.impV+=v;r.dImp+=v*du;n.money+=v;if(who==='h')r.impH+=v*(1+du);else r.impB+=v;r.dest[n.id]=(r.dest[n.id]||0)+v;addNK(r.mn,n.id,k,v)}};
  // fuel
  const fuelNeed=c.coalPl*4*(1-.05*M('en'));if(st.coal<fuelNeed)buy('coal',fuelNeed-st.coal);
  const fr=c.coalPl?Math.min(1,st.coal/fuelNeed):1;st.coal-=fuelNeed*fr;r.cons.coal+=fuelNeed*fr;r.need.coal+=fuelNeed;r.fuel=fr;
  c.sup=Math.max(0,c.sup-c.coalSup*(1-fr));c.pr=c.use>0?Math.max(0,Math.min(1,c.sup/c.use)):1;
  // primary production
  const bizPen=Math.max(0,T.biz-.15)*1.6,eff=Math.max(0,1-bizPen);r.eff=eff;r.bizPen=bizPen;
  const agg={};
  const small=c.prodN<=4;let lgSum=0;
  for(const i of c.list){const b=S.bld[i],d=B[b.t];if(!d.out)continue;const lg=small||COV.store[i]?1:.75;lgSum+=lg;
    const P={staff:c.st[i]||0,power:d.pow<0?(PW[i]?c.pr:.35):1,commute:dfac(wdist(i)),log:lg,tax:eff,fac:facM(sphereOf(b.t))};
    const e=P.staff*P.power*P.commute*P.log*P.tax*P.fac;
    if(d.in){P.minister=1+.03*M('ind');agg[b.t]=(agg[b.t]||0)+e*P.minister;r.bs[i]={P,e:e*P.minister};continue}
    if(d.fert)P.fert=fert(i);if(b.t==='saw')P.forest=.35+.65*forestNear(i);if(d.dep&&S.type[i]===MOUNT)P.mount=1.3;if(b.t==='cotton'&&regOf(i).warm)P.warm=1.3;
    if(d.out.food||d.out.coffee||d.out.cotton)P.minister=1+.03*M('agr');else P.minister=1+.03*M('ind');
    let m=e*(P.fert||1)*(P.forest||1)*(P.mount||1)*(P.warm||1)*P.minister;const out={};
    for(const k in d.out){out[k]=d.out[k]*m;r.prod[k]+=out[k]}r.bs[i]={P,out}}
  c.log=c.prodN?lgSum/c.prodN:1;
  for(const k of RK)st[k]+=r.prod[k];
  const served=Math.min(S.pop*c.cv.shop,c.serve),richPop=c.richPop;
  const nF=S.pop*.12;
  // industry
  for(const t of['factory','textile','cannery']){const a=agg[t];if(!a)continue;const d=B[t];
    for(const k in d.in){const need=d.in[k]*a;r.need[k]+=need;if(k!=='food'&&st[k]<need)buy(k,need-st[k])}
    let run=1,lim=null;for(const k in d.in){const av=st[k]-(k==='food'?nF*1.5:0),q=Math.max(0,av)/(d.in[k]*a);if(q<run){run=q;lim=k}}r.lim=r.lim||{};r.lim[t]=run<.99?lim:null;run=Math.max(0,Math.min(1,run));
    for(const k in d.in){const u=d.in[k]*a*run;st[k]-=u;r.cons[k]+=u}for(const k in d.out){const o=d.out[k]*a*run;st[k]+=o;r.prod[k]+=o}
    r.run[t]=run;
    for(const i in r.bs){const x=r.bs[i];if(x.e===undefined||S.bld[i].t!==t)continue;x.run=run;x.out={};x.inp={};x.need={};
      for(const k in d.out)x.out[k]=d.out[k]*x.e*run;for(const k in d.in){x.inp[k]=d.in[k]*x.e*run;x.need[k]=d.in[k]*x.e}}
    if(t!=='cannery'&&run<.95)r.short.inputs=Math.max(r.short.inputs,1-run)}
  // consumers
  const need={food:nF,goods:served*.05,cloth:served*.03,coffee:served*.004+richPop*c.cv.shop*.06};
  for(const k in need){const q=need[k];r.need[k]+=q;if(st[k]<q)buy(k,q-st[k],'h');const e=Math.min(st[k],q);st[k]-=e;r.cons[k]+=e;r.sat[k]=q>0?e/q:1}
  r.short.food=1-r.sat.food;
  // exports: best price first
  const xf=Math.max(0,1-T.exp*1.6),reserve=k=>r.need[k]*2;
  const order=RK.slice().sort((a,b)=>RES[b].base-RES[a].base);
  for(const k of order){
    const ns=S.nat.filter(canTrade).sort((a,b)=>natBuy(b,k)*(1-natTariff(b))-natBuy(a,k)*(1-natTariff(a)));
    if(ns.length)r.best[k]={nid:ns[0].id,p:natBuy(ns[0],k)*(1-natTariff(ns[0]))};
    if(!port||!S.trade[k].e)continue;
    let sur=st[k]-reserve(k);
    for(const n of ns){if(sur<1||cap<1)break;const p=natBuy(n,k)*(1+.015*M('trd')),q=Math.floor(Math.min(sur,cap,n.dl[k],Math.max(0,n.money+20000)/p)*xf);if(q<1)continue;
      const v=q*p*(1-natTariff(n));n.dl[k]-=q;cap-=q;sur-=q;st[k]-=q;r.exp[k]+=q;r.expV+=v;r.dExp+=v*T.exp;
      n.money-=q*p;n.rel=Math.min(100,n.rel+q*.005);r.dest[n.id]=(r.dest[n.id]||0)+v;addNK(r.xn,n.id,k,v)}}
  for(const k of RK){st[k]=Math.max(0,st[k]);if(st[k]>c.cap){st[k]=c.cap;if(!(S.month%6))r.ev.push(`Склады переполнены: ${RES[k].n.toLowerCase()} портится. Стройте склады или продавайте через порт.`)}}
  r.portUse=c.ports?1-cap/c.ports:0;
  // domestic prices
  for(const k of RK){const sup=Math.max(0,r.prod[k]+r.imp[k]+st[k]*.2),dem=Math.max(0,r.need[k]);
    const target=dem<.5?RES[k].base*.7:RES[k].base*Math.max(.5,Math.min(2,Math.pow((dem+2)/(sup+2),.6)));S.dom[k]+=(target-S.dom[k])*.4}
  // budget
  const sold=RK.reduce((a,k)=>a+r.cons[k]*S.dom[k],0)+r.expV;
  r.inc=(c.emp*15*(1+.3*c.cv.school)+richPop*60)*T.inc;r.biz=Math.max(0,sold-r.impB)*T.biz*(1+.02*M('fin'));r.inc*=1+.02*M('fin');r.wages=c.emp*15*(1+.3*c.cv.school)+richPop*60;r.up=upkeep();r.int=S.money<0?-S.money*.02:0;
  for(const L of S.loans){const p=Math.min(L.left,L.pay);L.left-=p;r.loanOut+=p;natById(L.nid).money+=p}S.loans=S.loans.filter(L=>L.left>.5);
  for(const L of S.lent){const n=natById(L.nid);if(n.money<0&&Math.random()<.5){r.ev.push(`${ND(n).n} задерживает выплату по вашему займу.`);continue}const p=Math.min(L.left,L.pay);L.left-=p;n.money-=p;r.loanIn+=p}
  S.lent=S.lent.filter(L=>L.left>.5);
  r.net=r.inc+r.biz+r.dImp+r.dExp+r.loanIn-r.up-r.int-r.loanOut;S.money+=r.net;
  // mood
  const unemp=c.work>0?(c.work-c.emp)/c.work:0;
  const sh=S.pop>0?served/S.pop:0;
  const F=[['Базовое настроение',50],['Товары на рынках',10*sh*r.sat.goods],['Одежда',6*sh*r.sat.cloth],['Кофе',4*r.sat.coffee*(served>0?1:0)],
    ['Парки рядом',12*c.cv.park],['Школы',7*c.cv.school*facM('int')],['Больницы',8*c.cv.clinic*facM('int')],['Социальная политика',1.2*M('soc')],['Преступность',S.pop>120?-10*(1-c.cv.police)*(1-.15*M('mvd')):0],['Безработица',-unemp*45],['Подоходный налог',-(T.inc-.1)*150],['Нехватка еды',-r.short.food*40],
    ['Цены на еду',r.short.food>.05?0:-Math.max(0,S.dom.food/RES.food.base-1)*10],['Траты на импорт',-Math.min(15,40*r.impH/Math.max(50,r.wages))],['Перебои с энергией',-(1-c.pr)*25],
    ['Теснота в бараках',c.home?-12*c.huts/c.home:0]];
  const tgt=Math.max(0,Math.min(100,F.reduce((a,f)=>a+f[1],0)));S.happy+=(tgt-S.happy)*.35;r.F=F;r.tgt=tgt;r.unemp=unemp;
  // population and migration
  let room=c.home-S.pop;const open=c.jobs-c.emp;let dp=0;
  if(room>0&&S.happy>=40)dp=Math.min(room,3+open*.6+S.pop*.05)*(.3+.6*(S.happy-40)/60);
  if(S.happy<35)dp-=S.pop*.05*(35-S.happy)/35;
  if(r.short.food>.25)dp-=S.pop*.06*r.short.food;
  if(room<0)dp+=room*.4;
  S.pop=Math.max(0,Math.floor(S.pop+dp+Math.random()));if(dp>0)S.pop=Math.min(S.pop,Math.max(c.home,0));
  r.dp=dp;room=c.home-S.pop;
  for(const n of S.nat){if(n.emb)continue;const diff=S.happy-n.happy,okIn=S.mig==='open'||(S.mig==='allies'&&n.rel>=40);
    let m=0;if(okIn&&diff>5&&room>0){m=Math.floor(Math.min(room,n.pop*.0012*diff/10*(n.cr&&CRISES[n.cr.t].ref?3:1)));room-=m}
    else if(diff<-10&&S.pop>30)m=-Math.floor(S.pop*.004*(-diff/10)+Math.random());
    if(m){S.pop+=m;n.pop-=m;r.mig[n.id]=m}}
  S.pop=Math.max(0,S.pop);
  S.month++;
  const L=s=>S.log.unshift({m:S.month,t:s}),nm=id=>ND(natById(id)).n;
  if(r.expV>0)L(`Экспорт на ${fmt(r.expV)} кр: `+RK.filter(k=>r.exp[k]).map(k=>`${RES[k].n.toLowerCase()} ${r.exp[k]}`).join(', ')+`.`);
  if(r.impV>0)L(`Импорт на ${fmt(r.impV)} кр: `+RK.filter(k=>r.imp[k]).map(k=>`${RES[k].n.toLowerCase()} ${r.imp[k]}`).join(', ')+`.`);
  const migIn=Object.entries(r.mig).filter(e=>e[1]>0),migOut=Object.entries(r.mig).filter(e=>e[1]<0);
  if(migIn.length)L('Приехали: '+migIn.map(([id,m])=>`${m} из ${nm(id)}`).join(', ')+'.');
  if(migOut.length)L('Уехали за границу: '+migOut.map(([id,m])=>`${-m} в ${nm(id)}`).join(', ')+'.');
  if(r.short.food>.15)L('Жителям не хватает еды.');
  if(c.coalPl&&fr<.9)L('ТЭС не хватает угля, энергии меньше.');
  r.ev.forEach(L);
  natTick(r);
  if(S.gov)govTick(r,c);
  S.log.length=Math.min(S.log.length,50);
  r.cen=c;S.rep=r;return r;
}

const GOALS=[
  {t:'Поселите 60 жителей',ok:()=>S.pop>=60,rw:300},
  {t:'Дайте работу 40 жителям',ok:c=>c.emp>=40,rw:400},
  {t:'Постройте порт и продайте груз за границу',ok:(c,r)=>r&&r.expV>0,rw:600},
  {t:'Выпустите товары, ткани или консервы',ok:(c,r)=>r&&(r.prod.goods+r.prod.cloth+r.prod.cans)>0,rw:600},
  {t:'Купите вторую область',ok:()=>S.regions.filter(g=>g.own).length>=2,rw:500},
  {t:'Подпишите торговый договор',ok:()=>S.nat.some(n=>n.deal),rw:800},
  {t:'Население 300',ok:()=>S.pop>=300,rw:1000},
  {t:'Профицит бюджета 400 кр за месяц',ok:(c,r)=>r&&r.net>=400,rw:1000},
  {t:'Население 1000',ok:()=>S.pop>=1000,rw:3000},
];
function checkGoals(c,r){const out=[];while(S.goal<GOALS.length&&GOALS[S.goal].ok(c,r)){const G=GOALS[S.goal];S.money+=G.rw;out.push(G);S.goal++;S.log.unshift({m:S.month,t:`Цель выполнена: ${G.t}. Награда ${fmt(G.rw)} кр.`})}return out}

function whyTerr(tool,t){
  if(t<=SHAL)return'На воде строить нельзя, только мосты';
  const d=B[tool];
  if(tool==='farm')return'Пшенице нужен луг';
  if(d.dep)return`${d.n}: нужны холмы или горы с залежами`;
  if(d.coast)return`${d.n} строится на берегу`;
  if(t===MOUNT)return'В горах можно строить только шахты';
  if(t===FOREST)return'В лесу это не построить, сначала нужен луг';
  return'Здесь это не построить';
}
function canBuild(tool,i){
  const t=S.type[i],rg=regOf(i);
  if(!rg.own)return{ok:0,why:`Область «${rg.n}» не куплена`,buy:1};
  if(tool==='bull'){const b=S.bld[i];if(b&&b.t==='hall')return{ok:0,why:'Ратушу снести нельзя'};
    if(!b&&!S.road[i])return{ok:0,why:'Здесь нечего сносить'};return{ok:S.money>=5,cost:5,why:S.money<5?'Не хватает денег':''}}
  if(S.bld[i])return{ok:0,why:'Клетка занята'};
  if(tool==='road'){if(S.road[i])return{ok:0,why:'Дорога уже есть'};if(t===MOUNT)return{ok:0,why:'Через горы дорогу не проложить'};
    const cost=t===DEEP?120:t===SHAL?40:t===FOREST?15:5;return{ok:S.money>=cost,cost,why:S.money<cost?'Не хватает денег':''}}
  const d=B[tool];if(S.road[i])return{ok:0,why:'Здесь дорога. Снесите её сначала'};
  if(!d.on.includes(t))return{ok:0,why:whyTerr(tool,t)};
  if(d.need&&S.pop<d.need)return{ok:0,why:`Откроется при населении ${d.need}`};
  if(d.dep&&depAt(i)!==d.dep)return{ok:0,why:`Здесь залежи: ${MIN[depAt(i)].n.toLowerCase()}. Нужна область с другими залежами`};
  if(d.warm&&!rg.warm)return{ok:0,why:`${d.n} растёт только в тёплых областях`};
  if(d.water&&!waterNear(i))return{ok:0,why:'Нужна вода не дальше 2 клеток'};
  if(d.coast&&!nb4(i).some(j=>S.type[j]<=SHAL&&!S.road[j]))return{ok:0,why:`${d.n} должен стоять у воды`};
  const cost=d.cost+(t===FOREST?15:0);return{ok:S.money>=cost,cost,why:S.money<cost?'Не хватает денег':''};
}
function place(tool,i){
  const q=canBuild(tool,i);if(!q.ok)return q;S.money-=q.cost;
  if(tool==='bull'){if(S.bld[i])S.bld[i]=null;else S.road[i]=0}
  else if(tool==='road'){S.road[i]=S.type[i]<=SHAL?2:1;if(S.type[i]===FOREST)S.type[i]=GRASS}
  else{S.bld[i]={t:tool};if(S.type[i]===FOREST)S.type[i]=GRASS}
  computeConn();computeCov();return q;
}
function roadPath(a,b){const bx=b%N,by=b/N|0;let x=a%N,y=a/N|0;const p=[y*N+x];
  while(x!==bx){x+=Math.sign(bx-x);p.push(y*N+x)}while(y!==by){y+=Math.sign(by-y);p.push(y*N+x)}return p}
function buyRegion(k){const g=S.regions[k];if(g.own||S.money<g.price)return false;S.money-=g.price;g.own=1;S.log.unshift({m:S.month,t:`Куплена область «${g.n}» за ${fmt(g.price)} кр.`});return true}
function advisor(c){
  const r=S.rep;
  if(S.ev)return'';
  if(S.money<0)return'Казна в минусе. Поднимите налоги, снесите лишнее или возьмите заём: долг растёт на 2% в месяц.';
  if(c.dis>0)return`${c.dis} ${plural(c.dis,'здание','здания','зданий')} без дороги к ратуше. Они не работают.`;
  if(r&&c.coalPl&&r.fuel<.9)return'ТЭС не хватает угля. Нужна угольная шахта или импорт через порт.';
  if(c.pr<1)return'Не хватает энергии. Постройте ветряк или угольную ТЭС.';
  if(r&&r.short.food>.1)return'Еды не хватает. Нужны поля, рыбаки или импорт через порт.';
  const un=c.work?(c.work-c.emp)/c.work:0;
  if(c.jobs>c.work*1.25&&c.jobs-c.work>15)return`Рабочих мест ${c.jobs}, рабочих ${c.work}. Сначала заняты фермы, энергия и службы, затем добыча, заводы простаивают. Нужно больше жилья.`;
  if(un>.15)return`Безработица ${Math.round(un*100)}%. Нужны фермы, шахты и заводы.`;
  if(c.jobs-c.emp>8&&c.home-S.pop<4)return'Есть свободные рабочие места, но негде жить. Стройте жильё.';
  if(r&&c.serve<S.pop*.7&&S.pop>40)return'Жителям не хватает рынков. Рынок обслуживает 120 человек.';
  if(c.unpow)return`${c.unpow} ${plural(c.unpow,'здание','здания','зданий')} вне зоны электричества. Ставьте подстанции или ветряки рядом.`;
  if(c.off)return`${c.off} ${plural(c.off,'служба','службы','служб')} без электричества не работает: рынки, склады и порт должны стоять в зоне энергии.`;
  if(c.poor>2)return`${c.poor} домов заселены не полностью: им нужны электричество и рынок в ореоле.`;
  if(S.pop>120&&c.cv.police<.6)return'Растёт преступность: поставьте полицию рядом с жильём.';
  if(c.log<.95)return`Логистика ${Math.round(c.log*100)}%: поставьте склад рядом с предприятиями.`;
  if(r&&r.short.inputs>.2)return'Заводам не хватает сырья. Добывайте или закупайте через порт.';
  if(r&&r.sat.goods<.7&&c.serve>0)return'На рынках мало товаров. Нужен завод или импорт.';
  if(r&&r.bizPen>0)return'Налог на бизнес выше 15% снижает выработку предприятий.';
  if(r&&r.sal&&r.sal+r.theft>(r.inc+r.biz+r.dImp+r.dExp)*.35)return`Кабинет министров обходится в ${Math.round((r.sal+r.theft)/Math.max(1,r.inc+r.biz+r.dImp+r.dExp)*100)}% доходов казны. Для такого города это дорого.`;
  return'';
}
