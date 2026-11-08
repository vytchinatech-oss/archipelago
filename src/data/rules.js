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
/* Старт новой игры и области. */
const START={money:4000,pop:18,happy:62,tax:{inc:.10,biz:.12,imp:.10,exp:.05},stock:{food:80,wood:30,coal:20,goods:20}};
const REGK={base:200,perTile:12,round:50,goldMul:1.3,fertMin:.75,fertRand:.45,tileMin:.85,tileRand:.3};
/* Дороги и снос. */
const ROADK={deep:120,shal:40,forest:15,land:5,forestClear:15,demolish:5,upRoad:.25,upBridge:1};
/* Выработка. nearR: сколько клеток считается «рядом» для леса и воды. smallCity: сколько предприятий работает без склада. */
const PROD={nearR:2,forestFull:7,commuteMin:.3,commuteFree:6,commuteStep:.025,smallCity:4,noStore:.75,noPower:.35,forestBase:.35,forestAdd:.65,mount:1.3,warm:1.3,limRun:.99,shortRun:.95,storeStaff:.5};
const HOME={noPower:.5,noShop:.6};
/* Потребление на жителя в месяц. canReserve: сколько месяцев еды консервный завод не трогает. */
const NEED={food:.12,canReserve:1.5,goods:.05,cloth:.03,coffee:.004,coffeeRich:.06};
const TAXK={bizFree:.15,bizPen:1.6,incFree:.1,expCut:1.6};
const TRADEK={reserveMonths:2,relPerUnit:.005,debtFloor:20000};
const PRICEK={stockShare:.2,noDemand:.5,noDemandPrice:.7,min:.5,max:2,pad:2,pow:.6,speed:RATE.fast};
const ECO={wage:15,schoolWage:.3,richIncome:60,interest:.02,storeBase:300,portPerStore:25,lateChance:.5,loanDust:.5};
const MOODK={base:50,goods:10,cloth:6,coffee:4,park:12,school:7,clinic:8,crime:10,unemp:45,incTax:150,hunger:40,foodShort:.05,foodPrice:10,importMax:15,importK:40,importMinWage:50,blackout:25,huts:12,speed:RATE.normal};
const POPK={workShare:.62,growFrom:SCALE.bad,growBase:3,growJobs:.6,growPop:.05,growMin:.3,growRange:.6,growSpan:100-SCALE.bad,leaveBelow:SCALE.bad,leaveShare:.05,famine:.25,famineShare:.06,overcrowd:.4};
const MIGK={inRate:.0012,inDiff:5,per:10,crisisMul:3,outDiff:10,outMinPop:30,outRate:.004};
/* Навык министра: прибавка за один уровень. */
const MINK={fin:.02,trdPrice:.015,trdPort:.05,enPow:.04,enCoal:.05,ind:.03,agr:.03,soc:1.2,mvdCrime:.15,mvdUnrest:.1,dipRel:.15,dipRate:.005};
/* Министры: кандидаты, кражи, интриги. */
const CAND={skill:5,hon:.72,loy:.65,risk:.5,salBase:5,salK:2,salRand:4};
const CABK={firedUnrest:8,firedPeo:4,theftFin:.04,theftBase:4,theftSkill:2,caught:.025,caughtAppr:6,plot:.04,plotAppr:SCALE.bad,plotUnrest:15,plotArmy:8};
/* Автопилот: когда министр действует. */
const AUTO={importOf:{agr:['food'],en:['coal'],ind:['wood','iron','coal','cotton']},resRisk:800,resSafe:3000,step:.01,eps:.005,
  finMood:[SCALE.bad,SCALE.good],finInc:[.16,.13],finCalm:SCALE.bad,finCalmInc:.08,finRich:15000,finRichMood:SCALE.good,finRichInc:.06,
  tradeImp:[.04,.12],tradeExp:[.03,.06],
  dipNear:15,dipAidCash:3000,dipBroke:-1500,dipDebtMax:8000,dipLoanGap:12,dipLoan:3000,
  fuelLow:.9,coalOk:4,logLow:.95,inputsLow:.2,foodShort:.05,foodStock:.2,park:.6,school:.5,clinic:.5,police:.7,unrest:40};
/* Подсказки советника: при каких цифрах что говорить. */
const ADV={fuel:.9,food:.1,foodLog:.15,jobsOver:1.25,jobsGap:15,unemp:.15,jobsFree:8,roomLow:4,serve:.7,servePop:40,poor:2,police:.6,log:.95,inputs:.2,goods:.7,cabinet:.35};
/* Власть. */
const GOVK={term:120,appr0:55,army0:60,sat0:{agr:55,ind:55,trd:55,peo:60,mil:50,int:50},seats0:{agr:22,ind:18,trd:14,peo:42,mil:0,int:4},richJobs:2,parlLo:SCALE.crisis,parlSpan:SCALE.top-SCALE.crisis,satSpeed:RATE.normal,pollNoise:6,inflW:{food:.5,goods:.25,cloth:.15,coffee:.1}};
/* Цели довольства фракций. */
const FACT={agr:{base:58,food:25,bizFree:.12,biz:120,imp:30,min:3},ind:{base:55,run:.8,runK:40,pow:40,bizFree:.12,biz:150,log:40,min:3},
  trd:{base:50,expMax:20,expDiv:40,impFree:.1,imp:100,expFree:.05,exp:150,deal:5,min:3},peo:{mood:.9,job:10},
  mil:{base:42,soldMax:25,sold:20,broke:-10,ok:5,guard:8},int:{base:40,school:15,clinic:12,gov:{demo:8,parl:5,mon:-10},min:2}};
/* Отношение фракций к соседям. */
const FATT={ownFrom:.5,pad:60,sphere:2,trdBase:.2,peo:1.5,milAggr:-.8,milTense:-.4,milAlly:.3,intReg:{rep:.6,mon:0,auth:-.6},relMax:1.2,relDeal:.4,relEmb:.8};
const APPR={mood:.55,job:15,growthMax:10,growth:50,inflFree:.08,inflMax:15,infl:100,broke:10,debtRatio:.6,debt:10,base:10,soc:.5,speed:RATE.normal};
const UNR={below:SCALE.crisis,rise:.6,calm:3,broke:-2000,brokeAdd:3,hunger:.3,hungerAdd:5,apprBelow:SCALE.crisis,apprAdd:2,warn:[50,80],warnReset:40};
const ARMY={base:30,mil:.4,guard:12,rich:5,broke:-15,mood:.3,appr:.2,speed:RATE.normal,guardCost:80,coupBelow:SCALE.bad,coupArmy:.12,coupUnrest:.04,coupPlot:.01,coupPlotAppr:SCALE.bad,coupWarn:.02};
const REFORM={cost:3000,gap:60,army:60,appr:50,parl:60,toMon:-10,fromMon:5,monAva:10,monSol:-10,repSol:10,repAva:-5};
const BRIBE={cost:2000,sat:12,army:3,decay:.85};
/* Соседи: цены и внутренняя жизнь. */
const NATK={buyNeed:1.3,buyOther:.9,buyCrisis:1.25,sellHave:.85,sellNone:1.3,sellCrisis:1.5,sellDeal:.92,demOther:8,
  balHappy:42,balDiv:60,balCrisis:.05,crisis:.03,crisisMin:4,crisisRand:5,brokeHappy:-8,happySpeed:RATE.normal,happyNoise:2,popMin:500,popMid:50,popDiv:2500,
  pvMin:.8,pvMax:1.25,pvSpeed:RATE.fast,pvNoise:.08,relSpeed:RATE.vslow,dealRel:.4,embRel:1.5};
/* Обращения к соседям. Эффект договора и займа один при любом способе (кнопка, событие, министр). */
const DIPA={dealRel:5,dealCancel:-8,embargo:-25,aidCost:1000,aidMax:10,aidStep:2,aidMin:2,borrowFrom:RELK.tense,borrowCash:3,borrowYears:2,borrowMonths:24,borrowBtn:3000,lendRel:6,lendRate:.08,lendMonths:12,lendBtn:2000,rateMin:.02,rateRel:400,rateDebt:60000};
/* Четыре сообщения с особыми правилами (остальные — EVN в nations.js) и общие числа сообщений. */
const EVX={loan:{from:RELK.tense,months:4,round:500,min:1500,max:5000,no:-5},deal:{from:RELK.friend},tariff:{imp:.05,to:.05,hike:.35,term:12,yes:6,no:-10},ref:{min:20,rand:40,yes:6,no:-4,riskRoom:.3}};
const EVG={firstMonth:3,answerMonths:6,wiseRisk:1.5,wiseSafe:3};
/* Цели игры. */
const GOALS=[
  {t:'Поселите 60 жителей',ok:()=>S.pop>=60,rw:300},
  {t:'Дайте работу 40 жителям',ok:c=>c.emp>=40,rw:400},
  {t:'Постройте порт и продайте груз за границу',ok:(c,r)=>r&&r.expV>0,rw:600},
  {t:'Выпустите товары, ткани или консервы',ok:(c,r)=>r&&(r.prod.goods+r.prod.cloth+r.prod.cans)>0,rw:600},
  {t:'Купите вторую область',ok:()=>S.regions.filter(g=>g.own).length>=2,rw:500},
  {t:'Подпишите торговый договор',ok:()=>S.nat.some(n=>n.deal),rw:800},
  {t:'Население 300',ok:()=>S.pop>=300,rw:1000},
  {t:'Профицит бюджета 400 кр за месяц',ok:(c,r)=>r&&r.net>=400,rw:1000},
  {t:'Население 1000',ok:()=>S.pop>=1000,rw:3000},
];
