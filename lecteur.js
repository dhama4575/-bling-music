/* BLING MONEY MUSIC v3 : lecteur persistant, diagnostic et audit audio */
(()=>{
const E=esc;
const S=(d,f)=>`<svg viewBox="0 0 24 24" width="22" height="22" ${f?'fill="currentColor"':'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'}>${d}</svg>`;
const IC={play:S('<path d="M8 5v14l11-7z"/>',1),pause:S('<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',1),prev:S('<path d="M6 5h2v14H6zM20 5v14L9 12z"/>',1),next:S('<path d="M16 5h2v14h-2zM4 5l11 7L4 19z"/>',1)};
['mpv','pv'].forEach(i=>{const b=$('#'+i);if(b)b.innerHTML=IC.prev});['mnx','nx'].forEach(i=>{const b=$('#'+i);if(b)b.innerHTML=IC.next});
const pp=()=>{const h=au.paused?IC.play:IC.pause;$('#mpp').innerHTML=h;$('#spp').innerHTML=h};pp();
['play','pause','emptied'].forEach(ev=>au.addEventListener(ev,pp));

/* Barre de lecture persistante : progression, temps, volume */
$('#mpv').onclick=()=>prev();
au.addEventListener('timeupdate',()=>{const d=isFinite(au.duration)?au.duration:0,p=d?au.currentTime/d:0;$('#mseek').value=p*1000;$('#mtc').textContent=fmt(au.currentTime);$('#mtd').textContent=fmt(d)});
$('#mseek').oninput=e=>{if(isFinite(au.duration))au.currentTime=e.target.value/1000*au.duration};
$('#mvo').oninput=e=>{au.volume=e.target.value;$('#vo').value=e.target.value};
$('#vo').addEventListener('input',e=>{$('#mvo').value=e.target.value});
['#mseek','#mvo'].forEach(s=>$(s).addEventListener('click',e=>e.stopPropagation()));
$('#mini .mi').onclick=()=>{$('#sheet').hidden=false};
document.addEventListener('keydown',e=>{if(e.code!=='Space'||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')||!au.src)return;e.preventDefault();au.paused?au.play():au.pause()});

/* Fond du lecteur plein écran : la pochette du titre en cours */
const o=window.setUI;
window.setUI=function(){o();const s=$('#sheet');if(cur?.cover){const u=encodeURI(cur.cover).replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29');s.style.backgroundImage=`linear-gradient(rgba(0,0,0,.6),#000 82%),url('${u}')`}else s.style.backgroundImage=''};

/* Diagnostic précis quand un fichier ne se lit pas */
let ec=0;au.addEventListener('loadstart',()=>ec=0);
au.addEventListener('error',()=>{if(!cur||!au.src)return;ec++;if(ec<2)return;
 const m={1:'lecture interrompue',2:'problème de réseau',3:'fichier audio abîmé ou incomplet',4:'format non pris en charge ou fichier introuvable'}[au.error?.code]||'erreur inconnue';
 toast('Lecture impossible ('+m+'). Signale-le à l’administrateur : « '+cur.title+' ».')});

/* ---------- Audit du système audio (administrateur et modérateurs) ---------- */
const OK='✅',WA='⚠️',KO='❌';
const probe=u=>new Promise(ok=>{const a=new Audio();let d=false;const f=r=>{if(d)return;d=true;clearTimeout(t);a.removeAttribute('src');ok(r)};
 const t=setTimeout(()=>f({err:'délai dépassé'}),9000);a.preload='metadata';a.onloadedmetadata=()=>f({dur:a.duration});a.onerror=()=>f({err:{1:'interrompu',2:'réseau',3:'fichier abîmé',4:'format non pris en charge'}[a.error?.code]||'erreur'});a.src=u});
const pic=u=>new Promise(ok=>{if(!u)return ok(null);const i=new Image(),t=setTimeout(()=>ok(false),7000);i.onload=()=>{clearTimeout(t);ok(true)};i.onerror=()=>{clearTimeout(t);ok(false)};i.src=u});
async function auditOne(t){const r={t,iss:[],ok:true};
 const {data,error}=await SB.storage.from('audio').createSignedUrl(t.audio_path,600);
 if(error||!data){r.iss.push(KO+' fichier introuvable dans le stockage');r.ok=false;return r}
 try{const x=await fetch(data.signedUrl,{headers:{Range:'bytes=0-1023'}});
  if(!x.ok&&x.status!==206){r.iss.push(KO+' accès refusé (code '+x.status+')');r.ok=false}
  else{const ct=(x.headers.get('content-type')||'').toLowerCase();
   if(!ct.startsWith('audio/')&&!ct.includes('mpeg')&&!ct.includes('mp4'))r.iss.push(WA+' type de fichier « '+(ct||'inconnu')+' » : Safari peut mal le lire, à ré-envoyer');
   if(x.status!==206)r.iss.push(WA+' lecture par morceaux non confirmée (avance rapide possible mais moins fluide)')}
 }catch(e){r.iss.push(WA+' test réseau impossible : '+e.message)}
 const ext=(t.audio_path.split('.').pop()||'').toLowerCase();if(!['mp3','m4a','aac','wav','ogg','mp4'].includes(ext))r.iss.push(WA+' extension « .'+ext+' » inhabituelle');
 const p=await probe(data.signedUrl);
 if(p.err){r.iss.push(KO+' le navigateur ne peut pas lire ce fichier ('+p.err+')');r.ok=false}
 else if(t.duration_seconds&&Math.abs(p.dur-t.duration_seconds)>3)r.iss.push(WA+' durée réelle '+fmt(p.dur)+' ≠ durée enregistrée '+fmt(t.duration_seconds)+' : le fichier ne correspond peut-être pas à ce titre');
 const c=await pic(t.cover_url);if(c===false)r.iss.push(WA+' pochette introuvable');if(c===null)r.iss.push(WA+' aucune pochette');
 if(r.iss.some(s=>s.startsWith(KO)))r.ok=false;return r}

views.audioaudit=async v=>{
 if(!isMod()){v.innerHTML='<p class="m">Accès réservé.</p>';return}
 const {data,error}=await SB.from('tracks').select('id,title,audio_path,duration_seconds,cover_url,artists(name)').eq('status','approved').order('published_at',{ascending:false}).limit(60);if(error)throw error;
 v.innerHTML=`<h2>🔊 Audit du système audio</h2><p class="m">Vérifie ${(data||[]).length} titre(s) du catalogue BLING : fichier présent, type de fichier, lecture réelle dans ton navigateur, durée et pochette.</p><button class="btn" id="aud">Lancer l’audit</button><p class="m" id="aup"></p><div id="aur"></div>`;
 $('#aud').onclick=async()=>{const b=$('#aud'),R=$('#aur');b.disabled=true;R.innerHTML='';let n=0,bad=0,i=0;const q=[...(data||[])];
  const w=async()=>{while(q.length){const t=q.shift(),r=await auditOne(t);n++;if(r.iss.length)bad++;$('#aup').textContent=n+' / '+(data||[]).length+' vérifié(s)';
   if(r.iss.length)R.insertAdjacentHTML('beforeend',`<div class="tile" style="margin:8px 0;cursor:default"><b>${r.ok?WA:KO} ${E(t.title)}</b><span style="white-space:normal">${E(t.artists?.name||'')}</span>${r.iss.map(s=>`<span style="white-space:normal;color:#ddd;margin-top:4px">${E(s)}</span>`).join('')}</div>`)}};
  await Promise.all([w(),w(),w()]);b.disabled=false;$('#aup').textContent=n+' titre(s) vérifié(s) : '+(bad?bad+' avec une anomalie.':'aucune anomalie.');if(!bad)R.innerHTML='<p class="m">✅ Tous les fichiers audio se lisent correctement.</p>'}};
})();
