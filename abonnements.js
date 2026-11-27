/* BLING MONEY MUSIC v3 : abonnements Premium, plans, commissions configurables */
(()=>{
const E=esc,F=n=>Number(n||0).toLocaleString('fr-FR')+' FCFA';
const rpc=async(f,a)=>{const {data,error}=await SB.rpc(f,a);if(error)throw error;return data};
const go=m=>{toast(m||'✓ Fait');render()};
const dt=d=>new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
window.PLAN=null;let SUB=null;

/* Plan en vigueur : lu sur le serveur, jamais décidé par l'application */
async function loadPlan(){try{window.PLAN=user?await rpc('my_plan'):'free';SUB=user&&window.PLAN!=='free'?(await SB.from('subscriptions').select('*').eq('user_id',user.id).maybeSingle()).data:null}catch(e){window.PLAN='free'}}
window.loadPlan=loadPlan;
const r0=window.render;
window.render=async function(){if(user&&window.PLAN===null)await loadPlan();if(!user)window.PLAN=null;const x=await r0.apply(this,arguments);pill();return x};
function pill(){const h=$('#hb');if(!h)return;let p=$('#pm');if(!p){h.insertAdjacentHTML('beforebegin','<button id="pm" class="pm" data-go="premium"></button>');p=$('#pm')}
 const prem=window.PLAN&&window.PLAN!=='free';p.textContent=prem?'★ Premium':'Premium';p.classList.toggle('on',!!prem)}

const PERKS={
 free:[['✅','Écouter la musique du catalogue et d’Internet'],['✅','Rechercher et découvrir des artistes'],['✅','Créer des playlists et suivre des profils'],['ℹ️','Avec des publicités']],
 premium:[['✅','Écoute sans publicité'],['✅','Badge Premium sur ton profil'],['🕓','Téléchargements hors ligne réservés Premium (aujourd’hui ouverts à tous)'],['🕓','Qualité audio supérieure : à développer'],['🕓','Avantages exclusifs : à développer']],
 family:[['🕓','Plusieurs profils sous un abonnement commun : à développer']]};

views.premium=async v=>{
 await loadPlan();
 const {data:pl,error}=await SB.from('plans').select('*').order('sort');
 if(error){v.innerHTML='<h2>Premium</h2><p class="m">Les abonnements ne sont pas encore activés sur ce serveur.</p>';return}
 const prem=window.PLAN!=='free';
 v.innerHTML=`<div class="prem big"><span class="k">BLING PREMIUM</span><b>Ta musique, sans interruption.</b><span>Écoute sans publicité et soutiens directement les artistes de la plateforme.</span></div>`+
 (prem&&SUB?`<div class="tile" style="cursor:default;margin:12px 0"><b>★ Abonnement ${E((pl||[]).find(p=>p.code===SUB.plan_code)?.name||'')} ${SUB.status==='cancelled'?'(annulé)':'actif'}</b><span style="white-space:normal">${SUB.status==='cancelled'?'Accès jusqu’au ':'Valable jusqu’au '}${dt(SUB.expires_at)}${SUB.auto_renew?' · renouvellement automatique activé':''}</span>
   <div class="seg" style="margin-top:10px">${SUB.status==='active'?`<button data-sar="${SUB.auto_renew?0:1}">${SUB.auto_renew?'Désactiver le renouvellement':'Activer le renouvellement'}</button><button data-scancel>Annuler l’abonnement</button>`:''}</div></div>`:'')+
 (pl||[]).map(p=>`<div class="tile" style="cursor:default;margin:12px 0"><b style="font-size:19px">${E(p.name)} · ${p.price_month_fcfa?F(p.price_month_fcfa)+' / mois':'0 FCFA'}${!p.active&&p.code!=='free'?' · bientôt':''}</b>${(PERKS[p.code]||[]).map(x=>`<span style="white-space:normal;color:#ddd;margin-top:6px">${x[0]} ${E(x[1])}</span>`).join('')}
   ${p.code!=='free'&&p.active?`<div class="seg" style="margin-top:12px">${[1,3,12].map(m=>`<button data-ssub="${p.code}|${m}|${p.price_month_fcfa*m}">${m} mois · ${F(p.price_month_fcfa*m)}</button>`).join('')}</div>`:''}</div>`).join('')+
 `<p class="m" style="font-size:12px">Paiement avec ton portefeuille BLING WALLET (un mois = 30 jours). Tu peux annuler à tout moment : l’accès reste ouvert jusqu’à la fin de la période payée. Pas de remboursement automatique de la période en cours.</p><button class="btn s" data-go="wallet">💰 Aller au portefeuille</button>`;
 v.onclick=async e=>{const b=e.target.closest('[data-ssub],[data-sar],[data-scancel]');if(!b)return;const d=b.dataset;
  try{if(d.ssub){if(!user)return toast('Connecte-toi pour t’abonner');const [c,m,p]=d.ssub.split('|');if(!confirm('Payer '+F(p)+' pour '+m+' mois, avec ton portefeuille ?'))return;await rpc('subscribe',{p_plan:c,p_months:+m});window.PLAN=null;adReset();go('Bienvenue dans Premium ★')}
   else if(d.sar!==undefined){await rpc('set_auto_renew',{p_on:d.sar==='1'});window.PLAN=null;go()}
   else if('scancel' in d){if(!confirm('Annuler ? Tu gardes l’accès jusqu’à la fin de la période payée.'))return;await rpc('cancel_subscription');window.PLAN=null;go('Abonnement annulé')}
  }catch(x){toast(x.message)}};
};
const adReset=()=>{try{if(typeof adC!=='undefined')Object.keys(adC).forEach(k=>adC[k]=null)}catch(e){}};

/* ---------- Administration : abonnements, plans et commissions ---------- */
const SN={music_commission_pct:'Commission sur la vente de musique (%)',gift_commission_pct:'Commission sur les cadeaux virtuels (%)',concert_commission_pct:'Commission sur les billets de concert (%)',beat_commission_pct:'Commission sur les instrumentales (%)',min_withdrawal_fcfa:'Retrait minimum (FCFA)'};
views.plansadmin=async v=>{
 if(profile?.role!=='admin'){v.innerHTML='<p class="m">Accès réservé à l’administrateur.</p>';return}
 const [st,pl,ov]=await Promise.all([SB.rpc('admin_settings'),SB.from('plans').select('*').order('sort'),SB.rpc('subscriptions_overview')]);
 if(st.error)throw st.error;const o=ov.data||{};
 v.innerHTML=`<h2>💳 Abonnements et commissions</h2><div class="tl">${[[o.actifs||0,'abonnés Premium actifs'],[o.annules||0,'annulés (accès en cours)'],[o.expires||0,'expirés'],[F(o.revenus_fcfa),'revenus d’abonnements']].map(x=>`<div class="tile" style="cursor:default"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>
 <h2>Commissions de la plateforme</h2><p class="m" style="font-size:12px">Appliquées immédiatement aux prochaines transactions. Les transactions passées ne changent pas.</p>
 ${(st.data||[]).filter(s=>SN[s.key]).map(s=>`<div class="row"><div class="tx"><b>${SN[s.key]}</b></div><input type="number" step="1" value="${s.value}" data-sv="${s.key}" style="width:90px;margin:0"><button class="ic" data-ssave="${s.key}">OK</button></div>`).join('')}
 <h2>Plans</h2>${(pl.data||[]).filter(p=>p.code!=='free').map(p=>`<div class="row"><div class="tx"><b>${E(p.name)}</b><span>${p.active?'Ouvert à la vente':'Désactivé'}</span></div><input type="number" value="${p.price_month_fcfa}" data-pv="${p.code}" style="width:100px;margin:0"><button class="ic" data-psave="${p.code}|${p.active?1:0}">OK</button><button class="ic" data-psave="${p.code}|${p.active?0:1}|t">${p.active?'⏸':'▶'}</button></div>`).join('')}
 <p class="m" style="font-size:12px">Prix par mois en FCFA. Le plan Famille reste désactivé tant que les profils multiples ne sont pas développés.</p>
 <h2>Renouvellements</h2><p class="m" style="font-size:12px">Prélève les abonnements à renouvellement automatique arrivés à échéance et passe les abonnements dépassés en « expiré ». Pour que ce soit automatique chaque jour, il faut planifier cette opération sur le serveur (pg_cron) : à configurer.</p><button class="btn s" data-srenew>Traiter les renouvellements maintenant</button>`;
 v.onclick=async e=>{const b=e.target.closest('[data-ssave],[data-psave],[data-srenew]');if(!b)return;const d=b.dataset;
  try{if(d.ssave){const x=v.querySelector(`[data-sv="${d.ssave}"]`).value;await rpc('set_setting',{p_key:d.ssave,p_value:+x});go('Réglage enregistré')}
   else if(d.psave){const [c,a,t]=d.psave.split('|');const p=+v.querySelector(`[data-pv="${c}"]`).value;await rpc('set_plan',{p_code:c,p_price:p,p_active:a==='1'});go('Plan mis à jour')}
   else if('srenew' in d){const r=await rpc('renew_due');go(`Renouvelés : ${r.renouveles} · échecs : ${r.echecs} · expirés : ${r.expires}`)}
  }catch(x){toast(x.message)}};
};
})();
