/* Случайные числа, шум для рельефа, форматирование чисел и склонения. */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function h2(x,y,s){let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,982451653))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296}
function vnoise(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=h2(ix,iy,s),b=h2(ix+1,iy,s),c=h2(ix,iy+1,s),d=h2(ix+1,iy+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,s,o){let t=0,amp=.5,f=1,n=0;for(let k=0;k<o;k++){t+=vnoise(x*f,y*f,s+k*17)*amp;n+=amp;amp*=.5;f*=2}return t/n}
function shuffle(a,R){for(let k=a.length-1;k>0;k--){const j=Math.floor(R()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a}
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
function plural(n,a,b,c){n=Math.abs(n)%100;const m=n%10;if(n>10&&n<20)return c;if(m>1&&m<5)return b;if(m===1)return a;return c}
