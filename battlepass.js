/**
 * battlepass.js — Pase Estelar de Trivia Sorpresa
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistema de Battle Pass independiente: 30 niveles, XP acumulativa, recompensas
 * conectadas al inventario existente (monedas, avatares, fondos, cosmetics).
 *
 * DEPENDENCIAS (deben cargarse ANTES que este archivo):
 *   • gameState.js        → GameState (monedas, XP, inventario)
 *   • Los wrappers de compatibilidad del index.html:
 *       getXPData(), addXP(), addCoins(), getStoreData(), saveStoreData(),
 *       getBgData(), saveBgData(), showXPToast()
 *   • (Opcionales) AVATARS[], BACKGROUNDS[] para sincronizar ítems al reclamar
 *
 * USO DESDE HTML:
 *   <script src="gameState.js"></script>
 *   <script src="battlepass.js"></script>
 *   <!-- después, en el mismo HTML o en otro <script>: -->
 *   BattlePass.render();
 *   BattlePass.claimLevel(5);
 *   BattlePass.claimAll();
 *
 * CÓMO OTORGAR XP AL BATTLE PASS:
 *   BattlePass.addXP(50);          // suma 50 XP (usa el pool de XP del juego)
 *   // O, si ya usas addXP() en tu código de partidas, el Battle Pass
 *   // recoge el nivel directamente de GameState.xp — no hace falta nada más.
 *
 * COMPATIBILIDAD CON index.html ACTUAL:
 *   Las funciones window.getBPLevel, window.getBPClaimed y window.bpClaimLevel
 *   se exponen al scope global para que todo el código HTML existente funcione
 *   sin cambios. Si ya tienes esas funciones en un bloque <script> dentro del
 *   HTML, comenta/elimina ese bloque e importa este archivo en su lugar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BattlePass = (() => {

  /* ═══════════════════════════════════════════════════════════════
     CONSTANTES
  ═══════════════════════════════════════════════════════════════ */

  const BP_MAX_LEVEL = 30;

  /**
   * Tabla de recompensas por nivel.
   *
   * Tipos soportados:
   *   'coins'    → se suman con addCoins()
   *   'xp'       → se suman con addXP()
   *   'avatar'   → desbloquea en GameState.inventory.avatars / AVATARS[]
   *   'bg'       → desbloquea en GameState.inventory.backgrounds / BACKGROUNDS[]
   *   'cosmetic' → placeholder cosmético (marco, efecto, etc.)
   *   'special'  → recompensa única (nivel 30)
   *   'soon'     → pendiente, no reclamable
   */
  const BP_REWARDS = [
    // ── TIER 1 · Inicio (1-5) ──────────────────────────────────
    { level: 1,  icon: '🪙', name: '50 Monedas',          desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 50 },
    { level: 2,  icon: '🌠', name: 'Avatar: Estrella',    desc: 'Muestra tu brillo cósmico',                        type: 'avatar',   typeTag: 'bpnc-type-avatar',   value: 'star_avatar' },
    { level: 3,  icon: '🪙', name: '75 Monedas',          desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 75 },
    { level: 4,  icon: '🌌', name: 'Fondo: Nebulosa',     desc: 'Fondo de pantalla exclusivo',                      type: 'bg',       typeTag: 'bpnc-type-bg',       value: 'nebula_bg' },
    { level: 5,  icon: '⭐', name: '+50 XP Bonus',        desc: 'Experiencia extra instantánea',                    type: 'xp',       typeTag: 'bpnc-type-xp',       value: 50 },

    // ── TIER 2 · Explorador (6-12) ─────────────────────────────
    { level: 6,  icon: '🪙', name: '100 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 100 },
    { level: 7,  icon: '🚀', name: 'Avatar: Astronauta',  desc: 'El explorador del cosmos',                         type: 'avatar',   typeTag: 'bpnc-type-avatar',   value: 'astronaut_avatar' },
    { level: 8,  icon: '🎨', name: 'Marco: Galaxia',      desc: 'Marco de perfil galáctico',                        type: 'cosmetic', typeTag: 'bpnc-type-cosmetic', value: 'galaxy_frame' },
    { level: 9,  icon: '🪙', name: '125 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 125 },
    { level: 10, icon: '💫', name: 'Fondo: Cosmos Azul',  desc: 'Fondo exclusivo de explorador',                    type: 'bg',       typeTag: 'bpnc-type-bg',       value: 'blue_cosmos_bg' },
    { level: 11, icon: '⭐', name: '+75 XP Bonus',        desc: 'Experiencia extra instantánea',                    type: 'xp',       typeTag: 'bpnc-type-xp',       value: 75 },
    { level: 12, icon: '🪙', name: '150 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 150 },

    // ── TIER 3 · Veterano (13-20) ──────────────────────────────
    { level: 13, icon: '🪐', name: 'Avatar: Saturno',     desc: 'El señor de los anillos',                          type: 'avatar',   typeTag: 'bpnc-type-avatar',   value: 'saturn_avatar' },
    { level: 14, icon: '🎨', name: 'Efecto: Destello',    desc: 'Efecto visual en respuestas',                      type: 'cosmetic', typeTag: 'bpnc-type-cosmetic', value: 'flash_effect' },
    { level: 15, icon: '🪙', name: '200 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 200 },
    { level: 16, icon: '🌑', name: 'Fondo: Luna Roja',    desc: 'Fondo lunar exclusivo',                            type: 'bg',       typeTag: 'bpnc-type-bg',       value: 'red_moon_bg' },
    { level: 17, icon: '⭐', name: '+100 XP Bonus',       desc: 'Experiencia extra instantánea',                    type: 'xp',       typeTag: 'bpnc-type-xp',       value: 100 },
    { level: 18, icon: '🪙', name: '225 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 225 },
    { level: 19, icon: '☄️', name: 'Avatar: Cometa',      desc: 'Velocidad y poder cósmico',                        type: 'avatar',   typeTag: 'bpnc-type-avatar',   value: 'comet_avatar' },
    { level: 20, icon: '✨', name: 'Personalizable',      desc: 'Próximamente — ¡algo especial!',                   type: 'soon',     typeTag: 'bpnc-type-soon',     value: null },

    // ── TIER 4 · Élite (21-29) ─────────────────────────────────
    { level: 21, icon: '🪙', name: '275 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 275 },
    { level: 22, icon: '🌀', name: 'Fondo: Agujero Neg.', desc: 'El vacío más profundo',                            type: 'bg',       typeTag: 'bpnc-type-bg',       value: 'black_hole_bg' },
    { level: 23, icon: '⭐', name: '+150 XP Bonus',       desc: 'Experiencia extra instantánea',                    type: 'xp',       typeTag: 'bpnc-type-xp',       value: 150 },
    { level: 24, icon: '🪙', name: '300 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 300 },
    { level: 25, icon: '👾', name: 'Avatar: Alienígena',  desc: 'Ser de otra dimensión',                            type: 'avatar',   typeTag: 'bpnc-type-avatar',   value: 'alien_avatar' },
    { level: 26, icon: '🎨', name: 'Personalizable',      desc: 'Próximamente — algo increíble',                    type: 'soon',     typeTag: 'bpnc-type-soon',     value: null },
    { level: 27, icon: '🪙', name: '350 Monedas',         desc: 'Crédito estelar para la tienda',                   type: 'coins',    typeTag: 'bpnc-type-coins',    value: 350 },
    { level: 28, icon: '🌟', name: 'Fondo: Supernova',    desc: 'La explosión más brillante',                       type: 'bg',       typeTag: 'bpnc-type-bg',       value: 'supernova_bg' },
    { level: 29, icon: '⭐', name: '+200 XP Bonus',       desc: 'Experiencia extra instantánea',                    type: 'xp',       typeTag: 'bpnc-type-xp',       value: 200 },

    // ── MAX LEVEL · Leyenda (30) ───────────────────────────────
    { level: 30, icon: '👑', name: 'LEYENDA CÓSMICA',     desc: 'Avatar único del nivel máximo — el honor supremo del Pase Estelar', type: 'special', typeTag: 'bpnc-type-special', value: 'legend_avatar' },
  ];

  /**
   * Etiquetas de sección para separadores visuales en la ruta.
   * La clave es el level ANTERIOR al primer nodo del tier.
   */
  const SECTION_LABELS = {
    5:  'EXPLORADOR',
    12: 'VETERANO',
    20: 'ÉLITE',
    29: 'LEYENDA',
  };


  /* ═══════════════════════════════════════════════════════════════
     HELPERS INTERNOS — adaptadores seguros para las funciones
     globales que pueden existir o no en el scope del HTML.
  ═══════════════════════════════════════════════════════════════ */

  /** Devuelve { totalXP, level } usando GameState o el wrapper global. */
  function _getXPData() {
    if (typeof GameState !== 'undefined') return GameState.xp.get();
    if (typeof getXPData === 'function')  return getXPData();
    return { totalXP: 0, level: 1 };
  }

  /** Suma monedas usando el wrapper global o GameState directamente. */
  function _addCoins(amount) {
    if (typeof addCoins === 'function') { addCoins(amount); return; }
    if (typeof GameState !== 'undefined') GameState.coins.add(amount);
  }

  /** Suma XP usando el wrapper global (que a su vez llama a GameState). */
  function _addXP(amount, reason) {
    if (typeof addXP === 'function') addXP(amount, reason);
    // Si addXP no existe, sumamos directamente (sin animaciones)
    else if (typeof GameState !== 'undefined') {
      const d = GameState.xp.get();
      d.totalXP += amount;
      GameState.xp.save(d);
    }
  }

  /** Desbloquea un avatar en el inventario. */
  function _unlockAvatar(avatarId) {
    if (typeof GameState !== 'undefined') {
      GameState.inventory.avatars.unlock(avatarId);
    } else if (typeof getStoreData === 'function' && typeof saveStoreData === 'function') {
      const store = getStoreData();
      if (!store.owned.includes(avatarId)) {
        store.owned.push(avatarId);
        saveStoreData(store);
      }
    }
  }

  /** Desbloquea un fondo en el inventario. */
  function _unlockBackground(bgId) {
    if (typeof GameState !== 'undefined') {
      GameState.inventory.backgrounds.unlock(bgId);
    } else if (typeof getBgData === 'function' && typeof saveBgData === 'function') {
      const bgData = getBgData();
      if (!bgData.owned.includes(bgId)) {
        bgData.owned.push(bgId);
        saveBgData(bgData);
      }
    }
  }

  /** Muestra un toast usando la función global si existe. */
  function _toast(msg) {
    if (typeof showXPToast === 'function') showXPToast(msg);
  }

  /** Lee los claimed del sistema de guardado. */
  function _getClaimed() {
    if (typeof GameState !== 'undefined') return GameState.battlePass.getClaimed();
    if (typeof getBPClaimed === 'function') return getBPClaimed();
    return [];
  }

  /** Persiste el array de claimed. */
  function _setClaimed(arr) {
    if (typeof GameState !== 'undefined') GameState.battlePass.setClaimed(arr);
    if (typeof setBPClaimed === 'function') setBPClaimed(arr);
  }

  /**
   * Calcula cuántos XP hay en el nivel actual (XP sobrantes desde el inicio
   * del nivel) usando la función global si existe.
   */
  function _getXPForCurrentLevel(totalXP, level) {
    if (typeof getXPForCurrentLevel === 'function') return getXPForCurrentLevel(totalXP, level);
    // Fallback simple (lineal)
    const needed = _getXPNeededForNextLevel(level);
    return totalXP % needed;
  }

  /** XP necesarios para pasar al siguiente nivel. */
  function _getXPNeededForNextLevel(level) {
    if (typeof getXPNeededForNextLevel === 'function') return getXPNeededForNextLevel(level);
    // Curva progresiva de fallback: 100 + 50 por nivel
    return 100 + (level - 1) * 50;
  }


  /* ═══════════════════════════════════════════════════════════════
     API CORE
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Devuelve el nivel actual del Battle Pass (1-30).
   * Usa el mismo pool de XP que el juego: nivel del jugador, capped a 30.
   */
  function getLevel() {
    const xpData = _getXPData();
    return Math.min(xpData.level, BP_MAX_LEVEL);
  }

  /**
   * Devuelve el progreso de XP en el nivel actual del Battle Pass.
   * @returns {{ current: number, needed: number, pct: number }}
   */
  function getXPProgress() {
    const xpData = _getXPData();
    const lvl    = xpData.level;
    const bpLvl  = Math.min(lvl, BP_MAX_LEVEL);
    if (bpLvl >= BP_MAX_LEVEL) return { current: 1, needed: 1, pct: 100 };
    const current = _getXPForCurrentLevel(xpData.totalXP, lvl);
    const needed  = _getXPNeededForNextLevel(lvl);
    return {
      current,
      needed,
      pct: needed > 0 ? Math.round(current / needed * 100) : 0,
    };
  }

  /**
   * Añade XP al pool del juego (el BP recoge el nivel automáticamente).
   * @param {number} amount - XP a añadir
   * @param {string} [reason] - descripción para el toast
   */
  function addXP(amount, reason) {
    _addXP(amount, reason || 'Pase Estelar');
    // Actualizar UI si está visible
    _refreshUIIfVisible();
  }

  /**
   * Devuelve el array de niveles ya reclamados.
   * @returns {number[]}
   */
  function getClaimed() {
    return _getClaimed();
  }

  /**
   * Cuántas recompensas están disponibles para reclamar ahora mismo.
   * @returns {number}
   */
  function countClaimable() {
    const bpLevel = getLevel();
    const claimed = getClaimed();
    return BP_REWARDS.filter(
      r => r.level <= bpLevel && !claimed.includes(r.level) && r.type !== 'soon'
    ).length;
  }

  /**
   * Reclama la recompensa de un nivel concreto.
   * No hace nada si el jugador no ha llegado a ese nivel o ya lo reclamó.
   * @param {number} level - nivel a reclamar (1-30)
   */
  function claimLevel(level) {
    const bpLevel = getLevel();
    if (level > bpLevel) return;                         // nivel no alcanzado

    const claimed = getClaimed();
    if (claimed.includes(level)) return;                 // ya reclamado

    const reward = BP_REWARDS.find(r => r.level === level);
    if (!reward || reward.type === 'soon') return;       // no existe o pendiente

    // — Persistir —
    claimed.push(level);
    _setClaimed(claimed);

    // — Aplicar recompensa según tipo —
    switch (reward.type) {

      case 'coins':
        _addCoins(reward.value);
        _toast(`🪙 +${reward.value} monedas — Pase Estelar Nv.${level}`);
        break;

      case 'xp':
        _addXP(reward.value, `Pase Estelar Nv.${level}`);
        break;

      case 'avatar':
      case 'special': {
        // Intentar encontrar el avatar en el array global AVATARS (si existe)
        const avatarData = (typeof AVATARS !== 'undefined')
          ? AVATARS.find(a => a.bp && a.bpLevel === level)
          : null;

        if (avatarData) {
          _unlockAvatar(avatarData.id);
          const emoji = avatarData.emoji || reward.icon;
          _toast(reward.type === 'special'
            ? `👑 ¡${emoji} Avatar ${avatarData.name} desbloqueado!`
            : `🎉 ¡${emoji} Avatar ${avatarData.name} desbloqueado!`
          );
        } else {
          // Fallback: usar el value directamente como ID de avatar
          _unlockAvatar(reward.value);
          _toast(`🎉 ¡${reward.icon} ${reward.name} desbloqueado!`);
        }
        break;
      }

      case 'bg': {
        const bgData = (typeof BACKGROUNDS !== 'undefined')
          ? BACKGROUNDS.find(b => b.bp && b.bpLevel === level)
          : null;

        if (bgData) {
          _unlockBackground(bgData.id);
          _toast(`🎨 ¡Fondo ${bgData.name} desbloqueado!`);
        } else {
          _unlockBackground(reward.value);
          _toast(`🎨 ¡${reward.icon} ${reward.name} desbloqueado!`);
        }
        break;
      }

      case 'cosmetic':
        // Los cosméticos se registran en el futuro; por ahora notificamos al jugador
        _toast(`✨ ${reward.icon} ${reward.name} desbloqueado!`);
        break;
    }

    // — Efectos y actualización de UI —
    _spawnClaimParticles();
    render();
    updateNavBadge();

    // Refrescar pestaña de estilo si está abierta
    if (typeof renderStyleTab === 'function') renderStyleTab();
  }

  /**
   * Reclama de golpe todos los niveles disponibles.
   */
  function claimAll() {
    const bpLevel = getLevel();
    const claimed = getClaimed();
    let any = false;
    for (let lv = 1; lv <= bpLevel; lv++) {
      if (!claimed.includes(lv)) {
        claimLevel(lv);
        any = true;
      }
    }
    if (any) _spawnClaimParticles();
    render();
    updateNavBadge();
  }


  /* ═══════════════════════════════════════════════════════════════
     RENDER — construye y actualiza el DOM del Battle Pass
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Renderiza el header y la ruta de nodos completa.
   * Escribe en los elementos del DOM definidos en index.html:
   *   #bp-xp-bar-fill, #bp-xp-current, #bp-level-num, #bp-xp-next,
   *   #bp-claim-all-btn, #bp-path-container
   */
  function render() {
    const bpLevel = getLevel();
    const xpProg  = getXPProgress();
    const claimed = getClaimed();

    // ── Header ──
    const fillEl = document.getElementById('bp-xp-bar-fill');
    const curEl  = document.getElementById('bp-xp-current');
    const numEl  = document.getElementById('bp-level-num');
    const nxtEl  = document.getElementById('bp-xp-next');

    if (fillEl) fillEl.style.width = xpProg.pct + '%';
    if (curEl)  curEl.textContent  = xpProg.current + ' XP';
    if (numEl)  numEl.textContent  = bpLevel;
    if (nxtEl)  nxtEl.textContent  = bpLevel >= BP_MAX_LEVEL ? '¡MAX!' : xpProg.needed + ' XP';

    // ── Botón "Reclamar todo" ──
    const caBtn = document.getElementById('bp-claim-all-btn');
    if (caBtn) {
      const hasClaimable = BP_REWARDS.some(
        r => r.level <= bpLevel && !claimed.includes(r.level) && r.type !== 'soon'
      );
      caBtn.style.display = hasClaimable ? '' : 'none';
    }

    // ── Ruta de nodos (camino estelar) ──
    const container = document.getElementById('bp-path-container');
    if (!container) return;

    // The cosmic spine line + the animated energy traveller
    let html = '<div class="bp-path-line"></div>';

    // Nodes alternate sides: even idx → right, odd idx → left
    // (visual zigzag around the central spine)
    let nodeIdx = 0; // counts only actual node rows (excludes dividers)

    BP_REWARDS.forEach((reward, idx) => {
      // ── Section divider ──
      if (SECTION_LABELS[reward.level - 1] && reward.level > 1) {
        html += `
          <div class="bp-section-divider" style="animation-delay:${idx * 0.03}s">
            <div class="bp-section-divider-line"></div>
            <div class="bp-section-divider-label">${SECTION_LABELS[reward.level - 1]}</div>
            <div class="bp-section-divider-line"></div>
          </div>`;
      }

      // ── State flags (unchanged logic) ──
      const isUnlocked  = bpLevel >= reward.level;
      const isClaimed   = claimed.includes(reward.level);
      const isClaimable = isUnlocked && !isClaimed && reward.type !== 'soon';
      const isMax       = reward.level === BP_MAX_LEVEL;

      // Circle state class
      let circleClass = 'bpn-locked';
      if      (isMax && isClaimed)  circleClass = 'bpn-claimed';
      else if (isMax && isUnlocked) circleClass = 'bpn-max';
      else if (isClaimed)           circleClass = 'bpn-claimed';
      else if (isClaimable)         circleClass = 'bpn-claimable';
      else if (isUnlocked)          circleClass = 'bpn-unlocked';

      // Card state class
      let cardClass = 'bp-node-card';
      if (isClaimable) cardClass += ' bpnc-claimable';
      if (isClaimed)   cardClass += ' bpnc-claimed';
      if (isMax)       cardClass += ' bpnc-max';

      // Side alternation for the zigzag cosmic road
      const side      = (nodeIdx % 2 === 0) ? 'bp-node--right' : 'bp-node--left';
      const ringHtml  = isClaimable ? '<div class="bp-node-ring"></div>' : '';
      const circleContent = isClaimed
        ? '✓'
        : (isMax && isUnlocked ? '👑' : reward.level);

      const actionHtml = isClaimable
        ? `<button class="bpnc-claim-btn" onclick="BattlePass.claimLevel(${reward.level})">⚡ RECLAMAR RECOMPENSA</button>`
        : isClaimed
        ? `<div class="bpnc-claimed-tag">✓ RECLAMADO</div>`
        : !isUnlocked
        ? `<div class="bpnc-claimed-tag" style="color:rgba(255,255,255,0.12)">🔒 NIVEL ${reward.level} REQUERIDO</div>`
        : '';

      html += `
        <div class="bp-node ${side}" style="animation-delay:${idx * 0.045}s">
          <div class="${cardClass}">
            <div class="bpnc-top">
              <div class="bpnc-level-badge">NIVEL ${reward.level}</div>
              <span class="bpnc-type-tag ${reward.typeTag}">${reward.type.toUpperCase()}</span>
            </div>
            <div class="bpnc-reward-row">
              <div class="bpnc-reward-icon">${reward.icon}</div>
              <div>
                <div class="bpnc-reward-name">${reward.name}</div>
                <div class="bpnc-reward-desc">${reward.desc}</div>
              </div>
            </div>
            ${actionHtml}
          </div>
          <div class="bp-node-arm"></div>
          <div class="bp-node-orb">
            ${ringHtml}
            <div class="bp-node-circle ${circleClass}">${circleContent}</div>
          </div>
          <div class="bp-node-arm"></div>
        </div>`;

      nodeIdx++;
    });

    container.innerHTML = html;

    // Canvas del header
    _renderHeaderCanvas();
  }

  /**
   * Actualiza el badge de notificación en la nav (misiones).
   * Busca el elemento #bp-nav-badge del HTML existente.
   */
  function updateNavBadge() {
    const badge = document.getElementById('bp-nav-badge');
    if (!badge) return;
    const available = countClaimable();
    badge.style.display = available > 0 ? '' : 'none';
    badge.textContent   = available > 0 ? available : '';
  }


  /* ═══════════════════════════════════════════════════════════════
     EFECTOS VISUALES
  ═══════════════════════════════════════════════════════════════ */

  /** Partículas de reclamación (20 puntos de colores). */
  function _spawnClaimParticles() {
    const colors = ['#a78bfa', '#4ade80', '#fbbf24', '#60a5fa', '#e879f9'];
    for (let i = 0; i < 20; i++) {
      const p     = document.createElement('div');
      const angle = (i / 20) * Math.PI * 2;
      const dist  = 60 + Math.random() * 80;
      p.style.cssText = `
        position:fixed; left:50%; top:50%;
        width:8px; height:8px; border-radius:50%;
        background:${colors[i % colors.length]};
        box-shadow:0 0 8px ${colors[i % colors.length]};
        pointer-events:none; z-index:9999;
        --tx:${Math.cos(angle) * dist}px;
        --ty:${Math.sin(angle) * dist - 40}px;
        animation:particleFly 0.8s ease-out forwards;
        animation-delay:${Math.random() * 0.15}s;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  }

  /** Dibuja el canvas de nebulosa en el header del Battle Pass. */
  function _renderHeaderCanvas() {
    const canvas = document.getElementById('bp-header-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  || 400;
    canvas.height = canvas.offsetHeight || 190;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Deep space background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#07031a');
    bg.addColorStop(0.5, '#050216');
    bg.addColorStop(1,   '#020110');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Nebula clouds — layered radial gradients
    const nebulae = [
      [W * 0.82, H * 0.25, 110, '#5b21b6', 0.22],
      [W * 0.18, H * 0.75, 90,  '#1d4ed8', 0.18],
      [W * 0.55, H * 0.45, 140, '#7c3aed', 0.12],
      [W * 0.35, H * 0.20, 70,  '#0ea5e9', 0.10],
      [W * 0.70, H * 0.80, 80,  '#a21caf', 0.10],
    ];
    nebulae.forEach(([x, y, r, c, a]) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0,   c + Math.floor(a * 255).toString(16).padStart(2, '0'));
      g.addColorStop(0.5, c + Math.floor(a * 0.5 * 255).toString(16).padStart(2, '0'));
      g.addColorStop(1,   'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    // Stars — three size tiers for depth
    const starGroups = [
      { count: 120, maxR: 0.7,  minAlpha: 0.15, maxAlpha: 0.5  },
      { count: 50,  maxR: 1.2,  minAlpha: 0.4,  maxAlpha: 0.75 },
      { count: 15,  maxR: 1.8,  minAlpha: 0.7,  maxAlpha: 1.0  },
    ];
    starGroups.forEach(({ count, maxR, minAlpha, maxAlpha }) => {
      for (let i = 0; i < count; i++) {
        const r = Math.random() * maxR + 0.2;
        const a = minAlpha + Math.random() * (maxAlpha - minAlpha);
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.fill();
        // Cross-sparkle on bright stars
        if (maxR > 1.5 && Math.random() > 0.4) {
          const sx = Math.random() * W, sy = Math.random() * H;
          ctx.strokeStyle = `rgba(255,255,255,${(a * 0.4).toFixed(2)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(sx - r*3, sy); ctx.lineTo(sx + r*3, sy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, sy - r*3); ctx.lineTo(sx, sy + r*3); ctx.stroke();
        }
      }
    });
  }


  /* ═══════════════════════════════════════════════════════════════
     HELPERS PRIVADOS
  ═══════════════════════════════════════════════════════════════ */

  /** Re-renderiza sólo si la sub-sección del Battle Pass está visible. */
  function _refreshUIIfVisible() {
    const sub = document.getElementById('msnsub-battlepass');
    if (sub && sub.style.display !== 'none') render();
    updateNavBadge();
  }


  /* ═══════════════════════════════════════════════════════════════
     INICIALIZACIÓN
  ═══════════════════════════════════════════════════════════════ */

  /** Inicializa el badge al cargar la página. */
  function init() {
    setTimeout(updateNavBadge, 500);
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  /* ═══════════════════════════════════════════════════════════════
     API PÚBLICA
  ═══════════════════════════════════════════════════════════════ */
  return {
    /** Nivel actual del Battle Pass (1-30). */
    getLevel,
    /** Progreso de XP en el nivel actual: { current, needed, pct }. */
    getXPProgress,
    /** Array de niveles ya reclamados. */
    getClaimed,
    /** Número de recompensas disponibles para reclamar. */
    countClaimable,
    /**
     * Suma XP al pool del juego y actualiza el BP.
     * Úsalo desde el código de partidas/misiones:
     *   BattlePass.addXP(50, 'Victoria online');
     */
    addXP,
    /** Reclama la recompensa de un nivel concreto. */
    claimLevel,
    /** Reclama todos los niveles disponibles de una vez. */
    claimAll,
    /** Renderiza el header + ruta de nodos en el DOM. */
    render,
    /** Actualiza el badge de notificación en la nav. */
    updateNavBadge,
    /**
     * Tabla de recompensas completa (sólo lectura).
     * Útil para otros módulos que necesiten iterar las recompensas.
     */
    get rewards() { return BP_REWARDS; },
    /** Número máximo de niveles. */
    MAX_LEVEL: BP_MAX_LEVEL,
  };

})();

/* ─────────────────────────────────────────────────────────────────────────────
   COMPATIBILIDAD GLOBAL
   Las funciones que el HTML existente llama directamente (onclick="...",
   o referencias en otros bloques <script>) se exponen en window para que
   no se rompa nada al migrar.
───────────────────────────────────────────────────────────────────────────── */
window.BattlePass     = BattlePass;

// Aliases directos (compatibles con código pre-existente en index.html)
window.getBPLevel     = () => BattlePass.getLevel();
window.getBPClaimed   = () => BattlePass.getClaimed();
window.bpClaimLevel   = (level) => BattlePass.claimLevel(level);
window.bpClaimAll     = () => BattlePass.claimAll();
window.renderBattlePass = () => BattlePass.render();
window.updateBPNavBadge = () => BattlePass.updateNavBadge();
