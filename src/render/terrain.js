/* Изометрия: рельеф, дороги, деревья, значки и иконки инструментов. Кэш рельефа. */
const OX=N*TW/2,OY=6*EH+10,CW=N*TW,CH=N*TH+OY+20;
const rgb=(c,f=1)=>`rgb(${Math.min(255,c[0]*f|0)},${Math.min(255,c[1]*f|0)},${Math.min(255,c[2]*f|0)})`;
const HEXC={};const hex=h=>HEXC[h]||(HEXC[h]=[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
function base(i){const x=i%N,y=i/N|0;return[OX+(x-y)*TW/2,OY+(x+y)*TH/2]}
const eAt=i=>S.road[i]===2?1:S.elev[i];
function poly(g,p,fill){g.beginPath();g.moveTo(p[0],p[1]);for(let k=2;k<p.length;k+=2)g.lineTo(p[k],p[k+1]);g.closePath();g.fillStyle=fill;g.fill()}
function dia(cx,cy,s=1){const w=TW/2*s,h=TH/2*s,my=cy+TH/2;return[cx,my-h,cx+w,my,cx,my+h,cx-w,my]}
let cache=null,cg=null,CS=1,dirty=true,WD=null,WAVES=[];

function initStatic(){
  WD=new Uint8Array(N*N).fill(9);const q=[];
  for(let i=0;i<N*N;i++)if(S.type[i]>=SAND){WD[i]=0;q.push(i)}
  for(let h=0;h<q.length;h++){const i=q[h];for(const j of nb4(i))if(WD[j]>WD[i]+1&&S.type[j]<=SHAL){WD[j]=WD[i]+1;q.push(j)}}
  WAVES=[];const R=rng(S.mi*13+5);
  for(let k=0;k<400&&WAVES.length<90;k++){const i=Math.floor(R()*N*N);if(S.type[i]===DEEP&&WD[i]>=2)WAVES.push({i,ph:R()*6.28,dx:(R()-.5)*20})}
  if(!cache){CS=Math.min(1.6,Math.sqrt(9e6/(CW*CH)));cache=document.createElement('canvas');cache.width=Math.ceil(CW*CS);cache.height=Math.ceil(CH*CS);cg=cache.getContext('2d')}
  dirty=true;
}
function renderCache(){
  const g=cg;g.setTransform(CS,0,0,CS,0,0);g.fillStyle=rgb(TERR[0].c,.9);g.fillRect(0,0,CW,CH);
  for(let s=0;s<2*N-1;s++)for(let x=Math.max(0,s-N+1);x<=Math.min(N-1,s);x++)drawTile(g,(s-x)*N+x);
  dirty=false;
}
function drawTile(g,i){
  const t=S.type[i],e=S.elev[i],[cx,by]=base(i),cy=by-e*EH,x=i%N,y=i/N|0,j=1+(h2(i,3,11)-.5)*.08;
  const lf=(t>=SAND&&!S.regions[S.reg[i]].own)?.66:1;
  if(e>0){const sd=SIDE[t],hh=e*EH;
    poly(g,[cx-TW/2,cy+TH/2,cx,cy+TH,cx,cy+TH+hh,cx-TW/2,cy+TH/2+hh],rgb(sd,.96*lf));
    poly(g,[cx,cy+TH,cx+TW/2,cy+TH/2,cx+TW/2,cy+TH/2+hh,cx,cy+TH+hh],rgb(sd,.7*lf));
    if(hh>EH){g.strokeStyle=rgb(sd,.6*lf);g.lineWidth=1;g.beginPath();for(let k=1;k<e;k++){const yy=k*EH;g.moveTo(cx-TW/2,cy+TH/2+yy);g.lineTo(cx,cy+TH+yy);g.lineTo(cx+TW/2,cy+TH/2+yy)}g.stroke()}
  }
  let c=TERR[t].c;
  if(t===DEEP){const k=Math.min(1,(WD[i]-1)/5);c=[44-14*k|0,114-26*k|0,140-22*k|0]}
  else if(t===SHAL){c=WD[i]<=1?[70,160,170]:[56,140,156]}
  poly(g,dia(cx,cy),rgb(c,j*lf));
  if(t>=SAND&&t<=HILL){for(let k=0;k<4;k++){const u=h2(i,k,5)-.5,v=h2(i,k,6)-.5;g.fillStyle=rgb(c,(t===SAND?.93:.86)*lf);g.fillRect(cx+(u-v)*TW*.4-1.5,cy+TH/2+(u+v)*TH*.4-.8,3,1.6)}}
  if(t===HILL||t===MOUNT){for(let k=0;k<3;k++){const u=(h2(i,k,8)-.5)*.6,v=(h2(i,k,9)-.5)*.6,px=cx+(u-v)*TW/2,py=cy+TH/2+(u+v)*TH/2;poly(g,[px-4,py+1,px,py-3,px+4,py+1],rgb(MIN[regOf(i).min].c,lf));poly(g,[px-1.5,py-1.5,px,py-3,px+1,py-1],rgb([255,255,255],.35*lf+.4))}}
  if(t===MOUNT&&e>=5)poly(g,dia(cx,cy,.6),rgb([242,244,240],lf));
  if(t<=SHAL){const C=[[cx,cy],[cx+TW/2,cy+TH/2],[cx,cy+TH],[cx-TW/2,cy+TH/2]],E=[[1,1,2],[-1,3,0],[N,2,3],[-N,0,1]];
    g.strokeStyle='rgba(236,248,244,.6)';g.lineWidth=1.6;g.beginPath();
    for(const[d,a,b]of E){const k=i+d;if((d===1&&x===N-1)||(d===-1&&x===0)||k<0||k>=N*N)continue;if(S.type[k]>=SAND){g.moveTo(C[a][0],C[a][1]);g.lineTo(C[b][0],C[b][1])}}
    g.stroke()}
  if(t>=SAND){const r=S.reg[i];g.save();g.setLineDash([5,4]);g.strokeStyle='rgba(255,236,190,.8)';g.lineWidth=1.5;g.beginPath();let any=0;
    if(x<N-1&&S.type[i+1]>=SAND&&S.reg[i+1]!==r){g.moveTo(cx+TW/2,cy+TH/2);g.lineTo(cx,cy+TH);any=1}
    if(y<N-1&&S.type[i+N]>=SAND&&S.reg[i+N]!==r){g.moveTo(cx,cy+TH);g.lineTo(cx-TW/2,cy+TH/2);any=1}
    if(any)g.stroke();g.restore()}
  if(S.road[i])drawRoad(g,i);
}
function drawRoad(g,i){
  const br=S.road[i]===2,e=eAt(i),[cx,by]=base(i),my=by-e*EH+TH/2,x=i%N;
  const D=[[1,TW/4,TH/4],[-1,-TW/4,-TH/4],[N,-TW/4,TH/4],[-N,TW/4,-TH/4]],ends=[];
  for(const[d,ox,oy]of D){const k=i+d;if((d===1&&x===N-1)||(d===-1&&x===0)||k<0||k>=N*N)continue;
    if(S.road[k]||(S.bld[k]&&S.bld[k].t==='hall'))ends.push([cx+ox,my+oy+(e-eAt(k))*EH/2])}
  if(br){g.fillStyle='#5b3f27';g.fillRect(cx-2.5,my-1,5,EH+6);for(const[ex,ey]of ends){g.fillRect((cx+ex)/2-2,(my+ey)/2,4,EH+4)}}
  g.lineCap='round';g.lineWidth=12;g.strokeStyle=br?'#8c6a44':'#5f6668';g.beginPath();
  if(!ends.length){g.arc(cx,my,6,0,6.3);g.fillStyle=g.strokeStyle;g.fill()}else{for(const[ex,ey]of ends){g.moveTo(cx,my);g.lineTo(ex,ey)}g.stroke()}
  g.lineWidth=9;g.strokeStyle=br?'#a8825a':'#737b7c';g.beginPath();for(const[ex,ey]of ends){g.moveTo(cx,my);g.lineTo(ex,ey)}g.stroke();
  if(!br&&ends.length){g.save();g.setLineDash([3,4]);g.lineWidth=1.2;g.strokeStyle='rgba(240,228,180,.85)';g.beginPath();for(const[ex,ey]of ends){g.moveTo(cx,my);g.lineTo(ex,ey)}g.stroke();g.restore()}
  g.lineCap='butt';
}

function iso(g,mx,my){
  const P=(u,v,z)=>[mx+(u-v)*TW/2,my+(u+v)*TH/2-z];
  const F=(p,c)=>{g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let k=1;k<p.length;k++)g.lineTo(p[k][0],p[k][1]);g.closePath();g.fillStyle=c;g.fill()};
  const box=(u0,v0,u1,v1,z0,z1,c)=>{const C=hex(c);
    F([P(u1,v0,z0),P(u1,v1,z0),P(u1,v1,z1),P(u1,v0,z1)],rgb(C,.72));
    F([P(u0,v1,z0),P(u1,v1,z0),P(u1,v1,z1),P(u0,v1,z1)],rgb(C,.9));
    F([P(u0,v0,z1),P(u1,v0,z1),P(u1,v1,z1),P(u0,v1,z1)],rgb(C,1.06))};
  const gable=(u0,v0,u1,v1,z,rh,c,w)=>{const C=hex(c),vm=(v0+v1)/2;
    F([P(u0,v0,z),P(u1,v0,z),P(u1,vm,z+rh),P(u0,vm,z+rh)],rgb(C,1.1));
    F([P(u0,vm,z+rh),P(u1,vm,z+rh),P(u1,v1,z),P(u0,v1,z)],rgb(C,.86));
    F([P(u1,v0,z),P(u1,v1,z),P(u1,vm,z+rh)],rgb(hex(w),.72))};
  const pyr=(u0,v0,u1,v1,z,rh,c)=>{const C=hex(c),A=P((u0+u1)/2,(v0+v1)/2,z+rh);
    F([P(u0,v0,z),P(u1,v0,z),A],rgb(C,1.1));F([P(u0,v0,z),P(u0,v1,z),A],rgb(C,1));
    F([P(u1,v0,z),P(u1,v1,z),A],rgb(C,.72));F([P(u0,v1,z),P(u1,v1,z),A],rgb(C,.88))};
  const winR=(u,v0,v1,z,n,h,c)=>{const s=(v1-v0)/n,w=s*.26;for(let k=0;k<n;k++){const v=v0+(k+.5)*s;F([P(u,v-w,z),P(u,v+w,z),P(u,v+w,z+h),P(u,v-w,z+h)],c)}};
  const winL=(v,u0,u1,z,n,h,c)=>{const s=(u1-u0)/n,w=s*.26;for(let k=0;k<n;k++){const u=u0+(k+.5)*s;F([P(u-w,v,z),P(u+w,v,z),P(u+w,v,z+h),P(u-w,v,z+h)],c)}};
  const flat=(u0,v0,u1,v1,z,c)=>F([P(u0,v0,z),P(u1,v0,z),P(u1,v1,z),P(u0,v1,z)],c);
  const line=(a,b)=>{g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()};
  return{P,F,box,gable,pyr,winR,winL,flat,line};
}
const WALLS=['#efe3c8','#e8cba9','#d6e2de','#f0d4c4','#e3dcc0'],ROOFS=['#b4533c','#8e5b3d','#4d7f88','#a8673f','#7a4f6a'];
const HT={hall:46,house:24,tower:64,farm:22,saw:22,mine:34,factory:46,shop:22,port:44,power:36,park:16,hut:18,villa:30,veg:18,ranch:20,fish:30,coffee:20,cotton:16,coalmine:34,ironmine:34,goldmine:34,textile:40,cannery:44,wind:46,store:24,sub:28,school:32,clinic:30,police:28};
function coolTower(g,bx,by,s){const gr=g.createLinearGradient(bx-11*s,0,bx+11*s,0);gr.addColorStop(0,'#eef0ea');gr.addColorStop(1,'#9fa59f');
  g.beginPath();g.moveTo(bx-11*s,by);g.quadraticCurveTo(bx-5*s,by-17*s,bx-8*s,by-30*s);g.lineTo(bx+8*s,by-30*s);g.quadraticCurveTo(bx+5*s,by-17*s,bx+11*s,by);
  g.ellipse(bx,by,11*s,4*s,0,0,Math.PI);g.fillStyle=gr;g.fill();g.beginPath();g.ellipse(bx,by-30*s,8*s,3*s,0,0,6.3);g.fillStyle='#6f7571';g.fill()}
function drawBase(g,t,mx,my,i){
  const I=iso(g,mx,my),v=h2(i,9,9),k=v*5|0;
  switch(t){
  case'hall':I.box(-.44,-.44,.44,.44,0,3,'#cfc6b2');I.box(-.3,-.3,.3,.3,3,23,'#ece6d6');I.winR(.3,-.3,.3,10,3,7,'#3b5560');I.winL(.3,-.3,.3,10,3,7,'#3b5560');
    I.box(-.08,.3,.08,.36,3,15,'#ece6d6');I.pyr(-.34,-.34,.34,.34,23,16,'#3f8f86');{const a=I.P(0,0,39);g.strokeStyle='#2c2c2c';g.lineWidth=1.3;I.line(a,[a[0],a[1]-15]);
    const w=Math.sin(performance.now()/300)*1.5;I.F([[a[0],a[1]-15],[a[0]+11,a[1]-12+w],[a[0],a[1]-9]],'#f4b63f')}break;
  case'house':{const w=WALLS[k],r=ROOFS[(v*37|0)%5];I.box(-.27,-.22,.21,.24,0,12,w);I.gable(-.31,-.26,.25,.28,12,9,r,w);
    I.winL(.24,-.22,.16,4,2,5,'#41606a');I.winR(.21,-.18,.2,4,1,5,'#41606a');if(k%2)I.box(.24,-.42,.38,-.28,0,7,'#b9a27d');break}
  case'tower':{const w=['#cdd6d9','#d9cfc2','#c6d3cc'][k%3];I.box(-.3,-.3,.3,.3,0,56,w);
    for(let z=6;z<53;z+=7){I.winR(.3,-.3,.3,z,4,4,'#3d5965');I.winL(.3,-.3,.3,z,4,4,'#4a6a74')}I.box(-.12,-.12,.1,.1,56,62,'#9aa3a6');break}
  case'farm':I.flat(-.47,-.47,.47,.47,0,'#d8b85c');g.strokeStyle='#b48f3a';g.lineWidth=1;for(let q=-.4;q<=.42;q+=.12)I.line(I.P(-.02,q,0),I.P(.45,q,0));
    I.flat(-.47,.05,-.05,.47,0,'#9ccf6a');I.box(-.44,-.42,-.12,-.1,0,10,'#a9493b');I.gable(-.46,-.44,-.1,-.08,10,7,'#5a3a2e','#a9493b');
    I.box(-.42,.14,-.28,.28,0,17,'#c9c6bd');I.pyr(-.42,.14,-.28,.28,17,4,'#8b8f8f');break;
  case'saw':I.box(-.34,-.3,.12,.22,0,11,'#a87a4d');I.gable(-.38,-.34,.16,.26,11,8,'#6a4a33','#a87a4d');
    for(let q=0;q<3;q++)I.box(.18,-.32+q*.14,.44,-.22+q*.14,0,4,'#8a5e38');I.box(.2,-.27,.42,.02,4,8,'#9c6c42');break;
  case'mine':{I.box(-.38,-.38,.06,.18,0,9,'#77706a');I.F([I.P(-.22,.18,0),I.P(-.06,.18,0),I.P(-.06,.18,6),I.P(-.22,.18,6)],'#1e1c1b');
    const a=I.P(.24,-.12,0),b=I.P(.24,.22,0),tp=I.P(.24,.05,32);g.strokeStyle='#4a3a2c';g.lineWidth=2;I.line(a,tp);I.line(b,tp);I.line(I.P(.1,.05,0),tp);
    g.beginPath();g.arc(tp[0],tp[1],4,0,6.3);g.stroke();I.pyr(.12,.24,.44,.46,0,8,'#8c5b45');break}
  case'factory':I.box(-.44,-.32,.3,.34,0,15,'#b5b9b2');for(let q=0;q<3;q++){const v0=-.32+q*.22;I.gable(-.44,v0,.3,v0+.22,15,6,'#7d8a8c','#b5b9b2')}
    I.winL(.34,-.44,.3,4,5,6,'#3e5862');I.box(.12,-.46,.24,-.34,0,44,'#a64b3b');I.box(.12,-.46,.24,-.34,36,39,'#ece6d6');break;
  case'shop':I.box(-.32,-.28,.32,.18,0,13,'#f1e7d1');I.winL(.18,-.3,.3,2,3,6,'#4a6b74');
    for(let q=0;q<6;q++){const u0=-.34+q*.113,u1=u0+.113;I.F([I.P(u0,.18,12),I.P(u1,.18,12),I.P(u1,.33,7),I.P(u0,.33,7)],q%2?'#f6efe1':'#e05a47')}
    I.box(-.12,-.14,.12,.04,13,19,'#f4b63f');break;
  case'port':{I.box(-.48,-.48,.48,.48,-7,2,'#9a7448');g.strokeStyle='rgba(60,40,24,.5)';g.lineWidth=1;for(let q=-.36;q<.48;q+=.12)I.line(I.P(-.48,q,2),I.P(.48,q,2));
    I.box(-.4,-.4,-.08,-.22,2,9,'#c44f3a');I.box(-.4,-.18,-.08,0,2,9,'#3f7f9a');I.box(-.4,-.4,-.08,-.22,9,16,'#e0a83a');
    let du=1,dv=0;if(i>=0&&S){if(S.type[i+N]<=SHAL){du=0;dv=1}else if(S.type[i+1]<=SHAL){du=1;dv=0}else if(S.type[i-1]<=SHAL){du=-1;dv=0}else if(S.type[i-N]<=SHAL){du=0;dv=-1}}
    const b0=I.P(.15,.15,2),tp=I.P(.15,.15,40),tip=I.P(.15+du*.75,.15+dv*.75,40);g.strokeStyle='#d9a441';g.lineWidth=2.4;I.line(b0,tp);I.line(tp,tip);I.line(I.P(.15,.15,24),tip);
    g.strokeStyle='#333';g.lineWidth=1;I.line(tip,[tip[0],tip[1]+14]);break}
  case'power':{I.box(-.42,-.02,.04,.42,0,13,'#c7cbc3');I.winL(.42,-.42,.04,5,3,4,'#50656d');const a=I.P(-.18,-.24,0),b=I.P(.22,-.14,0);coolTower(g,a[0],a[1],.9);coolTower(g,b[0],b[1],1);break}
  case'park':{I.flat(-.47,-.47,.47,.47,0,'#7bbd5f');I.flat(-.47,-.05,.47,.05,0.3,'#e3d5a6');I.flat(-.05,-.47,.05,.47,0.3,'#e3d5a6');
    const f=I.P(0,0,0);g.fillStyle='#7fc4d6';g.beginPath();g.ellipse(f[0],f[1],7,3.5,0,0,6.3);g.fill();
    for(const[u,w]of[[-.26,-.26],[.26,-.24],[-.24,.26],[.27,.27]]){const p=I.P(u,w,0);g.fillStyle='#5a4128';g.fillRect(p[0]-1,p[1]-6,2,6);g.fillStyle='#3e8a4c';g.beginPath();g.arc(p[0],p[1]-11,7,0,6.3);g.fill();g.fillStyle='#5aa863';g.beginPath();g.arc(p[0]-2,p[1]-13,3.5,0,6.3);g.fill()}break}
  }
}
function drawTrees(g,cx,my,i,lf){
  const n=2+(h2(i,1,2)*2.2|0),pts=[];
  for(let k=0;k<n;k++)pts.push([(h2(i,k,21)-.5)*.62,(h2(i,k,22)-.5)*.62,.8+h2(i,k,23)*.5]);
  pts.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);
  for(const[u,v,s]of pts){const px=cx+(u-v)*TW/2,py=my+(u+v)*TH/2;
    g.fillStyle='rgba(0,0,0,.16)';g.beginPath();g.ellipse(px+3,py,6*s,2.4*s,0,0,6.3);g.fill();
    g.fillStyle=rgb([90,65,40],lf);g.fillRect(px-1,py-5*s,2,5*s);
    poly(g,[px,py-25*s,px-7.5*s,py-6*s,px,py-4*s],rgb([70,138,66],lf));poly(g,[px,py-25*s,px,py-4*s,px+7.5*s,py-6*s],rgb([46,104,52],lf))}
}
function bubble(g,x,y,col,sym){g.beginPath();g.arc(x,y,7,0,6.3);g.fillStyle=col;g.fill();g.lineWidth=1.5;g.strokeStyle='#fff';g.stroke();
  g.fillStyle='#1b1b1b';g.font='700 10px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(sym,x,y+.5)}
function drawObjects(g,V,pr){
  for(let s=0;s<2*N-1;s++)for(let x=Math.max(0,s-N+1);x<=Math.min(N-1,s);x++){
    const i=(s-x)*N+x,b=S.bld[i],t=S.type[i];if(!b&&t!==FOREST)continue;
    const[cx,by]=base(i);if(cx<V.x0-TW||cx>V.x1+TW||by+TH<V.y0||by-80>V.y1)continue;
    const my=by-S.elev[i]*EH+TH/2;
    if(b){drawB(g,b.t,cx,my,i);if(b.t!=='hall'){if(!CONN[i])bubble(g,cx,my-HT[b.t]-8,'#ff7d68','!');else if((pr<1||!PW[i])&&B[b.t].pow<0)bubble(g,cx,my-HT[b.t]-8,'#f4b63f','⚡')}}
    else drawTrees(g,cx,my,i,S.regions[S.reg[i]].own?1:.66);
  }
}
function outline(g,i,col,fill){const[cx,by]=base(i),cy=by-eAt(i)*EH;g.lineWidth=2;g.strokeStyle=col;g.beginPath();const p=dia(cx,cy);g.moveTo(p[0],p[1]);for(let k=2;k<8;k+=2)g.lineTo(p[k],p[k+1]);g.closePath();if(fill){g.fillStyle=fill;g.fill()}g.stroke()}
function drawIcon(cv,tool){
  const g=cv.getContext('2d'),W=cv.width,H=cv.height;g.clearRect(0,0,W,H);const s=tool in HT?Math.min(.62,30/HT[tool]):.62;
  g.save();g.translate(W/2,H-6);g.scale(W/48*s,W/48*s);const my=-TH/2,cx=0;
  poly(g,dia(cx,-TH),tool==='mine'?'#aba06c':tool==='port'?'#e2ce94':'#8dbe5c');
  if(tool==='road'){g.lineCap='round';g.lineWidth=12;g.strokeStyle='#737b7c';g.beginPath();g.moveTo(-TW/4,my-TH/4);g.lineTo(TW/4,my+TH/4);g.stroke()}
  else if(tool==='inspect'){g.lineWidth=5;g.strokeStyle='#eaf2ee';g.beginPath();g.arc(-4,my-14,11,0,6.3);g.stroke();g.lineCap='round';g.beginPath();g.moveTo(4,my-6);g.lineTo(14,my+4);g.stroke()}
  else if(tool==='bull'){g.lineWidth=6;g.lineCap='round';g.strokeStyle='#ff7d68';g.beginPath();g.moveTo(-12,my-12);g.lineTo(12,my+4);g.moveTo(12,my-12);g.lineTo(-12,my+4);g.stroke()}
  else drawB(g,tool,cx,my,7);
  g.restore();
}
