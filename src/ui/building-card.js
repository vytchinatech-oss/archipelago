/* Подробная статистика здания. */
/* ---------- building statistics card ---------- */
function inDisk(i,R,fn){const x=i%N,y=i/N|0;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R+R)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=N||Y>=N)continue;fn(Y*N+X)}}
const pct=v=>Math.round(v*100)+'%';
const fbar=(lab,v,tip)=>{const w=Math.max(0,Math.min(1,v))*100,col=v>=.95?'var(--good)':v>=.6?'var(--sun)':'var(--bad)';
  return`<div class="fb"${tip?` data-tip="${tip}" tabindex="0"`:''}><span>${lab}</span><span class="mbar"><i style="left:0;width:${w}%;background:${col}"></i></span><span>${v>1.001?'×'+v.toFixed(2):pct(v)}</span></div>`};
const big=items=>`<div class="big">${items.map(([v,l,t])=>`<div${t?` data-tip="${t}" tabindex="0"`:''}><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
const resList=o=>Object.keys(o).filter(k=>o[k]>.05).map(k=>`${rd(k)}${o[k].toFixed(1)} ${RES[k].n.toLowerCase()}`).join('<br>')||'—';
function bInfo(i,b,c){
  const d=B[b.t],r=S.rep,x=r&&r.bs?r.bs[i]:null,s=d.jobs?(c.st[i]||0):1,on=d.pow<0?!!PW[i]:true,t=b.t;
  const ly=layerOf(t);if(ly)setLayer(ly);
  if(d.in&&x&&!x.inp){x.run=0;x.inp={};x.need={};x.out={};for(const k in d.in){x.inp[k]=0;x.need[k]=0}for(const k in d.out)x.out[k]=0}
  let status=!CONN[i]?['Нет дороги к ратуше','bad']:!on?['Нет электричества','bad']:d.jobs&&s<.5?['Мало рабочих','bad']:d.jobs&&s<1?['Не хватает рабочих','mid']:['Работает',''];
  if(d.in&&x&&x.run<.6&&status[1]==='')status=['Мало сырья','mid'];
  const H=[];
  // top numbers
  const top=[];
  if(d.jobs){const w=Math.round(d.jobs*s);top.push([`${w}/${d.jobs}`,'рабочих','Сколько человек работает здесь из возможного. Рабочие распределяются по приоритету: еда, энергия, службы, добыча, заводы.'])}
  if(d.home){const hf=homeF(i),cap=Math.round(d.home*hf),live=c.home?Math.round(cap*Math.min(1,S.pop/c.home)):0;top.push([`${live}/${d.home}`,d.rich?'богачей':'жителей','Сейчас живёт / мест. Без электричества и рынка рядом мест меньше.'])}
  if(x&&x.out){const k=Object.keys(d.out)[0];top.push([(x.out[k]||0).toFixed(1),`${RES[k].n.toLowerCase()} в мес.`,`Максимум ${d.out[k]} при полной загрузке.`])}
  if(d.in&&x)top.push([pct(x.run),'загрузка сырьём','Какая доля нужного сырья нашлась на складах и в импорте.']);
  if(d.pow>0){const p=t==='hall'?d.pow:Math.round(d.pow*s*(d.fuel&&r?r.fuel:1));top.push([`+${p}`,'энергии',`Номинал ${d.pow}. Зависит от рабочих${d.fuel?' и угля':''}.`])}
  if(d.serve){top.push([Math.round(d.serve*s*(on?1:0)),'покупателей','Сколько жителей рынок может обслужить с текущим штатом.'])}
  if(d.cap){top.push([Math.round(d.cap*s*(on?1:0)),'ед. в месяц','Пропускная способность этого порта.'])}
  const fin=r&&r.fin?r.fin[i]:null,firm=isFirm(t);
  if(fin)top.push([fmt(Math.abs(fin.net)),fin.net>=0?'кр/мес в казну':'кр/мес из казны','Итог счёта предприятия за прошлый месяц: выручка минус сырьё, зарплаты и содержание. Предприятие государственное: прибыль идёт в казну, убыток казна покрывает.']);
  else if(d.up)top.push([`−${d.up}`,'кр/мес казне','Содержание здания из бюджета.']);
  if(top.length)H.push(big(top.slice(0,6)));
  // workers and factors
  if(d.jobs&&t!=='hall'){const w=wdist(i),W=r?r.W:S.wage;H.push('<h5>Работники</h5>'+kv([['Путь от жилья',w>=999?pill('нет пути','bad'):`${w} кл. по дорогам`],['Зарплаты',`${fmt(d.jobs*s*W)} кр/мес · ${firm?'платит предприятие':'платит казна'}`],[`<span data-tip="Одна ставка на всю страну. Смотрите «Экономика» → «Зарплата и кошельки».">Ставка на рабочего ⓘ</span>`,`${W.toFixed(1)} кр/мес`]]))}
  if(x&&x.P){const P=x.P,f=[];
    f.push(fbar('Укомплектованность',P.staff,'Доля занятых рабочих мест.'));
    if(d.pow<0)f.push(fbar('Электричество',P.power,`Вне зоны энергии выработка падает до ${PCT(PROD.noPower)}%, при общей нехватке энергии — пропорционально.`));
    f.push(fbar('Дорога до работы',P.commute,`До ${PROD.commuteFree} клеток от жилья без потерь, дальше −${PCT(PROD.commuteStep)}% за клетку.`));
    if(c.prodN>PROD.smallCity)f.push(fbar('Склад рядом',P.log,`Без склада в ореоле предприятие работает на ${PCT(PROD.noStore)}%.`));
    if(P.fac!==undefined&&P.fac!==1)f.push(fbar('Настрой фракции',P.fac,`Злая фракция саботирует свою отрасль (−${PCT(1-FACK.loM)}%), довольная работает с рвением (+${PCT(FACK.hiM-1)}%).`));if(P.fert)f.push(fbar('Плодородие',P.fert));if(P.forest)f.push(fbar('Лес вокруг',P.forest,`Лесопилке нужен нетронутый лес в ${PROD.nearR} клетках.`));
    if(P.mount)f.push(fbar('Горы',P.mount,'В горах залежи богаче.'));if(P.warm)f.push(fbar('Тёплый климат',P.warm));
    H.push('<h5>Что влияет на выработку</h5>'+f.join(''))}
  // industry inputs
  if(d.in&&x){const rows=Object.keys(d.in).map(k=>[`${rd(k)}${RES[k].n}`,`${(x.inp[k]||0).toFixed(1)} из ${(x.need[k]||0).toFixed(1)} · на складе ${fmt(S.stock[k])}`]);
    H.push('<h5>Сырьё за месяц</h5>'+kv(rows)+(r.lim&&r.lim[t]?`<p>Не хватает: ${RES[r.lim[t]].n.toLowerCase()}. ${t==='cannery'?'Заводу достаётся только еда сверх запаса для жителей.':'Добывайте больше или разрешите ввоз.'}</p>`:''))}
  // economics of production
  if(fin){const k0=d.out?Object.keys(d.out)[0]:null,best=k0&&r.best[k0],pay=fin.net>0?B[t].cost/fin.net/12:0;
    H.push('<h5>Счёт предприятия за месяц</h5>'+kv([['Выручка',money(fin.rev)+' кр'],...(fin.inp>.5?[['Сырьё',money(-fin.inp)+' кр']]:[]),['Зарплаты',(fin.wage>.5?money(-fin.wage):'0')+' кр'],
      ...(fin.mgr>.5?[['Управляющие из особняков',money(-fin.mgr)+' кр']]:[]),['Содержание',money(-fin.up)+' кр'],[fin.net>=0?'Итог: в казну':'Итог: из казны',`<b class="${fin.net>=0?'up':'dn'}">${money(fin.net)} кр</b>`],
      [`<span data-tip="Цена постройки, делённая на итог за год. Меняется вместе с ценами, торговлей и отношениями с соседями.">Окупаемость ⓘ</span>`,pay?`${COMMA(pay.toFixed(1))} ${plural(Math.round(pay),'год','года','лет')} при таком итоге`:pill('в убытке','bad')],
      ...(k0?[['Цена внутри · за рубежом',`${S.dom[k0].toFixed(1)} · ${best?best.p.toFixed(1)+' '+nm(best.nid):'—'}`]]:[])])+
      `<p>${t==='shop'?`Выручка рынка — наценка ${PCT(SHOPK.margin)}% на товары, ткани и кофе.`:'Выручку ресурса делят все, кто выпустил его в этом месяце. Лишнее, что не купили жители, заводы и соседи, лежит на складе и денег не приносит.'}</p>`)}
  // port
  if(t==='port'&&r){const share=c.ports?d.cap*s/c.ports:0,ex={},im={};for(const k of RK){if(r.exp[k])ex[k]=r.exp[k]*share;if(r.imp[k])im[k]=r.imp[k]*share}
    H.push('<h5>Торговля за месяц (доля этого порта)</h5>'+kv([['Загрузка всех портов',pct(r.portUse)],['Вывезено',resList(ex)],['Ввезено',resList(im)],['Экспорт · импорт',`${fmt(r.expV*share)} · ${fmt(r.impV*share)} кр`],
      ['Партнёры',Object.keys(r.dest).map(id=>`${nm(id)} ${fmt(r.dest[id]*share)}`).join(', ')||'—']]))}
  // shop
  if(t==='shop'){let homes=0,res=0;inDisk(i,RAD.shop,j=>{const bb=S.bld[j];if(bb&&B[bb.t].home&&CONN[j]){homes++;res+=B[bb.t].home*homeF(j)}});
    H.push('<h5>Снабжение</h5>'+kv([['Домов в ореоле',`${homes} · до ${fmt(res)} жителей`],['Товары · ткани · кофе',r?`${pct(r.sat.goods)} · ${pct(r.sat.cloth)} · ${pct(r.sat.coffee)}`:'—'],['Всего рынков на город',`${fmt(c.serve)} мест на ${fmt(S.pop)} жителей`]]))}
  // power
  if(d.pow>0||t==='sub'){let users=0,dark=0;inDisk(i,RAD[t],j=>{const bb=S.bld[j];if(bb&&B[bb.t].pow<0)users++});for(let j=0;j<N*N;j++){const bb=S.bld[j];if(bb&&CONN[j]&&B[bb.t].pow<0&&!PW[j])dark++}
    H.push('<h5>Энергосеть</h5>'+kv([['Потребителей в ореоле',users],['Город: потребление / выработка',`${fmt(c.use)} / ${fmt(c.sup)}`],['Зданий без электричества',dark?pill(dark,'bad'):pill('нет')],
      ...(d.fuel&&r?[['Уголь за месяц',`${(d.fuel.coal*s*r.fuel).toFixed(1)} из ${(d.fuel.coal*s).toFixed(1)} · на складе ${fmt(S.stock.coal)}`]]:[])]))}
  // store
  if(t==='store'){let ent=0;inDisk(i,RAD.store,j=>{const bb=S.bld[j];if(bb&&B[bb.t].out&&CONN[j])ent++});
    H.push('<h5>Логистика</h5>'+kv([['Предприятий в ореоле',ent],['Вместимость складов города',`${fmt(c.cap)} на ресурс`],['Прибавка к портам',c.ports?`+${ECO.portPerStore} ед.`:'порта нет']]))}
  // social services
  if(['park','school','clinic','police'].includes(t)){let homes=0,res=0;inDisk(i,RAD[t],j=>{const bb=S.bld[j];if(bb&&B[bb.t].home&&CONN[j]){homes++;res+=B[bb.t].home*homeF(j)}});
    const cvk={park:'park',school:'school',clinic:'clinic',police:'police'}[t];
    H.push('<h5>Обслуживание</h5>'+kv([['Домов в ореоле',`${homes} · ${fmt(res)} жителей`],['Покрытие города',pct(c.cv[cvk])],...(on?[]:[['Состояние',pill('не работает без энергии','bad')]])]))}
  // housing
  if(d.home){const hf=homeF(i),sv=['shop','park','school','clinic','police'].map(k=>`${COV[k][i]?'✓':'✗'} ${RADN[k]}`).join(', ');
    H.push('<h5>Условия жизни</h5>'+kv([['Электричество',PW[i]?pill('есть'):pill(`нет, заселение ${PCT(HOME.noPower)}%`,'bad')],['Рынок рядом',COV.shop[i]?pill('есть'):pill(`нет, заселение ${PCT(HOME.noShop)}%`,'bad')],['Службы',sv],
      ['Налог с жителей',`~${fmt(Math.round(d.home*hf)*(r?r.W:S.wage)*(d.rich?WAGE.richMul:POPK.workShare)*S.tax.inc)} кр/мес`]]))}
  // hall
  if(t==='hall')H.push('<h5>Город</h5>'+kv([['Жители / места',`${fmt(S.pop)} / ${fmt(c.home)}`],['Занято / мест',`${fmt(c.emp)} / ${fmt(c.jobs)}`],['Зданий',c.list.length],['Без дороги',c.dis]]));
  const act=t!=='hall'?`<button class="btn ghost" type="button" id="i-del" data-tip="Здание исчезнет, деньги за него не вернутся. Жители и рабочие места пропадут сразу.">Снести · ${fmt(ROADK.demolish)} кр</button>`:'';
  infoText(`${d.n} ${pill(status[0],status[1])}`,d.d+(RAD[t]?` Ореол ${RAD[t]} клеток.`:''),H.join('')+(r?'':'<p>Подробная статистика появится через месяц.</p>')+act);
  const del=$('#i-del');if(del)del.onclick=()=>{const q=place('bull',i);if(q.ok){toast('Снесено');info(-1);refresh()}else toast(q.why)};
}
