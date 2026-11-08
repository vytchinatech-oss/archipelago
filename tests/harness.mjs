// Загружает симуляцию (ядро + данные + логика) без браузера.
// run(code) выполняет JS внутри симуляции и видит все её имена: S, tick, place и т.д.
import vm from 'node:vm';
import { CORE, DATA, SIM, bundle } from '../build.mjs';

// Помощники для сценариев: дорожная сетка, постройка рядом с ратушей, порт с дорогой к сети и светом.
const HELPERS = `
    var near=(t,from)=>{for(let d=1;d<40;d++)for(let i=0;i<N*N;i++){const dx=Math.abs(i%N-from%N),dy=Math.abs((i/N|0)-(from/N|0));if(Math.max(dx,dy)!==d)continue;if(nb4(i).some(j=>NET[j])&&canBuild(t,i).ok){place(t,i);return i}}return -1};
    var grid=()=>{const h=S.hall;for(const j of roadPath(h+3,h+3+8*N))place('road',j);for(const j of roadPath(h+3+8*N,h-5+8*N))place('road',j);for(const j of roadPath(h-5+8*N,h-5))place('road',j)};
    var setup=(mi=0,gov='demo',diff='norm')=>{S=newGame(mi);govInit(S,gov,diff);S.money=1e6;S.regions.forEach(g=>g.own=1);computeConn();computeCov()};
    var linkRoad=from=>{if(NET[from])return true;const prev=new Int32Array(N*N).fill(-2);prev[from]=-1;const q=[from];
      for(let h=0;h<q.length;h++){const i=q[h];for(const j of nb4(i)){if(prev[j]!==-2)continue;if(NET[j]){let k=i;while(k>=0){if(!S.road[k])place('road',k);k=prev[k]}return true}
        if(S.bld[j]||S.type[j]===MOUNT)continue;prev[j]=i;q.push(j)}}return false};
    var portUp=()=>{const h=S.hall;let best=-1,bd=1e9;for(let i=0;i<N*N;i++){if(!canBuild('port',i).ok)continue;if(!nb4(i).some(j=>S.type[j]>=SAND&&S.type[j]<MOUNT&&!S.bld[j]))continue;const d=Math.abs(i%N-h%N)+Math.abs((i/N|0)-(h/N|0));if(d<bd){bd=d;best=i}}
      if(best<0)return -1;const land=nb4(best).find(j=>S.type[j]>=SAND&&S.type[j]<MOUNT&&!S.bld[j]);place('port',best);linkRoad(land);computeConn();computeCov();
      if(!PW[best])for(let i=0;i<N*N&&!PW[best];i++){const d=Math.abs(i%N-best%N)+Math.abs((i/N|0)-(best/N|0));if(d<=RAD.wind&&nb4(i).some(j=>NET[j])&&canBuild('wind',i).ok){place('wind',i);computeCov()}}
      return best};
  `;

export function load() {
  const ctx = vm.createContext({ console });
  new vm.Script(bundle([...CORE, ...DATA, ...SIM]) + HELPERS + '\nglobalThis.run=(c)=>eval(c);', { filename: 'sim-bundle.js' }).runInContext(ctx);
  const run = code => ctx.run(code);
  return run;
}
