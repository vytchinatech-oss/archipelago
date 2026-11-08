/* Министры, автопилот, показатели страны, выборы, протесты, перевороты, реформа. */
function mkCand(post){const R=Math.random;const sk=1+Math.floor(R()*CAND.skill),f=FN[Math.floor(R()*FN.length)],l=LN[Math.floor(R()*LN.length)];
  const fem=/а$|я$/.test(f)&&f!=='Захар',ln=fem&&!/а$/.test(l)?l+'а':(!fem&&/а$/.test(l)?l.slice(0,-1):l);
  return{id:Math.random().toString(36).slice(2,8),name:`${f} ${ln}`,sk,hon:R()<CAND.hon,loy:R()<CAND.loy,risk:R()<CAND.risk,sal:CAND.salBase+sk*sk*CAND.salK+(R()*CAND.salRand|0)}}
function govInit(s,gov,diff){s.v=4;s.gov=gov;s.diff=diff;s.nextEl=GOVK.term;s.unrest=0;s.appr=GOVK.appr0;s.army=GOVK.army0;s.guard=0;s.bribe=0;s.hist=[];s.over=null;s.reformAt=0;
  s.fac=Object.fromEntries(Object.entries(GOVK.sat0).map(([f,sat])=>[f,{sat}]));s.seats=Object.assign({},GOVK.seats0);s.fatt=fattInit(s);
  s.min={};s.cand={};for(const p in POSTS)s.cand[p]=[mkCand(p),mkCand(p),mkCand(p)];s.warned={}}
const M=p=>S&&S.min&&S.min[p]?S.min[p].sk:0;
function hire(p,id){const c=S.cand[p].find(x=>x.id===id);if(!c)return'Кандидат уже ушёл';if(S.min[p])fire(p,true);
  S.min[p]=Object.assign({auto:0,since:S.month},c);S.cand[p]=S.cand[p].filter(x=>x.id!==id);S.log.unshift({m:S.month,t:`Назначен министр ${POSTS[p].n.toLowerCase()}: ${c.name}.`});return`${c.name} назначен`}
function fire(p,silent){const m=S.min[p];if(!m)return'';delete S.min[p];
  if(!m.loy){S.unrest=Math.min(100,S.unrest+CABK.firedUnrest);S.fac.peo.sat-=CABK.firedPeo;S.log.unshift({m:S.month,t:`Уволенный ${m.name} ушёл в оппозицию и критикует власть.`})}
  else if(!silent)S.log.unshift({m:S.month,t:`${m.name} покинул пост министра ${POSTS[p].n.toLowerCase()}.`});return`${m.name} уволен`}
/* Какой министр с доверенной сферой ведёт выключатель ресурса (m: 'e' вывоз, 'i' ввоз). Пока он есть, игрок кнопку не меняет. */
function tradeBoss(k,m){const on=p=>S.min[p]&&S.min[p].auto?S.min[p]:null;if(on('trd'))return on('trd');
  if(m==='i')for(const p in AUTO.importOf)if(AUTO.importOf[p].includes(k)&&on(p))return on(p);return null}
function setTrade(k,m){const b=tradeBoss(k,m);if(b)return`Этим ведает ${b.name}. Переведите министра в советники или увольте его`;S.trade[k][m]=S.trade[k][m]?0:1;return''}
/* building helper for autopilot ministers */
function autoBuild(type,isTarget){let best=-1,bs=0;
  for(let i=0;i<N*N;i++){if(!nb4(i).some(j=>NET[j]))continue;if(!canBuild(type,i).ok)continue;let sc=0;
    if(RAD[type]){const x=i%N,y=i/N|0,R=RAD[type];for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R+R)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;if(isTarget(Y*N+X))sc++}}
    else sc=isTarget(i);if(sc>bs){bs=sc;best=i}}
  if(best<0)return -1;place(type,best);return best}
/* advice and autopilot per post; returns text of recommendation, acts if doIt */
function ministerTurn(p,c,r,doIt){
  const m=S.min[p],risk=m?m.risk:false,res=risk?AUTO.resRisk:AUTO.resSafe,T=S.tax,can=S.money-res;
  const act=(type,isT,why)=>{if(!doIt)return why;if(can<B[type].cost)return why+' Ждёт денег.';const i=autoBuild(type,isT);if(i>=0){S.log.unshift({m:S.month,t:`${m.name}: построен ${B[type].n.toLowerCase()}. ${why}`});return why}return why};
  const hasB=(i,f)=>{const b=S.bld[i];return b&&CONN[i]&&f(B[b.t],i,b)};
  if(p==='fin'){if((r.net<0||S.money<0)&&S.happy>AUTO.finMood[risk?0:1]){if(doIt&&T.inc<AUTO.finInc[risk?0:1])T.inc=+(T.inc+AUTO.step).toFixed(2);return'Бюджет в минусе: советую поднять подоходный налог на 1%.'}
    if(r.net<0&&T.biz<TAXK.bizFree){if(doIt)T.biz=+(T.biz+AUTO.step).toFixed(2);return'Бюджет в минусе, а люди недовольны: поднимем налог на бизнес, не трогая людей.'}
    if(S.happy<AUTO.finCalm&&T.inc>AUTO.finCalmInc){if(doIt)T.inc=+(T.inc-AUTO.step).toFixed(2);return'Люди на грани протестов: снизим подоходный налог.'}
    if(T.biz>TAXK.bizFree){if(doIt)T.biz=TAXK.bizFree;return`Налог на бизнес выше ${Math.round(TAXK.bizFree*100)}% душит предприятия, верните ${Math.round(TAXK.bizFree*100)}%.`}
    if(S.money>AUTO.finRich&&S.happy<AUTO.finRichMood&&T.inc>AUTO.finRichInc){if(doIt)T.inc=+(T.inc-AUTO.step).toFixed(2);return'Казна полна, а люди недовольны: снизим подоходный на 1%.'}return'Бюджет в порядке.'}
  if(p==='trd'){const ti=AUTO.tradeImp[risk?0:1],te=AUTO.tradeExp[risk?0:1];let s='Пошлины в норме.';
    if(Math.abs(T.imp-ti)>AUTO.eps){s=`Советую импортную пошлину ${Math.round(ti*100)}%: ${risk?'дешёвый импорт оживит торговлю':'защитим своих производителей'}.`;if(doIt)T.imp=+(T.imp+Math.sign(ti-T.imp)*AUTO.step).toFixed(2)}
    else if(Math.abs(T.exp-te)>AUTO.eps){s=`Советую экспортную пошлину ${Math.round(te*100)}%.`;if(doIt)T.exp=+(T.exp+Math.sign(te-T.exp)*AUTO.step).toFixed(2)}
    if(doIt)for(const k of RK){S.trade[k].e=1;S.trade[k].i=1}
    if(!c.ports)s='Без порта торговли нет: постройте порт.';return s}
  if(p==='dip'){let s='Отношения стабильны.';
    if(S.ev){const e=S.ev,y=evWise(e,risk,c);s=`По запросу «${evText(e)[0]}» советую: ${y?evText(e)[2].toLowerCase():evText(e)[3].toLowerCase()}.`;if(doIt){evAnswer(y&&!evLack(e));S.log.unshift({m:S.month,t:`${m.name} ответил на запрос: ${y?'согласие':'отказ'}.`})}return s}
    const cand=S.nat.find(n=>!n.deal&&!n.emb&&n.rel>=RELK.friend&&!dipWait(n));if(cand){s=`Отношения с ${ND(cand).n} позволяют подписать договор.`;if(doIt)dip('deal',cand.id);return s}
    const near=S.nat.find(n=>!n.deal&&!n.emb&&n.rel>=AUTO.dipNear&&n.rel<RELK.friend&&aidGain(n)>DIPA.aidMin&&!dipWait(n));if(near&&S.money>res+AUTO.dipAidCash){s=`${ND(near).n} почти готов к договору: помощь ${fmt(DIPA.aidCost)} кр поможет.`;if(doIt)dip('aid',near.id)}
    if(S.money<AUTO.dipBroke&&risk&&debtTotal()<AUTO.dipDebtMax&&!S.loans.some(l=>l.since>S.month-AUTO.dipLoanGap)){s='Казна пуста: возьмём заём у самого дешёвого кредитора.';if(doIt){const n=S.nat.filter(n=>n.rel>=DIPA.borrowFrom&&n.money>=AUTO.dipLoan*DIPA.borrowCash&&!dipWait(n)).sort((a,b)=>borrowRate(a)-borrowRate(b))[0];if(n){dip('borrow',n.id,AUTO.dipLoan);S.loans[S.loans.length-1].since=S.month}}}return s}
  if(p==='en'){if(c.unpow>0)return act('wind',i=>hasB(i,(d,j)=>d.pow<0&&!PW[j]),`${c.unpow} зданий без электричества.`);
    if(c.pr<1)return act(risk&&r.prod.coal>AUTO.coalOk?'power':'wind',()=>1,'Энергии не хватает на всех.');if(r.fuel<AUTO.fuelLow){if(S.trade.coal.i)return'ТЭС не хватает угля: нужна шахта или порт.';if(doIt){S.trade.coal.i=1;return'ТЭС не хватает угля: включаю ввоз угля.'}return'ТЭС не хватает угля, а ввоз угля у вас выключен.'}return'Энергосеть в порядке.'}
  if(p==='ind'){if(c.log<AUTO.logLow)return act('store',i=>hasB(i,(d,j)=>d.out&&!COV.store[j]),'Предприятиям нужен склад рядом.');if(r.short.inputs>AUTO.inputsLow){if(AUTO.importOf.ind.every(k=>S.trade[k].i))return'Заводам не хватает сырья: нужна добыча или порт.';if(doIt){for(const k of AUTO.importOf.ind)S.trade[k].i=1;return'Заводам не хватает сырья: включаю ввоз сырья.'}return'Заводам не хватает сырья, а ввоз части сырья у вас выключен.'}return'Промышленность работает.'}
  if(p==='agr'){if(r.short.food>AUTO.foodShort||S.stock.food<S.pop*AUTO.foodStock){const off=!S.trade.food.i;if(doIt)S.trade.food.i=1;return act('farm',i=>S.type[i]===GRASS?fert(i):0,!off?'Еды не хватает: нужны фермы.':doIt?'Еды не хватает: нужны фермы, включаю ввоз еды.':'Еды не хватает: нужны фермы, а ввоз еды у вас выключен.')}return'Еды достаточно.'}
  if(p==='soc'){const homeT=k=>i=>hasB(i,(d,j)=>d.home&&!COV[k][j]);
    if(c.poor>0)return act('shop',homeT('shop'),'Дома без рынка пустуют.');if(c.cv.park<AUTO.park)return act('park',homeT('park'),'Мало парков у жилья.');
    if(S.pop>=B.school.need&&c.cv.school<AUTO.school)return act('school',homeT('school'),'Детям нужны школы.');if(S.pop>=B.clinic.need&&c.cv.clinic<AUTO.clinic)return act('clinic',homeT('clinic'),'Нужна больница.');return'Социальная сфера в порядке.'}
  if(p==='mvd'){if(S.pop>=B.police.need&&c.cv.police<AUTO.police)return act('police',i=>hasB(i,(d,j)=>d.home&&!COV.police[j]),'Растёт преступность.');if(S.unrest>AUTO.unrest)return'Протесты растут: улучшайте жизнь людей, полицией их не погасить.';return'Порядок под контролем.'}
}
/* Фракции 2.0: сфера здания, саботаж, отношение к соседям из реальной торговли. */
const TRADE_F=['agr','ind','trd','peo'],AGR_K=['food','coffee','cotton'],CONS_K=['food','goods','cloth','coffee'];
function sphereOf(t){const d=B[t];if(d.out&&(d.out.food||d.out.coffee||d.out.cotton))return'agr';if(d.cat==='mine'||d.cat==='ind'||d.cat==='pow')return'ind';
  if(d.cat==='mil')return'mil';if(t==='school'||t==='clinic')return'int';if(t==='shop'||t==='store'||t==='port')return'trd';return'peo'}
function facM(f){if(!S||!S.fac||!S.fac[f])return 1;const v=S.fac[f].sat;return v<FACK.lo?FACK.loM:v>FACK.hi?FACK.hiM:1}
function fattInit(s){const o={};for(const f in FAC){o[f]={};for(const n of s.nat)o[f][n.id]=0}return o}
const clamp1=v=>Math.max(-1,Math.min(1,v));
function facAttRaw(r){const out={},xn=r.xn||{},mn=r.mn||{},sum=(o,ks)=>o?ks.reduce((a,k)=>a+(o[k]||0),0):0,
    ownK=ks=>ks.filter(k=>r.prod[k]>FATT.ownFrom),SPH={agr:AGR_K,ind:RK.filter(k=>!AGR_K.includes(k))};
  for(const f in FAC)out[f]={};
  for(const f of['agr','ind']){const ks=SPH[f],kc=ownK(ks),tot=S.nat.reduce((a,n)=>a+sum(xn[n.id],ks)+sum(mn[n.id],kc),0)+FATT.pad;
    for(const n of S.nat)out[f][n.id]=clamp1((sum(xn[n.id],ks)-sum(mn[n.id],kc))/tot*FATT.sphere)}
  const tv=n=>sum(xn[n.id],RK)+sum(mn[n.id],RK),tt=S.nat.reduce((a,n)=>a+tv(n),0)+FATT.pad,cv=n=>sum(mn[n.id],CONS_K),ct=S.nat.reduce((a,n)=>a+cv(n),0)+FATT.pad;
  for(const n of S.nat){const d=ND(n);
    out.trd[n.id]=clamp1(FATT.trdBase+tv(n)/tt*FATT.sphere);out.peo[n.id]=clamp1(cv(n)/ct*FATT.peo);
    out.mil[n.id]=clamp1((d.aggr?FATT.milAggr:0)+(n.rel<RELK.neutral?FATT.milTense:0)+(n.rel>=RELK.ally?FATT.milAlly:0));
    out.int[n.id]=FATT.intReg[d.reg]||0}
  return out}
function facAttTick(r){if(!S.fatt)S.fatt=fattInit(S);const raw=facAttRaw(r);
  for(const f in FAC){const a=S.fatt[f]||(S.fatt[f]={});for(const n of S.nat){if(n.emb&&TRADE_F.includes(f))continue;const v=a[n.id]||0;a[n.id]=v+(raw[f][n.id]-v)*FACK.smooth}}}
const relTerm=n=>Math.max(-FATT.relMax,Math.min(FATT.relMax,clamp1(n.rel/RELK.ally)+(n.deal?FATT.relDeal:0)-(n.emb?FATT.relEmb:0)));
function natEff(f){const a=S.fatt&&S.fatt[f];if(!a)return 0;let s=0,w=0;for(const n of S.nat){const v=a[n.id]||0;s+=v*relTerm(n);w+=Math.abs(v)}return FACK.natW*s/Math.max(1,w)}
/* кто из фракций любит и не любит страну: [[f,att],...] */
function natFans(id,th=FACK.fanFrom){const fan=[],foe=[];for(const f in FAC){const v=S.fatt&&S.fatt[f]?S.fatt[f][id]||0:0;if(f==='mil'&&!S.seats.mil)continue;if(v>=th)fan.push(f);else if(v<=-th)foe.push(f)}return{fan,foe}}
/* старые сохранения v3 → v4: две новые фракции и отношения к соседям */
function migrateSave(o){if(o.v===3){o.fac.mil={sat:50};o.fac.int={sat:50};o.seats.mil=0;o.seats.int=4;o.fatt=fattInit(o);o.v=4}
  /* поля редких сообщений и обращений раз в год: версия та же, просто дополняем */
  if(o.evAt===undefined){o.evAt=-99;o.evHist=[];o.evNid=null;o.nat.forEach(n=>{n.actAt=-99})}
  /* торговля за год для обоснованных сообщений; сообщение старого вида без причины снимаем */
  o.nat.forEach(n=>{n.xy=n.xy||{};n.my=n.my||{}});if(o.ev&&!o.ev.r)o.ev=null;
  /* гвардия существует только при монархии */
  if(o.gov!=='mon')o.guard=0;return o}
/* indicators and politics, called after the month is computed */
function govTick(r,c){
  const D=DIFF[S.diff],T=S.tax,L=t=>S.log.unshift({m:S.month,t});
  // ministers: salaries, theft, autopilot, plots
  let sal=0,theft=0;for(const p in S.min){const m=S.min[p];sal+=m.sal;if(!m.hon)theft+=p==='fin'?(r.inc+r.biz)*CABK.theftFin:CABK.theftBase+m.sk*CABK.theftSkill}
  r.sal=sal;r.theft=theft;S.money-=sal+theft;r.net-=sal+theft;
  const cash0=S.money;
  for(const p in S.min){const m=S.min[p];m.tip=ministerTurn(p,c,r,!!m.auto);
    if(!m.hon&&Math.random()<CABK.caught){S.appr-=CABK.caughtAppr;L(`Скандал: министр ${m.name} уличён в хищениях и снят с поста. Рейтинг падает.`);fire(p,true);continue}
    if(!m.loy&&S.appr<CABK.plotAppr&&Math.random()<CABK.plot){S.unrest=Math.min(100,S.unrest+CABK.plotUnrest);if(S.gov==='mon')S.army-=CABK.plotArmy;L(`Министр ${m.name} плетёт интриги против вас.`)}}
  r.auto=S.money-cash0;
  for(const p in POSTS)if(!S.min[p])S.adv=S.adv||{},S.adv[p]=ministerTurn(p,c,r,false);
  if(S.month%12===0)for(const p in POSTS)S.cand[p]=[mkCand(p),mkCand(p),mkCand(p)];
  // indicators
  const gdp=RK.reduce((a,k)=>a+r.prod[k]*S.dom[k],0),W=GOVK.inflW;
  const cpi=100*Object.keys(W).reduce((a,k)=>a+W[k]*S.dom[k]/RES[k].base,0);
  const debt=debtTotal()+Math.max(0,-S.money),h=S.hist,y=h.length>=12?h[h.length-12]:h[0];
  const infl=h.length>=12?cpi/y.cpi-1:0,g12=h.length>=12?h.slice(-12).reduce((a,x)=>a+x.gdp,0):gdp*12,growth=y&&y.gdp>0?gdp/y.gdp-1:0;
  // factions 2.0: seats by employment, satisfaction by sphere + attitude to neighbours
  const jobsBy={agr:0,ind:0,trd:c.richPop*GOVK.richJobs,mil:0,int:0};for(const i of c.list){const d=B[S.bld[i].t];if(!d.jobs)continue;const f=sphereOf(S.bld[i].t);if(f in jobsBy)jobsBy[f]+=d.jobs*(c.st[i]||0)}
  const WF=Math.max(1,c.work+c.richPop*GOVK.richJobs,Object.values(jobsBy).reduce((a,b)=>a+b,0));let tot=0;
  for(const f in jobsBy){S.seats[f]=Math.round((f==='mil'?0:FACK.floor)+FACK.share*jobsBy[f]/WF);tot+=S.seats[f]}S.seats.peo=100-tot;
  facAttTick(r);const ne=f=>natEff(f);
  const runs=Object.values(r.run),avgRun=runs.length?runs.reduce((a,b)=>a+b,0)/runs.length:FACT.ind.run,deals=S.nat.filter(n=>n.deal).length,impF=r.need.food?r.imp.food/r.need.food:0;
  const sold=jobsBy.mil/Math.max(1,S.pop);r.soldiers=Math.round(jobsBy.mil);
  const tgt={agr:FACT.agr.base+(S.dom.food/RES.food.base-1)*FACT.agr.food-(T.biz-FACT.agr.bizFree)*FACT.agr.biz-impF*FACT.agr.imp+M('agr')*FACT.agr.min+ne('agr'),
    ind:FACT.ind.base+(avgRun-FACT.ind.run)*FACT.ind.runK-(1-c.pr)*FACT.ind.pow-(T.biz-FACT.ind.bizFree)*FACT.ind.biz-(1-c.log)*FACT.ind.log+M('ind')*FACT.ind.min+ne('ind'),
    trd:FACT.trd.base+Math.min(FACT.trd.expMax,r.expV/FACT.trd.expDiv)-(T.imp-FACT.trd.impFree)*FACT.trd.imp-(T.exp-FACT.trd.expFree)*FACT.trd.exp+deals*FACT.trd.deal+M('trd')*FACT.trd.min+ne('trd'),
    peo:S.happy*FACT.peo.mood+(1-r.unemp)*FACT.peo.job+ne('peo'),
    mil:FACT.mil.base+Math.min(FACT.mil.soldMax,sold/FACK.soldierPct*FACT.mil.sold)+(S.money<0?FACT.mil.broke:FACT.mil.ok)+S.guard*FACT.mil.guard+ne('mil'),
    int:FACT.int.base+FACT.int.school*c.cv.school+FACT.int.clinic*c.cv.clinic+(FACT.int.gov[S.gov]||0)+M('soc')*FACT.int.min+ne('int')};
  for(const f in tgt){const s=S.fac[f];s.sat+=(Math.max(0,Math.min(100,tgt[f]+S.bribe))-s.sat)*GOVK.satSpeed}
  S.bribe*=BRIBE.decay;
  const parl=Object.keys(FAC).reduce((a,f)=>a+S.seats[f]*Math.max(0,Math.min(1,(S.fac[f].sat-GOVK.parlLo)/GOVK.parlSpan)),0);
  // approval
  const ap=S.happy*APPR.mood+(1-r.unemp)*APPR.job+Math.max(-APPR.growthMax,Math.min(APPR.growthMax,growth*APPR.growth))-(infl>APPR.inflFree?Math.min(APPR.inflMax,(infl-APPR.inflFree)*APPR.infl):0)-(S.money<0?APPR.broke:0)-(g12>0&&debt/g12>APPR.debtRatio?APPR.debt:0)+APPR.base+M('soc')*APPR.soc;
  S.appr+=(Math.max(0,Math.min(100,ap))-S.appr)*APPR.speed;
  // unrest
  let du=(S.happy<UNR.below?(UNR.below-S.happy)*UNR.rise:-UNR.calm)+(S.fac.peo.sat<FACK.lo?FACK.peoUnrest:0)+(S.money<UNR.broke?UNR.brokeAdd:0)+(r.short.food>UNR.hunger?UNR.hungerAdd:0)+(S.appr<UNR.apprBelow?UNR.apprAdd:0);du*=du>0?D.un*(1-MINK.mvdUnrest*M('mvd')):1;
  S.unrest=Math.max(0,Math.min(100,S.unrest+du));
  if(S.gov==='mon'){S.army+=((ARMY.base+S.fac.mil.sat*ARMY.mil+S.guard*ARMY.guard+(S.money>0?ARMY.rich:ARMY.broke)+(S.happy-50)*ARMY.mood+(S.appr-50)*ARMY.appr)-S.army)*ARMY.speed;
    if(S.guard){r.guard=ARMY.guardCost;S.money-=r.guard;r.net-=r.guard}}
  const coup=S.gov==='mon'?Math.max(0,(ARMY.coupBelow-S.army)/100*ARMY.coupArmy+(S.unrest/100)*ARMY.coupUnrest+Object.values(S.min).filter(m=>!m.loy).length*(S.appr<ARMY.coupPlotAppr?ARMY.coupPlot:0)+['agr','ind','trd'].filter(f=>S.fac[f].sat<FACK.lo).length*FACK.coupAngry):0;
  S.coup=coup;S.parl=parl;
  h.push({m:S.month,gdp,cpi,infl,debt,pop:S.pop,happy:S.happy,unemp:r.unemp,money:S.money,appr:S.appr,trade:r.expV-r.impV,net:r.net,parl,unrest:S.unrest});if(h.length>240)h.shift();
  Object.assign(r,{gdp,cpi,infl,debt,growth,g12});
  // warnings
  for(const lv of UNR.warn)if(S.unrest>=lv&&!S.warned['u'+lv]){S.warned['u'+lv]=1;r.alert=`Протесты ${lv}%: ${lv===80?'ещё немного, и вас свергнут':'люди выходят на улицы'}.`;L(r.alert)}
  if(S.unrest<UNR.warnReset)S.warned.u50=S.warned.u80=0;
  // overthrow
  const why={demo:'Импичмент: массовые протесты вынудили парламент отстранить вас.',parl:'Вотум недоверия: парламент отправил правительство в отставку на волне протестов.',mon:'Восстание: толпа взяла дворец, династия низложена.'};
  if(S.unrest>=100)return endGame(why[S.gov]);
  if(S.gov==='mon'&&Math.random()<coup)return endGame('Дворцовый переворот: армия и знать возвели на трон другого.');
  if(S.gov!=='mon'&&S.month>=S.nextEl){const v=S.gov==='demo'?Math.max(0,Math.min(100,S.appr+(Math.random()-.5)*GOVK.pollNoise)):parl;
    if(v>=D.th){S.nextEl+=GOVK.term;L(`Выборы: вы победили с результатом ${Math.round(v)}%. Следующие через 10 лет.`);r.alert=`Вы переизбраны: ${Math.round(v)}%`;S.elWon=(S.elWon||0)+1}
    else return endGame(`${S.gov==='demo'?'Народ':'Парламент'} отдал вам ${Math.round(v)}% при нужных ${D.th}%. Вы проиграли выборы.`)}
}
function endGame(reason){S.over={reason,month:S.month};S.log.unshift({m:S.month,t:reason})}
/* Гвардия есть только при монархии. */
function toggleGuard(){if(S.gov!=='mon')return'Гвардия бывает только при монархии';S.guard=S.guard?0:1;return S.guard?'Гвардия набрана':'Гвардия распущена'}
function bribe(){if(S.money<BRIBE.cost)return'Не хватает денег';S.money-=BRIBE.cost;S.bribe+=BRIBE.sat;S.army+=BRIBE.army;S.log.unshift({m:S.month,t:'Знать получила щедрые подарки из казны.'});return'Сословия довольны'}
function reform(to){
  const ok=S.gov==='mon'?(S.army>=REFORM.army&&S.appr>=REFORM.appr):(S.parl>=REFORM.parl);if(S.gov===to)return'Уже так';if(S.month<S.reformAt)return'Реформа возможна раз в 5 лет';
  if(!ok)return S.gov==='mon'?`Нужны лояльность армии от ${REFORM.army} и рейтинг от ${REFORM.appr}`:`Нужна поддержка парламента от ${REFORM.parl}%`;if(S.money<REFORM.cost)return`Реформа стоит ${fmt(REFORM.cost)} кр`;
  S.money-=REFORM.cost;const from=S.gov;S.gov=to;S.reformAt=S.month+REFORM.gap;S.nextEl=S.month+GOVK.term;
  if(to==='mon')S.happy+=REFORM.toMon;if(from==='mon'){S.happy+=REFORM.fromMon;if(S.guard){S.guard=0;S.log.unshift({m:S.month,t:'Гвардия распущена вместе с монархией.'})}}const sol=natById('sol'),ava=natById('ava');if(to==='mon'){ava.rel+=REFORM.monAva;sol.rel+=REFORM.monSol}else if(from==='mon'){sol.rel+=REFORM.repSol;ava.rel+=REFORM.repAva}
  S.log.unshift({m:S.month,t:`Реформа: страна стала «${GOVS[to].n}».`});return`Теперь у вас ${GOVS[to].n.toLowerCase()}`}
