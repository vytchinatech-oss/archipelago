// Песочница: семьи с деревом родства, банк, кредит, наследство, потеря денег (docs/DESIGN.md).
// Запуск: node tools/family-model.mjs. Сама игра не меняется.
const TYPES=[['Поле',110],['Рынок',150],['Хлопок',120],['Ткацкая',380],['Завод',480]];
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function run(cfg,seed){
 const R=rng(seed),{bank=1,cost=1,hosp=.5,inherit=1,ret=.015,N=60,months=360,down=.2,wage=8,fail=.002}=cfg;
 const fam=[];for(let i=0;i<N;i++)fam.push({e:R()<.5?0:R()<.7?1:2,age:20+R()*30,life:55+hosp*15+(R()-.5)*16,thrift:R(),dep:0,debt:0,pay:0,b:[],gen:1});
 let lend=0,bad=0,fails=0,first=null,built=0,deaths=0,lost=0,defaults=0,inheritedB=0,auct=0;
 const slots=m=>20+m*.08;
 const deposits=()=>fam.reduce((s,f)=>s+f.dep,0);
 for(let m=0;m<months;m++){
  const nB=fam.reduce((s,f)=>s+f.b.length,0),sat=Math.min(1,slots(m)/Math.max(1,nB));
  for(const f of fam){
   let inc=3*wage*(1+.2*f.e);for(const c of f.b)inc+=c*ret*sat;
   const s=.05+.15*(.6*f.e/2+.4*Math.min(1,inc/60));f.s=s;let sv=inc*s*(.6+.4*f.thrift);
   if(f.pay>0){const p=Math.min(f.pay,f.debt);if(inc*.6+f.dep>=p){const fromInc=Math.min(p,inc*.6);f.dep-=p-fromInc;sv=Math.max(0,sv-fromInc*.3);f.debt-=p*(1-.008*Math.max(1,f.debt/Math.max(p,1))*.5);lend-=p*.9}else{f.miss=(f.miss||0)+1}
    if(f.debt<=.5){f.debt=0;f.pay=0}}
   if(f.miss>=6){defaults++;const seized=Math.max(0,f.dep);f.dep=0;const loss=Math.max(0,f.debt-seized-f.b.reduce((a,c)=>a+c*.5,0));bad+=loss;lend-=f.debt;f.debt=0;f.pay=0;f.b=[];f.miss=0;lost+=seized}
   f.dep+=sv+f.dep*(bank?.003:0);
   // потеря денег: болезнь, разгул, неудача; шанс падает с бережливостью и больницами
   const pLoss=.006*(1.5-f.thrift)*(1.3-.6*hosp);if(R()<pLoss&&f.dep>0){const x=f.dep*(.2+R()*.4);f.dep-=x;lost+=x}
   // частное дело разоряется
   if(f.b.length&&R()<fail){const c=f.b.pop();lost+=c*.5}
   f.age+=1/12;
   if(f.age>=f.life){deaths++;
    if(inherit&&R()<.92){inheritedB+=f.b.length;f.dep*=.95;f.gen++;f.age=25+R()*5;f.life=55+hosp*15+(R()-.5)*16;f.thrift=Math.max(0,Math.min(1,f.thrift+(R()-.5)*.5));if(R()<.25)f.e=Math.min(2,f.e+1)}
    else{auct+=f.b.length;lost+=f.dep;f.dep=0;lend-=f.debt;bad+=f.debt;f.debt=0;f.pay=0;f.b=[];f.age=25;f.life=55+hosp*15+(R()-.5)*16;f.gen=1;f.thrift=R();f.e=R()<.5?0:1}}
  }
  // банк лопается, если плохие долги съели запас
  const D=deposits();if(bad>Math.max(200,D*.25)){fails++;for(const f of fam){const x=f.dep*.3;f.dep-=x;lost+=x}bad=0}
  // стройка: богатые первыми
  if(nB<slots(m)){const order=[...fam].sort((a,b)=>b.dep-a.dep);
   for(const f of order.slice(0,10)){const inc=3*wage*(1+.2*f.e);const opts=TYPES.map(([n,c])=>[n,c*cost]).sort((a,b)=>b[1]-a[1]);let done=false;
    for(const[n,c]of opts){
     if(!bank){if(f.dep>=c){f.dep-=c;f.b.push(c);done=true}}
     else if(!f.debt&&f.dep>=c*down){const loan=c-c*down,pay=loan/60*1.2;if(lend+loan<=deposits()*.8&&pay<=inc*.5+f.b.reduce((a,x)=>a+x*ret*sat,0)){f.dep-=c*down;f.debt=loan;f.pay=pay;lend+=loan;f.b.push(c);done=true}}
     if(done)break}
    if(done){built++;if(first===null)first=m;break}}}
 }
 const w=fam.map(f=>f.dep+f.b.reduce((a,c)=>a+c,0)-f.debt).sort((a,b)=>b-a),tot=w.reduce((a,x)=>a+Math.max(0,x),0)||1;
 return{first:first===null?999:first,b:fam.reduce((s,f)=>s+f.b.length,0),owners:fam.filter(f=>f.b.length).length/N*100,top:w.slice(0,Math.ceil(N*.1)).reduce((a,x)=>a+Math.max(0,x),0)/tot*100,defaults,fails,deaths,inheritedB,auct,gen:Math.max(...fam.map(f=>f.gen))};
}
const V={'Без банка, только свои деньги':{bank:0},'Банк и кредит, цены зданий как сейчас':{},'Банк, здания ×5':{cost:5},'Банк, здания ×5, больницы полные':{cost:5,hosp:1},'Банк, здания ×5, больниц нет':{cost:5,hosp:0},'Банк, здания ×5, без наследства':{cost:5,inherit:0},'Банк, здания ×5, первый взнос 40%':{cost:5,down:.4},'Кризис: прибыль втрое ниже, разоряются чаще':{cost:5,ret:.005,fail:.015},'Кризис и взнос 40%':{cost:5,ret:.005,fail:.015,down:.4}};
for(const[n,v]of Object.entries(V)){const a={};const K=40;for(let i=1;i<=K;i++){const r=run(v,i*97);for(const k in r)a[k]=(a[k]||0)+r[k]/K}
 console.log(n.padEnd(40),`первый: ${a.first>=999?'нет':Math.round(a.first)+' мес'} | зданий ${a.b.toFixed(0)} | семей-владельцев ${a.owners.toFixed(0)}% | у верхних 10% богатства ${a.top.toFixed(0)}% | дефолтов ${a.defaults.toFixed(1)} | крахов банка ${a.fails.toFixed(1)} | смертей глав ${a.deaths.toFixed(0)} | зданий по наследству ${a.inheritedB.toFixed(1)} | поколений ${a.gen.toFixed(1)}`)}
