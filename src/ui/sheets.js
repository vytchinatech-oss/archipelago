/* Листы «Экономика» и «Мир». */
/* ---------- sheets ---------- */
function sheet(mode){sheetMode=mode;$('#sheet').hidden=!mode;if(mode)renderSheet()}
const money=v=>(v>=0?'+':'−')+fmt(Math.abs(v));
function renderSheet(){const el=$('#sheet'),sc=el.scrollTop;const m=sheetMode;el.innerHTML=m==='world'?worldHTML():m==='gov'?govHTML():m.startsWith('stat:')?statHTML(m.slice(5)):econHTML();el.scrollTop=sc;$('#sh-x').onclick=()=>sheet(null);
  if(m==='econ')bindEcon();else if(m==='world')bindWorld();else if(m==='gov')bindGov()}
function econHTML(){
  const r=S.rep,T=S.tax,c=r?r.cen:census();
  const sl=(id,lab,v,max,hint)=>`<div class="sl" data-tip="${hint}"><label for="${id}">${lab}<span>${Math.round(v*100)}%</span></label><input type="range" id="${id}" min="0" max="${max}" step="1" value="${Math.round(v*100)}"><small>${hint}</small></div>`;
  const row=k=>{const b=r&&r.best[k];return`<tr><td>${rd(k)}${RES[k].n}</td><td>${fmt(S.stock[k])}</td><td>${r?'+'+fmt(r.prod[k]):'—'}</td><td>${r?'−'+fmt(r.cons[k]):'—'}</td><td>${S.dom[k].toFixed(1)}</td><td>${b?b.p.toFixed(1)+' '+nm(b.nid):'—'}</td><td>${r?fmt(r.exp[k]):'—'}</td><td>${r?fmt(r.imp[k]):'—'}</td>
    <td><button class="tg" type="button" data-k="${k}" data-m="e" data-tip="Порт продаёт излишек сверх запаса на 2 месяца туда, где цена выше. Выключите, чтобы копить ресурс." aria-pressed="${!!S.trade[k].e}">вывоз</button> <button class="tg" type="button" data-k="${k}" data-m="i" data-tip="Порт докупает нехватку у самой дешёвой страны. Выключите, чтобы не зависеть от импорта." aria-pressed="${!!S.trade[k].i}">ввоз</button></td></tr>`};
  const bl=(a,b,cls='',tip='')=>`<div class="${cls}"${tip?` data-tip="${tip}"`:''}><span>${a}</span><span>${b}</span></div>`,BL=r?budgetLines(r):null;
  const maxF=r?Math.max(20,...r.F.map(f=>Math.abs(f[1]))):1;
  return`<div class="sheet-in"><div class="sheet-top"><h2>Экономика</h2><button class="ibtn" type="button" id="sh-x" aria-label="Закрыть">✕</button></div>
  <div class="sec"><h3>Налоги и пошлины</h3><div class="sliders">
    ${sl('tx-inc','Подоходный налог',T.inc,30,`Платят занятые жители, богачи в особняках платят вчетверо больше. Выше ${PCT(TAXK.incFree)}% портит настроение.`)}
    ${sl('tx-biz','Налог на бизнес',T.biz,30,'С выручки предприятий за вычетом закупленного за рубежом сырья. Выше '+PCT(TAXK.bizFree)+'% снижает выработку.')}
    ${sl('tx-imp','Импортная пошлина',T.imp,50,'С ввоза, кроме стран с договором. Жители платят за импорт больше, а настроение падает, когда на импорт уходит большая доля зарплат.')}
    ${sl('tx-exp','Экспортная пошлина',T.exp,30,'С вывоза. Высокая пошлина сокращает объём экспорта.')}</div></div>
  <div class="sec"><h3>Бюджет за прошлый месяц</h3>${r?`<div class="budget">
    <div class="bcol">${BL.inc.map(x=>bl(x[0],money(x[1]))).join('')}${bl('Доходы',money(BL.inc.reduce((a,x)=>a+x[1],0)),'tot')}</div>
    <div class="bcol">${BL.out.map(x=>bl(x[0],money(-x[1]),'',x[2])).join('')}${bl('Расходы',money(-BL.out.reduce((a,x)=>a+x[1],0)),'tot')}${bl('Итог месяца',`<b class="${r.net>=0?'up':'dn'}">${money(r.net)} кр</b>`,'tot')}${Math.abs(r.auto)>=.5?bl('Вне бюджета: решения министров',money(r.auto),'','Стройка, помощь и займы, которые министры сделали сами. В итог месяца не входят.'):''}</div></div>`:'<p class="log">Отчёт появится через месяц.</p>'}</div>
  <div class="sec"><h3>Ресурсы, цены и торговля</h3><div class="tw"><table class="tbl" style="min-width:760px"><thead><tr><th>Ресурс</th><th>Склад</th><th>Добыто</th><th>Потрачено</th><th>Цена внутри</th><th>Лучшая за рубежом</th><th>Вывоз</th><th>Ввоз</th><th>Порт</th></tr></thead><tbody>${RK.map(row).join('')}</tbody></table></div>
  <p class="log" style="font-size:12.5px">Склады вмещают ${fmt(c.cap)} ед. каждого ресурса. ${c.ports?`Порты пропускают ${c.ports} ед. в месяц, загрузка ${Math.round((r?r.portUse:0)*100)}%. Экспорт идёт туда, где выше цена за вычетом чужой пошлины.`:'Без порта торговли нет.'} Внутренняя цена падает, когда товара больше, чем нужно стране.</p></div>
  <div class="sec"><h3>Настроение: ${Math.round(S.happy)}%</h3><div class="mood">${r?r.F.filter(f=>Math.abs(f[1])>=.5).map(f=>{const w=Math.min(50,Math.abs(f[1])/maxF*50);return`<div class="mrow"><span>${f[0]}</span><span class="mbar"><i style="left:${f[1]>=0?50:50-w}%;width:${w}%;background:${f[1]>=0?'var(--good)':'var(--bad)'}"></i></span><span class="${f[1]>=0?'up':'dn'}">${f[1]>=0?'+':'−'}${Math.abs(f[1]).toFixed(0)}</span></div>`}).join(''):''}</div></div>
  <div class="sec"><h3>Журнал</h3><ul class="log">${S.log.slice(0,12).map(l=>`<li><b>${MONTHS[(l.m+11)%12].slice(0,3)} ${1+((Math.max(0,l.m-1))/12|0)}</b>${l.t}</li>`).join('')}</ul></div></div>`;
}
function bindEcon(){const el=$('#sheet');
  for(const[id,k]of[['tx-inc','inc'],['tx-biz','biz'],['tx-imp','imp'],['tx-exp','exp']]){const inp=$('#'+id);inp.oninput=()=>{S.tax[k]=inp.value/100;inp.previousElementSibling.querySelector('span').textContent=inp.value+'%'}}
  el.querySelectorAll('.tg').forEach(b=>b.onclick=()=>{const o=S.trade[b.dataset.k];o[b.dataset.m]=o[b.dataset.m]?0:1;b.setAttribute('aria-pressed',!!o[b.dataset.m])})}
function worldHTML(){
  const r=S.rep,debt=debtTotal(),lent=S.lent.reduce((a,l)=>a+l.left,0);
  const mig=[['open','Открыты для всех'],['allies','Только друзьям'],['closed','Закрыты']];
  const card=n=>{const d=ND(n),[lab,cls]=relLabel(n.rel),tar=natTariff(n),wait=dipWait(n),off=wait?' aria-disabled="true"':'';
    const buys=Object.keys(d.dem).map(k=>`${RES[k].n.toLowerCase()} ${natBuy(n,k).toFixed(0)}`).join(', ');
    const sells=Object.keys(d.sup).filter(k=>n.sl[k]>0||!r).map(k=>`${RES[k].n.toLowerCase()} ${natSell(n,k).toFixed(0)}`).join(', ')||'сейчас нечего';
    const my=S.loans.filter(l=>l.nid===n.id).reduce((a,l)=>a+l.left,0),their=S.lent.filter(l=>l.nid===n.id).reduce((a,l)=>a+l.left,0);
    return`<div class="nat"><div class="nat-h"><span class="flag" style="background:${d.col}"></span><h4>${d.full}</h4>${pill(n.emb?'Эмбарго':lab,n.emb?'bad':cls)}</div>
    <div class="relbar" aria-label="Отношения ${Math.round(n.rel)}"><i style="left:${(n.rel+100)/2}%"></i></div>
    <p>${d.trait}${n.cr?` <b style="color:var(--bad)">Сейчас: ${CRISES[n.cr.t].n}, ещё ${n.cr.m} мес.</b>`:''}</p>${(()=>{const q=natFans(n.id),nm=f=>(S.gov==='mon'?FAC[f].m:FAC[f].n).toLowerCase();
      return q.fan.length||q.foe.length?`<p data-tip="Фракции следят за отношениями: ссора с любимой страной их злит, дружба с нелюбимой — тоже.">${q.fan.length?'За дружбу: '+q.fan.map(nm).join(', ')+'. ':''}${q.foe.length?'Против: '+q.foe.map(nm).join(', ')+'.':''}</p>`:''})()}
    <div class="mini"><div><span>Отношения</span><span>${Math.round(n.rel)}</span></div><div><span>Население</span><span>${fmt(n.pop)}</span></div>
      <div><span>Настроение</span><span>${Math.round(n.happy)}%</span></div><div><span>Казна</span><span>${fmt(n.money)}</span></div>
      <div><span>Пошлина на вас</span><span>${Math.round(tar*100)}%</span></div><div><span>Торговля в мес.</span><span>${fmt(r&&r.dest[n.id]||0)}</span></div>
      <div><span>Вы должны</span><span>${fmt(my)}</span></div><div><span>Должны вам</span><span>${fmt(their)}</span></div>
      <div><span>Миграция</span><span>${r&&r.mig[n.id]?(r.mig[n.id]>0?'+':'')+r.mig[n.id]:'0'}</span></div><div><span>Ставка займа</span><span>${Math.round(borrowRate(n)*100)}%</span></div></div>
    <div class="mkt"><b>Покупает:</b>${buys}<br><b>Продаёт:</b>${sells}</div>
    ${wait?`<p class="dip-wait" data-tip="С каждой страной можно иметь дело раз в год: договор, заём, помощь или эмбарго.">Следующее обращение через ${wait} ${plural(wait,'месяц','месяца','месяцев')}</p>`:''}
    <div class="acts"><button class="ibtn txt"${off} type="button" data-a="deal" data-n="${n.id}" data-tip="${n.deal?`Пошлины вернутся (у ${d.n} ${Math.round(n.tar*100)}%), скидка на их товары пропадёт. Отношения −${-DIPA.dealCancel}.`:`Взаимные пошлины обнулятся, их товары станут дешевле на ${PCT(1-NATK.sellDeal)}%, отношения +${DIPA.dealRel} сразу и +${COMMA(NATK.dealRel)} в месяц. Нужны отношения от ${RELK.friend}, сейчас ${Math.round(n.rel)}.`}">${n.deal?'Расторгнуть договор':'Торговый договор'}</button>
      <button class="ibtn txt"${off} type="button" data-a="borrow" data-n="${n.id}" data-v="${DIPA.borrowBtn}" data-tip="Получите ${fmt(DIPA.borrowBtn)} кр сразу, вернёте ${fmt(DIPA.borrowBtn*(1+borrowRate(n)*DIPA.borrowYears))} кр равными платежами за ${DIPA.borrowMonths} месяца. Ставка ${Math.round(borrowRate(n)*100)}% растёт с вашим долгом и плохими отношениями. Врагам (ниже −${-DIPA.borrowFrom}) не дают.">Взять ${fmt(DIPA.borrowBtn)}</button>
      <button class="ibtn txt"${off} type="button" data-a="lend" data-n="${n.id}" data-v="${DIPA.lendBtn}" data-tip="Отдадите ${fmt(DIPA.lendBtn)} кр, вернут ${fmt(DIPA.lendBtn*(1+DIPA.lendRate))} кр за ${DIPA.lendMonths} месяцев. Отношения +${DIPA.lendRel}. Если у страны кончатся деньги, выплаты будут задерживаться.">Одолжить ${fmt(DIPA.lendBtn)}</button>
      <button class="ibtn txt"${off} type="button" data-a="aid" data-n="${n.id}" data-tip="${fmt(DIPA.aidCost)} кр в подарок. Отношения +${aidGain(n)}: каждая следующая помощь даёт меньше.">Помощь ${fmt(DIPA.aidCost)}</button>
      <button class="ibtn txt"${off} type="button" data-a="emb" data-n="${n.id}" data-tip="${n.emb?'Торговля и миграция с этой страной возобновятся.':`Запрет торговли и миграции. Отношения −${-DIPA.embargo} сразу и −${COMMA(NATK.embRel)} каждый месяц, договор расторгается.`}">${n.emb?'Снять эмбарго':'Эмбарго'}</button></div></div>`};
  return`<div class="sheet-in"><div class="sheet-top"><h2>Мир и дипломатия</h2><button class="ibtn" type="button" id="sh-x" aria-label="Закрыть">✕</button></div>
  <div class="sec"><h3>Ваша страна</h3><div class="mini" style="max-width:520px"><div><span>Население</span><span>${fmt(S.pop)}</span></div><div><span>Настроение</span><span>${Math.round(S.happy)}%</span></div>
    <div><span>Внешний долг</span><span>${fmt(debt)}</span></div><div><span>Вам должны</span><span>${fmt(lent)}</span></div></div>
    <p class="log" style="font-size:12.5px">Люди переезжают туда, где настроение выше. Если у вас лучше, а в доме есть место, к вам едут иммигранты.</p>
    <div class="seg" role="radiogroup" aria-label="Границы">${mig.map(([k,t])=>`<button class="tg" type="button" role="radio" data-mig="${k}" data-tip="${({open:'Иммигранты едут из любой страны, где настроение ниже вашего.',allies:`Иммигрантов пускают только из стран с отношениями от ${RELK.friend}.`,closed:'Никто не въезжает. Уезжать жители всё равно могут.'})[k]}" aria-pressed="${S.mig===k}" aria-checked="${S.mig===k}">${t}</button>`).join('')}</div></div>
  <div class="sec"><h3>Соседи</h3><div class="nations">${S.nat.map(card).join('')}</div>
  <p class="log" style="font-size:12.5px">Договор возможен при отношениях от ${RELK.friend}: пошлины обнуляются, цены их товаров ниже на ${PCT(1-NATK.sellDeal)}%. Займы берутся на ${DIPA.borrowYears} года, выдаются на год под ${PCT(DIPA.lendRate)}%. Отношения растут от торговли, помощи и займов. К каждой стране можно обратиться раз в год.</p></div></div>`;
}
function bindWorld(){const el=$('#sheet');
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const m=dip(b.dataset.a,b.dataset.n,+b.dataset.v||0);toast(m);refresh()});
  el.querySelectorAll('[data-mig]').forEach(b=>b.onclick=()=>{S.mig=b.dataset.mig;renderSheet()})}
