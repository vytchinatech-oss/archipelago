/* Рынки стран, кризисы, события-запросы, дипломатия и займы. */
function initNations(){return NATDEF.map(d=>({id:d.id,rel:d.rel,pop:d.pop,happy:d.happy,money:d.money,tar:d.tar,deal:0,emb:0,cr:null,
  pv:Object.fromEntries(RK.map(k=>[k,1])),dl:{},sl:{},tarUntil:0,aid:0,actAt:-99,xy:{},my:{}}))}
const ND=n=>NATDEF.find(d=>d.id===n.id);
const natById=id=>S.nat.find(n=>n.id===id);
function relLabel(r){return r>=RELK.ally?['Союзник','']:r>=RELK.friend?['Дружба','']:r>=RELK.neutral?['Нейтралитет','mid']:r>=RELK.tense?['Напряжённость','bad']:['Вражда','bad']}
function crMul(n,k,side){const c=n.cr&&CRISES[n.cr.t];if(!c||!c[side])return 1;return c[side][k]||c[side]['*']||1}
function natBuy(n,k){const d=ND(n);return RES[k].base*(d.dem[k]?NATK.buyNeed:NATK.buyOther)*n.pv[k]*(crMul(n,k,'dem')>1?NATK.buyCrisis:1)}
function natSell(n,k){const d=ND(n);return RES[k].base*(d.sup[k]?NATK.sellHave:NATK.sellNone)*n.pv[k]*(crMul(n,k,'sup')<1?NATK.sellCrisis:1)*(n.deal?NATK.sellDeal:1)}
function natTariff(n){return n.deal?0:(n.tarUntil>S.month?Math.max(n.tar,EVX.tariff.hike):n.tar)}
function refreshMarkets(){for(const n of S.nat){const d=ND(n);
  for(const k of RK){n.dl[k]=Math.round((d.dem[k]||NATK.demOther)*crMul(n,k,'dem')*(n.pop/d.pop));n.sl[k]=Math.round((d.sup[k]||0)*crMul(n,k,'sup'))}}}
function canTrade(n){return !n.emb}
/* Месячный итог казны соседа. */
function natBal(n){return n.pop*(n.happy-NATK.balHappy)/NATK.balDiv-(n.cr?n.pop*NATK.balCrisis:0)}
/* Торговля за последний год: скользящая сумма по ресурсам. */
function tradeYear(y,cur){for(const k of new Set([...Object.keys(y),...Object.keys(cur||{})])){y[k]=(y[k]||0)*DIPL.decay+(cur&&cur[k]||0);if(y[k]<1)delete y[k]}}
const sumV=o=>Object.values(o).reduce((a,v)=>a+v,0);
/* Главные ресурсы в торговле, словами: «железо и уголь». */
function topNames(o,ks){const t=(ks||Object.keys(o)).filter(k=>o[k]>=1).sort((a,b)=>o[b]-o[a]).slice(0,2).map(k=>RES[k].n.toLowerCase());return t.join(' и ')}
const natHard=n=>{const b=natBal(n);return n.money<DIPL.poor||(b<0&&n.money<-b*DIPL.hardMonths)};
const hasPort=()=>S.bld.some(b=>b&&b.t==='port');
const crisisNeg=n=>n.cr&&CRISES[n.cr.t].h<0?CRISES[n.cr.t].n:'';
function natTick(r){
  const L=t=>S.log.unshift({m:S.month,t});
  for(const n of S.nat){const d=ND(n);
    tradeYear(n.xy,r.xn[n.id]);tradeYear(n.my,r.mn[n.id]);
    if(n.cr){if(--n.cr.m<=0){L(`${d.n}: ${CRISES[n.cr.t].end}.`);n.cr=null}}
    else if(Math.random()<NATK.crisis*(S.diff?DIFF[S.diff].cr:1)){const ks=Object.keys(CRISES),t=ks[Math.floor(Math.random()*ks.length)];n.cr={t,m:NATK.crisisMin+Math.floor(Math.random()*NATK.crisisRand)};L(`${d.n}: ${CRISES[t].start}.`)}
    const c=n.cr?CRISES[n.cr.t]:null;
    n.happy+=((d.hb+(c?c.h:0)+(n.money<0?NATK.brokeHappy:0))-n.happy)*NATK.happySpeed+(Math.random()-.5)*NATK.happyNoise;
    n.pop=Math.max(NATK.popMin,Math.round(n.pop*(1+(n.happy-NATK.popMid)/NATK.popDiv)));
    n.money+=natBal(n);
    for(const k of RK)n.pv[k]=Math.max(NATK.pvMin,Math.min(NATK.pvMax,n.pv[k]+(1-n.pv[k])*NATK.pvSpeed+(Math.random()-.5)*NATK.pvNoise));
    n.rel+=(d.brel-n.rel)*NATK.relSpeed+(n.deal?NATK.dealRel:0)-(n.emb?NATK.embRel:0)+MINK.dipRel*M('dip')-(d.aggr&&!n.deal?DIPL.aggrDrift:0);
    n.rel=Math.max(-RELK.max,Math.min(RELK.max,n.rel));
    if(n.deal&&n.rel<RELK.dealBreak){n.deal=0;L(`${d.n} разорвал торговый договор: отношения испортились.`)}
  }
  refreshMarkets();
  if(S.ev&&S.month>=S.ev.exp){evAnswer(false,true)}
  if(!S.ev&&S.month>EVG.firstMonth&&S.month-S.evAt>=DIPL.evGap&&Math.random()<DIPL.evChance)makeEvent();
}
/* Каждое сообщение появляется только при настоящей причине и несёт в себе цифры этой причины. */
function makeEvent(){
  const opts=[],MT=DIPL.minTrade,port=hasPort(),rep=S.rep,cap=rep?rep.cen.cap:300,allX={};
  for(const n of S.nat)for(const k in n.xy)allX[k]=(allX[k]||0)+n.xy[k];
  for(const n of S.nat){const d=ND(n);if(n.emb)continue;
    const add=(t,o)=>opts.push(Object.assign({t,nid:n.id,r:1},o)),xv=sumV(n.xy),mv=sumV(n.my),bal=natBal(n),cn=crisisNeg(n),C=n.cr?CRISES[n.cr.t]:null;
    if(natHard(n)&&n.rel>=EVX.loan.from)add('loan',{amt:Math.max(EVX.loan.min,Math.min(EVX.loan.max,Math.round(Math.abs(Math.min(bal,0))*EVX.loan.months/EVX.loan.round)*EVX.loan.round)),rate:DIPA.lendRate,cn,bal:Math.round(bal),cash:Math.round(n.money)});
    if(n.rel>=EVX.deal.from&&!n.deal&&xv+mv>=MT)add('deal',{xv,mv,paid:Math.round(xv*natTariff(n)/(1-natTariff(n)))});
    if(d.aggr&&!n.deal&&S.tax.imp>EVX.tariff.imp&&n.tarUntil<=S.month&&mv>=MT&&xv>=MT)add('tariff',{xv,mv,duty:Math.round(mv*S.tax.imp),pct:Math.round(S.tax.imp*100),mw:topNames(n.my),xw:topNames(n.xy)});
    if(C&&C.ref&&S.happy>n.happy)add('ref',{amt:EVX.ref.min+Math.floor(Math.random()*EVX.ref.rand),cn});
    if(port&&n.rel>EVN.order.from)for(const k of Object.keys(d.dem)){const amt=Math.floor(Math.min(S.stock[k],EVN.order.cap)/EVN.order.round)*EVN.order.round,price=Math.round(natBuy(n,k)*EVN.order.mul);
      if(amt>=EVN.order.min&&n.money>amt*price)add('order',{k,amt,price,why:crMul(n,k,'dem')>1?`Причина: ${C.n}, спрос подскочил.`:n.xy[k]?`Они уже берут это у вас, но им не хватает.`:`Своего у них нет, а на рынке дефицит.`})}
    if(port&&n.rel>EVN.bargain.from)for(const k of Object.keys(d.sup)){const amt=EVN.bargain.amt,price=Math.max(1,Math.round(natSell(n,k)*EVN.bargain.mul)),use=rep?rep.cons[k]||0:0,low=use>0&&S.stock[k]<use*EVN.bargain.lowMonths;
      if(crMul(n,k,'sup')>=1&&(n.my[k]||low)&&S.stock[k]+amt<=cap&&S.money>=amt*price*EVN.bargain.cashK)add('bargain',{k,amt,price,why:n.my[k]?'Вы и так закупаете это у них, а сейчас их склады переполнены.':'У вас запас на исходе, у них избыток.'})}
    if(C&&C.relief&&n.rel>EVN.relief.from&&S.stock[C.relief.k]>=EVN.relief.amt*EVN.relief.keep)add('relief',{k:C.relief.k,amt:EVN.relief.amt,why:C.relief.why});
    if(n.rel>EVN.summit.from&&n.rel<EVN.summit.to&&!n.deal&&S.money>=EVN.summit.cost*EVN.summit.cashK&&S.month-(n.sumAt??-99)>=EVN.summit.gap)add('summit',{rel0:Math.round(n.rel)});
    const rivals=Object.keys(n.xy).filter(k=>d.sup[k]),rv=rivals.reduce((a,k)=>a+n.xy[k],0);
    if((d.aggr||n.rel<0)&&!n.deal&&rv>=MT)add('dumping',{xv:rv,what:topNames(n.xy,rivals),cost:Math.max(EVN.dumping.min,Math.min(EVN.dumping.max,Math.round(rv*EVN.dumping.share/50)*50))});
    if(n.rel<EVN.border.below&&port&&sumV(allX)>=MT)add('border',{what:topNames(allX)});
    const l=S.lent.find(x=>x.nid===n.id);if(l&&l.left>=EVN.debt.min&&natHard(n))add('debt',{amt:Math.round(l.left*EVN.debt.share),left:l.left,cn,cash:Math.round(n.money)});
    if(n.rel>=EVN.mediate.from){const o=S.nat.find(x=>x.id!==n.id&&!!ND(x).aggr!==!!d.aggr&&sumV(x.xy)+sumV(x.my)>=MT);if(o)add('mediate',{oid:o.id,ov:sumV(o.xy)+sumV(o.my)})}
    if(!n.met&&S.month<=EVN.envoy.until)add('envoy',{});
  }
  /* Сначала выбираем вид сообщения, потом страну: так частые виды не вытесняют редкие. Недавние виды не повторяем. */
  const all=[...new Set(opts.map(o=>o.t))],H=S.evHist;
  /* Если нового сказать нечего, лучше промолчать, чем повториться: самый старый вид снова станет доступен. */
  const ts=all.filter(t=>!H.includes(t));if(!ts.length){H.shift();return}
  const t=ts[Math.floor(Math.random()*ts.length)],same=opts.filter(o=>o.t===t),fresh=same.filter(o=>o.nid!==S.evNid),pool=fresh.length?fresh:same;
  const e=pool[Math.floor(Math.random()*pool.length)];e.exp=S.month+EVG.answerMonths;S.ev=e;if(e.t==='envoy')natById(e.nid).met=1;if(e.t==='summit')natById(e.nid).sumAt=S.month;
  S.evAt=S.month;S.evNid=e.nid;H.push(t);while(H.length>DIPL.noRepeat)H.shift();
}
/* Чего не хватает, чтобы согласиться; пустая строка — хватает всего. */
function evLack(e){const X=EVN[e.t],sum=e.amt*e.price;
  if(e.t==='loan'&&S.money<e.amt)return'Не хватает денег';
  if(e.t==='bargain'&&S.money<sum)return'Не хватает денег';
  if((e.t==='summit'||e.t==='dumping'||e.t==='envoy')&&S.money<(e.cost||X.cost))return'Не хватает денег';
  if(e.t==='order'&&S.stock[e.k]<e.amt)return`На складах нет столько: ${RES[e.k].n.toLowerCase()}`;
  if(e.t==='relief'&&S.stock[e.k]<e.amt)return`На складах нет столько: ${RES[e.k].n.toLowerCase()}`;
  if(e.t==='debt'&&!S.lent.some(l=>l.nid===e.nid))return'Этот долг уже погашен';
  return''}
/* Совет министра дипломатии: соглашаться или нет. */
function evWise(e,risk,c){const n=natById(e.nid),X=EVN[e.t],m=risk?EVG.wiseRisk:EVG.wiseSafe,k=m*2-1;
  if(e.t==='deal'||e.t==='envoy')return true;
  if(e.t==='loan')return S.money>e.amt*m;
  if(e.t==='tariff'||e.t==='border')return !risk;
  if(e.t==='ref')return c.home-S.pop>e.amt*(risk?EVX.ref.riskRoom:1);
  if(e.t==='order')return S.stock[e.k]>=e.amt*EVN.order.wise;
  if(e.t==='bargain')return S.money>e.amt*e.price*m;
  if(e.t==='relief')return S.stock[e.k]>e.amt*EVN.relief.wise;
  if(e.t==='summit'||e.t==='dumping')return S.money>(e.cost||X.cost)*k;
  if(e.t==='debt')return S.money>EVN.debt.wise;
  if(e.t==='mediate')return n.rel-natById(e.oid).rel>EVN.mediate.wise;
  return false}
/* «вы продали им на 1 200 кр и купили на 800 кр» — без нулевых половин. */
const tradeWords=(xv,mv)=>[xv>=1?`продали им на ${fmt(xv)} кр`:'',mv>=1?`купили у них на ${fmt(mv)} кр`:''].filter(Boolean).join(' и ');
function evText(e){const n=natById(e.nid),d=ND(n),res=e.k?RES[e.k].n.toLowerCase():'',sum=e.amt*e.price;
  if(e.t==='loan')return[`${d.n} просит заём`,`${e.cn?`В стране ${e.cn}.`:e.bal<0?'Расходы страны выше доходов.':'Казна опустела после крупных закупок.'} Денег осталось ${fmt(e.cash)} кр${e.bal<0?`, каждый месяц минус ${fmt(-e.bal)} кр`:''}. ${d.full} просит ${fmt(e.amt)} кр на ${DIPA.lendMonths} месяцев под ${Math.round(e.rate*100)}%. Отказ испортит отношения.`,'Дать заём','Отказать'];
  if(e.t==='deal')return[`${d.n} предлагает договор`,`За год вы ${tradeWords(e.xv,e.mv)}.${e.paid>0?` Их пошлина обошлась вашим купцам в ${fmt(e.paid)} кр.`:''} Договор обнуляет взаимные пошлины, их товары станут дешевле на ${Math.round((1-NATK.sellDeal)*100)}%.`,'Подписать','Отклонить'];
  if(e.t==='order')return[`Срочный заказ из ${d.gen}`,`${e.why} ${d.full} покупает партию: ${res}, ${e.amt} ед. по ${e.price} кр. Всего ${fmt(sum)} кр сразу и без пошлин.`,'Продать','Отказать'];
  if(e.t==='bargain')return[`Скидка от ${d.gen}`,`${e.why} ${d.full} предлагает: ${res}, ${e.amt} ед. по ${e.price} кр. Всего ${fmt(sum)} кр.`,'Купить','Не нужно'];
  if(e.t==='relief')return[`${d.n} просит помощи`,`${e.why} Просят прислать безвозмездно: ${res}, ${e.amt} ед.`,'Отправить','Отказать'];
  if(e.t==='summit')return[d.fest[0],`${d.fest[1]} Там решаются торговые дела: для договора нужны отношения от ${EVN.summit.to}, сейчас ${e.rel0}. Поездка обойдётся в ${fmt(EVN.summit.cost)} кр.`,'Послать делегацию','Не поедем'];
  if(e.t==='dumping')return[`${d.n} обвиняет вас в демпинге`,`За год к ним ушло на ${fmt(e.xv)} кр вашего товара: ${e.what}. Это то, что они производят сами, и местные заводы теряют покупателей. ${d.full} требует ${fmt(e.cost)} кр отступных.`,'Заплатить','Отвергнуть'];
  if(e.t==='border')return['Инцидент в проливе',`Отношения натянуты, и патруль ${d.gen} задержал ваше судно с грузом: ${e.what}. ${d.n} требует извинений за нарушение вод. Военным уступка не понравится.`,'Извиниться','Отказать'];
  if(e.t==='debt')return[`${d.n} просит простить долг`,`${e.cn?`В стране ${e.cn}, в`:'В'} казне ${fmt(e.cash)} кр, а вам должны ещё ${fmt(e.left)} кр. Просят списать ${fmt(e.amt)} кр.`,'Простить','Напомнить о долге'];
  if(e.t==='mediate'){const o=ND(natById(e.oid));return[`${d.n} ищет поддержки`,`Спор с ${o.ins} о торговых путях зашёл далеко. Вы торгуете с ${o.ins} на ${fmt(e.ov)} кр в год, поэтому к вашему слову прислушаются. ${d.n} просит встать на его сторону.`,'Поддержать','Остаться в стороне']}
  if(e.t==='envoy')return[`Посол из ${d.gen}`,`${d.full} признаёт вашу молодую страну и предлагает обменяться послами. Посольство обойдётся в ${fmt(EVN.envoy.cost)} кр.`,'Обменяться','Не сейчас'];
  if(e.t==='tariff')return[`Ультиматум ${d.gen}`,`За год вы купили у них на ${fmt(e.mv)} кр (${e.mw}) и взяли пошлину ${e.pct}%, это ${fmt(e.duty)} кр. ${d.n} требует снизить её до ${Math.round(EVX.tariff.to*100)}%. Иначе на год поднимет пошлину на ваш вывоз до ${Math.round(EVX.tariff.hike*100)}%, а к ним уходит на ${fmt(e.xv)} кр (${e.xw}).`,'Уступить','Отказать'];
  return[`Беженцы из ${d.gen}`,`В стране ${e.cn}, люди бегут туда, где спокойнее. ${e.amt} человек просят убежища. Это рабочие руки, но им нужно жильё.`,'Принять','Отказать'];
}
function evAnswer(yes,silent){
  const e=S.ev;if(!e)return;const n=natById(e.nid),d=ND(n),L=t=>S.log.unshift({m:S.month,t});S.ev=null;
  if(e.t==='loan'){if(yes&&S.money>=e.amt){lendTo(n,e.amt);L(`Вы одолжили ${d.n} ${fmt(e.amt)} кр.`)}
    else{n.rel+=EVX.loan.no;if(!silent)L(`Вы отказали ${d.n} в займе.`)}}
  else if(e.t==='deal'){if(yes){signDeal(n);L(`Подписан торговый договор с ${d.n}.`)}}
  else if(e.t==='tariff'){if(yes){S.tax.imp=Math.min(S.tax.imp,EVX.tariff.to);n.rel+=EVX.tariff.yes;L(`Вы уступили ${d.n}: импортная пошлина снижена до ${Math.round(EVX.tariff.to*100)}%.`)}
    else{n.tarUntil=S.month+EVX.tariff.term;n.rel+=EVX.tariff.no;L(`${d.n} поднял пошлину на ваши товары до ${Math.round(EVX.tariff.hike*100)}% на год.`)}}
  else if(e.t==='ref'){if(yes){S.pop+=e.amt;n.pop-=e.amt;n.rel+=EVX.ref.yes;L(`Приняты ${e.amt} беженцев из ${d.n}.`)}else n.rel+=EVX.ref.no}
  else{const X=EVN[e.t],ok=yes&&!evLack(e),sum=e.amt*e.price;n.rel+=X.rel[ok?0:1];
    if(ok){
      if(e.t==='order'){S.stock[e.k]-=e.amt;S.money+=sum;n.money-=sum;L(`${d.n}: партия продана за ${fmt(sum)} кр.`)}
      else if(e.t==='bargain'){S.money-=sum;n.money+=sum;S.stock[e.k]+=e.amt;L(`${d.n}: партия куплена за ${fmt(sum)} кр.`)}
      else if(e.t==='relief'){S.stock[e.k]-=e.amt;L(`${d.n}: отправлена помощь, ${RES[e.k].n.toLowerCase()} ${e.amt} ед.`)}
      else if(e.t==='summit'){S.money-=X.cost;L(`${d.fest[0]}: делегация принята.`)}
      else if(e.t==='dumping'){S.money-=e.cost;n.money+=e.cost;L(`${d.n}: отступные выплачены.`)}
      else if(e.t==='envoy'){S.money-=X.cost;L(`${d.n}: обменялись послами.`)}
      else if(e.t==='border'){if(S.fac&&S.fac.mil)S.fac.mil.sat=Math.max(0,S.fac.mil.sat-X.mil);L(`${d.n}: вы принесли извинения.`)}
      else if(e.t==='debt'){const l=S.lent.find(x=>x.nid===n.id);l.left=Math.max(1,l.left-e.amt);L(`${d.n}: списано ${fmt(e.amt)} кр долга.`)}
      else if(e.t==='mediate'){const o=natById(e.oid);o.rel=Math.max(-RELK.max,Math.min(RELK.max,o.rel+X.other));L(`Вы поддержали ${d.n} в споре с ${ND(o).ins}.`)}
    }else if(!silent)L(`${d.n}: вы отказали.`)}
  n.rel=Math.max(-RELK.max,Math.min(RELK.max,n.rel));
}
/* Сколько месяцев ждать следующего обращения к стране. */
function dipWait(n){return Math.max(0,n.actAt+DIPL.actGap-S.month)}
/* diplomacy actions: return message */
/* Договор и заём соседу: одна функция и один эффект для кнопки, сообщения и министра (стандарт СТ4). */
function signDeal(n){n.deal=1;n.rel=Math.min(RELK.max,n.rel+DIPA.dealRel)}
function lendTo(n,amt){S.money-=amt;n.money+=amt;const tot=Math.round(amt*(1+DIPA.lendRate));S.lent.push({nid:n.id,left:tot,pay:Math.round(tot/DIPA.lendMonths)});n.rel=Math.min(RELK.max,n.rel+DIPA.lendRel)}
const aidGain=n=>Math.max(DIPA.aidMin,DIPA.aidMax-n.aid*DIPA.aidStep);
function debtTotal(){return S.loans.reduce((a,l)=>a+l.left,0)}
function borrowRate(n){return Math.max(DIPA.rateMin,ND(n).rate-MINK.dipRate*M('dip'))+Math.max(0,-n.rel)/DIPA.rateRel+debtTotal()/DIPA.rateDebt}
function dip(act,id,amt){
  /* Год отсчитывается только от удавшегося обращения: всё удачное пишется в журнал через L, отказы — нет. */
  const n=natById(id),d=ND(n),L=t=>{S.log.unshift({m:S.month,t});n.actAt=S.month},w=dipWait(n);
  if(w>0)return`${d.n}: следующее обращение через ${w} ${plural(w,'месяц','месяца','месяцев')}`;
  if(act==='deal'){if(n.deal){n.deal=0;n.rel+=DIPA.dealCancel;L(`Вы расторгли договор с ${d.n}.`);return'Договор расторгнут'}
    if(n.emb)return'Сначала снимите эмбарго';if(n.rel<RELK.friend)return`${d.n} согласится на договор при отношениях от ${RELK.friend}`;signDeal(n);L(`Подписан торговый договор с ${d.n}.`);return'Договор подписан'}
  if(act==='emb'){n.emb=n.emb?0:1;if(n.emb){n.rel+=DIPA.embargo;n.deal=0;L(`Вы ввели эмбарго против ${d.n}.`);return'Эмбарго введено'}L(`Эмбарго против ${d.n} снято.`);return'Эмбарго снято'}
  if(act==='aid'){if(S.money<DIPA.aidCost)return'Не хватает денег';S.money-=DIPA.aidCost;n.money+=DIPA.aidCost;const g=aidGain(n);n.rel=Math.min(RELK.max,n.rel+g);n.aid++;L(`Помощь ${d.n}: ${fmt(DIPA.aidCost)} кр.`);return`Отношения +${g}`}
  if(act==='borrow'){if(n.rel<DIPA.borrowFrom)return`${d.n} не даёт займов врагам`;if(n.money<amt*DIPA.borrowCash)return`У ${d.n} нет таких денег`;
    const rate=borrowRate(n),tot=Math.round(amt*(1+rate*DIPA.borrowYears));S.money+=amt;n.money-=amt;S.loans.push({nid:n.id,left:tot,pay:Math.round(tot/DIPA.borrowMonths)});
    L(`Заём у ${d.n}: ${fmt(amt)} кр под ${Math.round(rate*100)}% годовых на ${DIPA.borrowYears} года.`);return`Получено ${fmt(amt)} кр`}
  if(act==='lend'){if(S.money<amt)return'Не хватает денег';lendTo(n,amt);
    L(`Вы одолжили ${d.n} ${fmt(amt)} кр под ${Math.round(DIPA.lendRate*100)}% на год.`);return'Заём выдан'}
}
