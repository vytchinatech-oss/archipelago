/* Все здания: стоимость, содержание, рабочие места, энергия, выработка, ореолы. Баланс меняется здесь. */
const CATS=[['base','Дороги'],['home','Жильё'],['farm','Поля и еда'],['mine','Добыча'],['ind','Заводы'],['pow','Энергия'],['svc','Услуги'],['com','Логистика']];
const B={
  hall:{n:'Ратуша',cat:'',cost:0,up:0,jobs:10,pow:12,d:'Сердце города. Каждое здание должно быть связано с ней дорогой.'},
  hut:{n:'Барак',cat:'home',cost:40,up:1,home:14,pow:-.5,on:LANDB,d:'Дёшево и тесно: 14 жителей. Если бараков много, настроение падает.'},
  house:{n:'Дом',cat:'home',cost:60,up:1,home:10,pow:-.5,on:LANDB,d:'Жильё для 10 рабочих.'},
  villa:{n:'Особняк',cat:'home',cost:240,up:2,home:5,rich:1,pow:-1,on:LANDB,need:80,d:'5 состоятельных жителей платят налог как 20 рабочих. Пьют много кофе. С населения 80.'},
  tower:{n:'Многоэтажка',cat:'home',cost:380,up:5,home:48,pow:-3,on:LANDB,need:200,d:'Жильё на 48 человек. С населения 200.'},
  farm:{n:'Пшеничное поле',cat:'farm',cost:110,up:3,jobs:8,pow:-.5,on:[GRASS],out:{food:16},fert:1,d:'16 еды в месяц. Урожай зависит от плодородия.'},
  veg:{n:'Овощная ферма',cat:'farm',cost:150,up:4,jobs:10,pow:-1,on:[GRASS,SAND],out:{food:24},fert:1,water:1,d:'24 еды, но нужна вода в 2 клетках для полива.'},
  ranch:{n:'Ранчо',cat:'farm',cost:130,up:3,jobs:5,pow:-.5,on:[GRASS,HILL],out:{food:11},d:'11 еды при всего 5 рабочих. Годится для холмов.'},
  fish:{n:'Рыбацкий причал',cat:'farm',cost:150,up:3,jobs:6,pow:0,on:[SAND,GRASS,FOREST],coast:1,out:{food:15},d:'15 еды из моря. Ставится у воды.'},
  coffee:{n:'Кофейная плантация',cat:'farm',cost:220,up:4,jobs:12,pow:0,on:[GRASS,HILL],warm:1,out:{coffee:8},fert:1,d:'8 кофе. Дорогой экспорт, любимый напиток богачей. Только в тёплых областях.'},
  cotton:{n:'Хлопковое поле',cat:'farm',cost:120,up:3,jobs:9,pow:0,on:[GRASS,SAND],out:{cotton:12},fert:1,d:'12 хлопка для ткацкой фабрики. В тёплых областях +30%.'},
  saw:{n:'Лесопилка',cat:'mine',cost:160,up:4,jobs:10,pow:-2,on:LANDB,out:{wood:12},d:'До 12 древесины. Чем больше леса вокруг, тем выше выработка.'},
  coalmine:{n:'Угольная шахта',cat:'mine',cost:220,up:5,jobs:12,pow:-2,on:[HILL,MOUNT],dep:'coal',out:{coal:12},d:'12 угля. Уголь топит ТЭС и нужен заводу. Только на угольных залежах.'},
  ironmine:{n:'Железный рудник',cat:'mine',cost:260,up:6,jobs:12,pow:-3,on:[HILL,MOUNT],dep:'iron',out:{iron:10},d:'10 железа для завода. Только на железных залежах.'},
  goldmine:{n:'Золотой прииск',cat:'mine',cost:420,up:8,jobs:14,pow:-2,on:[HILL,MOUNT],dep:'gold',out:{gold:3},d:'3 золота. Внутри не нужно, но за границей стоит дороже всего.'},
  factory:{n:'Механический завод',cat:'ind',cost:480,up:10,jobs:20,pow:-6,on:LANDB,in:{wood:4,iron:4,coal:2},out:{goods:10},d:'4 древесины + 4 железа + 2 угля → 10 товаров.'},
  textile:{n:'Ткацкая фабрика',cat:'ind',cost:380,up:8,jobs:14,pow:-4,on:LANDB,in:{cotton:8},out:{cloth:8},d:'8 хлопка → 8 тканей. Жители покупают одежду на рынках.'},
  cannery:{n:'Консервный завод',cat:'ind',cost:420,up:8,jobs:12,pow:-3,on:LANDB,in:{food:12},out:{cans:8},d:'12 еды → 8 консервов на экспорт. Берёт только излишки еды.'},
  power:{n:'Угольная ТЭС',cat:'pow',cost:500,up:12,jobs:8,pow:60,fuel:{coal:4},on:LANDB,d:'60 энергии, сжигает 4 угля в месяц. Без угля мощность падает.'},
  wind:{n:'Ветряк',cat:'pow',cost:140,up:2,jobs:1,pow:10,on:[SAND,GRASS,HILL],d:'10 энергии без топлива.'},
  sub:{n:'Подстанция',cat:'pow',cost:90,up:1,on:LANDB,d:'Передаёт энергию дальше: работает, если сама стоит в зоне электричества.'},
  shop:{n:'Рынок',cat:'svc',cost:150,up:3,jobs:6,pow:-1,serve:120,on:LANDB,d:'Продаёт товары, ткани и кофе до 120 жителям в своём ореоле. Дом без рынка заселён на 60%.'},
  school:{n:'Школа',cat:'svc',cost:300,up:6,jobs:8,pow:-1,on:LANDB,need:60,d:'Образованные жители зарабатывают больше: подоходный налог до +30% и настроение.'},
  clinic:{n:'Больница',cat:'svc',cost:400,up:8,jobs:10,pow:-2,on:LANDB,need:80,d:'Здоровье жителей в ореоле: заметно поднимает настроение.'},
  police:{n:'Полиция',cat:'svc',cost:300,up:6,jobs:8,pow:-1,on:LANDB,need:120,d:'Без полиции в городе от 120 жителей растёт преступность.'},
  store:{n:'Склад',cat:'com',cost:260,up:4,jobs:6,pow:-1,stor:300,on:LANDB,d:'+300 места под каждый ресурс, +25 к пропускной способности порта. Предприятия в ореоле склада работают быстрее.'},
  port:{n:'Порт',cat:'com',cost:600,up:12,jobs:10,pow:-2,cap:60,on:[SAND,GRASS,FOREST],coast:1,d:'Торговля с другими странами, до 60 ед. в месяц. Ставится у воды.'},
  park:{n:'Парк',cat:'svc',cost:80,up:1,park:1,on:LANDB,d:'Поднимает настроение домов в пешей доступности.'},
};
const RAD={hall:5,power:10,wind:5,sub:7,shop:6,park:4,school:6,clinic:7,police:7,store:8};
const RADN={power:'энергия',shop:'рынок',park:'парк',school:'школа',clinic:'больница',police:'полиция',store:'склад'};
