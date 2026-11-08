/* Рынки стран, кризисы, события-запросы, дипломатия и займы. */
function initNations(){return NATDEF.map(d=>({id:d.id,rel:d.rel,pop:d.pop,happy:d.happy,money:d.money,tar:d.tar,deal:0,emb:0,cr:null,
  pv:Object.fromEntries(RK.map(k=>[k,1])),dl:{},sl:{},tarUntil:0,aid:0,actAt:-99}))}
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
    n.rel+=(d.brel-n.rel)*.02+(n.deal?.4:0)-(n.emb?1.5:0)+.15*M('dip')-(d.aggr&&!n.deal?DIPL.aggrDrift:0);
    n.rel=Math.max(-100,Math.min(100,n.rel));
    if(n.deal&&n.rel<0){n.deal=0;L(`${d.n} разорвал торговый договор: отношения испортились.`)}
  }
  refreshMarkets();
  if(S.ev&&S.month>=S.ev.exp){evAnswer(false,true)}
  if(!S.ev&&S.month>3&&S.month-S.evAt>=DIPL.evGap&&Math.random()<DIPL.evChance)makeEvent();
}
function makeEvent(){
  const opts=[];
  for(const n of S.nat){const d=ND(n);if(n.emb)continue;
    if((n.cr||n.money<15000)&&n.rel>-30)opts.push({t:'loan',nid:n.id,amt:Math.round((1500+Math.random()*3500)/500)*500,rate:.08});
    if(n.rel>=20&&!n.deal)opts.push({t:'deal',nid:n.id});
    if(d.aggr&&!n.deal&&S.tax.imp>.05&&n.tarUntil<=S.month)opts.push({t:'tariff',nid:n.id});
    if(n.cr&&CRISES[n.cr.t].ref)opts.push({t:'ref',nid:n.id,amt:20+Math.floor(Math.random()*40)});
    const cap=S.rep?S.rep.cen.cap:300;
    if(n.rel>-50)for(const k of Object.keys(d.dem)){const amt=Math.floor(Math.min(S.stock[k],60)/5)*5,price=Math.round(natBuy(n,k)*EVN.order.mul);if(amt>=EVN.order.min&&n.money>amt*price)opts.push({t:'order',nid:n.id,k,amt,price})}
    if(n.rel>-30)for(const k of Object.keys(d.sup)){const amt=EVN.bargain.amt,price=Math.max(1,Math.round(natSell(n,k)*EVN.bargain.mul));if(S.stock[k]+amt<=cap&&S.money>=amt*price*2)opts.push({t:'bargain',nid:n.id,k,amt,price})}
    if(n.cr&&!CRISES[n.cr.t].ref&&CRISES[n.cr.t].h<0&&n.rel>-30&&S.stock.food>=EVN.relief.amt*2)opts.push({t:'relief',nid:n.id,amt:EVN.relief.amt,cn:CRISES[n.cr.t].n});
    if(n.rel>-40&&S.money>=EVN.summit.cost*2)opts.push({t:'summit',nid:n.id});
    if(d.aggr&&!n.deal)opts.push({t:'dumping',nid:n.id});
    if(n.rel<-10)opts.push({t:'border',nid:n.id});
    const l=S.lent.find(x=>x.nid===n.id);if(l&&l.left>=EVN.debt.min&&(n.cr||n.money<15000))opts.push({t:'debt',nid:n.id,amt:Math.round(l.left*EVN.debt.share)});
    if(n.rel>=0){const o=S.nat.find(x=>x.id!==n.id&&!!ND(x).aggr!==!!d.aggr);if(o)opts.push({t:'mediate',nid:n.id,oid:o.id})}
  }
  /* Сначала выбираем вид сообщения, потом страну: так частые виды не вытесняют редкие. Недавние виды не повторяем. */
  const all=[...new Set(opts.map(o=>o.t))],H=S.evHist;
  let ts=all.filter(t=>!H.includes(t));if(!ts.length)ts=all.filter(t=>t!==H[H.length-1]);if(!ts.length)return;
  const t=ts[Math.floor(Math.random()*ts.length)],same=opts.filter(o=>o.t===t),fresh=same.filter(o=>o.nid!==S.evNid),pool=fresh.length?fresh:same;
  const e=pool[Math.floor(Math.random()*pool.length)];e.exp=S.month+6;S.ev=e;
  S.evAt=S.month;S.evNid=e.nid;H.push(t);while(H.length>DIPL.noRepeat)H.shift();
}
/* Чего не хватает, чтобы согласиться; пустая строка — хватает всего. */
function evLack(e){const X=EVN[e.t],sum=e.amt*e.price;
  if(e.t==='loan'&&S.money<e.amt)return'Не хватает денег';
  if(e.t==='bargain'&&S.money<sum)return'Не хватает денег';
  if((e.t==='summit'||e.t==='dumping')&&S.money<X.cost)return'Не хватает денег';
  if(e.t==='order'&&S.stock[e.k]<e.amt)return`На складах нет столько: ${RES[e.k].n.toLowerCase()}`;
  if(e.t==='relief'&&S.stock.food<e.amt)return'На складах нет столько еды';
  if(e.t==='debt'&&!S.lent.some(l=>l.nid===e.nid))return'Этот долг уже погашен';
  return''}
/* Совет министра дипломатии: соглашаться или нет. */
function evWise(e,risk,c){const n=natById(e.nid),X=EVN[e.t],m=risk?1.5:3,k=m*2-1;
  if(e.t==='deal')return true;
  if(e.t==='loan')return S.money>e.amt*m;
  if(e.t==='tariff'||e.t==='border')return !risk;
  if(e.t==='ref')return c.home-S.pop>e.amt*(risk?.3:1);
  if(e.t==='order')return S.stock[e.k]>=e.amt*1.5;
  if(e.t==='bargain')return S.money>e.amt*e.price*m;
  if(e.t==='relief')return S.stock.food>e.amt*3;
  if(e.t==='summit'||e.t==='dumping')return S.money>X.cost*k;
  if(e.t==='debt')return S.money>5000;
  if(e.t==='mediate')return n.rel-natById(e.oid).rel>20;
  return false}
function evText(e){const d=ND(natById(e.nid));
  if(e.t==='loan')return[`${d.n} просит заём`,`${d.full} просит ${fmt(e.amt)} кр на 12 месяцев под ${Math.round(e.rate*100)}%. Отказ испортит отношения.`,'Дать заём','Отказать'];
  if(e.t==='deal')return[`${d.n} предлагает договор`,`Торговый договор: взаимные пошлины обнуляются, их товары дешевле на 8%, отношения растут каждый месяц.`,'Подписать','Отклонить'];
  const res=e.k?RES[e.k].n.toLowerCase():'',sum=e.amt*e.price;
  if(e.t==='order')return[`Срочный заказ из ${d.gen}`,`${d.full} покупает партию: ${res}, ${e.amt} ед. по ${e.price} кр. Всего ${fmt(sum)} кр сразу и без пошлин.`,'Продать','Отказать'];
  if(e.t==='bargain')return[`Скидка от ${d.gen}`,`${d.full} распродаёт запасы: ${res}, ${e.amt} ед. по ${e.price} кр. Всего ${fmt(sum)} кр.`,'Купить','Не нужно'];
  if(e.t==='relief')return[`${d.n} просит помощи`,`В стране ${e.cn}. Просят прислать ${e.amt} ед. еды безвозмездно.`,'Отправить','Отказать'];
  if(e.t==='summit')return[d.fest[0],`${d.fest[1]} Поездка обойдётся в ${fmt(EVN.summit.cost)} кр.`,'Послать делегацию','Не поедем'];
  if(e.t==='dumping')return[`${d.n} обвиняет вас в демпинге`,`${d.full} заявляет, что ваши товары разоряют его заводы, и требует ${fmt(EVN.dumping.cost)} кр отступных.`,'Заплатить','Отвергнуть'];
  if(e.t==='border')return['Инцидент в проливе',`Патруль ${d.gen} задержал ваше торговое судно, и теперь ${d.n} требует извинений. Военным уступка не понравится.`,'Извиниться','Отказать'];
  if(e.t==='debt')return[`${d.n} просит простить долг`,`Страна не справляется с выплатами и просит списать ${fmt(e.amt)} кр из своего долга.`,'Простить','Напомнить о долге'];
  if(e.t==='mediate')return[`${d.n} ищет поддержки`,`Спор с ${ND(natById(e.oid)).ins} о рыбных промыслах зашёл далеко. ${d.n} просит встать на его сторону.`,'Поддержать','Остаться в стороне'];
  if(e.t==='tariff')return[`Ультиматум ${d.gen}`,`${d.full} требует снизить вашу импортную пошлину до 5%. Иначе на год поднимет пошлину на ваши товары до 35%.`,'Уступить','Отказать'];
  return[`Беженцы из ${d.gen}`,`${e.amt} человек просят убежища. Это рабочие руки, но им нужно жильё.`,'Принять','Отказать'];
}
function evAnswer(yes,silent){
  const e=S.ev;if(!e)return;const n=natById(e.nid),d=ND(n),L=t=>S.log.unshift({m:S.month,t});S.ev=null;
  if(e.t==='loan'){if(yes&&S.money>=e.amt){S.money-=e.amt;n.money+=e.amt;S.lent.push({nid:n.id,left:Math.round(e.amt*(1+e.rate)),pay:Math.round(e.amt*(1+e.rate)/12)});n.rel+=10;L(`Вы одолжили ${d.n} ${fmt(e.amt)} кр.`)}
    else{n.rel-=5;if(!silent)L(`Вы отказали ${d.n} в займе.`)}}
  else if(e.t==='deal'){if(yes){n.deal=1;n.rel+=5;L(`Подписан торговый договор с ${d.n}.`)}}
  else if(e.t==='tariff'){if(yes){S.tax.imp=Math.min(S.tax.imp,.05);n.rel+=6;L(`Вы уступили ${d.n}: импортная пошлина снижена до 5%.`)}
    else{n.tarUntil=S.month+12;n.rel-=10;L(`${d.n} поднял пошлину на ваши товары до 35% на год.`)}}
  else if(e.t==='ref'){if(yes){S.pop+=e.amt;n.pop-=e.amt;n.rel+=6;L(`Приняты ${e.amt} беженцев из ${d.n}.`)}else n.rel-=4}
  else{const X=EVN[e.t],ok=yes&&!evLack(e),sum=e.amt*e.price;n.rel+=X.rel[ok?0:1];
    if(ok){
      if(e.t==='order'){S.stock[e.k]-=e.amt;S.money+=sum;n.money-=sum;L(`${d.n}: партия продана за ${fmt(sum)} кр.`)}
      else if(e.t==='bargain'){S.money-=sum;n.money+=sum;S.stock[e.k]+=e.amt;L(`${d.n}: партия куплена за ${fmt(sum)} кр.`)}
      else if(e.t==='relief'){S.stock.food-=e.amt;L(`${d.n}: отправлено ${e.amt} ед. еды.`)}
      else if(e.t==='summit'){S.money-=X.cost;L(`${d.fest[0]}: делегация принята.`)}
      else if(e.t==='dumping'){S.money-=X.cost;n.money+=X.cost;L(`${d.n}: отступные выплачены.`)}
      else if(e.t==='border'){if(S.fac&&S.fac.mil)S.fac.mil.sat=Math.max(0,S.fac.mil.sat-X.mil);L(`${d.n}: вы принесли извинения.`)}
      else if(e.t==='debt'){const l=S.lent.find(x=>x.nid===n.id);l.left=Math.max(1,l.left-e.amt);L(`${d.n}: списано ${fmt(e.amt)} кр долга.`)}
      else if(e.t==='mediate'){const o=natById(e.oid);o.rel=Math.max(-100,Math.min(100,o.rel+X.other));L(`Вы поддержали ${d.n} в споре с ${ND(o).ins}.`)}
    }else if(!silent)L(`${d.n}: вы отказали.`)}
  n.rel=Math.max(-100,Math.min(100,n.rel));
}
/* Сколько месяцев ждать следующего обращения к стране. */
function dipWait(n){return Math.max(0,n.actAt+DIPL.actGap-S.month)}
/* diplomacy actions: return message */
function debtTotal(){return S.loans.reduce((a,l)=>a+l.left,0)}
function borrowRate(n){return Math.max(.02,ND(n).rate-.005*M('dip'))+Math.max(0,-n.rel)/400+debtTotal()/60000}
function dip(act,id,amt){
  /* Год отсчитывается только от удавшегося обращения: всё удачное пишется в журнал через L, отказы — нет. */
  const n=natById(id),d=ND(n),L=t=>{S.log.unshift({m:S.month,t});n.actAt=S.month},w=dipWait(n);
  if(w>0)return`${d.n}: следующее обращение через ${w} ${plural(w,'месяц','месяца','месяцев')}`;
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
