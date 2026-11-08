// Загружает симуляцию (ядро + данные + логика) без браузера.
// run(code) выполняет JS внутри симуляции и видит все её имена: S, tick, place и т.д.
import vm from 'node:vm';
import { CORE, DATA, SIM, bundle } from '../build.mjs';

// Помощники для сценариев: дорожная сетка, постройка рядом с ратушей, порт.
const HELPERS = `
    var near=(t,from)=>{for(let d=1;d<40;d++)for(let i=0;i<N*N;i++){const dx=Math.abs(i%N-from%N),dy=Math.abs((i/N|0)-(from/N|0));if(Math.max(dx,dy)!==d)continue;if(nb4(i).some(j=>NET[j])&&canBuild(t,i).ok){place(t,i);return i}}return -1};
    var grid=()=>{const h=S.hall;for(const j of roadPath(h+3,h+3+8*N))place('road',j);for(const j of roadPath(h+3+8*N,h-5+8*N))place('road',j);for(const j of roadPath(h-5+8*N,h-5))place('road',j)};
    var setup=(mi=0,gov='demo',diff='norm')=>{S=newGame(mi);govInit(S,gov,diff);S.money=1e6;S.regions.forEach(g=>g.own=1);computeConn();computeCov()};
    var portUp=()=>{const h=S.hall;let best=-1,bd=1e9;for(let i=0;i<N*N;i++){if(!canBuild('port',i).ok)continue;const d=Math.abs(i%N-h%N)+Math.abs((i/N|0)-(h/N|0));if(d<bd){bd=d;best=i}}
      const land=nb4(best).find(j=>S.type[j]>=SAND&&S.type[j]<MOUNT);for(const j of roadPath(h+1,land))if(!S.road[j]&&!S.bld[j])place('road',j);place('port',best);computeCov();
      if(!PW[best])for(let i=0;i<N*N;i++)if(nb4(i).includes(best)&&canBuild('wind',i).ok){place('wind',i);break}computeCov();return best};
  `;

export function load() {
  const ctx = vm.createContext({ console });
  new vm.Script(bundle([...CORE, ...DATA, ...SIM]) + HELPERS + '\nglobalThis.run=(c)=>eval(c);', { filename: 'sim-bundle.js' }).runInContext(ctx);
  const run = code => ctx.run(code);
  return run;
}
