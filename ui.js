/* ═══════════════════════════════════════════════════
   ui.js — Navegación entre secciones y pantallas
   Extraído de index.html. No contiene lógica de juego.
═══════════════════════════════════════════════════ */

// Orden de secciones: store(0) → gamemodes(1) → game(2) → missions(3) → rank(4) → museum(5) → story(6)
const SECTIONS = ['store', 'gamemodes', 'game', 'missions', 'rank', 'museum', 'story'];
let currentSection = 'game';

/* ── Navegar a una sección del panel deslizante ── */
function showSection(name) {
  currentSection = name;
  const idx     = SECTIONS.indexOf(name);
  const wrapper = document.getElementById('sections-wrapper');
  wrapper.style.transform = `translateX(-${idx * 100}vw)`;
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Actualizar tabs superiores
  const tabMap = {
    store:     'ttab-store',
    gamemodes: 'ttab-gamemodes',
    game:      'ttab-game',
    missions:  'ttab-missions',
    rank:      'ttab-rank',
    museum:    'ttab-rank',
  };
  document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.getElementById(tabMap[name]);
  if (activeTab) activeTab.classList.add('active');

  // Ocultar botón nav-left (reemplazado por top-tab)
  const leftBtn = document.getElementById('nav-left-btn');
  if (leftBtn) leftBtn.style.display = 'none';

  // Hooks de sección (sólo renderizado/UI, no lógica de juego)
  if (name === 'missions')  { renderMissions(); updateMissionDot(); }
  if (name === 'rank')      updateRankHUD();
  if (name === 'museum')    renderMuseum();
  if (name === 'gamemodes') initCatCounts();
  if (name === 'store')     {
    renderStore();
    if (typeof renderBgGrid          === 'function') renderBgGrid();
    if (typeof renderRobotStoreGrid  === 'function') renderRobotStoreGrid();
  }
  if (name === 'story')     storyInitHub();
}

/* ── Avanzar a la siguiente sección (ciclicamente) ── */
function toggleSection() {
  if (document.body.getAttribute('data-in-game')) return;
  const idx  = SECTIONS.indexOf(currentSection);
  const next = SECTIONS[(idx + 1) % SECTIONS.length];
  showSection(next);
}

/* ── Atajos de navegación usados desde botones HTML ── */
function goToGameModes() {
  if (document.body.getAttribute('data-in-game')) return;
  showSection('gamemodes');
}

function goToGameSection() {
  showSection('game');
}

/* ── Sub-secciones de Misiones (tabs: misiones / pase de batalla) ── */
let activeMissionSection = 'missions';

function switchMainMissionSection(sec) {
  activeMissionSection = sec;
  document.querySelectorAll('.msn-tab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('msntab-' + sec);
  if (tab) tab.classList.add('active');
  document.getElementById('msnsub-missions').style.display   = sec === 'missions'    ? '' : 'none';
  document.getElementById('msnsub-battlepass').style.display = sec === 'battlepass'  ? '' : 'none';
  if (sec === 'battlepass') renderBattlePass();
  if (sec === 'missions')   renderMissions();
  // Visibilidad del starfield de misiones
  const canvas = document.getElementById('missions-stars-canvas');
  if (canvas) canvas.style.opacity = sec === 'battlepass' ? '1' : '0.35';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ── Exponer al scope global para uso desde atributos onclick en HTML ── */
window.showSection              = showSection;
window.toggleSection            = toggleSection;
window.goToGameModes            = goToGameModes;
window.goToGameSection          = goToGameSection;
window.switchMainMissionSection = switchMainMissionSection;


/* ═══════════════════════════════════════════════════
   UI DE TIENDA / ESTILO — Tabs y renderizado visual
   (sin lógica de compra ni gameState)
═══════════════════════════════════════════════════ */

/* ── Tabs internas de la sección Rank: Nivel / Estilo / Trofeos ── */
function switchRankTab(tab) {
  const tabs = ['rank', 'style', 'museum'];
  tabs.forEach(t => {
    const sub = document.getElementById('ranksub-' + t);
    const btn = document.getElementById('ranktab-' + t);
    if (!sub || !btn) return;
    if (t === tab) {
      sub.style.display = '';
      btn.style.border = '1px solid var(--purple)';
      btn.style.background = 'var(--purple-bg)';
      btn.style.color = 'var(--purple)';
    } else {
      sub.style.display = 'none';
      btn.style.border = '0.5px solid var(--border2)';
      btn.style.background = 'var(--surface2)';
      btn.style.color = 'var(--muted)';
    }
  });
  if (tab === 'style') renderStyleTab();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ── Renderiza la pestaña Estilo: avatares, fondos y robots ── */
function renderStyleTab() {
  // Sincronizar items del Pase Estelar reclamados → owned
  try {
    const bpClaimed = typeof getBPClaimed === 'function' ? getBPClaimed() : [];
    if (bpClaimed.length > 0) {
      if (typeof AVATARS !== 'undefined') {
        const storeSync = getStoreData();
        let changed = false;
        AVATARS.filter(a => a.bp && bpClaimed.includes(a.bpLevel)).forEach(a => {
          if (!storeSync.owned.includes(a.id)) { storeSync.owned.push(a.id); changed = true; }
        });
        if (changed) saveStoreData(storeSync);
      }
      if (typeof BACKGROUNDS !== 'undefined' && typeof getBgData === 'function') {
        const bgSync = getBgData();
        let changed = false;
        BACKGROUNDS.filter(b => b.bp && bpClaimed.includes(b.bpLevel)).forEach(b => {
          if (!bgSync.owned.includes(b.id)) { bgSync.owned.push(b.id); changed = true; }
        });
        if (changed) saveBgData(bgSync);
      }
      if (typeof ROBOT_SKINS !== 'undefined' && typeof getRobotData === 'function') {
        const robotSync = getRobotData();
        let changed = false;
        ROBOT_SKINS.filter(r => r.bp && bpClaimed.includes(r.bpLevel)).forEach(r => {
          if (!robotSync.owned.includes(r.id)) { robotSync.owned.push(r.id); changed = true; }
        });
        if (changed && typeof saveRobotData === 'function') saveRobotData(robotSync);
      }
    }
  } catch(e) {}

  const store = getStoreData();
  const coins = getCoins();
  const equipped = store.equipped || 'default';
  const owned = store.owned || ['default'];

  // Actualizar tarjeta del avatar equipado
  const eqAv = AVATARS.find(a => a.id === equipped) || AVATARS[0];
  const eqEmoji = document.getElementById('style-equipped-emoji');
  const eqName  = document.getElementById('style-equipped-name');
  if (eqEmoji) eqEmoji.textContent = eqAv.emoji;
  if (eqName)  eqName.textContent  = eqAv.name;

  const rarColors = { common: 'rar-common', rare: 'rar-rare', epic: 'rar-epic', legend: 'rar-legend' };

  // ── AVATARES ──
  function avatarCard(av, isOwned) {
    const isEquipped = av.id === equipped;
    let border = isEquipped ? 'border:1.5px solid var(--purple);background:var(--purple-bg);'
               : isOwned    ? 'border:1px solid rgba(74,222,128,0.4);background:rgba(74,222,128,0.04);'
               :               'border:0.5px solid var(--border2);background:var(--surface2);';
    let label = isEquipped  ? `<div style="font-size:10px;color:var(--purple);font-weight:600;margin-top:3px;">✓ Equipado</div>`
              : isOwned     ? `<div style="font-size:10px;color:var(--green);font-weight:600;margin-top:3px;">En posesión</div>`
              : av.bp       ? `<div style="font-size:10px;color:rgba(167,139,250,0.8);margin-top:3px;">⭐ Del Pase</div>`
              : av.price === 0 ? `<div style="font-size:10px;color:var(--green);margin-top:3px;">Gratis</div>`
              : `<div style="font-size:10px;color:${coins>=av.price?'var(--amber)':'var(--muted)'};margin-top:3px;">🪙 ${av.price}</div>`;
    const action = isOwned && !isEquipped ? `onclick="styleEquip('${av.id}')"` : !isOwned ? `onclick="onAvatarClick('${av.id}')"` : '';
    return `<div style="border-radius:var(--radius-sm);padding:10px 6px;text-align:center;cursor:${isEquipped?'default':'pointer'};transition:all 0.15s;${border}" ${action}>
      <span class="avatar-rarity-dot ${rarColors[av.rarity]||'rar-common'}" style="display:block;margin:0 auto 5px;width:7px;height:7px;border-radius:50%;"></span>
      <span style="font-size:32px;display:block;margin-bottom:3px;line-height:1;">${av.emoji}</span>
      <div style="font-size:11px;font-weight:600;color:var(--text);">${av.name}</div>
      ${label}
    </div>`;
  }

  const ownedAvatars  = AVATARS.filter(a => owned.includes(a.id));
  const lockedAvatars = AVATARS.filter(a => !owned.includes(a.id));
  const og = document.getElementById('style-owned-grid');
  const lg = document.getElementById('style-locked-grid');
  if (og) og.innerHTML = ownedAvatars.length  ? ownedAvatars.map(a => avatarCard(a, true)).join('')  : '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">Sin avatares</p>';
  if (lg) lg.innerHTML = lockedAvatars.length ? lockedAvatars.map(a => avatarCard(a, false)).join('') : '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">¡Tienes todos!</p>';

  // ── FONDOS ──
  if (typeof BACKGROUNDS !== 'undefined' && typeof getBgData === 'function') {
    const bgData = getBgData();
    function bgMiniCard(bg, isOwned) {
      const isEquipped = bgData.equipped === bg.id;
      let border = isEquipped ? 'border:2px solid var(--purple);' : isOwned ? 'border:1.5px solid rgba(74,222,128,0.4);' : 'border:0.5px solid var(--border2);opacity:0.65;';
      let badge = isEquipped ? `<div style="font-size:10px;color:var(--purple);font-weight:700;margin-top:4px;">✓ Equipado</div>`
                : isOwned    ? `<div style="font-size:10px;color:var(--green);font-weight:700;margin-top:4px;">En posesión</div>`
                : bg.bp      ? `<div style="font-size:10px;color:rgba(167,139,250,0.8);margin-top:4px;">⭐ Del Pase</div>`
                : `<div style="font-size:10px;color:var(--muted);margin-top:4px;">🪙 ${bg.price}</div>`;
      const action = isOwned && !isEquipped ? `onclick="(function(){var d=getBgData();d.equipped='${bg.id}';saveBgData(d);applyBackground('${bg.id}');renderStyleTab();if(typeof showBgToast==='function')showBgToast('🎨 ${bg.name} equipado');})()"` : !isOwned ? `onclick="onBgClick('${bg.id}')"` : '';
      return `<div style="border-radius:var(--radius-sm);overflow:hidden;cursor:${isEquipped?'default':'pointer'};transition:all 0.15s;${border}" ${action}>
        <div style="height:60px;overflow:hidden;">${bg.previewSvg}</div>
        <div style="padding:6px 8px;background:var(--surface2);">
          <div style="font-size:11px;font-weight:600;">${bg.name}</div>
          ${badge}
        </div>
      </div>`;
    }
    const ownedBgs  = BACKGROUNDS.filter(b => bgData.owned.includes(b.id));
    const lockedBgs = BACKGROUNDS.filter(b => !bgData.owned.includes(b.id));
    const ob = document.getElementById('style-owned-bgs');
    const lb = document.getElementById('style-locked-bgs');
    if (ob) ob.innerHTML = ownedBgs.length  ? ownedBgs.map(b => bgMiniCard(b, true)).join('')  : '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">Sin fondos</p>';
    if (lb) lb.innerHTML = lockedBgs.length ? lockedBgs.map(b => bgMiniCard(b, false)).join('') : '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">¡Tienes todos!</p>';
  }

  // ── ROBOTS ──
  if (typeof ROBOT_SKINS !== 'undefined' && typeof getRobotData === 'function') {
    const robotData = getRobotData();
    function robotMiniCard(skin, isOwned) {
      const isEquipped = robotData.equipped === skin.id;
      let border = isEquipped ? 'border:1.5px solid var(--purple);background:var(--purple-bg);'
                 : isOwned    ? 'border:1px solid rgba(74,222,128,0.4);background:rgba(74,222,128,0.04);'
                 :               'border:0.5px solid var(--border2);background:var(--surface2);opacity:0.7;';
      let label = isEquipped  ? `<div style="font-size:10px;color:var(--purple);font-weight:600;margin-top:3px;">✓ Equipado</div>`
                : isOwned     ? `<div style="font-size:10px;color:var(--green);font-weight:600;margin-top:3px;">En posesión</div>`
                : skin.bp     ? `<div style="font-size:10px;color:rgba(167,139,250,0.8);margin-top:3px;">⭐ Del Pase</div>`
                : `<div style="font-size:10px;color:${coins>=skin.price?'var(--amber)':'var(--muted)'};margin-top:3px;">🪙 ${skin.price}</div>`;
      const action = isOwned && !isEquipped ? `onclick="onRobotClick('${skin.id}')"` : !isOwned ? `onclick="onRobotClick('${skin.id}')"` : '';
      return `<div style="border-radius:var(--radius-sm);padding:10px 6px;text-align:center;cursor:${isEquipped?'default':'pointer'};transition:all 0.15s;${border}" ${action}>
        <div style="display:flex;justify-content:center;margin-bottom:3px;">${skin.previewSvg}</div>
        <div style="font-size:11px;font-weight:600;">${skin.name}</div>
        ${label}
      </div>`;
    }
    const ownedRobots  = ROBOT_SKINS.filter(r => robotData.owned.includes(r.id));
    const lockedRobots = ROBOT_SKINS.filter(r => !robotData.owned.includes(r.id));
    const orEl = document.getElementById('style-owned-robots');
    const lrEl = document.getElementById('style-locked-robots');
    if (orEl) orEl.innerHTML = ownedRobots.length  ? ownedRobots.map(r => robotMiniCard(r, true)).join('')  : '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">Sin robots</p>';
    if (lrEl) lrEl.innerHTML = lockedRobots.length ? lockedRobots.map(r => robotMiniCard(r, false)).join('') : '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">¡Tienes todos!</p>';
  }
}

/* ── Equipar avatar desde la pestaña Estilo ── */
function styleEquip(id) {
  const store = getStoreData();
  const av = AVATARS.find(a => a.id === id);
  if (!av || !store.owned.includes(id)) return;
  store.equipped = id;
  saveStoreData(store);
  updateAvatarHUD();
  renderStyleTab();
  if (typeof renderStore === 'function') renderStore();
  if (typeof showXPToast === 'function') showXPToast(`Avatar ${av.emoji} ${av.name} equipado`);
}

window.switchRankTab  = switchRankTab;
window.renderStyleTab = renderStyleTab;
window.styleEquip     = styleEquip;


/* ═══════════════════════════════════════════════════
   UI DE GAMEPLAY — Pantallas, feedback visual y HUD
   Centraliza toda la presentación visual del juego.
   gameplay.js llama a estas funciones pero no las define.

   FUNCIONES EXPORTADAS:
     showScreen, setGameActive
     updateScores, _updateScoreboardBar, _gsbFlash, _setLabelText
     renderInventory
     flashScreen, spawnScoreParticle, popScoreNum, spawnConfetti
     confirmQuitGame, cancelQuitGame
     setLobbyErr, copyCode
═══════════════════════════════════════════════════ */

/* ── Pantallas que cuentan como "en partida" ── */
const IN_GAME_SCREENS = new Set([
  'screen-player', 'screen-ai', 'screen-box',
  'screen-lightning', 'screen-result', 'screen-waiting',
]);

/* ── Oculta/muestra el HUD principal y dims las tabs durante una partida ── */
function setGameActive(active) {
  const hide = id => { const el = document.getElementById(id); if (el) el.style.display = active ? 'none' : ''; };
  hide('rank-badge');
  hide('coin-counter');
  hide('nav-btn');
  if (active) document.body.setAttribute('data-in-game', '1');
  else        document.body.removeAttribute('data-in-game');

  // Ocultar botón izq. y dimear top-tabs durante partida
  const lb = document.getElementById('nav-left-btn');
  if (lb) lb.style.display = 'none';
  const bar = document.getElementById('top-tab-bar');
  if (bar) { bar.style.opacity = active ? '0.4' : '1'; bar.style.pointerEvents = active ? 'none' : ''; }

  if (active) _updateScoreboardBar();
}

/* ── Activa una pantalla de juego y desactiva todas las demás ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
  setGameActive(IN_GAME_SCREENS.has(id));
}

/* ── Helper DOM: asigna texto a un elemento por id ── */
function _setLabelText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ── Actualiza todos los marcadores de puntuación en el DOM ── */
function updateScores() {
  if (typeof state === 'undefined' || !state) return;
  const ids = [
    ['player-score',        'ai-score'],
    ['box-player-score',    'box-ai-score'],
    ['ai-turn-player-score','ai-turn-ai-score'],
    ['final-player-score',  'final-ai-score'],
  ];
  ids.forEach(([p, a]) => {
    const pe = document.getElementById(p); if (pe) pe.textContent = state.playerScore;
    const ae = document.getElementById(a); if (ae) ae.textContent = state.aiScore;
  });
  _updateScoreboardBar();
}

/* ── Actualiza la barra de scoreboard superior (GSB) ── */
function _updateScoreboardBar() {
  const isLightning = typeof lState !== 'undefined' && lState &&
                      lState.questions && lState.questions.length > 0 &&
                      typeof lightningMode !== 'undefined' && lightningMode;
  const activeState = isLightning ? lState : (typeof state !== 'undefined' ? state : null);
  if (!activeState) return;

  const pScore = activeState.playerScore || 0;
  const rScore = activeState.aiScore     || 0;
  const round  = activeState.round       || 0;

  // Puntuaciones con animación bump
  const ps = document.getElementById('gsb-player-score');
  const rs = document.getElementById('gsb-rival-score');
  if (ps) {
    const old = ps.textContent;
    ps.textContent = pScore;
    if (old !== String(pScore)) { ps.classList.remove('bump'); void ps.offsetWidth; ps.classList.add('bump'); }
  }
  if (rs) {
    const old = rs.textContent;
    rs.textContent = rScore;
    if (old !== String(rScore)) { rs.classList.remove('bump'); void rs.offsetWidth; rs.classList.add('bump'); }
  }

  // Ronda actual
  const rn = document.getElementById('gsb-round-num');
  if (rn) rn.textContent = (round + 1) + '/10';

  // Nombres de jugador y rival
  const pn     = document.getElementById('gsb-player-name');
  const an     = document.getElementById('gsb-rival-name');
  const pLabel = document.getElementById('player-name-label');
  const aLabel = document.getElementById('ai-label');
  if (pn && pLabel) pn.textContent = pLabel.textContent || 'Tú';
  if (an && aLabel) an.textContent = aLabel.textContent || (isLightning ? 'IA ⚡' : 'IA');

  // Resalte del lado activo
  const pSide = document.getElementById('gsb-player-side');
  const rSide = document.getElementById('gsb-rival-side');
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen && pSide && rSide) {
    const sid = activeScreen.id;
    pSide.classList.toggle('active', sid === 'screen-player' || sid === 'screen-lightning');
    rSide.classList.toggle('active', sid === 'screen-ai');
  }

  // Avatar equipado del jugador
  const av = (typeof getEquippedAvatar === 'function') ? getEquippedAvatar() : null;
  const playerAvEl = document.getElementById('gsb-player-avatar');
  if (playerAvEl && av) {
    const ring = playerAvEl.querySelector('.gsb-avatar-ring');
    playerAvEl.innerHTML = av.emoji;
    if (ring) playerAvEl.prepend(ring);
  }
}

/* ── Flash verde/rojo en el lado del scoreboard al cambiar puntuación ── */
function _gsbFlash(side, type) {
  const el = document.getElementById(side === 'player' ? 'gsb-player-side' : 'gsb-rival-side');
  if (!el) return;
  el.classList.remove('gsb-flash-correct', 'gsb-flash-wrong');
  void el.offsetWidth;
  el.classList.add(type === 'correct' ? 'gsb-flash-correct' : 'gsb-flash-wrong');
  setTimeout(() => el.classList.remove('gsb-flash-correct', 'gsb-flash-wrong'), 700);
}

/* ── Renderiza los debuffs/buffs pendientes en el inventario del jugador ── */
function renderInventory() {
  if (typeof state === 'undefined' || !state) return;
  const inv = document.getElementById('player-inventory');
  if (!inv) return;
  if (state.pendingDebuffsForAI.length === 0) {
    inv.innerHTML = '<span style="font-size:12px;color:var(--muted)">Sin cajas activas</span>';
  } else {
    inv.innerHTML = state.pendingDebuffsForAI
      .map(d => `<span class="badge ${d.color}">${d.icon} ${d.name}</span>`)
      .join('');
  }
}

/* ── Flash de pantalla al acertar (green) o fallar (red) ── */
function flashScreen(type) {
  const el = document.getElementById('flash-overlay');
  if (!el) return;
  el.className = type + ' show';
  setTimeout(() => el.classList.remove('show'), 180);
}

/* ── Partícula flotante de puntuación (+1, -1…) ── */
function spawnScoreParticle(text, color, x, y) {
  const p = document.createElement('div');
  p.className = 'score-particle';
  p.textContent = text;
  p.style.color = color;
  p.style.left = (x || window.innerWidth  / 2) + 'px';
  p.style.top  = (y || window.innerHeight / 2) + 'px';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1000);
}

/* ── Animación "pop" en el número de puntuación ── */
function popScoreNum(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 400);
}

/* ── Confetti de victoria ── */
function spawnConfetti(count = 18) {
  const colors = ['#a78bfa','#4ade80','#fbbf24','#f87171','#2dd4bf','#e879f9','#60a5fa'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = (20 + Math.random() * 60) + 'vw';
      p.style.top  = (10 + Math.random() * 30) + 'vh';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay    = (Math.random() * 0.4) + 's';
      p.style.animationDuration = (0.9 + Math.random() * 0.6) + 's';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1800);
    }, i * 40);
  }
}

/* ── Modales del juego ── */
function confirmQuitGame() {
  const modal = document.getElementById('quit-modal');
  if (modal) modal.style.display = 'flex';
}

function cancelQuitGame() {
  const modal = document.getElementById('quit-modal');
  if (modal) modal.style.display = 'none';
}

/* ── Online: muestra error en el lobby ── */
function setLobbyErr(msg) {
  const el = document.getElementById('lobby-err');
  if (el) el.textContent = msg || '';
}

/* ── Online: copiar código de sala al portapapeles ── */
function copyCode() {
  // roomCode es una variable de gameplay.js; accedemos por window
  const code = window.roomCode || '';
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.copy-btn');
    if (btn) {
      btn.textContent = '✅ Copiado';
      setTimeout(() => { btn.textContent = '📋 Copiar código'; }, 1500);
    }
  });
}

/* ═══════════════════════════════════════════════════
   MOSTRAR PREGUNTA AL JUGADOR
   Renderiza la pregunta activa, efectos y botones de respuesta.
   Accede al estado de juego (state, onlineMode…) desde gameplay.js via window.
═══════════════════════════════════════════════════ */
function loadPlayerQuestion() {
  const _state      = window.state;
  const _onlineMode = window.onlineMode;

  clearInterval(window.timerInterval);
  _state.answered  = false;
  _state.aiAnswered = false;
  _state.aiResult  = null;
  const q      = _state.questions[_state.round];
  const debuffs = _state.pendingDebuffsForPlayer;
  const buffs   = _state.pendingBuffForPlayer || [];

  document.getElementById('round-label').textContent =
    `Tu turno — Ronda ${_state.round + 1} de 10`;

  // Mostrar desventajas activas y ventajas activas
  const dd = document.getElementById('debuff-display');
  const activeEffects = [
    ...debuffs.map(d => `<span style="color:var(--red)">${d.icon} ${d.name}</span>`),
    ...buffs.map(b => `<span style="color:var(--green)">${b.icon} ${b.name}</span>`),
  ];
  if (activeEffects.length > 0) {
    dd.style.display = 'block';
    dd.innerHTML = `<strong>Efectos activos:</strong> ${activeEffects.join(', ')}`;
  } else {
    dd.style.display = 'none';
  }

  const hasTime      = debuffs.some(d => d.id === 'time' || d.id === 'supertime');
  const hasFlip      = debuffs.some(d => d.id === 'flip');
  const hasTrap      = debuffs.some(d => d.id === 'trap');
  const hasDoubleTrap= debuffs.some(d => d.id === 'doubletrap');
  const hasBlind     = debuffs.some(d => d.id === 'blind');
  const hasNoOpts    = debuffs.some(d => d.id === 'nooptions');
  const hasDouble    = debuffs.some(d => d.id === 'double');
  const hasPenalty   = debuffs.some(d => d.id === 'penalty');
  const hasMinus2    = debuffs.some(d => d.id === 'minus2');
  const hasSkip      = debuffs.some(d => d.id === 'skip');
  const hasTiny      = debuffs.some(d => d.id === 'tiny');
  const hasMirror    = false;
  const hasFlash     = debuffs.some(d => d.id === 'flash');
  const hasReverse   = debuffs.some(d => d.id === 'reverse');
  // Nuevos debuffs
  const hasFogMind   = debuffs.some(d => d.id === 'fogmind' || d.id === 'fogmind_rare' || d.id === 'fogmind_epic');
  const hasUnstable  = debuffs.some(d => d.id === 'unstable' || d.id === 'unstable_rare' || d.id === 'unstable_epic');
  // Nivel de Tiempo Inestable: common=12s, rare=9s, epic=6s
  const unstableLevel = debuffs.some(d => d.id === 'unstable_epic') ? 'epic'
                      : debuffs.some(d => d.id === 'unstable_rare') ? 'rare' : 'common';
  const isSupertime  = debuffs.some(d => d.id === 'supertime');
  // ── EFECTOS DIVERTIDOS ──
  const hasMonkeyMode     = debuffs.some(d => d.id === 'monkeymode');
  const hasAlienQuestion  = debuffs.some(d => d.id === 'alienquestion');

  // Buff effects activos
  const hasExtraTime  = buffs.some(b => b.id === 'extratime');
  const hasHint       = buffs.some(b => b.id === 'hint');
  const hasDoubleBuff = buffs.some(b => b.id === 'double');
  const hasShield     = buffs.some(b => b.id === 'shield');
  // Nuevos buffs
  const hasQuickMind  = buffs.some(b => b.id === 'quickmind');
  const hasPrecision  = buffs.some(b => b.id === 'precision');
  const hasOverload   = buffs.some(b => b.id === 'overload');

  // 🛡️ Escudo Mental: si está activo, limpiar todos los debuffs para esta ronda
  if (_state._mindShieldActive && debuffs.length > 0) {
    _state.pendingDebuffsForPlayer = [];
    _state._mindShieldActive = false;
    showXPToast && showXPToast('🛡️ ¡Escudo Mental activado! Desventaja ignorada');
  }

  const qEl = document.getElementById('question-text');
  const catMap = { geo:'🌍 Geografía', sci:'🔬 Ciencia', hist:'📜 Historia', art:'🎨 Arte & Cultura', sport:'⚽ Deporte', ent:'🎬 Entretenimiento', food:'🍕 Gastronomía', tech:'💻 Tecnología' };
  if (q.cat && q.cat.startsWith('special_')) {
    const scKey  = q.cat.replace('special_', '');
    const scMeta = (typeof window.SPECIAL_CAT_META !== 'undefined' && window.SPECIAL_CAT_META[scKey]);
    catMap[q.cat] = scMeta ? scMeta.icon + ' ' + scMeta.name : '✨ Especial';
  }
  const diffMap  = { easy:['Fácil','qdiff-easy'], med:['Medio','qdiff-med'], hard:['Difícil','qdiff-hard'] };
  const catLabel = catMap[q.cat] || '🎯 General';
  const [diffLabel, diffCls] = diffMap[q.diff] || ['Medio','qdiff-med'];
  // catCls: clase para el badge del meta-bar (puede ser badge-purple para especiales)
  const catCls      = (q.cat && !q.cat.startsWith('special_')) ? `qcat-${q.cat}` : 'badge-purple';
  // catCardCls: clase que se aplica al .card contenedor (solo qcat-* para categorías normales)
  const catCardCls  = (q.cat && !q.cat.startsWith('special_')) ? `qcat-${q.cat}` : '';

  const existingWrapper = document.getElementById('question-meta-bar-wrapper');
  if (existingWrapper) existingWrapper.remove();
  const existingMeta = document.getElementById('question-meta-bar');
  if (existingMeta) existingMeta.remove();

  const metaDiv = document.createElement('div');
  metaDiv.id = 'question-meta-bar';
  metaDiv.className = 'question-meta';
  metaDiv.innerHTML = `<span class="q-badge ${catCls}">${catLabel}</span><span class="q-badge ${diffCls}">⚡ ${diffLabel}</span>`;

  const metaWrapper = document.createElement('div');
  metaWrapper.id = 'question-meta-bar-wrapper';
  metaWrapper.appendChild(metaDiv);

  // Insertar en el .card real para que :has() del CSS lo detecte correctamente
  const questionCard = qEl.closest('.card') || qEl.parentElement;
  questionCard.insertBefore(metaWrapper, questionCard.firstChild);

  // Aplicar clases de categoría y dificultad al .card contenedor
  // Limpiar también badge-purple por si quedó de una ronda anterior
  Array.from(questionCard.classList).forEach(cls => {
    if (cls.startsWith('qcat-') || cls.startsWith('qdiff-') || cls === 'badge-purple') questionCard.classList.remove(cls);
  });
  if (catCardCls) questionCard.classList.add(catCardCls);
  if (diffCls) questionCard.classList.add(diffCls);
  qEl.style.fontSize = hasTiny ? '11px' : '';
  qEl.innerHTML = hasFlip ? `<span class="flipped">${q.q}</span>` : q.q;

  if (hasFlash) {
    qEl.style.opacity = '1';
    setTimeout(() => { qEl.style.transition = 'opacity 0.5s'; qEl.style.opacity = '0'; }, 3000);
  } else {
    qEl.style.opacity = '';
    qEl.style.transition = '';
  }

  let answers = [...q.a];
  const correct = q.c;

  if (hasTrap && !hasDoubleTrap) {
    const wrongOpts = [0,1,2,3].filter(i => i !== correct);
    const trapIdx   = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
    answers = answers.map((a, i) => i === trapIdx ? `✓ ${a}` : a);
  }
  if (hasDoubleTrap) {
    const wrongOpts = [0,1,2,3].filter(i => i !== correct);
    const shuffled  = wrongOpts.sort(() => Math.random() - 0.5);
    const trapIdxs  = shuffled.slice(0, 2);
    answers = answers.map((a, i) => trapIdxs.includes(i) ? `✓ ${a}` : a);
  }
  if (hasMirror) {
    answers = answers.map(a => a.split('').reverse().join(''));
  }

  // 🌫️ Niebla Mental: mezclar aleatoriamente las respuestas (manteniendo el índice correcto)
  if (hasFogMind) {
    const indexed = answers.map((a, i) => ({ a, orig: i }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    // Reconstruir answers y actualizar correct según nueva posición
    answers = indexed.map(x => x.a);
    // correct ahora es la nueva posición del índice original correcto
    const newCorrect = indexed.findIndex(x => x.orig === correct);
    // Sobreescribir correct para los onclick de los botones (se usa variable local)
    q._fogCorrect = newCorrect;
  }

  const hiddenIdxs = [];
  if (hasBlind || hasNoOpts) {
    const wrongOpts = [0,1,2,3].filter(i => i !== correct);
    const hideCount = hasNoOpts ? Math.min(2, wrongOpts.length) : 1;
    wrongOpts.sort(() => Math.random() - 0.5).slice(0, hideCount).forEach(i => hiddenIdxs.push(i));
  }

  // HINT buff o PRECISION buff: elimina una respuesta incorrecta adicional
  let hintHidden = -1;
  if ((hasHint || hasPrecision) && hiddenIdxs.length === 0) {
    const wrongOpts = [0,1,2,3].filter(i => i !== correct && !hiddenIdxs.includes(i));
    if (wrongOpts.length > 0) {
      hintHidden = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
    }
  }

  const container = document.getElementById('answers-container');
  container.innerHTML = '';
  container.className = 'online-answers';
  // Si Niebla Mental está activo, usar el índice correcto remapeado
  const effectiveCorrect = (hasFogMind && q._fogCorrect !== undefined) ? q._fogCorrect : correct;

  // 🐒 Modo Mono: pool de emojis aleatorios para inyectar en las respuestas
  const MONKEY_EMOJIS = ['🐒','🍌','🙈','🙉','🙊','🦧','🐵','💥','🎉','🌀','👀','😵','🤪','🔥','⭐','💫','🎈','🥴','🫠','🐸'];
  function monkeyify(text) {
    // Inserta 1-3 emojis aleatorios dentro y al final del texto
    const pick = () => MONKEY_EMOJIS[Math.floor(Math.random() * MONKEY_EMOJIS.length)];
    const words = text.split(' ');
    const insertAt = Math.floor(Math.random() * words.length);
    words.splice(insertAt, 0, pick());
    return words.join(' ') + ' ' + pick();
  }

  answers.forEach((a, i) => {
    if (hiddenIdxs.includes(i)) return;
    if (i === hintHidden) return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = hasMonkeyMode ? monkeyify(a) : a;
    // El doble buff da +2 si aciertas; el shield evita restar si fallas
    btn.onclick = () => {
      // ⚡ Sobrecarga: si responde en el primer tercio del tiempo disponible
      if (hasOverload && _state._overloadStartTime) {
        const elapsed = (Date.now() - _state._overloadStartTime) / 1000;
        _state._overloadFast = elapsed <= (_state._overloadSecs / 3);
      }
      window.playerAnswer(i, effectiveCorrect, (!hasShield && (hasPenalty || hasMinus2)), (hasDouble || hasDoubleBuff), hasMinus2 && !hasShield, hasReverse);
    };
    container.appendChild(btn);
  });

  // 🛰️ Pregunta Alienígena: efecto visual glitch en la UI durante 4 segundos
  if (hasAlienQuestion) {
    _triggerAlienEffect();
  }

  // 🐒 Modo Mono: wiggle CSS en botones mientras dure la ronda
  _triggerMonkeyMode(hasMonkeyMode);

  renderInventory();
  updateScores();

  // Tiempo base: unstable reduce tiempo; quickmind añade +3 seg, extratime añade +8 seg (legacy)
  let baseSecs = isSupertime ? 5 : hasTime ? 8 : 20;
  if (hasUnstable) {
    baseSecs = unstableLevel === 'epic' ? 6 : unstableLevel === 'rare' ? 9 : 12;
  }
  const buffBonus = (hasExtraTime ? 8 : 0) + (hasQuickMind ? 3 : 0);
  const secs      = Math.max(3, Math.round((baseSecs + buffBonus) * (_state.timerMultiplier || 1)));

  // ⚡ Sobrecarga: marcar el tiempo de inicio para detectar respuesta rápida
  if (hasOverload) {
    _state._overloadStartTime = Date.now();
    _state._overloadSecs      = secs;
    _state._overloadFast      = false;
  }

  if (!_onlineMode) {
    window.startAISimultaneous(secs);
  }

  // Consumir buffs tras cargar la pregunta
  _state.pendingBuffForPlayer = [];

  window.startTimer('timer-bar', secs, hasSkip, () => {
    if (!_state.answered) window.playerAnswer(-1, effectiveCorrect, (!hasShield && (hasPenalty || hasMinus2)), (hasDouble || hasDoubleBuff), hasMinus2 && !hasShield, hasReverse);
  });
}

/* ═══════════════════════════════════════════════════
   RESULTADO VISUAL DE BOTONES DE RESPUESTA
   Colorea los botones tras responder (correcto / incorrecto).
   Llamada desde gameplay.js::playerAnswer justo al contestar.
═══════════════════════════════════════════════════ */
function renderAnswerResult(chosen, correct) {
  const _state = window.state;
  // Limpiar efectos divertidos al responder
  _triggerMonkeyMode(false);
  document.getElementById('answers-container').querySelectorAll('button').forEach(b => {
    b.classList.add('btn-disabled');
    const clean = b.textContent.replace(/^✓\s*/, '').trim();
    const idx   = _state.questions[_state.round].a.findIndex(a => a === clean || b.textContent.includes(a));
    if (idx === correct) b.classList.add('btn-correct');
    else if (_state.questions[_state.round].a.indexOf(clean) === chosen || b.textContent === _state.questions[_state.round].a[chosen]) b.classList.add('btn-wrong');
  });
}

/* ═══════════════════════════════════════════════════
   🛰️ EFECTO ALIENÍGENA — Glitch visual de 4 segundos
   Se activa cuando el jugador recibe el efecto "alienquestion".
   Transforma colores, añade scanlines y texto alienígena.
═══════════════════════════════════════════════════ */
(function _injectAlienCSS() {
  if (document.getElementById('alien-effect-styles')) return;
  const style = document.createElement('style');
  style.id = 'alien-effect-styles';
  style.textContent = `
    /* ── Alien glitch overlay ── */
    #alien-overlay {
      position: fixed; inset: 0; z-index: 9999;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(0,255,120,0.04) 3px,
        rgba(0,255,120,0.04) 4px
      );
      animation: alienScanline 0.12s linear infinite;
      opacity: 0; transition: opacity 0.3s;
    }
    #alien-overlay.active { opacity: 1; }
    @keyframes alienScanline {
      0%   { background-position: 0 0; }
      100% { background-position: 0 8px; }
    }
    /* ── Alien toast ── */
    #alien-toast {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0.8);
      z-index: 10000; pointer-events: none;
      background: rgba(0,20,10,0.92); border: 1.5px solid #00ff88;
      border-radius: 12px; padding: 12px 22px; text-align: center;
      color: #00ff88; font-family: monospace; font-size: 13px;
      box-shadow: 0 0 30px rgba(0,255,136,0.5), inset 0 0 15px rgba(0,255,136,0.07);
      opacity: 0; transition: opacity 0.25s, transform 0.25s;
    }
    #alien-toast.active { opacity: 1; transform: translate(-50%,-50%) scale(1); }
    #alien-toast .alien-title { font-size: 20px; margin-bottom: 4px; }
    /* ── Screen hue-rotate durante alien ── */
    body.alien-mode #screen-player {
      filter: hue-rotate(100deg) saturate(1.6) contrast(1.1);
      transition: filter 0.4s;
    }
    body.alien-mode #screen-player .card {
      border-color: #00ff88 !important;
      box-shadow: 0 0 15px rgba(0,255,136,0.3) !important;
    }
    /* ── Mono mode: botones con emojis se sacuden un poco ── */
    body.monkey-mode #answers-container .btn {
      animation: monkeyWiggle 0.4s ease infinite alternate;
    }
    @keyframes monkeyWiggle {
      0%   { transform: rotate(-1deg); }
      100% { transform: rotate(1deg); }
    }
    /* ── Rarity gem fun ── */
    .gem-fun { background: linear-gradient(135deg,#fbbf24,#f97316); color:#000; }
    .debuff-card.is-fun { border-color: rgba(251,191,36,0.5); background: rgba(251,191,36,0.06); }
  `;
  document.head.appendChild(style);

  // Crear overlay y toast una sola vez
  const overlay = document.createElement('div');
  overlay.id = 'alien-overlay';
  document.body.appendChild(overlay);

  const toast = document.createElement('div');
  toast.id = 'alien-toast';
  toast.innerHTML = `<div class="alien-title">🛰️</div><div>S3Ñ4L_3XTR4T3RR3STR3<br><span style="font-size:11px;opacity:0.7">TRADUCIENDO... ¿?</span></div>`;
  document.body.appendChild(toast);
})();

function _triggerAlienEffect() {
  const overlay = document.getElementById('alien-overlay');
  const toast   = document.getElementById('alien-toast');
  if (!overlay || !toast) return;

  document.body.classList.add('alien-mode');
  overlay.classList.add('active');
  toast.classList.add('active');

  // Sonido (si Web Audio disponible)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}

  setTimeout(() => {
    overlay.classList.remove('active');
    toast.classList.remove('active');
    document.body.classList.remove('alien-mode');
  }, 4000);
}

/* ── 🐒 Modo Mono: animación wiggle en botones mientras está activo ── */
function _triggerMonkeyMode(active) {
  if (active) document.body.classList.add('monkey-mode');
  else        document.body.classList.remove('monkey-mode');
}

/* ── Exponer al scope global ── */
window.setGameActive        = setGameActive;
window.showScreen           = showScreen;
window._setLabelText        = _setLabelText;
window.updateScores         = updateScores;
window._updateScoreboardBar = _updateScoreboardBar;
window._gsbFlash            = _gsbFlash;
window.renderInventory      = renderInventory;
window.flashScreen          = flashScreen;
window.spawnScoreParticle   = spawnScoreParticle;
window.popScoreNum          = popScoreNum;
window.spawnConfetti        = spawnConfetti;
window.confirmQuitGame      = confirmQuitGame;
window.cancelQuitGame       = cancelQuitGame;
window.setLobbyErr          = setLobbyErr;
window.copyCode             = copyCode;
window.loadPlayerQuestion   = loadPlayerQuestion;
window.renderAnswerResult   = renderAnswerResult;
window.showAnswerFeedback   = showAnswerFeedback;
window.showAILiveThinking   = showAILiveThinking;
window.showAILiveResult     = showAILiveResult;
window.hideAILivePanel      = hideAILivePanel;
window.renderAITurnScreen   = renderAITurnScreen;
window.renderAIResult       = renderAIResult;
window.renderResultScreen   = renderResultScreen;
window.showOnlineRivalTurn  = showOnlineRivalTurn;
window.resolveOnlineRival   = resolveOnlineRival;

/* ═══════════════════════════════════════════════════
   FEEDBACK VISUAL DE RESPUESTA DEL JUGADOR
   flashScreen + partícula de puntuación + pop del marcador.
   Llamada desde gameplay.js::playerAnswer.
═══════════════════════════════════════════════════ */
function showAnswerFeedback(isCorrect, hasDouble, hasPenalty, hasMinus2) {
  if (isCorrect) {
    flashScreen('green');
    spawnScoreParticle(hasDouble ? '+2 ✨' : '+1 ✅', '#4ade80');
    popScoreNum('player-score');
  } else {
    flashScreen('red');
    const pen = hasMinus2 ? 2 : hasPenalty ? 1 : 0;
    if (pen > 0) spawnScoreParticle('-' + pen + ' ❌', '#f87171');
  }
}

/* ═══════════════════════════════════════════════════
   PANEL EN VIVO DE LA IA (modo simultáneo)
   Muestra "pensando…", "acertó" o "falló" en el panel
   ai-live-panel durante el turno simultáneo.
═══════════════════════════════════════════════════ */
function showAILiveThinking(rivalName) {
  const panel  = document.getElementById('ai-live-panel');
  const textEl = document.getElementById('ai-live-text');
  const iconEl = document.getElementById('ai-live-icon');
  if (!panel) return;
  textEl.innerHTML = `<span id="ai-live-name">${rivalName}</span> está pensando<span class="ai-live-dots"><span></span><span></span><span></span></span>`;
  iconEl.textContent = '🤖';
  panel.className   = 'ai-thinking';
  panel.style.display = 'block';
}

function showAILiveResult(rivalName, aiCorrect) {
  const panel  = document.getElementById('ai-live-panel');
  const textEl = document.getElementById('ai-live-text');
  const iconEl = document.getElementById('ai-live-icon');
  if (!panel) return;
  if (aiCorrect) {
    panel.className    = 'ai-correct';
    iconEl.textContent = '✅';
    textEl.textContent = `${rivalName} ha acertado`;
  } else {
    panel.className    = 'ai-wrong';
    iconEl.textContent = '❌';
    textEl.textContent = `${rivalName} ha fallado`;
  }
}

function hideAILivePanel() {
  const panel = document.getElementById('ai-live-panel');
  if (panel) panel.style.display = 'none';
}

/* ═══════════════════════════════════════════════════
   TURNO VISUAL DE LA IA (modo turnos)
   Renderiza la pantalla screen-ai: etiqueta de ronda,
   debuffs, pregunta con meta-bar, estado "pensando".
═══════════════════════════════════════════════════ */
function renderAITurnScreen(q, aiDebuffs, rivalName, round) {
  document.getElementById('ai-round-label').textContent =
    `Turno de ${rivalName} — Ronda ${round + 1} de 10`;

  const aidEl = document.getElementById('ai-debuff-display');
  if (aiDebuffs.length > 0) {
    aidEl.style.display = 'block';
    aidEl.innerHTML = `<strong>Desventajas de ${rivalName}:</strong> ${aiDebuffs.map(d => `${d.icon} ${d.name}`).join(', ')}`;
  } else {
    aidEl.style.display = 'none';
  }

  document.getElementById('ai-question-text').textContent = q.q;

  // Meta-bar (categoría + dificultad)
  const catMap = { geo:'🌍 Geografía', sci:'🔬 Ciencia', hist:'📜 Historia', art:'🎨 Arte & Cultura', sport:'⚽ Deporte', ent:'🎬 Entretenimiento', food:'🍕 Gastronomía', tech:'💻 Tecnología' };
  if (q.cat && q.cat.startsWith('special_')) {
    const scKey  = q.cat.replace('special_', '');
    const scMeta = (typeof window.SPECIAL_CAT_META !== 'undefined' && window.SPECIAL_CAT_META[scKey]);
    catMap[q.cat] = scMeta ? scMeta.icon + ' ' + scMeta.name : '✨ Especial';
  }
  const diffMap   = { easy:['Fácil','qdiff-easy'], med:['Medio','qdiff-med'], hard:['Difícil','qdiff-hard'] };
  const catLabel  = catMap[q.cat] || '🎯 General';
  const [diffLabel, diffCls] = diffMap[q.diff] || ['Medio','qdiff-med'];
  // catCls: clase para el badge del meta-bar
  const catCls     = (q.cat && !q.cat.startsWith('special_')) ? `qcat-${q.cat}` : 'badge-purple';
  // catCardCls: clase que se aplica al .card contenedor (solo qcat-* para categorías normales)
  const catCardCls = (q.cat && !q.cat.startsWith('special_')) ? `qcat-${q.cat}` : '';

  const existing  = document.getElementById('ai-question-meta-bar-wrapper');
  if (existing) existing.remove();
  const existingBar = document.getElementById('ai-question-meta-bar');
  if (existingBar) existingBar.remove();

  const metaDiv   = document.createElement('div');
  metaDiv.id      = 'ai-question-meta-bar';
  metaDiv.className = 'question-meta';
  metaDiv.innerHTML = `<span class="q-badge ${catCls}">${catLabel}</span><span class="q-badge ${diffCls}">⚡ ${diffLabel}</span>`;

  const metaWrapper = document.createElement('div');
  metaWrapper.id = 'ai-question-meta-bar-wrapper';
  metaWrapper.appendChild(metaDiv);

  const qTextEl = document.getElementById('ai-question-text');
  // Insertar en el .card real para que :has() del CSS lo detecte correctamente
  const aiQuestionCard = qTextEl.closest('.card') || qTextEl.parentElement;
  aiQuestionCard.insertBefore(metaWrapper, aiQuestionCard.firstChild);

  // Aplicar clases de categoría y dificultad al .card contenedor de la IA
  // Limpiar también badge-purple por si quedó de una ronda anterior
  Array.from(aiQuestionCard.classList).forEach(cls => {
    if (cls.startsWith('qcat-') || cls.startsWith('qdiff-') || cls === 'badge-purple') aiQuestionCard.classList.remove(cls);
  });
  if (catCardCls) aiQuestionCard.classList.add(catCardCls);
  if (diffCls) aiQuestionCard.classList.add(diffCls);

  document.getElementById('ai-thinking').style.display = 'block';
  document.getElementById('ai-thinking-label').textContent = `${rivalName} está pensando...`;
  document.getElementById('ai-result-msg').style.display = 'none';
  document.getElementById('ai-next-btn').style.display = 'none';
  document.getElementById('online-rival-answers').style.display = 'none';
  updateScores();
}

/* ═══════════════════════════════════════════════════
   RESULTADO VISUAL DE LA IA (modo turnos)
   Muestra el mensaje correcto/incorrecto y el botón
   "siguiente ronda" si la IA falla.
═══════════════════════════════════════════════════ */
function renderAIResult(correct, rivalName) {
  document.getElementById('ai-thinking').style.display = 'none';
  const msgEl = document.getElementById('ai-result-msg');
  msgEl.style.display = 'block';
  if (correct) {
    msgEl.className   = 'result-msg correct';
    msgEl.textContent = `✅ ${rivalName.charAt(0).toUpperCase() + rivalName.slice(1)} ha acertado`;
    if (typeof _gsbFlash === 'function') _gsbFlash('rival', 'correct');
  } else {
    msgEl.className   = 'result-msg wrong';
    msgEl.textContent = `❌ ${rivalName.charAt(0).toUpperCase() + rivalName.slice(1)} ha fallado`;
    if (typeof _gsbFlash === 'function') _gsbFlash('rival', 'wrong');
    document.getElementById('ai-next-btn').style.display = 'block';
  }
}

/* ═══════════════════════════════════════════════════
   TURNO VISUAL DEL RIVAL ONLINE (modo multijugador)
   Reutiliza renderAITurnScreen + startTimer para mostrar
   la pantalla screen-ai cuando es el turno del rival online.
   Antes estaba duplicado en gameplay.js::showOnlineRivalTurn.
═══════════════════════════════════════════════════ */
function showOnlineRivalTurn(data, rivalName) {
  if (document.getElementById('screen-ai').classList.contains('active')) return;
  showScreen('screen-ai');
  clearInterval(window.timerInterval);

  const _state   = window.state;
  const q        = _state.questions[_state.round];
  const aiDebuffs = _state.pendingDebuffsForAI || [];

  // Reutiliza el renderizado de ui.js (sin meta-bar de categoría para simplificarlo)
  document.getElementById('ai-round-label').textContent =
    `Turno de ${rivalName} — Ronda ${_state.round + 1} de 10`;

  const aidEl = document.getElementById('ai-debuff-display');
  if (aiDebuffs.length > 0) {
    aidEl.style.display = 'block';
    aidEl.innerHTML = `<strong>Desventajas de ${rivalName}:</strong> ${aiDebuffs.map(d => `${d.icon} ${d.name}`).join(', ')}`;
  } else {
    aidEl.style.display = 'none';
  }

  document.getElementById('ai-question-text').textContent = q ? q.q : '';
  document.getElementById('ai-thinking').style.display = 'block';
  document.getElementById('ai-thinking-label').textContent = `${rivalName} está pensando...`;
  document.getElementById('ai-result-msg').style.display = 'none';
  document.getElementById('ai-next-btn').style.display = 'none';
  document.getElementById('online-rival-answers').style.display = 'none';

  const hasTime = aiDebuffs.some(d => d.id === 'time');
  const secs    = hasTime ? 8 : 20;
  window.startTimer('ai-timer-bar', secs, false, () => {});
}

/* ═══════════════════════════════════════════════════
   RESULTADO VISUAL DEL RIVAL ONLINE (modo multijugador)
   Muestra el mensaje correcto/incorrecto del rival online.
   Antes estaba duplicado en gameplay.js::resolveOnlineRival.
═══════════════════════════════════════════════════ */
function resolveOnlineRival(correct, rivalName) {
  const msgEl = document.getElementById('ai-result-msg');
  document.getElementById('ai-thinking').style.display = 'none';
  msgEl.style.display = 'block';

  if (correct) {
    msgEl.className   = 'result-msg correct';
    msgEl.textContent = `✅ ${rivalName.charAt(0).toUpperCase() + rivalName.slice(1)} ha acertado`;
    if (typeof _gsbFlash === 'function') _gsbFlash('rival', 'correct');
  } else {
    msgEl.className   = 'result-msg wrong';
    msgEl.textContent = `❌ ${rivalName.charAt(0).toUpperCase() + rivalName.slice(1)} ha fallado`;
    if (typeof _gsbFlash === 'function') _gsbFlash('rival', 'wrong');
    const nextBtn = document.getElementById('ai-next-btn');
    nextBtn.style.display = 'block';
    nextBtn.onclick = () => window.onlineAdvanceRound();
  }
  updateScores();
}

/* ═══════════════════════════════════════════════════
   PANTALLA FINAL DE RESULTADO
   Rellena crown, título, subtítulo, cajas y XP
   en screen-result. Sin lógica de puntuación.
═══════════════════════════════════════════════════ */
function renderResultScreen(playerScore, aiScore, totalBoxes, isOnline, myName, rivalName) {
  const crown = document.getElementById('result-crown');
  const title = document.getElementById('result-title');
  const sub   = document.getElementById('result-subtitle');
  const p = playerScore, a = aiScore;

  if (p > a) {
    crown.textContent = '🏆';
    title.textContent = isOnline ? `¡${myName} gana!` : '¡Has ganado!';
    sub.textContent   = `${isOnline ? myName : 'Tú'} superaste a ${rivalName} por ${p - a} punto${p - a !== 1 ? 's' : ''}.`;
    setTimeout(() => spawnConfetti(30), 200);
  } else if (a > p) {
    crown.textContent = isOnline ? '🎉' : '🤖';
    title.textContent = isOnline ? `¡${rivalName} gana!` : (rivalName === 'ZXON-7' ? '¡ZXON-7 ha ganado!' : 'La IA ha ganado');
    sub.textContent   = `${rivalName} te superó por ${a - p} punto${a - p !== 1 ? 's' : ''}.`;
  } else {
    crown.textContent = '🤝';
    title.textContent = '¡Empate!';
    sub.textContent   = 'Ambos igualados. ¡Revancha!';
  }
  document.getElementById('boxes-summary').textContent =
    `Cajas sorpresa abiertas: ${totalBoxes}`;
  updateScores();
}
