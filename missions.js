/* ═══════════════════════════════════════════════════
   missions.js — Sistema de misiones autónomo
   Trivia Sorpresa

   DEPENDENCIAS (cargar ANTES en index.html):
     · gameState.js  → window.GameState
     · shop.js       → addCoins(n)
     · rank.js       → addXP(n, reason)

   ORDEN DE CARGA EN index.html:
     <script src="gameState.js"></script>
     <script src="shop.js"></script>
     <script src="missions.js"></script>   ← antes de gameplay.js
     <script src="gameplay.js"></script>
═══════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════
   POOLS DE MISIONES
   Para añadir una misión nueva: push a DAILY_POOL o WEEKLY_POOL.
   Campos: { id, icon, title, desc, target, reward, type, xp? }
     · type   → clave del objeto stats que rastrea el progreso
     · reward → monedas al reclamar
     · xp     → (opcional) XP al reclamar; por defecto 15/35
═══════════════════════════════════════════════════ */
const DAILY_POOL = [
  { id: 'd_play1',      icon: '🎮', title: 'Calentar motores',  desc: 'Completa 1 partida hoy',                     target: 1,  reward: 8,  type: 'games_played' },
  { id: 'd_win1',       icon: '🏆', title: 'Victoria del día',  desc: 'Gana 1 partida hoy',                         target: 1,  reward: 12, type: 'wins' },
  { id: 'd_correct5',   icon: '✅', title: 'Buen ojo',          desc: 'Acierta 5 preguntas hoy',                    target: 5,  reward: 10, type: 'correct_total' },
  { id: 'd_boxes2',     icon: '📦', title: 'Cazaboxes',         desc: 'Abre 2 cajas sorpresa hoy',                  target: 2,  reward: 8,  type: 'boxes_opened' },
  { id: 'd_streak3',    icon: '💫', title: 'Racha corta',       desc: 'Acierta 3 seguidas en una partida hoy',      target: 3,  reward: 12, type: 'current_streak' },
  { id: 'd_correct3',   icon: '🎯', title: 'Certero',           desc: 'Acierta 3 preguntas en una partida',         target: 3,  reward: 8,  type: 'correct_total' },
  { id: 'd_play2',      icon: '🔄', title: 'Doble sesión',      desc: 'Completa 2 partidas hoy',                    target: 2,  reward: 15, type: 'games_played' },
  { id: 'd_online1',    icon: '🌐', title: 'Conexión online',   desc: 'Juega 1 partida online hoy',                 target: 1,  reward: 15, type: 'online_games' },
  { id: 'd_lightning1', icon: '⚡', title: 'Rayo del día',      desc: 'Completa 1 partida en Modo Relámpago hoy',   target: 1,  reward: 12, type: 'lightning_games' },
  { id: 'd_category1',  icon: '🎯', title: 'Temático',          desc: 'Juega 1 partida por Categoría hoy',          target: 1,  reward: 10, type: 'category_games' },
  { id: 'd_special1',   icon: '✨', title: 'Modo especial',     desc: 'Juega 1 partida en un modo especial hoy',    target: 1,  reward: 12, type: 'special_games' },
];

const WEEKLY_POOL = [
  { id: 'w_play5',       icon: '🔥', title: 'Jugador habitual',  desc: 'Completa 5 partidas esta semana',            target: 5,  reward: 30, type: 'games_played' },
  { id: 'w_play10',      icon: '⚡', title: 'Sin descanso',      desc: 'Completa 10 partidas esta semana',           target: 10, reward: 55, type: 'games_played' },
  { id: 'w_win3',        icon: '🥇', title: 'Campeón semanal',   desc: 'Gana 3 partidas esta semana',                target: 3,  reward: 35, type: 'wins' },
  { id: 'w_win7',        icon: '👑', title: 'Imbatible',         desc: 'Gana 7 partidas esta semana',                target: 7,  reward: 70, type: 'wins' },
  { id: 'w_correct20',   icon: '🎯', title: 'Experto',           desc: 'Acierta 20 preguntas esta semana',           target: 20, reward: 35, type: 'correct_total' },
  { id: 'w_correct50',   icon: '🧠', title: 'Erudito',           desc: 'Acierta 50 preguntas esta semana',           target: 50, reward: 75, type: 'correct_total' },
  { id: 'w_boxes10',     icon: '📦', title: 'Coleccionista',     desc: 'Abre 10 cajas sorpresa esta semana',         target: 10, reward: 30, type: 'boxes_opened' },
  { id: 'w_boxes20',     icon: '🎁', title: 'Maestro de cajas',  desc: 'Abre 20 cajas sorpresa esta semana',         target: 20, reward: 50, type: 'boxes_opened' },
  { id: 'w_online3',     icon: '🌐', title: 'Multijugador pro',  desc: 'Juega 3 partidas online esta semana',        target: 3,  reward: 40, type: 'online_games' },
  { id: 'w_perfect',     icon: '⭐', title: 'Partida perfecta',  desc: 'Acierta las 10 preguntas de 1 partida',      target: 10, reward: 80, type: 'best_streak' },
  { id: 'w_streak5',     icon: '💥', title: 'Racha imparable',   desc: 'Acierta 5 seguidas en una partida',          target: 5,  reward: 40, type: 'current_streak' },
  { id: 'w_crack',       icon: '🤖', title: 'Cazador de IAs',    desc: 'Vence a la IA en modo Inteligentísimo',      target: 1,  reward: 60, type: 'wins_crack' },
  { id: 'w_lightning3',  icon: '⚡', title: 'Velocista',         desc: 'Completa 3 partidas en Modo Relámpago',      target: 3,  reward: 40, type: 'lightning_games' },
  { id: 'w_lightning_w', icon: '🏅', title: 'Rey del Relámpago', desc: 'Gana 2 partidas en Modo Relámpago',          target: 2,  reward: 50, type: 'lightning_wins' },
  { id: 'w_category3',   icon: '📚', title: 'Temático habitual', desc: 'Juega 3 partidas por Categoría esta semana', target: 3,  reward: 35, type: 'category_games' },
  { id: 'w_special3',    icon: '✨', title: 'Modo especial x3',  desc: 'Completa 3 partidas en modos especiales',    target: 3,  reward: 45, type: 'special_games' },
  { id: 'w_online_win3', icon: '🌐', title: 'Dominador online',  desc: 'Gana 3 partidas multijugador online',        target: 3,  reward: 65, type: 'online_wins' },
];


/* ═══════════════════════════════════════════════════
   HELPERS INTERNOS
═══════════════════════════════════════════════════ */
function _todayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}
function _weekStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.getTime();
}
function _seededShuffle(arr, seed) {
  const a = [...arr]; let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function _mStore(periodKey) {
  return periodKey === 'daily'
    ? window.GameState.missions.daily
    : window.GameState.missions.weekly;
}

/* Garantiza que exista estado válido para el período. Devuelve el estado. */
function _initPeriod(periodKey) {
  const isDaily = periodKey === 'daily';
  const stamp   = isDaily ? _todayStart() : _weekStart();
  const pool    = isDaily ? DAILY_POOL    : WEEKLY_POOL;
  const count   = isDaily ? 3             : 10;
  const unit    = isDaily ? 86400000      : 86400000 * 7;
  const store   = _mStore(periodKey);

  let ps = store.get();
  if (!ps || ps.periodStart !== stamp) {
    const seed   = Math.floor(stamp / unit);
    const picked = _seededShuffle(pool, seed).slice(0, count);
    ps = { periodStart: stamp, missions: picked, progress: {}, claimed: [] };
    store.save(ps);
  }
  return ps;
}

/* Sincroniza progreso de todas las misiones activas con el objeto stats. */
function _syncProgress(stats) {
  ['daily', 'weekly'].forEach(key => {
    const ps = _initPeriod(key);
    ps.missions.forEach(m => {
      ps.progress[m.id] = Math.min(stats[m.type] || 0, m.target);
    });
    _mStore(key).save(ps);
  });
}


/* ═══════════════════════════════════════════════════
   recordGameResult
   Punto de entrada desde gameplay.js al terminar partida.
   Actualiza stats globales, XP, trofeos y misiones.
═══════════════════════════════════════════════════ */
function recordGameResult({
  won            = false,
  correctAnswers = 0,
  boxesOpened    = 0,
  isOnline       = false,
  currentStreak  = 0,
  isCrackMode    = false,
  isLightning    = false,
  isCategoryMode = false,
  isSpecialMode  = false,
} = {}) {

  // ── Stats globales ─────────────────────────────────────────
  const s = window.GameState.stats.get();
  s.games_played   = (s.games_played   || 0) + 1;
  s.correct_total  = (s.correct_total  || 0) + (correctAnswers || 0);
  s.wins           = (s.wins           || 0) + (won ? 1 : 0);
  s.boxes_opened   = (s.boxes_opened   || 0) + (boxesOpened || 0);
  s.online_games   = (s.online_games   || 0) + (isOnline ? 1 : 0);
  s.best_streak    = Math.max(s.best_streak    || 0, correctAnswers || 0);
  s.current_streak = Math.max(s.current_streak || 0, currentStreak  || 0);
  if (won && isCrackMode)  s.wins_crack      = (s.wins_crack      || 0) + 1;
  if (won && isOnline)     s.online_wins     = (s.online_wins     || 0) + 1;
  if (isLightning)         s.lightning_games = (s.lightning_games || 0) + 1;
  if (won && isLightning)  s.lightning_wins  = (s.lightning_wins  || 0) + 1;
  if (isCategoryMode)      s.category_games  = (s.category_games  || 0) + 1;
  if (isSpecialMode)       s.special_games   = (s.special_games   || 0) + 1;
  window.GameState.stats.save(s);

  // ── XP por partida ─────────────────────────────────────────
  const lvl = (window.state && window.state.level) || 'facil';
  let xpKey, xpReason;
  if (isOnline) {
    xpKey    = won ? 'win_online' : 'lose_online';
    xpReason = won ? 'Victoria online' : 'Partida online';
  } else if (won) {
    xpKey    = lvl === 'crack'   ? 'win_vs_ai_crack'
             : lvl === 'listo'   ? 'win_vs_ai_hard'
             : lvl === 'mediano' ? 'win_vs_ai_medium'
             :                     'win_vs_ai_easy';
    xpReason = 'Victoria';
  } else {
    xpKey    = 'lose_vs_ai';
    xpReason = 'Partida completada';
  }
  const xpAmt = (window.XP_REWARDS && window.XP_REWARDS[xpKey]) || 10;
  if (typeof addXP === 'function') addXP(xpAmt, xpReason);

  // ── Trofeos ────────────────────────────────────────────────
  if (typeof checkTrophies === 'function') checkTrophies();

  // ── Progreso de misiones ───────────────────────────────────
  _syncProgress(s);
  renderMissions();
}
window.recordGameResult = recordGameResult;


/* ═══════════════════════════════════════════════════
   claimMission — llamado por el DOM: onclick="claimMission(...)"
═══════════════════════════════════════════════════ */
function claimMission(id, periodKey) {
  const store = _mStore(periodKey);
  const ps    = store.get();
  if (!ps || ps.claimed.includes(id)) return;

  const m = ps.missions.find(x => x.id === id);
  if (!m || (ps.progress[m.id] || 0) < m.target) return;

  ps.claimed.push(id);
  store.save(ps);

  if (typeof addCoins === 'function') addCoins(m.reward);

  const isDaily = periodKey === 'daily';
  const xpGain  = isDaily
    ? ((window.XP_REWARDS && window.XP_REWARDS.mission_daily)  || 15)
    : ((window.XP_REWARDS && window.XP_REWARDS.mission_weekly) || 35);
  if (typeof addXP === 'function') addXP(xpGain, `Misión ${isDaily ? 'diaria' : 'semanal'}`);

  if (typeof checkTrophies === 'function') checkTrophies();
  renderMissions();
}
window.claimMission = claimMission;


/* ═══════════════════════════════════════════════════
   UI — renderMissions, tabs, timers, dot
═══════════════════════════════════════════════════ */
let _activeMissionTab = 'daily';

function switchMissionTab(tab) {
  _activeMissionTab = tab;
  document.querySelectorAll('.mission-tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  renderMissions();
}
window.switchMissionTab = switchMissionTab;

function updateTabTimers() {
  const now = Date.now();
  const dt  = document.getElementById('timer-daily');
  const wt  = document.getElementById('timer-weekly');
  function fmt(ms) {
    if (ms <= 0) return 'Renovando...';
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h > 23) { const d = Math.floor(h / 24); return `${d}d ${h % 24}h`; }
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  if (dt) dt.textContent = fmt(_todayStart() + 86400000 - now);
  if (wt) wt.textContent = fmt(_weekStart()  + 86400000 * 7 - now);
}
window.updateTabTimers = updateTabTimers;

function hasClaimableMissions() {
  for (const key of ['daily', 'weekly']) {
    const ps = _mStore(key).get();
    if (!ps) continue;
    if (ps.missions.some(m => !ps.claimed.includes(m.id) && (ps.progress[m.id] || 0) >= m.target))
      return true;
  }
  return false;
}
window.hasClaimableMissions = hasClaimableMissions;

function updateMissionDot() {
  const dot = document.getElementById('missions-dot');
  if (dot) dot.style.display = hasClaimableMissions() ? 'block' : 'none';
}
window.updateMissionDot = updateMissionDot;

function renderMissions() {
  updateTabTimers();
  updateMissionDot();

  const list = document.getElementById('missions-list');
  if (!list) return;

  if (_activeMissionTab === 'event') {
    list.innerHTML = '';
    const ev = document.getElementById('event-empty');
    if (ev) ev.style.display = 'block';
    return;
  }
  const ev = document.getElementById('event-empty');
  if (ev) ev.style.display = 'none';

  const isDaily   = _activeMissionTab === 'daily';
  const periodKey = isDaily ? 'daily' : 'weekly';
  const ps        = _initPeriod(periodKey);
  const stats     = window.GameState.stats.get();

  // Sincronizar progreso con stats actuales antes de pintar
  ps.missions.forEach(m => {
    ps.progress[m.id] = Math.min(stats[m.type] || 0, m.target);
  });
  _mStore(periodKey).save(ps);

  let claimedCount = 0;
  const html = ps.missions.map((m, idx) => {
    const val       = ps.progress[m.id] || 0;
    const pct       = Math.round((val / m.target) * 100);
    const done      = val >= m.target;
    const isClaimed = ps.claimed.includes(m.id);
    if (isClaimed) claimedCount++;

    const xpVal    = m.xp || (isDaily ? 15 : 35);
    let cardClass  = 'mission-card-v2';
    if (done && !isClaimed) cardClass += ' mc-completed';
    if (isClaimed)          cardClass += ' mc-claimed';

    // Número de orden con cero delante: 01, 02...
    const orderNum = String(idx + 1).padStart(2, '0');

    const claimArea = isClaimed
      ? `<div class="mc-claimed-badge">TRANSMISIÓN RECIBIDA · ARCHIVADA</div>`
      : done
      ? `<button class="mc-claim-btn" onclick="claimMission('${m.id}','${periodKey}')">RECLAMAR RECOMPENSA · ${m.reward}⬡ + ${xpVal}XP</button>`
      : '';

    return `
      <div class="${cardClass}" style="animation-delay:${idx * 0.06}s">
        <div class="mc-body">
          <div class="mc-accent">${orderNum}</div>
          <div class="mc-icon-wrap">${m.icon}</div>
          <div class="mc-top">
            <div class="mc-info">
              <div class="mc-title">${m.title}</div>
              <div class="mc-desc">${m.desc}</div>
            </div>
            <div class="mc-rewards">
              <div class="mc-reward-coin">${m.reward}⬡</div>
              <div class="mc-reward-xp">${xpVal}XP</div>
            </div>
          </div>
        </div>
        <div class="mc-progress-wrap">
          <div class="mc-progress-track">
            <div class="mc-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="mc-progress-text">
            <span>${val} / ${m.target}${isClaimed ? ' · COMPLETADA' : ''}</span>
            <span>${pct}%</span>
          </div>
        </div>
        ${claimArea}
      </div>`;
  }).join('');

  list.innerHTML = html;
  const countEl = document.getElementById('missions-completed-count');
  const totalEl = document.getElementById('missions-total-count');
  if (countEl) countEl.textContent = claimedCount;
  if (totalEl) totalEl.textContent = ps.missions.length;

  // ── Agente espacial de briefing ─────────────────────
  _renderMissionAgent(claimedCount, ps.missions.length, isDaily);
}

function _renderMissionAgent(claimed, total, isDaily) {
  const containerId = 'msn-agent-container';
  // Buscar el contenedor de stats para insertar el agente justo antes
  const statsCard = document.querySelector('.missions-stats-card');
  if (!statsCard) return;

  // Evitar duplicados
  let agentEl = document.getElementById(containerId);
  if (!agentEl) {
    agentEl = document.createElement('div');
    agentEl.id = containerId;
    statsCard.parentNode.insertBefore(agentEl, statsCard);
  }

  const pct        = total > 0 ? Math.round((claimed / total) * 100) : 0;
  const modeLabel  = isDaily ? 'CICLO DIARIO' : 'CICLO SEMANAL';
  const statusText = claimed === total && total > 0
    ? 'OBJETIVOS CUMPLIDOS'
    : claimed > 0
    ? 'EN PROGRESO'
    : 'EN ESPERA DE ACCIÓN';
  const statusColor = claimed === total && total > 0
    ? 'rgba(74,222,128,0.85)'
    : claimed > 0
    ? 'rgba(251,191,36,0.85)'
    : 'rgba(96,165,250,0.7)';

  // Partículas de la plataforma (posiciones fijas)
  const particles = [
    { left: '36%', delay: '0s',    dur: '2.2s' },
    { left: '50%', delay: '0.8s',  dur: '2.8s' },
    { left: '63%', delay: '1.5s',  dur: '2.0s' },
    { left: '44%', delay: '0.4s',  dur: '3.1s' },
    { left: '57%', delay: '1.1s',  dur: '2.5s' },
  ].map(p => `<div class="msn-platform-particle" style="left:${p.left};--delay:${p.delay};--dur:${p.dur}"></div>`).join('');

  agentEl.innerHTML = `
    <div class="msn-agent-scene">
      <!-- HUD izquierdo -->
      <div class="msn-hud-left">
        <div class="msn-hud-line"><div class="msn-hud-dot"></div>${modeLabel}</div>
        <div class="msn-hud-line">${claimed}/${total} COMPLETADAS</div>
        <div class="msn-hud-line" style="color:${statusColor}">${statusText}</div>
      </div>
      <!-- HUD derecho -->
      <div class="msn-hud-right">
        <div class="msn-hud-line">SECTOR-7G</div>
        <div class="msn-hud-line">${pct}% PROGRESO</div>
        <div class="msn-hud-line">AGENTE ACTIVO</div>
      </div>
      <!-- Columna de luz de plataforma -->
      <div class="msn-platform-light"></div>
      <!-- Partículas -->
      ${particles}
      <!-- Escáner -->
      <div class="msn-agent-scan"></div>
      <!-- Nameplate -->
      <div class="msn-agent-nameplate">
        <div class="msn-agent-nameplate-inner">AGENTE ZARA-1</div>
      </div>
      <!-- Imagen del agente -->
      <img class="msn-agent-img"
           src="assets/agents/agent1.png"
           alt="Agente espacial"
           draggable="false" />
      <!-- Plataforma -->
      <div class="msn-agent-platform"></div>
    </div>`;
}
window.renderMissions = renderMissions;


/* ═══════════════════════════════════════════════════
   ARRANQUE — garantiza períodos al cargar el script
═══════════════════════════════════════════════════ */
_initPeriod('daily');
_initPeriod('weekly');
