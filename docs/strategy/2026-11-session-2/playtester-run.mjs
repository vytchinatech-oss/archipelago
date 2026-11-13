import { load } from '/tmp/pt-s2/tests/harness.mjs';
const BOT = `const ts=['house','house','farm','shop','wind','house','park','saw','port','house','store','school','coalmine','police','house'];`;
const strat = {
 passive: `if(false){}`,
 reasonable: `if(m%3==0)near(ts[m/3%ts.length],S.hall);`,
 builder: `{const ks=Object.keys(B).filter(k=>k!=='hall');for(let q=0;q<5;q++)near(ks[(m*5+q)%ks.length],S.hall);}`,
};
for (const [name,code] of Object.entries(strat)) for (const mi of [0,1,2]) for (const gov of ['demo','parl','mon']) {
  const t0=Date.now();
  const r = load()(`setup(${mi},'${gov}','norm');S.money=20000;grid();${BOT};let goalM=[],idle=0,lastG=0;
   for(let m=0;m<360&&!S.over;m++){const g0=S.goal,b0=Object.keys(S.bld||{}).length;${code}const r=tick();computeCov();checkGoals(r.cen,r);if(S.goal>g0)goalM.push(m);}
   ({over:S.over&&S.over.reason,yrs:(S.month/12).toFixed(1),goals:S.goal+'/'+GOALS.length,goalM:goalM.join(','),pop:S.pop,money:Math.round(S.money),appr:Math.round(S.appr||0),happy:Math.round(S.happy||0)})`);
  console.log(name,mi,gov,JSON.stringify(r),(Date.now()-t0)+'ms');
}
