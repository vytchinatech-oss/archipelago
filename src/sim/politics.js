/* Министры, автопилот, показатели страны, выборы, протесты, перевороты, реформа. */
function mkCand(post){const R=Math.random;const sk=1+Math.floor(R()*5),f=FN[Math.floor(R()*FN.length)],l=LN[Math.floor(R()*LN.length)];
  const fem=/а$|я$/.test(f)&&f!=='Захар',ln=fem&&!/а$/.test(l)?l+'а':(!fem&&/а$/.test(l)?l.slice(0,-1):l);
  return{id:Math.random().toString(36).slice(2,8),name:`${f} ${ln}`,sk,hon:R()<.72,loy:R()<.65,risk:R()<.5,sal:5+sk*sk*2+(R()*4|0)}}
function govInit(s,gov,diff){s.v=3;s.gov=gov;s.diff=diff;s.nextEl=120;s.unrest=0;s.appr=55;s.army=60;s.guard=0;s.bribe=0;s.hist=[];s.over=null;s.reformAt=0;
  s.fac={agr:{sat:55},ind:{sat:55},trd:{sat:55},peo:{sat:60}};s.seats={agr:22,ind:18,trd:18,peo:42};
  s.min={};s.cand={};for(const p in POSTS)s.cand[p]=[mkCand(p),mkCand(p),mkCand(p)];s.warned={}}
const M=p=>S&&S.min&&S.min[p]?S.min[p].sk:0;
function hire(p,id){const c=S.cand[p].find(x=>x.id===id);if(!c)return'Кандидат уже ушёл';if(S.min[p])fire(p,true);
  S.min[p]=Object.assign({auto:0,since:S.month},c);S.cand[p]=S.cand[p].filter(x=>x.id!==id);S.log.unshift({m:S.month,t:`Назначен министр ${POSTS[p].n.toLowerCase()}: ${c.name}.`});return`${c.name} назначен`}
function fire(p,silent){const m=S.min[p];if(!m)return'';delete S.min[p];
  if(!m.loy){S.unrest=Math.min(100,S.unrest+8);S.fac.peo.sat-=4;S.log.unshift({m:S.month,t:`Уволенный ${m.name} ушёл в оппозицию и критикует власть.`})}
  else if(!silent)S.log.unshift({m:S.month,t:`${m.name} покинул пост министра ${POSTS[p].n.toLowerCase()}.`});return`${m.name} уволен`}
/* building helper for autopilot ministers */
function autoBuild(type,isTarget){let best=-1,bs=0;
  for(let i=0;i<N*N;i++){if(!nb4(i).some(j=>NET[j]))continue;if(!canBuild(type,i).ok)continue;let sc=0;
    if(RAD[type]){const x=i%N,y=i/N|0,R=RAD[type];for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R+R)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;if(isTarget(Y*N+X))sc++}}
    else sc=isTarget(i);if(sc>bs){bs=sc;best=i}}
  if(best<0)return -1;place(type,best);return best}
/* advice and autopilot per post; returns text of recommendation, acts if doIt */
function ministerTurn(p,c,r,doIt){
  const m=S.min[p],risk=m?m.risk:false,res=risk?800:3000,T=S.tax,can=S.money-res;
  const act=(type,isT,why)=>{if(!doIt)return why;if(can<B[type].cost)return why+' Ждёт денег.';const i=autoBuild(type,isT);if(i>=0){S.log.unshift({m:S.month,t:`${m.name}: построен ${B[type].n.toLowerCase()}. ${why}`});return why}return why};
  const hasB=(i,f)=>{const b=S.bld[i];return b&&CONN[i]&&f(B[b.t],i,b)};
  if(p==='fin'){if((r.net<0||S.money<0)&&S.happy>(risk?40:48)){if(doIt&&T.inc<(risk?.16:.13))T.inc=+(T.inc+.01).toFixed(2);return'Бюджет в минусе: советую поднять подоходный налог на 1%.'}
    if(r.net<0&&T.biz<.15){if(doIt)T.biz=+(T.biz+.01).toFixed(2);return'Бюджет в минусе, а люди недовольны: поднимем налог на бизнес, не трогая людей.'}
    if(S.happy<40&&T.inc>.08){if(doIt)T.inc=+(T.inc-.01).toFixed(2);return'Люди на грани протестов: снизим подоходный налог.'}
    if(T.biz>.15){if(doIt)T.biz=.15;return'Налог на бизнес выше 15% душит предприятия, верните 15%.'}
    if(S.money>15000&&S.happy<55&&T.inc>.06){if(doIt)T.inc=+(T.inc-.01).toFixed(2);return'Казна полна, а люди недовольны: снизим подоходный на 1%.'}return'Бюджет в порядке.'}
  if(p==='trd'){const ti=risk?.04:.12,te=risk?.03:.06;let s='Пошлины в норме.';
    if(Math.abs(T.imp-ti)>.005){s=`Советую импортную пошлину ${Math.round(ti*100)}%: ${risk?'дешёвый импорт оживит торговлю':'защитим своих производителей'}.`;if(doIt)T.imp=+(T.imp+Math.sign(ti-T.imp)*.01).toFixed(2)}
    else if(Math.abs(T.exp-te)>.005){s=`Советую экспортную пошлину ${Math.round(te*100)}%.`;if(doIt)T.exp=+(T.exp+Math.sign(te-T.exp)*.01).toFixed(2)}
    if(doIt)for(const k of RK)S.trade[k].e=1;if(!c.ports)s='Без порта торговли нет: постройте порт.';return s}
  if(p==='dip'){let s='Отношения стабильны.';
    if(S.ev){const e=S.ev,y=e.t==='deal'||(e.t==='loan'&&S.money>e.amt*(risk?1.5:3))||(e.t==='tariff'&&!risk)||(e.t==='ref'&&c.home-S.pop>e.amt*(risk?.3:1));s=`По запросу «${evText(e)[0]}» советую: ${y?evText(e)[2].toLowerCase():evText(e)[3].toLowerCase()}.`;if(doIt){evAnswer(y&&!(e.t==='loan'&&S.money<e.amt));S.log.unshift({m:S.month,t:`${m.name} ответил на запрос: ${y?'согласие':'отказ'}.`})}return s}
    const cand=S.nat.find(n=>!n.deal&&!n.emb&&n.rel>=25);if(cand){s=`Отношения с ${ND(cand).n} позволяют подписать договор.`;if(doIt)dip('deal',cand.id);return s}
    const near=S.nat.find(n=>!n.deal&&!n.emb&&n.rel>=15&&n.rel<25&&n.aid<4);if(near&&S.money>res+3000){s=`${ND(near).n} почти готов к договору: помощь 1 000 кр поможет.`;if(doIt)dip('aid',near.id)}
    if(S.money<-1500&&risk&&debtTotal()<8000&&!S.loans.some(l=>l.since>S.month-12)){s='Казна пуста: возьмём заём у самого дешёвого кредитора.';if(doIt){const n=S.nat.filter(n=>n.rel>-30&&n.money>9000).sort((a,b)=>borrowRate(a)-borrowRate(b))[0];if(n){dip('borrow',n.id,3000);S.loans[S.loans.length-1].since=S.month}}}return s}
  if(p==='en'){if(c.unpow>0)return act('wind',i=>hasB(i,(d,j)=>d.pow<0&&!PW[j]),`${c.unpow} зданий без электричества.`);
    if(c.pr<1)return act(risk&&r.prod.coal>4?'power':'wind',()=>1,'Энергии не хватает на всех.');if(r.fuel<.9){if(doIt)S.trade.coal.i=1;return'ТЭС не хватает угля: включаю ввоз угля.'}return'Энергосеть в порядке.'}
  if(p==='ind'){if(c.log<.95)return act('store',i=>hasB(i,(d,j)=>d.out&&!COV.store[j]),'Предприятиям нужен склад рядом.');if(r.short.inputs>.2){if(doIt)for(const k of['wood','iron','coal','cotton'])S.trade[k].i=1;return'Заводам не хватает сырья: включаю ввоз сырья.'}return'Промышленность работает.'}
  if(p==='agr'){if(r.short.food>.05||S.stock.food<S.pop*.2){if(doIt)S.trade.food.i=1;return act('farm',i=>S.type[i]===GRASS?fert(i):0,'Еды не хватает: нужны фермы.')}return'Еды достаточно.'}
  if(p==='soc'){const homeT=k=>i=>hasB(i,(d,j)=>d.home&&!COV[k][j]);
    if(c.poor>0)return act('shop',homeT('shop'),'Дома без рынка пустуют.');if(c.cv.park<.6)return act('park',homeT('park'),'Мало парков у жилья.');
    if(S.pop>=60&&c.cv.school<.5)return act('school',homeT('school'),'Детям нужны школы.');if(S.pop>=80&&c.cv.clinic<.5)return act('clinic',homeT('clinic'),'Нужна больница.');return'Социальная сфера в порядке.'}
  if(p==='mvd'){if(S.pop>=120&&c.cv.police<.7)return act('police',i=>hasB(i,(d,j)=>d.home&&!COV.police[j]),'Растёт преступность.');if(S.unrest>40)return'Протесты растут: улучшайте жизнь людей, полиция их только сдерживает.';return'Порядок под контролем.'}
}
/* indicators and politics, called after the month is computed */
function govTick(r,c){
  const D=DIFF[S.diff],T=S.tax,L=t=>S.log.unshift({m:S.month,t});
  // ministers: salaries, theft, autopilot, plots
  let sal=0,theft=0;for(const p in S.min){const m=S.min[p];sal+=m.sal;if(!m.hon)theft+=p==='fin'?(r.inc+r.biz)*.04:4+m.sk*2}
  r.sal=sal;r.theft=theft;S.money-=sal+theft;r.net-=sal+theft;
  for(const p in S.min){const m=S.min[p];m.tip=ministerTurn(p,c,r,!!m.auto);
    if(!m.hon&&Math.random()<.025){S.appr-=6;L(`Скандал: министр ${m.name} уличён в хищениях. Рейтинг падает.`);m.caught=1}
    if(!m.loy&&S.appr<40&&Math.random()<.04){S.unrest=Math.min(100,S.unrest+15);if(S.gov==='mon')S.army-=8;L(`Министр ${m.name} плетёт интриги против вас.`)}}
  for(const p in POSTS)if(!S.min[p])S.adv=S.adv||{},S.adv[p]=ministerTurn(p,c,r,false);
  if(S.month%12===0)for(const p in POSTS)S.cand[p]=[mkCand(p),mkCand(p),mkCand(p)];
  // indicators
  const gdp=RK.reduce((a,k)=>a+r.prod[k]*S.dom[k],0),W={food:.5,goods:.25,cloth:.15,coffee:.1};
  const cpi=100*Object.keys(W).reduce((a,k)=>a+W[k]*S.dom[k]/RES[k].base,0);
  const debt=debtTotal()+Math.max(0,-S.money),h=S.hist,y=h.length>=12?h[h.length-12]:h[0];
  const infl=h.length>=12?cpi/y.cpi-1:0,g12=h.length>=12?h.slice(-12).reduce((a,x)=>a+x.gdp,0):gdp*12,growth=y&&y.gdp>0?gdp/y.gdp-1:0;
  // factions
  const jobsBy={agr:0,ind:0,trd:0};for(const i of c.list){const d=B[S.bld[i].t];if(!d.jobs||S.bld[i].t==='hall')continue;const w=d.jobs*(c.st[i]||0);
    if(d.out&&(d.out.food||d.out.coffee||d.out.cotton))jobsBy.agr+=w;else if(d.cat==='mine'||d.cat==='ind'||d.cat==='pow')jobsBy.ind+=w;else jobsBy.trd+=w}
  const tj=jobsBy.agr+jobsBy.ind+jobsBy.trd||1;for(const f of['agr','ind','trd'])S.seats[f]=Math.round(10+45*jobsBy[f]/tj);S.seats.peo=100-S.seats.agr-S.seats.ind-S.seats.trd;
  const runs=Object.values(r.run),avgRun=runs.length?runs.reduce((a,b)=>a+b,0)/runs.length:.8,deals=S.nat.filter(n=>n.deal).length,impF=r.need.food?r.imp.food/r.need.food:0;
  const tgt={agr:58+(S.dom.food/RES.food.base-1)*25-(T.biz-.12)*120-impF*30+M('agr')*3,
    ind:55+(avgRun-.8)*40-(1-c.pr)*40-(T.biz-.12)*150-(1-c.log)*40+M('ind')*3,
    trd:50+Math.min(20,r.expV/40)-(T.imp-.1)*100-(T.exp-.05)*150+deals*5+M('trd')*3,
    peo:S.happy*.9+(1-r.unemp)*10};
  for(const f in tgt){const s=S.fac[f];s.sat+=(Math.max(0,Math.min(100,tgt[f]+S.bribe))-s.sat)*.3}
  S.bribe*=.85;
  const parl=Object.keys(FAC).reduce((a,f)=>a+S.seats[f]*Math.max(0,Math.min(1,(S.fac[f].sat-30)/40)),0);
  // approval
  const ap=S.happy*.55+(1-r.unemp)*15+Math.max(-10,Math.min(10,growth*50))-(infl>.08?Math.min(15,(infl-.08)*100):0)-(S.money<0?10:0)-(g12>0&&debt/g12>.6?10:0)+10+M('soc')*.5;
  S.appr+=(Math.max(0,Math.min(100,ap))-S.appr)*.3;
  // unrest
  let du=(S.happy<30?(30-S.happy)*.6:-3)+(S.money<-2000?3:0)+(r.short.food>.3?5:0)+(S.appr<30?2:0);du*=du>0?D.un*(1-.1*M('mvd')):1;
  S.unrest=Math.max(0,Math.min(100,S.unrest+du));
  if(S.gov==='mon'){S.army+=((55+S.guard*12+(S.money>0?5:-15)+(S.happy-50)*.3+(S.appr-50)*.2)-S.army)*.25;
    if(S.guard)S.money-=80,r.net-=80}
  const coup=S.gov==='mon'?Math.max(0,(45-S.army)/100*.12+(S.unrest/100)*.04+Object.values(S.min).filter(m=>!m.loy).length*(S.appr<40?.01:0)):0;
  S.coup=coup;S.parl=parl;
  h.push({m:S.month,gdp,cpi,infl,debt,pop:S.pop,happy:S.happy,unemp:r.unemp,money:S.money,appr:S.appr,trade:r.expV-r.impV,net:r.net,parl,unrest:S.unrest});if(h.length>240)h.shift();
  Object.assign(r,{gdp,cpi,infl,debt,growth,g12});
  // warnings
  for(const lv of[50,80])if(S.unrest>=lv&&!S.warned['u'+lv]){S.warned['u'+lv]=1;r.alert=`Протесты ${lv}%: ${lv===80?'ещё немного, и вас свергнут':'люди выходят на улицы'}.`;L(r.alert)}
  if(S.unrest<40)S.warned.u50=S.warned.u80=0;
  // overthrow
  const why={demo:'Импичмент: массовые протесты вынудили парламент отстранить вас.',parl:'Вотум недоверия: парламент отправил правительство в отставку на волне протестов.',mon:'Восстание: толпа взяла дворец, династия низложена.'};
  if(S.unrest>=100)return endGame(why[S.gov]);
  if(S.gov==='mon'&&Math.random()<coup)return endGame('Дворцовый переворот: армия и знать возвели на трон другого.');
  if(S.gov!=='mon'&&S.month>=S.nextEl){const v=S.gov==='demo'?Math.max(0,Math.min(100,S.appr+(Math.random()-.5)*6)):parl;
    if(v>=D.th){S.nextEl+=120;L(`Выборы: вы победили с результатом ${Math.round(v)}%. Следующие через 10 лет.`);r.alert=`Вы переизбраны: ${Math.round(v)}%`;S.elWon=(S.elWon||0)+1}
    else return endGame(`${S.gov==='demo'?'Народ':'Парламент'} отдал вам ${Math.round(v)}% при нужных ${D.th}%. Вы проиграли выборы.`)}
}
function endGame(reason){S.over={reason,month:S.month};S.log.unshift({m:S.month,t:reason})}
function bribe(){if(S.money<2000)return'Не хватает денег';S.money-=2000;S.bribe+=12;S.army+=3;S.log.unshift({m:S.month,t:'Знать получила щедрые подарки из казны.'});return'Сословия довольны'}
function reform(to){
  const ok=S.gov==='mon'?(S.army>=60&&S.appr>=50):(S.parl>=60);if(S.gov===to)return'Уже так';if(S.month<S.reformAt)return'Реформа возможна раз в 5 лет';
  if(!ok)return S.gov==='mon'?'Нужны лояльность армии от 60 и рейтинг от 50':'Нужна поддержка парламента от 60%';if(S.money<3000)return'Реформа стоит 3 000 кр';
  S.money-=3000;const from=S.gov;S.gov=to;S.reformAt=S.month+60;S.nextEl=S.month+120;
  if(to==='mon')S.happy-=10;if(from==='mon')S.happy+=5;const sol=natById('sol'),ava=natById('ava');if(to==='mon'){ava.rel+=10;sol.rel-=10}else if(from==='mon'){sol.rel+=10;ava.rel-=5}
  S.log.unshift({m:S.month,t:`Реформа: страна стала «${GOVS[to].n}».`});return`Теперь у вас ${GOVS[to].n.toLowerCase()}`}
