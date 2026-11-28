/* BLING MONEY MUSIC v3 : billets électroniques (QR code), ventes de l'organisateur, contrôle à l'entrée */
(()=>{
const E=esc,F=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
const D=d=>new Date(d).toLocaleString('fr-FR',{dateStyle:'full',timeStyle:'short'});
const rpc=async(f,a)=>{const {data,error}=await SB.rpc(f,a);if(error)throw error;return data};
const go=m=>{if(m)toast(m);render()};

/* Bibliothèques QR chargées au besoin (puis gardées en mémoire par l'application hors ligne) */
const LIBS={qr:['https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.2/qrcode.js','https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'],jsqr:['https://cdn.jsdelivr.net/npm/jsqr@1.3.1/dist/jsQR.min.js']};
const loadOne=u=>new Promise(ok=>{const s=document.createElement('script');s.src=u;s.onload=()=>ok(true);s.onerror=()=>ok(false);document.head.appendChild(s)});
async function lib(n,test){if(test())return true;for(const u of LIBS[n]){await loadOne(u);if(test())return true}return false}
const hasQR=()=>typeof window.qrcode==='function',hasScan=()=>typeof window.jsQR==='function';
const qrImg=code=>{const q=window.qrcode(0,'M');q.addData('BLING:'+code);q.make();return q.createDataURL(8,3)};

/* ---------- Mes billets ---------- */
views.tickets=async v=>{
 if(!user){v.innerHTML='<h2>Mes billets</h2>'+needLogin('Connecte-toi pour retrouver tes billets.');return}
 const [t,qr]=await Promise.all([SB.from('tickets').select('id,code,status,price_fcfa,used_at,created_at,concerts(title,starts_at,venue,mode)').eq('user_id',user.id).order('created_at',{ascending:false}),lib('qr',hasQR)]);
 if(t.error)throw t.error;const l=(t.data||[]).sort((a,b)=>(a.status==='valid'?0:1)-(b.status==='valid'?0:1));
 v.innerHTML=`<h2>🎟 Mes billets</h2>`+(l.map(x=>{const c=x.concerts||{};return `<div class="tile" style="margin:12px 0;cursor:default;text-align:center"><b style="font-size:18px">${E(c.title)}</b><span style="white-space:normal">${c.starts_at?E(D(c.starts_at)):''}${c.mode==='live'?' · En direct':c.venue?' · '+E(c.venue):''}</span>
  ${x.status==='valid'?(qr?`<img src="${qrImg(x.code)}" alt="QR code du billet" style="width:min(260px,70vw);image-rendering:pixelated;background:#fff;padding:10px;border-radius:14px;margin:14px auto 6px;display:block">`:'<p class="m">Le QR code n’a pas pu se charger (Internet requis). Présente le code ci-dessous.</p>')+`<b style="font-size:22px;letter-spacing:.14em;margin:6px 0">${E(x.code)}</b><span style="color:#4ade80">✔ Billet valide · présente ce QR code à l’entrée</span>`
   :x.status==='used'?`<p class="m" style="padding:14px 0">Billet utilisé${x.used_at?' le '+E(new Date(x.used_at).toLocaleString('fr-FR')):''}</p>`:`<p class="m" style="padding:14px 0">Billet ${E(x.status)}</p>`}
  <span style="font-size:12px">Code ${E(x.code)} · ${x.price_fcfa?F(x.price_fcfa):'Gratuit'}</span></div>`}).join('')||'<p class="m">Tu n’as pas encore de billet. Réserve-en un dans « Concerts et billets ».</p>')+
  '<button class="btn s" data-go="concerts">🎟 Voir les concerts</button><p class="m" style="font-size:12px">Ne partage pas ton QR code : une fois scanné à l’entrée, le billet est marqué comme utilisé et ne peut plus servir.</p>'};

/* ---------- Billetterie de l'organisateur ---------- */
let SC=null,stream=null,raf=0,busy=false;
views.concertpro=async v=>{
 if(!user){v.innerHTML='<h2>Billetterie</h2>'+needLogin('Connecte-toi pour suivre tes concerts.');return}
 const {data,error}=await SB.rpc('my_concert_sales');if(error)throw error;const l=data||[];
 const T0=l.reduce((a,c)=>({s:a.s+Number(c.sold),e:a.e+Number(c.entered),g:a.g+Number(c.gross),o:a.o+Number(c.organizer_share),p:a.p+Number(c.platform_share)}),{s:0,e:0,g:0,o:0,p:0});
 const tl=(a,b)=>`<div class="tile" style="cursor:default"><b>${a}</b><span>${b}</span></div>`;
 v.innerHTML=`<h2>🎫 Billetterie organisateur</h2><div class="tl">${tl(T0.s,'billets vendus')+tl(T0.e,'entrées validées')+tl(F(T0.o),'ta part (après commission)')+tl(F(T0.p),'commission BLING')}</div>
 ${l.map(c=>`<div class="tile" style="margin:12px 0;cursor:default"><b>${E(c.title)}</b><span style="white-space:normal">${E(new Date(c.starts_at).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}))} · ${{pending:'En attente de validation',approved:'Validé',ended:'Terminé',rejected:'Refusé'}[c.status]} · ${c.price_fcfa?F(c.price_fcfa):'Gratuit'}</span>
  <span style="white-space:normal;color:#ddd;margin-top:6px">${c.sold} vendu(s)${c.capacity?' sur '+c.capacity:''} · ${c.entered} entrée(s) validée(s) · recettes ${F(c.gross)} · ta part ${F(c.organizer_share)} · commission ${F(c.platform_share)}</span>
  ${['approved','ended'].includes(c.status)?`<button class="btn" style="margin-top:10px" data-sc="${c.concert_id}">📷 Contrôler les billets à l’entrée</button>`:''}</div>`).join('')||'<p class="m">Aucun concert pour l’instant.</p>'}
 <button class="btn s" data-go="concerts">+ Organiser un concert</button>`};

/* ---------- Contrôle à l'entrée ---------- */
function stopCam(){cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null}
const RS={ok:['#16a34a','✔ BILLET VALIDE','Entrée autorisée'],already_used:['#dc2626','✖ DÉJÀ UTILISÉ','Ce billet a déjà été scanné'],wrong_concert:['#ea580c','⚠ AUTRE CONCERT','Ce billet est pour un autre événement'],invalid:['#dc2626','✖ BILLET INVALIDE','Code inconnu ou non autorisé'],info:['#2563eb','ℹ','']};
function show(k,extra,sub){const p=$('#scr');if(!p)return;const r=RS[k]||RS.info;p.style.cssText=`background:${r[0]};color:#fff;border-radius:18px;padding:22px 16px;text-align:center;margin:14px 0`;p.innerHTML=`<b style="font-size:26px;display:block">${r[1]}</b><span style="font-size:15px;display:block;margin-top:6px">${E(sub||r[2])}${extra?' · '+E(extra):''}</span>`}
async function handle(code){busy=true;try{const r=await rpc('scan_ticket',{p_code:code,p_concert:SC});show(r.result,r.result==='ok'?(r.price?F(r.price):'Gratuit'):r.result==='wrong_concert'?r.concert:r.used_at?new Date(r.used_at).toLocaleTimeString('fr-FR'):'');refresh()}catch(e){show('info','',e.message)}setTimeout(()=>{busy=false},2500)}
async function refresh(){try{const {data}=await SB.rpc('my_concert_sales');const c=(data||[]).find(x=>x.concert_id===SC);if(c&&$('#scs'))$('#scs').textContent=c.entered+' entrée(s) validée(s) sur '+c.sold+' billet(s) vendu(s)'}catch(e){}}
function loop(){const vid=$('#scv'),cv=$('#scn');if(!vid||!document.body.contains(vid)){stopCam();return}
 if(vid.readyState>=2&&vid.videoWidth&&!busy){const w=480,h=Math.round(w*vid.videoHeight/vid.videoWidth);cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(vid,0,0,w,h);const r=window.jsQR(x.getImageData(0,0,w,h).data,w,h,{inversionAttempts:'dontInvert'});if(r&&r.data)handle(r.data)}
 raf=requestAnimationFrame(loop)}
async function startCam(){if(!await lib('jsqr',hasScan))return show('info','','Le lecteur de QR code n’a pas pu se charger (Internet requis). Utilise la saisie du code ci-dessous.');
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})}catch(e){return show('info','','Caméra refusée ou indisponible : autorise la caméra pour ce site, ou saisis le code.')}
 const vid=$('#scv');vid.setAttribute('playsinline','');vid.muted=true;vid.srcObject=stream;vid.hidden=false;try{await vid.play()}catch(e){}loop()}

views.scan=async v=>{
 stopCam();
 if(!user){v.innerHTML='<h2>Contrôle des billets</h2>'+needLogin('Connecte-toi avec le compte de l’organisateur.');return}
 const {data,error}=await SB.rpc('my_concert_sales');if(error)throw error;const l=(data||[]).filter(c=>['approved','ended'].includes(c.status));
 if(!l.length){v.innerHTML='<button class="ic" data-go="concertpro">‹ Retour</button><h2>Contrôle des billets</h2><p class="m">Aucun concert validé à contrôler.</p>';return}
 if(!SC||!l.some(c=>c.concert_id===SC))SC=l[0].concert_id;
 v.innerHTML=`<button class="ic" data-go="concertpro">‹ Retour</button><h2>📷 Contrôle à l’entrée</h2><select id="scc">${l.map(c=>`<option value="${c.concert_id}" ${c.concert_id===SC?'selected':''}>${E(c.title)}</option>`).join('')}</select><p class="m" id="scs"></p>
 <video id="scv" hidden playsinline muted style="width:100%;border-radius:18px;background:#000;max-height:46vh;object-fit:cover"></video><canvas id="scn" hidden></canvas><div id="scr"></div>
 <button class="btn" data-scam>📷 Activer la caméra et scanner</button><button class="btn s" data-scstop>Arrêter la caméra</button>
 <h2>Saisie manuelle</h2><input id="scm" placeholder="Code du billet (10 caractères)" autocapitalize="characters" style="letter-spacing:.12em"><button class="btn s" data-scman>Vérifier le code</button>
 <p class="m" style="font-size:12px">Un billet valide est marqué « utilisé » dès le scan : un second passage est refusé. Tous les contrôles sont enregistrés.</p>`;
 $('#scc').onchange=e=>{SC=e.target.value;refresh()};refresh();
 v.onclick=async e=>{const b=e.target.closest('[data-scam],[data-scstop],[data-scman]');if(!b)return;
  if('scam' in b.dataset)startCam();else if('scstop' in b.dataset){stopCam();$('#scv').hidden=true}else{const c=$('#scm').value.trim();if(c){await handle(c);$('#scm').value=''}}}};

document.addEventListener('click',e=>{const b=e.target.closest('[data-sc]');if(b){SC=b.dataset.sc;tab='scan';cat=null;render()}});
})();
