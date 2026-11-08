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
  if(d.up)top.push([`−${d.up}`,'кр/мес казне','Содержание здания из бюджета.']);
  if(top.length)H.push(big(top.slice(0,6)));
  // workers and factors
  if(d.jobs&&t!=='hall'){const w=wdist(i);H.push('<h5>Работники</h5>'+kv([['Путь от жилья',w>=999?pill('нет пути','bad'):`${w} кл. по дорогам`],['Зарплаты',`${fmt(Math.round(d.jobs*s)*15)} кр/мес`]]))}
  if(x&&x.P){const P=x.P,f=[];
    f.push(fbar('Укомплектованность',P.staff,'Доля занятых рабочих мест.'));
    if(d.pow<0)f.push(fbar('Электричество',P.power,'Вне зоны энергии выработка падает до 35%, при общей нехватке энергии — пропорционально.'));
    f.push(fbar('Дорога до работы',P.commute,'До 6 клеток от жилья без потерь, дальше −2,5% за клетку.'));
    if(c.prodN>4)f.push(fbar('Склад рядом',P.log,'Без склада в ореоле предприятие работает на 75%.'));
    if(P.tax<1)f.push(fbar('Налог на бизнес',P.tax,'Налог выше 15% снижает выработку.'));
    if(P.fac!==undefined&&P.fac!==1)f.push(fbar('Настрой фракции',P.fac,'Злая фракция саботирует свою отрасль (−10%), довольная работает с рвением (+5%).'));if(P.fert)f.push(fbar('Плодородие',P.fert));if(P.forest)f.push(fbar('Лес вокруг',P.forest,'Лесопилке нужен нетронутый лес в 2 клетках.'));
    if(P.mount)f.push(fbar('Горы',P.mount,'В горах залежи богаче.'));if(P.warm)f.push(fbar('Тёплый климат',P.warm));
    H.push('<h5>Что влияет на выработку</h5>'+f.join(''))}
  // industry inputs
  if(d.in&&x){const rows=Object.keys(d.in).map(k=>[`${rd(k)}${RES[k].n}`,`${(x.inp[k]||0).toFixed(1)} из ${(x.need[k]||0).toFixed(1)} · на складе ${fmt(S.stock[k])}`]);
    H.push('<h5>Сырьё за месяц</h5>'+kv(rows)+(r.lim&&r.lim[t]?`<p>Не хватает: ${RES[r.lim[t]].n.toLowerCase()}. ${t==='cannery'?'Заводу достаётся только еда сверх запаса для жителей.':'Добывайте больше или разрешите ввоз.'}</p>`:''))}
  // economics of production
  if(x&&x.out){let rev=0,inp=0;for(const k in x.out)rev+=x.out[k]*S.dom[k];if(x.inp)for(const k in x.inp)inp+=x.inp[k]*S.dom[k];const wages=Math.round(d.jobs*s)*15;
    const k0=Object.keys(d.out)[0],best=r.best[k0];
    H.push('<h5>Экономика</h5>'+kv([['Выручка по внутренней цене',`${fmt(rev)} кр`],['Цена внутри · за рубежом',`${S.dom[k0].toFixed(1)} · ${best?best.p.toFixed(1)+' '+nm(best.nid):'—'}`],
      ...(inp?[['Сырьё',`−${fmt(inp)} кр`]]:[]),['Зарплаты',`${money(-wages)} кр`],['Прибыль владельцев',`<b class="${rev-inp-wages>=0?'up':'dn'}">${money(rev-inp-wages)} кр</b>`],['Налог в казну',`${fmt(rev*S.tax.biz)} кр`]]))}
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
      ...(d.fuel&&r?[['Уголь за месяц',`${(4*s*r.fuel).toFixed(1)} из ${(4*s).toFixed(1)} · на складе ${fmt(S.stock.coal)}`]]:[])]))}
  // store
  if(t==='store'){let ent=0;inDisk(i,RAD.store,j=>{const bb=S.bld[j];if(bb&&B[bb.t].out&&CONN[j])ent++});
    H.push('<h5>Логистика</h5>'+kv([['Предприятий в ореоле',ent],['Вместимость складов города',`${fmt(c.cap)} на ресурс`],['Прибавка к портам',c.ports?`+25 ед.`:'порта нет']]))}
  // social services
  if(['park','school','clinic','police'].includes(t)){let homes=0,res=0;inDisk(i,RAD[t],j=>{const bb=S.bld[j];if(bb&&B[bb.t].home&&CONN[j]){homes++;res+=B[bb.t].home*homeF(j)}});
    const cvk={park:'park',school:'school',clinic:'clinic',police:'police'}[t];
    H.push('<h5>Обслуживание</h5>'+kv([['Домов в ореоле',`${homes} · ${fmt(res)} жителей`],['Покрытие города',pct(c.cv[cvk])],...(on?[]:[['Состояние',pill('не работает без энергии','bad')]])]))}
  // housing
  if(d.home){const hf=homeF(i),sv=['shop','park','school','clinic','police'].map(k=>`${COV[k][i]?'✓':'✗'} ${RADN[k]}`).join(', ');
    H.push('<h5>Условия жизни</h5>'+kv([['Электричество',PW[i]?pill('есть'):pill('нет, заселение 50%','bad')],['Рынок рядом',COV.shop[i]?pill('есть'):pill('нет, заселение 60%','bad')],['Службы',sv],
      ['Налог с жителей',`~${fmt(Math.round(d.home*hf)*(d.rich?60:15*.62)*S.tax.inc)} кр/мес`]]))}
  // hall
  if(t==='hall')H.push('<h5>Город</h5>'+kv([['Жители / места',`${fmt(S.pop)} / ${fmt(c.home)}`],['Занято / мест',`${fmt(c.emp)} / ${fmt(c.jobs)}`],['Зданий',c.list.length],['Без дороги',c.dis]]));
  const act=t!=='hall'?`<button class="btn ghost" type="button" id="i-del" data-tip="Здание исчезнет, деньги за него не вернутся. Жители и рабочие места пропадут сразу.">Снести · 5 кр</button>`:'';
  infoText(`${d.n} ${pill(status[0],status[1])}`,d.d+(RAD[t]?` Ореол ${RAD[t]} клеток.`:''),H.join('')+(r?'':'<p>Подробная статистика появится через месяц.</p>')+act);
  const del=$('#i-del');if(del)del.onclick=()=>{const q=place('bull',i);if(q.ok){toast('Снесено');info(-1);refresh()}else toast(q.why)};
}
