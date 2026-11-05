import {useEffect,useRef,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import {Action,Card,GS,GLASS_MAX,GLASS_ML,SYM,SPECIAL,TYPE_META,TT,defaultSettings,defaultTasks,mkPlayer,newGame,reduce,soft} from './game';

const sb=createClient(import.meta.env.VITE_SUPABASE_URL||'http://x',import.meta.env.VITE_SUPABASE_ANON_KEY||'x');
const AV=['🦊','🐼','🦁','🐸','🦄','🐙','🦉','🐯','🐵','🐲'];
const ls=(k:string,d:string)=>localStorage.getItem('sl.'+k)??d;
const pid=ls('pid','')||(()=>{const i=crypto.randomUUID();localStorage.setItem('sl.pid',i);return i})();

function useRoom(code:string|null){
 const [gs,setGs]=useState<GS|null>(null);const [online,setOnline]=useState<string[]>([]);const [busy,setBusy]=useState(false);
 const ref=useRef<{s:GS;v:number}|null>(null);
 const apply=(s:GS,v:number)=>{if(!ref.current||v>=ref.current.v){ref.current={s,v};setGs(s)}};
 const load=async()=>{const {data}=await sb.from('rooms').select('state,version').eq('code',code).maybeSingle();if(data)apply(data.state as GS,data.version);return data};
 useEffect(()=>{if(!code)return;ref.current=null;setGs(null);load();
  const ch=sb.channel('room-'+code,{config:{presence:{key:pid}}})
   .on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:`code=eq.${code}`},(p:any)=>p.new?.state&&apply(p.new.state,p.new.version))
   .on('presence',{event:'sync'},()=>setOnline(Object.keys(ch.presenceState())))
   .subscribe(st=>{if(st==='SUBSCRIBED')ch.track({t:Date.now()})});
  const iv=setInterval(load,4000);return()=>{clearInterval(iv);sb.removeChannel(ch)}},[code]);
 const dispatch=async(a:Action):Promise<string|null>=>{setBusy(true);try{
  for(let i=0;i<6;i++){if(!ref.current)await load();const c=ref.current;if(!c)return 'Brak pokoju';
   const n=reduce(c.s,a,pid);if(!n)return 'Ruch niedozwolony w tym stanie gry';
   const {data}=await sb.from('rooms').update({state:n,version:c.v+1,updated_at:new Date().toISOString()}).eq('code',code).eq('version',c.v).select('version');
   if(data&&data.length){apply(n,c.v+1);return null}await load()}
  return 'Konflikt synchronizacji – spróbuj ponownie'}finally{setBusy(false)}};
 return {gs,online,busy,dispatch};
}

async function createRoom(name:string,avatar:string){
 const settings=JSON.parse(ls('settings',JSON.stringify(defaultSettings)));const tasks=JSON.parse(ls('tasks',JSON.stringify(defaultTasks)));
 for(let i=0;i<8;i++){const code=Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
  const {error}=await sb.from('rooms').insert({code,state:newGame({...mkPlayer(pid,name,avatar),ready:true},settings,tasks),version:0});
  if(!error)return code;if(error.code!=='23505')throw error}
 throw new Error('Nie udało się utworzyć pokoju')}

const Btn=(p:any)=><button {...p} className={`btn ${p.g?'gold':'ghost'} ${p.className||''}`}/>;

function PlayingCard({card,up,size=1}:{card?:Card;up:boolean;size?:number}){
 const red=card&&(card.suit==='H'||card.suit==='D');const col=red?'#b91c1c':'#111';
 const L:Record<string,number[][]>={};const l=14,c=50,r=86;
 L['2']=[[c,18],[c,82]];L['3']=[[c,18],[c,50],[c,82]];L['4']=[[l,18],[r,18],[l,82],[r,82]];L['5']=[...L['4'],[c,50]];L['6']=[...L['4'],[l,50],[r,50]];
 L['7']=[...L['6'],[c,34]];L['8']=[...L['6'],[c,34],[c,66]];L['9']=[[l,18],[r,18],[l,39],[r,39],[l,61],[r,61],[l,82],[r,82],[c,50]];L['10']=[[l,18],[r,18],[l,39],[r,39],[l,61],[r,61],[l,82],[r,82],[c,28],[c,72]];
 return <div className={`flip ${up?'up':''}`} style={{width:120*size,height:176*size}}><div>
  <div className="face back"/>
  <div className="face front bg-[#fffdf5] border border-gray-300 shadow-xl" style={{color:col}}>{card&&<>
   <div className="absolute left-1.5 top-1 text-center leading-none font-bold" style={{fontSize:16*size}}>{card.rank}<br/>{SYM[card.suit]}</div>
   <div className="absolute right-1.5 bottom-1 text-center leading-none font-bold rotate-180" style={{fontSize:16*size}}>{card.rank}<br/>{SYM[card.suit]}</div>
   <div className="absolute inset-x-5 inset-y-4">
    {card.rank==='A'&&<div className="absolute inset-0 grid place-items-center" style={{fontSize:64*size}}>{SYM[card.suit]}</div>}
    {L[card.rank]?.map(([x,y],i)=><span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{left:x+'%',top:y+'%',fontSize:22*size,transform:`translate(-50%,-50%) ${y>50?'rotate(180deg)':''}`}}>{SYM[card.suit]}</span>)}
    {SPECIAL[card.rank]&&<div className="absolute inset-0 grid place-items-center border-2 border-yellow-600 rounded font-serif font-extrabold" style={{fontSize:48*size}}>{card.rank}<span style={{fontSize:30*size}}>{SYM[card.suit]}</span></div>}
   </div></>}</div></div></div>}

function Glass({level}:{level:number}){const h=(level/GLASS_MAX)*100;
 return <div className="text-center"><svg viewBox="0 0 100 130" width="110"><defs><clipPath id="g"><path d="M12 8h76l-9 112a8 8 0 0 1-8 7H29a8 8 0 0 1-8-7z"/></clipPath></defs>
  <g clipPath="url(#g)"><rect x="0" y={128-1.2*h} width="100" height="130" fill="#9b1d34" className="wave"/></g>
  <path d="M12 8h76l-9 112a8 8 0 0 1-8 7H29a8 8 0 0 1-8-7z" fill="none" stroke="#d4af37" strokeWidth="3"/></svg>
  <div className="text-gold-light text-sm">{level*GLASS_ML/GLASS_MAX} / {GLASS_ML} ml</div><div className="text-xs opacity-60">wirtualna szklanka</div></div>}

export default function App(){
 const [code,setCode]=useState<string|null>(null);const [screen,setScreen]=useState<'menu'|'join'|'rules'|'settings'>('menu');
 const [name,setName]=useState(ls('name',''));const [av,setAv]=useState(ls('av',AV[0]));const [jc,setJc]=useState(new URLSearchParams(location.search).get('room')||'');
 const [err,setErr]=useState('');const {gs,online,busy,dispatch}=useRoom(code);
 useEffect(()=>{if(jc)setScreen('join')},[]);
 useEffect(()=>{localStorage.setItem('sl.name',name);localStorage.setItem('sl.av',av)},[name,av]);
 const enter=async(c:string,create:boolean)=>{setErr('');try{
   if(!name.trim())return setErr('Wpisz pseudonim');
   if(create)c=await createRoom(name,av);
   else{const {data}=await sb.from('rooms').select('code').eq('code',c).maybeSingle();if(!data)return setErr('Nie ma takiego pokoju');}
   setCode(c);const {data:row}=await sb.from('rooms').select('state,version').eq('code',c).single();
   if(!create){const n=reduce(row!.state as GS,{t:'join',name,avatar:av},pid);if(!n){setCode(null);return setErr('Pokój pełny lub gra już trwa')}
    await sb.from('rooms').update({state:n,version:row!.version+1}).eq('code',c).eq('version',row!.version)}
   history.replaceState(null,'',location.pathname)}catch(e:any){setErr(e.message||'Błąd połączenia (sprawdź .env)')}};
 const wrap=(c:any)=><div className="mx-auto max-w-3xl p-4 min-h-screen">{c}</div>;
 const me=gs?.players.find(p=>p.id===pid);
 if(code&&gs&&!me)return wrap(<div className="panel mt-20 text-center">Nie ma Cię już w tym pokoju. <Btn g onClick={()=>{setCode(null)}}>Menu</Btn></div>);
 if(!code||!gs)return wrap(<div className="pt-10 text-center space-y-5">
  <h1 className="font-serif font-extrabold text-5xl sm:text-6xl text-gold tracking-wider">SZKLANKA LOSU</h1>
  {code&&!gs&&<p>Łączenie z pokojem…</p>}
  <div className="panel space-y-3 text-left"><label className="text-sm opacity-70">Pseudonim</label>
   <input value={name} onChange={e=>setName(e.target.value.slice(0,16))} className="w-full rounded-lg bg-black/60 border border-gold/40 p-3" placeholder="Twój pseudonim"/>
   <div className="flex flex-wrap gap-2">{AV.map(a=><button key={a} onClick={()=>setAv(a)} className={`text-2xl rounded-full w-11 h-11 ${a===av?'bg-gold/30 ring-2 ring-gold':'bg-black/40'}`}>{a}</button>)}</div></div>
  {screen==='menu'&&<div className="grid gap-3"><Btn g onClick={()=>enter('',true)}>NOWA GRA</Btn><Btn onClick={()=>setScreen('join')}>DOŁĄCZ DO GRY</Btn><Btn onClick={()=>setScreen('rules')}>ZASADY</Btn><Btn onClick={()=>setScreen('settings')}>USTAWIENIA</Btn></div>}
  {screen==='join'&&<div className="grid gap-3"><input value={jc} onChange={e=>setJc(e.target.value.toUpperCase())} maxLength={5} placeholder="KOD POKOJU" className="text-center text-3xl tracking-[.4em] rounded-lg bg-black/60 border border-gold/40 p-3"/><Btn g onClick={()=>enter(jc,false)}>DOŁĄCZ</Btn><Btn onClick={()=>setScreen('menu')}>Wróć</Btn></div>}
  {screen==='rules'&&<div className="panel text-left space-y-2 text-sm"><p>W swojej turze dobierasz kartę z głównej talii (52 karty):</p><p><b className="text-red-400">♥ Kier</b> – Quiz · <b className="text-blue-400">♦ Karo</b> – Kategorie · <b className="text-green-400">♣ Trefl</b> – Wyzwanie · <b className="text-yellow-400">♠ Pik</b> – Reguła (przypisanie można zmienić w ustawieniach pokoju).</p><p><b>As</b> – opróżnia Szklankę Losu (jeśli pusta, dobierz kolejną). {Object.values(SPECIAL).map(s=><span key={s} className="block">• {s}</span>)}</p><p>Karty specjalne możesz użyć od razu lub zachować na później. Reguły działają, dopóki wygasną lub zostaną usunięte. Napoje mogą być bezalkoholowe – picie jest zawsze dobrowolne, a kary to wirtualne punkty pecha i wlewanie do wirtualnej szklanki.</p><Btn onClick={()=>setScreen('menu')}>Wróć</Btn></div>}
  {screen==='settings'&&<div className="panel text-left space-y-2"><p className="text-sm opacity-80">Domyślna liczba rund dla nowych pokoi (0 = bez limitu). Pozostałe opcje ustawia host w poczekalni.</p>
   <input type="number" min={0} max={50} defaultValue={JSON.parse(ls('settings',JSON.stringify(defaultSettings))).maxRounds} onChange={e=>localStorage.setItem('sl.settings',JSON.stringify({...JSON.parse(ls('settings',JSON.stringify(defaultSettings))),maxRounds:+e.target.value}))} className="rounded bg-black/60 border border-gold/40 p-2 w-24"/><div><Btn onClick={()=>setScreen('menu')}>Wróć</Btn></div></div>}
  {err&&<p className="text-red-400">{err}</p>}</div>);

 const host=gs.hostId===pid;const d=async(a:Action)=>{const e=await dispatch(a);if(e)setErr(e);else setErr('')};
 const leave=async()=>{await dispatch({t:'leave'});setCode(null);setScreen('menu')};
 const link=`${location.origin}${location.pathname}?room=${code}`;
 const head=<div className="flex items-center justify-between py-3"><h1 className="font-serif font-extrabold text-2xl text-gold">SZKLANKA LOSU</h1><div className="flex gap-2 items-center"><span className="panel !py-1 tracking-widest">{code}</span><Btn onClick={leave}>Wyjdź</Btn></div></div>;
 const errEl=err&&<p className="text-red-400 text-center">{err}</p>;

 if(gs.phase==='lobby'){const all=gs.players.length>=3&&gs.players.every(p=>p.ready);const st=gs.settings;
  return wrap(<>{head}<div className="panel space-y-3"><div className="flex gap-2 flex-wrap items-center"><span>Kod: <b className="text-gold text-2xl tracking-widest">{code}</b></span><Btn onClick={()=>navigator.clipboard?.writeText(link)}>Kopiuj link zaproszenia</Btn></div>
   <div className="grid sm:grid-cols-2 gap-2">{gs.players.map(p=><div key={p.id} className="flex items-center gap-3 rounded-xl bg-black/40 p-3"><span className="text-3xl">{p.avatar}</span><div className="flex-1"><b>{p.name}</b>{p.id===gs.hostId&&' 👑'}<div className="text-xs opacity-60">{online.includes(p.id)?'● online':'○ offline'}</div></div><span className={p.ready?'text-green-400':'text-gray-500'}>{p.ready?'GOTOWY':'czeka'}</span></div>)}</div>
   <p className="text-sm opacity-70">Graczy: {gs.players.length}/8 (min. 3)</p>
   {host&&<div className="space-y-2 border-t border-gold/20 pt-3"><label className="text-sm">Liczba rund (0 = bez limitu) <input type="number" min={0} max={50} value={st.maxRounds} onChange={e=>d({t:'settings',s:{...st,maxRounds:+e.target.value}})} className="ml-2 w-20 rounded bg-black/60 border border-gold/40 p-1"/></label>
    <div className="flex flex-wrap gap-2">{(Object.keys(TYPE_META) as TT[]).map(k=><button key={k} onClick={()=>d({t:'settings',s:{...st,enabled:{...st.enabled,[k]:!st.enabled[k]}}})} style={{borderColor:TYPE_META[k].color,color:TYPE_META[k].color,opacity:st.enabled[k]?1:.35}} className="border rounded-full px-3 py-1 text-sm">{TYPE_META[k].name}</button>)}</div>
    <label className="mr-4 text-sm"><input type="checkbox" checked={st.allowSkip} onChange={e=>d({t:'settings',s:{...st,allowSkip:e.target.checked}})}/> Pomijanie zadań</label>
    <label className="text-sm"><input type="checkbox" checked={st.allowReroll} onChange={e=>d({t:'settings',s:{...st,allowReroll:e.target.checked}})}/> Ponowne losowanie</label></div>}
   <div className="flex gap-2"><Btn g disabled={busy} onClick={()=>d({t:'ready'})}>{me!.ready?'NIE GOTOWY':'GOTOWY'}</Btn>{host&&<Btn g disabled={!all||busy} onClick={()=>d({t:'start'})}>START GRY</Btn>}</div>{errEl}</div></>)}

 if(gs.phase==='ended'){const top=[...gs.players].sort((a,b)=>a.penalties-b.penalties);
  return wrap(<>{head}<div className="panel text-center space-y-3"><div className="text-6xl animate-bounce">🥃✨</div><h2 className="font-serif text-4xl text-gold">KONIEC GRY</h2>
   <p>Rozegrane rundy: <b>{Math.min(gs.round,gs.settings.maxRounds||gs.round)}</b> · Dobrane karty: <b>{gs.drawn}</b></p>
   {top.map(p=><div key={p.id} className="flex justify-between rounded-lg bg-black/40 p-2"><span>{p.avatar} {p.name}</span><span className="text-sm opacity-80">kart: {p.draws} · punkty pecha: {p.penalties}</span></div>)}
   {host?<Btn g onClick={()=>d({t:'again'})}>ZAGRAJ PONOWNIE</Btn>:<p className="text-sm opacity-70">Czekaj, aż host zacznie nową grę.</p>}</div></>)}

 const cp=gs.players[gs.idx];const nx=gs.players[(gs.idx+1)%gs.players.length];const pv=gs.players.find(p=>p.id===gs.prev);
 const mine=cp.id===pid||host;const cur=gs.cur;const meta=cur?.task&&TYPE_META[cur.task.type];
 const shuffling=gs.drawn===0;
 return wrap(<>{head}
  <div className="flex flex-wrap gap-2 justify-center text-sm">{gs.players.map((p,i)=><div key={p.id} className={`rounded-full px-3 py-1 border ${i===gs.idx?'border-gold bg-gold/20':'border-white/10'} ${online.includes(p.id)?'':'opacity-40'}`}>{p.avatar} {p.name} <span className="opacity-60">· {p.penalties}</span></div>)}</div>
  <p className="text-center text-sm opacity-70 mt-2">Runda {gs.round}{gs.settings.maxRounds?`/${gs.settings.maxRounds}`:''} · poprzednio: {pv?.name||'—'} · następny: {nx.name}</p>
  <div className="panel mt-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
   <div className={shuffling?'shuf':''}><div className="relative" style={{width:120,height:176}}><PlayingCard up={false}/><span className="absolute inset-0 grid place-items-center font-bold text-gold-light">{gs.deck.length}</span></div></div>
   <div className="text-center">{cur&&<div key={cur.card.id} className="fly inline-block"><PlayingCard up card={cur.card}/></div>}{!cur&&<p className="opacity-60">Talia gotowa</p>}</div>
   <Glass level={gs.glass}/></div>
  <div className="panel mt-3 text-center space-y-2" style={meta?{borderColor:meta.color}:{}}>
   {gs.phase==='draw'&&<><h2 className="text-xl">Tura: <b className="text-gold">{cp.avatar} {cp.name}</b></h2>{cur?.empty&&<p className="text-yellow-300">As, ale Szklanka Losu jest pusta – dobierz kolejną kartę!</p>}
    <Btn g disabled={!mine||busy} onClick={()=>d({t:'draw'})}>DOBIERZ KARTĘ</Btn>{!mine&&<p className="text-sm opacity-60">Czekaj na swoją kolej…</p>}</>}
   {gs.phase==='task'&&cur&&<>
    {cur.kind==='task'&&cur.task&&<><div className="text-sm tracking-widest" style={{color:meta!.color}}>{meta!.name}</div><h2 className="font-serif text-3xl font-extrabold">{cur.task.title==='KATEGORIE'||cur.task.title==='QUIZ'||cur.task.title==='WYZWANIE'?cur.task.body:cur.task.title}</h2>
     {cur.task.type==='rule'&&<p style={{color:meta!.color}}>{cur.task.body}</p>}<p className="italic opacity-90">{cur.task.ok&&soft(cur.task.ok)}{cur.task.ok&&<br/>}{cur.task.fail&&soft(cur.task.fail)}</p></>}
    {cur.kind==='ace'&&<><h2 className="font-serif text-3xl text-gold">SZKLANKA LOSU</h2><p>{cp.name} opróżnia Szklankę Losu (łyk napoju jest dobrowolny – liczy się punkt pecha). Los nie odpuszcza.</p></>}
    {cur.kind==='special'&&<><h2 className="font-serif text-3xl text-gold">KARTA SPECJALNA {cur.card.rank}</h2><p>{SPECIAL[cur.card.rank]}</p></>}
    {mine&&<div className="flex flex-wrap gap-2 justify-center pt-2">
     {cur.kind==='task'&&<><Btn g disabled={busy} onClick={()=>d({t:'resolve',r:'ok'})}>WYKONANO ✓</Btn><Btn disabled={busy} onClick={()=>d({t:'resolve',r:'fail'})}>NIE WYKONANO ✗</Btn>
      {gs.settings.allowSkip&&<Btn disabled={busy} onClick={()=>d({t:'resolve',r:'skip'})}>POMIŃ</Btn>}{gs.settings.allowReroll&&<Btn disabled={busy} onClick={()=>d({t:'reroll'})}>LOSUJ PONOWNIE</Btn>}</>}
     {cur.kind==='ace'&&<Btn g disabled={busy} onClick={()=>d({t:'resolve',r:'ok'})}>ZAKOŃCZ TURĘ</Btn>}
     {cur.kind==='special'&&<><Btn g disabled={busy} onClick={()=>d({t:'special',cardId:cur.card.id,endTurn:true})}>UŻYJ TERAZ</Btn><Btn disabled={busy} onClick={()=>d({t:'resolve',r:'ok'})}>ZACHOWAJ NA PÓŹNIEJ</Btn></>}</div>}
    {!mine&&<p className="text-sm opacity-60">{cp.name} wykonuje zadanie…</p>}</>}
   {errEl}</div>
  {me!.hand.length>0&&<div className="panel mt-3 flex items-center gap-3 flex-wrap"><b>Twoje karty specjalne:</b>{me!.hand.map(c=><Btn key={c.id} onClick={()=>d({t:'special',cardId:c.id})}>Użyj {c.rank}{SYM[c.suit]}</Btn>)}</div>}
  {gs.rules.length>0&&<div className="panel mt-3"><b className="text-yellow-400">Aktywne reguły</b>{gs.rules.map((r,i)=><div key={i} className="flex justify-between text-sm py-1"><span><b>{r.task.title}</b> – {r.task.body}{r.until?` (do rundy ${r.until-1})`:''}</span><button className="text-red-400" onClick={()=>d({t:'removeRule',i})}>✕</button></div>)}</div>}
  <div className="panel mt-3 text-xs opacity-70 space-y-1">{gs.log.slice(0,6).map((l,i)=><div key={i}>{l}</div>)}</div>
  {host&&<div className="flex gap-2 justify-center mt-3"><Btn onClick={()=>d({t:'skipPlayer'})}>Pomiń gracza</Btn><Btn onClick={()=>confirm('Zakończyć grę?')&&d({t:'end'})}>ZAKOŃCZ GRĘ</Btn></div>}
 </>)}
