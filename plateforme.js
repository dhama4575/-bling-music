/* BLING MONEY MUSIC V2 - Partie 3 : classements, records, awards, promotion, publicité, pilotage */
(()=>{
const E=esc;
const F=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
const N=n=>Number(n||0).toLocaleString('fr-FR');
const isAdm=()=>profile?.role==='admin';
const rpc=async(fn,a)=>{const {data,error}=await SB.rpc(fn,a);if(error)throw error;return data};
const go=m=>{toast(m||'✓ Fait');render()};
const today=()=>new Date().toISOString().slice(0,10);
const RL={bronze:['🥉','Bronze'],silver:['🥈','Silver'],gold:['🥇','Gold'],platinum:['💿','Platinum'],diamond:['💎','Diamond'],legend:['👑','Legend']};
const tile=(a,b)=>`<div class="tile"><b>${a}</b><span>${b}</span></div>`;
const up=async(p,f)=>{const u=await SB.storage.from('covers').upload(p,f);if(u.error)throw u.error;return SB.storage.from('covers').getPublicUrl(u.data.path).data.publicUrl};

/* ---------- Écoutes validées : 30 s réellement écoutées ---------- */
let rid=null,acc=0,lt=0;
au.addEventListener('loadstart',()=>{rid=null;acc=0;lt=0});
au.addEventListener('timeupdate',()=>{const d=au.currentTime-lt;lt=au.currentTime;if(d>0&&d<2&&!au.paused)acc+=d;
 if(!user||!cur||cur.ext||rid===cur.id||acc<30)return;rid=cur.id;SB.rpc('register_listen',{p_track:cur.id,p_seconds:Math.floor(acc)}).then(()=>{})});

/* ---------- Classements et records ---------- */
let chK='tracks',chP=7;
views.charts=async v=>{
 const fn={tracks:'chart_tracks',albums:'chart_albums',artists:'chart_artists'}[chK];
 const [ch,cr]=await Promise.all([SB.rpc(fn,{p_days:chP}),SB.from('certifications').select('level,listens,tracks(title,artists(name))').order('awarded_at',{ascending:false}).limit(15)]);
 const rows=ch.data||[],idx={};
 if(chK==='tracks'&&rows.length){const {data}=await SB.from('tracks').select(QS).in('id',rows.map(r=>r.track_id));const m={};(data||[]).forEach(t=>m[t.id]=norm(t));
  L.ch=[];rows.forEach(r=>{const t=m[r.track_id];if(t){idx[r.track_id]=L.ch.length;L.ch.push(t);T[t.id]=t}})}
 const seg=(a,k,cur)=>a.map(([x,n])=>`<button data-${k}="${x}" class="${String(cur)===String(x)?'on':''}">${n}</button>`).join('');
 v.innerHTML=`<h2>🏆 BLING CHARTS</h2><div class="seg">${seg([['tracks','Chansons'],['albums','Albums'],['artists','Artistes']],'chk',chK)}</div><div class="seg">${seg([[7,'Semaine'],[30,'Mois'],['all','Toujours']],'chp',chP===null?'all':chP)}</div>
 <p class="m" style="font-size:12px">Classement selon les écoutes validées (30 secondes minimum, un compte connecté, protections anti-bots).</p>`+
 (rows.map(r=>`<div class="row" ${idx[r.track_id]!=null?`data-play="ch:${idx[r.track_id]}"`:''}><b style="width:30px;color:var(--g)">${r.pos}</b><div class="cv">${(r.cover_url||r.photo_url)?`<img src="${E(r.cover_url||r.photo_url)}" loading="lazy" alt="" onerror="this.remove()">`:''}</div><div class="tx"><b>${E(r.title||r.name)}</b><span>${E(r.artist||'')}</span></div><span class="du">${N(r.listens)} écoutes</span></div>`).join('')||'<p class="m">Le classement se remplit au fil des écoutes validées. Aucune écoute validée pour l’instant.</p>')+
 `<h2>BLING RECORDS</h2>`+((cr.data||[]).map(c=>`<div class="row"><div class="tx"><b>${RL[c.level][0]} ${RL[c.level][1]} · ${E(c.tracks?.title)}</b><span>${E(c.tracks?.artists?.name)} · ${N(c.listens)} écoutes validées</span></div></div>`).join('')||'<p class="m">Aucun titre certifié pour l’instant.</p>')+
 (isAdm()?'<button class="btn s" data-refcert>Actualiser les certifications</button>':'');
 v.onclick=async e=>{const b=e.target.closest('[data-chk],[data-chp],[data-refcert]');if(!b)return;const d=b.dataset;
  if(d.chk){chK=d.chk;return render()}if(d.chp){chP=d.chp==='all'?null:+d.chp;return render()}
  try{const n=await rpc('refresh_certifications');go(n+' nouvelle(s) certification(s)')}catch(x){toast(x.message)}};
};

/* ---------- Awards ---------- */
views.awards=async v=>{
 const ed=(await SB.from('awards_editions').select('*').order('year',{ascending:false}).limit(1)).data?.[0];
 let h='<h2>🏅 BLING AWARDS</h2>';
 if(!ed)h+='<p class="m">La prochaine cérémonie sera annoncée prochainement.</p>';
 else{
  const cats=(await SB.from('awards_categories').select('*').eq('edition_id',ed.id).order('ord')).data||[];
  const ids=cats.map(c=>c.id);
  const [nm,mv,rs]=await Promise.all([ids.length?SB.from('awards_nominees').select('*,artists(name)').in('category_id',ids):{data:[]},user?SB.from('awards_votes').select('category_id,nominee_id'):{data:[]},
   ed.status==='announced'||isAdm()?SB.rpc('awards_results',{p_edition:ed.id}):{data:[]}]);
  const my={};(mv.data||[]).forEach(x=>my[x.category_id]=x.nominee_id);const vt={};(rs.data||[]).forEach(x=>vt[x.nominee_id]=x);
  const st={draft:'Brouillon',voting:'Votes ouverts',closed:'Votes clos',announced:'Gagnants annoncés'}[ed.status];
  h+=`<p class="m">${E(ed.title)} · ${st}${ed.status==='voting'&&ed.voting_ends?' · jusqu’au '+new Date(ed.voting_ends).toLocaleDateString('fr-FR'):''}</p>`;
  h+=cats.map(c=>`<h2>${E(c.name)}</h2>`+((nm.data||[]).filter(n=>n.category_id===c.id).map(n=>`<div class="row"><div class="tx"><b>${n.winner&&ed.status==='announced'?'🏆 ':''}${E(n.label)}</b><span>${E(n.artists?.name||'')}${n.video_url?` · <a data-adlink="${E(n.video_url)}" style="color:var(--g)">▶ Clip</a>`:''}${vt[n.id]&&(ed.status==='announced'||isAdm())?' · '+vt[n.id].votes+' vote(s)':''}</span></div>${ed.status==='voting'?`<button class="ic ${my[c.id]===n.id?'on':''}" data-vote="${n.id}">${my[c.id]===n.id?'✓':'Voter'}</button>`:''}</div>`).join('')||'<p class="m">Nominés bientôt annoncés.</p>')).join('');
  if(isAdm()){const ar=(await SB.from('artists').select('id,name').eq('status','approved').order('name')).data||[];
   h+=`<h2>Gestion de l’édition</h2><select id="nc">${cats.map(c=>`<option value="${c.id}">${E(c.name)}</option>`).join('')}</select><input id="nl" placeholder="Nom du nominé"><select id="na"><option value="">Artiste lié (facultatif)</option>${ar.map(a=>`<option value="${a.id}">${E(a.name)}</option>`).join('')}</select><input id="nv" placeholder="Lien du clip (facultatif)"><button class="btn s" data-nadd>Ajouter le nominé</button><div class="seg"><button data-est="voting">Ouvrir les votes</button><button data-est="closed">Clôturer</button><button data-est="announce">Annoncer les gagnants</button></div>`}
 }
 if(isAdm())h+=`<h2>Nouvelle édition</h2><input id="ey" type="number" placeholder="Année (ex : ${new Date().getFullYear()})"><button class="btn s" data-enew>Créer l’édition avec ses catégories</button>`;
 v.innerHTML=h;
 v.onclick=async e=>{const b=e.target.closest('[data-vote],[data-nadd],[data-est],[data-enew]');if(!b)return;const d=b.dataset;
  try{if(d.vote){if(!user)return toast('Connecte-toi pour voter');await rpc('cast_vote',{p_nominee:d.vote});go('Vote enregistré')}
   else if('enew' in d){const y=+$('#ey').value;if(!y)return;await rpc('create_awards_edition',{p_year:y});go('Édition créée')}
   else if('nadd' in d){const l=$('#nl').value.trim();if(!l)return;const r=await SB.from('awards_nominees').insert({category_id:$('#nc').value,label:l,artist_id:$('#na').value||null,video_url:$('#nv').value.trim()||null});if(r.error)throw r.error;go('Nominé ajouté')}
   else if(d.est==='announce'){if(!confirm('Annoncer les gagnants maintenant ?'))return;await rpc('announce_winners',{p_edition:ed.id});go('Gagnants annoncés')}
   else if(d.est){let u={status:d.est};if(d.est==='voting'){const e2=prompt('Date de fin des votes (AAAA-MM-JJ) :');if(!e2)return;u.voting_starts=new Date().toISOString();u.voting_ends=new Date(e2+'T23:59:59').toISOString()}
    const r=await SB.from('awards_editions').update(u).eq('id',ed.id);if(r.error)throw r.error;go()}
  }catch(x){toast(x.message)}};
};

/* ---------- Promotion et publicité affichées ---------- */
const adC={};
async function adHtml(code){if(['premium','family'].includes(window.PLAN))return '';const c=adC[code];if(c&&Date.now()-c.t<300000)return c.h;let h='';
 try{const t=today(),{data}=await SB.from('ad_campaigns').select('id,company,title,image_url,link_url,ad_slots!inner(code)').eq('ad_slots.code',code).eq('status','approved').lte('starts_on',t).gte('ends_on',t).limit(1);
  const a=data?.[0];if(a)h=`<div class="tile" ${a.link_url?`data-adlink="${E(a.link_url)}"`:''} style="margin:10px 0;padding:0;overflow:hidden">${a.image_url?`<img src="${E(a.image_url)}" alt="" style="width:100%;display:block" onerror="this.remove()">`:''}<span style="padding:6px 10px;display:block">Publicité · ${E(a.company)} — ${E(a.title)}</span></div>`}catch(e){}
 adC[code]={t:Date.now(),h};return h}
async function promoHtml(){const t=today(),{data}=await SB.from('promos').select('*').lte('starts_on',t).gte('ends_on',t).order('created_at',{ascending:false});if(!(data||[]).length)return '';
 const ids=data.filter(p=>p.track_id).map(p=>p.track_id),m={};
 if(ids.length){const r=await SB.from('tracks').select(QS).in('id',ids);(r.data||[]).forEach(x=>m[x.id]=norm(x))}
 L.promo=[];const KN={poster:'À l’affiche',artist_week:'Artiste de la semaine',release_week:'Sortie de la semaine'};
 return `<h2>BLING PROMO</h2><div class="hs">${data.map(p=>{const tr=m[p.track_id];let at='';if(tr){T[tr.id]=tr;at=`data-play="promo:${L.promo.length}"`;L.promo.push(tr)}else if(p.link_url)at=`data-adlink="${E(p.link_url)}"`;
  return `<div class="card" ${at}><div class="cv">${p.image_url?`<img src="${E(p.image_url)}" loading="lazy" alt="" onerror="this.remove()">`:''}</div><b>${E(p.title)}</b><span>${KN[p.kind]}${p.subtitle?' · '+E(p.subtitle):''}</span></div>`}).join('')}</div>`}
const TILES='<div class="tl"><div class="tile" data-go="charts"><b>🏆 Classements</b><span>Top 50, albums, artistes, records</span></div><div class="tile" data-go="awards"><b>🏅 BLING AWARDS</b><span>Votes et récompenses</span></div></div>';
const oh=views.home;views.home=async v=>{await oh(v);try{const [p,a]=await Promise.all([promoHtml(),adHtml('home_banner')]);const html=TILES+a+p,hero=v.querySelector('#hero');if(hero)hero.insertAdjacentHTML('afterend',html);else v.insertAdjacentHTML('afterbegin',html)}catch(e){}};
const ox=views.explore;views.explore=async v=>{await ox(v);try{v.insertAdjacentHTML('afterbegin',await adHtml('explore_banner'))}catch(e){}};
$('#shop').insertAdjacentHTML('beforebegin','<div id="adp"></div>');
const o3=window.setUI;window.setUI=function(){o3();adHtml('player_banner').then(h=>{const b=$('#adp');if(b)b.innerHTML=h})};
document.addEventListener('click',e=>{const b=e.target.closest('[data-adlink]');if(b&&b.dataset.adlink)window.open(b.dataset.adlink,'_blank','noopener')});

/* ---------- Acheter un espace publicitaire ---------- */
views.ads=async v=>{
 if(!user){v.innerHTML='<h2>Publicité</h2>'+needLogin('Connecte-toi pour acheter un espace publicitaire.');return}
 const [sl,mine,pend]=await Promise.all([SB.from('ad_slots').select('*').eq('active',true).order('price_week_fcfa',{ascending:false}),
  SB.from('ad_campaigns').select('id,company,title,starts_on,ends_on,price_fcfa,status,note').eq('advertiser_id',user.id).order('created_at',{ascending:false}),
  isMod()?SB.from('ad_campaigns').select('*,ad_slots(name)').eq('status','pending').order('created_at'):{data:[]}]);
 const SL={};(sl.data||[]).forEach(s=>SL[s.id]=s);const SS={pending:'En attente de validation',approved:'Validée',rejected:'Refusée (remboursée)'};
 v.innerHTML=`<h2>Publicité sur BLING MONEY MUSIC</h2><p class="m">Présente ton entreprise aux auditeurs. Paiement avec ton portefeuille ; la publicité est validée par l’équipe, et remboursée si elle est refusée.</p>
 <select id="as">${(sl.data||[]).map(s=>`<option value="${s.id}">${E(s.name)} · ${F(s.price_week_fcfa)} / semaine</option>`).join('')}</select><input id="ac" placeholder="Nom de l’entreprise"><input id="at" placeholder="Titre de la publicité"><input id="al" placeholder="Lien (site, WhatsApp…)"><p class="m">Image (bannière)</p><input id="ai" type="file" accept="image/*"><p class="m">Début</p><input id="ad" type="date" min="${today()}" value="${today()}"><select id="aw">${[1,2,4,8,12].map(w=>`<option value="${w}">${w} semaine(s)</option>`).join('')}</select><button class="btn" data-abuy>Réserver et payer</button>
 <h2>Mes campagnes</h2>${(mine.data||[]).map(c=>`<div class="row"><div class="tx"><b>${E(c.company)} · ${E(c.title)}</b><span>${c.starts_on} → ${c.ends_on} · ${F(c.price_fcfa)} · ${SS[c.status]}${c.note?' ('+E(c.note)+')':''}</span></div></div>`).join('')||'<p class="m">Aucune campagne.</p>'}
 ${(pend.data||[]).length?`<h2>Publicités à valider</h2>${pend.data.map(c=>`<div class="tile" style="margin:8px 0">${c.image_url?`<img src="${E(c.image_url)}" alt="" style="width:100%">`:''}<b>${E(c.company)} · ${E(c.title)}</b><span style="white-space:normal">${E(c.ad_slots?.name)} · ${c.starts_on} → ${c.ends_on} · ${F(c.price_fcfa)}</span><div class="seg"><button data-arev="${c.id}|1">Valider</button><button data-arev="${c.id}|0">Refuser</button></div></div>`).join('')}`:''}`;
 v.onclick=async e=>{const b=e.target.closest('[data-abuy],[data-arev]');if(!b)return;
  try{if(b.dataset.arev){const [id,ok]=b.dataset.arev.split('|');const note=ok==='1'?null:prompt('Raison du refus :');if(ok!=='1'&&note===null)return;await rpc('review_ad',{p_id:id,p_approve:ok==='1',p_note:note});return go()}
   const s=SL[$('#as').value],w=+$('#aw').value,c=$('#ac').value.trim(),t=$('#at').value.trim();if(!c||!t)return toast('Entreprise et titre obligatoires');
   if(!confirm('Payer '+F(s.price_week_fcfa*w)+' avec ton portefeuille ?'))return;
   const f=$('#ai').files[0];const img=f?await up(`ads/${user.id}/${Date.now()}-${safe(f.name)}`,f):null;
   await rpc('buy_ad',{p_slot:s.id,p_company:c,p_title:t,p_image:img,p_link:$('#al').value.trim()||null,p_start:$('#ad').value,p_weeks:w});go('Campagne réservée : en attente de validation')}catch(x){toast(x.message)}};
};

/* ---------- Gestion des promotions (modérateurs) ---------- */
views.promoadmin=async v=>{
 if(!isMod()){v.innerHTML='<p class="m">Accès réservé.</p>';return}
 const [ar,pm]=await Promise.all([SB.from('artists').select('id,name').eq('status','approved').order('name'),SB.from('promos').select('*').order('created_at',{ascending:false}).limit(20)]);
 const end=new Date(Date.now()+6*864e5).toISOString().slice(0,10);
 v.innerHTML=`<h2>BLING PROMO</h2><select id="pk"><option value="poster">Affiche de la semaine</option><option value="artist_week">Artiste de la semaine</option><option value="release_week">Sortie musicale de la semaine</option></select><input id="pt" placeholder="Titre"><input id="ps" placeholder="Sous-titre (facultatif)"><select id="pa"><option value="">Artiste lié (facultatif)</option>${(ar.data||[]).map(a=>`<option value="${a.id}">${E(a.name)}</option>`).join('')}</select><input id="pl" placeholder="Lien (facultatif)"><p class="m">Image</p><input id="pi" type="file" accept="image/*"><p class="m">Du</p><input id="p1" type="date" value="${today()}"><p class="m">Au</p><input id="p2" type="date" value="${end}"><button class="btn" data-padd>Publier</button>
 <h2>Promotions</h2>${(pm.data||[]).map(p=>`<div class="row"><div class="tx"><b>${E(p.title)}</b><span>${p.kind} · ${p.starts_on} → ${p.ends_on}</span></div><button class="ic" data-pdel="${p.id}">✕</button></div>`).join('')}`;
 v.onclick=async e=>{const b=e.target.closest('[data-padd],[data-pdel]');if(!b)return;
  try{if(b.dataset.pdel){const r=await SB.from('promos').delete().eq('id',b.dataset.pdel);if(r.error)throw r.error;return go()}
   const t=$('#pt').value.trim();if(!t)return toast('Titre obligatoire');const f=$('#pi').files[0];const img=f?await up(`promos/${user.id}/${Date.now()}-${safe(f.name)}`,f):null;
   const r=await SB.from('promos').insert({kind:$('#pk').value,title:t,subtitle:$('#ps').value.trim()||null,artist_id:$('#pa').value||null,link_url:$('#pl').value.trim()||null,image_url:img,starts_on:$('#p1').value,ends_on:$('#p2').value,created_by:user.id});if(r.error)throw r.error;adC.home_banner=null;go('Promotion publiée')}catch(x){toast(x.message)}};
};

/* ---------- BLING STUDIO : tableau de bord artiste ---------- */
views.dash=async v=>{
 if(!user){v.innerHTML='<h2>BLING STUDIO</h2>'+needLogin('Connecte-toi pour voir ton tableau de bord.');return}
 let d;try{d=await rpc('studio_dashboard')}catch(e){v.innerHTML='<h2>BLING STUDIO</h2><p class="m">Réservé aux artistes validés. Fais ta demande dans Studio artiste.</p>';return}
 v.innerHTML=`<h2>📈 BLING STUDIO</h2><div class="tl">${tile(N(d.listens_7d),'écoutes validées · 7 jours')+tile(N(d.listens_30d),'écoutes validées · 30 jours')+tile(N(d.listens_total),'écoutes validées · total')+tile(N(d.followers),'abonnés')+tile(N(d.likes),'j’aime')+tile(N(d.comments),'commentaires')}</div>
 <h2>Revenus (ta part)</h2><div class="tl">${tile(F(d.sales_fcfa),N(d.sales_count)+' vente(s) de titres')+tile(F(d.gifts_fcfa),N(d.gifts_count)+' cadeau(x)')+tile(F(d.tickets_fcfa),N(d.tickets_count)+' billet(s) de concert')+tile(F(d.balance),'solde du portefeuille')}</div>
 <h2>BLING RECORDS</h2>${(d.records||[]).map(r=>`<div class="row"><div class="tx"><b>${RL[r.level][0]} ${RL[r.level][1]}</b><span>${E(r.title)}</span></div></div>`).join('')||'<p class="m">Aucune certification pour l’instant.</p>'}
 <button class="btn s" data-go="wallet">💰 Portefeuille et retraits</button><button class="btn s" data-go="studio">🎤 Studio artiste</button>`;
};

/* ---------- Pilotage de la plateforme (administrateur) ---------- */
views.pilot=async v=>{
 if(!isAdm()){v.innerHTML='<p class="m">Accès réservé à l’administrateur.</p>';return}
 const q=v.dataset.q||'';
 const [d,us,lg,ct,tx]=await Promise.all([rpc('admin_dashboard'),SB.rpc('admin_list_users',{p_q:q||null}),
  SB.from('activity_log').select('action,entity,created_at').order('created_at',{ascending:false}).limit(15),
  SB.from('contracts').select('version,accepted_at,artists(name)').order('accepted_at',{ascending:false}).limit(15),
  SB.from('ledger_entries').select('kind,direction,amount_fcfa,created_at').order('created_at',{ascending:false}).limit(15)]);
 const RO=['user','artist','moderator','editor','admin'];
 v.innerHTML=`<h2>🧭 Pilotage BLING MONEY MUSIC</h2><div class="tl">${[[N(d.users),'comptes'],[N(d.artists),'artistes pro'],[N(d.applications_pending),'dossiers artistes'],[N(d.tracks_pending),'titres à vérifier'],[N(d.concerts_pending),'concerts à valider'],[N(d.ads_pending),'pubs à valider'],[N(d.reports_open),'signalements'],[N(d.withdrawals_pending)+' · '+F(d.withdrawals_pending_fcfa),'retraits en attente'],[F(d.platform_balance),'commissions'],[F(d.deposits_fcfa),'dépôts reçus'],[N(d.listens_7d),'écoutes validées · 7 j']].map(x=>tile(...x)).join('')}</div>
 <div class="tl">${[['mod','🛡 Modération'],['finance','📊 Finances'],['cinadmin','🎞 Cinéma'],['promoadmin','🖼 Promotions'],['ads','📣 Publicités'],['awards','🏅 Awards'],['admin','📝 Éditorial et titres'],['charts','🏆 Classements'],['audioaudit','🔊 Audit audio'],['plansadmin','💳 Abonnements et commissions']].map(([k,n])=>`<div class="tile" data-go="${k}"><b>${n}</b></div>`).join('')}</div>
 <h2>Comptes</h2><input id="uq" type="search" placeholder="Rechercher un e-mail ou un nom" value="${E(q)}">${(us.data||[]).map(u=>`<div class="row"><div class="tx"><b>${E(u.display_name||u.email)}</b><span>${E(u.email)}</span></div><select data-urole="${u.id}" style="width:120px">${RO.map(r=>`<option ${r===u.role?'selected':''}>${r}</option>`).join('')}</select></div>`).join('')}
 <details><summary class="m">Contrats signés</summary>${(ct.data||[]).map(c=>`<p class="m" style="padding:2px 0">${E(c.artists?.name)} · ${c.version} · ${new Date(c.accepted_at).toLocaleDateString('fr-FR')}</p>`).join('')||'<p class="m">Aucun.</p>'}</details>
 <details><summary class="m">Dernières transactions</summary>${(tx.data||[]).map(x=>`<p class="m" style="padding:2px 0">${E(x.kind)} · ${x.direction==='credit'?'+':'−'}${F(x.amount_fcfa)} · ${new Date(x.created_at).toLocaleString('fr-FR')}</p>`).join('')||'<p class="m">Aucune.</p>'}</details>
 <details><summary class="m">Journal d’activités</summary>${(lg.data||[]).map(x=>`<p class="m" style="padding:2px 0">${E(x.action)} · ${E(x.entity||'')} · ${new Date(x.created_at).toLocaleString('fr-FR')}</p>`).join('')||'<p class="m">Aucune.</p>'}</details>`;
 let tm;$('#uq').oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{v.dataset.q=e.target.value.trim();render()},500)};
 v.onchange=async e=>{const s=e.target.closest('[data-urole]');if(!s)return;if(!confirm('Changer le rôle de ce compte en « '+s.value+' » ?'))return render();
  try{await rpc('set_user_role',{p_user:s.dataset.urole,p_role:s.value});go('Rôle modifié')}catch(x){toast(x.message);render()}};
};
})();
