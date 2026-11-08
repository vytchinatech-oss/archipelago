// Песочница для проверки кошельков и зон (docs/DESIGN.md). Цифры зданий и цен берутся из данных игры, сама игра не меняется.
import fs from 'fs';import vm from 'vm';
const root=new URL("../src/",import.meta.url).pathname;let code='';
for(const f of ['core/constants.js','data/rules.js','data/resources.js','data/buildings.js'])code+=fs.readFileSync(root+f,'utf8')+'\n';
code+=';globalThis.__=({B,RES,RK});';const c={};vm.createContext(c);vm.runInContext(code,c);const {B,RES,RK}=c.__;
const PRI={hall:0,farm:1,veg:1,ranch:1,fish:1,power:2,wind:2,shop:3,store:3,port:3,school:3,clinic:3,police:3,barracks:3,saw:4,coalmine:4,ironmine:4,goldmine:4,coffee:4,cotton:4,factory:5,textile:5,cannery:5};
const PUBLIC=new Set(['hall','power','wind','store','port','school','clinic','police','barracks']);
const FOOD=new Set(['farm','veg','ranch','fish']);
const NEED={food:.12,goods:.05,cloth:.03,coffee:.004},EL={food:.2,goods:1,cloth:1,coffee:1.2};
const FDEM={food:100,cans:60,coffee:70,cloth:45,goods:45,iron:35,coal:25,cotton:30,gold:20},FSUP={food:140,cotton:70,coffee:25,wood:70,coal:130,iron:110,goods:100,cloth:40,cans:15};
export const CITY={
 town:{pop:300,c:{hall:1,farm:3,fish:1,shop:3,wind:2,store:1,port:1,school:1,saw:1,cotton:2,coffee:2,coalmine:1,textile:1}},
 city:{pop:800,c:{hall:1,farm:6,veg:2,fish:1,shop:7,wind:4,power:1,store:3,port:1,school:2,clinic:2,police:2,barracks:1,saw:3,coalmine:3,ironmine:3,coffee:2,cotton:3,factory:3,textile:1,cannery:1}}};
export function sim(cfg){
  const {own,wage:wr,k=1,chain={},w0=15,city,tInc=.1,tBiz=.12,tImp=.1,months=360,elastic=true,priceRule=true,q={},M=[1],jobs={},prices=null,kc=1,share=.65,margin=.1}=cfg;
 const base=Object.fromEntries(RK.map(x=>[x,prices?prices[x]:RES[x].base*k*(chain[x]||1)]));
 // Ступень квалификации места: надбавка к базе. Управление (ратуша) — высшее +20%.
 const mq=t=>(M[q[t]||0]||1)*(t==='hall'?1.2:1);
 const stateOwned=t=>own==='state'||(own==='mixed'&&(FOOD.has(t)||t==='coalmine'));
 const firms=[];for(const[t,n]of Object.entries(CITY[city].c))for(let i=0;i<n;i++){const d={...B[t],jobs:jobs[t]??B[t].jobs};
   firms.push({t,d,pub:PUBLIC.has(t),state:stateOwned(t),cash:d.jobs*w0*mq(t)*3,inv:{},staff:0,closed:0,bad:0,rev:0,inp:0,w:w0*mq(t),paid:0,pr:0})}
 let pop=cfg.pop0||CITY[city].pop;const Pool={cash:0};const H={cash:pop*w0*.6},R={cash:0},G={cash:20000},F={cash:0};
 const startMoney=()=>Pool.cash+H.cash+R.cash+G.cash+F.cash+firms.reduce((s,f)=>s+f.cash,0);const M0=startMoney();
 const price={...base},stock=()=>{};let Wn=w0;
 const port=Math.min(1,CITY[city].c.port||0)*60+25*(CITY[city].c.store||0);
 const hist=[];const tl={};const snaps={};let built=0,firstPriv=null;
 for(let m=0;m<months;m++){
  const hStart=H.cash;
  // найм
  let left=Math.floor(pop*.62);const ord=firms.filter(f=>f.d.jobs).sort((a,b)=>PRI[a.t]-PRI[b.t]);
  for(const f of ord){if(f.closed>0){f.staff=0;continue}const a=Math.min(f.d.jobs,left);left-=a;f.staff=a/f.d.jobs;f.rev=0;f.inp=0}
  const work=Math.floor(pop*.62),emp=work-left;
  // выпуск сырья
  const prod=Object.fromEntries(RK.map(x=>[x,0])),need=Object.fromEntries(RK.map(x=>[x,0])),sold=Object.fromEntries(RK.map(x=>[x,0]));let imp=Object.fromEntries(RK.map(x=>[x,0]));
  for(const f of firms){if(!f.d.out||f.d.in||f.staff===0)continue;for(const x in f.d.out){const q=f.d.out[x]*f.staff*.8;f.inv[x]=(f.inv[x]||0)+q;prod[x]+=q}}
  let cap=(cfg.shock&&m>=180&&m<204)?0:port;
  const avail=x=>firms.reduce((s,f)=>s+(f.inv[x]||0),0);
  const impP=x=>base[x]*.85;
  const buy=(wallet,x,q,margin=0)=>{if(q<=0)return 0;need[x]+=q;
    let av=avail(x),got=0,spent=0;const p=price[x];
    const dom=Math.min(av,q,wallet.cash>0?wallet.cash/p:0);
    if(dom>0&&av>0){const cost=dom*p;for(const f of firms){const h=f.inv[x]||0;if(!h)continue;const s=dom*h/av;f.inv[x]=h-s;const pay=s*p*(1-margin);f.cash+=pay;f.rev+=pay}
      if(margin){const shops=firms.filter(f=>f.t==='shop'&&f.staff>0);const m0=cost*margin;if(shops.length)for(const f of shops){f.cash+=m0/shops.length;f.rev+=m0/shops.length}else firms[0].cash+=m0}
      wallet.cash-=cost;got+=dom;spent+=cost}
    let rest=q-got;
    if(rest>.01&&FSUP[x]&&cap>0){const ip=impP(x),landed=ip*(1+tImp);if(!priceRule||landed<price[x]*1.5){const qi=Math.min(rest,cap,FSUP[x]-imp[x],wallet.cash>0?wallet.cash/landed:0);if(qi>0){wallet.cash-=qi*landed;F.cash+=qi*ip;G.cash+=qi*ip*tImp;cap-=qi;imp[x]+=qi;got+=qi}}}
    sold[x]+=got;return got};
  // уголь на ТЭС
  for(const f of firms)if(f.t==='power'&&f.staff){const w={cash:Math.max(G.cash,1e9)},b=w.cash;const g=buy(w,'coal',4);G.cash-=(b-w.cash)}
  // заводы
  for(const f of firms){if(!f.d.in||f.staff===0)continue;const eff=f.staff*.8;let run=1;
    const can={};for(const x in f.d.in){const q=f.d.in[x]*eff;const free=x==='food'?Math.max(0,avail('food')-pop*.12*1.5):1e9;if(free<q)run=Math.min(run,free/q)}
    let minr=run;for(const x in f.d.in){const q=f.d.in[x]*eff*run;const c0=f.cash;const g=buy(f,x,q);f.inp+=c0-f.cash;minr=Math.min(minr,q?g/(f.d.in[x]*eff):run)}
    for(const x in f.d.out){const q=f.d.out[x]*eff*minr;f.inv[x]=(f.inv[x]||0)+q;prod[x]+=q}}
  // жители
  const wealth=Math.max(.6,Math.min(1.8,Math.sqrt(H.cash/(pop*2.2*k*3+1))));
  const h0=H.cash;let sat={};for(const x in NEED){const p=price[x]/base[x];const el=elastic?Math.pow(p,-EL[x]):1;const lux=x==='food'?1:wealth;const q=pop*NEED[x]*el*lux;const g=buy(H,x,q,margin);sat[x]=g/(pop*NEED[x])}
  const spentH=h0-H.cash;
  // экспорт излишка
  for(const x of RK){if(!FDEM[x])continue;const ex=base[x]*1.3*.85;if(priceRule&&ex<=price[x])continue;let av=avail(x);const res=need[x]*2;const q=Math.min(Math.max(0,av-res),cap,FDEM[x]);if(q>1){const val=q*ex;F.cash-=val;for(const f of firms){const h=f.inv[x]||0;if(!h)continue;const s=q*h/av;f.inv[x]=h-s;f.cash+=s*ex*.95;f.rev+=s*ex*.95}G.cash+=val*.05;cap-=q;sold[x]+=q}}
  // порча: лимит 300+300 за склад
  const lim=300+300*(CITY[city].c.store||0);for(const x of RK){const a=avail(x);if(a>lim)for(const f of firms)if(f.inv[x])f.inv[x]*=lim/a}
  // зарплаты
  let wages=0,pvw=0;const va=firms.filter(f=>f.d.out&&f.staff>0);
  const natVA=va.reduce((s,f)=>s+f.rev-f.inp,0)/Math.max(1,va.reduce((s,f)=>s+f.staff*f.d.jobs*mq(f.t),0));
  if(wr==='market'){const tight=emp/Math.max(1,work);const target=Math.max(3,share*natVA*(1+(tight-.95)));Wn+=(target-Wn)*.1}
  for(const f of firms){if(!f.d.jobs||f.staff===0)continue;let w;
    if(wr==='fix')w=w0*mq(f.t);else if(wr==='market')w=Wn*mq(f.t);else if(f.pub||f.t==='shop')w=Wn;else{const t=Math.max(3,.65*(f.rev-f.inp)/(f.staff*f.d.jobs));f.w+=(t-f.w)*.2;w=f.w}
    const bill=f.staff*f.d.jobs*w;let pay=bill;
    if(f.pub){G.cash-=bill}else if(f.state){f.cash-=bill}else{pay=Math.min(bill,Math.max(0,f.cash));f.cash-=pay;f.bad=pay<bill*.999?f.bad+1:Math.max(0,f.bad-1)}
    H.cash+=pay*(1-tInc);G.cash+=pay*tInc;wages+=pay;f.paid=pay;if(!f.pub&&f.t!=='shop')pvw+=pay}
  if(wr==='share'){const s=firms.filter(f=>f.d.out&&f.staff>0);if(s.length){const a=s.reduce((q,f)=>q+f.paid,0)/Math.max(1,s.reduce((q,f)=>q+f.staff*f.d.jobs,0));Wn+=(a-Wn)*.2}}
  // содержание → подрядчикам (жителям)
  for(const f of firms){if(f.closed>0)continue;if(f.pub)G.cash-=f.d.up;else f.cash-=f.d.up;H.cash+=f.d.up}
  G.cash-=pop*.2;H.cash+=pop*.2;// дороги
  // прибыль
  for(const f of firms){if(f.pub||f.closed>0||!f.d.jobs)continue;const pr=f.rev-f.inp-f.paid-f.d.up;f.pr+=(pr-f.pr)*.1;
    if(f.state){G.cash+=f.cash;f.cash=0;continue}
    if(pr>0){const t=pr*tBiz;f.cash-=t;G.cash+=t}
    const keep=6*(f.staff*f.d.jobs*(f.w||w0)+f.d.up);if(f.cash>keep){const x=f.cash-keep;f.cash=keep;R.cash+=x*(1-tInc);G.cash+=x*tInc}
    if(f.bad>=3){f.closed=12;f.bad=0;for(const x in f.inv)f.inv[x]*=.5}}
  const sp=R.cash*.3;R.cash-=sp;H.cash+=sp;
  for(const f of firms){if(f.closed>0){f.closed--;if(f.closed===0){const need=f.d.jobs*(wr==='fix'?w0:Wn)*mq(f.t)*3;const src=Pool.cash>=need?Pool:(R.cash>=need?R:(!cfg.zones&&G.cash>need?G:null));if(src){src.cash-=need;f.cash+=need;f.w=(wr==='fix'?w0:Wn)*mq(f.t)}else f.closed=6}}}
  // цены
  for(const x of RK){const sup=Math.max(0,prod[x]+imp[x]+avail(x)*.2),dem=need[x];const tgt=dem<.5?base[x]*.7:base[x]*Math.max(.5,Math.min(2,Math.pow((dem+2)/(sup+2),.6)));price[x]+=(tgt-price[x])*.4}

  if(cfg.zones){
   const inv=Math.min(Math.max(0,H.cash),wages*(1-tInc)*(cfg.save||0));H.cash-=inv;H._inv=inv;Pool.cash+=inv;
   const w=wr==='fix'?w0:Wn;
   const roi=t=>{const d={...B[t],jobs:jobs[t]??B[t].jobs};let rv=0,ci=0;for(const x in d.out){const ex2=FDEM[x]?base[x]*1.3*.85:0;rv+=d.out[x]*.8*Math.max(price[x],ex2)}for(const x in d.in||{})ci+=d.in[x]*.8*price[x];
     if(t==='shop')rv=d.jobs*w*mq(t)*1.2;return (rv-ci-d.jobs*w*mq(t)-d.up)/(d.cost*kc)};
   const vac0=firms.filter(f=>f.d.jobs&&f.closed<=0).reduce((q,f)=>q+f.d.jobs*(1-f.staff),0);const free=left+Math.max(0,25-vac0);const used=firms.filter(f=>!f.state&&!f.pub).length;
   const okP=t=>!cfg.brake||Object.keys(B[t].out||{}).every(x=>price[x]>=base[x]*(cfg.brake));const cand=(cfg.allow||[]).filter(okP).filter(t=>(jobs[t]??B[t].jobs)*.3<=free).map(t=>[t,roi(t)]).filter(a=>a[1]>=(cfg.minRoi||.01)).sort((a,b)=>b[1]-a[1]);
   if(cand.length&&used<(cfg.zoneCap||60)){const t=cand[0][0],d={...B[t],jobs:jobs[t]??B[t].jobs},need=d.cost*kc+d.jobs*w*mq(t)*2;if(Pool.cash>=need){Pool.cash-=need;H.cash+=d.cost*kc*.5;F.cash+=d.cost*kc*.5;firms.push({t,d,pub:false,state:false,cash:d.jobs*w*mq(t)*2,inv:{},staff:0,closed:0,bad:0,rev:0,inp:0,w:w*mq(t),paid:0,pr:0});built++;if(firstPriv===null)firstPriv=m}}
   const vac=firms.filter(f=>f.d.jobs&&f.closed<=0).reduce((q,f)=>q+f.d.jobs*(1-f.staff),0);
   if(vac>0&&(sat.food||0)>.9)pop=Math.min(cfg.popCap||4000,pop*1.012);else if(left/Math.max(1,work)>.15)pop*=.997;
   const y=m/12;if([1,2,3,5,10,15,20,30].includes(y)||m===months-1){const pv=firms.filter(f=>!f.state&&!f.pub);snaps[Math.round((m+1)/12)]={жит:Math.round(pop),част:pv.filter(f=>f.closed<=0).length,закр:pv.filter(f=>f.closed>0).length,гос:firms.filter(f=>f.state&&!f.pub).length,безраб:Math.round(left/Math.max(1,work)*100),ст:+Wn.toFixed(1),казна:Math.round(G.cash),копилка:Math.round(H.cash+Pool.cash)}}
  }
  const biz=firms.filter(f=>!f.pub&&f.d.jobs);
  if(m>=months-60)for(const f of biz){const a=tl[f.t]||(tl[f.t]={n:0,cl:0,pr:0});a.n++;if(f.closed>0)a.cl++;a.pr+=f.pr}
  if(cfg.shock&&m===203)cfg._sh={un:left/work,G:G.cash,closed:biz.filter(f=>f.closed>0).length/biz.length};
  hist.push({Wn,sp:spentH,inc:spentH+H.cash-hStart+(H._inv||0),un:left/work,closed:biz.filter(f=>f.closed>0).length/biz.length,loss:biz.filter(f=>f.pr<-.5).length/biz.length,food:sat.food,goods:sat.goods,G:G.cash,H:H.cash,w:wages/Math.max(1,emp)});
 }
 const L=hist.slice(-60),av=k=>L.reduce((s,h)=>s+h[k],0)/L.length;
 const a=hist[hist.length-61]||hist[0],z=hist[hist.length-1];
 return {закрыто:Math.round(av('closed')*100),убыток:Math.round(av('loss')*100),безраб:Math.round(av('un')*100),сытость:Math.round(Math.min(1,av('food'))*100),товары:Math.round(av('goods')*100),казна_в_мес:Math.round((z.G-a.G)/60),зарплата:+av('w').toFixed(1),база:+av('Wn').toFixed(1),кошелёк_жителей:Math.round(z.H),расхождение:Math.round(startMoney()-M0),типы:Object.fromEntries(Object.entries(tl).map(([t,a])=>[B[t].n,[Math.round(a.cl/a.n*100)+'%',Math.round(a.pr/a.n),a.pr>0?+(B[t].cost*kc/(a.pr/a.n)/12).toFixed(1):'никогда']])),траты:Math.round(av('sp')/Math.max(1,av('inc'))*100),шок:cfg._sh,snaps,built,firstPriv};
}
// Запуск: node tools/wallet-model.mjs [zones|qual]. Без аргумента — оба набора.
const MODE=process.argv[2]||'all';
CITY.start={pop:150,c:{hall:1,farm:3,fish:1,shop:2,wind:2,store:1,port:1,school:1}};
const AG=['farm','veg','ranch','fish','coffee','cotton'],IN=['saw','coalmine','ironmine','goldmine','factory','textile','cannery'],ALL=[...AG,...IN,'shop'];
if(MODE==='all'||MODE==='zones'){
const BASE={k:2.2,w0:15,chain:{goods:1.5,cloth:1.35,cans:1.4},tInc:.15,tBiz:.2,wage:'market',own:'state',city:'start'};
const V={'Жители не копят':{zones:1,save:0,allow:ALL},'Копят 10%, без тормоза':{zones:1,save:.1,allow:ALL},'Копят 10%, с тормозом':{zones:1,save:.1,allow:ALL,brake:.9}};
for(const[n,v]of Object.entries(V)){const r=sim({...BASE,...v});console.log(n,'| первый частник, месяц:',r.firstPriv,'| расхождение денег:',r.расхождение);for(const y of [5,10,20,30])console.log('  год',y,JSON.stringify(r.snaps[y]))}}
/* Квалификация (DESIGN.md, «Зарплата и цены»): ступень места, база одна на страну, цены из трудоёмкости.
   0 — без образования ×1, 1 — школа ×1,3, 2 — профессиональное ×1,7, 3 — высшее ×2,5. */
export const QUAL={hall:3,farm:0,veg:0,ranch:0,fish:0,coffee:0,cotton:0,saw:0,coalmine:0,ironmine:0,goldmine:0,barracks:0,
  shop:1,store:1,port:1,wind:1,textile:1,cannery:1,police:1,factory:2,power:2,school:3,clinic:3};
export const QM=[1,1.3,1.7,2.5];
export const JOBS2={factory:10,textile:8,cannery:8,saw:7,coalmine:8,ironmine:9};
export const PRICES2={food:10,coffee:36,cotton:16,wood:13,coal:15,iron:20,gold:100,cloth:46,cans:44,goods:55};
if(MODE==='all'||MODE==='qual'){
  const Q0={k:2.2,w0:12,tInc:.15,tBiz:.2,wage:'market',q:QUAL,M:QM,jobs:JOBS2,prices:PRICES2,share:.55,margin:.2};
  // Город с теми же зданиями, но мест на заводах меньше: жителей столько же на одно место, чтобы безработица сравнивалась честно.
  const jobsOf=(c,j)=>Object.entries(CITY[c].c).reduce((a,[t,n])=>a+n*(j[t]??B[t].jobs??0),0),pop2=Math.round(CITY.city.pop*jobsOf('city',JOBS2)/jobsOf('city',{}));
  const C8={city:'city',pop0:pop2};console.log('Жителей в городе с новыми местами:',pop2,'(было',CITY.city.pop+')');
  const row=(n,r)=>console.log(n.padEnd(34),'| закрыто',r.закрыто+'%','| безраб',r.безраб+'%','| база',r.база,'| ср. зарплата',r.зарплата,'| казна/мес',r.казна_в_мес,'| расхождение',r.расхождение);
  console.log('\nКвалификация, город 800 (с новыми местами '+pop2+' жителей), 30 лет');
  const P8={...Q0,...C8};
  for(const own of['state','private','mixed'])row(own==='state'?'Госпредприятия':own==='private'?'Частные':'Смешанно',sim({...P8,own}));
  row('Старые цены ×2,2 и старые места',sim({...P8,own:'private',jobs:{},prices:null,chain:{goods:1.5,cloth:1.35,cans:1.4},pop0:CITY.city.pop}));
  row('Наценка рынка 10% (было)',sim({...P8,own:'private',margin:.1}));
  row('Без надбавок (одна ставка)',sim({...P8,own:'private',M:[1]}));
  row('Порт закрыт 2 года, частные',sim({...P8,own:'private',shock:1}));
  row('Частные, подоходный 20%',sim({...P8,own:'private',tInc:.2}));
  row('Частные, подоходный 25%, прибыль 25%',sim({...P8,own:'private',tInc:.25,tBiz:.25}));
  row('Смешанно, подоходный 20%',sim({...P8,own:'mixed',tInc:.2}));
  console.log('\nОкупаемость, лет: стоимость × kc / прибыль (частные, город 800, подоходный 20%)');
  for(const kc of[1,10,25]){const r=sim({...P8,own:'private',tInc:.2,kc});console.log(' цены зданий ×'+kc,JSON.stringify(Object.fromEntries(Object.entries(r.типы).map(([n,a])=>[n,a[2]]))))}
  console.log('\nЗоны, старт 150, госпредприятия, копят 10%, с тормозом, подоходный 20%');
  for(const M of[QM,[1]])for(const kc of[1,10,25]){const r=sim({...Q0,M,tInc:.2,own:'state',city:'start',zones:1,save:.1,allow:ALL,brake:.9,kc});console.log((M.length>1?' надбавки':' одна ставка')+', цены зданий ×'+kc,'| первый частник, месяц:',r.firstPriv,'| частных к 10 / 30 году:',r.snaps[10]?.част,'/',r.snaps[30]?.част,'| жителей к 30:',r.snaps[30]?.жит,'| база:',r.snaps[30]?.ст,'| казна к 10 году:',r.snaps[10]?.казна,'| расхождение',r.расхождение)}
}
