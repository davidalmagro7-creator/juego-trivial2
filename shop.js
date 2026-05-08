/* ═══════════════════════════════════════════════════
   shop.js — Tienda del juego
   Separado de index.html sin cambiar lógica ni precios.

   DEPENDENCIAS (deben existir en index.html antes de cargar este script):
     · showXPToast(msg)          — notificaciones flotantes
     · showSection(name)         — navegación entre secciones
     · switchMainMissionSection(tab) — navegar al Pase Estelar
     · getXPData()               — datos de XP/nivel (para getBPLevel)
     · updateCoinDisplay()       — actualiza contador de monedas en HUD
     · renderStyleTab()          — re-render pestaña de estilo (robots)

   USO EN index.html:
     Elimina el bloque de código correspondiente y añade ANTES de </body>:
       <script src="shop.js"></script>
═══════════════════════════════════════════════════ */

// Coin persistence — delegates to GameState (defined in gameState.js)
function getCoins()       { return GameState.coins.get(); }
function setCoins(n)      { GameState.coins.set(n); updateCoinDisplay(); }
function addCoins(amount) {
  GameState.coins.add(amount);
  updateCoinDisplay();
  const el = document.getElementById('coin-counter');
  if (el) { el.classList.remove('coin-bump'); void el.offsetWidth; el.classList.add('coin-bump'); }
}
function updateCoinDisplay() {
  const c = GameState.coins.get();
  const disp = document.getElementById('coin-display');
  if (disp) disp.textContent = c;
  const big = document.getElementById('coins-big');
  if (big) big.textContent = c;
  const sc = document.getElementById('store-coins');
  if (sc) sc.textContent = c;
}

/* ═══════════════════════════════════════════════════
   STORE SYSTEM
═══════════════════════════════════════════════════ */

const AVATARS = [
  { id: 'default',       emoji: '😎', name: 'Por defecto',    price: 0,   rarity: 'common' },
  { id: 'wizard',        emoji: '🧙', name: 'Mago',           price: 80,  rarity: 'rare' },
  { id: 'robot',         emoji: '🤖', name: 'Robot',          price: 60,  rarity: 'rare' },
  { id: 'ninja',         emoji: '🥷', name: 'Ninja',          price: 100, rarity: 'rare' },
  { id: 'alien',         emoji: '👽', name: 'Alien',          price: 120, rarity: 'epic' },
  { id: 'fire',          emoji: '🔥', name: 'Llama',          price: 50,  rarity: 'common' },
  { id: 'crown',         emoji: '👑', name: 'Corona',         price: 200, rarity: 'legend' },
  { id: 'brain',         emoji: '🧠', name: 'Cerebro',        price: 70,  rarity: 'rare' },
  { id: 'ghost',         emoji: '👻', name: 'Fantasma',       price: 45,  rarity: 'common' },
  { id: 'cat',           emoji: '🐱', name: 'Gatito',         price: 30,  rarity: 'common' },
  { id: 'dragon',        emoji: '🐉', name: 'Dragón',         price: 150, rarity: 'epic' },
  { id: 'unicorn',       emoji: '🦄', name: 'Unicornio',      price: 180, rarity: 'epic' },
  // ─── Pase Estelar exclusivos ───
  { id: 'star_avatar',       emoji: '🌠', name: 'Estrella',       price: 0, rarity: 'rare',   bpLevel: 2,  bp: true },
  { id: 'astronaut_avatar',  emoji: '🚀', name: 'Astronauta',     price: 0, rarity: 'epic',   bpLevel: 7,  bp: true },
  { id: 'saturn_avatar',     emoji: '🪐', name: 'Saturno',        price: 0, rarity: 'epic',   bpLevel: 13, bp: true },
  { id: 'comet_avatar',      emoji: '☄️', name: 'Cometa',        price: 0, rarity: 'legend', bpLevel: 19, bp: true },
  { id: 'alien_avatar',      emoji: '👾', name: 'Alienígena',     price: 0, rarity: 'legend', bpLevel: 25, bp: true },
  { id: 'legend_avatar',     emoji: '✨', name: 'LEYENDA CÓSMICA',price: 0, rarity: 'legend', bpLevel: 30, bp: true },
];

// ── Wrappers globales para funciones del Pase Estelar ──
// getBPLevel y getBPClaimed se definen dentro de un IIFE posterior.
// Estas versiones seguras permiten usarlas antes de que ese IIFE se ejecute.
function getBPLevel() {
  if (typeof getXPData === 'function') {
    try {
      const xpData = getXPData();
      const MAX = 30;
      return Math.min(xpData.level || 1, MAX);
    } catch(e) {}
  }
  return 1;
}
function getBPClaimed() {
  return GameState.battlePass.getClaimed();
}

function getStoreData()  { return GameState.inventory.avatars.get(); }
function saveStoreData(d){ GameState.inventory.avatars.save(d); }

let _buyTarget = null;

function renderStore() {
  const store = getStoreData();
  const coins = getCoins();

  // Update balance
  const sc = document.getElementById('store-coins');
  if (sc) sc.textContent = coins;

  const grid = document.getElementById('avatar-grid');
  if (!grid) return;

  grid.innerHTML = AVATARS.map(av => {
    const owned    = store.owned.includes(av.id);
    const equipped = store.equipped === av.id;
    const canAfford = coins >= av.price;
    const isBP = av.bp === true;
    const bpLevel = isBP ? getBPLevel() : 0;
    const bpUnlocked = isBP ? bpLevel >= av.bpLevel : true;
    const bpClaimed = isBP ? getBPClaimed().includes(av.bpLevel) : false;

    let stateClass = '';
    if (equipped) stateClass = 'equipped';
    else if (owned || bpClaimed) stateClass = 'owned';
    else if (isBP && !bpUnlocked) stateClass = 'locked';
    else if (!isBP && !canAfford) stateClass = 'locked';

    let priceHtml = '';
    if (equipped) priceHtml = `<div class="avatar-price equipped-label">✓ Equipado</div>`;
    else if (owned || bpClaimed) priceHtml = `<div class="avatar-price owned-label">✓ En posesión</div>`;
    else if (isBP && !bpUnlocked) priceHtml = `<div class="avatar-price" style="color:rgba(167,139,250,0.5);font-size:10px">⭐ Pase Nv.${av.bpLevel}</div>`;
    else if (isBP && bpUnlocked) priceHtml = `<div class="avatar-price" style="color:#a78bfa">⭐ ¡Reclamar!</div>`;
    else if (av.price === 0) priceHtml = `<div class="avatar-price free">Gratis</div>`;
    else priceHtml = `<div class="avatar-price${!canAfford?' locked-price':''}">🪙 ${av.price}</div>`;

    const rarDotColors  = { common: 'rar-common', rare: 'rar-rare', epic: 'rar-epic', legend: 'rar-legend' };
    const rarCardClass  = { common: 'rar-card-common', rare: 'rar-card-rare', epic: 'rar-card-epic', legend: 'rar-card-legend' };
    const rarBadgeClass = { common: 'rar-badge-common', rare: 'rar-badge-rare', epic: 'rar-badge-epic', legend: 'rar-badge-legend' };
    const rarBadgeLabel = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legend: '✦ LEGENDARIO ✦' };
    const rarRings      = { common: 1, rare: 2, epic: 2, legend: 2 };
    const rarParticles  = { common: 3, rare: 5, epic: 8, legend: 12 };
    const platColors    = { common: ['#52527a','rgba(138,138,176,0.6)','rgba(138,138,176,0.2)'], rare: ['#4030c0','rgba(124,109,255,0.85)','rgba(124,109,255,0.32)'], epic: ['#b01050','rgba(244,63,143,0.95)','rgba(244,63,143,0.38)'], legend: ['#cc8800','rgba(255,184,0,1)','rgba(255,140,0,0.55)'] };

    const rar = av.rarity || 'common';
    const pc  = platColors[rar] || platColors.common;
    const ringsCount     = rarRings[rar] || 1;
    const particlesCount = rarParticles[rar] || 3;

    // Genera rings HTML
    let ringsHtml = '';
    for (let i = 1; i <= ringsCount; i++) ringsHtml += `<div class="avatar-ring avatar-ring-${i}"></div>`;

    // Genera partículas HTML
    let particlesHtml = '<div class="rar-particles">';
    for (let i = 0; i < particlesCount; i++) {
      const x     = (15 + Math.random() * 70).toFixed(1);
      const dur   = (2.0 + Math.random() * 2.2).toFixed(2);
      const del   = (Math.random() * 3).toFixed(2);
      const drift = ((Math.random() - 0.5) * 24).toFixed(1);
      particlesHtml += `<span class="rar-particle" style="left:${x}%;bottom:22%;--dur:${dur}s;--delay:${del}s;--drift:${drift}px"></span>`;
    }
    particlesHtml += '</div>';

    const bpBadge = isBP ? `<div style="position:absolute;top:5px;left:5px;font-size:8px;font-weight:800;letter-spacing:0.06em;padding:2px 5px;border-radius:99px;background:linear-gradient(135deg,rgba(167,139,250,0.9),rgba(96,165,250,0.8));color:#fff;border:1px solid rgba(167,139,250,0.8);box-shadow:0 0 8px rgba(167,139,250,0.4)">⭐PASE</div>` : '';

    return `<div class="avatar-card ${stateClass} ${rarCardClass[rar] || ''}" onclick="onAvatarClick('${av.id}')">
      ${bpBadge}
      <span class="avatar-rarity-dot ${rarDotColors[rar] || 'rar-common'}"></span>
      <span class="avatar-emoji">${av.emoji}</span>
      <div class="avatar-rarity-badge ${rarBadgeClass[rar] || 'rar-badge-common'}">${rarBadgeLabel[rar] || 'COMÚN'}</div>
      <div class="avatar-name">${av.name}</div>
      ${priceHtml}
      <div class="avatar-platform" style="--plat-color:${pc[0]};--plat-glow:${pc[1]};--plat-glow2:${pc[2]}"></div>
      ${ringsHtml}
      ${particlesHtml}
    </div>`;
  }).join('');

  // Also update the avatar display in rank HUD
  updateAvatarHUD();
}

function onAvatarClick(id) {
  const store = getStoreData();
  const av = AVATARS.find(a => a.id === id);
  if (!av) return;

  if (store.equipped === id) return;

  // Handle BP avatars
  if (av.bp) {
    const bpLevel = getBPLevel();
    const bpClaimed = getBPClaimed();
    if (!bpClaimed.includes(av.bpLevel)) {
      if (bpLevel >= av.bpLevel) {
        // Unlock via BP → go to missions/BP
        showXPToast(`⭐ ¡Reclama el Pase Estelar Nv.${av.bpLevel} para desbloquear!`);
        setTimeout(() => { showSection('missions'); switchMainMissionSection('battlepass'); }, 800);
      } else {
        showXPToast(`🔒 Necesitas Pase Estelar Nv.${av.bpLevel}`);
      }
      return;
    }
    // It's been claimed via BP — add to owned and equip
    if (!store.owned.includes(id)) store.owned.push(id);
    store.equipped = id;
    saveStoreData(store);
    renderStore();
    updateAvatarHUD();
    showXPToast(`Avatar ${av.emoji} ${av.name} equipado`);
    return;
  }

  if (store.owned.includes(id)) {
    store.equipped = id;
    saveStoreData(store);
    renderStore();
    updateAvatarHUD();
    showXPToast(`Avatar ${av.emoji} ${av.name} equipado`);
    return;
  }

  // Open buy modal
  _buyTarget = id;
  document.getElementById('buy-modal-emoji').textContent = av.emoji;
  document.getElementById('buy-modal-name').textContent  = av.name;
  document.getElementById('buy-modal-price').textContent = av.price;
  document.getElementById('buy-modal-err').textContent   = '';
  document.getElementById('buy-modal').classList.add('show');
}

function confirmBuyAvatar() {
  if (!_buyTarget) return;
  const av = AVATARS.find(a => a.id === _buyTarget);
  if (!av) return;

  const coins = getCoins();
  if (coins < av.price) {
    document.getElementById('buy-modal-err').textContent = '¡No tienes suficientes monedas!';
    return;
  }

  // Deduct coins, add to owned, equip
  addCoins(-av.price);
  const store = getStoreData();
  if (!store.owned.includes(av.id)) store.owned.push(av.id);
  store.equipped = av.id;
  saveStoreData(store);
  closeBuyModal();
  renderStore();
  updateCoinDisplay();
  updateAvatarHUD();
  showXPToast(`🎉 ¡Compraste ${av.emoji} ${av.name}!`);
}

function closeBuyModal() {
  document.getElementById('buy-modal').classList.remove('show');
  _buyTarget = null;
}

function getEquippedAvatar() {
  const store = getStoreData();
  return AVATARS.find(a => a.id === store.equipped) || AVATARS[0];
}

function updateAvatarHUD() {
  const av = getEquippedAvatar();
  // Update top tab rank icon (show avatar emoji)
  const emblem = document.getElementById('hud-rank-emblem');
  if (emblem) emblem.textContent = av.emoji;
  // Also update rank badge avatar in rank section
  const bigEmb = document.getElementById('rank-big-emblem');
  if (bigEmb && av.id !== 'default') {
    // Keep rank emblem as is for the profile section unless they have a non-default avatar
  }
}

window.onAvatarClick     = onAvatarClick;
window.confirmBuyAvatar  = confirmBuyAvatar;
window.closeBuyModal     = closeBuyModal;


/* ═══════════════════════════════════════════════════
   BACKGROUND SYSTEM — Fondos personalizables
═══════════════════════════════════════════════════ */

// Definición de fondos disponibles
const BACKGROUNDS = [
  {
    id: 'default',
    name: 'Espacio Oscuro',
    price: 0,
    rarity: 'common',
    desc: 'El fondo original de la aventura',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs><radialGradient id="bg0g" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#1a0f40"/><stop offset="100%" stop-color="#050510"/></radialGradient></defs>
      <rect width="320" height="140" fill="url(#bg0g)"/>
      <circle cx="30" cy="20" r="1.2" fill="white" opacity="0.7"/><circle cx="80" cy="45" r="0.8" fill="white" opacity="0.5"/>
      <circle cx="140" cy="15" r="1" fill="white" opacity="0.6"/><circle cx="200" cy="55" r="1.5" fill="white" opacity="0.4"/>
      <circle cx="260" cy="30" r="1" fill="white" opacity="0.6"/><circle cx="290" cy="70" r="0.8" fill="white" opacity="0.5"/>
      <circle cx="50" cy="80" r="1.2" fill="#c4b5fd" opacity="0.4"/><circle cx="170" cy="90" r="1" fill="#93c5fd" opacity="0.4"/>
      <circle cx="310" cy="110" r="1.5" fill="white" opacity="0.3"/>
    </svg>`,
    apply: () => { /* default — no background override */ }
  },

  // ── COMÚN: Planeta Volcánico Rojo ──
  {
    id: 'volcano',
    name: 'Planeta Volcánico',
    price: 80,
    rarity: 'common',
    desc: 'Mundo ardiente de lava y cráteres en erupción',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_volc1" cx="50%" cy="85%" r="70%"><stop offset="0%" stop-color="#dc2626" stop-opacity="0.9"/><stop offset="100%" stop-color="#0a0000" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_volc2" cx="50%" cy="100%" r="55%"><stop offset="0%" stop-color="#f97316" stop-opacity="0.6"/><stop offset="100%" stop-color="#0a0000" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_volc3" cx="50%" cy="100%" r="30%"><stop offset="0%" stop-color="#fbbf24" stop-opacity="0.5"/><stop offset="100%" stop-color="#0a0000" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#060000"/>
      <rect width="320" height="140" fill="url(#pv_volc1)"/>
      <rect width="320" height="140" fill="url(#pv_volc2)"/>
      <rect width="320" height="140" fill="url(#pv_volc3)"/>
      <!-- mountain silhouettes -->
      <polygon points="0,140 60,60 120,140" fill="#0d0000"/>
      <polygon points="80,140 160,40 240,140" fill="#100000"/>
      <polygon points="200,140 270,65 320,140" fill="#0d0000"/>
      <!-- lava rivers -->
      <path d="M60,140 Q90,110 120,130 Q150,150 180,115 Q210,95 240,120 Q270,140 320,125" stroke="rgba(251,146,60,0.7)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M0,130 Q50,115 80,135 Q120,155 155,120" stroke="rgba(220,38,38,0.5)" stroke-width="1.5" fill="none"/>
      <!-- crater glow -->
      <ellipse cx="160" cy="42" rx="18" ry="8" fill="rgba(251,146,60,0.3)" />
      <ellipse cx="160" cy="42" rx="8" ry="4" fill="rgba(253,224,71,0.5)"/>
      <!-- embers -->
      <circle cx="130" cy="65" r="2" fill="rgba(251,146,60,0.8)"/><circle cx="175" cy="55" r="1.5" fill="rgba(253,224,71,0.7)"/>
      <circle cx="145" cy="48" r="1.2" fill="rgba(248,113,113,0.6)"/><circle cx="195" cy="70" r="2" fill="rgba(251,146,60,0.5)"/>
      <circle cx="108" cy="80" r="1.8" fill="rgba(253,224,71,0.4)"/><circle cx="220" cy="58" r="1.5" fill="rgba(248,113,113,0.6)"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      let embers = Array.from({length:35}, () => ({
        x: 0, y: 0, r: 0.8 + Math.random()*2.2,
        vy: -(0.4 + Math.random()*1.2), vx: (Math.random()-0.5)*0.8,
        life: Math.random(), maxLife: 0.7+Math.random()*0.3,
        color: ['rgba(251,146,60,','rgba(248,113,113,','rgba(253,224,71,'][Math.floor(Math.random()*3)],
        init: false
      }));
      function draw() {
        if (_bgToken !== token) return;
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0,0,w,h);
        // Deep dark red sky
        ctx.fillStyle = '#060000'; ctx.fillRect(0,0,w,h);
        const g1 = ctx.createRadialGradient(w*0.5, h*0.9, 0, w*0.5, h*0.9, w*0.8);
        g1.addColorStop(0,'rgba(220,38,38,0.55)'); g1.addColorStop(0.5,'rgba(120,10,5,0.2)'); g1.addColorStop(1,'rgba(6,0,0,0)');
        ctx.fillStyle = g1; ctx.fillRect(0,0,w,h);
        const g2 = ctx.createRadialGradient(w*0.5, h, 0, w*0.5, h, w*0.4);
        g2.addColorStop(0,'rgba(249,115,22,0.4)'); g2.addColorStop(1,'rgba(6,0,0,0)');
        ctx.fillStyle = g2; ctx.fillRect(0,0,w,h);
        // Crater glow pulse
        const t = Date.now()*0.001;
        const pulse = 0.5+0.5*Math.sin(t*1.8);
        const gc = ctx.createRadialGradient(w*0.5, h*0.3, 0, w*0.5, h*0.3, w*0.18);
        gc.addColorStop(0,`rgba(253,224,71,${0.35+0.2*pulse})`); gc.addColorStop(0.5,`rgba(251,146,60,${0.2+0.1*pulse})`); gc.addColorStop(1,'rgba(220,38,38,0)');
        ctx.fillStyle = gc; ctx.fillRect(0,0,w,h);
        // Mountains
        ctx.fillStyle = '#0a0000';
        ctx.beginPath(); ctx.moveTo(0,h); ctx.lineTo(w*0.18,h*0.42); ctx.lineTo(w*0.36,h); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w*0.25,h); ctx.lineTo(w*0.5,h*0.28); ctx.lineTo(w*0.75,h); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w*0.62,h); ctx.lineTo(w*0.82,h*0.44); ctx.lineTo(w,h); ctx.fill();
        // Lava river
        ctx.beginPath(); ctx.moveTo(0,h*0.88);
        for(let x=0;x<=w;x+=20) { ctx.lineTo(x, h*(0.88 + 0.06*Math.sin(x*0.04+t*2))); }
        ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
        ctx.fillStyle = `rgba(251,146,60,${0.35+0.15*Math.sin(t*1.5)})`; ctx.fill();
        // Embers rising
        embers.forEach(e => {
          if (!e.init) { e.x=Math.random()*w; e.y=h*(0.5+Math.random()*0.5); e.init=true; }
          e.x+=e.vx; e.y+=e.vy; e.life-=0.006;
          if (e.life<=0||e.y<-10) { e.x=w*0.3+Math.random()*w*0.4; e.y=h*(0.7+Math.random()*0.3); e.life=e.maxLife; }
          const a = Math.min(1,e.life*2.5);
          ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2);
          ctx.fillStyle = e.color+a+')'; ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
  },

  // ── RARO: Nebulosa Cósmica ──
  {
    id: 'nebula',
    name: 'Nebulosa Cósmica',
    price: 130,
    rarity: 'rare',
    desc: 'Espacio profundo con nubes de gas y estrellas vibrantes',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_neb1" cx="28%" cy="42%" r="55%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.85"/><stop offset="100%" stop-color="#04010f" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_neb2" cx="72%" cy="62%" r="50%"><stop offset="0%" stop-color="#0369a1" stop-opacity="0.75"/><stop offset="100%" stop-color="#04010f" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_neb3" cx="55%" cy="25%" r="35%"><stop offset="0%" stop-color="#db2777" stop-opacity="0.5"/><stop offset="100%" stop-color="#04010f" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#04010f"/>
      <rect width="320" height="140" fill="url(#pv_neb1)"/>
      <rect width="320" height="140" fill="url(#pv_neb2)"/>
      <rect width="320" height="140" fill="url(#pv_neb3)"/>
      <!-- nebula wisps -->
      <ellipse cx="95" cy="68" rx="70" ry="28" fill="rgba(139,92,246,0.18)" transform="rotate(-18,95,68)"/>
      <ellipse cx="230" cy="88" rx="60" ry="22" fill="rgba(6,95,184,0.15)" transform="rotate(12,230,88)"/>
      <ellipse cx="170" cy="30" rx="50" ry="18" fill="rgba(219,39,119,0.12)" transform="rotate(-8,170,30)"/>
      <!-- bright stars -->
      <circle cx="42" cy="18" r="1.8" fill="white" opacity="0.9"/><circle cx="98" cy="10" r="1.3" fill="#e0d9ff" opacity="0.8"/>
      <circle cx="158" cy="22" r="2" fill="white" opacity="0.95"/><circle cx="224" cy="14" r="1.5" fill="#bfdbfe" opacity="0.85"/>
      <circle cx="285" cy="28" r="1.8" fill="white" opacity="0.8"/><circle cx="55" cy="95" r="1.2" fill="#c4b5fd" opacity="0.7"/>
      <circle cx="135" cy="105" r="1.5" fill="white" opacity="0.6"/><circle cx="268" cy="78" r="1.3" fill="#93c5fd" opacity="0.75"/>
      <circle cx="310" cy="55" r="1.8" fill="white" opacity="0.7"/><circle cx="190" cy="120" r="1" fill="#c4b5fd" opacity="0.55"/>
      <!-- star clusters -->
      <circle cx="110" cy="48" r="0.7" fill="white" opacity="0.6"/><circle cx="115" cy="52" r="0.5" fill="white" opacity="0.5"/>
      <circle cx="108" cy="54" r="0.6" fill="#c4b5fd" opacity="0.6"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const stars = Array.from({length:90}, () => ({
        x: Math.random(), y: Math.random(),
        r: 0.4+Math.random()*1.8, phase: Math.random()*Math.PI*2,
        speed: 0.005+Math.random()*0.015,
        color: ['rgba(255,255,255,','rgba(196,181,253,','rgba(147,197,253,','rgba(219,39,119,'][Math.floor(Math.random()*4)]
      }));
      function draw() {
        if (_bgToken !== token) return;
        const w = canvas.width, h = canvas.height;
        const t = Date.now()*0.0006;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#04010f'; ctx.fillRect(0,0,w,h);
        // Nebula clouds — 3 shifting blobs
        const blobs = [
          { x:0.28+0.06*Math.sin(t*0.7), y:0.42+0.05*Math.cos(t*0.5), r:0.58, c:'rgba(124,58,237,' },
          { x:0.72+0.05*Math.cos(t*0.6), y:0.62+0.06*Math.sin(t*0.4), r:0.52, c:'rgba(3,105,161,' },
          { x:0.52+0.07*Math.sin(t*0.9), y:0.22+0.04*Math.cos(t*0.8), r:0.38, c:'rgba(219,39,119,' },
        ];
        blobs.forEach(b => {
          const g = ctx.createRadialGradient(w*b.x,h*b.y,0,w*b.x,h*b.y,w*b.r);
          g.addColorStop(0,b.c+'0.48)'); g.addColorStop(0.5,b.c+'0.18)'); g.addColorStop(1,b.c+'0)');
          ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        });
        // Stars twinkling
        stars.forEach(s => {
          s.phase += s.speed;
          const a = 0.35+0.65*Math.abs(Math.sin(s.phase));
          ctx.beginPath(); ctx.arc(s.x*w, s.y*h, s.r, 0, Math.PI*2);
          ctx.fillStyle = s.color+a+')'; ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
  },

  // ── RARO: Campo de Asteroides Mágico ──
  {
    id: 'asteroids',
    name: 'Campo de Asteroides',
    price: 160,
    rarity: 'rare',
    desc: 'Cinturón de rocas espaciales flotando en el cosmos',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_ast1" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.9"/><stop offset="100%" stop-color="#030208" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_ast2" cx="20%" cy="30%" r="40%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.4"/><stop offset="100%" stop-color="#030208" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_ast3" cx="80%" cy="70%" r="35%"><stop offset="0%" stop-color="#0e7490" stop-opacity="0.35"/><stop offset="100%" stop-color="#030208" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#030208"/>
      <rect width="320" height="140" fill="url(#pv_ast1)"/>
      <rect width="320" height="140" fill="url(#pv_ast2)"/>
      <rect width="320" height="140" fill="url(#pv_ast3)"/>
      <!-- asteroid rocks -->
      <ellipse cx="55" cy="45" rx="14" ry="9" fill="#1e1b2e" stroke="rgba(139,92,246,0.5)" stroke-width="0.8" transform="rotate(-20,55,45)"/>
      <ellipse cx="130" cy="95" rx="18" ry="11" fill="#1a1830" stroke="rgba(99,102,241,0.45)" stroke-width="0.8" transform="rotate(15,130,95)"/>
      <ellipse cx="200" cy="35" rx="12" ry="7" fill="#1c1a2e" stroke="rgba(139,92,246,0.4)" stroke-width="0.7" transform="rotate(-35,200,35)"/>
      <ellipse cx="270" cy="80" rx="16" ry="10" fill="#1a1730" stroke="rgba(99,102,241,0.5)" stroke-width="0.8" transform="rotate(25,270,80)"/>
      <ellipse cx="90" cy="115" rx="10" ry="6" fill="#1e1b2e" stroke="rgba(139,92,246,0.35)" stroke-width="0.6" transform="rotate(-10,90,115)"/>
      <ellipse cx="300" cy="30" rx="8" ry="5" fill="#1c192e" stroke="rgba(99,102,241,0.4)" stroke-width="0.6" transform="rotate(40,300,30)"/>
      <!-- glowing crystal veins on asteroids -->
      <line x1="48" y1="42" x2="62" y2="48" stroke="rgba(139,92,246,0.6)" stroke-width="0.8"/>
      <line x1="122" y1="91" x2="138" y2="99" stroke="rgba(99,102,241,0.55)" stroke-width="0.7"/>
      <!-- stars -->
      <circle cx="20" cy="20" r="1" fill="white" opacity="0.7"/><circle cx="160" cy="15" r="1.3" fill="white" opacity="0.65"/>
      <circle cx="240" cy="55" r="0.9" fill="#c4b5fd" opacity="0.6"/><circle cx="310" cy="110" r="1.2" fill="white" opacity="0.5"/>
      <circle cx="75" cy="70" r="0.8" fill="white" opacity="0.55"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      let rocks = Array.from({length:12}, () => ({
        x: Math.random(), y: Math.random(),
        rx: 18+Math.random()*30, ry: 0, rot: Math.random()*Math.PI*2,
        vx: (0.08+Math.random()*0.18)*(Math.random()>0.5?1:-1),
        vy: (0.03+Math.random()*0.08)*(Math.random()>0.5?1:-1),
        rotSpeed: (Math.random()-0.5)*0.005,
        color: ['rgba(139,92,246,','rgba(99,102,241,','rgba(14,116,144,'][Math.floor(Math.random()*3)],
        init:false
      }));
      rocks.forEach(r => { r.ry = r.rx*(0.4+Math.random()*0.35); });
      const stars2 = Array.from({length:80},()=>({x:Math.random(),y:Math.random(),r:0.3+Math.random()*1.2,a:0.3+Math.random()*0.7,ph:Math.random()*Math.PI*2,sp:0.003+Math.random()*0.01}));
      function draw() {
        if (_bgToken !== token) return;
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#030208'; ctx.fillRect(0,0,w,h);
        // Nebula glow
        const t = Date.now()*0.0005;
        const g1 = ctx.createRadialGradient(w*0.2,h*0.3,0,w*0.2,h*0.3,w*0.4);
        g1.addColorStop(0,'rgba(124,58,237,0.22)'); g1.addColorStop(1,'rgba(3,2,8,0)');
        ctx.fillStyle=g1; ctx.fillRect(0,0,w,h);
        const g2 = ctx.createRadialGradient(w*0.8,h*0.7,0,w*0.8,h*0.7,w*0.35);
        g2.addColorStop(0,'rgba(14,116,144,0.2)'); g2.addColorStop(1,'rgba(3,2,8,0)');
        ctx.fillStyle=g2; ctx.fillRect(0,0,w,h);
        // Stars
        stars2.forEach(s => { s.ph+=s.sp; const a=s.a*(0.5+0.5*Math.abs(Math.sin(s.ph))); ctx.beginPath(); ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2); ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.fill(); });
        // Asteroids
        rocks.forEach(r => {
          if (!r.init) { r.init=true; }
          r.x += r.vx/w*0.5; r.y += r.vy/h*0.5; r.rot += r.rotSpeed;
          if(r.x<-0.1) r.x=1.1; if(r.x>1.1) r.x=-0.1;
          if(r.y<-0.1) r.y=1.1; if(r.y>1.1) r.y=-0.1;
          ctx.save(); ctx.translate(r.x*w, r.y*h); ctx.rotate(r.rot);
          ctx.beginPath(); ctx.ellipse(0,0,r.rx,r.ry,0,0,Math.PI*2);
          ctx.fillStyle='#12101f'; ctx.fill();
          ctx.strokeStyle=r.color+'0.6)'; ctx.lineWidth=0.9; ctx.stroke();
          // crystal vein
          ctx.beginPath(); ctx.moveTo(-r.rx*0.4,-r.ry*0.2); ctx.lineTo(r.rx*0.3,r.ry*0.3);
          ctx.strokeStyle=r.color+'0.7)'; ctx.lineWidth=0.7; ctx.stroke();
          ctx.restore();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
  },

  // ── ÉPICO: Planeta Cristalino Azul ──
  {
    id: 'crystal',
    name: 'Planeta Cristalino',
    price: 200,
    rarity: 'epic',
    desc: 'Mundo de cristales infinitos bajo una luz etérea azul',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_cry1" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.8"/><stop offset="100%" stop-color="#000510" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_cry2" cx="30%" cy="70%" r="45%"><stop offset="0%" stop-color="#0e7490" stop-opacity="0.5"/><stop offset="100%" stop-color="#000510" stop-opacity="0"/></radialGradient>
        <linearGradient id="pv_cry_floor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0c2a6e" stop-opacity="0.6"/><stop offset="100%" stop-color="#030a1f" stop-opacity="0.9"/></linearGradient>
      </defs>
      <rect width="320" height="140" fill="#000510"/>
      <rect width="320" height="140" fill="url(#pv_cry1)"/>
      <rect width="320" height="140" fill="url(#pv_cry2)"/>
      <!-- crystal spires -->
      <polygon points="40,140 52,68 64,140" fill="rgba(96,165,250,0.2)" stroke="rgba(147,197,253,0.7)" stroke-width="0.8"/>
      <polygon points="55,140 70,50 85,140" fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.6)" stroke-width="0.9"/>
      <polygon points="110,140 120,80 132,140" fill="rgba(99,102,241,0.2)" stroke="rgba(165,180,252,0.65)" stroke-width="0.7"/>
      <polygon points="155,140 168,45 183,140" fill="rgba(96,165,250,0.22)" stroke="rgba(147,197,253,0.75)" stroke-width="1"/>
      <polygon points="210,140 222,62 236,140" fill="rgba(96,165,250,0.18)" stroke="rgba(96,165,250,0.65)" stroke-width="0.8"/>
      <polygon points="255,140 265,72 278,140" fill="rgba(99,102,241,0.2)" stroke="rgba(165,180,252,0.6)" stroke-width="0.7"/>
      <polygon points="290,140 300,55 315,140" fill="rgba(96,165,250,0.15)" stroke="rgba(147,197,253,0.6)" stroke-width="0.8"/>
      <!-- crystal floor reflections -->
      <rect x="0" y="118" width="320" height="22" fill="url(#pv_cry_floor)"/>
      <!-- inner glow of central spire -->
      <ellipse cx="168" cy="46" rx="10" ry="4" fill="rgba(147,197,253,0.5)"/>
      <!-- ambient orbs -->
      <circle cx="90" cy="40" r="8" fill="rgba(96,165,250,0.08)" stroke="rgba(96,165,250,0.3)" stroke-width="0.6"/>
      <circle cx="250" cy="55" r="6" fill="rgba(99,102,241,0.1)" stroke="rgba(165,180,252,0.35)" stroke-width="0.6"/>
      <!-- stars -->
      <circle cx="20" cy="15" r="1" fill="white" opacity="0.6"/><circle cx="180" cy="8" r="1.2" fill="white" opacity="0.5"/><circle cx="310" cy="20" r="0.9" fill="#bfdbfe" opacity="0.6"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      function draw() {
        if (_bgToken !== token) return;
        const w = canvas.width, h = canvas.height;
        const t = Date.now()*0.0005;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#000510'; ctx.fillRect(0,0,w,h);
        // Main ambient glow
        const g1 = ctx.createRadialGradient(w*0.5,h*0.4,0,w*0.5,h*0.4,w*0.75);
        g1.addColorStop(0,'rgba(29,78,216,0.5)'); g1.addColorStop(1,'rgba(0,5,16,0)');
        ctx.fillStyle=g1; ctx.fillRect(0,0,w,h);
        const g2 = ctx.createRadialGradient(w*0.3,h*0.7,0,w*0.3,h*0.7,w*0.45);
        g2.addColorStop(0,'rgba(14,116,144,0.3)'); g2.addColorStop(1,'rgba(0,5,16,0)');
        ctx.fillStyle=g2; ctx.fillRect(0,0,w,h);
        // Pulsing heart glow
        const pulse = 0.5+0.5*Math.sin(t*2.2);
        const gc = ctx.createRadialGradient(w*0.5,h*0.3,0,w*0.5,h*0.3,w*0.25);
        gc.addColorStop(0,`rgba(147,197,253,${0.12+0.08*pulse})`); gc.addColorStop(1,'rgba(0,5,16,0)');
        ctx.fillStyle=gc; ctx.fillRect(0,0,w,h);
        // Crystal spires
        const spires = [
          {x:0.12,h:0.52,w:0.04},{x:0.17,h:0.38,w:0.05},{x:0.32,h:0.6,w:0.037},
          {x:0.5,h:0.28,w:0.047},{x:0.62,h:0.48,w:0.04},{x:0.76,h:0.55,w:0.038},
          {x:0.88,h:0.4,w:0.045},{x:0.23,h:0.58,w:0.03},{x:0.43,h:0.65,w:0.032}
        ];
        spires.forEach((s,i) => {
          const glimmer = 0.5+0.5*Math.sin(t*1.5+i*1.1);
          ctx.beginPath();
          ctx.moveTo(s.x*w-s.w*w*0.5, h);
          ctx.lineTo(s.x*w, h*(s.h - 0.03*Math.sin(t+i)));
          ctx.lineTo(s.x*w+s.w*w*0.5, h);
          ctx.closePath();
          ctx.fillStyle=`rgba(12,42,110,${0.5+0.3*glimmer})`;
          ctx.fill();
          ctx.strokeStyle=`rgba(${i%2===0?'147,197,253':'165,180,252'},${0.4+0.35*glimmer})`;
          ctx.lineWidth=0.9; ctx.stroke();
          // tip glow
          ctx.beginPath(); ctx.arc(s.x*w, h*(s.h-0.03*Math.sin(t+i)), 3+2*glimmer, 0, Math.PI*2);
          ctx.fillStyle=`rgba(147,197,253,${0.3+0.4*glimmer})`; ctx.fill();
        });
        // Floor shimmer
        const gf = ctx.createLinearGradient(0,h*0.82,0,h);
        gf.addColorStop(0,'rgba(14,42,100,0.4)'); gf.addColorStop(1,'rgba(3,10,31,0.7)');
        ctx.fillStyle=gf; ctx.fillRect(0,h*0.82,w,h*0.18);
        requestAnimationFrame(draw);
      }
      draw();
    }
  },

  // ── ÉPICO: Portal Cósmico Abstracto ──
  {
    id: 'portal',
    name: 'Portal Cósmico',
    price: 240,
    rarity: 'epic',
    desc: 'Un vórtice interdimensional de energía pura y color',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_por1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#6d28d9" stop-opacity="0.9"/><stop offset="40%" stop-color="#1e1b4b" stop-opacity="0.6"/><stop offset="100%" stop-color="#020008" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_por2" cx="50%" cy="50%" r="30%"><stop offset="0%" stop-color="#db2777" stop-opacity="0.7"/><stop offset="100%" stop-color="#6d28d9" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_por3" cx="50%" cy="50%" r="15%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#020008"/>
      <rect width="320" height="140" fill="url(#pv_por1)"/>
      <!-- portal rings -->
      <circle cx="160" cy="70" r="55" fill="none" stroke="rgba(167,139,250,0.5)" stroke-width="1.5"/>
      <circle cx="160" cy="70" r="42" fill="none" stroke="rgba(219,39,119,0.45)" stroke-width="1.2"/>
      <circle cx="160" cy="70" r="30" fill="none" stroke="rgba(167,139,250,0.6)" stroke-width="1"/>
      <circle cx="160" cy="70" r="18" fill="none" stroke="rgba(236,72,153,0.7)" stroke-width="1.2"/>
      <!-- energy lines radiating from portal -->
      <line x1="160" y1="15" x2="160" y2="0" stroke="rgba(167,139,250,0.5)" stroke-width="1"/>
      <line x1="198" y1="32" x2="215" y2="18" stroke="rgba(219,39,119,0.4)" stroke-width="0.8"/>
      <line x1="215" y1="70" x2="232" y2="70" stroke="rgba(167,139,250,0.45)" stroke-width="0.8"/>
      <line x1="122" y1="32" x2="105" y2="18" stroke="rgba(219,39,119,0.4)" stroke-width="0.8"/>
      <line x1="105" y1="70" x2="88" y2="70" stroke="rgba(167,139,250,0.45)" stroke-width="0.8"/>
      <!-- portal inner glow -->
      <rect width="320" height="140" fill="url(#pv_por2)"/>
      <rect width="320" height="140" fill="url(#pv_por3)"/>
      <!-- surrounding stars -->
      <circle cx="18" cy="12" r="1.2" fill="white" opacity="0.6"/><circle cx="290" cy="22" r="1" fill="white" opacity="0.5"/>
      <circle cx="42" cy="120" r="1.3" fill="#c4b5fd" opacity="0.55"/><circle cx="305" cy="108" r="1" fill="white" opacity="0.5"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const particles = Array.from({length:50},()=>({
        angle: Math.random()*Math.PI*2, dist: 0.05+Math.random()*0.45,
        speed: 0.002+Math.random()*0.008, size: 0.5+Math.random()*2.5,
        color: ['rgba(167,139,250,','rgba(236,72,153,','rgba(45,212,191,','rgba(251,191,36,'][Math.floor(Math.random()*4)],
        opacity: 0.3+Math.random()*0.7
      }));
      function draw() {
        if (_bgToken !== token) return;
        const w = canvas.width, h = canvas.height;
        const t = Date.now()*0.0008;
        const cx = w*0.5, cy = h*0.5;
        const maxR = Math.min(w,h)*0.42;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#020008'; ctx.fillRect(0,0,w,h);
        // Swirling color masses
        [
          {cx:0.5+0.08*Math.sin(t*0.6), cy:0.5+0.08*Math.cos(t*0.5), r:0.5, c:'rgba(109,40,217,'},
          {cx:0.5+0.06*Math.cos(t*0.8), cy:0.5+0.06*Math.sin(t*0.7), r:0.3, c:'rgba(219,39,119,'},
          {cx:0.5+0.04*Math.sin(t*1.1), cy:0.5+0.04*Math.cos(t*0.9), r:0.15, c:'rgba(45,212,191,'},
        ].forEach(b => {
          const g = ctx.createRadialGradient(w*b.cx,h*b.cy,0,w*b.cx,h*b.cy,w*b.r);
          g.addColorStop(0,b.c+'0.6)'); g.addColorStop(0.5,b.c+'0.2)'); g.addColorStop(1,b.c+'0)');
          ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        });
        // Portal rings — rotating
        for(let ring=5; ring>=1; ring--) {
          const r = maxR*(ring/5);
          const rotOff = t*(ring%2===0?1:-1)*0.4;
          ctx.save(); ctx.translate(cx,cy); ctx.rotate(rotOff);
          ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
          const ringA = 0.35+0.25*Math.sin(t*1.5+ring);
          ctx.strokeStyle = ring%2===0 ? `rgba(167,139,250,${ringA})` : `rgba(236,72,153,${ringA})`;
          ctx.lineWidth = 1.2+ring*0.2; ctx.stroke();
          ctx.restore();
        }
        // Bright core
        const core = ctx.createRadialGradient(cx,cy,0,cx,cy,maxR*0.1);
        core.addColorStop(0,`rgba(255,255,255,${0.7+0.3*Math.sin(t*3)})`);
        core.addColorStop(0.5,'rgba(167,139,250,0.4)'); core.addColorStop(1,'rgba(109,40,217,0)');
        ctx.fillStyle=core; ctx.fillRect(0,0,w,h);
        // Orbiting particles
        particles.forEach(p => {
          p.angle += p.speed;
          const px = cx + Math.cos(p.angle)*maxR*p.dist;
          const py = cy + Math.sin(p.angle)*maxR*p.dist;
          ctx.beginPath(); ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=p.color+p.opacity+')'; ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
  },

  // ── LEGENDARIO: Nebulosa Dorada ──
  {
    id: 'golden_nebula',
    name: 'Nebulosa Dorada',
    price: 350,
    rarity: 'legend',
    desc: 'El tesoro más raro del cosmos: una nebulosa de oro puro',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_gn1" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#92400e" stop-opacity="0.9"/><stop offset="50%" stop-color="#78350f" stop-opacity="0.5"/><stop offset="100%" stop-color="#050200" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_gn2" cx="35%" cy="40%" r="55%"><stop offset="0%" stop-color="#d97706" stop-opacity="0.7"/><stop offset="100%" stop-color="#050200" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_gn3" cx="65%" cy="60%" r="45%"><stop offset="0%" stop-color="#b45309" stop-opacity="0.5"/><stop offset="100%" stop-color="#050200" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_gn4" cx="50%" cy="50%" r="20%"><stop offset="0%" stop-color="#fef08a" stop-opacity="0.7"/><stop offset="100%" stop-color="#d97706" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#050200"/>
      <rect width="320" height="140" fill="url(#pv_gn1)"/>
      <rect width="320" height="140" fill="url(#pv_gn2)"/>
      <rect width="320" height="140" fill="url(#pv_gn3)"/>
      <rect width="320" height="140" fill="url(#pv_gn4)"/>
      <!-- golden wisps -->
      <ellipse cx="110" cy="55" rx="75" ry="30" fill="rgba(217,119,6,0.2)" transform="rotate(-22,110,55)"/>
      <ellipse cx="220" cy="85" rx="65" ry="22" fill="rgba(180,83,9,0.18)" transform="rotate(14,220,85)"/>
      <ellipse cx="165" cy="35" rx="40" ry="12" fill="rgba(254,240,138,0.15)" transform="rotate(-6,165,35)"/>
      <!-- golden stars -->
      <circle cx="38" cy="20" r="2" fill="#fef08a" opacity="0.95"/><circle cx="92" cy="12" r="1.5" fill="#fde68a" opacity="0.85"/>
      <circle cx="165" cy="18" r="2.5" fill="#fef08a" opacity="1"/><circle cx="238" cy="10" r="1.8" fill="#fde68a" opacity="0.9"/>
      <circle cx="295" cy="25" r="2" fill="#fef08a" opacity="0.85"/><circle cx="60" cy="85" r="1.5" fill="#fde68a" opacity="0.7"/>
      <circle cx="148" cy="100" r="2" fill="#fef08a" opacity="0.75"/><circle cx="270" cy="72" r="1.8" fill="#fde68a" opacity="0.8"/>
      <!-- sparkle crosses -->
      <line x1="165" y1="14" x2="165" y2="22" stroke="#fef08a" stroke-width="0.8" opacity="0.9"/>
      <line x1="161" y1="18" x2="169" y2="18" stroke="#fef08a" stroke-width="0.8" opacity="0.9"/>
      <line x1="38" y1="16" x2="38" y2="24" stroke="#fef08a" stroke-width="0.7" opacity="0.8"/>
      <line x1="34" y1="20" x2="42" y2="20" stroke="#fef08a" stroke-width="0.7" opacity="0.8"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const stars = Array.from({length:120},()=>({
        x:Math.random(),y:Math.random(),r:0.3+Math.random()*2.2,
        phase:Math.random()*Math.PI*2,sp:0.006+Math.random()*0.02,
        gold:Math.random()>0.35
      }));
      const wisps = Array.from({length:6},(_,i)=>({
        angle:i*(Math.PI*2/6), speed:0.0003+i*0.00005,
        rx:0.3+Math.random()*0.25, ry:0.12+Math.random()*0.1,
        opacity:0.12+Math.random()*0.15
      }));
      function draw() {
        if (_bgToken !== token) return;
        const w = canvas.width, h = canvas.height;
        const t = Date.now()*0.0007;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#050200'; ctx.fillRect(0,0,w,h);
        // Base nebula glows
        [
          {x:0.35+0.08*Math.sin(t*0.5),y:0.42+0.07*Math.cos(t*0.4),r:0.65,c:'rgba(146,64,14,',a:0.55},
          {x:0.62+0.07*Math.cos(t*0.6),y:0.58+0.08*Math.sin(t*0.3),r:0.52,c:'rgba(217,119,6,',a:0.45},
          {x:0.50+0.05*Math.sin(t*0.9),y:0.30+0.05*Math.cos(t*0.7),r:0.32,c:'rgba(254,240,138,',a:0.28},
        ].forEach(b=>{
          const g=ctx.createRadialGradient(w*b.x,h*b.y,0,w*b.x,h*b.y,w*b.r);
          g.addColorStop(0,b.c+b.a+')'); g.addColorStop(0.4,b.c+(b.a*0.4)+')'); g.addColorStop(1,b.c+'0)');
          ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        });
        // Rotating wisps
        wisps.forEach(wsp=>{
          wsp.angle+=wsp.speed;
          const wx=w*0.5+Math.cos(wsp.angle)*w*wsp.rx;
          const wy=h*0.5+Math.sin(wsp.angle*0.7)*h*wsp.ry;
          const g=ctx.createRadialGradient(wx,wy,0,wx,wy,w*0.12);
          g.addColorStop(0,`rgba(217,119,6,${wsp.opacity})`);
          g.addColorStop(1,'rgba(217,119,6,0)');
          ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        });
        // Stars with sparkle
        stars.forEach(s=>{
          s.phase+=s.sp;
          const a=0.3+0.7*Math.abs(Math.sin(s.phase));
          const r=s.r*(0.7+0.3*Math.abs(Math.sin(s.phase)));
          ctx.beginPath(); ctx.arc(s.x*w,s.y*h,r,0,Math.PI*2);
          ctx.fillStyle = s.gold ? `rgba(254,240,138,${a})` : `rgba(253,224,71,${a*0.7})`;
          ctx.fill();
          // Sparkle cross on bright stars
          if(s.r>1.6 && Math.abs(Math.sin(s.phase))>0.7){
            const arm=r*3; ctx.strokeStyle=`rgba(254,240,138,${a*0.5})`; ctx.lineWidth=0.6;
            ctx.beginPath(); ctx.moveTo(s.x*w-arm,s.y*h); ctx.lineTo(s.x*w+arm,s.y*h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(s.x*w,s.y*h-arm); ctx.lineTo(s.x*w,s.y*h+arm); ctx.stroke();
          }
        });
        // Central radiance pulse
        const pulse=0.5+0.5*Math.sin(t*1.8);
        const gc=ctx.createRadialGradient(w*0.5,h*0.5,0,w*0.5,h*0.5,w*0.2);
        gc.addColorStop(0,`rgba(254,240,138,${0.12+0.1*pulse})`);
        gc.addColorStop(1,'rgba(146,64,14,0)');
        ctx.fillStyle=gc; ctx.fillRect(0,0,w,h);
        requestAnimationFrame(draw);
      }
      draw();
    }
  },

  // ─── PASE ESTELAR — fondos exclusivos ───────────────────────────────
  {
    id: 'nebula_bg', name: 'Nebulosa Exclusiva',
    price: 0, rarity: 'rare', bp: true, bpLevel: 4,
    desc: 'Fondo exclusivo del Pase Estelar — Nivel 4',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_bpneb1" cx="35%" cy="45%" r="60%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.9"/><stop offset="100%" stop-color="#02000e" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_bpneb2" cx="70%" cy="65%" r="50%"><stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.7"/><stop offset="100%" stop-color="#02000e" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#02000e"/>
      <rect width="320" height="140" fill="url(#pv_bpneb1)"/>
      <rect width="320" height="140" fill="url(#pv_bpneb2)"/>
      <ellipse cx="100" cy="70" rx="75" ry="30" fill="rgba(139,92,246,0.2)" transform="rotate(-15,100,70)"/>
      <ellipse cx="220" cy="60" rx="60" ry="24" fill="rgba(29,78,216,0.18)" transform="rotate(20,220,60)"/>
      <text x="10" y="20" font-size="10" fill="rgba(167,139,250,0.8)" font-family="monospace">★ PASE ESTELAR ★</text>
      <circle cx="45" cy="35" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="150" cy="20" r="1" fill="white" opacity="0.6"/>
      <circle cx="280" cy="45" r="2" fill="white" opacity="0.7"/>
      <circle cx="200" cy="100" r="1.2" fill="#c4b5fd" opacity="0.7"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const stars = Array.from({length:180},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.8+0.3,a:Math.random(),sp:0.003+Math.random()*0.01,ph:Math.random()*Math.PI*2}));
      function draw(){
        if(_bgToken!==token)return;
        const w=canvas.width,h=canvas.height,t=Date.now()*0.0004;
        ctx.clearRect(0,0,w,h);
        const bg=ctx.createLinearGradient(0,0,w,h);
        bg.addColorStop(0,'#03010f');bg.addColorStop(1,'#08041a');
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        [[w*0.35,h*0.45,w*0.55,'rgba(124,58,237,','0.18'],[w*0.7,h*0.65,w*0.45,'rgba(29,78,216,','0.14']].forEach(([x,y,r,c,a])=>{
          const g=ctx.createRadialGradient(x+Math.sin(t)*20,y+Math.cos(t*0.7)*15,0,x,y,r);
          g.addColorStop(0,c+a+')');g.addColorStop(1,c+'0)');
          ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
        });
        stars.forEach(s=>{s.ph+=s.sp;const a=s.a*(0.4+0.6*Math.abs(Math.sin(s.ph)));ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fill();});
        requestAnimationFrame(draw);
      }
      draw();
    }
  },
  {
    id: 'blue_cosmos_bg', name: 'Cosmos Azul',
    price: 0, rarity: 'epic', bp: true, bpLevel: 10,
    desc: 'Fondo exclusivo del Pase Estelar — Nivel 10',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_bc1" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#0369a1" stop-opacity="0.9"/><stop offset="100%" stop-color="#020810" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_bc2" cx="20%" cy="70%" r="45%"><stop offset="0%" stop-color="#0e7490" stop-opacity="0.7"/><stop offset="100%" stop-color="#020810" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#020810"/>
      <rect width="320" height="140" fill="url(#pv_bc1)"/>
      <rect width="320" height="140" fill="url(#pv_bc2)"/>
      <text x="10" y="20" font-size="10" fill="rgba(96,165,250,0.8)" font-family="monospace">★ PASE ESTELAR ★</text>
      <circle cx="160" cy="70" r="35" fill="none" stroke="rgba(96,165,250,0.25)" stroke-width="1" stroke-dasharray="4 3"/>
      <circle cx="160" cy="70" r="22" fill="rgba(96,165,250,0.1)" stroke="rgba(96,165,250,0.4)" stroke-width="0.8"/>
      <circle cx="30" cy="25" r="1.5" fill="white" opacity="0.8"/><circle cx="290" cy="110" r="2" fill="#93c5fd" opacity="0.7"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const stars = Array.from({length:160},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.6+0.3,a:Math.random(),sp:0.004+Math.random()*0.012,ph:Math.random()*Math.PI*2,col:['#fff','#93c5fd','#60a5fa'][Math.floor(Math.random()*3)]}));
      function draw(){
        if(_bgToken!==token)return;
        const w=canvas.width,h=canvas.height,t=Date.now()*0.0003;
        ctx.clearRect(0,0,w,h);
        const bg=ctx.createLinearGradient(0,0,0,h);
        bg.addColorStop(0,'#010810');bg.addColorStop(1,'#020d18');
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        [[w*0.5,h*0.4,w*0.6,'rgba(3,105,161,','0.2'],[w*0.2,h*0.7,w*0.4,'rgba(14,116,144,','0.15']].forEach(([x,y,r,c,a])=>{
          const g=ctx.createRadialGradient(x+Math.sin(t)*18,y+Math.cos(t*0.8)*14,0,x,y,r);
          g.addColorStop(0,c+a+')');g.addColorStop(1,c+'0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
        });
        stars.forEach(s=>{s.ph+=s.sp;const a=s.a*(0.4+0.6*Math.abs(Math.sin(s.ph)));ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle=s.col;ctx.globalAlpha=a;ctx.fill();});
        ctx.globalAlpha=1;
        requestAnimationFrame(draw);
      }
      draw();
    }
  },
  {
    id: 'red_moon_bg', name: 'Luna Roja',
    price: 0, rarity: 'epic', bp: true, bpLevel: 16,
    desc: 'Fondo exclusivo del Pase Estelar — Nivel 16',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_rm1" cx="75%" cy="35%" r="50%"><stop offset="0%" stop-color="#dc2626" stop-opacity="0.8"/><stop offset="100%" stop-color="#0a0101" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_rm2" cx="75%" cy="35%" r="18%"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.6"/><stop offset="100%" stop-color="#dc2626" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#0a0101"/>
      <rect width="320" height="140" fill="url(#pv_rm1)"/>
      <circle cx="240" cy="49" r="30" fill="#1a0606" stroke="rgba(239,68,68,0.5)" stroke-width="1.5"/>
      <circle cx="240" cy="49" r="30" fill="url(#pv_rm2)"/>
      <text x="10" y="20" font-size="10" fill="rgba(248,113,113,0.8)" font-family="monospace">★ PASE ESTELAR ★</text>
      <circle cx="30" cy="55" r="1.5" fill="white" opacity="0.5"/><circle cx="110" cy="90" r="1" fill="#fca5a5" opacity="0.6"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const stars = Array.from({length:150},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.4+0.3,a:Math.random()*0.7+0.1,sp:0.003+Math.random()*0.008,ph:Math.random()*Math.PI*2}));
      let moonPhase=0;
      function draw(){
        if(_bgToken!==token)return;
        const w=canvas.width,h=canvas.height,t=Date.now()*0.0002;
        moonPhase+=0.001;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#060000';ctx.fillRect(0,0,w,h);
        const g1=ctx.createRadialGradient(w*0.75,h*0.35,0,w*0.75,h*0.35,w*0.5);
        g1.addColorStop(0,'rgba(220,38,38,0.22)');g1.addColorStop(1,'rgba(220,38,38,0)');
        ctx.fillStyle=g1;ctx.fillRect(0,0,w,h);
        // moon
        const mx=w*0.75+Math.sin(t*0.3)*15,my=h*0.35+Math.cos(t*0.2)*10,mr=Math.min(w,h)*0.15;
        const mg=ctx.createRadialGradient(mx,my,0,mx,my,mr);
        mg.addColorStop(0,'rgba(180,30,30,0.9)');mg.addColorStop(0.7,'rgba(120,20,20,0.8)');mg.addColorStop(1,'rgba(80,10,10,0.6)');
        ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.fillStyle=mg;ctx.fill();
        ctx.strokeStyle=`rgba(239,68,68,${0.5+0.3*Math.sin(moonPhase)})`;ctx.lineWidth=2;ctx.stroke();
        stars.forEach(s=>{s.ph+=s.sp;const a=s.a*(0.4+0.6*Math.abs(Math.sin(s.ph)));ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(252,165,165,${a})`;ctx.fill();});
        requestAnimationFrame(draw);
      }
      draw();
    }
  },
  {
    id: 'black_hole_bg', name: 'Agujero Negro',
    price: 0, rarity: 'legend', bp: true, bpLevel: 22,
    desc: 'Fondo exclusivo del Pase Estelar — Nivel 22',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_bh1" cx="50%" cy="50%" r="45%"><stop offset="0%" stop-color="#000" stop-opacity="1"/><stop offset="60%" stop-color="#1a006e" stop-opacity="0.8"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="pv_bh2" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="80%" stop-color="#7c3aed" stop-opacity="0.5"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#000005"/>
      <ellipse cx="160" cy="70" rx="160" ry="70" fill="url(#pv_bh2)"/>
      <ellipse cx="160" cy="70" rx="50" ry="22" fill="none" stroke="rgba(167,139,250,0.6)" stroke-width="2"/>
      <ellipse cx="160" cy="70" rx="70" ry="30" fill="none" stroke="rgba(124,58,237,0.3)" stroke-width="1" stroke-dasharray="3 4"/>
      <circle cx="160" cy="70" r="18" fill="url(#pv_bh1)"/>
      <text x="10" y="20" font-size="10" fill="rgba(167,139,250,0.8)" font-family="monospace">★ PASE ESTELAR ★</text>
    </svg>`,
    apply: (canvas, ctx, token) => {
      const stars = Array.from({length:200},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.5+0.2,a:Math.random()*0.8+0.1,sp:0.002+Math.random()*0.007,ph:Math.random()*Math.PI*2,ang:Math.random()*Math.PI*2,dist:0.3+Math.random()*0.4}));
      let rot=0;
      function draw(){
        if(_bgToken!==token)return;
        const w=canvas.width,h=canvas.height;
        rot+=0.003;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#000002';ctx.fillRect(0,0,w,h);
        // Accretion disk
        const cx=w*0.5,cy=h*0.5;
        [[140,60,'rgba(124,58,237,'],[100,45,'rgba(167,139,250,'],[60,28,'rgba(79,70,229,']].forEach(([rx,ry,c],i)=>{
          ctx.save();ctx.translate(cx,cy);ctx.rotate(rot*(i%2?1:-1));
          ctx.strokeStyle=c+(0.2-i*0.04)+')';ctx.lineWidth=i===0?3:2;
          ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
          ctx.restore();
        });
        // Black hole center
        const bhg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*0.12);
        bhg.addColorStop(0,'rgba(0,0,0,1)');bhg.addColorStop(0.6,'rgba(10,0,30,0.95)');bhg.addColorStop(1,'rgba(124,58,237,0)');
        ctx.fillStyle=bhg;ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*0.18,0,Math.PI*2);ctx.fill();
        // Stars being pulled in
        stars.forEach(s=>{s.ph+=s.sp;const a=s.a*(0.3+0.7*Math.abs(Math.sin(s.ph)));ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(196,181,253,${a})`;ctx.fill();});
        requestAnimationFrame(draw);
      }
      draw();
    }
  },
  {
    id: 'supernova_bg', name: 'Supernova',
    price: 0, rarity: 'legend', bp: true, bpLevel: 28,
    desc: 'Fondo exclusivo del Pase Estelar — Nivel 28',
    previewSvg: `<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="pv_sn1" cx="40%" cy="55%" r="65%"><stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/><stop offset="30%" stop-color="#f97316" stop-opacity="0.7"/><stop offset="70%" stop-color="#7c3aed" stop-opacity="0.4"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="320" height="140" fill="#050005"/>
      <rect width="320" height="140" fill="url(#pv_sn1)"/>
      <circle cx="128" cy="77" r="8" fill="white" opacity="0.95"/>
      <line x1="128" y1="77" x2="200" y2="77" stroke="rgba(254,240,138,0.6)" stroke-width="1.5"/>
      <line x1="128" y1="77" x2="60" y2="77" stroke="rgba(254,240,138,0.4)" stroke-width="1"/>
      <line x1="128" y1="77" x2="128" y2="20" stroke="rgba(249,115,22,0.5)" stroke-width="1"/>
      <text x="10" y="20" font-size="10" fill="rgba(254,240,138,0.8)" font-family="monospace">★ PASE ESTELAR ★</text>
      <circle cx="250" cy="40" r="1.5" fill="white" opacity="0.7"/><circle cx="290" cy="100" r="1" fill="#fde68a" opacity="0.6"/>
    </svg>`,
    apply: (canvas, ctx, token) => {
      let phase=0;
      const rays=Array.from({length:24},(_,i)=>({angle:i/24*Math.PI*2,len:0.1+Math.random()*0.35,speed:0.004+Math.random()*0.008,color:['rgba(254,240,138,','rgba(249,115,22,','rgba(124,58,237,'][Math.floor(Math.random()*3)]}));
      const stars=Array.from({length:140},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.5+0.3,a:Math.random(),sp:0.004+Math.random()*0.012,ph:Math.random()*Math.PI*2}));
      function draw(){
        if(_bgToken!==token)return;
        const w=canvas.width,h=canvas.height;
        phase+=0.012;
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle='#030003';ctx.fillRect(0,0,w,h);
        const cx=w*0.38,cy=h*0.52;
        // Nebula background
        const g1=ctx.createRadialGradient(cx,cy,0,cx,cy,w*0.65);
        g1.addColorStop(0,'rgba(254,240,138,0.25)');g1.addColorStop(0.3,'rgba(249,115,22,0.18)');g1.addColorStop(0.7,'rgba(124,58,237,0.12)');g1.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g1;ctx.fillRect(0,0,w,h);
        // Supernova rays
        rays.forEach(r=>{
          r.len=Math.max(0.05,Math.min(0.5,r.len+Math.sin(phase*r.speed*30)*0.004));
          const ex=cx+Math.cos(r.angle+phase*r.speed*3)*r.len*w,ey=cy+Math.sin(r.angle+phase*r.speed*3)*r.len*h;
          const rg=ctx.createLinearGradient(cx,cy,ex,ey);
          rg.addColorStop(0,r.color+'0.5)');rg.addColorStop(1,r.color+'0)');
          ctx.strokeStyle=rg;ctx.lineWidth=1.5;ctx.globalAlpha=0.7;
          ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();
        });
        ctx.globalAlpha=1;
        // Core
        const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,20+8*Math.sin(phase));
        cg.addColorStop(0,'rgba(255,255,255,1)');cg.addColorStop(0.4,'rgba(254,240,138,0.9)');cg.addColorStop(1,'rgba(249,115,22,0)');
        ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,22+6*Math.sin(phase),0,Math.PI*2);ctx.fill();
        // Stars
        stars.forEach(s=>{s.ph+=s.sp;const a=s.a*(0.3+0.7*Math.abs(Math.sin(s.ph)));ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(254,240,138,${a})`;ctx.fill();});
        requestAnimationFrame(draw);
      }
      draw();
    }
  },
];

// Storage de fondos — delegates to GameState
function getBgData()  { return GameState.inventory.backgrounds.get(); }
function saveBgData(d){ GameState.inventory.backgrounds.save(d); }

let _bgBuyTarget = null;
// Token de cancelación: cada llamada a applyBackground incrementa este valor.
// Cada loop de animación guarda su propio token y se cancela si ya no coincide.
let _bgToken = 0;

// Genera SVG de preview para el modal de compra
function getBgPreviewSvg(bg) {
  return bg.previewSvg || '';
}

// Renderizar grilla de fondos en la tienda
function renderBgGrid() {
  const bgData = getBgData();
  const coins = getCoins();
  const grid = document.getElementById('bg-grid');
  if (!grid) return;

  const rarColors = { common: 'rar-common', rare: 'rar-rare', epic: 'rar-epic', legend: 'rar-legend' };
  const rarLabel  = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legend: 'LEGENDARIO' };

  grid.innerHTML = BACKGROUNDS.map(bg => {
    const owned    = bgData.owned.includes(bg.id);
    const equipped = bgData.equipped === bg.id;
    const canAfford = coins >= bg.price;
    const isBP = bg.bp === true;
    const bpLvl = isBP ? getBPLevel() : 0;
    const bpUnlocked = isBP ? bpLvl >= bg.bpLevel : true;
    const bpClaimed = isBP ? getBPClaimed().includes(bg.bpLevel) : false;

    let cardClass = 'bg-card rarity-' + bg.rarity;
    if (equipped) cardClass += ' equipped';
    else if (owned || bpClaimed) cardClass += ' owned-bg';
    else if (isBP && !bpUnlocked) cardClass += ' locked-bg';
    else if (!isBP && !canAfford) cardClass += ' locked-bg';

    let badgeHtml = '';
    if (equipped) badgeHtml = `<span class="bg-card-badge bg-badge-equipped">✓ ACTIVO</span>`;
    else if (owned || bpClaimed) badgeHtml = `<span class="bg-card-badge bg-badge-owned">✓ TUYO</span>`;
    else if (isBP) badgeHtml = `<span class="bg-card-badge" style="background:linear-gradient(135deg,rgba(124,58,237,0.85),rgba(79,70,229,0.85));color:#e9d5ff;border:1px solid rgba(167,139,250,0.7);font-size:8px">⭐PASE Nv.${bg.bpLevel}</span>`;
    else badgeHtml = `<span class="bg-card-badge bg-badge-locked ${rarColors[bg.rarity]}">${rarLabel[bg.rarity]}</span>`;

    const bpLockIcon = isBP && !bpUnlocked && !bpClaimed
      ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);border-radius:inherit;z-index:2;font-size:28px;filter:drop-shadow(0 0 8px rgba(167,139,250,0.5))">🔒</div>`
      : '';

    const priceHtml = equipped
      ? `<span style="color:#a78bfa;font-size:11px;font-weight:700">✓ Equipado</span>`
      : (owned || bpClaimed)
        ? `<span style="color:#4ade80;font-size:11px;font-weight:700">✓ Desbloqueado</span>`
        : isBP
          ? bpUnlocked
            ? `<span style="color:#a78bfa;font-size:11px;font-weight:700">⭐ ¡Reclamar en Pase!</span>`
            : `<span style="color:rgba(167,139,250,0.5);font-size:10px">⭐ Pase Nv.${bg.bpLevel}</span>`
          : bg.price === 0
            ? `<span style="color:#4ade80;font-size:11px;font-weight:700">Gratis</span>`
            : `<span style="${!canAfford?'color:rgba(255,255,255,0.4)':''}">🪙 ${bg.price}</span>`;

    return `<div class="${cardClass}" onclick="onBgClick('${bg.id}')">
      <div class="bg-card-preview">${bg.previewSvg}</div>
      <div class="bg-card-overlay"></div>
      ${bpLockIcon}
      ${badgeHtml}
      <div class="bg-card-info">
        <div class="bg-card-name">${bg.name}</div>
        <div class="bg-card-price">${priceHtml}</div>
      </div>
    </div>`;
  }).join('');
}

function onBgClick(id) {
  const bgData = getBgData();
  const bg = BACKGROUNDS.find(b => b.id === id);
  if (!bg) return;

  // Handle BP backgrounds
  if (bg.bp) {
    const bpLevel = getBPLevel();
    const bpClaimed = getBPClaimed();
    if (!bpClaimed.includes(bg.bpLevel)) {
      if (bpLevel >= bg.bpLevel) {
        showXPToast(`⭐ ¡Reclama el Pase Estelar Nv.${bg.bpLevel} para desbloquear!`);
        setTimeout(() => { showSection('missions'); switchMainMissionSection('battlepass'); }, 800);
      } else {
        showXPToast(`🔒 Necesitas Pase Estelar Nv.${bg.bpLevel}`);
      }
      return;
    }
    // BP claimed — add to owned and equip
    if (!bgData.owned.includes(id)) { bgData.owned.push(id); saveBgData(bgData); }
  }

  // Auto-desbloquear fondos gratuitos
  if (bg.price === 0 && !bgData.owned.includes(id) && !bg.bp) {
    bgData.owned.push(id);
    saveBgData(bgData);
  }

  if (bgData.owned.includes(id)) {
    if (bgData.equipped === id) return; // ya equipado
    // Equipar directamente
    bgData.equipped = id;
    saveBgData(bgData);
    applyBackground(id);
    renderBgGrid();
    showBgToast(`🎨 ${bg.name} equipado`);
    return;
  }

  // Abrir modal de compra
  _bgBuyTarget = id;
  document.getElementById('bg-buy-modal-name').textContent = bg.name;
  document.getElementById('bg-buy-modal-price').textContent = bg.price;
  document.getElementById('bg-buy-modal-err').textContent = '';
  const prev = document.getElementById('bg-buy-preview-wrap');
  if (prev) prev.innerHTML = bg.previewSvg;
  document.getElementById('bg-buy-modal').classList.add('show');
}

function confirmBuyBg() {
  if (!_bgBuyTarget) return;
  const bg = BACKGROUNDS.find(b => b.id === _bgBuyTarget);
  if (!bg) return;
  const coins = getCoins();
  if (coins < bg.price) {
    document.getElementById('bg-buy-modal-err').textContent = '¡No tienes suficientes monedas!';
    return;
  }
  addCoins(-bg.price);
  const bgData = getBgData();
  if (!bgData.owned.includes(bg.id)) bgData.owned.push(bg.id);
  bgData.equipped = bg.id;
  saveBgData(bgData);
  closeBgBuyModal();
  applyBackground(bg.id);
  renderBgGrid();
  updateCoinDisplay();
  showBgToast(`🎉 ¡${bg.name} desbloqueado y equipado!`);
}

function closeBgBuyModal() {
  document.getElementById('bg-buy-modal').classList.remove('show');
  _bgBuyTarget = null;
}

function showBgToast(msg) {
  const t = document.getElementById('bg-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// Aplica el fondo activo al canvas
function applyBackground(id) {
  const bg = BACKGROUNDS.find(b => b.id === id);
  if (!bg) return;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // Incrementar token — cancela cualquier loop anterior
  _bgToken++;
  const myToken = _bgToken;

  if (id === 'default') {
    canvas.classList.remove('visible');
    document.body.classList.remove('has-custom-bg');
    // Limpiar canvas tras la transición CSS
    setTimeout(() => {
      if (_bgToken !== myToken) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 750);
    return;
  }

  // Resize canvas a pantalla completa
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // Activar has-custom-bg para suprimir estrellas y fondo por defecto
  document.body.classList.add('has-custom-bg');

  // Ocultar mientras se prepara el nuevo fondo
  canvas.classList.remove('visible');

  // Iniciamos el render inmediatamente y esperamos 2 frames para hacer fade-in
  requestAnimationFrame(() => {
    if (_bgToken !== myToken) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bg.apply(canvas, ctx, myToken);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (_bgToken !== myToken) return;
        canvas.classList.add('visible');
      });
    });
  });
}

// Inicializar fondo al cargar
function initBackground() {
  const bgData = getBgData();
  applyBackground(bgData.equipped);

  // Redibujar al hacer resize: solo redimensionar el canvas y relanzar el loop
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const bgData2 = getBgData();
      if (bgData2.equipped !== 'default') {
        applyBackground(bgData2.equipped);
      }
    }, 150); // debounce para evitar llamadas excesivas
  });
}

// Patch renderStore para incluir fondos y robots
const _origRenderStore = renderStore;
window.renderStore = function() {
  _origRenderStore();
  renderBgGrid();
  renderRobotStoreGrid();
};

window.onBgClick = onBgClick;
window.confirmBuyBg = confirmBuyBg;
window.closeBgBuyModal = closeBgBuyModal;

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', initBackground);
// Fallback si ya cargó
if (document.readyState !== 'loading') initBackground();

/* ═══════════════════════════════════════════════════
   ROBOT SKIN SYSTEM
═══════════════════════════════════════════════════ */

// SVG inline de cada robot — se inyecta directamente en .rq-robot-wrap
const ROBOT_SKINS = [
  {
    id: 'default',
    name: 'Clásico',
    desc: 'El robot original, fiel y siempre listo',
    price: 0,
    rarity: 'common',
    // Preview SVG (pequeño, para tarjeta)
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(130,80,255,0.18)"/>
      <line x1="50" y1="7" x2="50" y2="18" stroke="rgba(167,139,250,0.9)" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="6" r="5" fill="#a78bfa"/>
      <rect x="17" y="18" width="66" height="44" rx="14" fill="#2a1f6e"/>
      <rect x="17" y="18" width="66" height="44" rx="14" stroke="rgba(167,139,250,0.7)" stroke-width="2"/>
      <rect x="28" y="30" width="18" height="13" rx="5" fill="#93c5fd"/>
      <rect x="54" y="30" width="18" height="13" rx="5" fill="#93c5fd"/>
      <path d="M34 50 Q50 58 66 50" stroke="rgba(167,139,250,0.8)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#1e1550"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(167,139,250,0.55)" stroke-width="2"/>
      <circle cx="36" cy="91" r="5" fill="#4ade80"/>
      <circle cx="50" cy="91" r="5" fill="#a78bfa"/>
      <circle cx="64" cy="91" r="5" fill="#60a5fa"/>
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#1e1550" stroke="rgba(130,100,255,0.4)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="#1e1550" stroke="rgba(130,100,255,0.4)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#1e1550" stroke="rgba(130,100,255,0.4)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="#1e1550" stroke="rgba(130,100,255,0.4)" stroke-width="1.5"/>
    </svg>`,
    // SVG completo con defs — se inyecta en .rq-robot-wrap > .rq-robot-svg
    fullSvg: null, // null = usar el HTML original sin tocar
  },
  {
    id: 'neon_red',
    name: 'Inferno',
    desc: 'Robot de acero con núcleo de plasma rojo ardiente',
    price: 120,
    rarity: 'rare',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(255,60,60,0.18)"/>
      <line x1="50" y1="7" x2="50" y2="18" stroke="rgba(248,113,113,0.9)" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="6" r="5" fill="#f87171"/>
      <rect x="17" y="18" width="66" height="44" rx="14" fill="#3a1010"/>
      <rect x="17" y="18" width="66" height="44" rx="14" stroke="rgba(248,113,113,0.8)" stroke-width="2"/>
      <rect x="28" y="30" width="18" height="13" rx="5" fill="#fca5a5"/>
      <rect x="54" y="30" width="18" height="13" rx="5" fill="#fca5a5"/>
      <path d="M34 47 Q50 42 66 47" stroke="rgba(248,113,113,0.9)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#2d0f0f"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(248,113,113,0.6)" stroke-width="2"/>
      <circle cx="36" cy="91" r="5" fill="#f87171"/>
      <circle cx="50" cy="91" r="5" fill="#fbbf24"/>
      <circle cx="64" cy="91" r="5" fill="#f87171"/>
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#2d0f0f" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="#2d0f0f" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#2d0f0f" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="#2d0f0f" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(255,60,60,0.18)"/>
      <line x1="50" y1="7" x2="50" y2="18" stroke="rgba(248,113,113,0.9)" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="rq-antenna" cx="50" cy="6" r="5" fill="#f87171" filter="url(#rqGlowRed)"/>
      <rect x="17" y="18" width="66" height="44" rx="14" fill="url(#rqHeadGradR)"/>
      <rect x="17" y="18" width="66" height="44" rx="14" stroke="rgba(248,113,113,0.8)" stroke-width="2"/>
      <rect x="24" y="25" width="52" height="30" rx="8" fill="rgba(200,40,40,0.12)" stroke="rgba(248,113,113,0.22)" stroke-width="1"/>
      <rect class="rq-eye-l" x="28" y="30" width="18" height="13" rx="5" fill="#fca5a5" filter="url(#rqGlowRed)"/>
      <rect x="31" y="32.5" width="5" height="3.5" rx="2" fill="rgba(255,255,255,0.75)"/>
      <rect class="rq-eye-r" x="54" y="30" width="18" height="13" rx="5" fill="#fca5a5" filter="url(#rqGlowRed)"/>
      <rect x="57" y="32.5" width="5" height="3.5" rx="2" fill="rgba(255,255,255,0.75)"/>
      <path class="rq-mouth" d="M34 47 Q50 42 66 47" stroke="rgba(248,113,113,0.9)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(40,8,8,0.9)" stroke="rgba(248,113,113,0.35)" stroke-width="1"/>
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradR)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(248,113,113,0.6)" stroke-width="2"/>
      <rect x="22" y="78" width="56" height="26" rx="8" fill="rgba(200,40,40,0.10)" stroke="rgba(248,113,113,0.18)" stroke-width="1"/>
      <circle class="rq-light-1" cx="36" cy="91" r="5" fill="#f87171" filter="url(#rqGlowRed)"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5" fill="#fbbf24" filter="url(#rqGlowAmberR)"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5" fill="#f87171" filter="url(#rqGlowRed)"/>
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradR)" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradR)" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradR)" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradR)" stroke="rgba(248,113,113,0.4)" stroke-width="1.5"/>
      <defs>
        <linearGradient id="rqHeadGradR" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4a1010"/><stop offset="100%" stop-color="#1e0505"/>
        </linearGradient>
        <linearGradient id="rqBodyGradR" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3a0c0c"/><stop offset="100%" stop-color="#160404"/>
        </linearGradient>
        <linearGradient id="rqArmGradR" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#3a0c0c"/><stop offset="100%" stop-color="#160404"/>
        </linearGradient>
        <filter id="rqGlowRed" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowAmberR" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    </svg>`,
  },

  // ── NUEVO: HOLO — IA Holográfica ──────────────────────────────────────────
  {
    id: 'holo',
    name: 'HOLO',
    desc: 'Proyección holográfica de inteligencia artificial cuántica',
    price: 180,
    rarity: 'epic',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="hpg1" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#67e8f9" stop-opacity="0.35"/><stop offset="100%" stop-color="#0e7490" stop-opacity="0"/></radialGradient>
        <filter id="hpBlur"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(6,182,212,0.18)"/>
      <!-- Scan lines overlay -->
      <rect x="17" y="18" width="66" height="86" rx="14" fill="url(#hpg1)" opacity="0.3"/>
      <line x1="17" y1="28" x2="83" y2="28" stroke="rgba(103,232,249,0.12)" stroke-width="0.8"/>
      <line x1="17" y1="38" x2="83" y2="38" stroke="rgba(103,232,249,0.12)" stroke-width="0.8"/>
      <line x1="17" y1="48" x2="83" y2="48" stroke="rgba(103,232,249,0.12)" stroke-width="0.8"/>
      <line x1="17" y1="80" x2="88" y2="80" stroke="rgba(103,232,249,0.1)" stroke-width="0.8"/>
      <line x1="17" y1="90" x2="88" y2="90" stroke="rgba(103,232,249,0.1)" stroke-width="0.8"/>
      <line x1="17" y1="100" x2="88" y2="100" stroke="rgba(103,232,249,0.1)" stroke-width="0.8"/>
      <!-- Antenna -->
      <line x1="50" y1="7" x2="50" y2="18" stroke="rgba(103,232,249,0.9)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,2"/>
      <circle cx="50" cy="6" r="5" fill="#22d3ee" filter="url(#hpBlur)" opacity="0.9"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="14" fill="rgba(8,145,178,0.15)" stroke="rgba(103,232,249,0.7)" stroke-width="1.5"/>
      <!-- Eyes — holographic hexagons -->
      <polygon points="37,30 43,30 46,35.5 43,41 37,41 34,35.5" fill="rgba(34,211,238,0.25)" stroke="#67e8f9" stroke-width="1.2" filter="url(#hpBlur)"/>
      <polygon points="57,30 63,30 66,35.5 63,41 57,41 54,35.5" fill="rgba(34,211,238,0.25)" stroke="#67e8f9" stroke-width="1.2" filter="url(#hpBlur)"/>
      <circle cx="40" cy="35" r="3" fill="#a5f3fc" opacity="0.85"/>
      <circle cx="60" cy="35" r="3" fill="#a5f3fc" opacity="0.85"/>
      <!-- Mouth — data stream -->
      <rect x="32" y="50" width="36" height="5" rx="2.5" fill="rgba(6,182,212,0.15)" stroke="rgba(103,232,249,0.5)" stroke-width="1"/>
      <rect x="34" y="51.5" width="8" height="2" rx="1" fill="#22d3ee" opacity="0.8"/>
      <rect x="45" y="51.5" width="5" height="2" rx="1" fill="#22d3ee" opacity="0.5"/>
      <rect x="53" y="51.5" width="10" height="2" rx="1" fill="#22d3ee" opacity="0.7"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="rgba(8,145,178,0.12)" stroke="rgba(103,232,249,0.55)" stroke-width="1.5"/>
      <!-- Chest grid -->
      <rect x="22" y="78" width="56" height="26" rx="6" fill="rgba(6,182,212,0.08)" stroke="rgba(103,232,249,0.2)" stroke-width="0.8"/>
      <circle cx="36" cy="91" r="5" fill="#22d3ee" filter="url(#hpBlur)" opacity="0.85"/>
      <circle cx="50" cy="91" r="5" fill="#a5f3fc" filter="url(#hpBlur)" opacity="0.7"/>
      <circle cx="64" cy="91" r="5" fill="#22d3ee" filter="url(#hpBlur)" opacity="0.85"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="rgba(8,145,178,0.18)" stroke="rgba(103,232,249,0.4)" stroke-width="1.2"/>
      <circle cx="7" cy="100" r="7" fill="rgba(8,145,178,0.18)" stroke="rgba(103,232,249,0.4)" stroke-width="1.2"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="rgba(8,145,178,0.18)" stroke="rgba(103,232,249,0.4)" stroke-width="1.2"/>
      <circle cx="93" cy="100" r="7" fill="rgba(8,145,178,0.18)" stroke="rgba(103,232,249,0.4)" stroke-width="1.2"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradH" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#083344"/><stop offset="100%" stop-color="#020c10"/>
        </linearGradient>
        <linearGradient id="rqBodyGradH" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0c4a6e" stop-opacity="0.6"/><stop offset="100%" stop-color="#020c10" stop-opacity="0.9"/>
        </linearGradient>
        <linearGradient id="rqArmGradH" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#083344"/><stop offset="100%" stop-color="#020c10"/>
        </linearGradient>
        <filter id="rqGlowHolo" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowHoloSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqHoloBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#0e7490" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Glow aura -->
      <ellipse cx="50" cy="64" rx="44" ry="55" fill="url(#rqHoloBg)" opacity="0.6"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(6,182,212,0.22)"/>
      <!-- Scan lines -->
      <line x1="17" y1="27" x2="83" y2="27" stroke="rgba(103,232,249,0.13)" stroke-width="0.8"/>
      <line x1="17" y1="36" x2="83" y2="36" stroke="rgba(103,232,249,0.13)" stroke-width="0.8"/>
      <line x1="17" y1="45" x2="83" y2="45" stroke="rgba(103,232,249,0.13)" stroke-width="0.8"/>
      <line x1="12" y1="79" x2="88" y2="79" stroke="rgba(103,232,249,0.1)" stroke-width="0.8"/>
      <line x1="12" y1="89" x2="88" y2="89" stroke="rgba(103,232,249,0.1)" stroke-width="0.8"/>
      <line x1="12" y1="99" x2="88" y2="99" stroke="rgba(103,232,249,0.1)" stroke-width="0.8"/>
      <!-- Antenna -->
      <line x1="50" y1="7" x2="50" y2="18" stroke="rgba(103,232,249,0.9)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3,2"/>
      <circle class="rq-antenna" cx="50" cy="6" r="5" fill="#22d3ee" filter="url(#rqGlowHolo)"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="14" fill="url(#rqHeadGradH)"/>
      <rect x="17" y="18" width="66" height="44" rx="14" stroke="rgba(103,232,249,0.75)" stroke-width="1.8"/>
      <!-- Eyes: holographic hexagons -->
      <polygon class="rq-eye-l" points="37,29 43,29 46,35.5 43,42 37,42 34,35.5" fill="rgba(34,211,238,0.22)" stroke="#67e8f9" stroke-width="1.3" filter="url(#rqGlowHoloSoft)"/>
      <polygon class="rq-eye-r" points="57,29 63,29 66,35.5 63,42 57,42 54,35.5" fill="rgba(34,211,238,0.22)" stroke="#67e8f9" stroke-width="1.3" filter="url(#rqGlowHoloSoft)"/>
      <circle cx="40" cy="35" r="3.5" fill="#a5f3fc" filter="url(#rqGlowHolo)" opacity="0.9"/>
      <circle cx="60" cy="35" r="3.5" fill="#a5f3fc" filter="url(#rqGlowHolo)" opacity="0.9"/>
      <!-- Mouth — data stream bar -->
      <rect class="rq-mouth" x="30" y="50" width="40" height="6" rx="3" fill="rgba(6,182,212,0.15)" stroke="rgba(103,232,249,0.55)" stroke-width="1"/>
      <rect x="32" y="51.5" width="10" height="3" rx="1.5" fill="#22d3ee" opacity="0.85"/>
      <rect x="45" y="51.5" width="6" height="3" rx="1.5" fill="#22d3ee" opacity="0.5"/>
      <rect x="54" y="51.5" width="12" height="3" rx="1.5" fill="#22d3ee" opacity="0.75"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(8,51,68,0.9)" stroke="rgba(103,232,249,0.3)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradH)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(103,232,249,0.6)" stroke-width="1.8"/>
      <rect x="22" y="78" width="56" height="26" rx="8" fill="rgba(6,182,212,0.07)" stroke="rgba(103,232,249,0.18)" stroke-width="0.9"/>
      <!-- Chest lights -->
      <circle class="rq-light-1" cx="36" cy="91" r="5" fill="#22d3ee" filter="url(#rqGlowHolo)" opacity="0.85"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5" fill="#a5f3fc" filter="url(#rqGlowHoloSoft)" opacity="0.75"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5" fill="#22d3ee" filter="url(#rqGlowHolo)" opacity="0.85"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradH)" stroke="rgba(103,232,249,0.4)" stroke-width="1.4"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradH)" stroke="rgba(103,232,249,0.4)" stroke-width="1.4"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradH)" stroke="rgba(103,232,249,0.4)" stroke-width="1.4"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradH)" stroke="rgba(103,232,249,0.4)" stroke-width="1.4"/>
    </svg>`,
  },

  // ── NUEVO: NEBULA — Entidad Espacial ──────────────────────────────────────
  {
    id: 'nebula',
    name: 'NEBULA',
    desc: 'Ser de energía nacido en el corazón de una nebulosa violeta',
    price: 220,
    rarity: 'epic',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="npBg" cx="50%" cy="50%" r="65%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.4"/><stop offset="100%" stop-color="#1e1b4b" stop-opacity="0"/></radialGradient>
        <filter id="npGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="42" ry="52" fill="url(#npBg)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(139,92,246,0.2)"/>
      <!-- Antenna — star burst -->
      <line x1="50" y1="8" x2="50" y2="18" stroke="rgba(196,181,253,0.9)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="6" r="5" fill="#8b5cf6" filter="url(#npGlow)"/>
      <line x1="45" y1="3" x2="55" y2="9" stroke="rgba(196,181,253,0.6)" stroke-width="0.8"/>
      <line x1="45" y1="9" x2="55" y2="3" stroke="rgba(196,181,253,0.6)" stroke-width="0.8"/>
      <!-- Head — cosmic cloud shape -->
      <rect x="17" y="18" width="66" height="44" rx="14" fill="rgba(49,10,99,0.7)" stroke="rgba(167,139,250,0.75)" stroke-width="1.8"/>
      <!-- Nebula wisps inside head -->
      <ellipse cx="40" cy="32" rx="12" ry="7" fill="rgba(124,58,237,0.3)" opacity="0.7"/>
      <ellipse cx="62" cy="34" rx="10" ry="6" fill="rgba(219,39,119,0.2)" opacity="0.7"/>
      <!-- Eyes — glowing orbs -->
      <circle cx="37" cy="35" r="8" fill="rgba(88,28,135,0.5)" stroke="rgba(167,139,250,0.6)" stroke-width="1"/>
      <circle cx="63" cy="35" r="8" fill="rgba(88,28,135,0.5)" stroke="rgba(167,139,250,0.6)" stroke-width="1"/>
      <circle cx="37" cy="35" r="4.5" fill="#a78bfa" filter="url(#npGlow)" opacity="0.9"/>
      <circle cx="63" cy="35" r="4.5" fill="#a78bfa" filter="url(#npGlow)" opacity="0.9"/>
      <circle cx="38.5" cy="33.5" r="1.5" fill="white" opacity="0.85"/>
      <circle cx="64.5" cy="33.5" r="1.5" fill="white" opacity="0.85"/>
      <!-- Mouth — aurora arc -->
      <path d="M33 52 Q50 46 67 52" stroke="rgba(196,181,253,0.85)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M38 52 Q50 49 62 52" stroke="rgba(236,72,153,0.5)" stroke-width="1" fill="none" stroke-linecap="round"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="rgba(49,10,99,0.55)" stroke="rgba(167,139,250,0.6)" stroke-width="1.8"/>
      <!-- Floating orbs in chest -->
      <circle cx="36" cy="91" r="5" fill="#8b5cf6" filter="url(#npGlow)" opacity="0.9"/>
      <circle cx="50" cy="91" r="5" fill="#ec4899" filter="url(#npGlow)" opacity="0.8"/>
      <circle cx="64" cy="91" r="5" fill="#8b5cf6" filter="url(#npGlow)" opacity="0.9"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="rgba(49,10,99,0.6)" stroke="rgba(139,92,246,0.45)" stroke-width="1.3"/>
      <circle cx="7" cy="100" r="7" fill="rgba(49,10,99,0.6)" stroke="rgba(139,92,246,0.45)" stroke-width="1.3"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="rgba(49,10,99,0.6)" stroke="rgba(139,92,246,0.45)" stroke-width="1.3"/>
      <circle cx="93" cy="100" r="7" fill="rgba(49,10,99,0.6)" stroke="rgba(139,92,246,0.45)" stroke-width="1.3"/>
      <!-- Floating dust particles -->
      <circle cx="15" cy="50" r="1.5" fill="#c4b5fd" opacity="0.6"/>
      <circle cx="90" cy="38" r="1" fill="#f0abfc" opacity="0.5"/>
      <circle cx="8" cy="85" r="1.2" fill="#a78bfa" opacity="0.4"/>
      <circle cx="96" cy="90" r="1" fill="#c4b5fd" opacity="0.5"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradN" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2e1065"/><stop offset="100%" stop-color="#0d0020"/>
        </linearGradient>
        <linearGradient id="rqBodyGradN" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e0a40"/><stop offset="100%" stop-color="#080012"/>
        </linearGradient>
        <linearGradient id="rqArmGradN" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#2e1065"/><stop offset="100%" stop-color="#0d0020"/>
        </linearGradient>
        <filter id="rqGlowNebula" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowNebulaSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqNebAura" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Aura -->
      <ellipse cx="50" cy="64" rx="46" ry="56" fill="url(#rqNebAura)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(139,92,246,0.25)"/>
      <!-- Antenna with star burst -->
      <line x1="50" y1="8" x2="50" y2="18" stroke="rgba(196,181,253,0.9)" stroke-width="2.2" stroke-linecap="round"/>
      <circle class="rq-antenna" cx="50" cy="6" r="5.5" fill="#8b5cf6" filter="url(#rqGlowNebula)"/>
      <line x1="44" y1="2" x2="56" y2="10" stroke="rgba(196,181,253,0.5)" stroke-width="1"/>
      <line x1="44" y1="10" x2="56" y2="2" stroke="rgba(196,181,253,0.5)" stroke-width="1"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="14" fill="url(#rqHeadGradN)"/>
      <rect x="17" y="18" width="66" height="44" rx="14" stroke="rgba(167,139,250,0.78)" stroke-width="2"/>
      <!-- Inner nebula wisps -->
      <ellipse cx="38" cy="32" rx="14" ry="8" fill="rgba(124,58,237,0.28)" opacity="0.8"/>
      <ellipse cx="64" cy="34" rx="11" ry="6" fill="rgba(219,39,119,0.18)" opacity="0.7"/>
      <!-- Eyes -->
      <circle x="29" y="27" width="16" height="16" rx="8" cx="37" cy="35" r="9" fill="rgba(88,28,135,0.55)" stroke="rgba(167,139,250,0.65)" stroke-width="1.2"/>
      <circle x="55" y="27" width="16" height="16" rx="8" cx="63" cy="35" r="9" fill="rgba(88,28,135,0.55)" stroke="rgba(167,139,250,0.65)" stroke-width="1.2"/>
      <circle class="rq-eye-l" cx="37" cy="35" r="5" fill="#a78bfa" filter="url(#rqGlowNebula)" opacity="0.95"/>
      <circle class="rq-eye-r" cx="63" cy="35" r="5" fill="#a78bfa" filter="url(#rqGlowNebula)" opacity="0.95"/>
      <circle cx="39" cy="33" r="2" fill="white" opacity="0.9"/>
      <circle cx="65" cy="33" r="2" fill="white" opacity="0.9"/>
      <!-- Mouth — aurora arc -->
      <path class="rq-mouth" d="M32 52 Q50 45 68 52" stroke="rgba(196,181,253,0.9)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M37 51 Q50 47.5 63 51" stroke="rgba(236,72,153,0.55)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(22,4,50,0.9)" stroke="rgba(139,92,246,0.3)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradN)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(167,139,250,0.62)" stroke-width="2"/>
      <rect x="22" y="78" width="56" height="26" rx="8" fill="rgba(124,58,237,0.07)" stroke="rgba(167,139,250,0.18)" stroke-width="0.9"/>
      <!-- Chest lights -->
      <circle class="rq-light-1" cx="36" cy="91" r="5.5" fill="#8b5cf6" filter="url(#rqGlowNebula)" opacity="0.9"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5.5" fill="#ec4899" filter="url(#rqGlowNebulaSoft)" opacity="0.85"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5.5" fill="#8b5cf6" filter="url(#rqGlowNebula)" opacity="0.9"/>
      <!-- Floating dust -->
      <circle cx="15" cy="48" r="1.8" fill="#c4b5fd" opacity="0.55" filter="url(#rqGlowNebulaSoft)"/>
      <circle cx="90" cy="36" r="1.2" fill="#f0abfc" opacity="0.5" filter="url(#rqGlowNebulaSoft)"/>
      <circle cx="8" cy="84" r="1.5" fill="#a78bfa" opacity="0.45" filter="url(#rqGlowNebulaSoft)"/>
      <circle cx="96" cy="92" r="1.2" fill="#c4b5fd" opacity="0.5" filter="url(#rqGlowNebulaSoft)"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradN)" stroke="rgba(139,92,246,0.45)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradN)" stroke="rgba(139,92,246,0.45)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradN)" stroke="rgba(139,92,246,0.45)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradN)" stroke="rgba(139,92,246,0.45)" stroke-width="1.5"/>
    </svg>`,
  },

  // ── NUEVO: XENON — Alien Inteligente ─────────────────────────────────────
  {
    id: 'xenon',
    name: 'XENON',
    desc: 'Alien de inteligencia superior de la galaxia de Andrómeda',
    price: 160,
    rarity: 'rare',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <filter id="xpGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(52,211,153,0.18)"/>
      <!-- Antenna — triple prong -->
      <line x1="50" y1="8" x2="50" y2="18" stroke="rgba(52,211,153,0.9)" stroke-width="2" stroke-linecap="round"/>
      <line x1="50" y1="11" x2="44" y2="6" stroke="rgba(52,211,153,0.7)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="50" y1="11" x2="56" y2="6" stroke="rgba(52,211,153,0.7)" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="50" cy="8" r="3.5" fill="#34d399" filter="url(#xpGlow)"/>
      <!-- Head — elongated alien cranium -->
      <ellipse cx="50" cy="35" rx="34" ry="20" fill="#062118" stroke="rgba(52,211,153,0.7)" stroke-width="1.5"/>
      <!-- Brain veins (bioluminescent) -->
      <path d="M30 28 Q40 22 50 24 Q60 22 70 28" stroke="rgba(52,211,153,0.35)" stroke-width="1" fill="none"/>
      <path d="M28 35 Q36 30 44 32" stroke="rgba(52,211,153,0.25)" stroke-width="0.8" fill="none"/>
      <path d="M72 35 Q64 30 56 32" stroke="rgba(52,211,153,0.25)" stroke-width="0.8" fill="none"/>
      <!-- Eyes — large almond alien eyes -->
      <ellipse cx="35" cy="37" rx="9" ry="6" fill="#021a0e" stroke="rgba(52,211,153,0.6)" stroke-width="1.2"/>
      <ellipse cx="65" cy="37" rx="9" ry="6" fill="#021a0e" stroke="rgba(52,211,153,0.6)" stroke-width="1.2"/>
      <ellipse cx="35" cy="37" rx="5.5" ry="4" fill="#10b981" filter="url(#xpGlow)" opacity="0.9"/>
      <ellipse cx="65" cy="37" rx="5.5" ry="4" fill="#10b981" filter="url(#xpGlow)" opacity="0.9"/>
      <ellipse cx="36.5" cy="35.5" rx="2" ry="1.5" fill="white" opacity="0.9"/>
      <ellipse cx="66.5" cy="35.5" rx="2" ry="1.5" fill="white" opacity="0.9"/>
      <!-- Nostrils — small slits -->
      <line x1="47" y1="46" x2="49" y2="48" stroke="rgba(52,211,153,0.5)" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="53" y1="46" x2="51" y2="48" stroke="rgba(52,211,153,0.5)" stroke-width="0.8" stroke-linecap="round"/>
      <!-- Mouth — thin bioluminescent line -->
      <path d="M36 51 Q50 54 64 51" stroke="rgba(52,211,153,0.7)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- Neck + body connector -->
      <rect x="40" y="54" width="20" height="16" rx="4" fill="#041a0f" stroke="rgba(52,211,153,0.35)" stroke-width="1"/>
      <!-- Body — slender alien torso -->
      <rect x="16" y="70" width="68" height="42" rx="16" fill="#041a0f" stroke="rgba(52,211,153,0.55)" stroke-width="1.5"/>
      <!-- Bio-panel in chest -->
      <rect x="26" y="78" width="48" height="26" rx="6" fill="rgba(5,46,22,0.6)" stroke="rgba(52,211,153,0.2)" stroke-width="0.8"/>
      <circle cx="38" cy="91" r="5" fill="#34d399" filter="url(#xpGlow)" opacity="0.85"/>
      <circle cx="50" cy="91" r="5" fill="#6ee7b7" filter="url(#xpGlow)" opacity="0.7"/>
      <circle cx="62" cy="91" r="5" fill="#34d399" filter="url(#xpGlow)" opacity="0.85"/>
      <!-- Arms — slender -->
      <rect x="3" y="72" width="14" height="28" rx="7" fill="#041a0f" stroke="rgba(52,211,153,0.4)" stroke-width="1.2"/>
      <ellipse cx="10" cy="102" rx="8" ry="7" fill="#041a0f" stroke="rgba(52,211,153,0.4)" stroke-width="1.2"/>
      <rect x="83" y="72" width="14" height="28" rx="7" fill="#041a0f" stroke="rgba(52,211,153,0.4)" stroke-width="1.2"/>
      <ellipse cx="90" cy="102" rx="8" ry="7" fill="#041a0f" stroke="rgba(52,211,153,0.4)" stroke-width="1.2"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradX" x1="16" y1="15" x2="84" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#052e16"/><stop offset="100%" stop-color="#011208"/>
        </linearGradient>
        <linearGradient id="rqBodyGradX" x1="16" y1="70" x2="84" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#041a0f"/><stop offset="100%" stop-color="#010c04"/>
        </linearGradient>
        <linearGradient id="rqArmGradX" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#052e16"/><stop offset="100%" stop-color="#010c04"/>
        </linearGradient>
        <filter id="rqGlowXenon" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowXenonSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(52,211,153,0.22)"/>
      <!-- Antenna — triple prong -->
      <line x1="50" y1="8" x2="50" y2="18" stroke="rgba(52,211,153,0.9)" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="50" y1="12" x2="43" y2="5" stroke="rgba(52,211,153,0.7)" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="50" y1="12" x2="57" y2="5" stroke="rgba(52,211,153,0.7)" stroke-width="1.3" stroke-linecap="round"/>
      <circle class="rq-antenna" cx="50" cy="8" r="4" fill="#34d399" filter="url(#rqGlowXenon)"/>
      <circle cx="43" cy="5" r="2.2" fill="#34d399" filter="url(#rqGlowXenonSoft)" opacity="0.8"/>
      <circle cx="57" cy="5" r="2.2" fill="#34d399" filter="url(#rqGlowXenonSoft)" opacity="0.8"/>
      <!-- Head — alien cranium -->
      <ellipse cx="50" cy="35" rx="35" ry="21" fill="url(#rqHeadGradX)"/>
      <ellipse cx="50" cy="35" rx="35" ry="21" stroke="rgba(52,211,153,0.72)" stroke-width="1.8"/>
      <!-- Brain veins -->
      <path d="M28 28 Q40 20 50 23 Q60 20 72 28" stroke="rgba(52,211,153,0.3)" stroke-width="1" fill="none"/>
      <path d="M25 36 Q34 30 43 33" stroke="rgba(52,211,153,0.22)" stroke-width="0.8" fill="none"/>
      <path d="M75 36 Q66 30 57 33" stroke="rgba(52,211,153,0.22)" stroke-width="0.8" fill="none"/>
      <!-- Eyes — large almond -->
      <ellipse class="rq-eye-l" cx="34" cy="37" rx="10" ry="7" fill="#031a0c" stroke="rgba(52,211,153,0.65)" stroke-width="1.4"/>
      <ellipse class="rq-eye-r" cx="66" cy="37" rx="10" ry="7" fill="#031a0c" stroke="rgba(52,211,153,0.65)" stroke-width="1.4"/>
      <ellipse cx="34" cy="37" rx="6.5" ry="4.5" fill="#10b981" filter="url(#rqGlowXenon)" opacity="0.92"/>
      <ellipse cx="66" cy="37" rx="6.5" ry="4.5" fill="#10b981" filter="url(#rqGlowXenon)" opacity="0.92"/>
      <ellipse cx="36" cy="35" rx="2.2" ry="1.7" fill="white" opacity="0.9"/>
      <ellipse cx="68" cy="35" rx="2.2" ry="1.7" fill="white" opacity="0.9"/>
      <!-- Nostrils -->
      <line x1="47" y1="46" x2="49" y2="49" stroke="rgba(52,211,153,0.5)" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="53" y1="46" x2="51" y2="49" stroke="rgba(52,211,153,0.5)" stroke-width="0.9" stroke-linecap="round"/>
      <!-- Mouth -->
      <path class="rq-mouth" d="M35 52 Q50 56 65 52" stroke="rgba(52,211,153,0.78)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Neck -->
      <rect x="40" y="56" width="20" height="14" rx="4" fill="#020e06" stroke="rgba(52,211,153,0.3)" stroke-width="1"/>
      <!-- Body -->
      <rect x="16" y="70" width="68" height="42" rx="16" fill="url(#rqBodyGradX)"/>
      <rect x="16" y="70" width="68" height="42" rx="16" stroke="rgba(52,211,153,0.56)" stroke-width="1.8"/>
      <rect x="26" y="78" width="48" height="26" rx="8" fill="rgba(5,46,22,0.4)" stroke="rgba(52,211,153,0.18)" stroke-width="0.9"/>
      <!-- Chest lights -->
      <circle class="rq-light-1" cx="38" cy="91" r="5.5" fill="#34d399" filter="url(#rqGlowXenon)" opacity="0.9"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5.5" fill="#6ee7b7" filter="url(#rqGlowXenonSoft)" opacity="0.78"/>
      <circle class="rq-light-3" cx="62" cy="91" r="5.5" fill="#34d399" filter="url(#rqGlowXenon)" opacity="0.9"/>
      <!-- Arms — slender -->
      <rect x="3" y="72" width="14" height="28" rx="7" fill="url(#rqArmGradX)" stroke="rgba(52,211,153,0.42)" stroke-width="1.4"/>
      <ellipse cx="10" cy="102" rx="8" ry="7" fill="url(#rqArmGradX)" stroke="rgba(52,211,153,0.42)" stroke-width="1.4"/>
      <rect x="83" y="72" width="14" height="28" rx="7" fill="url(#rqArmGradX)" stroke="rgba(52,211,153,0.42)" stroke-width="1.4"/>
      <ellipse cx="90" cy="102" rx="8" ry="7" fill="url(#rqArmGradX)" stroke="rgba(52,211,153,0.42)" stroke-width="1.4"/>
    </svg>`,
  },

  // ── NUEVO: SIGMA — Energía Digital Legendaria ─────────────────────────────
  {
    id: 'sigma',
    name: 'SIGMA',
    desc: 'Manifestación pura de energía digital — IA más allá de la comprensión',
    price: 0,
    rarity: 'legend',
    bp: true,
    bpLevel: 20,
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="spBg" cx="50%" cy="50%" r="65%"><stop offset="0%" stop-color="#fbbf24" stop-opacity="0.35"/><stop offset="100%" stop-color="#78350f" stop-opacity="0"/></radialGradient>
        <filter id="spGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="44" ry="55" fill="url(#spBg)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(251,191,36,0.2)"/>
      <!-- Antenna — energy spike -->
      <line x1="50" y1="3" x2="50" y2="18" stroke="rgba(253,224,71,0.9)" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="50,0 53,8 47,8" fill="#fbbf24" filter="url(#spGlow)"/>
      <!-- Head — geometric diamond shape with flat top/bottom -->
      <rect x="17" y="18" width="66" height="44" rx="10" fill="#1c0e00" stroke="rgba(251,191,36,0.8)" stroke-width="2"/>
      <!-- Circuit lines on head -->
      <line x1="25" y1="24" x2="35" y2="24" stroke="rgba(251,191,36,0.3)" stroke-width="0.8"/>
      <line x1="35" y1="24" x2="35" y2="30" stroke="rgba(251,191,36,0.3)" stroke-width="0.8"/>
      <line x1="65" y1="24" x2="75" y2="24" stroke="rgba(251,191,36,0.3)" stroke-width="0.8"/>
      <line x1="65" y1="24" x2="65" y2="30" stroke="rgba(251,191,36,0.3)" stroke-width="0.8"/>
      <line x1="25" y1="56" x2="35" y2="56" stroke="rgba(251,191,36,0.3)" stroke-width="0.8"/>
      <line x1="35" y1="56" x2="35" y2="50" stroke="rgba(251,191,36,0.3)" stroke-width="0.8"/>
      <!-- Eyes — diamond shaped energy -->
      <polygon points="28,35.5 37,30 46,35.5 37,41" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" stroke-width="1.2" filter="url(#spGlow)"/>
      <polygon points="54,35.5 63,30 72,35.5 63,41" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" stroke-width="1.2" filter="url(#spGlow)"/>
      <circle cx="37" cy="35.5" r="3.5" fill="#fde68a" filter="url(#spGlow)" opacity="0.95"/>
      <circle cx="63" cy="35.5" r="3.5" fill="#fde68a" filter="url(#spGlow)" opacity="0.95"/>
      <!-- Mouth — energy beam -->
      <rect x="30" y="50" width="40" height="4" rx="2" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.55)" stroke-width="1"/>
      <rect x="30" y="51" width="40" height="2" rx="1" fill="#fbbf24" opacity="0.6" filter="url(#spGlow)"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#150a00" stroke="rgba(251,191,36,0.7)" stroke-width="2"/>
      <!-- Circuit board pattern -->
      <line x1="22" y1="80" x2="38" y2="80" stroke="rgba(251,191,36,0.25)" stroke-width="0.8"/>
      <line x1="38" y1="80" x2="38" y2="86" stroke="rgba(251,191,36,0.25)" stroke-width="0.8"/>
      <line x1="62" y1="80" x2="78" y2="80" stroke="rgba(251,191,36,0.25)" stroke-width="0.8"/>
      <line x1="62" y1="80" x2="62" y2="86" stroke="rgba(251,191,36,0.25)" stroke-width="0.8"/>
      <line x1="22" y1="108" x2="38" y2="108" stroke="rgba(251,191,36,0.2)" stroke-width="0.8"/>
      <line x1="62" y1="108" x2="78" y2="108" stroke="rgba(251,191,36,0.2)" stroke-width="0.8"/>
      <!-- Chest — energy cores -->
      <circle cx="36" cy="91" r="5" fill="#fbbf24" filter="url(#spGlow)" opacity="0.95"/>
      <circle cx="50" cy="91" r="6" fill="#fde68a" filter="url(#spGlow)" opacity="0.9"/>
      <circle cx="64" cy="91" r="5" fill="#fbbf24" filter="url(#spGlow)" opacity="0.95"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#150a00" stroke="rgba(251,191,36,0.45)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="#150a00" stroke="rgba(251,191,36,0.45)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#150a00" stroke="rgba(251,191,36,0.45)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="#150a00" stroke="rgba(251,191,36,0.45)" stroke-width="1.5"/>
      <!-- PASE badge -->
      <text x="10" y="20" font-size="7" fill="rgba(253,224,71,0.8)" font-family="monospace" font-weight="bold">★PASE</text>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradS" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1c0e00"/><stop offset="100%" stop-color="#0a0400"/>
        </linearGradient>
        <linearGradient id="rqBodyGradS" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#150a00"/><stop offset="100%" stop-color="#070300"/>
        </linearGradient>
        <linearGradient id="rqArmGradS" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#1c0e00"/><stop offset="100%" stop-color="#0a0400"/>
        </linearGradient>
        <filter id="rqGlowSigma" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowSigmaSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqSigmaAura" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#78350f" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Golden aura -->
      <ellipse cx="50" cy="64" rx="48" ry="58" fill="url(#rqSigmaAura)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(251,191,36,0.28)"/>
      <!-- Antenna — energy spike -->
      <line x1="50" y1="4" x2="50" y2="18" stroke="rgba(253,224,71,0.92)" stroke-width="2.5" stroke-linecap="round"/>
      <polygon class="rq-antenna" points="50,0 54,9 46,9" fill="#fbbf24" filter="url(#rqGlowSigma)"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="10" fill="url(#rqHeadGradS)"/>
      <rect x="17" y="18" width="66" height="44" rx="10" stroke="rgba(251,191,36,0.82)" stroke-width="2.2"/>
      <!-- Circuit traces on head -->
      <line x1="24" y1="23" x2="36" y2="23" stroke="rgba(251,191,36,0.28)" stroke-width="0.9"/>
      <line x1="36" y1="23" x2="36" y2="30" stroke="rgba(251,191,36,0.28)" stroke-width="0.9"/>
      <line x1="64" y1="23" x2="76" y2="23" stroke="rgba(251,191,36,0.28)" stroke-width="0.9"/>
      <line x1="64" y1="23" x2="64" y2="30" stroke="rgba(251,191,36,0.28)" stroke-width="0.9"/>
      <line x1="24" y1="57" x2="36" y2="57" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="36" y1="57" x2="36" y2="50" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="64" y1="57" x2="76" y2="57" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="64" y1="57" x2="64" y2="50" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <!-- Eyes — diamond energy -->
      <polygon class="rq-eye-l" points="27,35.5 37,29 47,35.5 37,42" fill="rgba(251,191,36,0.22)" stroke="#fbbf24" stroke-width="1.4" filter="url(#rqGlowSigmaSoft)"/>
      <polygon class="rq-eye-r" points="53,35.5 63,29 73,35.5 63,42" fill="rgba(251,191,36,0.22)" stroke="#fbbf24" stroke-width="1.4" filter="url(#rqGlowSigmaSoft)"/>
      <circle cx="37" cy="35.5" r="4" fill="#fde68a" filter="url(#rqGlowSigma)" opacity="0.96"/>
      <circle cx="63" cy="35.5" r="4" fill="#fde68a" filter="url(#rqGlowSigma)" opacity="0.96"/>
      <!-- Mouth — energy beam -->
      <rect class="rq-mouth" x="28" y="50" width="44" height="5" rx="2.5" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.55)" stroke-width="1.1"/>
      <rect x="28" y="51.5" width="44" height="2" rx="1" fill="#fbbf24" opacity="0.65" filter="url(#rqGlowSigmaSoft)"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(15,7,0,0.95)" stroke="rgba(251,191,36,0.32)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradS)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(251,191,36,0.72)" stroke-width="2.2"/>
      <!-- Circuit board body -->
      <line x1="22" y1="79" x2="40" y2="79" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="40" y1="79" x2="40" y2="84" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="60" y1="79" x2="78" y2="79" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="60" y1="79" x2="60" y2="84" stroke="rgba(251,191,36,0.22)" stroke-width="0.9"/>
      <line x1="22" y1="109" x2="40" y2="109" stroke="rgba(251,191,36,0.18)" stroke-width="0.9"/>
      <line x1="60" y1="109" x2="78" y2="109" stroke="rgba(251,191,36,0.18)" stroke-width="0.9"/>
      <!-- Chest — energy cores -->
      <circle class="rq-light-1" cx="36" cy="91" r="5.5" fill="#fbbf24" filter="url(#rqGlowSigma)" opacity="0.95"/>
      <circle class="rq-light-2" cx="50" cy="91" r="6.5" fill="#fde68a" filter="url(#rqGlowSigma)" opacity="0.92"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5.5" fill="#fbbf24" filter="url(#rqGlowSigma)" opacity="0.95"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradS)" stroke="rgba(251,191,36,0.48)" stroke-width="1.6"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradS)" stroke="rgba(251,191,36,0.48)" stroke-width="1.6"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradS)" stroke="rgba(251,191,36,0.48)" stroke-width="1.6"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradS)" stroke="rgba(251,191,36,0.48)" stroke-width="1.6"/>
    </svg>`,
  },

  // ── NUEVO: VORTEX — Materia Oscura ────────────────────────────────────────
  {
    id: 'vortex',
    name: 'VORTEX',
    desc: 'Entidad nacida en el vacío entre dimensiones — pura materia oscura',
    price: 180,
    rarity: 'epic',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="vtBg" cx="50%" cy="50%" r="65%"><stop offset="0%" stop-color="#0f0030" stop-opacity="0.9"/><stop offset="100%" stop-color="#000008" stop-opacity="0"/></radialGradient>
        <filter id="vtGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="44" ry="54" fill="url(#vtBg)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(139,92,246,0.15)"/>
      <!-- Antenna — spiral vortex -->
      <path d="M50 18 Q53 14 50 10 Q47 6 50 3" stroke="rgba(167,139,250,0.85)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="3" r="3.5" fill="#7c3aed" filter="url(#vtGlow)"/>
      <!-- Head — dark void with event horizon ring -->
      <rect x="17" y="18" width="66" height="44" rx="14" fill="#07001a" stroke="rgba(109,40,217,0.75)" stroke-width="1.8"/>
      <rect x="20" y="21" width="60" height="38" rx="11" fill="none" stroke="rgba(167,139,250,0.15)" stroke-width="0.7"/>
      <!-- Void swirl pattern -->
      <path d="M35 38 Q42 28 50 36 Q58 44 65 34" stroke="rgba(109,40,217,0.4)" stroke-width="1" fill="none"/>
      <path d="M38 42 Q46 34 50 40 Q54 46 62 38" stroke="rgba(167,139,250,0.25)" stroke-width="0.7" fill="none"/>
      <!-- Eyes — singularity orbs -->
      <circle cx="35" cy="35" r="9" fill="#0a0020" stroke="rgba(109,40,217,0.6)" stroke-width="1.2"/>
      <circle cx="65" cy="35" r="9" fill="#0a0020" stroke="rgba(109,40,217,0.6)" stroke-width="1.2"/>
      <circle cx="35" cy="35" r="5" fill="#4c1d95" filter="url(#vtGlow)" opacity="0.95"/>
      <circle cx="65" cy="35" r="5" fill="#4c1d95" filter="url(#vtGlow)" opacity="0.95"/>
      <circle cx="35" cy="35" r="2" fill="#c4b5fd" opacity="0.9"/>
      <circle cx="65" cy="35" r="2" fill="#c4b5fd" opacity="0.9"/>
      <!-- Mouth — event horizon line -->
      <path d="M34 52 Q50 48 66 52" stroke="rgba(139,92,246,0.8)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M40 52 Q50 50 60 52" stroke="rgba(196,181,253,0.4)" stroke-width="0.8" fill="none"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#060015" stroke="rgba(109,40,217,0.65)" stroke-width="1.8"/>
      <!-- Void rings on chest -->
      <ellipse cx="50" cy="91" rx="22" ry="10" fill="none" stroke="rgba(109,40,217,0.3)" stroke-width="0.8"/>
      <ellipse cx="50" cy="91" rx="14" ry="6" fill="none" stroke="rgba(139,92,246,0.25)" stroke-width="0.7"/>
      <circle cx="36" cy="91" r="5" fill="#5b21b6" filter="url(#vtGlow)" opacity="0.9"/>
      <circle cx="50" cy="91" r="5" fill="#7c3aed" filter="url(#vtGlow)" opacity="0.85"/>
      <circle cx="64" cy="91" r="5" fill="#5b21b6" filter="url(#vtGlow)" opacity="0.9"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#07001a" stroke="rgba(109,40,217,0.4)" stroke-width="1.3"/>
      <circle cx="7" cy="100" r="7" fill="#07001a" stroke="rgba(109,40,217,0.4)" stroke-width="1.3"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#07001a" stroke="rgba(109,40,217,0.4)" stroke-width="1.3"/>
      <circle cx="93" cy="100" r="7" fill="#07001a" stroke="rgba(109,40,217,0.4)" stroke-width="1.3"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradV" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0f0030"/><stop offset="100%" stop-color="#03000d"/>
        </linearGradient>
        <linearGradient id="rqBodyGradV" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#080020"/><stop offset="100%" stop-color="#020008"/>
        </linearGradient>
        <linearGradient id="rqArmGradV" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#0f0030"/><stop offset="100%" stop-color="#03000d"/>
        </linearGradient>
        <filter id="rqGlowVortex" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowVortexSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqVortexAura" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#4c1d95" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000008" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Dark aura -->
      <ellipse cx="50" cy="64" rx="48" ry="58" fill="url(#rqVortexAura)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(139,92,246,0.2)"/>
      <!-- Antenna — spiral -->
      <path d="M50 18 Q54 13 50 9 Q46 5 50 2" stroke="rgba(167,139,250,0.88)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle class="rq-antenna" cx="50" cy="2" r="4" fill="#7c3aed" filter="url(#rqGlowVortex)"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="14" fill="url(#rqHeadGradV)"/>
      <rect x="17" y="18" width="66" height="44" rx="14" stroke="rgba(109,40,217,0.78)" stroke-width="2"/>
      <rect x="20" y="21" width="60" height="38" rx="11" fill="none" stroke="rgba(167,139,250,0.12)" stroke-width="0.8"/>
      <!-- Void swirls -->
      <path d="M33 37 Q42 26 50 35 Q58 44 67 33" stroke="rgba(109,40,217,0.42)" stroke-width="1.1" fill="none"/>
      <path d="M37 42 Q46 33 50 39 Q54 45 63 37" stroke="rgba(167,139,250,0.22)" stroke-width="0.8" fill="none"/>
      <!-- Eyes — singularity -->
      <circle x="26" y="26" r="11" cx="35" cy="35" fill="#06001a" stroke="rgba(109,40,217,0.65)" stroke-width="1.4"/>
      <circle x="54" y="26" r="11" cx="65" cy="35" fill="#06001a" stroke="rgba(109,40,217,0.65)" stroke-width="1.4"/>
      <circle class="rq-eye-l" cx="35" cy="35" r="6" fill="#5b21b6" filter="url(#rqGlowVortex)" opacity="0.95"/>
      <circle class="rq-eye-r" cx="65" cy="35" r="6" fill="#5b21b6" filter="url(#rqGlowVortex)" opacity="0.95"/>
      <circle cx="35" cy="35" r="2.5" fill="#ddd6fe" opacity="0.92"/>
      <circle cx="65" cy="35" r="2.5" fill="#ddd6fe" opacity="0.92"/>
      <!-- Mouth -->
      <path class="rq-mouth" d="M33 52 Q50 47 67 52" stroke="rgba(139,92,246,0.88)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M39 51.5 Q50 49 61 51.5" stroke="rgba(196,181,253,0.4)" stroke-width="0.9" fill="none"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(6,0,20,0.95)" stroke="rgba(109,40,217,0.3)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradV)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(109,40,217,0.65)" stroke-width="2"/>
      <!-- Void rings -->
      <ellipse cx="50" cy="91" rx="24" ry="11" fill="none" stroke="rgba(109,40,217,0.28)" stroke-width="0.9"/>
      <ellipse cx="50" cy="91" rx="16" ry="7" fill="none" stroke="rgba(139,92,246,0.22)" stroke-width="0.8"/>
      <!-- Chest lights -->
      <circle class="rq-light-1" cx="36" cy="91" r="5.5" fill="#5b21b6" filter="url(#rqGlowVortex)" opacity="0.92"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5.5" fill="#7c3aed" filter="url(#rqGlowVortexSoft)" opacity="0.88"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5.5" fill="#5b21b6" filter="url(#rqGlowVortex)" opacity="0.92"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradV)" stroke="rgba(109,40,217,0.42)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradV)" stroke="rgba(109,40,217,0.42)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradV)" stroke="rgba(109,40,217,0.42)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradV)" stroke="rgba(109,40,217,0.42)" stroke-width="1.5"/>
    </svg>`,
  },

  // ── NUEVO: FROST — Criogénico Ártico ──────────────────────────────────────
  {
    id: 'frost',
    name: 'FROST',
    desc: 'Unidad criogénica sellada en hielo cuántico — temperatura cero absoluto',
    price: 140,
    rarity: 'rare',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="frBg" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#0e2a4a" stop-opacity="0.9"/><stop offset="100%" stop-color="#000510" stop-opacity="0"/></radialGradient>
        <filter id="frGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="42" ry="53" fill="url(#frBg)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(147,197,253,0.15)"/>
      <!-- Antenna — snowflake crystal -->
      <line x1="50" y1="18" x2="50" y2="3" stroke="rgba(186,230,253,0.85)" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="44" y1="10" x2="56" y2="10" stroke="rgba(186,230,253,0.7)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="46" y1="6" x2="54" y2="14" stroke="rgba(186,230,253,0.5)" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="54" y1="6" x2="46" y2="14" stroke="rgba(186,230,253,0.5)" stroke-width="0.9" stroke-linecap="round"/>
      <circle cx="50" cy="10" r="2.5" fill="#bae6fd" filter="url(#frGlow)"/>
      <!-- Head — ice-plated armour -->
      <rect x="17" y="18" width="66" height="44" rx="12" fill="#040f1f" stroke="rgba(147,197,253,0.72)" stroke-width="1.8"/>
      <!-- Ice plate facets -->
      <polygon points="17,40 28,25 45,22 55,22 72,25 83,40 83,42 72,30 55,28 45,28 28,30 17,42" fill="rgba(186,230,253,0.06)" stroke="rgba(186,230,253,0.18)" stroke-width="0.6"/>
      <!-- Eyes — crystal blue -->
      <rect x="27" y="28" width="20" height="14" rx="7" fill="#071e33" stroke="rgba(147,197,253,0.65)" stroke-width="1.2"/>
      <rect x="53" y="28" width="20" height="14" rx="7" fill="#071e33" stroke="rgba(147,197,253,0.65)" stroke-width="1.2"/>
      <rect x="30" y="31" width="14" height="8" rx="4" fill="#7dd3fc" filter="url(#frGlow)" opacity="0.9"/>
      <rect x="56" y="31" width="14" height="8" rx="4" fill="#7dd3fc" filter="url(#frGlow)" opacity="0.9"/>
      <circle cx="34" cy="35" r="2" fill="white" opacity="0.9"/>
      <circle cx="60" cy="35" r="2" fill="white" opacity="0.9"/>
      <!-- Mouth — frozen grill -->
      <rect x="32" y="48" width="36" height="6" rx="3" fill="rgba(7,30,51,0.8)" stroke="rgba(147,197,253,0.5)" stroke-width="1"/>
      <line x1="38" y1="48" x2="38" y2="54" stroke="rgba(147,197,253,0.4)" stroke-width="0.7"/>
      <line x1="44" y1="48" x2="44" y2="54" stroke="rgba(147,197,253,0.4)" stroke-width="0.7"/>
      <line x1="50" y1="48" x2="50" y2="54" stroke="rgba(147,197,253,0.4)" stroke-width="0.7"/>
      <line x1="56" y1="48" x2="56" y2="54" stroke="rgba(147,197,253,0.4)" stroke-width="0.7"/>
      <line x1="62" y1="48" x2="62" y2="54" stroke="rgba(147,197,253,0.4)" stroke-width="0.7"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#030d1a" stroke="rgba(147,197,253,0.62)" stroke-width="1.8"/>
      <polygon points="12,82 24,75 76,75 88,82 88,84 76,77 24,77 12,84" fill="rgba(186,230,253,0.05)" stroke="rgba(186,230,253,0.15)" stroke-width="0.6"/>
      <circle cx="36" cy="91" r="5" fill="#38bdf8" filter="url(#frGlow)" opacity="0.88"/>
      <circle cx="50" cy="91" r="5" fill="#bae6fd" filter="url(#frGlow)" opacity="0.75"/>
      <circle cx="64" cy="91" r="5" fill="#38bdf8" filter="url(#frGlow)" opacity="0.88"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#030d1a" stroke="rgba(147,197,253,0.38)" stroke-width="1.3"/>
      <circle cx="7" cy="100" r="7" fill="#030d1a" stroke="rgba(147,197,253,0.38)" stroke-width="1.3"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#030d1a" stroke="rgba(147,197,253,0.38)" stroke-width="1.3"/>
      <circle cx="93" cy="100" r="7" fill="#030d1a" stroke="rgba(147,197,253,0.38)" stroke-width="1.3"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradFr" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0c2340"/><stop offset="100%" stop-color="#03090f"/>
        </linearGradient>
        <linearGradient id="rqBodyGradFr" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#071a30"/><stop offset="100%" stop-color="#020608"/>
        </linearGradient>
        <linearGradient id="rqArmGradFr" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#0c2340"/><stop offset="100%" stop-color="#03090f"/>
        </linearGradient>
        <filter id="rqGlowFrost" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowFrostSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqFrostAura" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#000510" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Ice aura -->
      <ellipse cx="50" cy="64" rx="48" ry="58" fill="url(#rqFrostAura)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(147,197,253,0.18)"/>
      <!-- Antenna — snowflake -->
      <line x1="50" y1="18" x2="50" y2="2" stroke="rgba(186,230,253,0.88)" stroke-width="2" stroke-linecap="round"/>
      <line x1="43" y1="10" x2="57" y2="10" stroke="rgba(186,230,253,0.72)" stroke-width="1.4" stroke-linecap="round"/>
      <line x1="45" y1="5" x2="55" y2="15" stroke="rgba(186,230,253,0.5)" stroke-width="1" stroke-linecap="round"/>
      <line x1="55" y1="5" x2="45" y2="15" stroke="rgba(186,230,253,0.5)" stroke-width="1" stroke-linecap="round"/>
      <circle class="rq-antenna" cx="50" cy="10" r="3.5" fill="#bae6fd" filter="url(#rqGlowFrost)"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="12" fill="url(#rqHeadGradFr)"/>
      <rect x="17" y="18" width="66" height="44" rx="12" stroke="rgba(147,197,253,0.75)" stroke-width="2"/>
      <!-- Ice facets -->
      <polygon points="17,40 29,24 46,21 54,21 71,24 83,40 83,42 71,26 54,23 46,23 29,26 17,42" fill="rgba(186,230,253,0.05)" stroke="rgba(186,230,253,0.16)" stroke-width="0.7"/>
      <!-- Eyes — wide rectangle crystal -->
      <rect class="rq-eye-l" x="26" y="27" width="22" height="16" rx="8" fill="#061626" stroke="rgba(147,197,253,0.68)" stroke-width="1.3"/>
      <rect class="rq-eye-r" x="52" y="27" width="22" height="16" rx="8" fill="#061626" stroke="rgba(147,197,253,0.68)" stroke-width="1.3"/>
      <rect x="29" y="30" width="16" height="10" rx="5" fill="#7dd3fc" filter="url(#rqGlowFrost)" opacity="0.92"/>
      <rect x="55" y="30" width="16" height="10" rx="5" fill="#7dd3fc" filter="url(#rqGlowFrost)" opacity="0.92"/>
      <circle cx="33" cy="35" r="2.5" fill="white" opacity="0.92"/>
      <circle cx="59" cy="35" r="2.5" fill="white" opacity="0.92"/>
      <!-- Mouth — ice grill -->
      <rect class="rq-mouth" x="31" y="49" width="38" height="7" rx="3.5" fill="rgba(6,22,38,0.85)" stroke="rgba(147,197,253,0.55)" stroke-width="1.2"/>
      <line x1="37" y1="49" x2="37" y2="56" stroke="rgba(147,197,253,0.42)" stroke-width="0.8"/>
      <line x1="43" y1="49" x2="43" y2="56" stroke="rgba(147,197,253,0.42)" stroke-width="0.8"/>
      <line x1="50" y1="49" x2="50" y2="56" stroke="rgba(147,197,253,0.42)" stroke-width="0.8"/>
      <line x1="57" y1="49" x2="57" y2="56" stroke="rgba(147,197,253,0.42)" stroke-width="0.8"/>
      <line x1="63" y1="49" x2="63" y2="56" stroke="rgba(147,197,253,0.42)" stroke-width="0.8"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(3,9,15,0.95)" stroke="rgba(147,197,253,0.3)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradFr)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(147,197,253,0.65)" stroke-width="2"/>
      <polygon points="12,82 25,74 75,74 88,82 88,84 75,76 25,76 12,84" fill="rgba(186,230,253,0.04)" stroke="rgba(186,230,253,0.14)" stroke-width="0.7"/>
      <!-- Chest lights -->
      <circle class="rq-light-1" cx="36" cy="91" r="5.5" fill="#38bdf8" filter="url(#rqGlowFrost)" opacity="0.9"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5.5" fill="#bae6fd" filter="url(#rqGlowFrostSoft)" opacity="0.8"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5.5" fill="#38bdf8" filter="url(#rqGlowFrost)" opacity="0.9"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradFr)" stroke="rgba(147,197,253,0.4)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradFr)" stroke="rgba(147,197,253,0.4)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradFr)" stroke="rgba(147,197,253,0.4)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradFr)" stroke="rgba(147,197,253,0.4)" stroke-width="1.5"/>
    </svg>`,
  },

  // ── NUEVO: PYRO — Plasma Solar ────────────────────────────────────────────
  {
    id: 'pyro',
    name: 'PYRO',
    desc: 'Forjado en el núcleo de una estrella — plasma solar a temperatura máxima',
    price: 200,
    rarity: 'epic',
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="pyBg" cx="50%" cy="60%" r="65%"><stop offset="0%" stop-color="#7c1010" stop-opacity="0.8"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/></radialGradient>
        <filter id="pyGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="44" ry="54" fill="url(#pyBg)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(251,146,60,0.18)"/>
      <!-- Antenna — flame spike -->
      <path d="M50 18 Q54 12 50 6 Q46 1 50 0" stroke="rgba(253,186,116,0.85)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M50 15 Q46 10 50 6" stroke="rgba(251,146,60,0.5)" stroke-width="1.2" fill="none"/>
      <ellipse cx="50" cy="3" rx="3" ry="4" fill="#fb923c" filter="url(#pyGlow)"/>
      <!-- Head — forge-plated -->
      <rect x="17" y="18" width="66" height="44" rx="11" fill="#1a0500" stroke="rgba(251,146,60,0.78)" stroke-width="1.8"/>
      <!-- Heat vent lines on head -->
      <line x1="27" y1="22" x2="27" y2="30" stroke="rgba(251,146,60,0.3)" stroke-width="1"/>
      <line x1="33" y1="22" x2="33" y2="28" stroke="rgba(251,146,60,0.2)" stroke-width="0.8"/>
      <line x1="67" y1="22" x2="67" y2="30" stroke="rgba(251,146,60,0.3)" stroke-width="1"/>
      <line x1="73" y1="22" x2="73" y2="28" stroke="rgba(251,146,60,0.2)" stroke-width="0.8"/>
      <!-- Eyes — ember cores -->
      <rect x="27" y="29" width="20" height="14" rx="6" fill="#1a0500" stroke="rgba(251,146,60,0.65)" stroke-width="1.2"/>
      <rect x="53" y="29" width="20" height="14" rx="6" fill="#1a0500" stroke="rgba(251,146,60,0.65)" stroke-width="1.2"/>
      <ellipse cx="37" cy="36" rx="7" ry="5" fill="#f97316" filter="url(#pyGlow)" opacity="0.92"/>
      <ellipse cx="63" cy="36" rx="7" ry="5" fill="#f97316" filter="url(#pyGlow)" opacity="0.92"/>
      <circle cx="37" cy="35" r="2.2" fill="#fef08a" opacity="0.95"/>
      <circle cx="63" cy="35" r="2.2" fill="#fef08a" opacity="0.95"/>
      <!-- Mouth — heat slash -->
      <path d="M33 50 Q50 44 67 50" stroke="rgba(251,146,60,0.85)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M38 49.5 Q50 46 62 49.5" stroke="rgba(253,186,116,0.4)" stroke-width="0.9" fill="none"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#120300" stroke="rgba(251,146,60,0.68)" stroke-width="1.8"/>
      <!-- Heat vents on body -->
      <line x1="22" y1="80" x2="22" y2="90" stroke="rgba(251,146,60,0.25)" stroke-width="1.1"/>
      <line x1="27" y1="78" x2="27" y2="92" stroke="rgba(251,146,60,0.18)" stroke-width="0.9"/>
      <line x1="73" y1="78" x2="73" y2="92" stroke="rgba(251,146,60,0.18)" stroke-width="0.9"/>
      <line x1="78" y1="80" x2="78" y2="90" stroke="rgba(251,146,60,0.25)" stroke-width="1.1"/>
      <circle cx="36" cy="91" r="5" fill="#ea580c" filter="url(#pyGlow)" opacity="0.92"/>
      <circle cx="50" cy="91" r="5" fill="#fb923c" filter="url(#pyGlow)" opacity="0.85"/>
      <circle cx="64" cy="91" r="5" fill="#ea580c" filter="url(#pyGlow)" opacity="0.92"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#120300" stroke="rgba(251,146,60,0.38)" stroke-width="1.3"/>
      <circle cx="7" cy="100" r="7" fill="#120300" stroke="rgba(251,146,60,0.38)" stroke-width="1.3"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#120300" stroke="rgba(251,146,60,0.38)" stroke-width="1.3"/>
      <circle cx="93" cy="100" r="7" fill="#120300" stroke="rgba(251,146,60,0.38)" stroke-width="1.3"/>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradPy" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#291000"/><stop offset="100%" stop-color="#0a0200"/>
        </linearGradient>
        <linearGradient id="rqBodyGradPy" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1f0800"/><stop offset="100%" stop-color="#080100"/>
        </linearGradient>
        <linearGradient id="rqArmGradPy" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#291000"/><stop offset="100%" stop-color="#0a0200"/>
        </linearGradient>
        <filter id="rqGlowPyro" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowPyroSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqPyroAura" cx="50%" cy="60%" r="65%">
          <stop offset="0%" stop-color="#c2410c" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Fire aura -->
      <ellipse cx="50" cy="66" rx="48" ry="58" fill="url(#rqPyroAura)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(251,146,60,0.22)"/>
      <!-- Antenna — flame -->
      <path d="M50 18 Q55 11 50 5 Q45 0 50 -1" stroke="rgba(253,186,116,0.88)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M50 15 Q45 9 50 5" stroke="rgba(251,146,60,0.55)" stroke-width="1.4" fill="none"/>
      <ellipse class="rq-antenna" cx="50" cy="3" rx="3.5" ry="5" fill="#fb923c" filter="url(#rqGlowPyro)"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="11" fill="url(#rqHeadGradPy)"/>
      <rect x="17" y="18" width="66" height="44" rx="11" stroke="rgba(251,146,60,0.8)" stroke-width="2"/>
      <!-- Heat vents -->
      <line x1="26" y1="21" x2="26" y2="31" stroke="rgba(251,146,60,0.32)" stroke-width="1.1"/>
      <line x1="32" y1="21" x2="32" y2="29" stroke="rgba(251,146,60,0.22)" stroke-width="0.9"/>
      <line x1="68" y1="21" x2="68" y2="31" stroke="rgba(251,146,60,0.32)" stroke-width="1.1"/>
      <line x1="74" y1="21" x2="74" y2="29" stroke="rgba(251,146,60,0.22)" stroke-width="0.9"/>
      <!-- Eyes — ember cores -->
      <rect class="rq-eye-l" x="26" y="28" width="22" height="16" rx="7" fill="#180400" stroke="rgba(251,146,60,0.68)" stroke-width="1.4"/>
      <rect class="rq-eye-r" x="52" y="28" width="22" height="16" rx="7" fill="#180400" stroke="rgba(251,146,60,0.68)" stroke-width="1.4"/>
      <ellipse cx="37" cy="36" rx="8" ry="5.5" fill="#f97316" filter="url(#rqGlowPyro)" opacity="0.94"/>
      <ellipse cx="63" cy="36" rx="8" ry="5.5" fill="#f97316" filter="url(#rqGlowPyro)" opacity="0.94"/>
      <circle cx="37" cy="35" r="2.8" fill="#fef08a" opacity="0.97"/>
      <circle cx="63" cy="35" r="2.8" fill="#fef08a" opacity="0.97"/>
      <!-- Mouth -->
      <path class="rq-mouth" d="M32 51 Q50 45 68 51" stroke="rgba(251,146,60,0.88)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M38 50.5 Q50 47 62 50.5" stroke="rgba(253,186,116,0.42)" stroke-width="1" fill="none"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(10,2,0,0.95)" stroke="rgba(251,146,60,0.3)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradPy)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(251,146,60,0.7)" stroke-width="2"/>
      <!-- Heat vents body -->
      <line x1="21" y1="79" x2="21" y2="91" stroke="rgba(251,146,60,0.26)" stroke-width="1.1"/>
      <line x1="26" y1="77" x2="26" y2="95" stroke="rgba(251,146,60,0.18)" stroke-width="0.9"/>
      <line x1="74" y1="77" x2="74" y2="95" stroke="rgba(251,146,60,0.18)" stroke-width="0.9"/>
      <line x1="79" y1="79" x2="79" y2="91" stroke="rgba(251,146,60,0.26)" stroke-width="1.1"/>
      <!-- Chest lights -->
      <circle class="rq-light-1" cx="36" cy="91" r="5.5" fill="#ea580c" filter="url(#rqGlowPyro)" opacity="0.94"/>
      <circle class="rq-light-2" cx="50" cy="91" r="5.5" fill="#fb923c" filter="url(#rqGlowPyroSoft)" opacity="0.88"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5.5" fill="#ea580c" filter="url(#rqGlowPyro)" opacity="0.94"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradPy)" stroke="rgba(251,146,60,0.42)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradPy)" stroke="rgba(251,146,60,0.42)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradPy)" stroke="rgba(251,146,60,0.42)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradPy)" stroke="rgba(251,146,60,0.42)" stroke-width="1.5"/>
    </svg>`,
  },

  // ── NUEVO: APEX — Leyenda del Pase Estelar ───────────────────────────────
  {
    id: 'apex',
    name: 'APEX',
    desc: 'La cima de la evolución artificial — solo los elegidos del Pase Estelar lo poseen',
    price: 0,
    rarity: 'legend',
    bp: true,
    bpLevel: 25,
    previewSvg: `<svg viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <defs>
        <radialGradient id="apBg" cx="50%" cy="50%" r="65%"><stop offset="0%" stop-color="#1a0040" stop-opacity="0.9"/><stop offset="40%" stop-color="#0a001a" stop-opacity="0.5"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/></radialGradient>
        <filter id="apGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="50" cy="66" rx="46" ry="56" fill="url(#apBg)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(167,139,250,0.22)"/>
      <!-- Halo crown -->
      <ellipse cx="50" cy="7" rx="18" ry="5" fill="none" stroke="rgba(253,224,71,0.6)" stroke-width="1.5"/>
      <ellipse cx="50" cy="7" rx="18" ry="5" fill="none" stroke="rgba(167,139,250,0.4)" stroke-width="0.6"/>
      <!-- Crown spikes -->
      <polygon points="32,7 35,2 38,7" fill="rgba(253,224,71,0.7)"/>
      <polygon points="47,5 50,0 53,5" fill="#fde68a" filter="url(#apGlow)"/>
      <polygon points="62,7 65,2 68,7" fill="rgba(253,224,71,0.7)"/>
      <!-- Antenna -->
      <line x1="50" y1="18" x2="50" y2="12" stroke="rgba(196,181,253,0.8)" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Head — regal hexagonal -->
      <rect x="17" y="18" width="66" height="44" rx="13" fill="#0d0026" stroke="rgba(139,92,246,0.8)" stroke-width="2"/>
      <rect x="17" y="18" width="66" height="44" rx="13" stroke="rgba(253,224,71,0.25)" stroke-width="0.8"/>
      <!-- Gold trim lines -->
      <line x1="17" y1="26" x2="83" y2="26" stroke="rgba(253,224,71,0.18)" stroke-width="0.7"/>
      <line x1="17" y1="54" x2="83" y2="54" stroke="rgba(253,224,71,0.18)" stroke-width="0.7"/>
      <!-- Eyes — twin stars -->
      <circle cx="35" cy="37" r="10" fill="#0a0020" stroke="rgba(139,92,246,0.6)" stroke-width="1.2"/>
      <circle cx="65" cy="37" r="10" fill="#0a0020" stroke="rgba(139,92,246,0.6)" stroke-width="1.2"/>
      <circle cx="35" cy="37" r="6" fill="#7c3aed" filter="url(#apGlow)" opacity="0.95"/>
      <circle cx="65" cy="37" r="6" fill="#7c3aed" filter="url(#apGlow)" opacity="0.95"/>
      <circle cx="35" cy="37" r="3" fill="#fde68a" filter="url(#apGlow)" opacity="0.9"/>
      <circle cx="65" cy="37" r="3" fill="#fde68a" filter="url(#apGlow)" opacity="0.9"/>
      <circle cx="36.5" cy="35.5" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="66.5" cy="35.5" r="1.5" fill="white" opacity="0.9"/>
      <!-- Mouth — golden arc -->
      <path d="M34 52 Q50 47 66 52" stroke="rgba(253,224,71,0.8)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M39 51.5 Q50 49 61 51.5" stroke="rgba(196,181,253,0.45)" stroke-width="0.9" fill="none"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="#08001e" stroke="rgba(139,92,246,0.72)" stroke-width="2"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(253,224,71,0.2)" stroke-width="0.8"/>
      <line x1="12" y1="78" x2="88" y2="78" stroke="rgba(253,224,71,0.15)" stroke-width="0.7"/>
      <line x1="12" y1="104" x2="88" y2="104" stroke="rgba(253,224,71,0.15)" stroke-width="0.7"/>
      <!-- Star cores -->
      <circle cx="36" cy="91" r="5" fill="#7c3aed" filter="url(#apGlow)" opacity="0.92"/>
      <circle cx="50" cy="91" r="6" fill="#fde68a" filter="url(#apGlow)" opacity="0.9"/>
      <circle cx="64" cy="91" r="5" fill="#7c3aed" filter="url(#apGlow)" opacity="0.92"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="#08001e" stroke="rgba(139,92,246,0.4)" stroke-width="1.3"/>
      <circle cx="7" cy="100" r="7" fill="#08001e" stroke="rgba(139,92,246,0.4)" stroke-width="1.3"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="#08001e" stroke="rgba(139,92,246,0.4)" stroke-width="1.3"/>
      <circle cx="93" cy="100" r="7" fill="#08001e" stroke="rgba(139,92,246,0.4)" stroke-width="1.3"/>
      <text x="10" y="20" font-size="7" fill="rgba(253,224,71,0.8)" font-family="monospace" font-weight="bold">★PASE</text>
    </svg>`,
    fullSvg: `<svg class="rq-robot-svg" viewBox="0 0 100 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rqHeadGradAp" x1="17" y1="18" x2="83" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#160035"/><stop offset="100%" stop-color="#04000e"/>
        </linearGradient>
        <linearGradient id="rqBodyGradAp" x1="12" y1="70" x2="88" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0d0025"/><stop offset="100%" stop-color="#030008"/>
        </linearGradient>
        <linearGradient id="rqArmGradAp" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#160035"/><stop offset="100%" stop-color="#04000e"/>
        </linearGradient>
        <filter id="rqGlowApex" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rqGlowApexSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="rqApexAura" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#6d28d9" stop-opacity="0.45"/>
          <stop offset="50%" stop-color="#fbbf24" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Royal aura -->
      <ellipse cx="50" cy="64" rx="50" ry="60" fill="url(#rqApexAura)"/>
      <ellipse cx="50" cy="118" rx="30" ry="6" fill="rgba(167,139,250,0.28)"/>
      <!-- Halo crown -->
      <ellipse cx="50" cy="8" rx="20" ry="6" fill="none" stroke="rgba(253,224,71,0.65)" stroke-width="1.8"/>
      <ellipse cx="50" cy="8" rx="20" ry="6" fill="none" stroke="rgba(167,139,250,0.35)" stroke-width="0.7"/>
      <!-- Crown spikes -->
      <polygon class="rq-antenna" points="31,8 34,1 37,8" fill="rgba(253,224,71,0.75)" filter="url(#rqGlowApexSoft)"/>
      <polygon class="rq-antenna" points="47,5 50,-1 53,5" fill="#fde68a" filter="url(#rqGlowApex)"/>
      <polygon class="rq-antenna" points="63,8 66,1 69,8" fill="rgba(253,224,71,0.75)" filter="url(#rqGlowApexSoft)"/>
      <!-- Antenna stem -->
      <line x1="50" y1="18" x2="50" y2="11" stroke="rgba(196,181,253,0.82)" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Head -->
      <rect x="17" y="18" width="66" height="44" rx="13" fill="url(#rqHeadGradAp)"/>
      <rect x="17" y="18" width="66" height="44" rx="13" stroke="rgba(139,92,246,0.82)" stroke-width="2"/>
      <rect x="17" y="18" width="66" height="44" rx="13" stroke="rgba(253,224,71,0.22)" stroke-width="0.8"/>
      <!-- Gold trim -->
      <line x1="20" y1="27" x2="80" y2="27" stroke="rgba(253,224,71,0.2)" stroke-width="0.8"/>
      <line x1="20" y1="55" x2="80" y2="55" stroke="rgba(253,224,71,0.2)" stroke-width="0.8"/>
      <!-- Eyes — twin stars -->
      <circle cx="35" cy="37" r="11" fill="#080018" stroke="rgba(139,92,246,0.62)" stroke-width="1.4"/>
      <circle cx="65" cy="37" r="11" fill="#080018" stroke="rgba(139,92,246,0.62)" stroke-width="1.4"/>
      <circle class="rq-eye-l" cx="35" cy="37" r="7" fill="#6d28d9" filter="url(#rqGlowApex)" opacity="0.96"/>
      <circle class="rq-eye-r" cx="65" cy="37" r="7" fill="#6d28d9" filter="url(#rqGlowApex)" opacity="0.96"/>
      <circle cx="35" cy="37" r="3.5" fill="#fde68a" filter="url(#rqGlowApex)" opacity="0.92"/>
      <circle cx="65" cy="37" r="3.5" fill="#fde68a" filter="url(#rqGlowApex)" opacity="0.92"/>
      <circle cx="37" cy="35" r="1.8" fill="white" opacity="0.94"/>
      <circle cx="67" cy="35" r="1.8" fill="white" opacity="0.94"/>
      <!-- Mouth — golden arc -->
      <path class="rq-mouth" d="M33 53 Q50 47 67 53" stroke="rgba(253,224,71,0.85)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M39 52.5 Q50 49.5 61 52.5" stroke="rgba(196,181,253,0.45)" stroke-width="1" fill="none"/>
      <!-- Neck -->
      <rect x="40" y="62" width="20" height="8" rx="4" fill="rgba(4,0,14,0.95)" stroke="rgba(139,92,246,0.32)" stroke-width="1"/>
      <!-- Body -->
      <rect x="12" y="70" width="76" height="42" rx="16" fill="url(#rqBodyGradAp)"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(139,92,246,0.72)" stroke-width="2"/>
      <rect x="12" y="70" width="76" height="42" rx="16" stroke="rgba(253,224,71,0.18)" stroke-width="0.8"/>
      <line x1="15" y1="79" x2="85" y2="79" stroke="rgba(253,224,71,0.14)" stroke-width="0.8"/>
      <line x1="15" y1="103" x2="85" y2="103" stroke="rgba(253,224,71,0.14)" stroke-width="0.8"/>
      <!-- Chest — star cores -->
      <circle class="rq-light-1" cx="36" cy="91" r="5.5" fill="#6d28d9" filter="url(#rqGlowApex)" opacity="0.93"/>
      <circle class="rq-light-2" cx="50" cy="91" r="6.5" fill="#fde68a" filter="url(#rqGlowApex)" opacity="0.92"/>
      <circle class="rq-light-3" cx="64" cy="91" r="5.5" fill="#6d28d9" filter="url(#rqGlowApex)" opacity="0.93"/>
      <!-- Arms -->
      <rect x="1" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradAp)" stroke="rgba(139,92,246,0.44)" stroke-width="1.5"/>
      <circle cx="7" cy="100" r="7" fill="url(#rqArmGradAp)" stroke="rgba(139,92,246,0.44)" stroke-width="1.5"/>
      <rect x="87" y="72" width="12" height="26" rx="6" fill="url(#rqArmGradAp)" stroke="rgba(139,92,246,0.44)" stroke-width="1.5"/>
      <circle cx="93" cy="100" r="7" fill="url(#rqArmGradAp)" stroke="rgba(139,92,246,0.44)" stroke-width="1.5"/>
    </svg>`,
  },
];

// Robot storage — delegates to GameState
function getRobotData()  { return GameState.inventory.robots.get(); }
function saveRobotData(d){ GameState.inventory.robots.save(d); }

let _robotBuyTarget = null;

function getEquippedRobotSkin() {
  const d = getRobotData();
  return ROBOT_SKINS.find(r => r.id === d.equipped) || ROBOT_SKINS[0];
}

// Aplica el skin del robot equipado a todos los contenedores .rq-robot-wrap de la página
function applyRobotSkin(skinId) {
  const skin = ROBOT_SKINS.find(r => r.id === skinId) || ROBOT_SKINS[0];
  if (!skin.fullSvg) {
    // default — restaurar SVG original recargando desde HTML original
    document.querySelectorAll('.rq-robot-wrap').forEach(wrap => {
      // Solo restaurar si NO es el robot ámbar del modo relámpago (tiene clase rq-robot-amber)
      const svg = wrap.querySelector('.rq-robot-svg');
      if (svg && !svg.classList.contains('rq-robot-amber')) {
        // El SVG del robot default vive en #rq-robot-svg — simplemente quitar skin class
        svg.removeAttribute('data-skin');
      }
    });
    return;
  }
  document.querySelectorAll('.rq-robot-wrap').forEach(wrap => {
    const svg = wrap.querySelector('.rq-robot-svg');
    if (!svg || svg.classList.contains('rq-robot-amber')) return; // skip lightning robot
    wrap.innerHTML = skin.fullSvg;
  });
}

function renderRobotStoreGrid() {
  const robotData = getRobotData();
  const coins = getCoins();
  const grid = document.getElementById('robot-store-grid');
  if (!grid) return;

  const rarLabel = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legend: 'LEGENDARIO' };
  const rarColor = { common: 'var(--muted)', rare: 'var(--purple)', epic: 'var(--red)', legend: 'var(--amber)' };

  grid.innerHTML = ROBOT_SKINS.map(skin => {
    const owned      = robotData.owned.includes(skin.id);
    const equipped   = robotData.equipped === skin.id;
    const canAfford  = coins >= skin.price;
    const isBP       = skin.bp === true;
    const bpLvl      = isBP ? getBPLevel() : 0;
    const bpUnlocked = isBP ? bpLvl >= skin.bpLevel : true;
    const bpClaimed  = isBP ? getBPClaimed().includes(skin.bpLevel) : false;

    let cardClass = 'robot-store-card';
    if (equipped)                 cardClass += ' equipped';
    else if (owned || bpClaimed)  cardClass += ' owned-robot';
    else if (isBP && !bpUnlocked) cardClass += ' locked-robot';
    else if (!isBP && !canAfford) cardClass += ' locked-robot';

    let badge = equipped
      ? `<span class="rsc-badge rsc-badge-equipped">✓ ACTIVO</span>`
      : (owned || bpClaimed)
        ? `<span class="rsc-badge rsc-badge-owned">✓ TUYO</span>`
        : isBP
          ? `<span class="rsc-badge" style="background:linear-gradient(135deg,rgba(167,139,250,0.9),rgba(96,165,250,0.8));color:#fff;border:1px solid rgba(167,139,250,0.8);font-size:8px">⭐PASE Nv.${skin.bpLevel}</span>`
          : `<span class="rsc-badge rsc-badge-locked">${rarLabel[skin.rarity]||'COMÚN'}</span>`;

    let price = equipped
      ? `<span style="color:var(--purple);font-size:11px;font-weight:700">✓ Equipado</span>`
      : (owned || bpClaimed)
        ? `<span style="color:var(--green);font-size:11px;font-weight:700">✓ Desbloqueado</span>`
        : isBP
          ? bpUnlocked
            ? `<span style="color:#a78bfa;font-size:11px;font-weight:700">⭐ ¡Reclamar!</span>`
            : `<span style="color:rgba(167,139,250,0.5);font-size:10px">⭐ Pase Nv.${skin.bpLevel}</span>`
          : skin.price === 0
            ? `<span style="color:var(--green);font-size:11px">Gratis</span>`
            : `<span style="${!canAfford?'color:rgba(255,255,255,0.4)':''}">🪙 ${skin.price}</span>`;

    return `<div class="${cardClass}" onclick="onRobotClick('${skin.id}')">
      ${badge}
      <div class="rsc-preview">${skin.previewSvg}</div>
      <div class="rsc-name">${skin.name}</div>
      <div class="rsc-rarity" style="color:${rarColor[skin.rarity]||'var(--muted)'};">${rarLabel[skin.rarity]||'COMÚN'}</div>
      <div class="rsc-price">${price}</div>
    </div>`;
  }).join('');
}

// ── ROBOT MODAL ──────────────────────────────────────────
function onRobotClick(id) {
  const robotData = getRobotData();
  const skin = ROBOT_SKINS.find(r => r.id === id);
  if (!skin) return;

  // Auto-unlock free non-BP robots
  if (skin.price === 0 && !skin.bp && !robotData.owned.includes(id)) {
    robotData.owned.push(id);
    saveRobotData(robotData);
  }

  // Handle BP robots
  if (skin.bp) {
    const bpLevel   = getBPLevel();
    const bpClaimed = getBPClaimed();
    if (!bpClaimed.includes(skin.bpLevel)) {
      if (bpLevel >= skin.bpLevel) {
        showXPToast(`⭐ ¡Reclama el Pase Estelar Nv.${skin.bpLevel} para desbloquear!`);
        setTimeout(() => { showSection('missions'); switchMainMissionSection('battlepass'); }, 800);
      } else {
        showXPToast(`🔒 Necesitas Pase Estelar Nv.${skin.bpLevel}`);
      }
      return;
    }
    // BP claimed — ensure it's in owned
    if (!getRobotData().owned.includes(id)) {
      const rd = getRobotData(); rd.owned.push(id); saveRobotData(rd);
    }
  }

  _robotBuyTarget = id;
  const isOwned    = getRobotData().owned.includes(id);
  const isEquipped = getRobotData().equipped === id;
  const coins      = getCoins();

  // Rarity colours
  const rarColorMap = { common:'#a78bfa', rare:'#60a5fa', epic:'#f472b6', legend:'#fbbf24' };
  const rarLabelMap = { common:'COMUN', rare:'RARO', epic:'EPICO', legend:'LEGENDARIO' };
  const color = rarColorMap[skin.rarity] || rarColorMap.common;
  const label = rarLabelMap[skin.rarity] || 'COMUN';

  // Rarity bar
  const bar = document.getElementById('robot-modal-rarity-bar');
  if (bar) bar.style.background = 'linear-gradient(90deg,' + color + '80,' + color + ',' + color + '80)';

  // Preview — scale up the SVG
  const preview = document.getElementById('robot-modal-preview');
  if (preview) {
    const scaled = skin.previewSvg.replace(/width="72" height="72"/, 'width="130" height="130"');
    preview.innerHTML = '<div style="position:absolute;width:120px;height:120px;border-radius:50%;filter:blur(32px);opacity:0.3;pointer-events:none;background:' + color + ';"></div><div style="position:relative;z-index:1;">' + scaled + '</div>';
  }

  // Rarity label
  const rlabel = document.getElementById('robot-modal-rarity-label');
  if (rlabel) rlabel.innerHTML = '<span style="color:' + color + ';letter-spacing:0.12em">' + label + '</span>';

  // Name & desc
  document.getElementById('robot-modal-name').textContent = skin.name;
  document.getElementById('robot-modal-desc').textContent = skin.desc;
  document.getElementById('robot-modal-err').textContent  = '';

  // Status row & main button
  const statusEl = document.getElementById('robot-modal-status');
  const mainBtn  = document.getElementById('robot-modal-main-btn');

  if (isEquipped) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--purple);font-size:13px;font-weight:700">\u2713 Robot actualmente equipado</span>';
    if (mainBtn)  { mainBtn.textContent = '\u2713 Ya equipado'; mainBtn.style.opacity = '0.5'; mainBtn.style.pointerEvents = 'none'; mainBtn.onclick = null; }
  } else if (isOwned) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--green);font-size:13px;font-weight:700">\u2713 En tu coleccion</span>';
    if (mainBtn)  { mainBtn.textContent = '\uD83E\uDD16 Equipar robot'; mainBtn.style.opacity = '1'; mainBtn.style.pointerEvents = 'auto'; mainBtn.onclick = function() { confirmEquipRobot(); }; }
  } else {
    const canAfford = coins >= skin.price;
    if (statusEl) statusEl.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;background:var(--amber-bg);border:1px solid rgba(251,191,36,0.3);border-radius:99px;padding:6px 16px;"><span style="font-size:16px">\uD83E\uDE99</span><span style="font-family:\'Nunito\',sans-serif;font-size:18px;font-weight:800;color:var(--amber)">' + skin.price + '</span><span style="font-size:12px;color:var(--muted)">monedas</span></div>';
    if (mainBtn)  {
      mainBtn.textContent = canAfford ? '\uD83D\uDED2 Comprar y equipar' : '\uD83D\uDD12 Monedas insuficientes';
      mainBtn.style.opacity = canAfford ? '1' : '0.5';
      mainBtn.style.pointerEvents = canAfford ? 'auto' : 'none';
      mainBtn.onclick = function() { confirmBuyRobot(); };
    }
  }

  // Show modal
  const modal = document.getElementById('robot-buy-modal');
  const sheet = document.getElementById('robot-modal-sheet');
  if (modal) { modal.style.opacity = '1'; modal.style.pointerEvents = 'all'; }
  if (sheet) setTimeout(function() { sheet.style.transform = 'translateY(0)'; }, 10);
}

function confirmEquipRobot() {
  const id = _robotBuyTarget;
  if (!id) return;
  const skin = ROBOT_SKINS.find(r => r.id === id);
  if (!skin) return;
  const robotData = getRobotData();
  robotData.equipped = id;
  saveRobotData(robotData);
  closeRobotBuyModal();
  applyRobotSkin(id);
  renderRobotStoreGrid();
  if (typeof renderStyleTab === 'function') renderStyleTab();
  if (typeof showXPToast === 'function') showXPToast('\uD83E\uDD16 Robot "' + skin.name + '" equipado');
}

function confirmBuyRobot() {
  if (!_robotBuyTarget) return;
  const skin = ROBOT_SKINS.find(r => r.id === _robotBuyTarget);
  if (!skin) return;
  const coins = getCoins();
  if (coins < skin.price) {
    document.getElementById('robot-modal-err').textContent = '\u00a1No tienes suficientes monedas!';
    return;
  }
  addCoins(-skin.price);
  const robotData = getRobotData();
  if (!robotData.owned.includes(skin.id)) robotData.owned.push(skin.id);
  robotData.equipped = skin.id;
  saveRobotData(robotData);
  closeRobotBuyModal();
  applyRobotSkin(skin.id);
  renderRobotStoreGrid();
  updateCoinDisplay();
  if (typeof renderStyleTab === 'function') renderStyleTab();
  if (typeof showXPToast === 'function') showXPToast('\uD83C\uDF89 \u00a1Robot "' + skin.name + '" desbloqueado y equipado!');
}

function closeRobotBuyModal() {
  const modal = document.getElementById('robot-buy-modal');
  const sheet = document.getElementById('robot-modal-sheet');
  if (sheet) sheet.style.transform = 'translateY(40px)';
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(function() { modal.style.pointerEvents = 'none'; }, 220);
  }
  _robotBuyTarget = null;
}

function initRobotSkin() {
  const robotData = getRobotData();
  applyRobotSkin(robotData.equipped);
}

document.addEventListener('DOMContentLoaded', initRobotSkin);
if (document.readyState !== 'loading') setTimeout(initRobotSkin, 50);


window.onRobotClick       = onRobotClick;
window.confirmEquipRobot  = confirmEquipRobot;
window.confirmBuyRobot    = confirmBuyRobot;
window.closeRobotBuyModal = closeRobotBuyModal;

