/* BLING MONEY MUSIC v3 : espaces professionnels (label, manager, studio, producteur, ingénieur du son) et messagerie */
(()=>{
const E=esc,F=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
const D=d=>new Date(d).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'});
const rpc=async(f,a)=>{const {data,error}=await SB.rpc(f,a);if(error)throw error;return data};
const go=m=>{toast(m||'✓ Fait');render()};
const KL={label:'Label',manager:'Manager',studio:'Studio',producer:'Producteur',sound_engineer:'Ingénieur du son',other:'Autre professionnel'};
const KP={label:'Labels',manager:'Managers',studio:'Studios',producer:'Producteurs',sound_engineer:'Ingénieurs du son',other:'Autres'};
const BS={requested:'En attente',accepted:'Acceptée',declined:'Déclinée',cancelled:'Annulée'};
const im=u=>u?`<img src="${E(u)}" loading="lazy" alt="" onerror="this.remove()">`:'';
const up=async(p,f)=>{const u=await SB.storage.from('covers').upload(p,f);if(u.error)throw u.error;return SB.storage.from('covers').getPublicUrl(u.data.path).data.publicUrl};
let PK='',PRO=null;

/* ---------- Annuaire public ---------- */
views.pros=async v=>{
 let q=SB.from('pro_profiles').select('id,kind,name,city,photo_url').eq('status','approved').order('name');if(PK)q=q.eq('kind',PK);
 const {data,error}=await q;if(error)throw error;
 v.innerHTML=`<h2>🤝 Professionnels de la musique</h2><p class="sub">Labels, managers, studios, producteurs, ingénieurs du son : trouve le bon partenaire et envoie ta demande.</p>
 <div class="seg"><button data-go="prohub">Mon espace professionnel</button><button data-go="inbox">✉️ Messages</button></div>
 <div class="chips"><button data-pk="" style="${PK?'':'border-color:var(--g);color:var(--g2)'}">Tous</button>${Object.entries(KP).map(([k,n])=>`<button data-pk="${k}" style="${PK===k?'border-color:var(--g);color:var(--g2)':''}">${n}</button>`).join('')}</div>`+
 ((data||[]).map(p=>`<div class="row" data-pro="${p.id}" style="cursor:pointer"><div class="cv" style="border-radius:50%">${im(p.photo_url)}</div><div class="tx"><b>${E(p.name)}</b><span>${KL[p.kind]}${p.city?' · '+E(p.city):''}</span></div><span class="du">›</span></div>`).join('')||'<p class="m">Aucun professionnel validé pour le moment. Tu peux créer ton profil depuis « Mon espace professionnel ».</p>')};

views.pro=async v=>{
 if(!PRO){tab='pros';return render()}
 window.CUR_PRO=PRO;
 const [p,s]=await Promise.all([SB.from('pro_profiles').select('*').eq('id',PRO).single(),SB.from('pro_services').select('*').eq('pro_id',PRO).order('created_at')]);
 if(p.error)throw p.error;const x=p.data,sv=s.data||[];
 v.innerHTML=`<button class="ic" data-go="pros">‹ Retour</button><button class="ic" data-share="r|${x.id}|${E(x.name)}">↗ Partager</button><div class="ap"><div class="bgi" style="background-image:url('${E(encodeURI(x.photo_url||'').replace(/'/g,'%27'))}')"></div><div class="pic">${im(x.photo_url)}</div><div><span class="m" style="font-size:12px;letter-spacing:.14em">${KL[x.kind].toUpperCase()}</span><h1>${E(x.name)}</h1>${x.city?`<p class="m" style="padding:4px 0">${E(x.city)}</p>`:''}${x.bio?`<p class="bio">${E(x.bio)}</p>`:''}</div></div>
 ${x.equipment?`<h2>Équipements et réalisations</h2><p class="m" style="white-space:pre-wrap;color:#ddd">${E(x.equipment)}</p>`:''}
 <h2>Services et tarifs</h2>${sv.map(a=>`<div class="row"><div class="tx"><b>${E(a.title)}</b><span style="white-space:normal">${E(a.description||'')}</span></div><span class="du">${a.price_fcfa!=null?F(a.price_fcfa):'Sur devis'}</span></div>`).join('')||'<p class="m">Services non renseignés : contacte directement le professionnel.</p>'}
 <h2>Envoyer une demande</h2><select id="psv"><option value="">Demande générale</option>${sv.map(a=>`<option value="${a.id}">${E(a.title)}</option>`).join('')}</select><input id="pdt" type="date" min="${new Date().toISOString().slice(0,10)}"><textarea id="pmg" rows="4" placeholder="Décris ton projet, tes besoins…"></textarea><button class="btn" data-rbook="${x.id}">Envoyer la demande</button><p class="m" style="font-size:12px">Le paiement se convient directement avec le professionnel. Le paiement en ligne des prestations est à développer.</p>
 <button class="btn s" data-rdm="${x.user_id}">✉️ Lui écrire un message</button>`};

/* ---------- Espace professionnel ---------- */
views.prohub=async v=>{
 if(!user){v.innerHTML='<h2>Espace professionnel</h2>'+needLogin('Connecte-toi pour créer ton profil professionnel.');return}
 const [mine,art]=await Promise.all([SB.from('pro_profiles').select('*').eq('user_id',user.id).order('created_at'),SB.from('artists').select('id,name').eq('user_id',user.id).maybeSingle()]);
 const pros=mine.data||[],ok=pros.filter(p=>p.status==='approved'),ids=ok.map(p=>p.id),lm=ok.some(p=>['label','manager'].includes(p.kind));
 const [sv,bk,lk,inv,ob,rel]=await Promise.all([ids.length?SB.from('pro_services').select('*').in('pro_id',ids).order('created_at'):{data:[]},
  ids.length?SB.from('bookings').select('*,pro_services(title)').in('pro_id',ids).order('created_at',{ascending:false}).limit(40):{data:[]},
  ids.length?SB.from('pro_links').select('*,artists(id,name)').in('pro_id',ids):{data:[]},
  art.data?SB.from('pro_links').select('*,pro_profiles(name,kind)').eq('artist_id',art.data.id).in('status',['invited','accepted']):{data:[]},
  SB.from('bookings').select('*,pro_profiles(name)').eq('from_user',user.id).order('created_at',{ascending:false}).limit(20),
  lm?SB.rpc('pro_releases'):{data:[]}]);
 const used=pros.map(p=>p.kind);
 let h='<h2>🤝 Espace professionnel</h2><div class="seg"><button data-go="pros">Annuaire</button><button data-go="inbox">✉️ Messages</button></div>';
 h+=pros.map(p=>{const pid=p.id;let c=`<div class="tile pc" data-pid="${pid}" style="margin:12px 0;cursor:default"><b>${KL[p.kind]} · ${E(p.name)}</b><span>${{pending:'En attente de validation par l’équipe',approved:'Profil validé',rejected:'Refusé'+(p.note?' : '+E(p.note):'')}[p.status]}</span>`;
  if(p.status==='approved'){const my=(sv.data||[]).filter(s=>s.pro_id===pid),bks=(bk.data||[]).filter(b=>b.pro_id===pid),lks=(lk.data||[]).filter(l=>l.pro_id===pid&&l.status!=='declined'&&l.status!=='ended');
   c+=`<textarea data-f="bio" rows="3" placeholder="Présentation">${E(p.bio)}</textarea><input data-f="city" placeholder="Ville ou pays" value="${E(p.city)}"><textarea data-f="eq" rows="3" placeholder="Équipements, réalisations, références…">${E(p.equipment)}</textarea><input data-f="ph" type="file" accept="image/*"><button class="btn s" data-psave="${pid}">Enregistrer le profil</button>
   <h2>Services et tarifs</h2>${my.map(s=>`<div class="row"><div class="tx"><b>${E(s.title)}</b><span>${s.price_fcfa!=null?F(s.price_fcfa):'Sur devis'}</span></div><button class="ic" data-sdel="${s.id}">✕</button></div>`).join('')||'<p class="m">Aucun service.</p>'}
   <input data-f="st" placeholder="Nouveau service (ex : mixage d’un titre)"><input data-f="sp" type="number" placeholder="Prix en FCFA (vide = sur devis)"><button class="btn s" data-sadd="${pid}">Ajouter le service</button>
   <h2>Demandes reçues</h2>${bks.map(b=>`<div class="row"><div class="tx"><b>${E(b.pro_services?.title||'Demande générale')}${b.desired_date?' · '+b.desired_date:''}</b><span style="white-space:normal">${E(b.message||'')} · ${BS[b.status]} · ${D(b.created_at)}</span></div>${b.status==='requested'?`<button class="ic" data-bans="${b.id}|1">✓</button><button class="ic" data-bans="${b.id}|0">✕</button>`:''}</div>`).join('')||'<p class="m">Aucune demande.</p>'}`;
   if(['label','manager'].includes(p.kind))c+=`<h2>Artistes accompagnés</h2>${lks.map(l=>`<div class="row"><div class="tx"><b>${E(l.artists?.name)}</b><span>${l.status==='accepted'?'Accompagnement accepté':'Invitation en attente de réponse'}</span></div>${l.status==='accepted'?`<button class="ic" data-pst="${l.artist_id}">📊</button>`:''}<button class="ic" data-lend="${l.id}">✕</button></div><div id="st-${l.artist_id}"></div>`).join('')||'<p class="m">Aucun artiste pour l’instant.</p>'}
    <input data-f="qa" placeholder="Rechercher un artiste BLING à inviter"><button class="btn s" data-qa="${pid}">Rechercher</button><div class="qres"></div>
    <p class="m" style="font-size:12px">L’artiste doit accepter ton invitation avant que tu voies ses statistiques. La gestion des contrats label-artiste est à développer.</p>`;
  }
  return c+'</div>'}).join('');
 if(lm)h+=`<h2>Calendrier des sorties</h2>${(rel.data||[]).map(r=>`<div class="row"><div class="tx"><b>${E(r.title)}</b><span>${E(r.artist)} · ${r.type==='album'?'Album':'Single'} · ${{draft:'Brouillon',pending:'En validation',approved:'Publié',rejected:'Refusé'}[r.status]||r.status} · ${r.release_date||new Date(r.created_at).toLocaleDateString('fr-FR')}</span></div></div>`).join('')||'<p class="m">Aucune sortie pour l’instant.</p>'}`;
 if(art.data)h+=`<h2>Invitations d’accompagnement</h2>${(inv.data||[]).map(l=>`<div class="row"><div class="tx"><b>${E(l.pro_profiles?.name)}</b><span>${KL[l.pro_profiles?.kind]} · ${l.status==='accepted'?'Accompagnement actif : cette personne voit tes statistiques':'Invitation reçue'}</span></div>${l.status==='invited'?`<button class="ic" data-lans="${l.id}|1">✓</button><button class="ic" data-lans="${l.id}|0">✕</button>`:`<button class="ic" data-lend="${l.id}">Arrêter</button>`}</div>`).join('')||'<p class="m">Aucune invitation.</p>'}`;
 h+=`<h2>${pros.length?'Ajouter un autre profil':'Créer mon profil professionnel'}</h2><select id="pnk">${Object.entries(KL).filter(([k])=>!used.includes(k)).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select><input id="pnn" placeholder="Nom (label, studio, structure ou nom professionnel)"><input id="pnc" placeholder="Ville ou pays"><textarea id="pnb" rows="3" placeholder="Présentation"></textarea><input id="pnp" type="file" accept="image/*"><button class="btn" data-pnew>Envoyer pour validation</button><p class="m" style="font-size:12px">Les beatmakers et les artistes ont leur propre espace dans le Profil. Chaque profil professionnel est validé par l’équipe avant publication.</p>`;
 h+=`<h2>Mes demandes envoyées</h2>${(ob.data||[]).map(b=>`<div class="row"><div class="tx"><b>${E(b.pro_profiles?.name)}</b><span>${BS[b.status]} · ${D(b.created_at)}</span></div>${['requested','accepted'].includes(b.status)?`<button class="ic" data-bcan="${b.id}">Annuler</button>`:''}</div>`).join('')||'<p class="m">Aucune demande envoyée.</p>'}`;
 if(isMod()){const {data:pn}=await SB.from('pro_profiles').select('*').eq('status','pending').order('created_at');
  h+=`<h2>Modération des profils professionnels (${(pn||[]).length})</h2>${(pn||[]).map(b=>`<div class="tile" style="margin:8px 0;cursor:default"><b>${KL[b.kind]} · ${E(b.name)}</b><span style="white-space:normal">${E(b.city||'')} ${E(b.bio||'')}</span><div class="seg"><button data-mpro="${b.id}|1">Valider</button><button data-mpro="${b.id}|0">Refuser</button></div></div>`).join('')}`}
 v.innerHTML=h;
 v.onclick=async e=>{const b=e.target.closest('[data-pnew],[data-psave],[data-sadd],[data-sdel],[data-bans],[data-qa],[data-qinv],[data-pst],[data-lend],[data-lans],[data-bcan],[data-mpro]');if(!b)return;const d=b.dataset,c=b.closest('.pc'),f=k=>c?.querySelector(`[data-f="${k}"]`);
  try{
   if('pnew' in d){const n=$('#pnn').value.trim();if(!n||!$('#pnk').value)return toast('Nom obligatoire');b.disabled=true;const fl=$('#pnp').files[0];const ph=fl?await up(`pros/${user.id}/${Date.now()}-${safe(fl.name)}`,fl):null;
    const r=await SB.from('pro_profiles').insert({user_id:user.id,kind:$('#pnk').value,name:n,city:$('#pnc').value.trim()||null,bio:$('#pnb').value.trim()||null,photo_url:ph});if(r.error)throw r.error;go('Profil envoyé pour validation')}
   else if(d.psave){const fl=f('ph').files[0];const ph=fl?await up(`pros/${user.id}/${Date.now()}-${safe(fl.name)}`,fl):null;await rpc('update_my_pro',{p_id:d.psave,p_bio:f('bio').value,p_city:f('city').value.trim()||null,p_equipment:f('eq').value,p_photo:ph});go('Profil enregistré')}
   else if(d.sadd){const t=f('st').value.trim();if(t.length<2)return toast('Indique le nom du service');const pr=f('sp').value;const r=await SB.from('pro_services').insert({pro_id:d.sadd,title:t,price_fcfa:pr===''?null:+pr});if(r.error)throw r.error;go('Service ajouté')}
   else if(d.sdel){const r=await SB.from('pro_services').delete().eq('id',d.sdel);if(r.error)throw r.error;go()}
   else if(d.bans){const [id,a]=d.bans.split('|');await rpc('answer_booking',{p_id:id,p_accept:a==='1'});go()}
   else if(d.qa){const q=f('qa').value.trim();if(q.length<2)return toast('Tape au moins 2 lettres');const {data}=await SB.from('artists').select('id,name').eq('status','approved').not('user_id','is',null).ilike('name','%'+q.replace(/[%,()]/g,' ')+'%').limit(6);
    c.querySelector('.qres').innerHTML=(data||[]).map(a=>`<div class="row"><div class="tx"><b>${E(a.name)}</b></div><button class="ic" data-qinv="${d.qa}|${a.id}">Inviter</button></div>`).join('')||'<p class="m">Aucun artiste trouvé.</p>'}
   else if(d.qinv){const [p,a]=d.qinv.split('|');await rpc('invite_artist',{p_pro:p,p_artist:a});go('Invitation envoyée')}
   else if(d.pst){const s=await rpc('pro_artist_stats',{p_artist:d.pst});$('#st-'+d.pst).innerHTML=`<div class="tl"><div class="tile" style="cursor:default"><b>${s.listens_7d}</b><span>écoutes · 7 jours</span></div><div class="tile" style="cursor:default"><b>${s.listens_30d}</b><span>écoutes · 30 jours</span></div><div class="tile" style="cursor:default"><b>${s.followers}</b><span>abonnés</span></div><div class="tile" style="cursor:default"><b>${F(Number(s.sales_fcfa)+Number(s.gifts_fcfa))}</b><span>ventes et cadeaux (part de l’artiste)</span></div></div>`}
   else if(d.lend){if(!confirm('Mettre fin à cet accompagnement ?'))return;await rpc('end_link',{p_link:d.lend});go()}
   else if(d.lans){const [id,a]=d.lans.split('|');await rpc('answer_link',{p_link:id,p_accept:a==='1'});go()}
   else if(d.bcan){await rpc('cancel_booking',{p_id:d.bcan});go()}
   else if(d.mpro){const [id,a]=d.mpro.split('|');const n=a==='1'?null:prompt('Raison du refus :');if(a!=='1'&&n===null)return;await rpc('review_pro',{p_id:id,p_approve:a==='1',p_note:n});go()}
  }catch(x){toast(x.message);b.disabled=false}};
};

/* ---------- Messagerie ---------- */
views.inbox=async v=>{
 if(!user){v.innerHTML='<h2>Messages</h2>'+needLogin('Connecte-toi pour voir tes messages.');return}
 const {data,error}=await SB.from('direct_messages').select('*,beats(title)').or(`to_user.eq.${user.id},from_user.eq.${user.id}`).order('created_at',{ascending:false}).limit(60);if(error)throw error;
 const ids=[...new Set((data||[]).map(m=>m.from_user===user.id?m.to_user:m.from_user))],nm={};
 if(ids.length){try{((await SB.from('profiles').select('id,display_name').in('id',ids)).data||[]).forEach(p=>nm[p.id]=p.display_name)}catch(e){}}
 v.innerHTML=`<h2>✉️ Messages</h2>`+((data||[]).map(m=>{const mine=m.from_user===user.id,o=mine?m.to_user:m.from_user;return `<div class="tile" style="margin:8px 0;cursor:default"><b>${mine?'Vers ':'De '}${E(nm[o]||'un utilisateur')}${m.beats?.title?' · '+E(m.beats.title):''}${!mine&&!m.read?' · nouveau':''}</b><span style="white-space:normal;color:#ddd">${E(m.body)}</span><span>${D(m.created_at)}</span>${mine?'':`<button class="btn s" style="margin-top:8px" data-ireply="${m.from_user}">Répondre</button>`}</div>`}).join('')||'<p class="m">Aucun message pour l’instant. Contacte un beatmaker ou un professionnel depuis son profil.</p>');
 SB.rpc('mark_messages_read').then(()=>{});
 v.onclick=async e=>{const b=e.target.closest('[data-ireply]');if(!b)return;const t=prompt('Ta réponse :');if(!t)return;try{await rpc('send_dm',{p_to:b.dataset.ireply,p_body:t});go('Message envoyé')}catch(x){toast(x.message)}}};

/* ---------- Actions communes ---------- */
document.addEventListener('click',async e=>{const t=e.target;let b;
 if(b=t.closest('[data-pk]')){PK=b.dataset.pk;tab='pros';return render()}
 if(b=t.closest('[data-pro]')){PRO=b.dataset.pro;tab='pro';return render()}
 if(b=t.closest('[data-rbook]')){if(!user)return toast('Connecte-toi pour envoyer une demande');try{await rpc('request_booking',{p_pro:b.dataset.rbook,p_service:$('#psv').value||null,p_date:$('#pdt').value||null,p_msg:$('#pmg').value});toast('Demande envoyée');$('#pmg').value=''}catch(x){toast(x.message)}return}
 if(b=t.closest('[data-rdm]')){if(!user)return toast('Connecte-toi pour écrire');const m=prompt('Ton message :');if(!m)return;try{await rpc('send_dm',{p_to:b.dataset.rdm,p_body:m});toast('Message envoyé')}catch(x){toast(x.message)}}
});
})();
