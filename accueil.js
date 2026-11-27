/* BLING MONEY MUSIC v3 : accueil, pages artistes, culture regroupée */
(()=>{
const E=esc;
const I=n=>`<svg class="i" viewBox="0 0 24 24">${n}</svg>`;
let AP=null;

/* ---------- Accueil ---------- */
const avatar=a=>`<div class="ar" data-artist="${a.k}"><div class="av">${a.img?`<img src="${E(a.img)}" loading="lazy" alt="" onerror="this.remove()">`:''}</div><b>${E(a.name)}${a.vf?' ✔':''}</b><span>${a.sub||'Artiste'}</span></div>`;
const rail=(l,k)=>{L[k]=l;return `<div class="hs">${l.map((t,i)=>card(t,k,i)).join('')}</div>`};
const sect=(t,sub,body,more)=>body?`<section class="sx"><div class="sh"><h2>${E(t)}</h2>${more?`<button class="lk" data-go="${more}">Tout voir</button>`:''}</div>${sub?`<p class="sub">${E(sub)}</p>`:''}${body}</section>`:'';
const uniq=l=>{const s=new Set();return l.filter(t=>!s.has(t.id)&&s.add(t.id))};

views.home=async v=>{
 await refDL();
 const hist=user?SB.from('plays').select('tracks(genres(name))').eq('user_id',user.id).order('played_at',{ascending:false}).limit(30).then(r=>r.data||[]):Promise.resolve([]);
 const jobs=[
  SB.from('tracks').select(QS).eq('status','approved').order('published_at',{ascending:false}).limit(30).then(r=>(r.data||[]).map(norm)),
  aTrend(),aMulti(['afrobeat','afrobeats','africa']),aMulti(['amapiano']),aMulti(['gospel']),aMulti(['gabon','gabonais','libreville']),aTrend('Hip-Hop/Rap'),aTrend('R&B/Soul'),
  iaSearch('','feature_films',12),
  SB.from('artists').select('id,name,photo_url,verified,human_verified').eq('status','approved').not('user_id','is',null).order('created_at',{ascending:false}).limit(14).then(r=>r.data||[]),
  SB.from('releases').select('id,title,type,cover_url,artists(name)').eq('status','approved').order('created_at',{ascending:false}).limit(14).then(r=>r.data||[]),
  aMulti(['instrumental','type beat']),hist,
  SB.from('beats').select('id,title,cover_url,exclusive_sold,beatmakers(name),beat_licenses(price_fcfa)').eq('status','approved').order('created_at',{ascending:false}).limit(14).then(r=>r.data||[])];
 const [own,tr,afro,ama,gos,gab,hip,rnb,fil,arts,rels,inst,hh,bts]=(await Promise.allSettled(jobs)).map(x=>x.value||[]);
 if(!own.length&&!tr.length){v.innerHTML='<p class="m">Impossible de charger la musique. Vérifie ta connexion Internet, ou ouvre Biblio. puis Ma musique hors ligne.</p>';return}
 /* Section d'accueil */
 const hero=uniq([...own.slice(0,3),...tr.slice(0,6)]).filter(t=>t.cover).slice(0,6);L.hero=hero;
 let h=hero.length?`<div id="hero">${hero.map((t,i)=>`<div class="sl ${i?'':'on'}"><div class="bg" style="background-image:url('${E(encodeURI(t.cover).replace(/'/g,'%27'))}')"></div><div class="art"><img src="${E(t.cover)}" alt="" onerror="this.remove()"></div><div class="sc"><span class="k">${t.ext?'TENDANCE':'À LA UNE'}</span><span class="t">${E(t.title)}</span><span class="a">${E(t.artist)}</span><div class="bt"><button class="btn" data-play="hero:${i}">▶ Écouter</button><button class="btn s" data-go="explore">Découvrir</button></div></div></div>`).join('')}<div class="dots">${hero.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div></div>`:'';
 /* Artistes à découvrir : artistes BLING d'abord, puis artistes en tendance */
 const aOwn=arts.map(a=>({k:'own:'+a.id,name:a.name,img:a.photo_url,vf:a.verified,sub:'Artiste BLING'}));
 const seen=new Set(aOwn.map(a=>a.name.toLowerCase())),aExt=[];
 tr.concat(afro,ama,gab).forEach(t=>{const n=t.artist.toLowerCase();if(t.artist&&!seen.has(n)&&aExt.length<12){seen.add(n);aExt.push({k:'ext:'+t.artist,name:t.artist,img:t.cover,sub:'En tendance'})}});
 const adis=[...aOwn,...aExt];
 /* Playlists : mixes composés automatiquement à partir de la musique disponible */
 const mx=[['Afro Vibes','Le meilleur de l’afrobeat',afro],['Amapiano Night','Rythmes sud-africains',ama],['Gabon Vibes','Sons de chez nous',gab],['Gospel Praise','Louange et inspiration',gos],['Hip-Hop Flow','Rap et hip-hop',hip],['Soul & R&B','Voix et émotions',rnb]].filter(m=>m[2].length);
 const mixH=mx.map((m,i)=>{L['mx'+i]=m[2];m[2].forEach(t=>T[t.id]=t);const c=m[2].filter(t=>t.cover).slice(0,4);while(c.length<4)c.push(null);
  return `<div class="mix" data-play="mx${i}:0" style="animation-delay:${i*60}ms"><div class="mo">${c.map(t=>t?`<img src="${E(t.cover)}" loading="lazy" alt="" onerror="this.remove()">`:'<i></i>').join('')}<span class="pl">▶</span></div><b>${E(m[0])}</b><span class="s">${E(m[1])}</span></div>`}).join('');
 /* Recommandations : d'après les genres réellement écoutés par la personne connectée */
 const cnt={};hh.forEach(x=>{const g=x.tracks?.genres?.name;if(g)cnt[g]=(cnt[g]||0)+1});
 const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
 let rec=[];if(top.length){try{rec=await aMulti(top)}catch(e){}}
 /* Albums et singles */
 const relH=rels.length?`<div class="hs">${rels.map((r,i)=>`<div class="card" data-rel="${r.id}" style="animation-delay:${Math.min(i,8)*60}ms"><div class="cv">${r.cover_url?`<img src="${E(r.cover_url)}" loading="lazy" alt="" onerror="this.remove()">`:''}<span class="pl">▶</span></div><b>${E(r.title)}</b><span>${r.type==='album'?'Album':'Single'} · ${E(r.artists?.name||'')}</span></div>`).join('')}</div>`:'';
 const certA=arts.filter(a=>a.verified).map(a=>({k:'own:'+a.id,name:a.name,img:a.photo_url,vf:1,sub:'Certifié BLING'}));
 h+=sect('Nouveautés','Les dernières sorties du catalogue BLING MONEY',own.length?rail(own,'own'):'','charts');
 h+=sect('Artistes à découvrir','Des talents à suivre',adis.length?`<div class="hs">${adis.map(avatar).join('')}</div>`:'');
 h+=sect('Albums et singles populaires','',relH||(tr.length?rail(tr.slice(0,12),'trs'):''),'charts');
 h+=sect('Tendances du moment','Ce que le monde écoute en ce moment',rail(tr,'tr'));
 h+=sect('Playlists','Des mixes pour chaque moment',mixH?`<div class="hs">${mixH}</div>`:'');
 h+=sect('Recommandé pour toi','D’après tes dernières écoutes',rec.length?rail(rec,'rec'):'');
 const btH=bts.length?`<div class="hs">${bts.map((b,i)=>{const p=(b.beat_licenses||[]).map(x=>x.price_fcfa);return `<div class="card" data-beat="${b.id}" style="animation-delay:${Math.min(i,8)*60}ms"><div class="cv">${b.cover_url?`<img src="${E(b.cover_url)}" loading="lazy" alt="" onerror="this.remove()">`:''}<span class="pl">▶</span></div><b>${E(b.title)}</b><span>${E(b.beatmakers?.name||'')}${p.length?' · dès '+Math.min(...p).toLocaleString('fr-FR')+' FCFA':''}</span></div>`}).join('')}</div>`:'';
 h+=sect('Productions et instrumentales','Achète une licence directement auprès des beatmakers BLING',btH||`<div class="tile" data-go="beats"><b>🎛 Découvre les beatmakers</b><span>Instrumentales à écouter et à acheter</span></div>`,'beats');
 h+=sect('Instrumentales en écoute libre','Sélection Audius',inst.length?rail(inst,'inst'):'');
 h+=sect('Artistes mis en avant','Profils certifiés BLING VERIFIED',certA.length?`<div class="hs">${certA.map(avatar).join('')}</div>`:'');
 h+=sect('Afrobeat','',afro.length?rail(afro,'af'):'')+sect('Musiques gabonaises','',gab.length?rail(gab,'ga'):'')+sect('Amapiano','',ama.length?rail(ama,'am'):'');
 h+=vsec('Bling Cinéma · films gratuits',fil);
 h+=`<section class="sx"><div class="gc" data-go="cult" style="margin-top:22px"><div class="bgi"></div><b>Gabon · mémoire et traditions</b><span>Histoire de la musique, légendes, instruments, danses et savoirs : l’identité qui nous inspire.</span></div><div class="gr"></div></section>`;
 h+='<p class="m" style="font-size:12px;text-align:center">Musique sur Internet fournie par Audius (écoute uniquement).</p>';
 v.innerHTML=h;
 let hi=0;hT=setInterval(()=>{const s=$$('.sl'),d=$$('.dots i');if(s.length<2)return;s[hi].classList.remove('on');d[hi]?.classList.remove('on');hi=(hi+1)%s.length;s[hi].classList.add('on');d[hi]?.classList.add('on')},6000)};

/* ---------- Page artiste ---------- */
views.artist=async v=>{
 if(!AP){tab='home';return render()}
 const [kind,key]=AP.split(/:(.+)/);let name,bio='',photo=null,vf=0,hv=0,id=null,l=[],rl=[],fc=0,fol=false;
 if(kind==='own'){id=key;
  const [a,t,r,f,me]=await Promise.all([SB.from('artists').select('*').eq('id',key).single(),SB.from('tracks').select(QS).eq('artist_id',key).eq('status','approved').order('published_at',{ascending:false}),
   SB.from('releases').select('id,title,type,cover_url').eq('artist_id',key).eq('status','approved').order('created_at',{ascending:false}),
   SB.from('follows').select('artist_id',{count:'exact',head:true}).eq('artist_id',key),user?SB.from('follows').select('artist_id').eq('user_id',user.id).eq('artist_id',key):{data:[]}]);
  if(a.error)throw a.error;({name,bio,photo_url:photo}=a.data);vf=a.data.verified;hv=a.data.human_verified;l=(t.data||[]).map(norm);rl=r.data||[];fc=f.count||0;fol=!!(me.data||[]).length;bio=bio||''}
 else{name=key;const r=await aSearch(key);l=r.filter(t=>t.artist.toLowerCase()===key.toLowerCase());if(!l.length)l=r;photo=l.find(t=>t.cover)?.cover||null}
 L.ap=l;l.forEach(t=>T[t.id]=t);
 v.innerHTML=`<button class="ic" data-aback>‹ Retour</button><div class="ap"><div class="bgi" style="background-image:url('${E(encodeURI(photo||'').replace(/'/g,'%27'))}')"></div><div class="pic">${photo?`<img src="${E(photo)}" alt="" onerror="this.remove()">`:''}</div><div><span class="m" style="font-size:12px;letter-spacing:.14em">ARTISTE${vf?' · ✔ VÉRIFIÉ':''}${hv?' · CRÉATION HUMAINE VÉRIFIÉE':''}</span><h1>${E(name)}</h1>${bio?`<p class="bio">${E(bio)}</p>`:''}${id?`<p class="m" style="padding:6px 0 0">${fc} abonné(s)</p>`:''}</div></div>
 <div class="seg" style="max-width:420px"><button class="on" data-play="ap:0" style="flex:2">▶ Écouter</button>${id?`<button data-follow="${id}" class="${fol?'':''}">${fol?'Abonné ✓':'Suivre'}</button>`:''}</div>`+
 (l.length?sec('Titres',l,'ap'):'<p class="m">Aucun titre disponible pour le moment.</p>')+
 (rl.length?`<h2>Discographie</h2><div class="hs">${rl.map(r=>`<div class="card" data-rel="${r.id}"><div class="cv">${r.cover_url?`<img src="${E(r.cover_url)}" loading="lazy" alt="" onerror="this.remove()">`:''}<span class="pl">▶</span></div><b>${E(r.title)}</b><span>${r.type==='album'?'Album':'Single'}</span></div>`).join('')}</div>`:'')};

document.addEventListener('click',async e=>{const t=e.target;let b;
 if(b=t.closest('[data-artist]')){AP=b.dataset.artist;tab='artist';cat=null;return render()}
 if(t.closest('[data-aback]')){tab='home';return render()}
 if(b=t.closest('[data-rel]')){try{const {data,error}=await SB.from('tracks').select(QS).eq('release_id',b.dataset.rel).eq('status','approved').order('created_at');if(error)throw error;
   const l=(data||[]).map(norm);if(!l.length)return toast('Aucun titre disponible dans cette sortie');l.forEach(x=>T[x.id]=x);Q=l;playIdx(0)}catch(x){toast(x.message)}return}
 if(b=t.closest('[data-follow]')){if(!user)return toast('Connecte-toi pour suivre un artiste');const k={user_id:user.id,artist_id:b.dataset.follow};
  const x=await SB.from('follows').select('artist_id').match(k).limit(1);const r=x.data?.length?await SB.from('follows').delete().match(k):await SB.from('follows').insert(k);if(r.error)return toast(r.error.message);render()}
},false);

/* ---------- Culture : quelques grandes catégories ---------- */
const GR=[
 ['legendes','Légendes et histoire musicale','Pionniers, grandes générations, groupes et voix qui ont marqué le Gabon.',[['memoire','pionniers'],['memoire','generations'],['memoire','legendes'],['memoire','femmes'],['memoire','groupes']]],
 ['scene','Scène et studios d’aujourd’hui','Studios, maisons de production et musique gabonaise actuelle.',[['memoire','studios'],['memoire','aujourdhui']]],
 ['trad','Musiques et danses traditionnelles','Instruments, rythmes, danses et rites transmis de génération en génération.',[['sources','musiques'],['sources','danses'],['sources','instruments']]],
 ['vie','Peuples, savoirs et art de vivre','Peuples, langues, contes, mode, gastronomie et patrimoine.',[['sources','peuples'],['sources','rites'],['sources','contes'],['sources','patrimoine'],['sources','mode'],['sources','gastro']]]];
const inG=(g,a)=>g[3].some(([s,c])=>s===a.section&&c===a.category);
views.cult=async v=>{
 if(cat&&!cat.startsWith('g:'))return catView(v);
 const {data,error}=await SB.from('articles').select('id,section,category,title,summary,cover_url').eq('status','published').order('created_at',{ascending:false});if(error)throw error;const a=data||[];
 if(cat){const g=GR.find(x=>'g:'+x[0]===cat)||GR[0],l=a.filter(x=>inG(g,x));
  v.innerHTML=`<button class="ic" data-back>‹ Retour</button><h2>${E(g[1])}</h2><p class="sub">${E(g[2])}</p>`+(l.length?l.map(x=>`<div class="row" data-art="${x.id}"><div class="cv">${x.cover_url?`<img src="${E(x.cover_url)}" alt="" onerror="this.remove()">`:''}</div><div class="tx"><b>${E(x.title)}</b><span>${E(x.summary||'')}</span></div></div>`).join(''):'<p class="m">Aucun dossier publié pour le moment. Chaque dossier est rédigé à partir de sources vérifiées avant sa publication.</p>')+(g[0]==='vie'?'<p class="m" style="font-size:12px">Les éléments sacrés, confidentiels ou réservés aux initiés ne sont pas publiés sans autorisation appropriée.</p>':'')+(isEd()?`<button class="btn" data-newart="${g[3][0][0]}:${g[3][0][1]}">+ Ajouter un dossier ici</button>`:'');return}
 v.innerHTML=`<h2>Le Gabon, notre identité</h2><p class="sub">Une mémoire vivante au service de la musique, avec une ouverture sur le monde.</p><div class="gg">${GR.map(g=>{const l=a.filter(x=>inG(g,x));const c=l.find(x=>x.cover_url)?.cover_url;return `<div class="gc" data-cat="g:${g[0]}"><div class="bgi" ${c?`style="background-image:url('${E(encodeURI(c).replace(/'/g,'%27'))}')"`:''}></div><b>${E(g[1])}</b><span>${l.length?l.length+' dossier(s)':'Dossiers à venir'}</span></div>`}).join('')}</div><div class="gr"></div>`};
})();
