/* BLING MONEY MUSIC v3 : communauté (publications, commentaires, partages, notifications, liens directs) */
(()=>{
const E=esc;
const rpc=async(f,a)=>{const {data,error}=await SB.rpc(f,a);if(error)throw error;return data};
const go=m=>{if(m)toast(m);render()};
const im=u=>u?`<img src="${E(u)}" loading="lazy" alt="" onerror="this.remove()">`:'';
const ago=d=>{const s=(Date.now()-new Date(d))/1000;return s<60?'à l’instant':s<3600?Math.floor(s/60)+' min':s<86400?Math.floor(s/3600)+' h':s<604800?Math.floor(s/86400)+' j':new Date(d).toLocaleDateString('fr-FR')};
const KT={artist:'Artiste',beatmaker:'Beatmaker',pro:'Professionnel'};
let FT='recent',PF=null;

/* ---------- Partage (lien direct vers un contenu) ---------- */
async function share(kind,id,title){const url=location.origin+location.pathname+'#'+kind+'='+id;
 try{if(navigator.share){await navigator.share({title:'BLING MONEY MUSIC',text:title,url});return}}catch(e){if(e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(url);toast('Lien copié')}catch(e){prompt('Copie ce lien :',url)}}
function tap(attr,val){const b=document.createElement('button');b.setAttribute(attr,val);b.hidden=true;document.body.appendChild(b);b.click();b.remove()}
async function deepLink(){const h=new URLSearchParams(location.hash.slice(1));if(![...h.keys()].length)return;
 history.replaceState(null,'',location.pathname+location.search);
 if(h.get('a'))return tap('data-artist','own:'+h.get('a'));
 if(h.get('b'))return tap('data-bm',h.get('b'));
 if(h.get('r'))return tap('data-pro',h.get('r'));
 if(h.get('bt'))return tap('data-beat',h.get('bt'));
 if(h.get('p')){PF=h.get('p');FT='recent';tab='feed';return render()}
 if(h.get('t')){try{const {data}=await SB.from('tracks').select(QS).eq('id',h.get('t')).eq('status','approved').single();const t=norm(data);T[t.id]=t;L.dl=[t];
  openReader(`<h2 style="margin-top:6px">${E(t.title)}</h2><p class="m">${E(t.artist)}</p>${t.cover?`<img src="${E(t.cover)}" alt="" style="max-width:340px">`:''}<button class="btn" data-play="dl:0">▶ Écouter</button>`)}catch(e){toast('Titre introuvable')}}}
setTimeout(deepLink,1500);

/* ---------- Publications ---------- */
async function enrich(ps){const ids=ps.map(p=>p.id),tids=[...new Set(ps.map(p=>p.track_id).filter(Boolean))];
 const [lk,cm,tr]=await Promise.all([ids.length?SB.from('post_likes').select('post_id,user_id').in('post_id',ids):{data:[]},ids.length?SB.from('post_comments').select('post_id').eq('hidden',false).in('post_id',ids):{data:[]},tids.length?SB.from('tracks').select(QS).in('id',tids):{data:[]}]);
 const lc={},mine=new Set(),cc={},tm={};(lk.data||[]).forEach(x=>{lc[x.post_id]=(lc[x.post_id]||0)+1;if(x.user_id===user?.id)mine.add(x.post_id)});(cm.data||[]).forEach(x=>cc[x.post_id]=(cc[x.post_id]||0)+1);(tr.data||[]).forEach(t=>tm[t.id]=norm(t));
 return {lc,mine,cc,tm}}
function card(p,x){let tb='';const t=x.tm[p.track_id];if(t){T[t.id]=t;L.fp=L.fp||[];const i=L.fp.length;L.fp.push(t);tb=`<div class="row" data-play="fp:${i}" style="background:rgba(255,255,255,.05);border-radius:14px;margin:8px 0;cursor:pointer"><div class="cv">${im(t.cover)}</div><div class="tx"><b>${E(t.title)}</b><span>${E(t.artist)}</span></div><span class="du">▶</span></div>`}
 const own=p.user_id===user?.id;
 return `<div class="tile" style="margin:12px 0;cursor:default"><div style="display:flex;gap:10px;align-items:center"><div class="cv" style="width:42px;height:42px;border-radius:50%;flex:none">${im(p.author_photo)}</div><div class="tx"><b>${E(p.author_name)}</b><span>${KT[p.as_type]} · ${ago(p.created_at)}</span></div>${own||isMod()?`<button class="ic" data-pdel="${p.id}" aria-label="Supprimer">✕</button>`:''}</div>
 <span style="white-space:pre-wrap;color:#eee;margin:10px 0">${E(p.body)}</span>${p.image_url?`<img src="${E(p.image_url)}" alt="" style="width:100%;border-radius:14px;margin:4px 0" loading="lazy" onerror="this.remove()">`:''}${tb}
 <div class="seg"><button data-plike="${p.id}">${x.mine.has(p.id)?'♥':'♡'} ${x.lc[p.id]||0}</button><button data-pcm="${p.id}">💬 ${x.cc[p.id]||0}</button><button data-share="p|${p.id}|${E(p.author_name)}">↗ Partager</button></div><div id="pc-${p.id}"></div></div>`}
async function postsHtml(type,id){const {data}=await SB.from('posts').select('*').eq('as_type',type).eq('as_id',id).eq('hidden',false).order('created_at',{ascending:false}).limit(5);if(!(data||[]).length)return '';
 L.fp=[];const x=await enrich(data);return `<h2>Publications</h2>`+data.map(p=>card(p,x)).join('')}

views.feed=async v=>{
 let ids=[],mt=[];
 if(user){const [a,b,p]=await Promise.all([SB.from('artists').select('id,name').eq('user_id',user.id).eq('status','approved'),SB.from('beatmakers').select('id,name').eq('user_id',user.id).eq('status','approved'),SB.from('pro_profiles').select('id,name').eq('user_id',user.id).eq('status','approved')]);
  ids=[...(a.data||[]).map(x=>({t:'artist',id:x.id,n:x.name})),...(b.data||[]).map(x=>({t:'beatmaker',id:x.id,n:x.name})),...(p.data||[]).map(x=>({t:'pro',id:x.id,n:x.name}))];
  const ar=ids.find(i=>i.t==='artist');if(ar)mt=(await SB.from('tracks').select('id,title').eq('artist_id',ar.id).eq('status','approved').order('published_at',{ascending:false}).limit(30)).data||[]}
 let q=SB.from('posts').select('*').eq('hidden',false).order('created_at',{ascending:false}).limit(30),empty='Aucune publication pour le moment.';
 if(PF)q=SB.from('posts').select('*').eq('id',PF);
 else if(FT==='follow'){if(!user)empty='Connecte-toi pour voir les publications des artistes que tu suis.';
  const f=user?(await SB.from('follows').select('artist_id').eq('user_id',user.id)).data||[]:[];if(!f.length){empty=user?'Tu ne suis encore aucun artiste. Suis des artistes pour voir leurs publications ici.':empty;q=null}else q=q.eq('as_type','artist').in('as_id',f.map(x=>x.artist_id))}
 const ps=q?(await q).data||[]:[];L.fp=[];const x=await enrich(ps);
 v.innerHTML=`<h2>💬 Communauté</h2>${PF?'<button class="ic" data-pfall>‹ Toutes les publications</button>':`<div class="seg"><button data-ft="recent" class="${FT==='recent'?'on':''}">Récents</button><button data-ft="follow" class="${FT==='follow'?'on':''}">Abonnements</button><button data-go="notifs">🔔 Notifications</button></div>`}`+
 (ids.length&&!PF?`<div class="tile" style="cursor:default;margin:12px 0"><b>Publier</b><select id="pa">${ids.map(i=>`<option value="${i.t}|${i.id}">${E(i.n)} · ${KT[i.t]}</option>`).join('')}</select><textarea id="pb" rows="3" maxlength="1000" placeholder="Partage une actualité, une sortie, un projet…"></textarea><select id="pt"><option value="">Sans titre joint</option>${mt.map(t=>`<option value="${t.id}">♪ ${E(t.title)}</option>`).join('')}</select><input id="pi" type="file" accept="image/*"><button class="btn" data-ppub>Publier</button></div>`:(!PF?'<p class="m" style="font-size:12px">Les artistes, beatmakers et professionnels validés peuvent publier ici.</p>':''))+
 (ps.map(p=>card(p,x)).join('')||`<p class="m">${E(empty)}</p>`)};

/* ---------- Notifications ---------- */
const NI={posts:'📝',tracks:'🎵',followers:'👤',comments:'💬',messages:'✉️'};
views.notifs=async v=>{
 if(!user){v.innerHTML='<h2>🔔 Notifications</h2>'+needLogin('Connecte-toi pour voir tes notifications.');return}
 const [n,pf]=await Promise.all([SB.from('user_notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50),SB.from('notif_prefs').select('*').eq('user_id',user.id).maybeSingle()]);
 if(n.error)throw n.error;const p=pf.data||{posts:true,tracks:true,followers:true,comments:true,messages:true};
 v.innerHTML=`<h2>🔔 Notifications</h2>`+((n.data||[]).map(x=>`<div class="row" ${x.target?`data-nt="${E(x.target)}" style="cursor:pointer"`:''}><div class="cv" style="display:grid;place-items:center;font-size:20px">${NI[x.type]||'🔔'}</div><div class="tx"><b>${E(x.title)}${x.read?'':' · nouveau'}</b><span style="white-space:normal">${E(x.body||'')} · ${ago(x.created_at)}</span></div></div>`).join('')||'<p class="m">Aucune notification pour l’instant.</p>')+
 `<h2>Ce que je veux recevoir</h2>${[['posts','Publications des artistes que je suis'],['tracks','Nouveaux titres des artistes que je suis'],['followers','Nouveaux abonnés'],['comments','Commentaires sur mes publications'],['messages','Nouveaux messages']].map(([k,t])=>`<label class="row" style="cursor:pointer"><div class="tx"><b>${t}</b></div><input type="checkbox" data-npref="${k}" ${p[k]?'checked':''} style="width:auto"></label>`).join('')}`;
 SB.rpc('mark_notifs_read').then(()=>{bell(0)})};

/* Cloche dans l'en-tête */
let bt=null;
async function bell(force){const h=$('#hb');if(!h)return;let b=$('#bell');if(!b){h.insertAdjacentHTML('beforebegin','<button id="bell" class="hbell" data-go="notifs" aria-label="Notifications">🔔<i id="bn" hidden></i></button>');b=$('#bell')}
 b.hidden=!user;if(!user)return;let n=force;
 if(n===undefined){try{const r=await SB.from('user_notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('read',false);n=r.count||0}catch(e){n=0}}
 const i=$('#bn');i.hidden=!n;i.textContent=n>9?'9+':n}
const r1=window.render;window.render=async function(){const x=await r1.apply(this,arguments);bell();if(!bt)bt=setInterval(()=>bell(),60000);return x};
document.head.insertAdjacentHTML('beforeend','<style>.hbell{position:relative;background:var(--c2);border:1px solid var(--line);border-radius:50%;width:38px;height:38px;display:grid;place-items:center;flex:none;font-size:16px}.hbell i{position:absolute;top:-3px;right:-3px;background:var(--g);color:#1a1200;border-radius:10px;font:800 10px/1 sans-serif;padding:3px 5px;font-style:normal}</style>');

/* ---------- Actions ---------- */
document.addEventListener('click',async e=>{const t=e.target;let b;
 try{
 if(b=t.closest('[data-share]')){const [k,id,ti]=b.dataset.share.split('|');return share(k,id,ti)}
 if(b=t.closest('[data-ft]')){FT=b.dataset.ft;PF=null;return render()}
 if(t.closest('[data-pfall]')){PF=null;return render()}
 if(b=t.closest('[data-nt]')){const [k,id]=b.dataset.nt.split(/:(.+)/);if(k==='post'){PF=id;tab='feed';return render()}if(k==='artist')return tap('data-artist','own:'+id);if(k==='inbox'){tab='inbox';return render()}return}
 if(b=t.closest('[data-npref]')){return void await rpc('set_notif_pref',{p_key:b.dataset.npref,p_on:b.checked})}
 if(b=t.closest('[data-ppub]')){const [ty,id]=$('#pa').value.split('|'),body=$('#pb').value.trim();if(!body)return toast('Écris un message');b.disabled=true;
  const f=$('#pi').files[0];let url=null;
  if(f){const u=await SB.storage.from('covers').upload(`posts/${user.id}/${Date.now()}-${safe(f.name)}`,f);if(u.error)throw u.error;url=SB.storage.from('covers').getPublicUrl(u.data.path).data.publicUrl}
  await rpc('create_post',{p_type:ty,p_as:id,p_body:body,p_image:url,p_track:$('#pt').value||null});return go('Publié ✓')}
 if(b=t.closest('[data-plike]')){if(!user)return toast('Connecte-toi pour aimer');const id=b.dataset.plike,k={user_id:user.id,post_id:id};const x=await SB.from('post_likes').select('post_id').match(k).limit(1);
  const r=x.data?.length?await SB.from('post_likes').delete().match(k):await SB.from('post_likes').insert(k);if(r.error)throw r.error;return render()}
 if(b=t.closest('[data-pdel]')){if(!confirm('Supprimer cette publication ?'))return;const r=await SB.from('posts').delete().eq('id',b.dataset.pdel);if(r.error)throw r.error;return go('Supprimée')}
 if(b=t.closest('[data-pcm]')){const id=b.dataset.pcm,box=$('#pc-'+id);if(box.innerHTML){box.innerHTML='';return}
  const {data}=await SB.from('post_comments').select('id,user_id,body,created_at').eq('post_id',id).eq('hidden',false).order('created_at').limit(50);
  const ids=[...new Set((data||[]).map(c=>c.user_id))],nm={};if(ids.length){try{((await SB.from('profiles').select('id,display_name').in('id',ids)).data||[]).forEach(p=>nm[p.id]=p.display_name)}catch(x){}}
  box.innerHTML=(data||[]).map(c=>`<div class="row" style="align-items:flex-start"><div class="tx"><b>${E(nm[c.user_id]||'Auditeur')}</b><span style="white-space:normal;color:#ddd">${E(c.body)}</span></div>${(c.user_id===user?.id||isMod())?`<button class="ic" data-pcd="${c.id}">✕</button>`:''}</div>`).join('')+`<textarea id="pcm-${id}" rows="2" maxlength="500" placeholder="Ton commentaire…"></textarea><button class="btn s" data-pcs="${id}">Commenter</button>`;return}
 if(b=t.closest('[data-pcs]')){if(!user)return toast('Connecte-toi pour commenter');const id=b.dataset.pcs,body=$('#pcm-'+id).value.trim();if(!body)return;const r=await SB.from('post_comments').insert({post_id:id,user_id:user.id,body});if(r.error)throw r.error;return go('Commentaire ajouté')}
 if(b=t.closest('[data-pcd]')){const r=await SB.from('post_comments').delete().eq('id',b.dataset.pcd);if(r.error)throw r.error;return go()}
 }catch(x){toast(x.message)}});
})();
