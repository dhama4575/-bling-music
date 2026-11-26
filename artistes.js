/* BLING MONEY MUSIC V2 - Partie 1 : artistes, contrats, AI GUARD, badges, interactions */
(()=>{
const E=esc,CV='v1';
const CT=`CONTRAT ARTISTE BLING MONEY MUSIC (version ${CV} - texte provisoire, à faire valider par un juriste avant le lancement officiel)

1. Droits : tu déclares être l'auteur ou détenir tous les droits sur les œuvres que tu publies (paroles, musique, enregistrement, samples) et avoir l'accord de tes co-auteurs.
2. Créations humaines : tu publies uniquement des créations réalisées par des humains. Les morceaux entièrement générés par IA sont interdits. BLING AI GUARD peut bloquer un titre ou le soumettre à une vérification humaine ; aucune détection n'est infaillible.
3. Vente : quand la vente sera activée, tu fixes le prix ; BLING MONEY MUSIC garde 30 % et tu reçois 70 %, après confirmation du paiement par le prestataire.
4. Crédits : tu indiques fidèlement les auteurs, compositeurs et producteurs.
5. Retrait : BLING MONEY MUSIC peut retirer un contenu en cas de violation de droits, de fraude ou de signalement fondé.
6. Preuve : ton acceptation est enregistrée avec la date, l'adresse IP et l'appareil.`;
const AIL={human_probable:'Création humaine probable',ai_suspected:'Création IA suspectée',needs_review:'Vérification humaine nécessaire'};
const ST={pending:'En attente de vérification',approved:'Publié',rejected:'Refusé'};
const RL={author:'Auteur',composer:'Compositeur',producer:'Producteur',performer:'Interprète',mixer:'Mixage',mastering:'Mastering',label:'Label',other:'Autre'};
const bd=a=>(a?.verified?' <b style="color:var(--g)" title="BLING VERIFIED">✔ Vérifié</b>':'')+(a?.human_verified?' <span class="bdg" style="background:#009e60;color:#000">Humain vérifié</span>':'');
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const up=async(bk,p,f)=>{const u=await SB.storage.from(bk).upload(p,f);if(u.error)throw u.error;return u.data.path};
const pub=p=>SB.storage.from('covers').getPublicUrl(p).data.publicUrl;
const last=a=>[...(a||[])].sort((x,y)=>y.created_at.localeCompare(x.created_at))[0];
const names=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
window.isMod=()=>!!profile&&['admin','moderator'].includes(profile.role);
document.head.insertAdjacentHTML('beforeend','<style>#social .tx b,#social .tx span{white-space:normal}#social a{color:var(--g);text-decoration:underline}.seg button.on{background:var(--g);color:#000}</style>');

/* ---------- Studio artiste ---------- */
views.studio=async v=>{
 if(!user){v.innerHTML='<h2>Studio artiste</h2>'+needLogin('Connecte-toi pour demander un compte artiste.');return}
 const [a,p]=await Promise.all([SB.from('artists').select('*').eq('user_id',user.id).maybeSingle(),SB.from('artist_applications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1)]);
 const art=a.data,ap=p.data?.[0];
 if(!art){v.innerHTML=`<h2>Devenir artiste</h2>`+(ap?.status==='pending'?'<p class="m">✓ Ta demande est en cours d’examen par l’équipe BLING MONEY MUSIC.</p>':(ap?.status==='rejected'?`<p class="m">Ta dernière demande a été refusée${ap.note?' : '+E(ap.note):''}. Tu peux en déposer une nouvelle.</p>`:'<p class="m">Remplis ce dossier : un modérateur le valide avant l’ouverture de ton studio.</p>')+`<input id="sn" placeholder="Nom d’artiste"><input id="sc" placeholder="Pays / ville"><textarea id="sb" rows="5" placeholder="Biographie"></textarea><p class="m">Photo (facultative)</p><input id="sp" type="file" accept="image/*"><button class="btn" id="sa">Envoyer ma demande</button><p class="m" id="sm"></p>`);
  const b=$('#sa');if(!b)return;
  b.onclick=async()=>{const m=$('#sm'),n=$('#sn').value.trim();if(!n)return m.textContent='Le nom d’artiste est obligatoire.';b.disabled=true;m.textContent='Envoi…';
   try{const f=$('#sp').files[0];let ph=null;if(f)ph=pub(await up('covers',`artists/${user.id}/${Date.now()}-${safe(f.name)}`,f));
    const r=await SB.from('artist_applications').insert({user_id:user.id,stage_name:n,bio:$('#sb').value.trim()||null,country:$('#sc').value.trim()||null,photo_url:ph});if(r.error)throw r.error;
    toast('Demande envoyée');render()}catch(e){m.textContent='Erreur : '+e.message;b.disabled=false}};return}
 const c=await SB.from('contracts').select('id').eq('user_id',user.id).eq('version',CV).limit(1);
 if(!c.data?.length){v.innerHTML=`<h2>Contrat artiste</h2><p class="m">Ton compte est validé. Pour publier, accepte le contrat électronique.</p><div class="tile" style="white-space:pre-wrap;font-size:13px;line-height:1.5;max-height:340px;overflow-y:auto">${E(CT)}</div><label class="m"><input id="cc" type="checkbox" style="width:auto"> J’ai lu et j’accepte ce contrat</label><button class="btn" id="cs">Signer le contrat</button><p class="m" id="cm"></p>`;
  $('#cs').onclick=async()=>{if(!$('#cc').checked)return $('#cm').textContent='Coche la case pour accepter.';
   const {error}=await SB.rpc('sign_contract',{p_version:CV,p_hash:await sha(CT),p_ua:navigator.userAgent});if(error)return $('#cm').textContent='Erreur : '+error.message;toast('Contrat signé');render()};return}
 const [gs,ts,st]=await Promise.all([SB.from('genres').select('id,name').order('name'),SB.from('tracks').select('id,title,status,created_at,ai_checks(result,final_decision,created_at)').eq('artist_id',art.id).order('created_at',{ascending:false}),SB.rpc('my_artist_stats')]);
 const tot=(st.data||[]).reduce((s,x)=>s+Number(x.plays),0);
 v.innerHTML=`<h2>Studio · ${E(art.name)}${bd(art)}</h2>${art.photo_url?`<img src="${E(art.photo_url)}" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover">`:''}<textarea id="eb" rows="3" placeholder="Biographie">${E(art.bio)}</textarea><input id="ep" type="file" accept="image/*"><button class="btn s" id="es">Enregistrer mon profil</button>
 <h2>Statistiques d’écoute</h2><p class="m">${tot} écoute(s) au total (les statistiques de téléchargement arriveront avec la Partie 2).</p>${(st.data||[]).slice(0,8).map(x=>`<div class="row"><div class="tx"><b>${E(x.title)}</b></div><span class="du">${x.plays} écoutes</span></div>`).join('')}
 <h2>Mes titres</h2>${(ts.data||[]).map(t=>{const l=last(t.ai_checks);return `<div class="row"><div class="tx"><b>${E(t.title)}</b><span>${ST[t.status]||E(t.status)}${l?' · '+AIL[l.result]:''}</span></div></div>`}).join('')||'<p class="m">Aucun titre pour l’instant.</p>'}
 <h2>Publier un titre</h2><p class="m">Chaque titre est analysé par BLING AI GUARD puis publié par un modérateur.</p><select id="pt"><option value="single">Single</option><option value="album">Titre d’un album</option></select><input id="pa" placeholder="Nom de l’album" hidden><input id="pn" placeholder="Titre"><select id="pg">${(gs.data||[]).map(g=>`<option value="${g.id}">${E(g.name)}</option>`).join('')}</select><input id="pau" placeholder="Auteur(s), séparés par des virgules"><input id="pco" placeholder="Compositeur(s)"><input id="ppr" placeholder="Producteur(s)"><p class="m">Fichier audio</p><input id="pf" type="file" accept="audio/*,.mp3,.m4a,.wav"><p class="m">Pochette</p><input id="pc" type="file" accept="image/*"><label class="m"><input id="pr" type="checkbox" style="width:auto"> Je détiens les droits et ce titre est une création humaine</label><button class="btn" id="pb">Envoyer pour vérification</button><p class="m" id="pm"></p>`;
 $('#pt').onchange=e=>$('#pa').hidden=e.target.value!=='album';
 $('#es').onclick=async()=>{try{const f=$('#ep').files[0];const ph=f?pub(await up('covers',`artists/${user.id}/${Date.now()}-${safe(f.name)}`,f)):null;
   const {error}=await SB.rpc('update_my_artist',{p_bio:$('#eb').value,p_photo:ph});if(error)throw error;toast('Profil enregistré');render()}catch(e){toast(e.message)}};
 $('#pb').onclick=async()=>{const m=$('#pm'),title=$('#pn').value.trim(),af=$('#pf').files[0],cf=$('#pc').files[0],al=$('#pt').value==='album';
  if(!title||!af)return m.textContent='Titre et fichier audio obligatoires.';if(al&&!$('#pa').value.trim())return m.textContent='Indique le nom de l’album.';
  if(!$('#pr').checked)return m.textContent='Confirme que tu détiens les droits et que c’est une création humaine.';
  $('#pb').disabled=true;m.textContent='Envoi en cours… ne ferme pas la page.';
  try{const ts0=Date.now(),ap=await up('audio',`${art.id}/${ts0}-${safe(af.name)}`,af);let cover=null;if(cf)cover=pub(await up('covers',`artists/${user.id}/${ts0}-${safe(cf.name)}`,cf));
   const rt=al?$('#pa').value.trim():title;let rel=(await SB.from('releases').select('id').eq('artist_id',art.id).eq('type',al?'album':'single').eq('title',rt).maybeSingle()).data;
   if(!rel){const r=await SB.from('releases').insert({artist_id:art.id,type:al?'album':'single',title:rt,cover_url:cover,status:'pending'}).select('id').single();if(r.error)throw r.error;rel=r.data}
   const tr=await SB.from('tracks').insert({artist_id:art.id,genre_id:+$('#pg').value,title,producer:names($('#ppr').value).join(', ')||null,duration_seconds:await durOf(af),cover_url:cover,audio_path:ap,rights_confirmed:true,downloadable:false,status:'pending',release_id:rel.id}).select('id').single();if(tr.error)throw tr.error;
   const cr=[['author','pau'],['composer','pco'],['producer','ppr']].flatMap(([r,i])=>names($('#'+i).value).map(n=>({track_id:tr.data.id,person_name:n,role:r})));
   if(cr.length){const x=await SB.from('credits').insert(cr);if(x.error)throw x.error}
   toast('Titre envoyé : en attente d’analyse');render()}catch(e){m.textContent='Erreur : '+e.message;$('#pb').disabled=false}};
};

/* ---------- Espace modération ---------- */
views.mod=async v=>{
 if(!isMod()){v.innerHTML='<p class="m">Accès réservé aux modérateurs.</p>';return}
 const [ap,tr,ar]=await Promise.all([SB.from('artist_applications').select('*').eq('status','pending').order('created_at'),
  SB.from('tracks').select('id,title,audio_path,release_id,artists(name,user_id),ai_checks(id,result,final_decision,created_at)').eq('status','pending').order('created_at'),
  SB.from('artists').select('id,name,verified,human_verified').not('user_id','is',null).eq('status','approved').order('name')]);
 const pl=(tr.data||[]).filter(t=>t.artists?.user_id);
 v.innerHTML=`<h2>Dossiers artistes (${(ap.data||[]).length})</h2>${(ap.data||[]).map(a=>`<div class="tile" style="margin:8px 0"><b>${E(a.stage_name)}</b><span style="white-space:normal">${E(a.country||'')} ${E(a.bio||'')}</span><div class="seg"><button data-mapp="${a.id}|1">Valider</button><button data-mapp="${a.id}|0">Refuser</button></div></div>`).join('')||'<p class="m">Aucun dossier en attente.</p>'}
 <h2>Titres à vérifier (${pl.length})</h2>${pl.map(t=>{const l=last(t.ai_checks);return `<div class="tile" style="margin:8px 0"><b>${E(t.title)}</b><span style="white-space:normal">${E(t.artists.name)} · ${l?AIL[l.result]+(l.final_decision?(l.final_decision==='approved'?' (validé par un humain)':' (refusé)'):''):'aucune analyse'}</span><audio controls preload="none" style="width:100%;margin:8px 0"></audio><button class="btn s" data-mload="${E(t.audio_path)}">Charger l’audio</button>
 <div class="seg"><button data-mai="${t.id}|human_probable">Humaine</button><button data-mai="${t.id}|ai_suspected">IA suspectée</button><button data-mai="${t.id}|needs_review">À vérifier</button></div>
 ${l&&l.result!=='human_probable'&&!l.final_decision?`<button class="btn s" data-mval="${l.id}">Valider après vérification humaine</button>`:''}<div class="seg"><button data-mok="${t.id}|${t.release_id||''}">Publier</button><button data-mrej="${t.id}|${l?.id||''}">Refuser</button></div></div>`}).join('')||'<p class="m">Aucun titre en attente.</p>'}
 <h2>Badges artistes</h2>${(ar.data||[]).map(a=>`<div class="tile" style="margin:8px 0"><b>${E(a.name)}${bd(a)}</b><div class="seg"><button data-mbd="${a.id}|verified|${!a.verified}">${a.verified?'Retirer':'Donner'} Vérifié</button><button data-mbd="${a.id}|human_verified|${!a.human_verified}">${a.human_verified?'Retirer':'Donner'} Humain</button></div></div>`).join('')||'<p class="m">Aucun artiste pro pour l’instant.</p>'}
 <p class="m" style="font-size:12px">BLING AI GUARD : tant qu’aucun service d’analyse audio n’est branché, le résultat est saisi par le modérateur après écoute. Aucune détection n’est infaillible.</p>`;
 v.onclick=async e=>{const b=e.target.closest('[data-mapp],[data-mload],[data-mai],[data-mval],[data-mok],[data-mrej],[data-mbd]');if(!b)return;const d=b.dataset;let r;
  try{if(d.mload){const {data,error}=await SB.storage.from('audio').createSignedUrl(d.mload,3600);if(error)throw error;const a=b.parentElement.querySelector('audio');a.src=data.signedUrl;a.play().catch(()=>{});return}
   if(d.mapp){const [id,ok]=d.mapp.split('|');const note=ok==='1'?null:prompt('Raison du refus (visible par l’artiste) :');if(ok!=='1'&&note===null)return;r=await SB.rpc('review_application',{p_id:id,p_approve:ok==='1',p_note:note})}
   else if(d.mai){const [id,res]=d.mai.split('|');r=await SB.rpc('record_ai_check',{p_track:id,p_result:res,p_provider:'moderateur'})}
   else if(d.mval)r=await SB.rpc('review_ai_check',{p_check:d.mval,p_decision:'approved'});
   else if(d.mok){const [id,rel]=d.mok.split('|');r=await SB.from('tracks').update({status:'approved',published_at:new Date().toISOString()}).eq('id',id);if(!r.error&&rel)await SB.from('releases').update({status:'approved'}).eq('id',rel)}
   else if(d.mrej){const [id,ck]=d.mrej.split('|');if(ck)await SB.rpc('review_ai_check',{p_check:ck,p_decision:'rejected'});r=await SB.from('tracks').update({status:'rejected'}).eq('id',id)}
   else if(d.mbd){const [id,bg,on]=d.mbd.split('|');r=await SB.rpc('grant_badge',{p_artist:id,p_badge:bg,p_on:on==='true'})}
   if(r?.error)return toast(r.error.message);toast('✓ Fait');render()}catch(x){toast(x.message)}};
};

/* ---------- Interactions sur le titre en cours de lecture ---------- */
let sTok=0,reply=null,myLk=new Set();
async function social(){const box=$('#social');if(!box)return;if(!cur||cur.ext||!cur.id){box.innerHTML='';return}
 const tok=++sTok,id=cur.id,aid=cur.aid;
 try{const [lk,cm,cr,fo]=await Promise.all([SB.from('likes').select('user_id').eq('target_type','track').eq('target_id',id),
  SB.from('comments').select('id,user_id,parent_id,body,created_at').eq('track_id',id).order('created_at').limit(100),
  SB.from('credits').select('person_name,role').eq('track_id',id),
  user&&aid?SB.from('follows').select('artist_id').eq('user_id',user.id).eq('artist_id',aid):Promise.resolve({data:[]})]);
  const cs=cm.data||[],ids=cs.map(c=>c.id);
  const [cl,pf]=await Promise.all([ids.length?SB.from('likes').select('user_id,target_id').eq('target_type','comment').in('target_id',ids):{data:[]},
   cs.length?SB.from('profiles').select('id,display_name').in('id',[...new Set(cs.map(c=>c.user_id))]):{data:[]}]);
  if(tok!==sTok)return;
  const nm={};(pf.data||[]).forEach(p=>nm[p.id]=p.display_name);myLk=new Set((cl.data||[]).filter(x=>x.user_id===user?.id).map(x=>x.target_id));
  const cn={};(cl.data||[]).forEach(x=>cn[x.target_id]=(cn[x.target_id]||0)+1);
  const liked=!!user&&(lk.data||[]).some(x=>x.user_id===user.id),fol=!!(fo.data||[]).length;
  const one=(c,r)=>`<div class="row" style="align-items:flex-start;${r?'margin-left:24px':''}"><div class="tx"><b>${E(nm[c.user_id]||'Auditeur')}</b><span style="color:#ddd">${E(c.body)}</span><span><a data-clk="${c.id}">${myLk.has(c.id)?'♥':'♡'} ${cn[c.id]||0}</a>${r?'':` · <a data-crep="${c.id}">Répondre</a>`}${user&&(c.user_id===user.id||isMod())?` · <a data-cdel="${c.id}">Supprimer</a>`:''}</span></div></div>`;
  const top=cs.filter(c=>!c.parent_id);
  box.innerHTML=`<h2>${E(cur.artist)}${bd({verified:cur.vf,human_verified:cur.hv})}</h2><div class="seg"><button data-clike>${liked?'♥':'♡'} ${(lk.data||[]).length}</button>${aid?`<button data-cfol class="${fol?'on':''}">${fol?'Abonné ✓':'S’abonner'}</button>`:''}</div>`+
  ((cr.data||[]).length?`<h2>Crédits</h2>${cr.data.map(c=>`<p class="m" style="padding:2px 0">${RL[c.role]||''} : ${E(c.person_name)}</p>`).join('')}`:'')+
  `<h2>Commentaires (${cs.length})</h2>${top.map(c=>one(c,0)+cs.filter(r=>r.parent_id===c.id).map(r=>one(r,1)).join('')).join('')||'<p class="m">Sois le premier à commenter.</p>'}${reply?'<p class="m">Réponse en cours · <a data-ccancel>annuler</a></p>':''}<textarea id="ct" rows="2" placeholder="Écrire un commentaire…"></textarea><button class="btn" data-csend>Publier</button>`
 }catch(e){if(tok===sTok)box.innerHTML=''}}
$('#social').onclick=async e=>{const b=e.target.closest('[data-clike],[data-cfol],[data-csend],[data-crep],[data-cdel],[data-clk],[data-ccancel]');if(!b||!cur)return;const d=b.dataset;
 if(!user&&!('ccancel' in d))return toast('Connecte-toi pour participer');
 try{let r;
  if('clike' in d){const k={user_id:user.id,target_type:'track',target_id:cur.id};const x=await SB.from('likes').select('user_id').match(k).limit(1);r=x.data?.length?await SB.from('likes').delete().match(k):await SB.from('likes').insert(k)}
  else if('cfol' in d){const k={user_id:user.id,artist_id:cur.aid};const x=await SB.from('follows').select('artist_id').match(k).limit(1);r=x.data?.length?await SB.from('follows').delete().match(k):await SB.from('follows').insert(k)}
  else if('csend' in d){const t=$('#ct').value.trim();if(!t)return;r=await SB.from('comments').insert({track_id:cur.id,user_id:user.id,parent_id:reply,body:t});reply=null}
  else if(d.crep){reply=d.crep;await social();$('#ct')?.focus();return}
  else if('ccancel' in d){reply=null}
  else if(d.cdel)r=await SB.from('comments').delete().eq('id',d.cdel);
  else if(d.clk){const k={user_id:user.id,target_type:'comment',target_id:d.clk};r=myLk.has(d.clk)?await SB.from('likes').delete().match(k):await SB.from('likes').insert(k)}
  if(r?.error)toast(r.error.message);await social()}catch(x){toast(x.message)}};
const o=window.setUI;window.setUI=function(){o();reply=null;social()};
})();
