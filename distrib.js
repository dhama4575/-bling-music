/* BLING MONEY MUSIC v3 : distribution musicale (préparation et vérification des dossiers de sortie) */
(()=>{
const E=esc;
const rpc=async(f,a)=>{const {data,error}=await SB.rpc(f,a);if(error)throw error;return data};
const go=m=>{if(m)toast(m);render()};
const one=x=>Array.isArray(x)?x[0]:x;
const GEN=['Afrobeat','Amapiano','Hip-hop / Rap','R&B / Soul','Gospel','Rumba','Coupé-décalé','Zouk','Reggae / Dancehall','Pop','Électronique','Musique traditionnelle','Autre'];
const LNG=[['fr','Français'],['en','Anglais'],['es','Espagnol'],['pt','Portugais'],['ar','Arabe'],['sw','Swahili'],['ln','Lingala'],['zxx','Instrumental (sans paroles)'],['xx','Autre langue']];
const VER=['Original','Remix','Instrumental','Acoustique','Radio edit','Live'];
const ST={draft:'Brouillon',submitted:'En vérification par l’équipe BLING',validated:'Validé par BLING, en attente de transmission',sent:'Transmis au distributeur',rejected:'À corriger'};
const opt=(a,v)=>a.map(x=>{const [k,n]=Array.isArray(x)?x:[x,x];return `<option value="${E(k)}" ${k===v?'selected':''}>${E(n)}</option>`}).join('');
const im=u=>u?`<img src="${E(u)}" loading="lazy" alt="" onerror="this.remove()">`:'';
const NOTE='<p class="m" style="font-size:12px">BLING MONEY MUSIC prépare et vérifie ton dossier. La diffusion sur Spotify, Apple Music et les autres plateformes passe par un distributeur partenaire : aucun accord n’est actif à ce jour, donc rien n’est envoyé automatiquement. Les codes ISRC et UPC ne sont pas générés par BLING : ils te sont attribués par un organisme officiel ou par ton distributeur.</p>';
const dims=f=>new Promise(ok=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{URL.revokeObjectURL(u);ok([i.naturalWidth,i.naturalHeight])};i.onerror=()=>ok([0,0]);i.src=u});
const up=async(p,f)=>{const u=await SB.storage.from('covers').upload(p,f);if(u.error)throw u.error;return SB.storage.from('covers').getPublicUrl(u.data.path).data.publicUrl};
let DR=null;

/* ---------- Mes sorties ---------- */
views.distrib=async v=>{
 if(!user){v.innerHTML='<h2>Distribution</h2>'+needLogin('Connecte-toi avec ton compte artiste.');return}
 const art=(await SB.from('artists').select('id,name').eq('user_id',user.id).maybeSingle()).data;
 if(!art){v.innerHTML='<h2>💿 Distribution</h2><p class="m">Réservé aux artistes validés. Fais ta demande dans « Studio artiste ».</p>';return}
 const {data,error}=await SB.from('releases').select('id,title,type,cover_url,distributions(status,planned_date)').eq('artist_id',art.id).order('created_at',{ascending:false});if(error)throw error;
 v.innerHTML=`<h2>💿 Distribution musicale</h2><p class="sub">Prépare tes sorties : métadonnées, pochette, date, crédits, droits, ISRC et UPC. L’équipe BLING vérifie ensuite ton dossier.</p>${NOTE}`+
 ((data||[]).map(r=>{const d=one(r.distributions);return `<div class="row" data-dr="${r.id}" style="cursor:pointer"><div class="cv">${im(r.cover_url)}</div><div class="tx"><b>${E(r.title)}</b><span>${r.type==='album'?'Album':'Single'} · ${ST[d?.status||'draft']}${d?.planned_date?' · sortie prévue le '+d.planned_date:''}</span></div><span class="du">›</span></div>`}).join('')||'<p class="m">Aucune sortie. Pour préparer un dossier, publie d’abord tes titres dans « Studio artiste » : ils forment ta sortie.</p>')};

/* ---------- Dossier d'une sortie ---------- */
views.distedit=async v=>{
 if(!DR){tab='distrib';return render()}
 const [rel,ds,tr,ck]=await Promise.all([SB.from('releases').select('*').eq('id',DR).single(),SB.from('distributions').select('*').eq('release_id',DR).maybeSingle(),
  SB.from('tracks').select('id,title,status,duration_seconds,track_distribution(*)').eq('release_id',DR).order('created_at'),SB.rpc('distribution_check',{p_release:DR})]);
 if(rel.error)throw rel.error;if(ck.error)throw ck.error;
 const r=rel.data,d=ds.data||{},c=ck.data,st=d.status||'draft',locked=['submitted','validated','sent'].includes(st),y=new Date().getFullYear();
 const list=`<h2>Liste de contrôle</h2>${(c.items||[]).map(i=>`<p class="m" style="padding:3px 0;color:${i.ok?'#4ade80':'#f87171'}">${i.ok?'✔':'✖'} ${E(i.label)}</p>`).join('')}`;
 let h=`<button class="ic" data-go="distrib">‹ Mes sorties</button><h2>${E(r.title)}</h2><p class="m">${ST[st]}${d.distributor?' · '+E(d.distributor):''}</p>${d.reviewer_note?`<div class="tile" style="cursor:default;margin:8px 0"><b>Message de l’équipe BLING</b><span style="white-space:normal">${E(d.reviewer_note)}</span></div>`:''}${NOTE}`;
 if(locked)return v.innerHTML=h+`<p class="m">Dossier verrouillé pendant la vérification. Il redeviendra modifiable s’il est refusé.</p><div class="tile" style="cursor:default"><span style="white-space:normal">UPC ${E(d.upc||'—')} · ${E(d.label_name||'')} · sortie prévue le ${E(d.planned_date||'—')}</span></div>`+list;
 h+=`<h2>La sortie</h2><div class="pc"><input data-f="upc" inputmode="numeric" placeholder="UPC / EAN (12 ou 13 chiffres)" value="${E(d.upc)}"><input data-f="label_name" placeholder="Nom du label ou de l’éditeur" value="${E(d.label_name)}"><input data-f="p_line" placeholder="℗ ${y} Nom du titulaire de l’enregistrement" value="${E(d.p_line)}"><input data-f="c_line" placeholder="© ${y} Nom du titulaire de l’œuvre" value="${E(d.c_line)}">
 <select data-f="genre"><option value="">Genre principal</option>${opt(GEN,d.genre)}</select><select data-f="genre2"><option value="">Genre secondaire (facultatif)</option>${opt(GEN,d.genre2)}</select><select data-f="language"><option value="">Langue principale</option>${opt(LNG,d.language)}</select>
 <p class="m">Date de sortie souhaitée (14 jours minimum à l’avance)</p><input data-f="planned_date" type="date" min="${new Date(Date.now()+14*864e5).toISOString().slice(0,10)}" value="${E(d.planned_date)}"><input data-f="territories" placeholder="Territoires" value="${E(d.territories||'Monde entier')}">
 <label class="m"><input data-f="explicit" type="checkbox" style="width:auto" ${d.explicit?'checked':''}> Contenu explicite</label>
 <p class="m">Pochette de distribution : carrée, 3000 x 3000 pixels minimum${d.distribution_cover_url?' (une pochette est déjà enregistrée)':''}</p>${d.distribution_cover_url?`<img src="${E(d.distribution_cover_url)}" alt="" style="width:120px;border-radius:12px">`:''}<input data-f="cover" type="file" accept="image/jpeg,image/png"><textarea data-f="notes" rows="2" placeholder="Notes pour l’équipe (facultatif)">${E(d.notes)}</textarea></div>
 <h2>Les titres</h2>${(tr.data||[]).map((t,i)=>{const x=one(t.track_distribution)||{};return `<div class="tile tk" data-tid="${t.id}" style="margin:8px 0;cursor:default"><b>${E(t.title)}</b><span>${t.status==='approved'?'Publié sur BLING':'Non publié : '+E(t.status)}</span>
  <input data-t="isrc" placeholder="ISRC (ex : GAXXX2600001)" value="${E(x.isrc)}" style="text-transform:uppercase"><input data-t="num" type="number" min="1" placeholder="Numéro de piste" value="${x.track_number||i+1}"><select data-t="lng"><option value="">Langue du titre</option>${opt(LNG,x.language)}</select><select data-t="ver">${opt(VER,x.version||'Original')}</select><label class="m"><input data-t="exp" type="checkbox" style="width:auto" ${x.explicit?'checked':''}> Explicite</label></div>`}).join('')||'<p class="m">Aucun titre dans cette sortie.</p>'}
 <p class="m" style="font-size:12px">Les crédits (auteurs, compositeurs, producteurs) se renseignent à la publication du titre dans « Studio artiste ». Il faut au moins un compositeur par titre.</p>
 <button class="btn s" data-dsave>Enregistrer le brouillon</button>${list}<button class="btn" data-dsub ${c.ready?'':'style="opacity:.55"'}>Soumettre à l’équipe BLING</button><p class="m" id="dmsg"></p>`;
 v.innerHTML=h;
 v.onclick=async e=>{const b=e.target.closest('[data-dsave],[data-dsub]');if(!b)return;const m=$('#dmsg');
  try{b.disabled=true;const f=k=>v.querySelector(`[data-f="${k}"]`),p={};
   ['upc','label_name','p_line','c_line','genre','genre2','language','planned_date','territories','notes'].forEach(k=>p[k]=f(k).value);p.explicit=f('explicit').checked;
   const fl=f('cover').files[0];if(fl){const [w,hh]=await dims(fl);if(w!==hh||w<3000)throw new Error('La pochette doit être carrée, 3000 x 3000 pixels minimum (la tienne : '+w+' x '+hh+')');p.distribution_cover_url=await up(`artists/${user.id}/dist-${Date.now()}-${safe(fl.name)}`,fl)}
   await rpc('save_distribution',{p_release:DR,p});
   for(const t of v.querySelectorAll('.tk')){const g=k=>t.querySelector(`[data-t="${k}"]`);await rpc('save_track_distribution',{p_track:t.dataset.tid,p_isrc:g('isrc').value,p_explicit:g('exp').checked,p_language:g('lng').value,p_version:g('ver').value,p_number:+g('num').value||null})}
   if('dsub' in b.dataset){if(!confirm('Soumettre ce dossier à l’équipe BLING ? Il sera verrouillé pendant la vérification.')){b.disabled=false;return}await rpc('submit_distribution',{p_release:DR});go('Dossier soumis à l’équipe BLING')}
   else go('Brouillon enregistré')}catch(x){if(m)m.textContent='Erreur : '+x.message;toast(x.message);b.disabled=false}}};

/* ---------- Équipe BLING : vérification et export ---------- */
const csv=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
const dl=(n,mime,t)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:mime}));a.download=n;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)};
function exportPkg(p){const d=p.distribution||{},rl=p.release||{},cols=['UPC','Sortie','Type','Artiste','Label','P_line','C_line','Genre','Genre2','Langue','Date_sortie','Territoires','Piste','Titre','Version','ISRC','Explicite','Duree_s','Producteur','Compositeurs','Auteurs'];
 const rows=(p.tracks||[]).map(t=>{const cr=r=>(t.credits||[]).filter(c=>c.role===r).map(c=>c.name+(c.share_pct!=null?' ('+c.share_pct+'%)':'')).join(' ; ');return [d.upc,rl.title,rl.type,p.artist,d.label_name,d.p_line,d.c_line,d.genre,d.genre2,d.language,d.planned_date,d.territories,t.number,t.title,t.version,t.isrc,t.explicit?'oui':'non',t.duration_seconds,t.producer,cr('composer'),cr('author')]});
 const base=safe((rl.title||'sortie')).replace(/\s+/g,'_');dl(base+'.csv','text/csv;charset=utf-8','\ufeff'+[cols,...rows].map(r=>r.map(csv).join(';')).join('\n'));setTimeout(()=>dl(base+'.json','application/json',JSON.stringify(p,null,2)),600)}

views.distadmin=async v=>{
 if(!isMod()){v.innerHTML='<p class="m">Accès réservé à l’équipe BLING.</p>';return}
 const {data,error}=await SB.from('distributions').select('release_id,status,planned_date,submitted_at,distributor,releases(title,type,cover_url),artists(name)').in('status',['submitted','validated','sent','rejected']).order('submitted_at',{ascending:false}).limit(60);if(error)throw error;
 const g=s=>(data||[]).filter(x=>x.status===s),sec=(t,s)=>`<h2>${t} (${g(s).length})</h2>`+(g(s).map(x=>`<div class="row" data-dview="${x.release_id}" style="cursor:pointer"><div class="cv">${im(one(x.releases)?.cover_url)}</div><div class="tx"><b>${E(one(x.releases)?.title)}</b><span>${E(one(x.artists)?.name)} · sortie prévue le ${x.planned_date||'—'}${x.distributor?' · '+E(x.distributor):''}</span></div><span class="du">›</span></div>`).join('')||'<p class="m">Aucun dossier.</p>');
 v.innerHTML=`<h2>📦 Dossiers de distribution</h2>${NOTE}${sec('À vérifier','submitted')}${sec('Validés, à transmettre au distributeur','validated')}${sec('Transmis','sent')}${sec('Refusés, à corriger par l’artiste','rejected')}`};

async function view(id){try{const [p,c]=await Promise.all([rpc('distribution_package',{p_release:id}),rpc('distribution_check',{p_release:id})]);const d=p.distribution||{};
 openReader(`<h2 style="margin-top:6px">${E(p.release?.title)}</h2><p class="m">${E(p.artist)} · ${ST[d.status]||''}</p><div class="tile" style="cursor:default"><span style="white-space:normal">UPC ${E(d.upc||'—')} · ${E(d.label_name||'')} · ${E(d.p_line||'')} · ${E(d.c_line||'')}<br>${E(d.genre||'')} · langue ${E(d.language||'—')} · sortie prévue le ${E(d.planned_date||'—')} · ${E(d.territories||'')}</span></div>
 ${d.distribution_cover_url?`<img src="${E(d.distribution_cover_url)}" alt="" style="width:160px;border-radius:12px;margin:10px 0">`:''}<h2>Titres</h2>${(p.tracks||[]).map(t=>`<p class="m" style="padding:3px 0;color:#ddd">${t.number||'·'} · ${E(t.title)} · ISRC ${E(t.isrc||'—')} · ${E(t.version||'')}</p>`).join('')}
 <h2>Liste de contrôle</h2>${(c.items||[]).map(i=>`<p class="m" style="padding:3px 0;color:${i.ok?'#4ade80':'#f87171'}">${i.ok?'✔':'✖'} ${E(i.label)}</p>`).join('')}
 <div class="seg" style="margin-top:12px">${d.status==='submitted'?`<button data-drev="${id}|validated">Valider</button>`:''}${['submitted','validated'].includes(d.status)?`<button data-drev="${id}|rejected">Refuser</button>`:''}${d.status==='validated'?`<button data-drev="${id}|sent">Marquer transmis</button>`:''}</div><button class="btn s" data-dexp="${id}">⇩ Exporter le dossier (CSV et JSON)</button>`)}catch(x){toast(x.message)}}

document.addEventListener('click',async e=>{const t=e.target;let b;
 if(b=t.closest('[data-dr]')){DR=b.dataset.dr;tab='distedit';return render()}
 if(b=t.closest('[data-dview]'))return view(b.dataset.dview);
 if(b=t.closest('[data-dexp]')){try{exportPkg(await rpc('distribution_package',{p_release:b.dataset.dexp}))}catch(x){toast(x.message)}return}
 if(b=t.closest('[data-drev]')){const [id,k]=b.dataset.drev.split('|');let note=null,dist=null;
  if(k==='rejected'){note=prompt('Raison du refus (visible par l’artiste) :');if(!note)return}
  if(k==='sent'){dist=prompt('À quel distributeur le dossier a-t-il été transmis ?');if(!dist)return}
  try{await rpc('review_distribution',{p_release:id,p_decision:k,p_note:note,p_distributor:dist});$('#rd').hidden=true;go('Dossier mis à jour')}catch(x){toast(x.message)}}
});
})();
