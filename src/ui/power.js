/* Выбор строя и сложности, показатели с графиками, панель «Власть», экран поражения. */
/* ---------- power, ministers, indicators UI ---------- */
let PGOV='demo',PDIFF='norm';
const yrs=m=>{const y=Math.floor(m/12),mo=m%12;return(y?`${y} ${plural(y,'год','года','лет')}`:'')+(mo?` ${mo} мес.`:'')||'0 мес.'};
function buildOpts(){
  const seg=(id,obj,cur,set,did)=>{const el=$(id);el.innerHTML='';for(const k in obj){const b=document.createElement('button');b.type='button';b.className='tg';b.setAttribute('role','radio');
    b.setAttribute('aria-pressed',k===cur);b.setAttribute('aria-checked',k===cur);b.textContent=obj[k].n;b.onclick=()=>{set(k);buildOpts()};el.appendChild(b)}$(did).textContent=obj[cur].d};
  DIFF.easy.d='Для победы на выборах хватит 40% голосов.';DIFF.norm.d='Нужно 50% голосов. Кризисы и протесты в обычном темпе.';DIFF.hard.d='Нужно 50% голосов, кризисы у соседей чаще, протесты растут быстрее.';
  seg('#o-gov',GOVS,PGOV,k=>PGOV=k,'#o-gov-d');seg('#o-diff',DIFF,PDIFF,k=>PDIFF=k,'#o-diff-d')}
const STATS=[
  ['pop','Жители','s-pop','Жители / места в жилье. Нажмите, чтобы увидеть рост, миграцию и заселённость.'],
  ['job','Работа','s-job','Занятые / рабочие места. Нажмите, чтобы увидеть, какие отрасли укомплектованы.'],
  ['mood','Настроение','s-mood','Из чего складывается настроение и как оно менялось. От 40% город растёт, ниже 30% растут протесты.'],
  ['pow','Энергия','s-pow','Потребление / выработка. Нажмите, чтобы увидеть источники и здания без света.'],
  ['gdp','ВВП','s-gdp','Стоимость всего произведённого за месяц по внутренним ценам и рост к прошлому году.'],
  ['infl','Инфляция','s-infl','Рост цен на еду, товары, ткани и кофе за год. Выше 8% бьёт по рейтингу.'],
  ['debt','Долг','s-debt','Внешние займы плюс минус в казне. Долг больше 60% годового ВВП бьёт по рейтингу.'],
  ['appr','Рейтинг','s-appr','Одобрение вашей власти. На демократических выборах это ваш результат.']];
function buildStats(){const el=$('#stats');el.innerHTML='';for(const[k,l,id,t]of STATS){const b=document.createElement('button');b.type='button';b.className='stat';b.dataset.tip=t;
  b.innerHTML=`<span class="k">${l}</span><span class="v" id="${id}">—</span>`;b.onclick=()=>sheet('stat:'+k);el.appendChild(b)}}
function refreshGov(c){
  const r=S.rep,h=S.hist[S.hist.length-1];
  $('#s-gdp').textContent=h?fmt(h.gdp):'—';
  const inf=$('#s-infl');inf.textContent=h?((h.infl*100).toFixed(1)+'%'):'—';inf.style.color=h&&h.infl>.08?'var(--bad)':'';
  const db=$('#s-debt');db.textContent=fmt(debtTotal()+Math.max(0,-S.money));
  const ap=$('#s-appr');ap.textContent=Math.round(S.appr)+'%';ap.style.color=S.appr>=DIFF[S.diff].th+5?'var(--good)':S.appr>=DIFF[S.diff].th?'var(--paper)':'var(--bad)';
  const pc=$('#polit');pc.hidden=false;const left=S.nextEl-S.month;
  if(S.unrest>=40){pc.className='chip warn';pc.textContent=`Протесты ${Math.round(S.unrest)}%: на 100% вас свергнут`;pc.dataset.tip='Протесты растут, когда настроение ниже 30%, не хватает еды или казна пуста. Министр внутренних дел замедляет рост.'}
  else if(S.gov==='mon'){pc.className='chip'+(S.coup>.02?' warn':'');pc.textContent=`Армия ${Math.round(S.army)} · угроза переворота ${(S.coup*100).toFixed(1)}% в мес.`;pc.dataset.tip='Лояльность армии растёт от полной казны, гвардии и подарков знати. Ниже 45 появляется риск переворота.'}
  else{const v=S.gov==='demo'?S.appr:S.parl,th=DIFF[S.diff].th;pc.className='chip'+(left<=24&&v<th?' warn':'');
    pc.innerHTML=left<=24?`Выборы через ${yrs(left)} · опрос <b>${Math.round(v)}%</b>, нужно ${th}%`:`Выборы через ${yrs(left)}`;pc.dataset.tip=S.gov==='demo'?'Голосует народ: результат равен рейтингу одобрения.':'Голосует парламент: фракции поддерживают вас, если довольны своей сферой.'}
  if(S.over&&$('#over').hidden)showOver();
}
function showOver(){const o=$('#over'),h=S.hist[S.hist.length-1]||{};setSpeed(0);o.hidden=false;
  o.innerHTML=`<div class="over-in" role="dialog" aria-modal="true" aria-labelledby="ov-h"><span class="eyebrow">${GOVS[S.gov].n} · ${yrs(S.over.month)} у власти</span><h2 id="ov-h">Вы потеряли власть</h2><p>${S.over.reason}</p>
  ${kv([['Население',fmt(S.pop)],['ВВП в месяц',fmt(h.gdp||0)],['Казна',fmt(S.money)+' кр'],['Выигранных выборов',S.elWon||0],['Выполнено целей',`${S.goal} из ${GOALS.length}`]])}
  <div class="btns"><button class="btn" type="button" id="ov-new">Начать заново</button><button class="btn ghost" type="button" id="ov-menu">К картам</button></div></div>`;
  $('#ov-new').onclick=()=>{const mi=S.mi,g=S.gov0||S.gov,d=S.diff;o.hidden=true;S=newGame(mi);govInit(S,g,d);S.gov0=g;enterGame()};
  $('#ov-menu').onclick=()=>{o.hidden=true;try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;$('#game').hidden=true;$('#menu').hidden=false;buildMenu()}}
/* charts */
function chart(series,o={}){const W=600,H=o.h||150,pl=44,pr=8,pt=10,pb=18,all=series.flatMap(s=>s.v).filter(v=>isFinite(v));
  if(all.length<2)return'<p class="log">График появится через пару месяцев.</p>';
  let lo=Math.min(...all,o.min??Infinity),hi=Math.max(...all,o.max??-Infinity);if(hi-lo<1e-9){hi+=1;lo-=1}const n=Math.max(...series.map(s=>s.v.length));
  const X=i=>pl+(W-pl-pr)*i/Math.max(1,n-1),Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo)),f=o.f||(v=>fmt(v));
  let svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label||'График'}">`;
  for(const v of[lo,(lo+hi)/2,hi])svg+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(225,238,234,.1)"/><text x="${pl-6}" y="${Y(v)+3}" text-anchor="end">${f(v)}</text>`;
  if(o.th!==undefined)svg+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(o.th)}" y2="${Y(o.th)}" stroke="#ff7d68" stroke-dasharray="4 4"/>`;
  const m0=S.hist.length?S.hist[0].m:0;svg+=`<text x="${pl}" y="${H-4}">год ${1+Math.floor((m0)/12)}</text><text x="${W-pr}" y="${H-4}" text-anchor="end">сейчас</text>`;
  for(const s of series){const pts=s.v.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    if(s.area)svg+=`<polygon points="${X(0)},${Y(lo)} ${pts} ${X(s.v.length-1)},${Y(lo)}" fill="${s.col}" opacity=".14"/>`;
    svg+=`<polyline points="${pts}" fill="none" stroke="${s.col}" stroke-width="2" stroke-linejoin="round"/><circle cx="${X(s.v.length-1)}" cy="${Y(s.v[s.v.length-1])}" r="3.5" fill="${s.col}"/>`}
  return svg+'</svg>'+(series.length>1?`<div class="traits">${series.map(s=>`<span class="tag"><span class="res-dot" style="background:${s.col}"></span>${s.n}</span>`).join('')}</div>`:'')}
const H_=k=>S.hist.map(x=>x[k]);
function sheetTop(t){return`<div class="sheet-top"><h2>${t}</h2><button class="ibtn" type="button" id="sh-x" aria-label="Закрыть">✕</button></div>`}
function statHTML(k){const r=S.rep,c=r?r.cen:census(),h=S.hist[S.hist.length-1]||{};let t='',b='';
  if(k==='pop'){t='Жители';const mig=r?Object.entries(r.mig):[];
    b=chart([{v:H_('pop'),col:'#79d69a',n:'Жители',area:1}],{label:'Население'})+kv([['Жители / мест',`${fmt(S.pop)} / ${fmt(c.home)}`],['Рабочая сила · богачи',`${fmt(c.work)} · ${fmt(c.richPop)}`],
      ['Дома заселены не полностью',c.poor?pill(c.poor,'bad'):pill('нет')],['Естественный рост за месяц',r?(r.dp>=0?'+':'')+r.dp.toFixed(1):'—'],['Миграция',mig.map(([id,m])=>`${nm(id)} ${m>0?'+':''}${m}`).join(', ')||'нет'],['Граница',{open:'открыта',allies:'только союзникам',closed:'закрыта'}[S.mig]]])+
      '<p class="log" style="font-size:12.5px">Люди приезжают, когда есть свободное жильё и настроение от 40%. Дом без электричества заселён на 50%, без рынка на 60%.</p>'}
  if(k==='job'){t='Работа';const G=[['Ратуша',0],['Еда',1],['Энергия',2],['Службы и логистика',3],['Добыча',4],['Заводы',5]],agg=G.map(()=>[0,0]);
    for(const i of c.list){const d=B[S.bld[i].t];if(!d.jobs)continue;const p=PRI(S.bld[i].t);agg[p][0]+=d.jobs;agg[p][1]+=d.jobs*(c.st[i]||0)}
    b=chart([{v:H_('unemp').map(v=>v*100),col:'#ff7d68',n:'Безработица, %',area:1}],{label:'Безработица',f:v=>v.toFixed(0)+'%',min:0})+
      kv([['Занято / мест',`${fmt(c.emp)} / ${fmt(c.jobs)}`],['Безработица',pct(r?r.unemp:0)]])+'<h3 style="margin:6px 0 0;font:600 12px var(--f-body);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Укомплектованность по очереди найма</h3>'+
      G.map(([n],p)=>agg[p][0]?fbar(`${p}. ${n} · ${fmt(agg[p][1])}/${fmt(agg[p][0])}`,agg[p][1]/agg[p][0]):'').join('')+'<p class="log" style="font-size:12.5px">Рабочие идут сначала в верхние группы, внутри группы — ближе к дому.</p>'}
  if(k==='mood'){t='Настроение';const maxF=r?Math.max(20,...r.F.map(f=>Math.abs(f[1]))):1;
    b=chart([{v:H_('happy'),col:'#f4b63f',n:'Настроение',area:1}],{label:'Настроение',f:v=>v.toFixed(0)+'%',min:0,max:100,th:30})+
      `<div class="mood">${r?r.F.filter(f=>Math.abs(f[1])>=.5).map(f=>{const w=Math.min(50,Math.abs(f[1])/maxF*50);return`<div class="mrow"><span>${f[0]}</span><span class="mbar"><i style="left:${f[1]>=0?50:50-w}%;width:${w}%;background:${f[1]>=0?'var(--good)':'var(--bad)'}"></i></span><span class="${f[1]>=0?'up':'dn'}">${f[1]>=0?'+':'−'}${Math.abs(f[1]).toFixed(0)}</span></div>`}).join(''):''}</div><p class="log" style="font-size:12.5px">Пунктир — 30%: ниже растут протесты.</p>`}
  if(k==='pow'){t='Энергия';const src={};let dark=0;for(const i of c.list){const bb=S.bld[i],d=B[bb.t];if(d.pow>0)src[bb.t]=(src[bb.t]||0)+1;if(d.pow<0&&!PW[i])dark++}
    b=kv([['Потребление / выработка',`${fmt(c.use)} / ${fmt(c.sup)}`],['Покрытие спроса',pct(c.pr)],...Object.entries(src).map(([t,n])=>[B[t].n,`${n} шт.`]),['Уголь для ТЭС',r&&c.coalPl?pct(r.fuel):'не нужен'],['Зданий без электричества',dark?pill(dark,'bad'):pill('нет')]])+
      '<p class="log" style="font-size:12.5px">Энергия доходит только до зданий в ореолах ратуши, ветряков, ТЭС и подстанций. Подстанция передаёт ток дальше, если сама стоит в зоне.</p>'}
  if(k==='gdp'){t='ВВП';const rows=r?RK.filter(k=>r.prod[k]>.05).map(k=>[`${rd(k)}${RES[k].n}`,`${fmt(r.prod[k]*S.dom[k])} кр`]):[];
    b=chart([{v:H_('gdp'),col:'#6aa8ff',n:'ВВП в месяц',area:1}],{label:'ВВП'})+kv([['ВВП за месяц',fmt(h.gdp||0)+' кр'],['Рост к прошлому году',r?((r.growth>=0?'+':'')+(r.growth*100).toFixed(1)+'%'):'—'],['Торговый баланс',r?money(r.expV-r.impV)+' кр':'—'],...rows])}
  if(k==='infl'){t='Инфляция';const W={food:.5,goods:.25,cloth:.15,coffee:.1};
    b=chart([{v:H_('infl').map(v=>v*100),col:'#ff8fa3',n:'Инфляция за год, %'}],{label:'Инфляция',f:v=>v.toFixed(1)+'%',th:8})+kv([['Индекс цен',(h.cpi||100).toFixed(1)],
      ...Object.keys(W).map(k=>[`${rd(k)}${RES[k].n} (вес ${W[k]*100}%)`,`${S.dom[k].toFixed(1)} при норме ${RES[k].base}`])])+'<p class="log" style="font-size:12.5px">Цены растут, когда спрос больше предложения. Импорт и новые производства сбивают их.</p>'}
  if(k==='debt'){t='Долг';const g12=r?r.g12:0;
    b=chart([{v:H_('debt'),col:'#c9a227',n:'Долг',area:1}],{label:'Долг',min:0})+kv([['Внешние займы',fmt(debtTotal())+' кр'],['Минус в казне',fmt(Math.max(0,-S.money))+' кр'],['Долг к годовому ВВП',g12?pct((debtTotal()+Math.max(0,-S.money))/g12):'—'],
      ...S.loans.map(l=>[`Заём у ${nm(l.nid)}`,`осталось ${fmt(l.left)}, ${fmt(l.pay)}/мес`]),...S.lent.map(l=>[`Должен вам ${nm(l.nid)}`,`${fmt(l.left)}, ${fmt(l.pay)}/мес`])])}
  if(k==='appr'){t='Рейтинг власти';const th=DIFF[S.diff].th,g=r?r.growth:0,inf=h.infl||0;
    b=chart([{v:H_('appr'),col:'#79d69a',n:'Рейтинг'},{v:H_('parl'),col:'#6aa8ff',n:'Поддержка парламента'}],{label:'Рейтинг',f:v=>v.toFixed(0)+'%',min:0,max:100,th})+
      kv([['Рейтинг',pct(S.appr/100)],['Порог победы',th+'%'],['Настроение (вес 55%)',`+${(S.happy*.55).toFixed(0)}`],['Занятость',`+${((1-(r?r.unemp:0))*15).toFixed(0)}`],['Рост экономики',(g*50>=0?'+':'')+Math.max(-10,Math.min(10,g*50)).toFixed(0)],
      ['Инфляция выше 8%',inf>.08?'−'+Math.min(15,(inf-.08)*100).toFixed(0):'0'],['Казна в минусе',S.money<0?'−10':'0'],['Протесты',pct(S.unrest/100)]])+'<p class="log" style="font-size:12.5px">Пунктир — порог победы на выборах.</p>'}
  return`<div class="sheet-in">${sheetTop(t)}<div class="sec">${b}</div></div>`}
function govHTML(){const D=DIFF[S.diff],left=S.nextEl-S.month,mon=S.gov==='mon';
  const meter=(v,col)=>`<div class="meter"><i style="width:${Math.max(0,Math.min(100,v))}%;background:${col}"></i></div>`;
  const facW={agr:'Высокие цены на еду, низкий налог на бизнес, мало импорта еды.',ind:'Загруженные заводы, энергия, склады, налог на бизнес до 12%.',trd:'Экспорт, низкие пошлины, торговые договоры.',peo:'Хорошее настроение и работа для всех.'};
  let st=mon?kv([['Лояльность армии',`${Math.round(S.army)}`],['Угроза переворота',`${(S.coup*100).toFixed(1)}% в месяц`]])+meter(S.army,S.army>=50?'var(--good)':'var(--bad)')+
      `<div class="acts"><button class="ibtn txt" type="button" id="g-bribe" data-tip="2 000 кр знати: довольство всех сословий +12 (постепенно спадает), армия +3.">Подарки знати · 2 000</button><button class="ibtn txt" type="button" id="g-guard" aria-pressed="${!!S.guard}" data-tip="80 кр в месяц: лояльность армии постепенно растёт на 12.">${S.guard?'Распустить гвардию':'Содержать гвардию · 80/мес'}</button></div>`
    :kv([['Следующие выборы',`через ${yrs(left)}`],['Кто голосует',S.gov==='demo'?'народ, по рейтингу':'парламент, по фракциям'],[left<=24?'Опрос':'Сейчас бы получили',`${Math.round(S.gov==='demo'?S.appr:S.parl)}% при пороге ${D.th}%`]]);
  const seats=`<div class="seats" aria-label="Места в парламенте">${Object.keys(FAC).map(f=>`<i style="width:${S.seats[f]}%;background:${FAC[f].c}" data-tip="${FAC[f].n}: ${S.seats[f]} мест"></i>`).join('')}</div>`;
  const facs=`<div class="facs">${Object.keys(FAC).map(f=>`<div class="fac" data-tip="Хотят: ${facW[f]}"><b><i style="background:${FAC[f].c}"></i>${mon?FAC[f].m:FAC[f].n} · ${S.seats[f]}</b>${meter(S.fac[f].sat,S.fac[f].sat>=50?'var(--good)':S.fac[f].sat>=30?'var(--sun)':'var(--bad)')}<span class="log" style="font-size:12px">Довольство ${Math.round(S.fac[f].sat)}%. ${facW[f]}</span></div>`).join('')}</div>`;
  const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
  const tr=c=>`${pill(c.loy?'лоялен':'амбициозен',c.loy?'':'mid')}${pill(c.risk?'рисковый':'осторожный')}${c.caught?pill('вор','bad'):pill('честность ?','mid')}`;
  const posts=Object.keys(POSTS).map(p=>{const P=POSTS[p],m=S.min[p];
    if(m)return`<div class="post"><h4>Министр ${P.n.toLowerCase()}</h4><div class="cand"><span class="nm">${m.name} <span class="stars">${stars(m.sk)}</span></span><button class="ibtn txt" type="button" data-fire="${p}" data-tip="${m.loy?'Уйдёт без последствий.':'Амбициозный министр уйдёт в оппозицию: протесты +8.'}">Уволить</button><span class="tr">${tr(m)}${pill(m.sal+' кр/мес')}</span></div>
      <p>${P.b}</p><div class="seg"><button class="tg" type="button" data-mode="${p}" data-v="0" aria-pressed="${!m.auto}" data-tip="Вы решаете сами, министр даёт бонус навыка и советует.">Советник</button><button class="tg" type="button" data-mode="${p}" data-v="1" aria-pressed="${!!m.auto}" data-tip="${P.a}">Доверить сферу</button></div>
      <p><b style="color:var(--paper)">${m.auto?'Решение':'Совет'}:</b> ${m.tip||'появится через месяц.'}</p></div>`;
    return`<div class="post"><h4>Министерство ${P.n.toLowerCase()}</h4><p>Министра нет, сферой управляете вы. ${S.adv&&S.adv[p]?'Подсказка: '+S.adv[p]:''}</p>
      ${S.cand[p].map(c=>`<div class="cand"><span class="nm">${c.name} <span class="stars">${stars(c.sk)}</span></span><button class="ibtn txt" type="button" data-hire="${p}" data-id="${c.id}" data-tip="${P.b} Автопилот: ${P.a}">Назначить</button><span class="tr">${tr(c)}${pill(c.sal+' кр/мес')}</span></div>`).join('')}
      <p>Новые кандидаты появятся в январе.</p></div>`}).join('');
  const others=Object.keys(GOVS).filter(g=>g!==S.gov);
  return`<div class="sheet-in">${sheetTop('Власть')}
  <div class="sec"><h3>${GOVS[S.gov].n} · ${D.n.toLowerCase()} сложность</h3><p class="log">${GOVS[S.gov].d}</p>${st}
    <div data-tip="На 100% вас свергнут. Растут при настроении ниже 30%, голоде, пустой казне и низком рейтинге."><div class="kv"><div><span>Протесты</span><span>${Math.round(S.unrest)}%</span></div></div>${meter(S.unrest,S.unrest>=50?'var(--bad)':'var(--sun)')}</div></div>
  <div class="sec"><h3>${mon?'Сословия':'Парламент'}${mon?'':` · поддержка ${Math.round(S.parl)}%`}</h3>${seats}${facs}<p class="log" style="font-size:12.5px">Места делятся по тому, где работают люди: больше ферм — больше аграриев. Фракция голосует за вас, если довольна своей сферой.</p></div>
  <div class="sec"><h3>Кабинет министров</h3><p class="log" style="font-size:12.5px">Как в футбольном менеджере: доверьте сферу министру или ведите её сами. Честность кандидата видна только после скандала.</p><div class="mins">${posts}</div></div>
  <div class="sec"><h3>Реформа строя</h3><p class="log" style="font-size:12.5px">Стоит 3 000 кр, возможна раз в 5 лет. ${mon?'Нужны лояльность армии от 60 и рейтинг от 50.':'Нужна поддержка парламента от 60%.'} Солмар ценит республики, Авалис — монархию.</p>
    <div class="acts">${others.map(g=>`<button class="ibtn txt" type="button" data-reform="${g}" data-tip="${GOVS[g].d}">Сделать: ${GOVS[g].n.toLowerCase()}</button>`).join('')}</div></div></div>`}
function bindGov(){const el=$('#sheet'),go=m=>{toast(m);refresh()};
  const b1=$('#g-bribe');if(b1)b1.onclick=()=>go(bribe());const b2=$('#g-guard');if(b2)b2.onclick=()=>{S.guard=S.guard?0:1;go(S.guard?'Гвардия набрана':'Гвардия распущена')};
  el.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>go(hire(b.dataset.hire,b.dataset.id)));
  el.querySelectorAll('[data-fire]').forEach(b=>b.onclick=()=>go(fire(b.dataset.fire)));
  el.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{S.min[b.dataset.mode].auto=+b.dataset.v;go(+b.dataset.v?'Сфера доверена министру':'Министр стал советником')});
  el.querySelectorAll('[data-reform]').forEach(b=>b.onclick=()=>go(reform(b.dataset.reform)))}
