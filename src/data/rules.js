/* Числа правил: коэффициенты экономики, настроения, власти и дипломатии. Логика в src/sim/ берёт их только отсюда. */
/* Единые шкалы (DESIGN.md, «Стандарты правил»). 0–100: ниже crisis — кризис, ниже bad — плохо, до good — норма, до top — хорошо, выше — отлично. */
const SCALE={crisis:25,bad:40,good:60,top:75};
/* Какая доля разрыва с целью закрывается за месяц. */
const RATE={fast:.4,normal:.3,slow:.15,vslow:.02};
/* Отношения со странами: союзник от ally, дружба от friend, нейтралитет от neutral, напряжённость от tense, ниже — вражда. */
const RELK={ally:50,friend:25,neutral:-15,tense:-50,dealBreak:0,max:100};
/* Проценты и дроби для текстов: 0,015 → «1,5». */
const PCT=v=>String(+(v*100).toFixed(1)).replace('.',',');
const COMMA=v=>String(v).replace('.',',');
/* Масштаб денег (DESIGN.md, «Собственность, кошельки и зоны»). Цены товаров выросли в 2,2 раза, разовые суммы — стройка, земля, награды,
   займы, подарки, казны соседей — в CAP раз: так поле окупается за 5–6 лет, а не за пару месяцев. */
const CAP=10;
/* Масштаб потоков: цены товаров и всё, что платится каждый месяц и считается от них (содержание, отступные, пороги торговли), × PRICEX. */
const PRICEX=2.2;
/* Старт новой игры и области. hh — сбережения жителей. */
const START={money:4000*CAP,hh:1000,pop:18,happy:62,tax:{inc:.15,biz:.20,imp:.10,exp:.05},stock:{food:80,wood:30,coal:20,goods:20}};
const REGK={base:200*CAP,perTile:12*CAP,round:500,goldMul:1.3,fertMin:.75,fertRand:.45,tileMin:.85,tileRand:.3};
/* Дороги и снос. */
const ROADK={deep:120*CAP,shal:40*CAP,forest:15*CAP,land:5*CAP,forestClear:15*CAP,demolish:5*CAP,upRoad:.25*PRICEX,upBridge:1*PRICEX};
/* Зарплата: одна ставка на страну. Цель — доля share от стоимости, которую рабочий предприятия создаёт за месяц (выручка минус сырьё).
   При нехватке рабочих цель выше, при безработице ниже: множитель 1 + tight × (мест/рабочих − 1) в пределах tightMin…tightMax.
   Ставка идёт к цели со скоростью speed. Жители особняков — управляющие, получают ставку × richMul из счёта предприятий,
   поэтому в расчёте ставки каждый управляющий считается за richMul рабочих: доля share — на всех, кого кормит предприятие.
   Школы поднимают зарплату сверх ставки (ECO.schoolWage). */
const WAGE={start:12,share:.55,tight:.5,tightMin:.75,tightMax:1.25,min:4,max:80,speed:RATE.slow,richMul:4};
/* Рынок берёт наценку сверху на товары, ткани и кофе, свои и привозные. Еду жители покупают без наценки. */
const SHOPK={margin:.2,goods:['goods','cloth','coffee']};
/* Выработка. nearR: сколько клеток считается «рядом» для леса и воды. smallCity: сколько предприятий работает без склада. */
const PROD={nearR:2,forestFull:7,commuteMin:.3,commuteFree:6,commuteStep:.025,smallCity:4,noStore:.75,noPower:.35,forestBase:.35,forestAdd:.65,mount:1.3,warm:1.3,limRun:.99,shortRun:.95,storeStaff:.5};
const HOME={noPower:.5,noShop:.6};
/* Потребление на жителя в месяц. canReserve: сколько месяцев еды консервный завод не трогает. */
const NEED={food:.12,canReserve:1.5,goods:.05,cloth:.03,coffee:.004,coffeeRich:.06};
/* incFree: подоходный налог до этой ставки не портит настроение. */
const TAXK={incFree:.15,incFreeOld:.1,incMax:.3,expCut:1.6};
const TRADEK={reserveMonths:2,relPerUnit:.005,debtFloor:20000*CAP};
const PRICEK={stockShare:.2,noDemand:.5,noDemandPrice:.7,min:.5,max:2,pad:2,pow:.6,speed:RATE.fast};
/* schoolWage: школы поднимают зарплату до +30%. */
const ECO={schoolWage:.3,interest:.02,storeBase:300,portPerStore:25,lateChance:.5,loanDust:.5};
/* Траты на импорт: штраф importK × доля привозного в покупках жителей (до 1). */
const MOODK={base:50,goods:10,cloth:6,coffee:4,park:12,school:7,clinic:8,crime:10,unemp:45,incTax:150,hunger:40,foodShort:.05,foodPrice:10,importK:10,importMinBuy:50,blackout:25,huts:12,speed:RATE.normal};
const POPK={workShare:.62,growFrom:SCALE.bad,growBase:3,growJobs:.6,growPop:.05,growMin:.3,growRange:.6,growSpan:100-SCALE.bad,leaveBelow:SCALE.bad,leaveShare:.05,famine:.25,famineShare:.06,overcrowd:.4};
const MIGK={inRate:.0012,inDiff:5,per:10,crisisMul:3,outDiff:10,outMinPop:30,outRate:.004};
/* Навык министра: прибавка за один уровень. */
const MINK={fin:.02,trdPrice:.015,trdPort:.05,enPow:.04,enCoal:.05,ind:.03,agr:.03,soc:1.2,mvdCrime:.15,mvdUnrest:.1,dipRel:.15,dipRate:.005};
/* Министры: кандидаты, кражи, интриги. */
const CAND={skill:5,hon:.72,loy:.65,risk:.5,salBase:5,salK:2,salRand:4};
const CABK={firedUnrest:8,firedPeo:4,theftFin:.04,theftBase:4,theftSkill:2,caught:.025,caughtAppr:6,plot:.04,plotAppr:SCALE.bad,plotUnrest:15,plotArmy:8};
/* Автопилот: когда министр действует. */
const AUTO={importOf:{agr:['food'],en:['coal'],ind:['wood','iron','coal','cotton']},resRisk:800*CAP,resSafe:3000*CAP,step:.01,eps:.005,
  finMood:[SCALE.bad,SCALE.good],finInc:[.21,.18],finCalm:SCALE.bad,finCalmInc:.13,finRich:15000*CAP,finRichMood:SCALE.good,finRichInc:.11,
  tradeImp:[.04,.12],tradeExp:[.03,.06],
  dipNear:15,dipAidCash:3000*CAP,dipBroke:-1500*CAP,dipDebtMax:8000*CAP,dipLoanGap:12,dipLoan:3000*CAP,
  fuelLow:.9,coalOk:4,logLow:.95,inputsLow:.2,foodShort:.05,foodStock:.2,park:.6,school:.5,clinic:.5,police:.7,unrest:40};
/* Подсказки советника: при каких цифрах что говорить. surplus/cheap: ресурс в избытке, если цена внутри ниже cheap от базы.
   PROC: какой завод перерабатывает излишек сырья. */
const PROC={food:'cannery',cotton:'textile',wood:'factory',iron:'factory',coal:'factory'};
const ADV={fuel:.9,food:.1,foodLog:.15,jobsOver:1.25,jobsGap:15,unemp:.15,jobsFree:8,roomLow:4,serve:.7,servePop:40,poor:2,police:.6,log:.95,inputs:.2,goods:.7,cabinet:.35,firmLoss:30,cheap:.8,staff:.5,portFull:.95};
/* Власть. */
const GOVK={term:120,appr0:55,army0:60,sat0:{agr:55,ind:55,trd:55,peo:60,mil:50,int:50},seats0:{agr:22,ind:18,trd:14,peo:42,mil:0,int:4},richJobs:2,parlLo:SCALE.crisis,parlSpan:SCALE.top-SCALE.crisis,satSpeed:RATE.normal,pollNoise:6,inflW:{food:.5,goods:.25,cloth:.15,coffee:.1}};
/* Цели довольства фракций. */
const FACT={agr:{base:58,food:25,imp:30,min:3},ind:{base:55,run:.8,runK:40,pow:40,log:40,min:3},
  trd:{base:50,expMax:20,expDiv:40*PRICEX,impFree:.1,imp:100,expFree:.05,exp:150,deal:5,min:3},peo:{mood:.9,job:10},
  mil:{base:42,soldMax:25,sold:20,broke:-10,ok:5,guard:8},int:{base:40,school:15,clinic:12,gov:{demo:8,parl:5,mon:-10},min:2}};
/* Отношение фракций к соседям. */
const FATT={ownFrom:.5,pad:60,sphere:2,trdBase:.2,peo:1.5,milAggr:-.8,milTense:-.4,milAlly:.3,intReg:{rep:.6,mon:0,auth:-.6},relMax:1.2,relDeal:.4,relEmb:.8};
/* debtRatio: долг к годовому ВВП, после которого падает рейтинг. Было 0,6 при старом масштабе; займы выросли в CAP раз, ВВП — в PRICEX, отсюда 0,6 × CAP / PRICEX ≈ 2,7. */
const APPR={mood:.55,job:15,growthMax:10,growth:50,inflFree:.08,inflMax:15,infl:100,broke:10,debtRatio:2.7,debt:10,base:10,soc:.5,speed:RATE.normal};
const UNR={below:SCALE.crisis,rise:.6,calm:3,broke:-2000*CAP,brokeAdd:3,hunger:.3,hungerAdd:5,apprBelow:SCALE.crisis,apprAdd:2,warn:[50,80],warnReset:40};
const ARMY={base:30,mil:.4,guard:12,rich:5,broke:-15,mood:.3,appr:.2,speed:RATE.normal,guardCost:80,coupBelow:SCALE.bad,coupArmy:.12,coupUnrest:.04,coupPlot:.01,coupPlotAppr:SCALE.bad,coupWarn:.02};
const REFORM={cost:3000*CAP,gap:60,army:60,appr:50,parl:60,toMon:-10,fromMon:5,monAva:10,monSol:-10,repSol:10,repAva:-5};
const BRIBE={cost:2000*CAP,sat:12,army:3,decay:.85};
/* Соседи: цены и внутренняя жизнь. */
const NATK={buyNeed:1.3,buyOther:1.15,buyCrisis:1.25,sellHave:.85,sellNone:1.3,sellCrisis:1.5,sellDeal:.92,demOther:8,
  balHappy:42,balDiv:60,balCrisis:.05,crisis:.03,crisisMin:4,crisisRand:5,brokeHappy:-8,happySpeed:RATE.normal,happyNoise:2,popMin:500,popMid:50,popDiv:2500,
  pvMin:.8,pvMax:1.25,pvSpeed:RATE.fast,pvNoise:.08,relSpeed:RATE.vslow,dealRel:.4,embRel:1.5,money:CAP};
/* Обращения к соседям. Эффект договора и займа один при любом способе (кнопка, событие, министр). */
const DIPA={dealRel:5,dealCancel:-8,embargo:-25,aidCost:1000*CAP,aidMax:10,aidStep:2,aidMin:2,borrowFrom:RELK.tense,borrowCash:3,borrowYears:2,borrowMonths:24,borrowBtn:3000*CAP,lendRel:6,lendRate:.08,lendMonths:12,lendBtn:2000*CAP,rateMin:.02,rateRel:400,rateDebt:60000*CAP};
/* Четыре сообщения с особыми правилами (остальные — EVN в nations.js) и общие числа сообщений. */
const EVX={loan:{from:RELK.tense,months:4,round:500*CAP,min:1500*CAP,max:5000*CAP,no:-5},deal:{from:RELK.friend},tariff:{imp:.05,to:.05,hike:.35,term:12,yes:6,no:-10},ref:{min:20,rand:40,yes:6,no:-4,riskRoom:.3}};
const EVG={firstMonth:3,answerMonths:6,wiseRisk:1.5,wiseSafe:3};
/* Цели игры. Награда — новые деньги в казне: одно из двух исключений стандарта СТ1 (второе — займы извне). */
const GOALK={net:900};
const GOALS=[
  {t:'Поселите 60 жителей',ok:()=>S.pop>=60,rw:300*CAP},
  {t:'Дайте работу 40 жителям',ok:c=>c.emp>=40,rw:400*CAP},
  {t:'Постройте порт и продайте груз за границу',ok:(c,r)=>r&&r.expV>0,rw:600*CAP},
  {t:'Выпустите товары, ткани или консервы',ok:(c,r)=>r&&(r.prod.goods+r.prod.cloth+r.prod.cans)>0,rw:600*CAP},
  {t:'Купите вторую область',ok:()=>S.regions.filter(g=>g.own).length>=2,rw:500*CAP},
  {t:'Подпишите торговый договор',ok:()=>S.nat.some(n=>n.deal),rw:800*CAP},
  {t:'Население 300',ok:()=>S.pop>=300,rw:1000*CAP},
  {t:'Профицит бюджета '+GOALK.net+' кр за месяц',ok:(c,r)=>r&&r.net>=GOALK.net,rw:1000*CAP},
  {t:'Население 1000',ok:()=>S.pop>=1000,rw:3000*CAP},
];
