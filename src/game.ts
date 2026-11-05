export type Suit='H'|'D'|'C'|'S';export type TT='rule'|'quiz'|'category'|'challenge';
export interface Card{id:string;suit:Suit;rank:string}
export interface Task{id:string;type:TT;title:string;body:string;ok:string;fail:string;rounds?:number}
export interface Player{id:string;name:string;avatar:string;ready:boolean;draws:number;penalties:number;hand:Card[]}
export interface Settings{maxRounds:number;enabled:Record<TT,boolean>;allowSkip:boolean;allowReroll:boolean;suitMap:Record<Suit,TT>}
export interface Cur{card:Card;pid:string;kind:'task'|'ace'|'special';task?:Task;empty?:boolean;res?:string}
export interface GS{phase:'lobby'|'draw'|'task'|'ended';hostId:string;players:Player[];settings:Settings;tasks:Task[];deck:Card[];used:string[];idx:number;prev:string|null;round:number;drawn:number;cur?:Cur;rules:{task:Task;until?:number}[];glass:number;log:string[]}
export type Action={t:'join'|'profile';name:string;avatar:string}|{t:'ready'|'start'|'draw'|'reroll'|'leave'|'end'|'again'|'skipPlayer'}|{t:'resolve';r:'ok'|'fail'|'skip'}|{t:'settings';s:Settings}|{t:'special';cardId:string;endTurn?:boolean}|{t:'removeRule';i:number}
export const GLASS_MAX=5, GLASS_ML=250;
export const SUITS:Suit[]=['S','H','D','C'];export const SYM:Record<Suit,string>={S:'♠',H:'♥',D:'♦',C:'♣'};
export const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const TYPE_META:Record<TT,{name:string;color:string}>={rule:{name:'REGUŁA',color:'#facc15'},quiz:{name:'QUIZ',color:'#ef4444'},category:{name:'KATEGORIE',color:'#5b7cfa'},challenge:{name:'WYZWANIE',color:'#6bd36b'}};
export const SPECIAL:Record<string,string>={J:'WALET – WYBÓR: wybiera dowolną osobę, która musi wykonać wskazane przez niego zadanie.',Q:'DAMA – KRÓL: wyznacza osobę, która dobiera kartę z wybranej przez niego kategorii.',K:'KRÓL – DECYZJA: podejmuje decyzję, kto z graczy ma wziąć łyk swojego napoju (lub punkt pecha).'};
export const makeDeck=():Card[]=>SUITS.flatMap(s=>RANKS.map(r=>({id:r+s,suit:s,rank:r})));
export const shuffle=<T,>(a:T[]):T[]=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
export const defaultSettings:Settings={maxRounds:5,enabled:{rule:true,quiz:true,category:true,challenge:true},allowSkip:true,allowReroll:true,suitMap:{H:'quiz',D:'category',C:'challenge',S:'rule'}};
const POUR='Nie zrobisz → dolewasz do Szklanki Losu.';
const T=(type:TT,title:string,body:string,ok:string,fail:string,rounds?:number):Task=>({id:type+Math.abs(hash(title+body)),type,title,body,ok,fail,rounds});
function hash(s:string){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return h}
const C=(b:string)=>T('category','KATEGORIE',b,'Zrobisz → wybierz osobę, która dolewa do Szklanki Losu.',POUR);
const Q=(b:string)=>T('quiz','QUIZ',b,'Powiesz/wskażesz → wybrana osoba dolewa do Szklanki Losu.',POUR);
const W=(b:string)=>T('challenge','WYZWANIE',b,'Zrobisz → wybierz osobę, która dolewa do Szklanki Losu.',POUR);
const R=(title:string,body:string,fail:string,rounds?:number)=>T('rule',title,body,'',fail,rounds);
export const defaultTasks:Task[]=[
R('LEWA RĘKA','Przez 2 rundy wszyscy używają tylko lewej ręki.','Złamiesz? → dolewasz do Szklanki Losu.',2),
R('PRAWA RĘKA','Przez 2 rundy wszyscy używają tylko prawej ręki.','Złamiesz? → dolewasz do Szklanki Losu.',2),
R('ZAKAZ IMION','Nie wolno używać imion innych graczy.','Złamiesz? → dolewasz do Szklanki Losu.',3),
R('KRÓL CISZY','Wybierz osobę. Nie może mówić przez jedną rundę.','Odezwie się? → dolewa do Szklanki Losu.',1),
R('PYTANIE ZA PYTANIE','Na każde pytanie odpowiadasz pytaniem przez 3 rundy.','Pomyłka? → dolewasz do Szklanki Losu.',3),
R('KCIUK NA STOLE','Gdy właściciel karty położy kciuk na stole, wszyscy robią to samo.','Ostatni → dolewa do Szklanki Losu.'),
R('ZAKAZ WSKAZYWANIA','Przez 3 rundy nie wolno wskazywać palcem.','Złapany? → dolewasz do Szklanki Losu.',3),
R('ŚMIECH ZAKAZANY','Wybierz osobę. Nie może się śmiać przez jedną rundę.','Zaśmieje się? → dolewa do Szklanki Losu.',1),
R('SŁOWO PUŁAPKA','Wybierz jedno słowo.','Kto je powie → dolewa do Szklanki Losu.'),
R('ECHO','Wybrana osoba musi powtarzać ostatnie słowo każdej swojej wypowiedzi.','Zapomni? → dolewa do Szklanki Losu.'),
R('ZMIANA MIEJSC','Wszyscy zamieniają się miejscami.','Ostatnia osoba na miejscu → dolewa do Szklanki Losu.',1),
R('MÓW CISZEJ','Przez jedną rundę wszyscy muszą mówić szeptem.','Powiesz normalnie? → dolewasz do Szklanki Losu.',1),
R('PAN/PANI','Przez 2 rundy każdy musi zwracać się do wszystkich „Pan/Pani”.','Zapomnisz? → dolewasz do Szklanki Losu.',2),
R('NOWE IMIONA','Każdy gracz otrzymuje nowe imię na 3 rundy.','Pomylisz z prawdziwym? → dolewasz do Szklanki Losu.',3),
R('ZAKAZ TELEFONU','Przez 2 rundy nikt nie może dotknąć telefonu.','Dotkniesz? → dolewasz do Szklanki Losu.',2),
R('NA ODWRÓT','Przez jedną rundę odpowiadasz „tak”, gdy brzmi „nie”, i odwrotnie.','Pomyłka? → dolewasz do Szklanki Losu.',1),
R('SŁOWO KLUCZ','Wybierz słowo, które każdy musi powiedzieć przed rozpoczęciem swojej tury.','Zapomnisz? → dolewasz do Szklanki Losu.'),
R('PODWÓJNA KARA','Od teraz każda kara za złamanie reguły obowiązuje podwójnie.','',2),
R('ZAKAZ PRZEKLINANIA','Pierwsza osoba, która przeklnie, ponosi konsekwencję.','Przekleństwo → dolewasz do Szklanki Losu.'),
...['państw w Europie','marek samochodów','filmów','rzeczy, które zabierasz na wakacje','rzeczy znajdujących się w lodówce','imion żeńskich','imion męskich','zwierząt','rzeczy znajdujących się w łazience','powodów spóźnienia','aplikacji w telefonie','rzeczy w damskiej torebce','popularnych dań','rzeczy, których nie chcesz usłyszeć od lekarza','powodów, żeby nie iść do pracy','rzeczy, które robisz przed wyjściem na imprezę','rzeczy, które mogą zepsuć randkę','rzeczy, które robisz po imprezie'].map(x=>C('Wymień 5 '+x+'.')),
...['Pokaż ostatnie zdjęcie w galerii.','Powiedz, kto z tej grupy ma najgorszy gust muzyczny.','Pokaż ostatnią wysłaną wiadomość na Messengerze/WhatsAppie.','Powiedz, jaki był Twój najgorszy podryw.','Kto z tej grupy najdłużej wytrzymałby bez telefonu?','Powiedz swoją najbardziej kontrowersyjną opinię.','Kto z tej grupy ma największą szansę zostać sławny?','Powiedz, jaka była Twoja największa imprezowa wpadka.','Kto z tej grupy najgorzej kłamie?','Powiedz, jaki jest Twój najbardziej absurdalny zakup.','Kto z tej grupy najprędzej wpakowałby się w kłopoty?','Wskaż osobę, z którą najchętniej poleciał(a)byś na drugi koniec świata.'].map(Q),
...['Zatańcz przez 20 sekund bez muzyki.','Przez minutę mów głosem wybranej osoby.','Zrób reklamę swojego napoju jak influencer.','Zaśpiewaj refren dowolnej piosenki.','Zrób 10 przysiadów.','Udawaj przez 30 sekund prezentera wiadomości.','Zrób najlepszą imitację wybranego zwierzęcia.','Powiedz każdej osobie przy stole jeden szczery komplement.','Wymyśl krótką piosenkę o osobie po Twojej lewej stronie.','Wymyśl pseudonim dla każdego gracza.','Zrób selfie z osobą wybraną przez grupę.','Wybierz osobę – oboje wykonajcie 15-sekundowy taniec.'].map(W)];
export const newGame=(host:Player,settings:Settings,tasks:Task[]):GS=>({phase:'lobby',hostId:host.id,players:[host],settings,tasks,deck:[],used:[],idx:0,prev:null,round:1,drawn:0,rules:[],glass:0,log:[]});
export const mkPlayer=(id:string,name:string,avatar:string):Player=>({id,name,avatar,ready:false,draws:0,penalties:0,hand:[]});
const say=(s:GS,t:string)=>{s.log=[t,...s.log].slice(0,30)};
function advance(s:GS){const n=s.players.length;s.prev=s.players[s.idx]?.id??null;s.idx=(s.idx+1)%n;
 if(s.idx===0){s.round++;s.rules=s.rules.filter(r=>r.until===undefined||s.round<r.until);
  if(s.settings.maxRounds>0&&s.round>s.settings.maxRounds){s.phase='ended';return}}
 s.phase='draw'}
function pick(s:GS,type:TT,avoid?:string):Task|null{const all=s.tasks.filter(t=>t.type===type);if(!all.length)return null;
 let pool=all.filter(t=>!s.used.includes(t.id)&&t.id!==avoid);if(!pool.length){s.used=s.used.filter(i=>!all.some(t=>t.id===i));pool=all.filter(t=>t.id!==avoid||all.length===1)}
 const t=pool[Math.floor(Math.random()*pool.length)];s.used.push(t.id);return t}
const addRule=(s:GS,t:Task)=>{if(t.type==='rule')s.rules.push({task:t,until:t.rounds?s.round+t.rounds:undefined})};
export function reduce(s0:GS,a:Action,me:string):GS|null{
 const s:GS=JSON.parse(JSON.stringify(s0));const p=s.players.find(x=>x.id===me);const host=me===s.hostId;
 const cp=s.players[s.idx];const myTurn=!!cp&&(cp.id===me||host);
 if(a.t==='join'){if(p){p.name=a.name;p.avatar=a.avatar;return s}
  if(s.phase!=='lobby'||s.players.length>=8)return null;
  let name=a.name.trim()||'Gracz';let k=2;while(s.players.some(x=>x.name===name))name=a.name+' '+k++;
  s.players.push(mkPlayer(me,name,a.avatar));say(s,name+' dołącza do pokoju');return s}
 if(!p)return null;
 switch(a.t){
 case 'profile':p.name=a.name||p.name;p.avatar=a.avatar;return s;
 case 'ready':if(s.phase!=='lobby')return null;p.ready=!p.ready;return s;
 case 'settings':if(!host)return null;s.settings=a.s;return s;
 case 'start':if(!host||s.phase!=='lobby'||s.players.length<3||s.players.some(x=>!x.ready))return null;
  if(!Object.values(s.settings.enabled).some(Boolean))return null;
  s.deck=shuffle(makeDeck());s.used=[];s.idx=0;s.round=1;s.drawn=0;s.rules=[];s.glass=0;s.cur=undefined;s.prev=null;
  s.players.forEach(x=>{x.draws=0;x.penalties=0;x.hand=[]});s.phase='draw';say(s,'Gra się zaczyna!');return s;
 case 'draw':{if(s.phase!=='draw'||!myTurn)return null;
  if(!s.deck.length){s.deck=shuffle(makeDeck());say(s,'Talia przetasowana na nowo')}
  const card=s.deck.pop()!;s.drawn++;cp.draws++;
  if(card.rank==='A'){if(s.glass>0){s.glass=0;cp.penalties++;s.cur={card,pid:cp.id,kind:'ace'};s.phase='task';say(s,cp.name+' opróżnia Szklankę Losu')}
   else{s.cur={card,pid:cp.id,kind:'ace',empty:true};say(s,'As, ale Szklanka Losu jest pusta – dobierz kolejną kartę')}return s}
  if(SPECIAL[card.rank]){cp.hand.push(card);s.cur={card,pid:cp.id,kind:'special'};s.phase='task';say(s,cp.name+' dostaje kartę specjalną '+card.rank);return s}
  let type=s.settings.suitMap[card.suit];if(!s.settings.enabled[type]){const on=(Object.keys(s.settings.enabled) as TT[]).filter(k=>s.settings.enabled[k]);type=on[Math.floor(Math.random()*on.length)]}
  const task=pick(s,type);if(!task)return null;addRule(s,task);s.cur={card,pid:cp.id,kind:'task',task};s.phase='task';say(s,cp.name+' dobiera '+card.rank+SUITS_SYM(card.suit));return s}
 case 'resolve':{if(s.phase!=='task'||!myTurn||!s.cur)return null;
  if(s.cur.kind==='task'&&a.r==='fail'){const m=s.rules.some(r=>r.task.title==='PODWÓJNA KARA')?2:1;
   if(s.cur.task!.fail.includes('Szklanki'))s.glass=Math.min(GLASS_MAX,s.glass+m);else cp.penalties+=m}
  if(a.r==='skip'&&!s.settings.allowSkip)return null;s.cur.res=a.r;advance(s);return s}
 case 'reroll':{if(s.phase!=='task'||!myTurn||!s.settings.allowReroll||s.cur?.kind!=='task')return null;
  const old=s.cur.task!;s.rules=s.rules.filter(r=>r.task.id!==old.id||old.type!=='rule');
  const t=pick(s,old.type,old.id);if(!t)return null;addRule(s,t);s.cur.task=t;say(s,'Zadanie wylosowane ponownie');return s}
 case 'special':{const i=p.hand.findIndex(c=>c.id===a.cardId);if(i<0||s.phase==='lobby'||s.phase==='ended')return null;
  const c=p.hand.splice(i,1)[0];say(s,p.name+' używa karty '+c.rank+': '+SPECIAL[c.rank]);
  if(a.endTurn&&s.phase==='task'&&s.cur?.kind==='special'&&myTurn)advance(s);return s}
 case 'removeRule':s.rules.splice(a.i,1);return s;
 case 'skipPlayer':if(!host||(s.phase!=='draw'&&s.phase!=='task'))return null;advance(s);return s;
 case 'end':if(!host||s.phase==='lobby')return null;s.phase='ended';return s;
 case 'again':if(!host||s.phase!=='ended')return null;s.phase='lobby';s.players.forEach(x=>{x.ready=false;x.hand=[]});s.cur=undefined;return s;
 case 'leave':{const i=s.players.findIndex(x=>x.id===me);s.players.splice(i,1);if(!s.players.length)return s;
  if(s.hostId===me)s.hostId=s.players[0].id;
  if(s.phase==='draw'||s.phase==='task'){if(i<s.idx)s.idx--;if(s.idx>=s.players.length){s.idx=0}
   if(i===s.idx||(s.phase==='task'&&s.cur?.pid===me)){s.phase='draw'}
   if(s.players.length<2)s.phase='ended'}
  return s}
 }
 return null}
function SUITS_SYM(s:Suit){return SYM[s]}
export const soft=(t:string)=>t.replace(/\bdolewa(sz)?\b(?! do)/gi,m=>m+' do Szklanki Losu');
