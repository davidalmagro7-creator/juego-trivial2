/* ═══════════════════════════════════════════════════
   gameplay.js — Lógica pura del juego
   ui.js gestiona toda la parte visual.

   CONTENIDO (solo lógica):
     · DATA          — QUESTIONS, EFFECTS, DEBUFFS, LEVELS
     · STATE         — state, lState, onlineMode, timerInterval…
     · CORE GAME     — startGame, loadPlayerQuestion, playerAnswer,
                       timer, boxes, AI simultaneous, advanceRound,
                       showResult, resetGame, playAgain…
     · ONLINE        — createRoom, joinRoom, listenRoom, handleRoomUpdate…
     · LIGHTNING     — startLightningGame, loadLightningRound, lPlayerBuzz…
     · CATEGORY MODE — selectCategory, startCategoryGame, SPECIAL modes…

   DEPENDENCIAS (deben cargarse ANTES de este script):
     · ui.js                  — showScreen, setGameActive, updateScores,
                                flashScreen, spawnConfetti, spawnScoreParticle,
                                popScoreNum, renderInventory, _gsbFlash,
                                confirmQuitGame, cancelQuitGame, setLobbyErr,
                                copyCode, _setLabelText, _updateScoreboardBar,
                               loadPlayerQuestion, renderAnswerResult,
                               showAnswerFeedback, showAILiveThinking, showAILiveResult,
                               hideAILivePanel, renderAITurnScreen, renderAIResult,
                               renderResultScreen, showOnlineRivalTurn, resolveOnlineRival
     · Firebase en window._fb — (script type="module" en index.html)
     · addCoins(n)            — de shop.js
     · addXP(n, reason)       — de rank.js / xp system
     · showXPToast(msg)       — de rank.js / xp system
     · renderMissions()       — de missions system
     · renderStore()          — de shop.js
     · renderMuseum()         — de trophy/museum system

   ORDEN EN index.html:
       <script src="questions.js"></script>
       <script src="ui.js"></script>
       <script src="shop.js"></script>
       <script src="gameplay.js"></script>
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════ */
/* QUESTIONS — definido en questions.js (se carga antes que este script) */


// ── SISTEMA MIXTO: efectos que se aplican al RIVAL (el que abre la caja gana la ventaja / el rival sufre)
// target: 'rival' = desventaja para el rival
// target: 'self'  = ventaja para quien abre la caja
const EFFECTS = [
  // ══ DESVENTAJAS PARA EL RIVAL (common) ══
  {id:"fogmind",   name:"Niebla Mental",    desc:"Las respuestas se mezclan aleatoriamente", icon:"🌫️", color:"badge-purple", rarity:"common", target:"rival", category:"debuff"},
  {id:"unstable",  name:"Tiempo Inestable", desc:"Menos tiempo para responder",             icon:"⏳", color:"badge-amber",  rarity:"common", target:"rival", category:"debuff"},

  // ══ VENTAJAS PARA EL JUGADOR (common) ══
  {id:"quickmind",  name:"Mente Rápida",     desc:"+3 segundos extra para responder",        icon:"🧠",  color:"badge-teal",   rarity:"common", target:"self",  category:"buff"},
  {id:"precision",  name:"Precisión",        desc:"Elimina automáticamente 1 respuesta incorrecta", icon:"🎯", color:"badge-teal", rarity:"common", target:"self", category:"buff"},
  {id:"hotstreak",  name:"Racha Ardiente",   desc:"Si aciertas: doble monedas y doble XP",  icon:"🔥",  color:"badge-amber",  rarity:"common", target:"self",  category:"buff"},

  // ══ DESVENTAJAS PARA EL RIVAL (rare) ══
  {id:"fogmind_rare", name:"Niebla Mental+",  desc:"Las respuestas se mezclan aleatoriamente", icon:"🌫️", color:"badge-purple", rarity:"rare", target:"rival", category:"debuff"},
  {id:"unstable_rare",name:"Tiempo Inestable+",desc:"Menos tiempo para responder",             icon:"⏳", color:"badge-amber",  rarity:"rare", target:"rival", category:"debuff"},

  // ══ VENTAJAS PARA EL JUGADOR (rare) ══
  {id:"mindshield", name:"Escudo Mental",   desc:"Ignora la próxima desventaja",           icon:"🛡️",  color:"badge-purple", rarity:"rare",   target:"self",  category:"buff"},
  {id:"analytics",  name:"Visión Analítica",desc:"La categoría de la próxima pregunta se revela antes", icon:"👁️", color:"badge-teal", rarity:"rare", target:"self", category:"buff"},
  {id:"overload",   name:"Sobrecarga",      desc:"Respuesta instantánea correcta = bonus extra", icon:"⚡", color:"badge-amber", rarity:"rare", target:"self",  category:"buff"},

  // ══ DESVENTAJAS PARA EL RIVAL (epic) ══
  {id:"fogmind_epic", name:"Niebla Profunda",    desc:"Las respuestas se mezclan aleatoriamente", icon:"🌫️", color:"badge-red", rarity:"epic", target:"rival", category:"debuff"},
  {id:"unstable_epic",name:"Tiempo en Caída",    desc:"Menos tiempo para responder",              icon:"⏳", color:"badge-red", rarity:"epic", target:"rival", category:"debuff"},

  // ══ VENTAJAS PARA EL JUGADOR (epic) ══
  {id:"duplicator", name:"Duplicador",      desc:"La próxima recompensa se duplica",       icon:"🎁",  color:"badge-purple", rarity:"epic",   target:"self",  category:"buff"},

  // ══ EFECTOS DIVERTIDOS (fun) — hacen el juego memorable ══
  {id:"monkeymode",  name:"Modo Mono",        desc:"Las respuestas aparecen llenas de emojis locos 🐒",  icon:"🐒", color:"badge-amber",  rarity:"rare",   target:"rival", category:"fun"},
  {id:"alienquestion",name:"Pregunta Alienígena", desc:"La interfaz se transforma unos segundos 🛰️",     icon:"🛰️", color:"badge-purple", rarity:"rare",   target:"rival", category:"fun"},
];

// Mantener alias DEBUFFS para compatibilidad con modo online / lightning
const DEBUFFS = EFFECTS.filter(e => e.category === 'debuff');

const LEVELS = {
  facil:  {name:"😴 Fácil",          acc:0.55, trapAcc:0.28},
  mediano:{name:"🙂 Mediano",        acc:0.65, trapAcc:0.30},
  listo:  {name:"🧠 Listo",          acc:0.82, trapAcc:0.50},
  crack:  {name:"🤖 Inteligentísimo",acc:0.95, trapAcc:0.75},
};

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
let selectedLevel = null;
let state = {};
let timerInterval = null;

// Online multiplayer state
let onlineMode = false;       // true when playing online
let lightningMode = false;    // true when playing lightning mode
let myRole = null;            // 'host' or 'guest'
let roomCode = null;
Object.defineProperty(window, 'roomCode',      { get: () => roomCode,      set: v => { roomCode = v; },      configurable: true });
// Exponer state, onlineMode y timerInterval para que ui.js pueda leerlos y escribirlos
Object.defineProperty(window, 'state',         { get: () => state,         set: v => { state = v; },         configurable: true });
Object.defineProperty(window, 'onlineMode',    { get: () => onlineMode,    set: v => { onlineMode = v; },    configurable: true });
Object.defineProperty(window, 'timerInterval', { get: () => timerInterval, set: v => { timerInterval = v; }, configurable: true });
let roomRef = null;
let roomListener = null;
let myPlayerKey = null;       // 'player1' or 'player2'
let rivalPlayerKey = null;    // 'player2' or 'player1'
let onlineState = null;       // last snapshot of room state
let waitingForRival = false;

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function fb() { return window._fb; }

/* showScreen, setGameActive, IN_GAME_SCREENS → definidos en ui.js */

function chooseMode(mode) {
  if (mode === 'solo') {
    onlineMode = false;
    lightningMode = false;
    showScreen('screen-start');
  } else if (mode === 'agents') {
    onlineMode = false;
    lightningMode = false;
    showScreen('screen-agent-select');
  } else if (mode === 'lightning') {
    onlineMode = false;
    lightningMode = false;
    showScreen('screen-lightning-start');
  } else {
    onlineMode = true;
    lightningMode = false;
    showScreen('screen-lobby');
  }
}

function startAgentBattle() {
  // Lanza el combate contra el primer agente (nivel fácil) sin pasar por la pantalla de selección de dificultad
  selectLevel('facil');
  startGame();
}

function goBackFromAgents() {
  // Detecta desde dónde llegó el usuario y vuelve correctamente
  const gamesection = document.getElementById('section-game');
  const gamemodes   = document.getElementById('section-gamemodes');
  if (gamemodes && gamemodes.style.display !== 'none') {
    showScreen('screen-mode');
  } else {
    goToGameSection();
    setTimeout(() => showScreen('screen-mode'), 200);
  }
}

function getPlayerName() {
  const n = (document.getElementById('player-name-input').value || '').trim();
  return n || 'Jugador';
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* copyCode → definida en ui.js */

/* ═══════════════════════════════════════════════════
   SOLO MODE
═══════════════════════════════════════════════════ */
function selectLevel(lvl) {
  selectedLevel = lvl;
  document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
  document.getElementById('lvl-' + lvl).classList.add('selected');
  document.getElementById('start-btn').style.display = 'block';
}

function startGame() {
  if (!selectedLevel) return;
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  if (state && state._aiSimTimeout) clearTimeout(state._aiSimTimeout);
  state = {
    questions: shuffled,
    round: 0,
    playerScore: 0,
    aiScore: 0,
    pendingDebuffsForAI: [],
    pendingDebuffsForPlayer: [],
    pendingBuffForPlayer: [],
    totalBoxes: 0,
    answered: false,
    aiAnswered: false,
    aiResult: null,
    _playerWonBox: false,
    _pendingRivalBox: false,
    _aiSimTimeout: null,
    level: selectedLevel,
  };
  setLabels();
  showScreen('screen-player');
  window.loadPlayerQuestion();
}

function setLabels(p1name, p2name) {
  if (onlineMode) {
    const myName = p1name || 'Tú';
    const rivalName = p2name || 'Rival';
    _setLabelText('player-name-label', myName);
    _setLabelText('box-player-label', myName);
    _setLabelText('ai-turn-player-label', myName);
    _setLabelText('final-player-label', myName);
    _setLabelText('ai-label', rivalName);
    _setLabelText('box-ai-label', rivalName);
    _setLabelText('ai-turn-label', rivalName);
    _setLabelText('final-ai-label', rivalName);
  } else {
    const short = LEVELS[state.level].name.split(' ')[0];
    ['ai-label','box-ai-label','ai-turn-label','final-ai-label'].forEach(id => _setLabelText(id, 'IA ' + short));
    ['player-name-label','box-player-label','ai-turn-player-label','final-player-label'].forEach(id => _setLabelText(id, 'Tú'));
  }
}

/* _setLabelText, updateScores, _updateScoreboardBar, _gsbFlash → definidos en ui.js */

function getBoxes() {
  // Siempre 1-2 efectos: probabilidad de tener dos es 45%
  const count = Math.random() < 0.45 ? 2 : 1;
  // Pool ponderado: common 55%, rare 32%, epic 13%
  const weighted = [];
  EFFECTS.forEach(e => {
    const w = e.rarity === 'common' ? 55 : e.rarity === 'rare' ? 32 : 13;
    for (let i = 0; i < w; i++) weighted.push(e);
  });

  const picked = [];
  const usedIds = new Set();

  // Si salen 2 efectos, intentar que al menos uno sea buff y otro debuff (50% de las veces)
  const wantMixed = count === 2 && Math.random() < 0.5;

  if (wantMixed) {
    const buffPool = weighted.filter(e => e.category === 'buff');
    const b = buffPool[Math.floor(Math.random() * buffPool.length)];
    picked.push(b); usedIds.add(b.id);
    const debuffPool = weighted.filter(e => e.category === 'debuff' && !usedIds.has(e.id));
    const d = debuffPool[Math.floor(Math.random() * debuffPool.length)];
    picked.push(d); usedIds.add(d.id);
  } else {
    while (picked.length < count) {
      const candidate = weighted[Math.floor(Math.random() * weighted.length)];
      if (!usedIds.has(candidate.id)) { picked.push(candidate); usedIds.add(candidate.id); }
    }
  }

  return picked;
}

function startTimer(barId, secs, hidden, onEnd) {
  clearInterval(timerInterval);
  let left = secs;
  const bar = document.getElementById(barId);
  if (bar) {
    bar.style.width = '100%';
    bar.style.background = 'var(--purple)';
    bar.parentElement.style.opacity = hidden ? '0' : '1';
  }
  timerInterval = setInterval(() => {
    left--;
    const pct = Math.max(0, (left / secs) * 100);
    if (bar) {
      bar.style.width = pct + '%';
      if (pct < 30) { bar.style.background = 'var(--red)'; bar.classList.add('urgent'); }
      else if (pct < 60) { bar.style.background = 'var(--amber)'; bar.classList.remove('urgent'); }
      else { bar.classList.remove('urgent'); }
    }
    if (left <= 0) { clearInterval(timerInterval); onEnd(); }
  }, 1000);
}

/* loadPlayerQuestion → definida y expuesta en ui.js como window.loadPlayerQuestion */

function playerAnswer(chosen, correct, hasPenalty, hasDouble, hasMinus2, hasReverse) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(timerInterval);

  // Render visual de botones → ui.js
  renderAnswerResult(chosen, correct);

  const isCorrect = chosen === correct;

  // Detectar buffs activos en pendingBuffForPlayer
  const buffs = state.pendingBuffForPlayer || [];
  const hasHotstreak = buffs.some(b => b.id === 'hotstreak');
  const hasOverload  = buffs.some(b => b.id === 'overload');
  const hasDuplicator = state._duplicatorActive;

  state.pendingDebuffsForPlayer = [];

  // Feedback visual → ui.js
  showAnswerFeedback(isCorrect, hasDouble, hasPenalty, hasMinus2);

  if (onlineMode) {
    onlinePlayerAnswer(isCorrect, hasPenalty, hasDouble);
  } else {
    if (isCorrect) {
      if (hasReverse) {
        state.playerScore = Math.max(0, state.playerScore - 1);
        updateScores();
        state._playerWonBox = false;
        if (state.aiAnswered) resolveSimultaneous();
      } else {
        let pts = hasDouble ? 2 : 1;

        // ⚡ Sobrecarga: si respondió muy rápido (flag seteado en ui.js), +1 extra
        if (hasOverload && state._overloadFast) {
          pts += 1;
          showXPToast('⚡ ¡Sobrecarga! Bonus +1 punto extra');
        }
        state._overloadFast = false;

        state.playerScore += pts;
        updateScores();
        state._playerWonBox = true;

        // 🔥 Racha Ardiente: doble monedas y doble XP
        if (hasHotstreak) {
          const coins = hasDuplicator ? 4 : 2;
          const xp    = hasDuplicator ? 40 : 20;
          if (typeof addCoins === 'function') addCoins(coins);
          if (typeof addXP    === 'function') addXP(xp, 'Racha Ardiente');
          showXPToast(`🔥 ¡Racha! +${coins}🪙 +${xp}XP`);
        } else if (hasDuplicator) {
          // 🎁 Duplicador sin hotstreak: duplica monedas/XP base de acierto
          if (typeof addCoins === 'function') addCoins(2);
          if (typeof addXP    === 'function') addXP(20, 'Duplicador');
          showXPToast('🎁 ¡Duplicador! Recompensa x2');
        }
        state._duplicatorActive = false;

        if (state.aiAnswered) resolveSimultaneous();
      }
    } else {
      const penalty = hasMinus2 ? 2 : hasPenalty ? 1 : 0;
      const doublePenalty = hasDouble ? 1 : 0;
      state.playerScore = Math.max(0, state.playerScore - penalty - doublePenalty);
      updateScores();
      state._playerWonBox = false;
      state._overloadFast = false;
      state._duplicatorActive = false;
      if (state.aiAnswered) resolveSimultaneous();
    }
  }
}

function applyBuffEffect(eff) {
  // Aplica ventajas al jugador según el tipo
  state.pendingBuffForPlayer = state.pendingBuffForPlayer || [];

  switch (eff.id) {
    case 'quickmind':
      // +3 segundos extra al responder
      state.pendingBuffForPlayer.push(eff);
      showXPToast('🧠 Mente Rápida: +3 segundos');
      break;

    case 'precision':
      // Elimina automáticamente 1 respuesta incorrecta (como hint)
      state.pendingBuffForPlayer.push(eff);
      showXPToast('🎯 Precisión: se elimina una opción incorrecta');
      break;

    case 'hotstreak':
      // Si aciertas la siguiente: doble monedas y doble XP (se activa en playerAnswer)
      state.pendingBuffForPlayer.push(eff);
      showXPToast('🔥 Racha Ardiente activada');
      break;

    case 'mindshield':
      // Ignora la próxima desventaja — se consume al cargar la pregunta
      state._mindShieldActive = true;
      showXPToast('🛡️ Escudo Mental: próxima desventaja ignorada');
      break;

    case 'analytics':
      // Revela la categoría de la SIGUIENTE pregunta antes de cargarla
      state.pendingBuffForPlayer.push(eff);
      const nextRound = state.round + 1;
      if (nextRound < state.questions.length) {
        const nextQ = state.questions[nextRound];
        const catMap = { geo:'🌍 Geografía', sci:'🔬 Ciencia', hist:'📜 Historia', art:'🎨 Arte & Cultura', sport:'⚽ Deporte', ent:'🎬 Entretenimiento', food:'🍕 Gastronomía', tech:'💻 Tecnología' };
        const catName = catMap[nextQ.cat] || nextQ.cat || 'General';
        showXPToast(`👁️ Próxima pregunta: ${catName}`);
      }
      break;

    case 'overload':
      // Respuesta instantánea correcta = +1 punto extra (se activa en playerAnswer)
      state.pendingBuffForPlayer.push(eff);
      showXPToast('⚡ Sobrecarga: responde rápido para bonus extra');
      break;

    case 'duplicator':
      // La próxima recompensa se duplica (afecta monedas/XP ganados al acertar)
      state._duplicatorActive = true;
      showXPToast('🎁 Duplicador: ¡próxima recompensa x2!');
      break;
  }
}

function showBox(fromPlayer) {
  const boxes = getBoxes();
  state.totalBoxes += boxes.length;
  const content = document.getElementById('box-reveal-content');
  const btn = document.getElementById('box-continue-btn');
  const animWrap = document.getElementById('box-anim-wrap');
  const animLabel = document.getElementById('box-anim-label');
  const lid = document.getElementById('box-anim-lid');
  const particles = document.getElementById('box-anim-particles');

  const rivalLabel = onlineMode
    ? (document.getElementById('ai-label').textContent || 'Rival')
    : 'la IA';

  // Separar ventajas (para quien abre), desventajas (para el rival) y efectos divertidos (para el rival)
  const buffs   = boxes.filter(e => e.category === 'buff');
  const debuffs = boxes.filter(e => e.category === 'debuff');
  const funs    = boxes.filter(e => e.category === 'fun');

  if (fromPlayer) {
    // El jugador abrió la caja → debuffs+funs van al rival, buffs al jugador
    state.pendingDebuffsForAI = [...debuffs, ...funs];
    buffs.forEach(b => applyBuffEffect(b));
  } else {
    // La IA/rival abrió la caja → debuffs+funs van al jugador, buffs al rival (ignorados mecánicamente)
    state.pendingDebuffsForPlayer = [...debuffs, ...funs];
  }

  updateScores();
  showScreen('screen-box');

  // Determinar paleta de color según qué hay en la caja
  const hasBuffs   = buffs.length > 0;
  const hasDebuffs = debuffs.length > 0;
  const isMixed    = hasBuffs && hasDebuffs;
  const primaryColor = fromPlayer
    ? (isMixed ? '#fbbf24' : hasBuffs ? '#4ade80' : '#a78bfa')
    : (hasDebuffs ? '#f87171' : '#a78bfa');

  // Reset animation state
  content.style.display = 'none';
  btn.style.display = 'none';
  animWrap.style.display = 'block';
  lid.classList.remove('open');
  particles.innerHTML = '';

  const openLabel = fromPlayer ? '✨ ¡Abriendo tu caja!' : `😬 ${capitalizeFirst(rivalLabel)} abre una caja`;
  animLabel.textContent = openLabel;
  animLabel.style.color = fromPlayer ? 'var(--green)' : 'var(--red)';

  // Cambiar color del body de la caja según quién la abre
  const body = document.getElementById('box-anim-body');
  if (fromPlayer) {
    body.style.background = 'linear-gradient(135deg, #1a3a1a, #2d5a2d)';
    body.style.borderColor = '#4ade80';
    body.style.boxShadow = '0 0 20px rgba(74,222,128,0.4)';
  } else {
    body.style.background = 'linear-gradient(135deg, #2a1f6e, #4c3f7a)';
    body.style.borderColor = 'var(--purple)';
    body.style.boxShadow = '0 0 20px rgba(167,139,250,0.4)';
  }

  // Phase 1: shake
  body.style.animation = 'boxShake 0.5s ease';
  setTimeout(() => { body.style.animation = ''; }, 500);

  // Phase 2: lid + partículas de color mixto
  setTimeout(() => {
    lid.classList.add('open');
    animLabel.textContent = '🎁 ¡Sorpresa!';

    const particleColors = fromPlayer
      ? (isMixed
          ? ['#4ade80','#fbbf24','#a78bfa','#86efac','#fde68a']
          : hasBuffs
            ? ['#4ade80','#86efac','#22c55e','#bbf7d0','#fbbf24']
            : ['#a78bfa','#c4b5fd','#7c3aed','#ddd6fe'])
      : ['#f87171','#fbbf24','#ef4444','#fca5a5','#f97316'];

    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'box-particle';
      const angle = (i / 22) * 360;
      const dist = 45 + Math.random() * 55;
      const tx = Math.cos(angle * Math.PI / 180) * dist;
      const ty = Math.sin(angle * Math.PI / 180) * dist - 25;
      p.style.cssText = `
        left:50%; top:30%;
        background:${particleColors[i % particleColors.length]};
        box-shadow: 0 0 6px ${particleColors[i % particleColors.length]};
        --tx:${tx}px; --ty:${ty}px;
        animation-delay:${Math.random() * 0.18}s;
        width:${6 + Math.random() * 5}px;
        height:${6 + Math.random() * 5}px;
      `;
      particles.appendChild(p);
    }
  }, 600);

  // Phase 3: revelar contenido
  setTimeout(() => {
    animWrap.style.display = 'none';
    content.style.display = 'block';
    btn.style.display = 'block';

    const rarityLabel = { common:'Común', rare:'Rara', epic:'¡ÉPICA!' };

    function effectCard(e, idx) {
      const isBuff = e.category === 'buff';
      const isFun  = e.category === 'fun';
      const extraClass = isBuff ? ' is-buff' : isFun ? ' is-fun' : '';
      const gemClass = isBuff ? 'gem-buff' : isFun ? 'gem-fun' : `gem-${e.rarity}`;
      const tagLabel = isBuff ? '✨ Para ti' : isFun ? `😂 Rival · Efecto divertido` : `⚔️ Rival · ${rarityLabel[e.rarity] || e.rarity}`;
      return `
        <div class="debuff-card rarity-${e.rarity}${extraClass}" style="animation-delay:${idx * 0.13}s">
          <div class="debuff-icon">${e.icon}</div>
          <div class="debuff-info">
            <div><span class="rarity-gem ${gemClass}">${tagLabel}</span></div>
            <div class="debuff-name">${e.name}</div>
            <div class="debuff-desc">${e.desc}</div>
          </div>
        </div>
      `;
    }

    if (fromPlayer) {
      const hasBoth = (buffs.length > 0) && (debuffs.length > 0 || funs.length > 0);
      const header = hasBoth
        ? `<h3 style="margin-bottom:4px;font-family:'Nunito',sans-serif">¡Caja doble! 🎁✨</h3>
           <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Una ventaja para ti, una desventaja para ${rivalLabel}.</p>`
        : buffs.length > 0
          ? `<h3 style="margin-bottom:4px;font-family:'Nunito',sans-serif">¡Ventaja tuya! ✨</h3>
             <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Efecto aplicado al instante.</p>`
          : `<h3 style="margin-bottom:4px;font-family:'Nunito',sans-serif">¡Caja ganada! 📦</h3>
             <p style="color:var(--muted);font-size:13px;margin-bottom:14px">${capitalizeFirst(rivalLabel)} sufrirá:</p>`;

      content.innerHTML = header + [...buffs, ...debuffs, ...funs].map((e, i) => effectCard(e, i)).join('');
      if (onlineMode) {
        btn.textContent = 'Turno del rival →';
        btn.onclick = () => onlineRivalTurnStart(debuffs);
      } else if (state._pendingRivalBox) {
        btn.textContent = 'Ver caja del rival →';
        btn.onclick = () => { state._pendingRivalBox = false; showBox(false); };
      } else {
        btn.textContent = 'Siguiente ronda →';
        btn.onclick = () => advanceRound();
      }
    } else {
      const header = (debuffs.length > 0 || funs.length > 0)
        ? `<h3 style="margin-bottom:4px;font-family:'Nunito',sans-serif">${capitalizeFirst(rivalLabel)} abrió una caja 😬</h3>
           <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Tendrás que lidiar con:</p>`
        : `<h3 style="margin-bottom:4px;font-family:'Nunito',sans-serif">${capitalizeFirst(rivalLabel)} abrió una caja 😌</h3>
           <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Por suerte, no te afecta esta vez.</p>`;
      content.innerHTML = header + [...debuffs, ...funs].map((e, i) => effectCard(e, i)).join('');
      btn.textContent = 'Mi turno →';
      btn.onclick = () => advanceRound();
    }
  }, 1700);
}

function capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Turno simultáneo de la IA ──
function startAISimultaneous(secs) {
  const q = state.questions[state.round];
  const aiDebuffs = state.pendingDebuffsForAI;
  const lvl = LEVELS[state.level];
  const rivalName = document.getElementById('ai-label').textContent || 'IA';

  const hasTrap    = aiDebuffs.some(d => d.id === 'trap');
  const hasPenalty = aiDebuffs.some(d => d.id === 'penalty');
  const hasDouble  = aiDebuffs.some(d => d.id === 'double');
  const hasTime    = aiDebuffs.some(d => d.id === 'time');
  // Nuevos debuffs
  const hasUnstable = aiDebuffs.some(d => d.id === 'unstable' || d.id === 'unstable_rare' || d.id === 'unstable_epic');
  const hasFogMind  = aiDebuffs.some(d => d.id === 'fogmind'  || d.id === 'fogmind_rare'  || d.id === 'fogmind_epic');

  const baseAcc   = hasFogMind ? lvl.trapAcc : (hasTrap ? lvl.trapAcc : lvl.acc);
  const aiCorrect = Math.random() < baseAcc;
  // Tiempo Inestable: common=12s, rare=9s, epic=6s cap
  let aiSecs = secs;
  if (hasUnstable) {
    const cap = aiDebuffs.some(d => d.id === 'unstable_epic') ? 6
              : aiDebuffs.some(d => d.id === 'unstable_rare') ? 9 : 12;
    aiSecs = Math.min(cap, secs);
  } else if (hasTime) {
    aiSecs = Math.min(8, secs);
  }
  const thinkMs   = Math.min(Math.random() * 3500 + 1200, aiSecs * 1000 - 400);

  // Panel en vivo → ui.js
  showAILiveThinking(rivalName);

  state._aiSimTimeout = setTimeout(() => {
    state.aiAnswered = true;
    state.aiResult = { correct: aiCorrect, hasPenalty, hasDouble };
    showAILiveResult(rivalName, aiCorrect);
    if (state.answered) resolveSimultaneous();
  }, thinkMs);
}

function resolveSimultaneous() {
  if (!state.aiResult) return;
  const { correct: aiCorrect, hasPenalty, hasDouble } = state.aiResult;
  state.pendingDebuffsForAI = [];

  if (aiCorrect) {
    state.aiScore += hasDouble ? 2 : 1;
  } else {
    if (hasPenalty) state.aiScore = Math.max(0, state.aiScore - 1);
    if (hasDouble)  state.aiScore = Math.max(0, state.aiScore - 1);
  }
  updateScores();

  setTimeout(() => {
    hideAILivePanel(); // → ui.js

    const playerWon = state._playerWonBox;
    state._playerWonBox = false;

    if (playerWon && aiCorrect) {
      // Ambos aciertan: primero caja del jugador, luego caja del rival al continuar
      state._pendingRivalBox = true;
      showBox(true);
    } else if (playerWon) {
      state._pendingRivalBox = false;
      showBox(true);
    } else if (aiCorrect) {
      state._pendingRivalBox = false;
      showBox(false);
    } else {
      state._pendingRivalBox = false;
      advanceRound();
    }
  }, 1200);
}

function doAITurn() {
  showScreen('screen-ai');
  const q        = state.questions[state.round];
  const aiDebuffs = state.pendingDebuffsForAI;
  const lvl       = LEVELS[state.level];
  const rivalName = document.getElementById('ai-label').textContent || 'IA';

  // Renderizado visual de la pantalla IA → ui.js
  renderAITurnScreen(q, aiDebuffs, rivalName, state.round);

  const hasTrap    = aiDebuffs.some(d => d.id === 'trap');
  const hasPenalty = aiDebuffs.some(d => d.id === 'penalty');
  const hasDouble  = aiDebuffs.some(d => d.id === 'double');
  const hasTime    = aiDebuffs.some(d => d.id === 'time');

  const baseAcc   = hasTrap ? lvl.trapAcc : lvl.acc;
  const aiCorrect = Math.random() < baseAcc;
  const secs      = hasTime ? 8 : 20;
  const thinkMs   = Math.min(Math.random() * 3500 + 1200, secs * 1000 - 400);

  startTimer('ai-timer-bar', secs, false, () => resolveAI(false, hasPenalty, hasDouble));
  setTimeout(() => { clearInterval(timerInterval); resolveAI(aiCorrect, hasPenalty, hasDouble); }, thinkMs);
}

function resolveAI(correct, hasPenalty, hasDouble) {
  clearInterval(timerInterval);
  state.pendingDebuffsForAI = [];
  const rivalName = document.getElementById('ai-label').textContent || 'IA';

  if (correct) {
    state.aiScore += hasDouble ? 2 : 1;
    updateScores();
    renderAIResult(true, rivalName);   // → ui.js
    setTimeout(() => showBox(false), 700);
  } else {
    if (hasPenalty) state.aiScore = Math.max(0, state.aiScore - 1);
    if (hasDouble)  state.aiScore = Math.max(0, state.aiScore - 1);
    updateScores();
    renderAIResult(false, rivalName);  // → ui.js
  }
}

function advanceRound() {
  if (onlineMode) {
    onlineAdvanceRound();
    return;
  }
  if (state._aiSimTimeout) { clearTimeout(state._aiSimTimeout); state._aiSimTimeout = null; }
  state.aiAnswered = false;
  state.aiResult = null;
  state._playerWonBox = false;
  state.round++;
  if (state.round >= 10) {
    showResult();
  } else {
    showScreen('screen-player');
  window.loadPlayerQuestion();
  }
}

/* renderInventory → definida en ui.js */

function showResult() {
  showScreen('screen-result');
  const p = state.playerScore, a = state.aiScore;
  const myName    = document.getElementById('final-player-label').textContent || 'Tú';
  const rivalName = document.getElementById('final-ai-label').textContent || 'Rival';

  // Renderizado visual de resultado → ui.js
  renderResultScreen(p, a, state.totalBoxes, onlineMode, myName, rivalName);

  if (onlineMode) cleanupRoom();

  // Record game stats for missions
  setTimeout(() => {
    if (typeof recordGameResult === 'function') {
      const won = p > a;
      const lvl = state.level || 'facil';
      const isOnline = onlineMode;
      let xpKey;
      if (isOnline) { xpKey = won ? 'win_online' : 'lose_online'; }
      else if (won) {
        xpKey = lvl === 'crack' ? 'win_vs_ai_crack' : lvl === 'listo' ? 'win_vs_ai_hard' : lvl === 'mediano' ? 'win_vs_ai_medium' : 'win_vs_ai_easy';
      } else { xpKey = 'lose_vs_ai'; }
      const xpGained = (typeof XP_REWARDS !== 'undefined' ? XP_REWARDS[xpKey] : 0) || 10;
      const xpSumEl = document.getElementById('xp-summary');
      if (xpSumEl) xpSumEl.textContent = `+${xpGained} XP ganados ⭐`;

      recordGameResult({
        won,
        correctAnswers: p,
        boxesOpened: state.totalBoxes || 0,
        isOnline,
        currentStreak: p,
        isCrackMode: !isOnline && lvl === 'crack',
        isLightning: false,
        isCategoryMode: !isOnline && state.categoryMode && !state.categoryMode.startsWith('special_') && state.categoryMode !== 'all',
        isSpecialMode: !isOnline && state.categoryMode && state.categoryMode.startsWith('special_'),
      });
    }
  }, 100);
}

function resetGame() {
  clearInterval(timerInterval);
  selectedLevel = null;
  onlineMode = false;
  lightningMode = false;
  myRole = null;
  roomCode = null;
  roomRef = null;
  roomListener = null;
  myPlayerKey = null;
  rivalPlayerKey = null;
  onlineState = null;
  document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
  document.getElementById('start-btn').style.display = 'none';
  showScreen('screen-mode');
}

/* confirmQuitGame, cancelQuitGame → definidas en ui.js */

function confirmQuit() {
  var modal = document.getElementById('quit-modal');
  if (modal) { modal.style.display = 'none'; }
  // Si estamos en modo agente, resetear el estado de ZXON/KRYOX
  if (typeof window._zxonAgentActive !== 'undefined' && window._zxonAgentActive) {
    window._zxonAgentActive = false;
    if (typeof deactivateZxonScoreboard === 'function') deactivateZxonScoreboard();
    // Volver a la pantalla de selección de agentes
    if (typeof goBackFromAgents === 'function') {
      clearInterval(timerInterval);
      selectedLevel = null;
      onlineMode = false;
      lightningMode = false;
      document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
      document.getElementById('start-btn').style.display = 'none';
      goBackFromAgents();
      return;
    }
  }
  // Resetear estado de LYRA-5
  if (typeof window._lyraAgentActive !== 'undefined' && window._lyraAgentActive) {
    window._lyraAgentActive = false;
    var lyraToast = document.getElementById('lyra-double-toast');
    if (lyraToast) lyraToast.remove();
    if (typeof goBackFromAgents === 'function') {
      clearInterval(timerInterval);
      selectedLevel = null;
      onlineMode = false;
      lightningMode = false;
      document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
      document.getElementById('start-btn').style.display = 'none';
      goBackFromAgents();
      return;
    }
  }
  resetGame();
}

function playAgain() {
  clearInterval(timerInterval);
  const wasOnline    = onlineMode;
  const wasLightning = lightningMode || (state && state._wasLightning);
  const lastLevel    = state && (state.level || selectedLevel);
  const lastCatMode  = state && state.categoryMode || null;

  if (wasOnline) cleanupRoom();

  myRole = null; roomCode = null; roomRef = null; roomListener = null;
  myPlayerKey = null; rivalPlayerKey = null; onlineState = null;
  onlineMode = false; lightningMode = false;

  if (wasOnline) {
    showScreen('screen-lobby');
    return;
  }

  if (wasLightning) {
    showScreen('screen-lightning-start');
    return;
  }

  if (lastLevel) {
    selectedLevel = lastLevel;
    document.querySelectorAll('.btn-level').forEach(b => b.classList.remove('selected'));
    const lvlBtn = document.getElementById('lvl-' + lastLevel);
    if (lvlBtn) lvlBtn.classList.add('selected');

    if (lastCatMode && typeof startGameWithCategory === 'function') {
      startGameWithCategory(lastCatMode);
    } else {
      startGame();
    }
  } else {
    showScreen('screen-mode');
  }
}

/* ═══════════════════════════════════════════════════
   ONLINE MULTIPLAYER
═══════════════════════════════════════════════════ */

/* setLobbyErr → definida en ui.js */

async function createRoom() {
  if (!window._fbReady) { setLobbyErr('Conectando con el servidor...'); return; }
  const name = getPlayerName();
  const { db, ref, set, serverTimestamp } = fb();

  roomCode = generateCode();
  roomRef = ref(db, 'rooms/' + roomCode);
  myRole = 'host';
  myPlayerKey = 'player1';
  rivalPlayerKey = 'player2';

  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);

  await set(roomRef, {
    status: 'waiting',
    createdAt: Date.now(),
    questions: shuffled,
    player1: { name, score: 0, ready: false },
    player2: null,
    round: 0,
    turn: 'player1',         // whose turn it is
    phase: 'player_question', // player_question | box | rival_question | rival_box | result
    debuffsForP1: [],
    debuffsForP2: [],
    totalBoxes: 0,
  });

  document.getElementById('display-room-code').textContent = roomCode;
  showScreen('screen-waiting');
  listenRoom();
}

async function joinRoom() {
  if (!window._fbReady) { setLobbyErr('Conectando con el servidor...'); return; }
  const code = (document.getElementById('join-code-input').value || '').trim().toUpperCase();
  if (code.length < 6) { setLobbyErr('Introduce el código completo (6 caracteres)'); return; }
  const name = getPlayerName();
  const { db, ref, get, update } = fb();
  setLobbyErr('Buscando sala...');

  const snap = await get(ref(db, 'rooms/' + code));
  if (!snap.exists()) { setLobbyErr('Sala no encontrada. ¿Es correcto el código?'); return; }
  const data = snap.val();
  if (data.status !== 'waiting') { setLobbyErr('La sala ya está en juego o ha terminado'); return; }
  if (data.player2) { setLobbyErr('La sala ya está llena'); return; }

  roomCode = code;
  roomRef = ref(db, 'rooms/' + roomCode);
  myRole = 'guest';
  myPlayerKey = 'player2';
  rivalPlayerKey = 'player1';

  await update(roomRef, {
    'player2': { name, score: 0, ready: false },
    status: 'ready',
  });

  setLobbyErr('');
  // Load questions from host
  state.questions = Object.values(data.questions);
  listenRoom();
}

function listenRoom() {
  if (roomListener) return;
  const { onValue } = fb();
  roomListener = onValue(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();
    onlineState = data;
    handleRoomUpdate(data);
  });
}

function handleRoomUpdate(data) {
  // ── Room starts ──
  if (data.status === 'ready' && myRole === 'host') {
    // Both players present — start the game
    if (data.player1 && data.player2 && !data._started) {
      startOnlineGame(data);
    }
  }

  if (data.status === 'playing') {
    syncOnlineState(data);
  }

  if (data.status === 'finished') {
    showOnlineResult(data);
  }
}

async function startOnlineGame(data) {
  const { update } = fb();
  // Host initializes game
  const shuffled = data.questions ? Object.values(data.questions) : [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  state = {
    questions: shuffled,
    round: 0,
    playerScore: 0,
    aiScore: 0, // rival score
    pendingDebuffsForAI: [],
    pendingDebuffsForPlayer: [],
    totalBoxes: 0,
    answered: false,
  };

  await update(roomRef, {
    status: 'playing',
    _started: true,
    round: 0,
    turn: 'player1',
    phase: 'player1_question',
    debuffsForP1: [],
    debuffsForP2: [],
    totalBoxes: 0,
    'player1/score': 0,
    'player2/score': 0,
    'player1/answered': false,
    'player2/answered': false,
  });
}

function syncOnlineState(data) {
  if (!data.player1 || !data.player2) return;
  const myData    = data[myPlayerKey];
  const rivalData = data[rivalPlayerKey];

  const p1Name = data.player1.name || 'Jugador 1';
  const p2Name = data.player2.name || 'Jugador 2';
  const myName    = myRole === 'host' ? p1Name : p2Name;
  const rivalName = myRole === 'host' ? p2Name : p1Name;

  setLabels(myName, rivalName);

  // Sync scores
  state.playerScore = myData.score || 0;
  state.aiScore     = rivalData.score || 0;
  state.round       = data.round || 0;
  state.totalBoxes  = data.totalBoxes || 0;

  const myDebuffs    = (data['debuffsFor' + cap(myPlayerKey)] || []).filter(Boolean);
  const rivalDebuffs = (data['debuffsFor' + cap(rivalPlayerKey)] || []).filter(Boolean);
  state.pendingDebuffsForPlayer = myDebuffs;
  state.pendingDebuffsForAI     = rivalDebuffs;

  const phase = data.phase || '';
  const questions = data.questions ? Object.values(data.questions) : state.questions;
  state.questions = questions;

  updateScores();

  const isMyTurn    = data.turn === myPlayerKey;
  const isRivalTurn = data.turn === rivalPlayerKey;

  // Phase routing
  if (phase === myPlayerKey + '_question') {
    if (isMyTurn) {
      if (document.getElementById('screen-player').classList.contains('active') && state.answered) return;
      showScreen('screen-player');
      if (!state.answered) window.loadPlayerQuestion();
    }
  } else if (phase === rivalPlayerKey + '_question') {
    if (isRivalTurn) {
      showOnlineRivalTurn(data, rivalName);
    }
  } else if (phase === myPlayerKey + '_box') {
    // I won a box — show it
    if (document.getElementById('screen-box').classList.contains('active')) return;
    showBoxOnline(true, rivalDebuffs, rivalName);
  } else if (phase === rivalPlayerKey + '_box') {
    // Rival won a box
    if (document.getElementById('screen-box').classList.contains('active')) return;
    showBoxOnline(false, myDebuffs, rivalName);
  } else if (phase === 'result') {
    showOnlineResult(data);
  }
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Called after player answers in online mode
async function onlinePlayerAnswer(isCorrect, hasPenalty, hasDouble) {
  const { update } = fb();
  let newScore = state.playerScore;
  if (isCorrect) {
    newScore += hasDouble ? 2 : 1;
  } else {
    if (hasPenalty) newScore = Math.max(0, newScore - 1);
    if (hasDouble)  newScore = Math.max(0, newScore - 1);
  }

  const updates = {
    [`${myPlayerKey}/score`]: newScore,
    [`${myPlayerKey}/answered`]: true,
    [`${myPlayerKey}/lastCorrect`]: isCorrect,
  };

  if (isCorrect) {
    // Give rival debuffs
    const boxes = getBoxes();
    state.totalBoxes += boxes.length;
    updates.totalBoxes = state.totalBoxes;
    updates['debuffsFor' + cap(rivalPlayerKey)] = boxes;
    updates.phase = myPlayerKey + '_box';
  } else {
    // Rival's turn
    updates.phase = rivalPlayerKey + '_question';
    updates.turn  = rivalPlayerKey;
  }

  state.playerScore = newScore;
  updateScores();
  await update(roomRef, updates);
}

async function onlineRivalTurnStart(boxes) {
  // Host/guest presses continue after box reveal
  const { update } = fb();
  await update(roomRef, {
    phase: rivalPlayerKey + '_question',
    turn: rivalPlayerKey,
  });
}

function showBoxOnline(iWon, debuffs, rivalName) {
  const validDebuffs = (debuffs || []).filter(d => d && d.id);
  const content = document.getElementById('box-reveal-content');
  const btn = document.getElementById('box-continue-btn');

  if (iWon) {
    content.innerHTML = `
      <span class="box-emoji">${validDebuffs.length ? validDebuffs.map(b => b.icon).join('') : '📦'}</span>
      <h3 style="margin-bottom:8px">¡Caja ganada!</h3>
      <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${capitalizeFirst(rivalName)} sufrirá estas desventajas:</p>
      <div>${validDebuffs.map(b => `<span class="badge ${b.color}">${b.icon} ${b.name}: ${b.desc}</span>`).join('') || '<span style="color:var(--muted);font-size:13px">Sin desventajas</span>'}</div>
    `;
    btn.textContent = 'Turno del rival →';
    btn.onclick = () => onlineRivalTurnStart(validDebuffs);
  } else {
    content.innerHTML = `
      <span class="box-emoji">${validDebuffs.length ? validDebuffs.map(b => b.icon).join('') : '📦'}</span>
      <h3 style="margin-bottom:8px">${capitalizeFirst(rivalName)} ganó una caja</h3>
      <p style="color:var(--muted);font-size:14px;margin-bottom:14px">Sufrirás estas desventajas:</p>
      <div>${validDebuffs.map(b => `<span class="badge ${b.color}">${b.icon} ${b.name}: ${b.desc}</span>`).join('') || '<span style="color:var(--muted);font-size:13px">Sin desventajas</span>'}</div>
    `;
    btn.textContent = 'Mi turno →';
    btn.onclick = () => onlineAdvanceRound();
  }
  updateScores();
  showScreen('screen-box');
}

function showOnlineRivalTurn(data, rivalName) {
  /* Control visual delegado a ui.js */
  window.showOnlineRivalTurn(data, rivalName);
}

function watchRivalAnswer(rivalName) {
  // The onValue listener will call syncOnlineState which handles phase changes.
  // We just watch for the rival's answered flag via the existing listener.
  // We poll onlineState for changes on rival's answered flag:
  let prevPhase = onlineState ? onlineState.phase : null;
  const checkInterval = setInterval(() => {
    if (!onlineState) return;
    const newPhase = onlineState.phase;
    if (newPhase !== prevPhase) {
      clearInterval(checkInterval);
      // The onValue listener will route correctly.
    }
    // If rival answered (phase changed to box or next player question)
    if (onlineState[rivalPlayerKey] && onlineState[rivalPlayerKey].answered) {
      const isCorrect = onlineState[rivalPlayerKey].lastCorrect;
      clearInterval(checkInterval);
      clearInterval(timerInterval);
      resolveOnlineRival(isCorrect, rivalName);
    }
  }, 400);
}

function resolveOnlineRival(correct, rivalName) {
  /* Control visual delegado a ui.js */
  window.resolveOnlineRival(correct, rivalName);
}

async function onlineAdvanceRound() {
  const { update } = fb();
  const nextRound = state.round + 1;

  if (nextRound >= 10) {
    await update(roomRef, {
      phase: 'result',
      status: 'finished',
    });
    return;
  }

  await update(roomRef, {
    round: nextRound,
    phase: 'player1_question',
    turn: 'player1',
    debuffsForPlayer1: [],
    debuffsForPlayer2: [],
    'player1/answered': false,
    'player2/answered': false,
    'player1/lastCorrect': null,
    'player2/lastCorrect': null,
  });
  // For non-host, state will update via listener
  if (myRole === 'host') {
    state.round = nextRound;
    state.pendingDebuffsForPlayer = [];
    state.pendingDebuffsForAI = [];
    state.answered = false;
    showScreen('screen-player');
  window.loadPlayerQuestion();
  }
}

function showOnlineResult(data) {
  if (!data.player1 || !data.player2) return;
  const myScore    = (data[myPlayerKey] || {}).score || 0;
  const rivalScore = (data[rivalPlayerKey] || {}).score || 0;
  state.playerScore = myScore;
  state.aiScore     = rivalScore;
  state.totalBoxes  = data.totalBoxes || 0;
  updateScores();
  showResult();
}

function leaveRoom() {
  cleanupRoom();
  showScreen('screen-mode');
}

function cleanupRoom() {
  clearInterval(timerInterval);
  if (roomListener && roomRef) {
    const { off } = fb();
    try { off(roomRef); } catch(e) {}
  }
  roomListener = null;
  // Don't delete the room — let it expire naturally
}

/* ─── Wait for Firebase before enabling online buttons ─── */
document.addEventListener('fbReady', () => {
  // Firebase is ready — nothing extra needed, buttons already work
});

// Expose gameplay functions to global scope
// Nota: showScreen, confirmQuitGame, cancelQuitGame, copyCode → en ui.js
window.startTimer           = startTimer;
window.startAISimultaneous  = startAISimultaneous;
window.chooseMode = chooseMode;
window.selectLevel = selectLevel;
window.startGame = startGame;
window.advanceRound = advanceRound;
window.resetGame = resetGame;
window.playAgain = playAgain;
window.playerAnswer = playerAnswer;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.confirmQuit = confirmQuit;
window.goBackFromAgents = goBackFromAgents;
window.startAgentBattle = startAgentBattle;

/* ══════════════════════════════════════════════════════
   LYRA-5 — PROTOCOLO DOBLE OLA
   Planeta Aquafor IV: mente en dos frecuencias simultáneas.
   Dificultad FÁCIL pero con dos intentos al mismo tiempo.
   Si la 1ª onda falla, la 2ª impacta automáticamente.
   Ambas se resuelven juntas, sin espera extra.
   ══════════════════════════════════════════════════════ */

window._lyraAgentActive = false;

function startLyraAgentBattle() {
  window._lyraAgentActive = true;
  window._zxonAgentActive = false;
  selectLevel('facil');
  startGame();
  setTimeout(function() {
    ['ai-label','box-ai-label','ai-turn-label','final-ai-label'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = 'LYRA-5';
    });
  }, 80);
}
window.startLyraAgentBattle = startLyraAgentBattle;

function _showLyraDoubleToast(msg) {
  var text = msg || '🌊 Protocolo Doble Ola activo — LYRA-5 dispara dos ondas';
  var existing = document.getElementById('lyra-double-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'lyra-double-toast';
  toast.className = 'lyra-double-toast';
  toast.innerHTML = '<span class="lyra-toast-icon">🌊</span><span>' + text + '</span>';
  document.body.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) {
      toast.style.transition = 'opacity .4s';
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 420);
    }
  }, 3800);
}
window._showLyraDoubleToast = _showLyraDoubleToast;

// Parchear startAISimultaneous para la mecánica Doble Ola
var _origStartAISimultaneous = window.startAISimultaneous;
window.startAISimultaneous = function(secs) {
  if (!window._lyraAgentActive) {
    return _origStartAISimultaneous(secs);
  }
  var q        = state.questions[state.round];
  var aiDebuffs = state.pendingDebuffsForAI;
  var hasTrap    = aiDebuffs.some(function(d){ return d.id === 'trap'; });
  var hasPenalty = aiDebuffs.some(function(d){ return d.id === 'penalty'; });
  var hasDouble  = aiDebuffs.some(function(d){ return d.id === 'double'; });
  var hasTime    = aiDebuffs.some(function(d){ return d.id === 'time'; });

  var acc1 = hasTrap ? 0.28 : 0.55;
  var acc2 = hasTrap ? 0.18 : 0.40;
  var wave1 = Math.random() < acc1;
  var wave2 = !wave1 && (Math.random() < acc2);
  var aiCorrect = wave1 || wave2;

  var aiSecs  = hasTime ? Math.min(8, secs) : secs;
  var thinkMs = Math.min(Math.random() * 2200 + 900, aiSecs * 1000 - 400);

  showAILiveThinking('LYRA-5');
  _showLyraDoubleToast('🌊 LYRA-5 lanza Onda 1 y Onda 2 simultáneamente…');

  state._aiSimTimeout = setTimeout(function() {
    state.aiAnswered = true;
    state.aiResult = { correct: aiCorrect, hasPenalty: hasPenalty, hasDouble: hasDouble };
    if (aiCorrect) {
      showAILiveResult('LYRA-5 (Onda ' + (wave1 ? '1ª' : '2ª') + ')', true);
    } else {
      showAILiveResult('LYRA-5', false);
    }
    if (state.answered) resolveSimultaneous();
  }, thinkMs);
};



/* ═══════════════════════════════════════════════════
   MODO RELÁMPAGO
═══════════════════════════════════════════════════ */

const LIGHTNING_SPEEDS = {};  // kept for compat, unused

let lState = {};
let lTimerInterval = null;
let lSelectedSpeed = null;  // unused, kept for compat
let lAITimeout = null;
let lBuzzTimeout = null;

/* ── Algoritmo dinámico de respuesta de la IA ──────────────────
   Factores que influyen en cuánto tarda la IA esta ronda:
   1. Dificultad de la pregunta (easy/med/hard)
   2. Estado de la partida: si va ganando o perdiendo
   3. Historial reciente: si acertó las últimas, se confia; si falló, duda
   4. Componente de "personalidad" aleatoria por ronda (lenta, normal, rápida, muy rápida)
   5. Micro-variación gaussiana para que nunca sea exactamente igual
   6. Ocasionalmente la IA "se bloquea" y no llega a responder
──────────────────────────────────────────────────────────────── */
function lComputeAIDelay(q, round, aiScore, playerScore, recentResults) {
  // Base según dificultad
  const diffBase = { easy: 2800, med: 3800, hard: 5200 }[q.diff] || 3500;

  // Personalidad aleatoria de esta ronda (sin patrón predecible)
  // Distribucion sesgada: más frecuente normal, raro muy rápida o muy lenta
  const roll = Math.random();
  let personality;
  if      (roll < 0.08) personality = 'ultrafast';   // 8%
  else if (roll < 0.28) personality = 'fast';        // 20%
  else if (roll < 0.65) personality = 'normal';      // 37%
  else if (roll < 0.88) personality = 'slow';        // 23%
  else                   personality = 'veryslow';   // 12%

  const personalityMult = {
    ultrafast: 0.25, fast: 0.55, normal: 1.0, slow: 1.6, veryslow: 2.4
  }[personality];

  // Factor de estado: IA confiada si va ganando, nerviosa si pierde mucho
  const diff = aiScore - playerScore;
  let stateMult = 1.0;
  if (diff >= 3)       stateMult = 0.80;  // va ganando, se lanza
  else if (diff >= 1)  stateMult = 0.92;
  else if (diff <= -3) stateMult = 1.25;  // va perdiendo, duda más
  else if (diff <= -1) stateMult = 1.10;

  // Factor histórico: racha de aciertos → más rápida; racha de fallos → más lenta
  const lastThree = (recentResults || []).slice(-3);
  const hits = lastThree.filter(r => r === 'hit').length;
  const historicMult = hits === 3 ? 0.75 : hits === 2 ? 0.88 : hits === 0 ? 1.35 : 1.0;

  // Micro-variación gaussiana (Box-Muller)
  const u1 = Math.random(), u2 = Math.random();
  const gauss = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
  const jitter = 1 + gauss * 0.18;  // ±18% de desviación típica

  let delay = diffBase * personalityMult * stateMult * historicMult * jitter;

  // Clamp entre 400ms y 9800ms (deja margen para que el jugador pueda ganar)
  delay = Math.max(400, Math.min(9800, delay));

  // Precisión de la IA también varía con personalidad y dificultad
  const baseAcc = { easy: 0.55, med: 0.65, hard: 0.48 }[q.diff] || 0.65;
  const accMod  = { ultrafast: -0.15, fast: -0.05, normal: 0, slow: +0.08, veryslow: +0.12 }[personality];
  const acc = Math.min(0.97, Math.max(0.15, baseAcc + accMod));

  // La IA "pasa" (no responde) si es muy lenta y ya casi no hay tiempo
  const willPass = personality === 'veryslow' && Math.random() < 0.30;

  return { delay, acc, personality, willPass };
}

function startLightningGame() {
  lightningMode = true;
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  lState = {
    questions: shuffled,
    round: 0,
    playerScore: 0,
    aiScore: 0,
    answered: false,
    totalRounds: 10,
    recentResults: [],   // 'hit' | 'miss' | 'pass' por ronda
  };
  showScreen('screen-lightning');
  loadLightningRound();
}

function loadLightningRound() {
  clearInterval(lTimerInterval);
  clearTimeout(lAITimeout);
  clearTimeout(lBuzzTimeout);

  const q = lState.questions[lState.round];
  lState.answered = false;

  // Update scoreboard
  document.getElementById('lscore-player').textContent = lState.playerScore;
  document.getElementById('lscore-ai').textContent = lState.aiScore;
  document.getElementById('l-round-num').textContent = lState.round + 1;
  document.getElementById('lbox-player').className = 'lightning-player-box';
  document.getElementById('lbox-ai').className = 'lightning-player-box';

  // Question meta
  const catMap = { geo:'🌍 Geografía', sci:'🔬 Ciencia', hist:'📜 Historia', art:'🎨 Arte & Cultura', sport:'⚽ Deporte', ent:'🎬 Entretenimiento', food:'🍕 Gastronomía', tech:'💻 Tecnología' };
  const diffMap = { easy:['Fácil','qdiff-easy'], med:['Medio','qdiff-med'], hard:['Difícil','qdiff-hard'] };
  const catLabel = catMap[q.cat] || '🎯 General';
  const [diffLabel, diffCls] = diffMap[q.diff] || ['Medio','qdiff-med'];
  const catCls = `qcat-${q.cat || 'geo'}`;

  const qEl = document.getElementById('l-question-text');
  if (qEl) {
    // Remove existing meta if present
    const existingMeta = document.getElementById('l-question-meta');
    if (existingMeta) existingMeta.remove();
    // Insert new meta before question text
    if (qEl.parentElement) {
      const metaDiv = document.createElement('div');
      metaDiv.id = 'l-question-meta';
      metaDiv.className = 'question-meta';
      metaDiv.innerHTML = `<span class="q-badge ${catCls}">${catLabel}</span><span class="q-badge ${diffCls}">⚡ ${diffLabel}</span>`;
      qEl.parentElement.insertBefore(metaDiv, qEl);
    }
    qEl.textContent = q.q;
  }

  // Render answers
  const container = document.getElementById('l-answers-container');
  container.innerHTML = '';
  q.a.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn-lightning-answer';
    btn.textContent = ans;
    btn.onclick = () => lPlayerBuzz(i, q.c);
    container.appendChild(btn);
  });

  // Hide status + next btn
  const statusEl = document.getElementById('l-status');
  statusEl.style.display = 'none';
  statusEl.textContent = '';
  statusEl.style.background = '';
  statusEl.style.color = '';
  document.getElementById('l-next-btn').style.display = 'none';

  // Start buzz timer (10 seconds)
  let left = 10;
  const roundSnapshot = lState.round;  // capture round number to detect stale timer
  const fill = document.getElementById('l-buzz-fill');
  fill.style.background = 'var(--amber)';
  fill.style.width = '100%';

  lTimerInterval = setInterval(() => {
    left -= 0.1;
    const pct = Math.max(0, (left / 10) * 100);
    fill.style.width = pct + '%';
    if (left <= 3) fill.style.background = 'var(--red)';
    if (left <= 0) {
      clearInterval(lTimerInterval);
      clearTimeout(lAITimeout);
      if (!lState.answered && lState.round === roundSnapshot) lResolveTimeout();
    }
  }, 100);

  // Compute AI response dynamically
  const { delay, acc, willPass } = lComputeAIDelay(
    q, lState.round, lState.aiScore, lState.playerScore, lState.recentResults
  );

  if (!willPass) {
    lAITimeout = setTimeout(() => {
      if (!lState.answered && lState.round === roundSnapshot) lAIBuzz(q.c, acc);
    }, delay);
  }
  // If willPass, the AI simply won't answer this round (timeout resolves it)

  // Sync global scoreboard bar
  if (typeof _updateScoreboardBar === 'function') _updateScoreboardBar();
}

function lPlayerBuzz(chosen, correct) {
  if (lState.answered) return;
  lState.answered = true;
  clearInterval(lTimerInterval);
  clearTimeout(lAITimeout);
  clearTimeout(lBuzzTimeout);

  // Highlight player box as buzzer
  document.getElementById('lbox-player').classList.add('buzzing');
  _lDisableAnswers();

  lBuzzTimeout = setTimeout(() => {
    const isCorrect = chosen === correct;
    _lShowAnswerColors(correct, chosen);

    if (isCorrect) {
      lState.playerScore++;
      lState.recentResults.push('hit');
      document.getElementById('lbox-player').classList.remove('buzzing');
      document.getElementById('lbox-player').classList.add('correct-flash');
      _lShowStatus('✅ ¡Respondiste primero y bien! +1 punto', 'var(--green-bg)', 'var(--green)');
    } else {
      lState.playerScore = Math.max(lState.playerScore - 1, -10);
      lState.recentResults.push('miss');
      document.getElementById('lbox-player').classList.remove('buzzing');
      document.getElementById('lbox-player').classList.add('wrong-flash');
      _lShowStatus('❌ Respondiste primero pero mal. -1 punto', 'var(--red-bg)', 'var(--red)');
    }

    document.getElementById('lscore-player').textContent = lState.playerScore;
    document.getElementById('lscore-ai').textContent = lState.aiScore;
    document.getElementById('l-next-btn').style.display = 'block';
    if (typeof _updateScoreboardBar === 'function') _updateScoreboardBar();
  }, 350);
}

function lAIBuzz(correct, acc) {
  if (lState.answered) return;
  lState.answered = true;
  clearInterval(lTimerInterval);
  clearTimeout(lBuzzTimeout);

  // Highlight AI box as buzzer
  document.getElementById('lbox-ai').classList.add('buzzing');
  _lDisableAnswers();

  lBuzzTimeout = setTimeout(() => {
    const aiCorrect = Math.random() < acc;
    const fakeChosen = aiCorrect ? correct : [0,1,2,3].filter(i => i !== correct)[Math.floor(Math.random()*3)];
    _lShowAnswerColors(correct, fakeChosen);

    if (aiCorrect) {
      lState.aiScore++;
      lState.recentResults.push('hit');
      document.getElementById('lbox-ai').classList.remove('buzzing');
      document.getElementById('lbox-ai').classList.add('correct-flash');
      _lShowStatus((window._lyraAgentActive ? '🌊 ¡LYRA-5 respondió primero y bien! +1 punto para ella' : window._zxonAgentActive ? '👾 ¡ZXON-7 respondió primero y bien! +1 punto para él' : '🤖 ¡La IA respondió primero y bien! +1 punto para ella'), 'var(--red-bg)', 'var(--red)');
    } else {
      lState.aiScore = Math.max(lState.aiScore - 1, -10);
      lState.recentResults.push('miss');
      document.getElementById('lbox-ai').classList.remove('buzzing');
      document.getElementById('lbox-ai').classList.add('wrong-flash');
      _lShowStatus((window._lyraAgentActive ? '🌊 LYRA-5 respondió primero pero falló. -1 punto para ella 😄' : window._zxonAgentActive ? '👾 ZXON-7 respondió primero pero falló. -1 punto para él 😄' : '🤖 La IA respondió primero pero falló. -1 punto para ella 😄'), 'var(--green-bg)', 'var(--green)');
    }

    document.getElementById('lscore-player').textContent = lState.playerScore;
    document.getElementById('lscore-ai').textContent = lState.aiScore;
    document.getElementById('l-next-btn').style.display = 'block';
    if (typeof _updateScoreboardBar === 'function') _updateScoreboardBar();
  }, 350);
}

function lResolveTimeout() {
  lState.answered = true;
  lState.recentResults.push('pass');
  _lDisableAnswers();
  const q = lState.questions[lState.round];
  _lShowAnswerColors(q.c, -1);
  _lShowStatus('⏱️ Tiempo agotado — nadie respondió. Sin puntos esta ronda.', 'var(--surface2)', 'var(--muted)');
  document.getElementById('l-next-btn').style.display = 'block';
}

function _lDisableAnswers() {
  document.querySelectorAll('#l-answers-container .btn-lightning-answer').forEach(b => b.disabled = true);
}

function _lShowAnswerColors(correct, chosen) {
  const btns = document.querySelectorAll('#l-answers-container .btn-lightning-answer');
  const q = lState.questions[lState.round];
  btns.forEach((b, i) => {
    if (i === correct) b.classList.add('btn-correct');
    else if (i === chosen) b.classList.add('btn-wrong');
  });
}

function _lShowStatus(msg, bg, color) {
  const el = document.getElementById('l-status');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = bg;
  el.style.color = color;
  el.style.border = `0.5px solid ${color}33`;
}

function lightningNextRound() {
  clearTimeout(lBuzzTimeout);
  lState.round++;
  if (lState.round >= lState.totalRounds) {
    showLightningResult();
  } else {
    loadLightningRound();
  }
}

function showLightningResult() {
  showScreen('screen-result');
  // Guardar modo antes de resetear para que playAgain pueda detectarlo
  if (!state) state = {};
  state._wasLightning = true;
  lightningMode = false;
  const p = lState.playerScore, a = lState.aiScore;
  const crown = document.getElementById('result-crown');
  const title = document.getElementById('result-title');
  const sub   = document.getElementById('result-subtitle');

  // Reuse result screen
  document.getElementById('final-player-score').textContent = p;
  document.getElementById('final-ai-score').textContent = a;
  document.getElementById('final-player-label').textContent = 'Tú';
  // Si estamos en modo ZXON-7/LYRA-5, usar su nombre; si no, IA ⚡
  var _lRivalName = window._lyraAgentActive ? 'LYRA-5 ⚡' : (typeof window._zxonAgentActive !== 'undefined' && window._zxonAgentActive) ? 'ZXON-7 ⚡' : 'IA ⚡';
  document.getElementById('final-ai-label').textContent = _lRivalName;

  if (p > a) {
    crown.textContent = '🏆';
    title.textContent = '¡Has ganado!';
    sub.textContent   = `Superaste a ${_lRivalName.replace(' ⚡','')} por ${p - a} punto${p - a !== 1 ? 's' : ''} en Modo Relámpago.`;
  } else if (a > p) {
    crown.textContent = '⚡';
    title.textContent = `¡${_lRivalName.replace(' ⚡','')} fue más rápida!`;
    sub.textContent   = `${_lRivalName.replace(' ⚡','')} te superó por ${a - p} punto${a - p !== 1 ? 's' : ''}. ¡Entrena los reflejos!`;
  } else {
    crown.textContent = '🤝';
    title.textContent = '¡Empate relámpago!';
    sub.textContent   = 'Ambos igualados. ¡Revancha!';
  }
  document.getElementById('boxes-summary').textContent = `Modo Relámpago — ${lState.totalRounds} rondas`;
  document.getElementById('xp-summary').textContent = '';

  // Record stats
  setTimeout(() => {
    if (typeof recordGameResult === 'function') {
      const won = p > a;
      recordGameResult({
        won,
        correctAnswers: Math.max(0, p),
        boxesOpened: 0,
        isOnline: false,
        currentStreak: Math.max(0, p),
        isCrackMode: false,
        isLightning: true,
      });
    }
  }, 100);
}

window.startLightningGame   = startLightningGame;
window.lightningNextRound   = lightningNextRound;



/* flashScreen, spawnScoreParticle, popScoreNum, spawnConfetti → definidas en ui.js */
/* El parche de setGameActive (ocultar top-tab-bar) → gestionado en ui.js */


/* ═══════════════════════════════════════════════════
   CATEGORY GAME MODE
═══════════════════════════════════════════════════ */
const CAT_META = {
  geo:   { icon:'🌍', name:'Geografía',       color:'var(--teal)' },
  sci:   { icon:'🔬', name:'Ciencia',          color:'#60a5fa' },
  hist:  { icon:'📜', name:'Historia',         color:'var(--amber)' },
  art:   { icon:'🎨', name:'Arte & Cultura',   color:'var(--red)' },
  sport: { icon:'⚽', name:'Deporte',          color:'var(--purple)' },
  ent:   { icon:'🎬', name:'Entretenimiento',  color:'#e879f9' },
  food:  { icon:'🍕', name:'Gastronomía',      color:'var(--green)' },
  tech:  { icon:'💻', name:'Tecnología',       color:'#818cf8' },
};

let selectedCategory = null;
let selectedCatLevel  = null;

function initCatCounts() {
  Object.keys(CAT_META).forEach(cat => {
    const count = QUESTIONS.filter(q => q.cat === cat).length;
    const el = document.getElementById('catcount-' + cat);
    if (el) el.textContent = count + ' preguntas';
    // Dim if fewer than 5
    const card = document.getElementById('catcard-' + cat);
    if (card && count < 5) card.style.opacity = '0.45';
  });
}

function selectCategory(cat) {
  selectedCategory = cat;
  // Visual feedback
  document.querySelectorAll('.cat-pick-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('catcard-' + cat);
  if (card) card.classList.add('selected');
  // Show next button
  document.getElementById('catpick-next-btn').style.display = 'block';
  // Update catstart screen
  const meta = CAT_META[cat];
  if (meta) {
    const icon  = document.getElementById('catstart-icon');
    const title = document.getElementById('catstart-title');
    const desc  = document.getElementById('catstart-desc');
    if (icon)  icon.textContent  = meta.icon;
    if (title) title.textContent = meta.name;
    if (desc)  desc.textContent  = 'Enfréntate a la IA con preguntas solo de ' + meta.name;
  }
}

function selectCatLevel(lvl) {
  selectedCatLevel = lvl;
  document.querySelectorAll('[id^="catlvl-"]').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById('catlvl-' + lvl);
  if (btn) btn.classList.add('selected');
  document.getElementById('catstart-btn').style.display = 'block';
}

function startCategoryGame() {
  if (!selectedCategory || !selectedCatLevel) return;
  onlineMode = false;
  lightningMode = false;
  selectedLevel = selectedCatLevel;
  // Filter questions by category
  const catQ = QUESTIONS.filter(q => q.cat === selectedCategory);
  const shuffled = [...catQ].sort(() => Math.random() - 0.5).slice(0, Math.min(10, catQ.length));
  // Pad with random questions if not enough
  if (shuffled.length < 10) {
    const others = QUESTIONS.filter(q => q.cat !== selectedCategory)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10 - shuffled.length);
    shuffled.push(...others);
    shuffled.sort(() => Math.random() - 0.5);
  }
  state = {
    questions: shuffled,
    round: 0,
    playerScore: 0,
    aiScore: 0,
    pendingDebuffsForAI: [],
    pendingDebuffsForPlayer: [],
    totalBoxes: 0,
    answered: false,
    level: selectedCatLevel,
    categoryMode: selectedCategory,
  };
  setLabels();
  showScreen('screen-player');
  window.loadPlayerQuestion();
}

window.selectCategory  = selectCategory;
window.selectCatLevel  = selectCatLevel;
window.startCategoryGame = startCategoryGame;
window.initCatCounts   = initCatCounts;

/* ═══════════════════════════════════════════════════
   CATPICK TABS (Temática / Especial)
═══════════════════════════════════════════════════ */
function switchCatTab(tab) {
  document.querySelectorAll('.catpick-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.catpick-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  // Reset selections when switching tabs
  if (tab === 'tematica') {
    selectedSpecialCat = null;
    document.getElementById('specialpick-next-btn').style.display = 'none';
  } else {
    selectedCategory = null;
    document.getElementById('catpick-next-btn').style.display = 'none';
    document.querySelectorAll('.cat-pick-card').forEach(c => c.classList.remove('selected'));
  }
}
window.switchCatTab = switchCatTab;

/* ═══════════════════════════════════════════════════
   SPECIAL CATEGORY GAME MODE
═══════════════════════════════════════════════════ */
/* SPECIAL_CAT_META y SPECIAL_QUESTIONS — definidos en questions.js (se carga antes que este script) */


let selectedSpecialCat   = null;
let selectedSpecialLevel = null;

function selectSpecialCat(cat) {
  selectedSpecialCat = cat;
  document.querySelectorAll('.special-cat-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('scard-' + cat);
  if (card) card.classList.add('selected');
  document.getElementById('specialpick-next-btn').style.display = 'block';

  // Prepare specialstart screen
  const meta = SPECIAL_CAT_META[cat];
  if (meta) {
    const icon  = document.getElementById('specialstart-icon');
    const title = document.getElementById('specialstart-title');
    const desc  = document.getElementById('specialstart-desc');
    if (icon)  icon.textContent  = meta.icon;
    if (title) title.textContent = meta.name;
    if (desc)  desc.textContent  = meta.desc;
  }
}

function selectSpecialLevel(lvl) {
  selectedSpecialLevel = lvl;
  document.querySelectorAll('[id^="splvl-"]').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById('splvl-' + lvl);
  if (btn) btn.classList.add('selected');
  document.getElementById('specialstart-btn').style.display = 'block';
}

function startSpecialGame() {
  if (!selectedSpecialCat || !selectedSpecialLevel) return;
  const questions = SPECIAL_QUESTIONS[selectedSpecialCat];
  if (!questions) return;

  // Convert special questions to the game's question format
  // Game uses: q.q (text), q.a (array of option strings), q.c (correct index), q.exp, q.cat, q.diff
  const converted = questions.map((sq, i) => ({
    q: sq.q,
    a: sq.opts,      // array of option strings
    c: sq.a,         // correct index
    exp: sq.exp,
    cat: 'special_' + selectedSpecialCat,
    diff: selectedSpecialLevel === 'crack' ? 'hard' : selectedSpecialLevel === 'listo' ? 'med' : 'easy',
    specialMode: selectedSpecialCat,
  }));

  // Shuffle
  const shuffled = [...converted].sort(() => Math.random() - 0.5);

  onlineMode = false;
  lightningMode = false;
  selectedLevel = selectedSpecialLevel;

  // For velocidad mode: inject a special timer multiplier flag
  const isVelocidad = selectedSpecialCat === 'velocidad';

  state = {
    questions: shuffled,
    round: 0,
    playerScore: 0,
    aiScore: 0,
    pendingDebuffsForAI: [],
    pendingDebuffsForPlayer: [],
    totalBoxes: 0,
    answered: false,
    level: selectedSpecialLevel,
    categoryMode: 'special_' + selectedSpecialCat,
    specialMode: selectedSpecialCat,
    timerMultiplier: isVelocidad ? 0.35 : 1, // 35% of normal time for velocidad
  };
  setLabels();
  showScreen('screen-player');
  window.loadPlayerQuestion();
}

window.selectSpecialCat   = selectSpecialCat;
window.selectSpecialLevel = selectSpecialLevel;
window.startSpecialGame   = startSpecialGame;
window.switchCatTab       = switchCatTab;


