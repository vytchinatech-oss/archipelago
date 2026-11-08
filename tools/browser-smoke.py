# Браузерный стресс-тест: 3 карты × 4000 случайных действий, все окна и дипломатия.
# Нужны Python, playwright и Chrome/Chromium. Запуск: python3 tools/browser-smoke.py [путь к chrome]
import asyncio,sys,pathlib
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=(sys.argv[1] if len(sys.argv)>1 else None),args=['--no-sandbox'])
        errs=[]
        for mi in range(3):
            pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
            pg.on('pageerror',lambda e: errs.append(str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'net::' not in m.text else None)
            await pg.goto(pathlib.Path(__file__).resolve().parent.parent.joinpath('dist/index.html').as_uri());await pg.wait_for_timeout(300)
            await pg.evaluate(f'()=>{{PICK={mi}}}');await pg.click('#b-start');await pg.wait_for_timeout(200)
            res=await pg.evaluate('''()=>{const out={err:[],overs:0};S.money=1e6;S.pop=400;S.regions.forEach(g=>g.own=1);dirty=true;
              const tools=['road','road','road',...Object.keys(B).filter(k=>k!=='hall'),'bull','bull'];
              let R=7;const rnd=()=>{R=(R*16807)%2147483647;return R/2147483647};
              for(let k=0;k<4000;k++){const i=Math.floor(rnd()*N*N),t=tools[Math.floor(rnd()*tools.length)];
                try{place(t,i);if(rnd()<.05){const a=Math.floor(rnd()*N*N);for(const j of roadPath(i,a))place('road',j)}
                  if(k%40==0){doTick();updateFx(400);dirty=true;LAYER=LAYERS[k/40%LAYERS.length];render(k*16);}
                  if(k%300==0){S=loadStr(saveStr());computeConn();computeCov()}
                  if(k%97==0){info(i);tap(100+rnd()*200,300+rnd()*300)}
                  if(k%211==0){const n=S.nat[k%3];['deal','borrow','lend','aid','emb'].forEach(a=>dip(a,n.id,1000));sheet('world');sheet('econ');if(S.ev)evAnswer(rnd()<.5);const ps=Object.keys(POSTS),p=ps[k%8];if(S.cand[p].length)hire(p,S.cand[p][0].id);if(S.min[p])S.min[p].auto=k%2;if(k%3==0)fire(ps[(k+3)%8]);bribe();S.guard=k%2;reform(['demo','parl','mon'][k%3]);sheet('gov');for(const s of STATS)sheet('stat:'+s[0]);sheet(null);if(S.over){S.over=null;S.unrest=0}}}
                catch(e){out.err.push(t+': '+e.message+' '+e.stack.split('\\n')[1]);if(out.err.length>5)break}}
              sheet(null);out.month=S.month;out.pop=S.pop;out.b=S.bld.filter(Boolean).length;return out}''')
            await pg.wait_for_timeout(4500)
            print(mi,res,'month after',await pg.evaluate('()=>S.month'))
            await pg.close()
        print('page errors:',errs[:8]);sys.exit(1 if errs else 0)
        await b.close()
asyncio.run(main())
