import React,{useEffect,useState} from 'react';
import Layout from '../components/Layout';
import {rosterService,leagueService,playerService} from '../services/api';

const ICONS={top:'🗡️',jungle:'🌿',mid:'🔮',adc:'🏹',support:'🛡️'};
const LABELS={top:'TOP',jungle:'JUNGLE',mid:'MID',adc:'ADC',support:'SUPPORT'};
const GLOW={top:'#e74c3c',jungle:'#27ae60',mid:'#9b59b6',adc:'#f39c12',support:'#3498db'};
const MAP=[
  {pos:'top',    css:{top:'5%', left:'4%'}},
  {pos:'jungle', css:{top:'28%',right:'4%'}},
  {pos:'mid',    css:{top:'43%',left:'50%',transform:'translateX(-50%)'}},
  {pos:'adc',    css:{top:'63%',right:'4%'}},
  {pos:'support',css:{top:'68%',left:'4%'}},
];

function Avatar({src,name,color,size=38}){
  const[err,setErr]=useState(false);
  return src&&!err
    ?<img src={src} alt={name} onError={()=>setErr(true)} style={{width:size,height:size,objectFit:'cover',borderRadius:6,border:`1px solid ${color}`}}/>
    :<div style={{width:size,height:size,borderRadius:6,flexShrink:0,background:`linear-gradient(135deg,${color}55,rgba(8,18,38,0.9))`,border:`1px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:size*0.45,color:'#fff',fontWeight:700}}>{(name||'?')[0].toUpperCase()}</div>;
}

function FilledCard({slot,onRemove,onCaptain}){
  const c=GLOW[slot.position];
  return(
    <div style={{width:158,background:'rgba(4,12,26,0.93)',border:`1.5px solid ${c}`,borderRadius:12,padding:'10px 12px',boxShadow:`0 0 18px ${c}44,0 4px 20px rgba(0,0,0,0.7)`,backdropFilter:'blur(6px)'}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:c,marginBottom:7,display:'flex',alignItems:'center',gap:4}}>
        {ICONS[slot.position]} {LABELS[slot.position]}
        {slot.is_captain&&<span style={{marginLeft:'auto',background:'rgba(200,155,60,0.15)',border:'1px solid var(--lol-gold-1)',borderRadius:4,padding:'1px 5px',fontSize:9,color:'var(--lol-gold-1)'}}>★ CAP</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
        <Avatar src={slot.player_image} name={slot.player_name} color={c}/>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{slot.player_name}</div>
          <div style={{fontSize:10,color:'var(--lol-grey-1)',marginTop:1}}>{slot.player_team}</div>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.04)',borderRadius:6,padding:'4px 8px',marginBottom:8}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:13,color:'var(--lol-gold-1)',fontWeight:700}}>{slot.player_price} cr.</span>
        <span style={{fontSize:10,color:'var(--lol-grey-2)'}}>{slot.is_captain?'×1.5 pts':'joueur'}</span>
      </div>
      <div style={{display:'flex',gap:5}}>
        {!slot.is_captain&&<button onClick={()=>onCaptain(slot.player)} style={{flex:1,padding:'4px 0',fontSize:10,fontWeight:700,background:'rgba(200,155,60,0.12)',color:'var(--lol-gold-1)',border:'1px solid rgba(200,155,60,0.4)',borderRadius:5,cursor:'pointer'}}>★ Cap</button>}
        <button onClick={()=>onRemove(slot.player)} style={{flex:1,padding:'4px 0',fontSize:10,fontWeight:700,background:'rgba(231,76,60,0.12)',color:'#e74c3c',border:'1px solid rgba(231,76,60,0.4)',borderRadius:5,cursor:'pointer'}}>✕ Retirer</button>
      </div>
    </div>
  );
}

function EmptyCard({pos,onClick}){
  const[h,setH]=useState(false);
  const c=GLOW[pos];
  return(
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{width:158,height:112,background:h?`${c}12`:'rgba(4,12,26,0.7)',border:`1.5px dashed ${c}${h?'aa':'44'}`,borderRadius:12,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,transition:'all 0.2s',boxShadow:h?`0 0 18px ${c}33`:'none'}}>
      <div style={{fontSize:22,opacity:h?1:0.5}}>{ICONS[pos]}</div>
      <div style={{fontSize:10,fontWeight:700,color:h?c:`${c}88`,letterSpacing:1.5}}>{LABELS[pos]}</div>
      <div style={{fontSize:11,color:'var(--lol-grey-2)',opacity:h?1:0.6}}>+ Ajouter</div>
    </div>
  );
}

function PickerRow({p,color,onAdd}){
  const[err,setErr]=useState(false);
  return(
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',border:'1px solid var(--border-gold)',borderRadius:8,cursor:'pointer',transition:'all 0.15s'}}
      onClick={()=>onAdd(p)}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background=`${color}11`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-gold)';e.currentTarget.style.background='transparent';}}>
      <Avatar src={p.image_url} name={p.in_game_name} color={color} size={40}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,color:'var(--lol-gold-light)',fontSize:14}}>{p.in_game_name}</div>
        <div style={{fontSize:11,color:'var(--lol-grey-1)',marginTop:2}}>{p.team_code||p.team} · {p.region}</div>
      </div>
      <div style={{fontFamily:'var(--font-display)',fontSize:16,color:'var(--lol-gold-1)',fontWeight:700,flexShrink:0}}>{p.price} cr.</div>
    </div>
  );
}

export default function Roster(){
  const[leagues,setLeagues]=useState([]);
  const[sel,setSel]=useState('');
  const[roster,setRoster]=useState(null);
  const[players,setPlayers]=useState([]);
  const[loading,setLoading]=useState(false);
  const[addPos,setAddPos]=useState(null);
  const[search,setSearch]=useState('');
  const[error,setError]=useState('');
  const[ok,setOk]=useState('');

  useEffect(()=>{
    leagueService.myLeagues().then(r=>setLeagues(r.data));
    playerService.list().then(r=>setPlayers(r.data));
  },[]);

  const load=(lid)=>{
    setLoading(true);setError('');
    rosterService.get(lid)
      .then(r=>setRoster(r.data))
      .catch(()=>rosterService.create(lid).then(r=>setRoster(r.data)))
      .finally(()=>setLoading(false));
  };
  const changeLigue=(lid)=>{setSel(lid);if(lid)load(lid);else setRoster(null);};

  const slots=roster?Object.fromEntries(roster.slots.map(s=>[s.position,s])):{};
  const budget=roster?parseFloat(roster.budget_used):0;
  const max=leagues.find(l=>l.id===+sel)?.budget_per_team||150;
  const pct=Math.min(100,(budget/max)*100);
  const bc=pct>85?'#e74c3c':pct>65?'#f39c12':'#27ae60';

  const addPlayer=async(p)=>{
    setError('');
    try{const r=await rosterService.addPlayer(sel,{player_id:p.id,position:addPos});setRoster(r.data);setAddPos(null);setSearch('');setOk(`${p.in_game_name} ajouté !`);setTimeout(()=>setOk(''),2500);}
    catch(e){setError(e.response?.data?.error||'Erreur');}
  };
  const remove=async(pid)=>{
    setError('');
    try{const r=await rosterService.removePlayer(sel,pid);setRoster(r.data);}
    catch(e){setError(e.response?.data?.error||'Erreur');}
  };
  const captain=async(pid)=>{
    try{const r=await rosterService.setCaptain(sel,pid);setRoster(r.data);setOk('Capitaine défini !');setTimeout(()=>setOk(''),2000);}
    catch(e){setError(e.response?.data?.error||'Erreur');}
  };

  const filtered=players.filter(p=>
    p.role===addPos&&
    (p.in_game_name.toLowerCase().includes(search.toLowerCase())||
     (p.team_code||'').toLowerCase().includes(search.toLowerCase())||
     p.team.toLowerCase().includes(search.toLowerCase()))&&
    !roster?.slots.some(s=>s.player===p.id)
  );

  return(
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🛡️ Mon Roster</h1>
        <select className="filter-select" value={sel} onChange={e=>changeLigue(e.target.value)}>
          <option value="">— Choisir une ligue —</option>
          {leagues.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {!sel&&<div className="empty-state"><span className="empty-icon">🛡️</span><p>Sélectionne une ligue pour composer ton équipe.</p></div>}
      {sel&&loading&&<div className="page-loading"><span className="spinner large"/></div>}

      {sel&&!loading&&roster&&<>
        {/* Budget */}
        <div style={{display:'flex',alignItems:'center',gap:16,background:'rgba(4,12,26,0.7)',borderRadius:10,border:'1px solid var(--border-gold)',padding:'12px 18px',marginBottom:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'var(--lol-grey-1)',marginBottom:6,letterSpacing:1,fontWeight:600}}>BUDGET UTILISÉ</div>
            <div style={{height:8,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,borderRadius:4,background:`linear-gradient(90deg,${bc},${bc}cc)`,transition:'width 0.4s,background 0.3s',boxShadow:`0 0 8px ${bc}88`}}/>
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <span style={{fontFamily:'var(--font-display)',fontSize:22,color:bc,fontWeight:700}}>{budget}</span>
            <span style={{color:'var(--lol-grey-1)',fontSize:13}}> / {max} cr.</span>
          </div>
        </div>

        {ok&&<div className="success-box" style={{marginBottom:12}}>{ok}</div>}
        {error&&<div className="error-box" style={{marginBottom:12}}>{error}</div>}

        {/* Map */}
        <div style={{position:'relative',width:'100%',minHeight:500,background:'radial-gradient(ellipse at 15% 15%,rgba(10,60,20,0.5) 0%,transparent 38%),radial-gradient(ellipse at 85% 85%,rgba(10,60,20,0.5) 0%,transparent 38%),linear-gradient(135deg,#040c1a 0%,#07111e 100%)',borderRadius:20,border:'1.5px solid rgba(200,155,60,0.2)',overflow:'hidden',marginBottom:16}}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.15}}>
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#1a6fff" strokeWidth="30"/>
            <polyline points="0,100% 0,0 100%,0" fill="none" stroke="#8a7a40" strokeWidth="12"/>
            <polyline points="0,100% 100%,100% 100%,0" fill="none" stroke="#8a7a40" strokeWidth="12"/>
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#8a7a40" strokeWidth="12"/>
            <circle cx="9%" cy="85%" r="26" fill="rgba(30,100,255,0.12)" stroke="#3264c8" strokeWidth="1.5"/>
            <circle cx="91%" cy="15%" r="26" fill="rgba(200,50,50,0.12)" stroke="#c83232" strokeWidth="1.5"/>
            <circle cx="50%" cy="50%" r="16" fill="none" stroke="rgba(200,155,60,0.4)" strokeWidth="1"/>
          </svg>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:'var(--font-display)',fontSize:60,color:'rgba(200,155,60,0.04)',fontWeight:900,letterSpacing:8,userSelect:'none',pointerEvents:'none',whiteSpace:'nowrap'}}>LOL FANTASY</div>

          {MAP.map(({pos,css})=>(
            <div key={pos} style={{position:'absolute',...css,zIndex:2}}>
              {slots[pos]
                ?<FilledCard slot={slots[pos]} onRemove={remove} onCaptain={captain}/>
                :<EmptyCard pos={pos} onClick={()=>setAddPos(pos)}/>}
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',padding:'12px 20px',background:roster.is_complete?'rgba(39,174,96,0.1)':'rgba(200,155,60,0.08)',border:`1px solid ${roster.is_complete?'rgba(39,174,96,0.3)':'rgba(200,155,60,0.2)'}`,borderRadius:10,fontSize:13,color:roster.is_complete?'#27ae60':'var(--lol-gold-1)'}}>
          {roster.is_complete?'✅ Roster complet — le capitaine marque ×1.5 pts':`⏳ ${5-roster.slots.length} poste(s) à remplir`}
        </div>
      </>}

      {addPos&&(
        <div className="modal-overlay" onClick={()=>setAddPos(null)}>
          <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setAddPos(null)}>✕</button>
            <div className="modal-title">{ICONS[addPos]} Choisir un {LABELS[addPos]}</div>
            <input className="chat-input" style={{width:'100%',marginBottom:14}} placeholder="Nom, équipe, code..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
            {error&&<div className="error-box" style={{marginBottom:12}}>{error}</div>}
            <div style={{maxHeight:360,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
              {filtered.length===0
                ?<div style={{textAlign:'center',color:'var(--lol-grey-1)',padding:24,fontSize:13}}>Aucun joueur disponible pour ce poste.</div>
                :filtered.map(p=><PickerRow key={p.id} p={p} color={GLOW[addPos]} onAdd={addPlayer}/>)
              }
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
