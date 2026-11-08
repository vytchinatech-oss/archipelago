/* Рисунки зданий (поверх базовых из terrain.js). */
function drawB(g,t,mx,my,i){
  const I=iso(g,mx,my),v=h2(i,9,9),k=v*5|0,tm=performance.now()/1000;
  switch(t){
  case'hut':I.box(-.36,-.3,.32,.02,0,8,'#b9a27d');I.gable(-.4,-.34,.36,.06,8,6,'#7b6a52','#b9a27d');I.winL(.02,-.36,.32,2,3,4,'#3f5056');
    I.box(-.36,.1,.1,.34,0,7,'#a8916b');I.gable(-.4,.06,.14,.38,7,5,'#6d5d47','#a8916b');break;
  case'villa':{I.flat(-.47,-.47,.47,.47,0,'#86c46a');I.box(-.3,-.3,.24,.18,0,16,'#f3ece0');I.winL(.18,-.3,.24,4,3,8,'#4a7884');I.winR(.24,-.3,.18,4,2,8,'#4a7884');
    I.pyr(-.34,-.34,.28,.22,16,10,'#b0563c');I.flat(.12,.24,.42,.44,.3,'#6fc2d4');
    for(const[u,w]of[[-.36,.32],[.38,-.36]]){const p=I.P(u,w,0);g.fillStyle='#3e8a4c';g.beginPath();g.arc(p[0],p[1]-8,5.5,0,6.3);g.fill()}break}
  case'veg':I.flat(-.47,-.47,.47,.47,0,'#7a5a3a');for(let q=-.4;q<=.42;q+=.14){I.flat(-.44,q-.04,.44,q+.04,.4,q>0?'#4f9a3e':'#6db04c');
      for(let u=-.38;u<.44;u+=.16){const p=I.P(u,q,1);g.fillStyle=q>0?'#d9583f':'#e9c94a';g.fillRect(p[0]-1,p[1]-2,2,2)}}
    I.box(.18,-.44,.44,-.2,0,8,'#d7e4e6');I.flat(.18,-.44,.44,-.2,8.2,'rgba(220,240,245,.85)');break;
  case'ranch':I.flat(-.47,-.47,.47,.47,0,'#9fca6c');g.strokeStyle='#8a6a44';g.lineWidth=1.2;
    for(const[a,b]of[[[-.44,-.44],[.44,-.44]],[[.44,-.44],[.44,.44]],[[.44,.44],[-.44,.44]],[[-.44,.44],[-.44,-.44]]]){const A=I.P(a[0],a[1],4),Bp=I.P(b[0],b[1],4);I.line(A,Bp)}
    I.box(-.4,-.4,-.12,-.16,0,9,'#8f4a36');I.gable(-.42,-.42,-.1,-.14,9,6,'#4d3a2e','#8f4a36');
    for(let q=0;q<3;q++){const p=I.P(.05+q*.13,.1+(q%2)*.15,0),x=p[0]+Math.sin(tm*.5+q)*1.5;g.fillStyle='#f4f1ea';g.fillRect(x-4,p[1]-5,8,4);g.fillStyle='#2e2b2a';g.fillRect(x-1,p[1]-5,3,2);g.fillRect(x+3,p[1]-6,2,3)}break;
  case'fish':{I.box(-.46,-.46,.46,.46,-7,2,'#9a7448');I.box(-.3,-.3,.08,.04,2,11,'#5d8ea0');I.gable(-.33,-.33,.11,.07,11,6,'#e9e2d2','#5d8ea0');
    g.strokeStyle='#5b4632';g.lineWidth=1;for(let q=0;q<4;q++){const a=I.P(.2+q*.06,.15,2);I.line(a,[a[0],a[1]-10])}
    const p=I.P(.3,.38,0),bob=Math.sin(tm*2)*1.2;poly(g,[p[0]-9,p[1]-1+bob,p[0]+9,p[1]-1+bob,p[0]+6,p[1]+3+bob,p[0]-6,p[1]+3+bob],'#c44f3a');break}
  case'coffee':I.flat(-.47,-.47,.47,.47,0,'#6b5236');for(let a=-.36;a<=.38;a+=.18)for(let b=-.36;b<=.38;b+=.18){const p=I.P(a,b,0);
      g.fillStyle='#2f6b34';g.beginPath();g.arc(p[0],p[1]-5,4.6,0,6.3);g.fill();g.fillStyle='#c0392b';g.fillRect(p[0]+1,p[1]-6,1.8,1.8);g.fillRect(p[0]-2,p[1]-3,1.8,1.8)}break;
  case'cotton':I.flat(-.47,-.47,.47,.47,0,'#8fb862');for(let a=-.38;a<=.4;a+=.13)for(let b=-.38;b<=.4;b+=.19){const p=I.P(a,b,0);
      g.fillStyle='#5f8a42';g.fillRect(p[0]-.6,p[1]-5,1.2,5);g.fillStyle='#fbfaf5';g.beginPath();g.arc(p[0],p[1]-6,2.2,0,6.3);g.fill()}break;
  case'coalmine':case'ironmine':case'goldmine':{const pile={coalmine:'#2f2c2b',ironmine:'#9a4e32',goldmine:'#e2b33c'}[t];
    drawBase(g,'mine',mx,my,i);I.pyr(.12,.24,.44,.46,0,8,pile);if(t==='goldmine'){const p=I.P(.28,.35,9);g.fillStyle='#fff6c8';g.fillRect(p[0]-1,p[1]-1,2,2)}break}
  case'textile':I.box(-.44,-.3,.32,.34,0,17,'#c9b7a8');I.winL(.34,-.44,.32,5,6,7,'#5a4d6a');I.winR(.32,-.3,.34,5,4,7,'#5a4d6a');
    I.gable(-.46,-.32,.34,.36,17,8,'#7a4a6e','#c9b7a8');I.box(.12,-.46,.24,-.34,0,44,'#9a8a7e');I.box(.12,-.46,.24,-.34,36,39,'#b0568f');break;
  case'cannery':I.box(-.44,-.32,.2,.34,0,15,'#dfe3e0');I.winL(.34,-.44,.2,5,4,6,'#486672');I.flat(-.44,-.32,.2,.34,15.2,'#9eb0b4');
    I.box(.24,.0,.44,.2,0,22,'#b8c2c4');I.box(.24,.24,.44,.44,0,22,'#b8c2c4');I.box(.12,-.46,.24,-.34,0,44,'#c44f3a');I.box(.12,-.46,.24,-.34,36,39,'#ece6d6');break;
  case'wind':{const b=I.P(0,0,0),tp=I.P(0,0,40);I.box(-.12,-.12,.12,.12,0,3,'#c8c3b4');g.strokeStyle='#ecebe5';g.lineWidth=3;I.line(b,tp);
    const a0=tm*2.2;g.lineWidth=2.4;g.strokeStyle='#f6f5f0';for(let q=0;q<3;q++){const a=a0+q*2.094;I.line(tp,[tp[0]+Math.cos(a)*17,tp[1]+Math.sin(a)*17])}
    g.fillStyle='#d5d2c8';g.beginPath();g.arc(tp[0],tp[1],2.4,0,6.3);g.fill();break}
  case'store':I.box(-.44,-.36,.4,.3,0,13,'#8c9a94');I.winL(.3,-.44,.4,3,3,9,'#5e6b66');I.gable(-.46,-.38,.42,.32,13,7,'#56625d','#8c9a94');
    I.box(.08,.34,.22,.46,0,6,'#c44f3a');I.box(.26,.34,.42,.46,0,6,'#3f7f9a');I.box(.08,.34,.22,.46,6,12,'#e0a83a');break;
  case'sub':{I.flat(-.34,-.34,.34,.34,.5,'#9aa39c');I.box(-.18,-.18,.14,.14,0,9,'#7d8a8c');g.strokeStyle='#d9a441';g.lineWidth=1.6;
    const a=I.P(-.24,.24,0),tp=I.P(-.24,.24,26);I.line(a,tp);I.line([tp[0]-7,tp[1]+3],[tp[0]+7,tp[1]-3]);I.line([tp[0]-5,tp[1]+8],[tp[0]+5,tp[1]+4]);
    g.strokeStyle='rgba(60,60,60,.7)';g.lineWidth=1;for(const[u,w]of[[-.34,-.34],[.34,-.34],[.34,.34],[-.34,.34]]){const p=I.P(u,w,0);I.line(p,[p[0],p[1]-5])}break}
  case'school':I.box(-.4,-.3,.3,.3,0,15,'#e8d7b8');I.winL(.3,-.4,.3,5,4,6,'#4a6b74');I.winR(.3,-.3,.3,5,3,6,'#4a6b74');I.gable(-.44,-.34,.34,.34,15,8,'#5a7b4a','#e8d7b8');
    {const tp=I.P(.0,.0,31);g.strokeStyle='#2c2c2c';g.lineWidth=1.2;I.line(tp,[tp[0],tp[1]-10]);I.F([[tp[0],tp[1]-10],[tp[0]+8,tp[1]-8],[tp[0],tp[1]-6]],'#6aa8ff')}break;
  case'clinic':I.box(-.36,-.32,.34,.3,0,20,'#f4f4ef');I.winL(.3,-.36,.34,5,4,6,'#5c8aa0');I.winL(.3,-.36,.34,12,4,6,'#5c8aa0');I.flat(-.36,-.32,.34,.3,20.2,'#d9dcd6');
    {const p=I.P(-.01,-.01,21);g.fillStyle='#e04848';g.fillRect(p[0]-2.5,p[1]-8,5,16);g.fillRect(p[0]-8,p[1]-2.5,16,5)}break;
  case'police':I.box(-.34,-.3,.32,.3,0,15,'#cfd8e6');I.winL(.3,-.34,.32,5,3,6,'#35507a');I.flat(-.34,-.3,.32,.3,15.2,'#3d5a8a');
    I.box(-.08,-.08,.08,.08,15,19,'#3d5a8a');{const p=I.P(0,0,21),on=Math.sin(performance.now()/250)>0;g.fillStyle=on?'#ff5b5b':'#5b8bff';g.beginPath();g.arc(p[0],p[1],2.6,0,6.3);g.fill()}break;
  case'barracks':I.flat(-.47,-.47,.47,.47,0,'#b7a77c');I.box(-.42,-.36,.1,.3,0,11,'#7d8a5a');I.winL(.1,-.42,.3,4,4,5,'#3c4630');I.gable(-.44,-.38,.12,.32,11,6,'#4f5a38','#7d8a5a');
    I.box(.18,-.36,.42,-.12,0,8,'#8e9a6a');I.flat(.18,-.36,.42,-.12,8.2,'#5d6844');
    {const b=I.P(.3,.28,0),tp=I.P(.3,.28,30);g.strokeStyle='#3a3a3a';g.lineWidth=1.2;I.line(b,tp);I.F([[tp[0],tp[1]],[tp[0]+10,tp[1]+3],[tp[0],tp[1]+6]],'#c44f3a')}break;
  default:drawBase(g,t,mx,my,i);
  }
}
