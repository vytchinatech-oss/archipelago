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
  for(let dy=-PROD.nearR;dy<=PROD.nearR;dy++)for(let dx=-PROD.nearR;dx<=PROD.nearR;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;const j=Y*N+X;if(S.type[j]===FOREST&&!S.bld[j]&&!S.road[j])c++}
  return Math.min(1,c/PROD.forestFull)}
function waterNear(i){const x=i%N,y=i/N|0;for(let dy=-PROD.nearR;dy<=PROD.nearR;dy++)for(let dx=-PROD.nearR;dx<=PROD.nearR;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;if(S.type[Y*N+X]<=SHAL)return true}return false}
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
const dfac=d=>Math.max(PROD.commuteMin,Math.min(1,1-(d-PROD.commuteFree)*PROD.commuteStep));
const PRI=t=>{const d=B[t];if(t==='hall')return 0;if(d.out&&d.out.food)return 1;if(d.cat==='pow')return 2;if(d.cat==='svc'||d.cat==='com'||d.cat==='mil')return 3;if(d.cat==='ind')return 5;return 4};
const homeF=i=>(PW[i]?1:HOME.noPower)*(COV.shop[i]?1:HOME.noShop);
function census(){
  const c={coalSup:0,off:0,home:0,homeFull:0,poor:0,unpow:0,cv:{shop:0,park:0,school:0,clinic:0,police:0},jobs:0,sup:0,use:0,serve:0,parks:0,ports:0,stores:0,prodN:0,rich:0,huts:0,coalPl:0,cnt:{},dis:0,list:[]};
  for(let i=0;i<N*N;i++){const b=S.bld[i];if(!b)continue;const d=B[b.t];c.cnt[b.t]=(c.cnt[b.t]||0)+1;
    if(!CONN[i]){c.dis++;continue}
    if(d.home){const hf=homeF(i),h=d.home*hf;c.home+=h;c.homeFull+=d.home;if(hf<1)c.poor++;if(d.rich)c.rich+=h;if(b.t==='hut')c.huts+=h;
      for(const k of['shop','park','school','clinic','police'])if(COV[k][i])c.cv[k]+=h}
    if(d.jobs)c.jobs+=d.jobs;if(d.pow<0){if(PW[i])c.use-=d.pow;else c.unpow++}if(d.fuel)c.coalPl++;
    if(d.park)c.parks++;if(d.out)c.prodN++;c.list.push(i)}
  c.home=Math.round(c.home);for(const k in c.cv)c.cv[k]=c.home?Math.min(1,c.cv[k]/c.home):0;
  c.richPop=c.home?Math.min(S.pop,c.home)*c.rich/c.home:0;c.work=Math.floor((S.pop-c.richPop)*POPK.workShare);c.emp=Math.min(c.work,c.jobs);c.staff=c.jobs?c.emp/c.jobs:0;
  const jl=c.list.filter(i=>B[S.bld[i].t].jobs).map(i=>[i,PRI(S.bld[i].t),wdist(i)]).sort((a,b)=>a[1]-b[1]||a[2]-b[2]);
  let left=c.emp;c.st={};for(const[i]of jl){const j=B[S.bld[i].t].jobs,a=Math.min(j,left);left-=a;c.st[i]=a/j}
  for(const i of c.list){const t=S.bld[i].t,d=B[t],s=d.jobs?c.st[i]:1,on=d.pow<0?PW[i]:1;
    if(d.pow>0){const p=t==='hall'?d.pow:d.pow*s*(1+MINK.enPow*M('en'));c.sup+=p;if(d.fuel)c.coalSup+=p}
    if(on){if(d.serve)c.serve+=d.serve*s;if(d.cap)c.ports+=d.cap*s;if(d.stor&&s>=PROD.storeStaff)c.stores++}else if(d.serve||d.cap||d.stor)c.off++}
  const fT=facM('trd');c.serve*=fT;if(c.ports)c.ports=Math.round((c.ports+c.stores*ECO.portPerStore)*fT);
  c.pr=c.use>0?Math.min(1,c.sup/c.use):1;
  c.log=1;c.cap=ECO.storeBase+B.store.stor*c.stores;
  return c;
}
const addNK=(o,id,k,v)=>{const x=o[id]||(o[id]={});x[k]=(x[k]||0)+v};
/* Предприятие — здание, которое продаёт продукцию или услугу: поля, добыча, заводы и рынки. У него свой счёт за месяц.
   Все они пока государственные: итог счёта уходит в казну, убыток казна покрывает. Остальные места с работой — госслужба, зарплаты платит казна. */
const isFirm=t=>!!B[t].out||t==='shop';
/* Строки бюджета за месяц. Отчёт показывает ровно их, их сумма равна r.net (стандарт СТ2). */
function budgetLines(r){return{
  inc:[['Подоходный налог',r.inc],['Прибыль госпредприятий',r.firmPlus,'Сумма итогов всех госпредприятий в плюсе. Подробно — в карточке здания.'],['Импортные пошлины',r.dImp],['Экспортные пошлины',r.dExp],['Продажа госзапасов',r.stockSale,'Со складов страны продано то, что в этом месяце никто не выпускал.'],['Возврат ваших займов',r.loanIn]].filter((x,i)=>i<4||x[1]>0),
  out:[['Зарплаты госслужбы',r.pubW,'Ратуша, электростанции, школы, больницы, полиция, склады, порт и казармы.'],['Убытки госпредприятий',r.firmMinus,'Сумма итогов всех госпредприятий в минусе. Подробно — в карточке здания.'],['Содержание зданий и дорог',r.up],['Уголь для ТЭС',r.fuelCost],['Выплаты по займам',r.loanOut],['Проценты по долгу казны',r.int],['Зарплаты министров',r.sal],['Неучтённые расходы',r.theft,'Кто-то из министров ворует. Кто именно, станет ясно при скандале.'],['Гвардия',r.guard]].filter((x,i)=>i<3||x[1]>0)}}
/* Деньги из казны, которые уходят жителям страны: стройка, земля, подарки знати. Стандарт СТ1: деньги не исчезают. */
function spend(v){S.money-=v;S.hh+=v}
/* Доходы казны от налогов, пошлин и госпредприятий за месяц. */
const taxIncome=r=>r.inc+r.firmPlus+r.dImp+r.dExp;

function tick(){
  const c=census(),T=S.tax,st=S.stock,z=()=>Object.fromEntries(RK.map(k=>[k,0]));
  const r={bs:{},fin:{},impH:0,inc:0,dImp:0,dExp:0,up:0,int:0,loanIn:0,loanOut:0,sal:0,theft:0,guard:0,auto:0,pubW:0,fuelCost:0,firmPlus:0,firmMinus:0,stockSale:0,shop:0,fx:0,hhBuy:0,
    prod:z(),cons:z(),exp:z(),imp:z(),need:z(),expV:0,impV:0,best:{},dest:{},xn:{},mn:{},sat:{},short:{food:0,inputs:0},run:{},ev:[],mig:{}};
  if(!S.nat[0].dl.food)refreshMarkets();
  c.ports=Math.round(c.ports*(1+MINK.trdPort*M('trd')));let cap=c.ports;const port=cap>0;
  /* Покупка за рубежом: pay(v) списывает сумму с покупателя, lim — сколько у него денег. Сосед получает цену, казна — пошлину. */
  const buy=(k,q,pay,lim=Infinity)=>{q=Math.ceil(q);let got=0;if(!port||!S.trade[k].i||q<=0)return 0;
    const ns=S.nat.filter(n=>canTrade(n)&&n.sl[k]>0).sort((a,b)=>natSell(a,k)-natSell(b,k));
    for(const n of ns){if(q<=0||cap<=0)break;const p=natSell(n,k),du=n.deal?0:T.imp,x=Math.min(q,cap,n.sl[k],Math.floor(lim/(p*(1+du))));if(x<=0)break;const v=x*p;
      n.sl[k]-=x;cap-=x;q-=x;got+=x;lim-=v*(1+du);st[k]+=x;r.imp[k]+=x;r.impV+=v;r.dImp+=v*du;n.money+=v;r.fx-=v;pay(v*(1+du));r.dest[n.id]=(r.dest[n.id]||0)+v;addNK(r.mn,n.id,k,v)}
    return got};
  /* Своя продукция по внутренней цене: деньги идут в общую выручку ресурса, её делят те, кто его выпустил. */
  const pool=z(),sell=(k,q,pay)=>{if(q<=0)return;const v=q*S.dom[k];st[k]-=q;pool[k]+=v;pay(v)};
  // зарплаты: одна ставка на страну, со школами выше. Предприятия платят со своего счёта, госслужбу оплачивает казна.
  const W=S.wage*(1+ECO.schoolWage*c.cv.school);r.W=W;let firmW=0;
  for(const i of c.list){const t=S.bld[i].t,d=B[t],w=(d.jobs||0)*(c.st[i]||0);
    if(isFirm(t)){r.fin[i]={rev:0,inp:0,wage:w*W,mgr:0,up:d.up,w};firmW+=w}else r.pubW+=w*W}
  r.mgr=firmW>0?c.richPop*W*WAGE.richMul:0;if(firmW>0)for(const i in r.fin)r.fin[i].mgr=r.mgr*r.fin[i].w/firmW;
  r.wages=r.pubW+r.mgr+Object.values(r.fin).reduce((a,f)=>a+f.wage,0);
  r.inc=Math.min(r.wages,r.wages*T.inc*(1+MINK.fin*M('fin')));S.hh+=r.wages-r.inc;
  // fuel: ТЭС — госслужба, уголь покупает казна
  const fuelNeed=c.coalPl*B.power.fuel.coal*(1-MINK.enCoal*M('en')),coal0=st.coal,toFuel=v=>{r.fuelCost+=v};if(st.coal<fuelNeed)buy('coal',fuelNeed-st.coal,toFuel);
  const fr=c.coalPl?Math.min(1,st.coal/fuelNeed):1,burn=fuelNeed*fr,own=Math.min(coal0,burn);sell('coal',own,toFuel);st.coal-=burn-own;r.cons.coal+=burn;r.need.coal+=fuelNeed;r.fuel=fr;
  c.sup=Math.max(0,c.sup-c.coalSup*(1-fr));c.pr=c.use>0?Math.max(0,Math.min(1,c.sup/c.use)):1;
  // primary production
  const agg={};
  const small=c.prodN<=PROD.smallCity;let lgSum=0;
  for(const i of c.list){const b=S.bld[i],d=B[b.t];if(!d.out)continue;const lg=small||COV.store[i]?1:PROD.noStore;lgSum+=lg;
    const P={staff:c.st[i]||0,power:d.pow<0?(PW[i]?c.pr:PROD.noPower):1,commute:dfac(wdist(i)),log:lg,fac:facM(sphereOf(b.t))};
    const e=P.staff*P.power*P.commute*P.log*P.fac;
    if(d.in){P.minister=1+MINK.ind*M('ind');agg[b.t]=(agg[b.t]||0)+e*P.minister;r.bs[i]={P,e:e*P.minister};continue}
    if(d.fert)P.fert=fert(i);if(b.t==='saw')P.forest=PROD.forestBase+PROD.forestAdd*forestNear(i);if(d.dep&&S.type[i]===MOUNT)P.mount=PROD.mount;if(b.t==='cotton'&&regOf(i).warm)P.warm=PROD.warm;
    if(d.out.food||d.out.coffee||d.out.cotton)P.minister=1+MINK.agr*M('agr');else P.minister=1+MINK.ind*M('ind');
    let m=e*(P.fert||1)*(P.forest||1)*(P.mount||1)*(P.warm||1)*P.minister;const out={};
    for(const k in d.out){out[k]=d.out[k]*m;r.prod[k]+=out[k]}r.bs[i]={P,out}}
  c.log=c.prodN?lgSum/c.prodN:1;
  for(const k of RK)st[k]+=r.prod[k];
  const served=Math.min(S.pop*c.cv.shop,c.serve),richPop=c.richPop;
  const nF=S.pop*NEED.food;
  // industry
  for(const t of['factory','textile','cannery']){const a=agg[t];if(!a)continue;const d=B[t],own0={};let cost=0;const toInp=v=>{cost+=v};
    for(const k in d.in){const need=d.in[k]*a;r.need[k]+=need;own0[k]=st[k];if(k!=='food'&&st[k]<need)buy(k,need-st[k],toInp)}
    let run=1,lim=null;for(const k in d.in){const av=st[k]-(k==='food'?nF*NEED.canReserve:0),q=Math.max(0,av)/(d.in[k]*a);if(q<run){run=q;lim=k}}r.lim=r.lim||{};r.lim[t]=run<PROD.limRun?lim:null;run=Math.max(0,Math.min(1,run));
    for(const k in d.in){const u=d.in[k]*a*run,own=Math.min(own0[k],u);sell(k,own,toInp);st[k]-=u-own;r.cons[k]+=u}for(const k in d.out){const o=d.out[k]*a*run;st[k]+=o;r.prod[k]+=o}
    r.run[t]=run;
    for(const i in r.bs){const x=r.bs[i];if(x.e===undefined||S.bld[i].t!==t)continue;x.run=run;x.out={};x.inp={};x.need={};r.fin[i].inp+=cost*x.e/a;
      for(const k in d.out)x.out[k]=d.out[k]*x.e*run;for(const k in d.in){x.inp[k]=d.in[k]*x.e*run;x.need[k]=d.in[k]*x.e}}
    if(t!=='cannery'&&run<PROD.shortRun)r.short.inputs=Math.max(r.short.inputs,1-run)}
  // consumers: жители платят из своего кошелька, сначала еда. Рынок берёт наценку на товары, ткани и кофе.
  const need={food:nF,goods:served*NEED.goods,cloth:served*NEED.cloth,coffee:served*NEED.coffee+richPop*c.cv.shop*NEED.coffeeRich};
  for(const k in need){const q=need[k],m=SHOPK.goods.includes(k)?SHOPK.margin:0,toHH=v=>{S.hh-=v*(1+m);r.shop+=v*m;r.hhBuy+=v*(1+m)};r.need[k]+=q;
    const dq=Math.max(0,Math.min(q,st[k],S.hh/(S.dom[k]*(1+m))));sell(k,dq,toHH);
    let iq=0;if(q-dq>0&&S.hh>0){const h0=S.hh;iq=Math.min(q-dq,buy(k,q-dq,toHH,S.hh/(1+m)));st[k]-=iq;r.impH+=h0-S.hh}
    r.cons[k]+=dq+iq;r.sat[k]=q>0?(dq+iq)/q:1}
  r.short.food=1-r.sat.food;
  // exports: best price first
  const xf=Math.max(0,1-T.exp*TAXK.expCut),reserve=k=>r.need[k]*TRADEK.reserveMonths;
  const order=RK.slice().sort((a,b)=>RES[b].base-RES[a].base);
  for(const k of order){
    const ns=S.nat.filter(canTrade).sort((a,b)=>natBuy(b,k)*(1-natTariff(b))-natBuy(a,k)*(1-natTariff(a)));
    if(ns.length)r.best[k]={nid:ns[0].id,p:natBuy(ns[0],k)*(1-natTariff(ns[0]))};
    if(!port||!S.trade[k].e)continue;
    let sur=st[k]-reserve(k);
    for(const n of ns){if(sur<1||cap<1)break;const p=natBuy(n,k)*(1+MINK.trdPrice*M('trd')),q=Math.floor(Math.min(sur,cap,n.dl[k],Math.max(0,n.money+TRADEK.debtFloor)/p)*xf);if(q<1)continue;
      const v=q*p*(1-natTariff(n));n.dl[k]-=q;cap-=q;sur-=q;st[k]-=q;r.exp[k]+=q;r.expV+=v;r.dExp+=v*T.exp;pool[k]+=v*(1-T.exp);
      n.money-=v;r.fx+=v;n.rel=Math.min(100,n.rel+q*TRADEK.relPerUnit);r.dest[n.id]=(r.dest[n.id]||0)+v;addNK(r.xn,n.id,k,v)}}
  for(const k of RK){st[k]=Math.max(0,st[k]);if(st[k]>c.cap){st[k]=c.cap;if(!(S.month%6))r.ev.push(`Склады переполнены: ${RES[k].n.toLowerCase()} портится. Стройте склады или продавайте через порт.`)}}
  r.portUse=c.ports?1-cap/c.ports:0;
  // domestic prices
  for(const k of RK){const sup=Math.max(0,r.prod[k]+r.imp[k]+st[k]*PRICEK.stockShare),dem=Math.max(0,r.need[k]);
    const target=dem<PRICEK.noDemand?RES[k].base*PRICEK.noDemandPrice:RES[k].base*Math.max(PRICEK.min,Math.min(PRICEK.max,Math.pow((dem+PRICEK.pad)/(sup+PRICEK.pad),PRICEK.pow)));S.dom[k]+=(target-S.dom[k])*PRICEK.speed}
  // выручка ресурса делится между теми, кто выпустил его в этом месяце. Если никто не выпускал — продан госзапас, деньги в казну.
  const outBy=z();for(const i in r.bs){const o=r.bs[i].out;if(o)for(const k in o)outBy[k]+=o[k]}
  for(const k of RK){if(pool[k]<=0)continue;if(outBy[k]>0){for(const i in r.bs){const o=r.bs[i].out;if(o&&o[k]>0)r.fin[i].rev+=pool[k]*o[k]/outBy[k]}}else r.stockSale+=pool[k]}
  // наценка рынков делится по тому, скольких покупателей обслужил каждый рынок
  const shops=Object.keys(r.fin).filter(i=>S.bld[i].t==='shop'&&PW[i]),sw=shops.reduce((a,i)=>a+(c.st[i]||0),0);
  if(sw>0)for(const i of shops)r.fin[i].rev+=r.shop*(c.st[i]||0)/sw;else r.stockSale+=r.shop;
  // содержание: предприятия платят сами, остальное казна. Деньги получают жители — те, кто чинит и обслуживает
  let upF=0;for(let i=0;i<N*N;i++){const b=S.bld[i];if(b&&!r.fin[i])r.up+=B[b.t].up;if(S.road[i])r.up+=S.road[i]===2?ROADK.upBridge:ROADK.upRoad}
  // итог счёта предприятия уходит в казну, убыток казна покрывает
  for(const i in r.fin){const f=r.fin[i];upF+=f.up;f.net=f.rev-f.inp-f.wage-f.mgr-f.up;if(f.net>=0)r.firmPlus+=f.net;else r.firmMinus-=f.net}
  r.int=S.money<0?-S.money*ECO.interest:0;S.hh+=r.up+upF+r.int;
  for(const L of S.loans){const p=Math.min(L.left,L.pay);L.left-=p;r.loanOut+=p;r.fx-=p;natById(L.nid).money+=p}S.loans=S.loans.filter(L=>L.left>ECO.loanDust);
  for(const L of S.lent){const n=natById(L.nid);if(n.money<0&&Math.random()<ECO.lateChance){r.ev.push(`${ND(n).n} задерживает выплату по вашему займу.`);continue}const p=Math.min(L.left,L.pay);L.left-=p;n.money-=p;r.loanIn+=p;r.fx+=p}
  S.lent=S.lent.filter(L=>L.left>ECO.loanDust);
  r.net=r.inc+r.firmPlus+r.dImp+r.dExp+r.stockSale+r.loanIn-r.pubW-r.firmMinus-r.up-r.fuelCost-r.loanOut-r.int;S.money+=r.net;
  // ставка зарплаты на следующий месяц: доля стоимости, которую создал рабочий предприятия, с поправкой на нехватку рабочих
  let va=0,vw=0;for(const i in r.fin){if(!B[S.bld[i].t].out)continue;va+=r.fin[i].rev-r.fin[i].inp;vw+=r.fin[i].w}
  if(vw>0){const tight=c.work>0?c.jobs/c.work:1,f=Math.max(WAGE.tightMin,Math.min(WAGE.tightMax,1+WAGE.tight*(tight-1)));
    r.vaW=va/vw;r.wageTgt=Math.max(WAGE.min,Math.min(WAGE.max,WAGE.share*r.vaW*f/(1+ECO.schoolWage*c.cv.school)));S.wage+=(r.wageTgt-S.wage)*WAGE.speed}
  // mood
  const unemp=c.work>0?(c.work-c.emp)/c.work:0;
  const sh=S.pop>0?served/S.pop:0;
  const F=[['Базовое настроение',MOODK.base],['Товары на рынках',MOODK.goods*sh*r.sat.goods],['Одежда',MOODK.cloth*sh*r.sat.cloth],['Кофе',MOODK.coffee*r.sat.coffee*(served>0?1:0)],
    ['Парки рядом',MOODK.park*c.cv.park],['Школы',MOODK.school*c.cv.school*facM('int')],['Больницы',MOODK.clinic*c.cv.clinic*facM('int')],['Социальная политика',MINK.soc*M('soc')],['Преступность',S.pop>B.police.need?-MOODK.crime*(1-c.cv.police)*(1-MINK.mvdCrime*M('mvd')):0],['Безработица',-unemp*MOODK.unemp],['Подоходный налог',-(T.inc-TAXK.incFree)*MOODK.incTax],['Нехватка еды',-r.short.food*MOODK.hunger],
    ['Цены на еду',r.short.food>MOODK.foodShort?0:-Math.max(0,S.dom.food/RES.food.base-1)*MOODK.foodPrice],['Траты на импорт',-Math.min(MOODK.importMax,MOODK.importK*r.impH/Math.max(MOODK.importMinWage,r.wages))],['Перебои с энергией',-(1-c.pr)*MOODK.blackout],
    ['Теснота в бараках',c.home?-MOODK.huts*c.huts/c.home:0]];
  const tgt=Math.max(0,Math.min(100,F.reduce((a,f)=>a+f[1],0)));S.happy+=(tgt-S.happy)*MOODK.speed;r.F=F;r.tgt=tgt;r.unemp=unemp;
  // population and migration
  let room=c.home-S.pop;const open=c.jobs-c.emp;let dp=0;
  if(room>0&&S.happy>=POPK.growFrom)dp=Math.min(room,POPK.growBase+open*POPK.growJobs+S.pop*POPK.growPop)*(POPK.growMin+POPK.growRange*(S.happy-POPK.growFrom)/POPK.growSpan);
  if(S.happy<POPK.leaveBelow)dp-=S.pop*POPK.leaveShare*(POPK.leaveBelow-S.happy)/POPK.leaveBelow;
  if(r.short.food>POPK.famine)dp-=S.pop*POPK.famineShare*r.short.food;
  if(room<0)dp+=room*POPK.overcrowd;
  S.pop=Math.max(0,Math.floor(S.pop+dp+Math.random()));if(dp>0)S.pop=Math.min(S.pop,Math.max(c.home,0));
  r.dp=dp;room=c.home-S.pop;
  for(const n of S.nat){if(n.emb)continue;const diff=S.happy-n.happy,okIn=S.mig==='open'||(S.mig==='allies'&&n.rel>=RELK.friend);
    let m=0;if(okIn&&diff>MIGK.inDiff&&room>0){m=Math.floor(Math.min(room,n.pop*MIGK.inRate*diff/MIGK.per*(n.cr&&CRISES[n.cr.t].ref?MIGK.crisisMul:1)));room-=m}
    else if(diff<-MIGK.outDiff&&S.pop>MIGK.outMinPop)m=-Math.floor(S.pop*MIGK.outRate*(-diff/MIGK.per)+Math.random());
    if(m){S.pop+=m;n.pop-=m;r.mig[n.id]=m}}
  S.pop=Math.max(0,S.pop);
  S.month++;
  const L=s=>S.log.unshift({m:S.month,t:s}),nm=id=>ND(natById(id)).n;
  if(r.expV>0)L(`Экспорт на ${fmt(r.expV)} кр: `+RK.filter(k=>r.exp[k]).map(k=>`${RES[k].n.toLowerCase()} ${r.exp[k]}`).join(', ')+`.`);
  if(r.impV>0)L(`Импорт на ${fmt(r.impV)} кр: `+RK.filter(k=>r.imp[k]).map(k=>`${RES[k].n.toLowerCase()} ${r.imp[k]}`).join(', ')+`.`);
  const migIn=Object.entries(r.mig).filter(e=>e[1]>0),migOut=Object.entries(r.mig).filter(e=>e[1]<0);
  if(migIn.length)L('Приехали: '+migIn.map(([id,m])=>`${m} из ${nm(id)}`).join(', ')+'.');
  if(migOut.length)L('Уехали за границу: '+migOut.map(([id,m])=>`${-m} в ${nm(id)}`).join(', ')+'.');
  if(r.short.food>ADV.foodLog)L('Жителям не хватает еды.');
  if(c.coalPl&&fr<ADV.fuel)L('ТЭС не хватает угля, энергии меньше.');
  r.ev.forEach(L);
  natTick(r);
  if(S.gov)govTick(r,c);
  S.log.length=Math.min(S.log.length,50);
  r.cen=c;S.rep=r;return r;
}

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
    if(!b&&!S.road[i])return{ok:0,why:'Здесь нечего сносить'};return{ok:S.money>=ROADK.demolish,cost:ROADK.demolish,why:S.money<ROADK.demolish?'Не хватает денег':''}}
  if(S.bld[i])return{ok:0,why:'Клетка занята'};
  if(tool==='road'){if(S.road[i])return{ok:0,why:'Дорога уже есть'};if(t===MOUNT)return{ok:0,why:'Через горы дорогу не проложить'};
    const cost=t===DEEP?ROADK.deep:t===SHAL?ROADK.shal:t===FOREST?ROADK.forest:ROADK.land;return{ok:S.money>=cost,cost,why:S.money<cost?'Не хватает денег':''}}
  const d=B[tool];if(S.road[i])return{ok:0,why:'Здесь дорога. Снесите её сначала'};
  if(!d.on.includes(t))return{ok:0,why:whyTerr(tool,t)};
  if(d.need&&S.pop<d.need)return{ok:0,why:`Откроется при населении ${d.need}`};
  if(d.dep&&depAt(i)!==d.dep)return{ok:0,why:`Здесь залежи: ${MIN[depAt(i)].n.toLowerCase()}. Нужна область с другими залежами`};
  if(d.warm&&!rg.warm)return{ok:0,why:`${d.n} растёт только в тёплых областях`};
  if(d.water&&!waterNear(i))return{ok:0,why:'Нужна вода не дальше 2 клеток'};
  if(d.coast&&!nb4(i).some(j=>S.type[j]<=SHAL&&!S.road[j]))return{ok:0,why:`${d.n} должен стоять у воды`};
  const cost=d.cost+(t===FOREST?ROADK.forestClear:0);return{ok:S.money>=cost,cost,why:S.money<cost?'Не хватает денег':''};
}
function place(tool,i){
  const q=canBuild(tool,i);if(!q.ok)return q;spend(q.cost);
  if(tool==='bull'){if(S.bld[i])S.bld[i]=null;else S.road[i]=0}
  else if(tool==='road'){S.road[i]=S.type[i]<=SHAL?2:1;if(S.type[i]===FOREST)S.type[i]=GRASS}
  else{S.bld[i]={t:tool};if(S.type[i]===FOREST)S.type[i]=GRASS}
  computeConn();computeCov();return q;
}
function roadPath(a,b){const bx=b%N,by=b/N|0;let x=a%N,y=a/N|0;const p=[y*N+x];
  while(x!==bx){x+=Math.sign(bx-x);p.push(y*N+x)}while(y!==by){y+=Math.sign(by-y);p.push(y*N+x)}return p}
function buyRegion(k){const g=S.regions[k];if(g.own||S.money<g.price)return false;spend(g.price);g.own=1;S.log.unshift({m:S.month,t:`Куплена область «${g.n}» за ${fmt(g.price)} кр.`});return true}
function advisor(c){
  const r=S.rep;
  if(S.ev)return'';
  if(S.money<0)return'Казна в минусе. Поднимите налоги, снесите лишнее или возьмите заём: долг растёт на '+PCT(ECO.interest)+'% в месяц.';
  if(c.dis>0)return`${c.dis} ${plural(c.dis,'здание','здания','зданий')} без дороги к ратуше. Они не работают.`;
  if(r&&c.coalPl&&r.fuel<ADV.fuel)return'ТЭС не хватает угля. Нужна угольная шахта или импорт через порт.';
  if(c.pr<1)return'Не хватает энергии. Постройте ветряк или угольную ТЭС.';
  if(r&&r.short.food>ADV.food)return'Еды не хватает. Нужны поля, рыбаки или импорт через порт.';
  const un=c.work?(c.work-c.emp)/c.work:0;
  if(c.jobs>c.work*ADV.jobsOver&&c.jobs-c.work>ADV.jobsGap)return`Рабочих мест ${c.jobs}, рабочих ${c.work}. Сначала заняты фермы, энергия и службы, затем добыча, заводы простаивают. Нужно больше жилья.`;
  if(un>ADV.unemp)return`Безработица ${Math.round(un*100)}%. Нужны фермы, шахты и заводы.`;
  if(c.jobs-c.emp>ADV.jobsFree&&c.home-S.pop<ADV.roomLow)return'Есть свободные рабочие места, но негде жить. Стройте жильё.';
  if(r&&c.serve<S.pop*ADV.serve&&S.pop>ADV.servePop)return`Жителям не хватает рынков. Рынок обслуживает ${B.shop.serve} человек.`;
  if(c.unpow)return`${c.unpow} ${plural(c.unpow,'здание','здания','зданий')} вне зоны электричества. Ставьте подстанции или ветряки рядом.`;
  if(c.off)return`${c.off} ${plural(c.off,'служба','службы','служб')} без электричества не работает: рынки, склады и порт должны стоять в зоне энергии.`;
  if(c.poor>ADV.poor)return`${c.poor} домов заселены не полностью: им нужны электричество и рынок в ореоле.`;
  if(S.pop>B.police.need&&c.cv.police<ADV.police)return'Растёт преступность: поставьте полицию рядом с жильём.';
  if(c.log<ADV.log)return`Логистика ${Math.round(c.log*100)}%: поставьте склад рядом с предприятиями.`;
  if(r&&r.short.inputs>ADV.inputs)return'Заводам не хватает сырья. Добывайте или закупайте через порт.';
  if(r&&r.sat.goods<ADV.goods&&c.serve>0)return'На рынках мало товаров. Нужен завод или импорт.';
  if(r&&r.firmMinus>r.firmPlus&&r.firmMinus>ADV.firmLoss){const n=Object.values(r.fin).filter(f=>f.net<0).length;return`Госпредприятия в убытке: ${n} ${plural(n,'предприятие','предприятия','предприятий')} теряют ${fmt(r.firmMinus)} кр в месяц. Осмотрите их: нет сбыта, сырья или рабочих.`}
  if(r&&r.sal&&r.sal+r.theft>taxIncome(r)*ADV.cabinet)return`Кабинет министров обходится в ${Math.round((r.sal+r.theft)/Math.max(1,taxIncome(r))*100)}% доходов казны. Для такого города это дорого.`;
  return'';
}
