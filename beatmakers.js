/* BLING MONEY MUSIC v3 : rubrique Beatmakers (marketplace d'instrumentales) */
(()=>{
const E=esc,F=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA',D=d=>new Date(d).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'});
const rpc=async(f,a)=>{const {data,error}=await SB.rpc(f,a);if(error)throw error;return data};
const go=m=>{toast(m||'✓ Fait');render()};
const LIC={basic:['Basique','Usage non exclusif pour un titre. L’instrumentale reste en vente.'],premium:['Premium','Usage non exclusif étendu (clip, diffusion). L’instrumentale reste en vente.'],exclusive:['Exclusive','Droits exclusifs : l’instrumentale est retirée de la vente après ton achat.']};
const GEN=['Afrobeat','Amapiano','Hip-hop','Trap','R&B','Gospel','Rumba','Drill','Dancehall','Zouk'];
const BSEL='id,title,genre,mood,bpm,musical_key,cover_url,preview_url,exclusive_sold,beatmakers(id,name,verified),beat_licenses(kind,price_fcfa)';
const mkT=b=>({id:'b:'+b.id,ext:1,title:b.title,artist:b.beatmakers?.name||'',genre:b.genre||'',cover:b.cover_url,src:b.preview_url,dur:null});
const minP=b=>{const p=(b.beat_licenses||[]).map(x=>x.price_fcfa);return p.length?Math.min(...p):null};
const cl=s=>String(s||'').replace(/[,()%*]/g,' ').trim();
const up=async(bk,p,f,ct)=>{const u=await SB.storage.from(bk).upload(p,f,ct?{contentType:ct,cacheControl:'3600'}:undefined);if(u.error)throw u.error;return u.data.path};
const pubC=p=>SB.storage.from('covers').getPublicUrl(p).data.publicUrl;
const pubP=p=>SB.storage.from('beats-preview').getPublicUrl(p).data.publicUrl;
const im=u=>u?`<img src="${E(u)}" loading="lazy" alt="" onerror="this.remove()">`:'';
let bq='',bg='',BM=null;
const row=(b,i)=>{const p=minP(b);return `<div class="row"><div data-play="bt:${i}" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:pointer"><div class="cv">${im(b.cover_url)}</div><div class="tx"><b>${E(b.title)}</b><span>${E(b.beatmakers?.name)}${b.beatmakers?.verified?' ✔':''} · ${[b.genre,b.bpm?b.bpm+' BPM':'',b.musical_key].filter(Boolean).map(E).join(' · ')}</span></div></div><span class="du">${b.exclusive_sold?'Vendue':p?'dès '+F(p):''}</span><button class="ic" data-beat="${b.id}" aria-label="Détails">›</button></div>`};

/* ---------- Marketplace ---------- */
views.beats=async v=>{
 let q=SB.from('beats').select(BSEL).eq('status','approved').order('created_at',{ascending:false}).limit(60);
 if(bg)q=q.eq('genre',bg);const s=cl(bq);if(s)q=q.or(`title.ilike.%${s}%,genre.ilike.%${s}%,mood.ilike.%${s}%`);
 const [r,bm,mine]=await Promise.all([q,SB.from('beatmakers').select('id,name,photo_url,verified').eq('status','approved').order('created_at',{ascending:false}).limit(14),
  user?SB.from('beat_orders').select('id,license_kind,price_fcfa,beats(id,title,full_path,beatmakers(name))').eq('buyer_id',user.id).order('created_at',{ascending:false}):{data:[]}]);
 if(r.error)throw r.error;const l=r.data||[];L.bt=l.map(mkT);L.bt.forEach(t=>T[t.id]=t);
 v.innerHTML=`<h2>🎛 BEATMAKERS</h2><p class="sub">Écoute les extraits, choisis ta licence et achète avec ton portefeuille. Le fichier complet est disponible juste après l’achat.</p>
 <div class="seg"><button data-bgo="bmstudio">🎚 Mon espace beatmaker</button></div><input id="bq" type="search" placeholder="Titre, genre, ambiance…" value="${E(bq)}">
 <div class="chips"><button data-bg="" style="${bg?'':'border-color:var(--g);color:var(--g2)'}">Tous</button>${GEN.map(g=>`<button data-bg="${E(g)}" style="${bg===g?'border-color:var(--g);color:var(--g2)':''}">${E(g)}</button>`).join('')}</div>`+
 ((bm.data||[]).length?`<h2>Beatmakers</h2><div class="hs">${bm.data.map(b=>`<div class="ar" data-bm="${b.id}"><div class="av">${im(b.photo_url)}</div><b>${E(b.name)}${b.verified?' ✔':''}</b><span>Beatmaker</span></div>`).join('')}</div>`:'')+
 `<h2>Instrumentales</h2>`+(l.length?l.map(row).join(''):'<p class="m">Aucune instrumentale publiée pour le moment. Les beatmakers validés par BLING MONEY MUSIC publient ici leurs productions.</p>')+
 ((mine.data||[]).length?`<h2>Mes achats</h2>${mine.data.map(o=>`<div class="row"><div class="tx"><b>${E(o.beats?.title)}</b><span>${LIC[o.license_kind]?.[0]||''} · ${E(o.beats?.beatmakers?.name)} · ${F(o.price_fcfa)}</span></div><button class="ic" data-bdl="${E(o.beats?.full_path)}" aria-label="Télécharger">⇩</button></div>`).join('')}`:'');
 $('#bq').onchange=e=>{bq=e.target.value;render()}};

async function openBeat(id){const {data:b,error}=await SB.from('beats').select('*,beatmakers(id,user_id,name,verified),beat_licenses(id,kind,price_fcfa,terms)').eq('id',id).single();if(error)return toast(error.message);
 const t=mkT(b);T[t.id]=t;L.bd=[t];const lic=['basic','premium','exclusive'].map(k=>(b.beat_licenses||[]).find(x=>x.kind===k)).filter(Boolean);
 openReader(`<h2 style="margin-top:6px">${E(b.title)}</h2><p class="m"><a data-bm="${b.beatmakers.id}" style="color:var(--g);text-decoration:underline">${E(b.beatmakers.name)}</a>${b.beatmakers.verified?' ✔':''} · ${[b.genre,b.mood,b.bpm?b.bpm+' BPM':'',b.musical_key].filter(Boolean).map(E).join(' · ')}</p>${b.cover_url?`<img src="${E(b.cover_url)}" alt="" style="max-width:340px">`:''}<button class="btn" data-play="bd:0">▶ Écouter l’extrait</button>
 <h2>Licences</h2>${lic.map(x=>`<div class="tile" style="margin:8px 0;cursor:default"><b>${LIC[x.kind][0]} · ${F(x.price_fcfa)}</b><span style="white-space:normal">${E(x.terms||LIC[x.kind][1])}</span>${b.exclusive_sold?'<span style="color:var(--g)">Vendue en exclusivité</span>':`<button class="btn" style="margin-top:10px" data-bbuy="${x.id}|${x.price_fcfa}|${LIC[x.kind][0]}">Acheter cette licence</button>`}</div>`).join('')||'<p class="m">Aucune licence proposée.</p>'}
 <h2>Contacter le beatmaker</h2><textarea id="bmt" rows="3" placeholder="Ton message…"></textarea><button class="btn s" data-bsend="${b.beatmakers.user_id}|${b.id}">Envoyer le message</button><p class="m" style="font-size:12px">Conditions de licence provisoires, à faire valider par un juriste avant le lancement officiel.</p>`)}

/* ---------- Profil public d'un beatmaker ---------- */
views.beatmaker=async v=>{
 if(!BM){tab='beats';return render()}
 const [m,b]=await Promise.all([SB.from('beatmakers').select('*').eq('id',BM).single(),SB.from('beats').select(BSEL).eq('beatmaker_id',BM).eq('status','approved').order('created_at',{ascending:false})]);
 if(m.error)throw m.error;const x=m.data,l=b.data||[];L.bt=l.map(mkT);L.bt.forEach(t=>T[t.id]=t);
 v.innerHTML=`<button class="ic" data-bgo="beats">‹ Retour</button><div class="ap"><div class="bgi" style="background-image:url('${E(encodeURI(x.photo_url||'').replace(/'/g,'%27'))}')"></div><div class="pic">${im(x.photo_url)}</div><div><span class="m" style="font-size:12px;letter-spacing:.14em">BEATMAKER${x.verified?' · ✔ VÉRIFIÉ':''}</span><h1>${E(x.name)}</h1>${x.city?`<p class="m" style="padding:4px 0">${E(x.city)}</p>`:''}${x.bio?`<p class="bio">${E(x.bio)}</p>`:''}</div></div>
 <h2>Instrumentales</h2>${l.map(row).join('')||'<p class="m">Aucune instrumentale publiée.</p>'}
 <h2>Contacter ${E(x.name)}</h2><textarea id="bmt" rows="3" placeholder="Ton message…"></textarea><button class="btn s" data-bsend="${x.user_id}|">Envoyer le message</button>`};

/* ---------- Espace beatmaker ---------- */
views.bmstudio=async v=>{
 if(!user){v.innerHTML='<h2>Espace beatmaker</h2>'+needLogin('Connecte-toi pour créer ton profil de beatmaker.');return}
 const bm=(await SB.from('beatmakers').select('*').eq('user_id',user.id).maybeSingle()).data;
 let h='<h2>🎚 Espace beatmaker</h2>';
 if(!bm)h+=`<p class="m">Présente ton identité artistique. Ton profil est validé par l’équipe avant de pouvoir vendre.</p><input id="bn" placeholder="Nom de beatmaker / producteur"><input id="bc" placeholder="Ville ou pays"><textarea id="bb" rows="4" placeholder="Ton univers, tes influences, tes réalisations…"></textarea><p class="m">Photo ou logo</p><input id="bp" type="file" accept="image/*"><button class="btn" data-bapply>Envoyer ma demande</button><p class="m" id="bmsg"></p>`;
 else if(bm.status==='pending')h+='<p class="m">✓ Ta demande est en cours d’examen par l’équipe BLING MONEY MUSIC.</p>';
 else if(bm.status==='rejected')h+=`<p class="m">Ta demande a été refusée${bm.note?' : '+E(bm.note):''}.</p>`;
 else{
  const [gs,bt,od,ms]=await Promise.all([Promise.resolve(null),SB.from('beats').select('id,title,status,exclusive_sold,beat_licenses(kind,price_fcfa)').eq('beatmaker_id',bm.id).order('created_at',{ascending:false}),
   SB.from('beat_orders').select('id,license_kind,price_fcfa,seller_share,created_at,beats(title)').neq('buyer_id',user.id).order('created_at',{ascending:false}).limit(30),
   SB.from('direct_messages').select('id,from_user,body,read,created_at,beats(title)').eq('to_user',user.id).order('created_at',{ascending:false}).limit(30)]);
  const names={};const ids=[...new Set((ms.data||[]).map(x=>x.from_user))];if(ids.length){try{(await SB.from('profiles').select('id,display_name').in('id',ids)).data?.forEach(p=>names[p.id]=p.display_name)}catch(e){}}
  const gain=(od.data||[]).reduce((s,x)=>s+Number(x.seller_share),0);
  h+=`<div class="tile" style="cursor:default"><b>${E(bm.name)}${bm.verified?' ✔':''}</b><span>${(bt.data||[]).length} production(s) · ${(od.data||[]).length} commande(s) · ${F(gain)} reçus (ta part, après commission)</span></div>
  <textarea id="bb" rows="3" placeholder="Biographie">${E(bm.bio)}</textarea><input id="bc" placeholder="Ville ou pays" value="${E(bm.city)}"><input id="bp" type="file" accept="image/*"><button class="btn s" data-bsave>Enregistrer mon profil</button>
  <h2>Publier une instrumentale</h2><p class="m" style="font-size:12px">Ajoute un extrait court (90 secondes maximum) pour l’écoute publique, et le fichier complet, livré seulement après achat. Un modérateur valide chaque instrumentale. Tu fixes tes tarifs : BLING MONEY MUSIC garde 30 % de chaque vente.</p>
  <input id="xt" placeholder="Titre"><select id="xg">${GEN.map(g=>`<option>${E(g)}</option>`).join('')}</select><input id="xm" placeholder="Ambiance (sombre, festif, mélancolique…)"><input id="xb" type="number" placeholder="BPM"><input id="xk" placeholder="Tonalité (ex : Am)"><p class="m">Pochette</p><input id="xc" type="file" accept="image/*"><p class="m">Extrait (écoute publique)</p><input id="xp" type="file" accept="audio/*,.mp3,.m4a,.wav"><p class="m">Fichier complet (privé)</p><input id="xf" type="file" accept="audio/*,.mp3,.m4a,.wav,.zip"><p class="m">Tes tarifs en FCFA (laisse vide une licence que tu ne proposes pas, 100 minimum)</p><input id="x1" type="number" placeholder="Basique"><input id="x2" type="number" placeholder="Premium"><input id="x3" type="number" placeholder="Exclusive"><label class="m"><input id="xr" type="checkbox" style="width:auto"> Je suis l’auteur de cette instrumentale et je détiens tous les droits (création humaine, sans sample non autorisé)</label><button class="btn" data-bpub>Envoyer pour validation</button><p class="m" id="bmsg"></p>
  <h2>Mes productions</h2>${(bt.data||[]).map(b=>`<div class="row"><div class="tx"><b>${E(b.title)}</b><span>${{pending:'En attente de validation',approved:'Publiée',rejected:'Refusée'}[b.status]}${b.exclusive_sold?' · vendue en exclusivité':''} · ${(b.beat_licenses||[]).map(l=>LIC[l.kind][0]+' '+F(l.price_fcfa)).join(' / ')}</span></div></div>`).join('')||'<p class="m">Aucune production.</p>'}
  <h2>Commandes reçues</h2>${(od.data||[]).map(o=>`<div class="row"><div class="tx"><b>${E(o.beats?.title)} · ${LIC[o.license_kind]?.[0]||''}</b><span>${D(o.created_at)} · ${F(o.price_fcfa)} (ta part : ${F(o.seller_share)})</span></div></div>`).join('')||'<p class="m">Aucune commande pour l’instant.</p>'}
  <h2>Messages</h2>${(ms.data||[]).map(m=>`<div class="tile" style="margin:8px 0;cursor:default"><b>${E(names[m.from_user]||'Un artiste')}${m.beats?.title?' · '+E(m.beats.title):''}</b><span style="white-space:normal;color:#ddd">${E(m.body)}</span><span>${D(m.created_at)}</span><button class="btn s" style="margin-top:8px" data-breply="${m.from_user}">Répondre</button></div>`).join('')||'<p class="m">Aucun message.</p>'}`;
 }
 if(isMod()){const [pb,pt]=await Promise.all([SB.from('beatmakers').select('*').eq('status','pending').order('created_at'),SB.from('beats').select('id,title,genre,preview_url,beatmakers(name),beat_licenses(kind,price_fcfa)').eq('status','pending').order('created_at')]);
  h+=`<h2>Modération Beatmakers</h2><p class="m">Profils à valider (${(pb.data||[]).length})</p>${(pb.data||[]).map(b=>`<div class="tile" style="margin:8px 0;cursor:default"><b>${E(b.name)}</b><span style="white-space:normal">${E(b.city||'')} ${E(b.bio||'')}</span><div class="seg"><button data-mbm="${b.id}|1">Valider</button><button data-mbm="${b.id}|0">Refuser</button></div></div>`).join('')}
  <p class="m">Instrumentales à valider (${(pt.data||[]).length})</p>${(pt.data||[]).map(b=>`<div class="tile" style="margin:8px 0;cursor:default"><b>${E(b.title)}</b><span style="white-space:normal">${E(b.beatmakers?.name)} · ${E(b.genre||'')} · ${(b.beat_licenses||[]).map(l=>LIC[l.kind][0]+' '+F(l.price_fcfa)).join(' / ')}</span><audio controls preload="none" src="${E(b.preview_url)}" style="width:100%;margin:8px 0"></audio><div class="seg"><button data-mbt="${b.id}|approved">Publier</button><button data-mbt="${b.id}|rejected">Refuser</button></div></div>`).join('')}`}
 v.innerHTML=h;
 v.onclick=async e=>{const b=e.target.closest('[data-bapply],[data-bsave],[data-bpub],[data-breply],[data-mbm],[data-mbt]');if(!b)return;const d=b.dataset,m=$('#bmsg');
  try{
   if('bapply' in d){const n=$('#bn').value.trim();if(!n)return m.textContent='Le nom est obligatoire.';b.disabled=true;const f=$('#bp').files[0];const ph=f?pubC(await up('covers',`beats/${user.id}/${Date.now()}-${safe(f.name)}`,f)):null;
    const r=await SB.from('beatmakers').insert({user_id:user.id,name:n,bio:$('#bb').value.trim()||null,city:$('#bc').value.trim()||null,photo_url:ph});if(r.error)throw r.error;go('Demande envoyée')}
   else if('bsave' in d){const f=$('#bp').files[0];const ph=f?pubC(await up('covers',`beats/${user.id}/${Date.now()}-${safe(f.name)}`,f)):null;await rpc('update_my_beatmaker',{p_bio:$('#bb').value,p_photo:ph,p_city:$('#bc').value.trim()||null});go('Profil enregistré')}
   else if('bpub' in d){const t=$('#xt').value.trim(),pf=$('#xp').files[0],ff=$('#xf').files[0],cf=$('#xc').files[0];
    const pr=[['basic',+$('#x1').value],['premium',+$('#x2').value],['exclusive',+$('#x3').value]].filter(x=>x[1]);
    if(!t||!pf||!ff)return m.textContent='Titre, extrait et fichier complet obligatoires.';if(!pr.length||pr.some(x=>x[1]<100))return m.textContent='Indique au moins un tarif (100 FCFA minimum).';
    if(!$('#xr').checked)return m.textContent='Confirme que tu détiens les droits.';const dp=await durOf(pf);if(dp&&dp>90)return m.textContent='L’extrait dure '+Math.round(dp)+' s : 90 secondes maximum, pour protéger ta production.';
    b.disabled=true;m.textContent='Envoi en cours… ne ferme pas la page.';const ts=Date.now(),id=bm.id;
    const pp=await up('beats-preview',`${id}/${ts}-${safe(pf.name)}`,pf,mimeOf(pf)),fp=await up('beats-full',`${id}/${ts}-${safe(ff.name)}`,ff,mimeOf(ff));
    const cv=cf?pubC(await up('covers',`beats/${user.id}/${ts}-${safe(cf.name)}`,cf)):null;
    const r=await SB.from('beats').insert({beatmaker_id:id,title:t,genre:$('#xg').value,mood:$('#xm').value.trim()||null,bpm:+$('#xb').value||null,musical_key:$('#xk').value.trim()||null,cover_url:cv,preview_url:pubP(pp),full_path:fp,duration_seconds:await durOf(ff),rights_confirmed:true,status:'pending'}).select('id').single();if(r.error)throw r.error;
    const lr=await SB.from('beat_licenses').insert(pr.map(([k,p])=>({beat_id:r.data.id,kind:k,price_fcfa:p})));if(lr.error)throw lr.error;go('Envoyée : en attente de validation')}
   else if(d.breply){const t=prompt('Ta réponse :');if(!t)return;await rpc('send_dm',{p_to:d.breply,p_body:t});toast('Message envoyé')}
   else if(d.mbm){const [id,ok]=d.mbm.split('|');const n=ok==='1'?null:prompt('Raison du refus :');if(ok!=='1'&&n===null)return;await rpc('review_beatmaker',{p_id:id,p_approve:ok==='1',p_note:n});go()}
   else if(d.mbt){const [id,s]=d.mbt.split('|');const r=await SB.from('beats').update({status:s}).eq('id',id);if(r.error)throw r.error;go()}
  }catch(x){(m||{}).textContent='Erreur : '+x.message;toast(x.message);if(b)b.disabled=false}}};
if(typeof mimeOf==='undefined')window.mimeOf=f=>f.type||'application/octet-stream';

/* ---------- Actions communes ---------- */
document.addEventListener('click',async e=>{const t=e.target;let b;
 if(b=t.closest('[data-beat]'))return openBeat(b.dataset.beat);
 if(b=t.closest('[data-bm]')){$('#rd').hidden=true;BM=b.dataset.bm;tab='beatmaker';cat=null;return render()}
 if(b=t.closest('[data-bgo]')){tab=b.dataset.bgo;return render()}
 if(b=t.closest('[data-bg]')){bg=b.dataset.bg;tab='beats';return render()}
 if(b=t.closest('[data-bdl]')){try{const {data,error}=await SB.storage.from('beats-full').createSignedUrl(b.dataset.bdl,300);if(error)throw error;window.open(data.signedUrl,'_blank')}catch(x){toast(x.message)}return}
 if(b=t.closest('[data-bbuy]')){if(!user)return toast('Connecte-toi pour acheter');const [id,p,n]=b.dataset.bbuy.split('|');if(!confirm('Acheter la licence '+n+' pour '+F(p)+' avec ton portefeuille ?'))return;
  try{await rpc('buy_beat',{p_license:id});toast('Achat réussi : retrouve ton fichier dans « Mes achats »');$('#rd').hidden=true;tab='beats';render()}catch(x){toast(x.message)}return}
 if(b=t.closest('[data-bsend]')){if(!user)return toast('Connecte-toi pour écrire au beatmaker');const [to,beat]=b.dataset.bsend.split('|'),m=$('#bmt').value.trim();if(!m)return toast('Écris ton message');
  try{await rpc('send_dm',{p_to:to,p_body:m,p_beat:beat||null});$('#bmt').value='';toast('Message envoyé')}catch(x){toast(x.message)}}
});
})();
