/* Рынки стран, кризисы, события-запросы, дипломатия и займы. */
function initNations(){return NATDEF.map(d=>({id:d.id,rel:d.rel,pop:d.pop,happy:d.happy,money:d.money,tar:d.tar,deal:0,emb:0,cr:null,
  pv:Object.fromEntries(RK.map(k=>[k,1])),dl:{},sl:{},tarUntil:0,aid:0}))}
const ND=n=>NATDEF.find(d=>d.id===n.id);
const natById=id=>S.nat.find(n=>n.id===id);
function relLabel(r){return r>=50?['Союзник','']:r>=15?['Дружба','']:r>=-15?['Нейтралитет','mid']:r>=-50?['Напряжённость','bad']:['Вражда','bad']}
function crMul(n,k,side){const c=n.cr&&CRISES[n.cr.t];if(!c||!c[side])return 1;return c[side][k]||c[side]['*']||1}
function natBuy(n,k){const d=ND(n);return RES[k].base*(d.dem[k]?1.3:.9)*n.pv[k]*(crMul(n,k,'dem')>1?1.25:1)}
function natSell(n,k){const d=ND(n);return RES[k].base*(d.sup[k]?.85:1.3)*n.pv[k]*(crMul(n,k,'sup')<1?1.5:1)*(n.deal?.92:1)}
function natTariff(n){return n.deal?0:(n.tarUntil>S.month?Math.max(n.tar,.35):n.tar)}
function refreshMarkets(){for(const n of S.nat){const d=ND(n);
  for(const k of RK){n.dl[k]=Math.round((d.dem[k]||8)*crMul(n,k,'dem')*(n.pop/d.pop));n.sl[k]=Math.round((d.sup[k]||0)*crMul(n,k,'sup'))}}}
function canTrade(n){return !n.emb}
function natTick(r){
  const L=t=>S.log.unshift({m:S.month,t});
  for(const n of S.nat){const d=ND(n);
    if(n.cr){if(--n.cr.m<=0){L(`${d.n}: ${CRISES[n.cr.t].end}.`);n.cr=null}}
    else if(Math.random()<.03*(S.diff?DIFF[S.diff].cr:1)){const ks=Object.keys(CRISES),t=ks[Math.floor(Math.random()*ks.length)];n.cr={t,m:4+Math.floor(Math.random()*5)};L(`${d.n}: ${CRISES[t].start}.`)}
    const c=n.cr?CRISES[n.cr.t]:null;
    n.happy+=((d.hb+(c?c.h:0)+(n.money<0?-8:0))-n.happy)*.25+(Math.random()-.5)*2;
    n.pop=Math.max(500,Math.round(n.pop*(1+(n.happy-50)/2500)));
    n.money+=n.pop*(n.happy-42)/60-(c?n.pop*.05:0);
    for(const k of RK)n.pv[k]=Math.max(.8,Math.min(1.25,n.pv[k]+(1-n.pv[k])*.1+(Math.random()-.5)*.08));
    n.rel+=(d.brel-n.rel)*.02+(n.deal?.4:0)-(n.emb?1.5:0)+.15*M('dip');
    if(d.aggr&&!n.deal&&Math.random()<.05){n.rel-=4;L(`${d.n} обвиняет вас в демпинге. Отношения ухудшились.`)}
    n.rel=Math.max(-100,Math.min(100,n.rel));
    if(n.deal&&n.rel<0){n.deal=0;L(`${d.n} разорвал торговый договор: отношения испортились.`)}
  }
  refreshMarkets();
  if(S.ev&&S.month>=S.ev.exp){evAnswer(false,true)}
  if(!S.ev&&S.month>3&&Math.random()<.08)makeEvent();
}
function makeEvent(){
  const opts=[];
  for(const n of S.nat){const d=ND(n);if(n.emb)continue;
    if((n.cr||n.money<15000)&&n.rel>-30)opts.push({t:'loan',nid:n.id,amt:Math.round((1500+Math.random()*3500)/500)*500,rate:.08});
    if(n.rel>=20&&!n.deal)opts.push({t:'deal',nid:n.id});
    if(d.aggr&&!n.deal&&S.tax.imp>.05&&n.tarUntil<=S.month)opts.push({t:'tariff',nid:n.id});
    if(n.cr&&CRISES[n.cr.t].ref)opts.push({t:'ref',nid:n.id,amt:20+Math.floor(Math.random()*40)});
  }
  if(!opts.length)return;const e=opts[Math.floor(Math.random()*opts.length)];e.exp=S.month+6;S.ev=e;
}
function evText(e){const d=ND(natById(e.nid));
  if(e.t==='loan')return[`${d.n} просит заём`,`${d.full} просит ${fmt(e.amt)} кр на 12 месяцев под ${Math.round(e.rate*100)}%. Отказ испортит отношения.`,'Дать заём','Отказать'];
  if(e.t==='deal')return[`${d.n} предлагает договор`,`Торговый договор: взаимные пошлины обнуляются, их товары дешевле на 8%, отношения растут каждый месяц.`,'Подписать','Отклонить'];
  if(e.t==='tariff')return[`Ультиматум ${d.n==='Кардон'?'Кардона':d.n}`,`${d.full} требует снизить вашу импортную пошлину до 5%. Иначе на год поднимет пошлину на ваши товары до 35%.`,'Уступить','Отказать'];
  return[`Беженцы из ${d.n==='Авалис'?'Авалиса':d.n==='Кардон'?'Кардона':'Солмара'}`,`${e.amt} человек просят убежища. Это рабочие руки, но им нужно жильё.`,'Принять','Отказать'];
}
function evAnswer(yes,silent){
  const e=S.ev;if(!e)return;const n=natById(e.nid),d=ND(n),L=t=>S.log.unshift({m:S.month,t});S.ev=null;
  if(e.t==='loan'){if(yes&&S.money>=e.amt){S.money-=e.amt;n.money+=e.amt;S.lent.push({nid:n.id,left:Math.round(e.amt*(1+e.rate)),pay:Math.round(e.amt*(1+e.rate)/12)});n.rel+=10;L(`Вы одолжили ${d.n} ${fmt(e.amt)} кр.`)}
    else{n.rel-=5;if(!silent)L(`Вы отказали ${d.n} в займе.`)}}
  else if(e.t==='deal'){if(yes){n.deal=1;n.rel+=5;L(`Подписан торговый договор с ${d.n}.`)}}
  else if(e.t==='tariff'){if(yes){S.tax.imp=Math.min(S.tax.imp,.05);n.rel+=6;L(`Вы уступили ${d.n}: импортная пошлина снижена до 5%.`)}
    else{n.tarUntil=S.month+12;n.rel-=10;L(`${d.n} поднял пошлину на ваши товары до 35% на год.`)}}
  else if(e.t==='ref'){if(yes){S.pop+=e.amt;n.pop-=e.amt;n.rel+=6;L(`Приняты ${e.amt} беженцев из ${d.n}.`)}else n.rel-=4}
  n.rel=Math.max(-100,Math.min(100,n.rel));
}
/* diplomacy actions: return message */
function debtTotal(){return S.loans.reduce((a,l)=>a+l.left,0)}
function borrowRate(n){return Math.max(.02,ND(n).rate-.005*M('dip'))+Math.max(0,-n.rel)/400+debtTotal()/60000}
function dip(act,id,amt){
  const n=natById(id),d=ND(n),L=t=>S.log.unshift({m:S.month,t});
  if(act==='deal'){if(n.deal){n.deal=0;n.rel-=8;L(`Вы расторгли договор с ${d.n}.`);return'Договор расторгнут'}
    if(n.emb)return'Сначала снимите эмбарго';if(n.rel<25)return`${d.n} согласится на договор при отношениях от 25`;n.deal=1;L(`Подписан торговый договор с ${d.n}.`);return'Договор подписан'}
  if(act==='emb'){n.emb=n.emb?0:1;if(n.emb){n.rel-=25;n.deal=0;L(`Вы ввели эмбарго против ${d.n}.`);return'Эмбарго введено'}L(`Эмбарго против ${d.n} снято.`);return'Эмбарго снято'}
  if(act==='aid'){if(S.money<1000)return'Не хватает денег';S.money-=1000;n.money+=1000;const g=Math.max(2,10-n.aid*2);n.rel=Math.min(100,n.rel+g);n.aid++;L(`Помощь ${d.n}: 1 000 кр.`);return`Отношения +${g}`}
  if(act==='borrow'){if(n.rel<-30)return`${d.n} не даёт займов врагам`;if(n.money<amt*3)return`У ${d.n} нет таких денег`;
    const rate=borrowRate(n),tot=Math.round(amt*(1+rate*2));S.money+=amt;n.money-=amt;S.loans.push({nid:n.id,left:tot,pay:Math.round(tot/24)});
    L(`Заём у ${d.n}: ${fmt(amt)} кр под ${Math.round(rate*100)}% годовых на 2 года.`);return`Получено ${fmt(amt)} кр`}
  if(act==='lend'){if(S.money<amt)return'Не хватает денег';S.money-=amt;n.money+=amt;const tot=Math.round(amt*1.08);S.lent.push({nid:n.id,left:tot,pay:Math.round(tot/12)});n.rel=Math.min(100,n.rel+6);
    L(`Вы одолжили ${d.n} ${fmt(amt)} кр под 8% на год.`);return'Заём выдан'}
}
