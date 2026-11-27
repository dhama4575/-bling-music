/* BLING MONEY MUSIC V2 - Partie 2 : wallet, cadeaux, ventes, concerts, retraits, cinéma */
(()=>{
const E=esc;
/* URL de la fonction serveur de paiement. Reste vide tant que Airtel Money / Moov Money / carte ne sont pas configurés. */
const PAY_URL='';
const F=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
const D=d=>new Date(d).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'});
const KL={deposit:'Dépôt',music_sale:'Achat de musique',music_sale_commission:'dont commission BLING',gift:'Cadeau',gift_commission:'dont commission BLING',ticket:'Billet de concert',ticket_commission:'dont commission BLING',withdrawal:'Retrait',withdrawal_refund:'Retrait remboursé'};
const WS={requested:'En attente',paid:'Payé',rejected:'Refusé (remboursé)'};
const MT={airtel_money:'Airtel Money',moov_money:'Moov Money',bank:'Virement bancaire',card:'Carte bancaire'};
const CS={pending:'En attente de validation',approved:'Validé',ended:'Terminé',rejected:'Refusé'};
const isAdm=()=>profile?.role==='admin';
const rpc=async(fn,a)=>{const {data,error}=await SB.rpc(fn,a);if(error)throw error;return data};
const go=(m)=>{toast(m||'✓ Fait');render()};

/* ---------- Portefeuille ---------- */
views.wallet=async v=>{
 if(!user){v.innerHTML='<h2>Portefeuille</h2>'+needLogin('Connecte-toi pour utiliser BLING WALLET.');return}
 const w=(await SB.from('wallets').select('id,balance_fcfa').eq('user_id',user.id).maybeSingle()).data;
 const [lg,wd,pu,ar]=await Promise.all([w?SB.from('ledger_entries').select('direction,amount_fcfa,kind,created_at').eq('wallet_id',w.id).order('created_at',{ascending:false}).limit(30):{data:[]},
  SB.from('withdrawals').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10),
  SB.from('track_purchases').select('id,price_fcfa,tracks(title,audio_path,artists(name))').eq('user_id',user.id).order('created_at',{ascending:false}),
  SB.from('artists').select('id').eq('user_id',user.id).maybeSingle()]);
 const mine=ar.data?(await SB.from('tracks').select('id,title,price_fcfa').eq('artist_id',ar.data.id).eq('status','approved')).data||[]:[];
 v.innerHTML=`<h2>BLING WALLET</h2><div class="tile"><b style="font-size:26px">${F(w?.balance_fcfa)}</b><span>Solde disponible</span></div>
 <h2>Ajouter de l’argent</h2>`+(PAY_URL?`<select id="dp"><option value="airtel_money">Airtel Money</option><option value="moov_money">Moov Money</option><option value="card">Carte bancaire</option></select><input id="da" type="number" min="100" placeholder="Montant en FCFA"><button class="btn" data-wdep>Déposer</button>`:'<p class="m">Les dépôts (Airtel Money, Moov Money, carte) ne sont pas encore activés : le prestataire de paiement doit d’abord être configuré. Ton solde sera crédité uniquement après confirmation du prestataire.</p>')+
 `<h2>Demander un retrait</h2><input id="wa" type="number" min="1" placeholder="Montant en FCFA"><select id="wm"><option value="airtel_money">Airtel Money</option><option value="moov_money">Moov Money</option><option value="bank">Virement bancaire</option></select><input id="wd" placeholder="Numéro ou compte de réception"><button class="btn" data-wreq>Demander le retrait</button><p class="m" style="font-size:12px">Le montant est bloqué dès la demande, puis versé après vérification par l’administration.</p>
 ${(wd.data||[]).map(x=>`<div class="row"><div class="tx"><b>${F(x.amount_fcfa)} · ${MT[x.method]}</b><span>${WS[x.status]} · ${D(x.created_at)}</span></div></div>`).join('')}
 ${mine.length?`<h2>Vendre mes titres</h2><p class="m" style="font-size:12px">Tu reçois 70 %, BLING MONEY MUSIC garde 30 %. Prix minimum 100 FCFA.</p>${mine.map(t=>`<div class="row"><div class="tx"><b>${E(t.title)}</b><span>${t.price_fcfa?F(t.price_fcfa):'Non vendu'}</span></div><input type="number" min="100" placeholder="Prix" style="width:90px" data-pin="${t.id}"><button class="ic" data-wprice="${t.id}">OK</button>${t.price_fcfa?`<button class="ic" data-wprice="${t.id}|x">✕</button>`:''}</div>`).join('')}`:''}
 ${(pu.data||[]).length?`<h2>Mes achats</h2>${pu.data.map(p=>`<div class="row"><div class="tx"><b>${E(p.tracks?.title)}</b><span>${E(p.tracks?.artists?.name)} · ${F(p.price_fcfa)}</span></div><button class="ic" data-wget="${E(p.tracks?.audio_path)}">⇩</button></div>`).join('')}`:''}
 <h2>Historique des transactions</h2>${(lg.data||[]).map(x=>`<div class="row"><div class="tx"><b>${KL[x.kind]||E(x.kind)}</b><span>${D(x.created_at)}</span></div><span class="du" style="color:${x.direction==='credit'?'#4ade80':'#f87171'}">${x.direction==='credit'?'+':'−'}${F(x.amount_fcfa)}</span></div>`).join('')||'<p class="m">Aucune transaction.</p>'}`;
 v.onclick=async e=>{const b=e.target.closest('[data-wdep],[data-wreq],[data-wprice],[data-wget]');if(!b)return;const d=b.dataset;
  try{if('wdep' in d){const a=+$('#da').value;if(!(a>=100))return toast('Montant minimum : 100 FCFA');
    const r=await fetch(PAY_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(await SB.auth.getSession()).data.session.access_token},body:JSON.stringify({provider:$('#dp').value,amount:a})});
    const j=await r.json();if(!r.ok)throw new Error(j.error||'Paiement impossible');if(j.redirect_url)location.href=j.redirect_url;else toast(j.message||'Paiement en attente de confirmation')}
   else if('wreq' in d){const a=+$('#wa').value;if(!(a>0)||!$('#wd').value.trim())return toast('Montant et destination obligatoires');await rpc('request_withdrawal',{p_amount:a,p_method:$('#wm').value,p_destination:$('#wd').value.trim()});go('Demande envoyée')}
   else if(d.wprice){const [id,x]=d.wprice.split('|');const p=x?null:+v.querySelector(`[data-pin="${id}"]`).value;if(!x&&!(p>=100))return toast('Prix minimum : 100 FCFA');await rpc('set_track_price',{p_track:id,p_price:p});go('Prix enregistré')}
   else if(d.wget){const {data,error}=await SB.storage.from('audio').createSignedUrl(d.wget,300);if(error)throw error;window.open(data.signedUrl,'_blank')}
  }catch(x){toast(x.message)}};
};

/* ---------- Concerts et billets ---------- */
views.concerts=async v=>{
 const [cs,tk,st]=await Promise.all([SB.from('concerts').select('*').in('status',['approved','ended']).order('starts_at'),
  user?SB.from('tickets').select('concert_id,code').eq('user_id',user.id):{data:[]},
  user?SB.from('concert_streams').select('concert_id,url'):{data:[]}]);
 const mt={};(tk.data||[]).forEach(t=>mt[t.concert_id]=t.code);const su={};(st.data||[]).forEach(s=>su[s.concert_id]=s.url);
 const own=user?(await SB.from('concerts').select('id,title,status,starts_at').eq('organizer_id',user.id).order('created_at',{ascending:false})).data||[]:[];
 const pend=isMod()?(await SB.from('concerts').select('*').eq('status','pending').order('created_at')).data||[]:[];
 const canOrg=user&&(isAdm()||(await SB.from('artists').select('id').eq('user_id',user.id).eq('status','approved').maybeSingle()).data);
 v.innerHTML=`<h2>Concerts · BLING LIVE</h2>`+((cs.data||[]).map(c=>`<div class="tile" style="margin:8px 0"><b>${E(c.title)}</b><span style="white-space:normal">${D(c.starts_at)} · ${c.mode==='live'?'En direct':E(c.venue||'Sur place')} · ${c.price_fcfa?F(c.price_fcfa):'Gratuit'}${c.capacity?' · '+c.capacity+' places':''}</span>${c.description?`<span style="white-space:normal">${E(c.description)}</span>`:''}
  ${mt[c.id]?`<p class="m">🎟 Ton billet : <b>${mt[c.id]}</b></p>${su[c.id]?`<button class="btn" data-ostream="${E(su[c.id])}">▶ Rejoindre le direct</button>`:''}`:(c.status==='approved'?`<button class="btn" data-tbuy="${c.id}|${c.price_fcfa}">${c.price_fcfa?'Acheter le billet':'Réserver gratuitement'}</button>`:'')}</div>`).join('')||'<p class="m">Aucun concert annoncé pour l’instant.</p>')+
 (pend.length?`<h2>Concerts à valider</h2>${pend.map(c=>`<div class="tile" style="margin:8px 0"><b>${E(c.title)}</b><span>${D(c.starts_at)} · ${F(c.price_fcfa)}</span><div class="seg"><button data-capp="${c.id}|approved">Valider</button><button data-capp="${c.id}|rejected">Refuser</button></div></div>`).join('')}`:'')+
 (own.length?`<h2>Mes concerts</h2>${own.map(c=>`<div class="row"><div class="tx"><b>${E(c.title)}</b><span>${CS[c.status]} · ${D(c.starts_at)}</span></div></div>`).join('')}`:'')+
 (canOrg?`<h2>Organiser un concert</h2><p class="m" style="font-size:12px">Tu fixes le prix. Tu reçois 80 %, BLING MONEY MUSIC garde 20 %. Le concert est visible après validation.</p><input id="ct1" placeholder="Titre"><textarea id="ct2" rows="3" placeholder="Description"></textarea><select id="ct3"><option value="live">En direct (BLING LIVE)</option><option value="physique">Sur place</option></select><input id="ct4" placeholder="Lieu (si sur place)"><input id="ct5" type="datetime-local"><input id="ct6" type="number" min="0" placeholder="Prix du billet en FCFA (0 = gratuit)"><input id="ct7" type="number" min="1" placeholder="Nombre de places (facultatif)"><input id="ct8" placeholder="Lien de diffusion (réservé aux détenteurs de billet)"><button class="btn" data-cnew>Envoyer pour validation</button><p class="m" style="font-size:12px">La diffusion vidéo en direct nécessite un service de streaming externe : ici tu fournis son lien.</p>`:'');
 v.onclick=async e=>{const b=e.target.closest('[data-tbuy],[data-capp],[data-cnew],[data-ostream]');if(!b)return;const d=b.dataset;
  try{if(d.ostream)return window.open(d.ostream,'_blank');
   if(d.tbuy){if(!user)return toast('Connecte-toi pour acheter un billet');const [id,p]=d.tbuy.split('|');if(+p&&!confirm('Payer '+F(p)+' avec ton portefeuille ?'))return;const code=await rpc('buy_ticket',{p_concert:id});go('Billet : '+code)}
   else if(d.capp){const [id,s]=d.capp.split('|');const r=await SB.from('concerts').update({status:s}).eq('id',id);if(r.error)throw r.error;go()}
   else if('cnew' in d){const t=$('#ct1').value.trim(),dt=$('#ct5').value;if(!t||!dt)return toast('Titre et date obligatoires');
    const r=await SB.from('concerts').insert({organizer_id:user.id,title:t,description:$('#ct2').value.trim()||null,mode:$('#ct3').value,venue:$('#ct4').value.trim()||null,starts_at:new Date(dt).toISOString(),price_fcfa:+$('#ct6').value||0,capacity:+$('#ct7').value||null}).select('id').single();if(r.error)throw r.error;
    const u=$('#ct8').value.trim();if(u){const s=await SB.from('concert_streams').insert({concert_id:r.data.id,url:u});if(s.error)throw s.error}go('Concert envoyé pour validation')}
  }catch(x){toast(x.message)}};
};

/* ---------- Cinéma exclusif et gestion ---------- */
views.cine=async v=>{
 const {data}=await SB.from('cinema_titles').select('*').eq('status','approved').order('created_at',{ascending:false});
 v.innerHTML='<h2>Bling Cinéma · exclusivités</h2>'+((data||[]).map(c=>`<div class="tile" style="margin:8px 0"><b>${E(c.title)}</b><span style="white-space:normal">${{film:'Film',serie:'Série',documentaire:'Documentaire'}[c.kind]}${c.year?' · '+c.year:''} · Droits : ${E(c.rights_holder)} (${E(c.license_type)})</span>${c.synopsis?`<span style="white-space:normal">${E(c.synopsis)}</span>`:''}<button class="btn" data-cplay="${E(c.external_url||'')}">▶ Regarder</button></div>`).join('')||'<p class="m">Aucun titre pour l’instant. Les films gratuits du catalogue Internet restent disponibles dans Explorer.</p>');
 v.onclick=e=>{const b=e.target.closest('[data-cplay]');if(b&&b.dataset.cplay)window.open(b.dataset.cplay,'_blank')};
};
views.cinadmin=async v=>{
 if(!isMod()){v.innerHTML='<p class="m">Accès réservé.</p>';return}
 const {data}=await SB.from('cinema_titles').select('id,title,kind,status').order('created_at',{ascending:false}).limit(40);
 v.innerHTML=`<h2>Ajouter un film, une série ou un documentaire</h2><p class="m" style="font-size:12px">Publication possible seulement avec le titulaire des droits, la licence et une preuve d’autorisation.</p><select id="k1"><option value="film">Film</option><option value="serie">Série</option><option value="documentaire">Documentaire</option></select><input id="k2" placeholder="Titre"><input id="k3" type="number" placeholder="Année"><textarea id="k4" rows="3" placeholder="Synopsis"></textarea><input id="k5" placeholder="Lien de l’affiche (image)"><input id="k6" placeholder="Lien de la vidéo (https://…)"><input id="k7" placeholder="Titulaire des droits"><select id="k8"><option>Domaine public</option><option>Creative Commons</option><option>Autorisation du titulaire</option><option>Contrat de diffusion</option></select><input id="k9" placeholder="Lien de la preuve d’autorisation (document, e-mail, contrat)"><input id="k10" placeholder="Territoire (ex : Gabon, monde)"><input id="k11" type="date"><button class="btn" data-kadd>Enregistrer</button>
 <h2>Titres</h2>${(data||[]).map(c=>`<div class="row"><div class="tx"><b>${E(c.title)}</b><span>${E(c.kind)} · ${E(c.status)}</span></div>${c.status!=='approved'?`<button class="ic" data-kst="${c.id}|approved">✓</button>`:''}${c.status!=='rejected'?`<button class="ic" data-kst="${c.id}|rejected">✕</button>`:''}</div>`).join('')}`;
 v.onclick=async e=>{const b=e.target.closest('[data-kadd],[data-kst]');if(!b)return;
  try{if(b.dataset.kst){const [id,s]=b.dataset.kst.split('|');const r=await SB.from('cinema_titles').update({status:s}).eq('id',id);if(r.error)throw r.error;return go()}
   const t=$('#k2').value.trim();if(!t)return toast('Titre obligatoire');
   const r=await SB.from('cinema_titles').insert({kind:$('#k1').value,title:t,year:+$('#k3').value||null,synopsis:$('#k4').value.trim()||null,poster_url:$('#k5').value.trim()||null,external_url:$('#k6').value.trim()||null,rights_holder:$('#k7').value.trim()||null,license_type:$('#k8').value,license_proof_url:$('#k9').value.trim()||null,territory:$('#k10').value.trim()||null,license_until:$('#k11').value||null,created_by:user.id});
   if(r.error)throw r.error;go('Enregistré (en attente de validation)')}catch(x){toast(x.message)}};
};

/* ---------- Finance (administrateur) ---------- */
views.finance=async v=>{
 if(!isAdm()){v.innerHTML='<p class="m">Accès réservé à l’administrateur.</p>';return}
 const [pw,wd]=await Promise.all([SB.from('wallets').select('balance_fcfa').eq('kind','platform').maybeSingle(),SB.from('withdrawals').select('*').eq('status','requested').order('created_at')]);
 v.innerHTML=`<h2>Finances BLING MONEY MUSIC</h2><div class="tile"><b style="font-size:24px">${F(pw.data?.balance_fcfa)}</b><span>Commissions de la plateforme</span></div><h2>Retraits à traiter (${(wd.data||[]).length})</h2><p class="m" style="font-size:12px">Envoie d’abord l’argent via Airtel Money, Moov Money ou la banque, puis marque « Payé ». « Refuser » rembourse le portefeuille.</p>${(wd.data||[]).map(x=>`<div class="tile" style="margin:8px 0"><b>${F(x.amount_fcfa)} · ${MT[x.method]}</b><span style="white-space:normal">${E(x.destination)} · ${D(x.created_at)}</span><div class="seg"><button data-wpay="${x.id}|1">Payé</button><button data-wpay="${x.id}|0">Refuser</button></div></div>`).join('')||'<p class="m">Aucune demande.</p>'}`;
 v.onclick=async e=>{const b=e.target.closest('[data-wpay]');if(!b)return;const [id,p]=b.dataset.wpay.split('|');const note=p==='1'?prompt('Référence du paiement effectué (facultatif) :'):prompt('Raison du refus :');if(note===null)return;
  try{await rpc('review_withdrawal',{p_id:id,p_paid:p==='1',p_note:note||null});go()}catch(x){toast(x.message)}};
};

/* ---------- Achat et cadeaux dans le lecteur ---------- */
async function shop(){const box=$('#shop');if(!box)return;if(!cur||cur.ext||!cur.id){box.innerHTML='';return}
 const id=cur.id;let h='';
 if(cur.pr)h+=`<button class="btn" data-sbuy>Acheter · ${F(cur.pr)}</button>`;
 if(cur.aid)h+=`<button class="btn s" data-sgift>🎁 Offrir un cadeau à l’artiste</button><div id="gl"></div>`;
 box.innerHTML=h;
}
$('#shop').onclick=async e=>{const b=e.target.closest('[data-sbuy],[data-sgift],[data-gid]');if(!b||!cur)return;
 if(!user)return toast('Connecte-toi pour continuer');
 try{if('sbuy' in b.dataset){if(!confirm('Acheter « '+cur.title+' » pour '+F(cur.pr)+' ?'))return;await rpc('buy_track',{p_track:cur.id});toast('Achat réussi : retrouve-le dans Portefeuille')}
  else if('sgift' in b.dataset){const gl=$('#gl');if(gl.innerHTML){gl.innerHTML='';return}const {data}=await SB.from('gift_catalog').select('id,name,price_fcfa').order('price_fcfa');
   gl.innerHTML=(data||[]).map(g=>`<button class="btn s" data-gid="${g.id}|${E(g.name)}|${g.price_fcfa}">${E(g.name)} · ${F(g.price_fcfa)}</button>`).join('')}
  else if(b.dataset.gid){const [g,n,p]=b.dataset.gid.split('|');if(!confirm('Offrir « '+n+' » ('+F(p)+') à '+cur.artist+' ?'))return;await rpc('send_gift',{p_gift:+g,p_artist:cur.aid,p_track:cur.id});toast('🎁 Cadeau envoyé, merci !')}
 }catch(x){toast(x.message)}};
const o=window.setUI;window.setUI=function(){o();shop()};
})();
