/* Генерация мира, новая игра, сохранение и загрузка. */
function genWorld(mi){
  const M=MAPS[mi],s=M.seed,type=new Uint8Array(N*N),elev=new Uint8Array(N*N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const i=y*N+x,nx=(x+.5)/N,ny=(y+.5)/N;
    let h=.40+M.amp*M.f(nx,ny)+.5*(fbm(nx*5,ny*5,s,4)-.5);
    if(M.peak)h+=.42*Math.max(0,1-Math.hypot(nx-.5,ny-.5)/.15);
    const e=Math.min(x,y,N-1-x,N-1-y);if(e<4)h=Math.min(h,.18+e*.035);
    const m=fbm(nx*7+40,ny*7+40,s+5,3);
    let t,el;
    if(h<.31){t=DEEP;el=0}else if(h<.39){t=SHAL;el=0}else if(h<.43){t=SAND;el=1}
    else if(h<.66){t=m>M.moist?FOREST:GRASS;el=h<.55?1:2}
    else if(h<.8){t=HILL;el=3}else{t=MOUNT;el=h<.9?4:5}
    type[i]=t;elev[i]=el;
  }
  const land=[];for(let i=0;i<N*N;i++)if(type[i]>=SAND)land.push(i);
  const R=rng(s*977+3),K=7;
  let seeds=[land[Math.floor(R()*land.length)]];
  const d2=(a,b)=>{const dx=a%N-b%N,dy=(a/N|0)-(b/N|0);return dx*dx+dy*dy};
  while(seeds.length<K){let best=land[0],bd=-1;for(const i of land){let md=1e9;for(const q of seeds)md=Math.min(md,d2(i,q));if(md>bd){bd=md;best=i}}seeds.push(best)}
  const near=i=>{let b=0,bd=1e9;for(let k=0;k<seeds.length;k++){const d=d2(i,seeds[k]);if(d<bd){bd=d;b=k}}return b};
  for(let it=0;it<4;it++){
    const sx=Array(K).fill(0),sy=Array(K).fill(0),sn=Array(K).fill(0);
    for(const i of land){const k=near(i);sx[k]+=i%N;sy[k]+=i/N|0;sn[k]++}
    seeds=seeds.map((q,k)=>{if(!sn[k])return q;const cx=sx[k]/sn[k],cy=sy[k]/sn[k];let b=q,bd=1e9;
      for(const i of land){const d=(i%N-cx)**2+((i/N|0)-cy)**2;if(d<bd&&!seeds.includes(i)||i===q&&d<bd){bd=d;b=i}}return b});
  }
  const reg=new Int8Array(N*N);for(let i=0;i<N*N;i++)reg[i]=near(i);
  const names=shuffle(REGION_NAMES.slice(),R);
  const regions=seeds.map((q,k)=>({n:names[k],land:0,grass:0,cx:0,cy:0,own:0,price:0}));
  for(const i of land){const g=regions[reg[i]];g.land++;if(type[i]===GRASS)g.grass++;g.cx+=i%N;g.cy+=i/N|0}
  regions.forEach(g=>{const l=Math.max(1,g.land);g.cx/=l;g.cy/=l;g.price=Math.round((REGK.base+g.land*REGK.perTile)/REGK.round)*REGK.round});
  let st=0;regions.forEach((g,k)=>{if(g.grass>regions[st].grass)st=k});regions[st].own=1;
  const mins=shuffle(['coal','iron','gold','coal','iron','coal','iron'],R);
  regions.forEach((g,k)=>{g.min=mins[k];g.warm=g.cy>N*.5?1:0;g.fert=+(REGK.fertMin+R()*REGK.fertRand).toFixed(2)});
  /* Сначала золото уезжает со стартовой области, потом наценка: она лежит там, где золото на самом деле. */
  if(regions[st].min==='gold'){const o=regions.findIndex(g=>g.min!=='gold');[regions[st].min,regions[o].min]=[regions[o].min,regions[st].min]}
  regions.forEach(g=>{if(g.min==='gold')g.price=Math.round(g.price*REGK.goldMul/REGK.round)*REGK.round});
  regions[st].fert=Math.max(regions[st].fert,1);
  if(!regions.some(g=>g.warm)){regions.reduce((a,g)=>g.cy>a.cy?g:a).warm=1}
  const ok=j=>j>=0&&j<N*N&&type[j]>=SAND&&type[j]<=HILL;
  let hall=-1,hd=1e9;
  for(const i of land){
    if(reg[i]!==st||!(type[i]===GRASS||type[i]===SAND))continue;
    const x=i%N,y=i/N|0;if(x<3||y<3||x>N-6||y>N-4)continue;
    if(![i+1,i+2,i+3,i-1,i-N,i+N,i-N+1,i-N+2].every(ok))continue;
    const d=(x-regions[st].cx)**2+(y-regions[st].cy)**2;if(d<hd){hd=d;hall=i}
  }
  if(hall<0)hall=seeds[st];
  return{type,elev,reg,regions,hall,start:st};
}

function newGame(mi){
  const W=genWorld(mi),z=v=>Object.fromEntries(RK.map(k=>[k,v]));
  const s={v:2,mi,type:W.type,elev:W.elev,reg:W.reg,regions:W.regions,hall:W.hall,
    bld:Array(N*N).fill(null),road:new Uint8Array(N*N),
    money:START.money,hh:START.hh,wage:WAGE.start,pop:START.pop,happy:START.happy,month:0,tax:Object.assign({},START.tax),
    stock:Object.assign(z(0),START.stock),dom:Object.fromEntries(RK.map(k=>[k,RES[k].base])),
    trade:Object.fromEntries(RK.map(k=>[k,{e:1,i:1}])),goal:0,log:[],rep:null,
    nat:initNations(),loans:[],lent:[],mig:'open',ev:null,evAt:-99,evHist:[],evNid:null,tut:null};
  const h=W.hall,clr=j=>{if(s.type[j]===FOREST)s.type[j]=GRASS};
  s.bld[h]={t:'hall'};clr(h);
  for(const j of[h+1,h+2,h+3])if(s.type[j]>=SAND&&s.type[j]<=HILL){s.road[j]=1;clr(j)}
  for(const j of[h-N+1,h-N+2])if(s.type[j]>=SAND&&s.type[j]<=HILL){s.bld[j]={t:'house'};clr(j)}
  s.log.unshift({m:0,t:'Город основан. Ведите дороги от ратуши, изучите области: где тепло, где плодородно, где какие залежи.'});
  return s;
}
const regOf=i=>S.regions[S.reg[i]];
const fert=i=>regOf(i).fert*(REGK.tileMin+REGK.tileRand*h2(i,4,4));
const depAt=i=>(S.type[i]===HILL||S.type[i]===MOUNT)?regOf(i).min:null;
function saveStr(){return JSON.stringify(Object.assign({},S,{type:Array.from(S.type),elev:Array.from(S.elev),reg:Array.from(S.reg),road:Array.from(S.road),rep:null}))}
function loadStr(str){const o=JSON.parse(str);o.type=Uint8Array.from(o.type);o.elev=Uint8Array.from(o.elev);o.reg=Int8Array.from(o.reg);o.road=Uint8Array.from(o.road);return migrateSave(o)}
