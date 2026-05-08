/**
 * gameState.js
 * Estado global centralizado de Trivia Sorpresa.
 *
 * CLAVES localStorage que gestiona este módulo:
 *   'trivia_coins'       → monedas del jugador
 *   'trivia_xp'          → XP total y nivel
 *   'trivia_stats'       → estadísticas acumuladas
 *   'trivia_daily'       → misiones diarias + progreso
 *   'trivia_weekly'      → misiones semanales + progreso
 *   'trivia_trophies'    → trofeos desbloqueados
 *   'trivia_store'       → avatares (owned / equipped)
 *   'trivia_backgrounds' → fondos  (owned / equipped)
 *   'trivia_robots'      → skins de robot (owned / equipped)
 *   'trivia_daily_box'   → estado de la caja diaria
 *   'bp_claimed_s1'      → nodos del Battle Pass reclamados
 *   'story_progress'     → progreso del modo historia
 *
 * CÓMO CONECTARLO AL RESTO DEL CÓDIGO:
 *   1. Añade en <head> (antes de cualquier otro <script>):
 *        <script src="gameState.js"></script>
 *   2. Reemplaza cada llamada directa a localStorage en index.html
 *      por las funciones de este módulo.  Por ejemplo:
 *
 *        ANTES  →  parseInt(localStorage.getItem('trivia_coins') || '0', 10)
 *        AHORA  →  GameState.coins.get()
 *
 *        ANTES  →  localStorage.setItem('trivia_coins', String(n))
 *        AHORA  →  GameState.coins.set(n)
 *
 *   3. Las funciones ya existentes en index.html (getCoins, setCoins,
 *      addCoins, getXPData, saveXPData, addXP, getStats, saveStats, …)
 *      pueden seguir funcionando sin cambios si los sustituyes por thin
 *      wrappers que deleguen en GameState, o puedes reemplazarlas
 *      completamente. Ejemplo de wrapper de compatibilidad:
 *
 *        function getCoins()        { return GameState.coins.get(); }
 *        function setCoins(n)       { GameState.coins.set(n); }
 *        function addCoins(amount)  { GameState.coins.add(amount); }
 *        function getXPData()       { return GameState.xp.get(); }
 *        function saveXPData(d)     { GameState.xp.save(d); }
 *        function getStats()        { return GameState.stats.get(); }
 *        function saveStats(s)      { GameState.stats.save(s); }
 *        function getDailyState()   { return GameState.missions.daily.get(); }
 *        function saveDailyState(o) { GameState.missions.daily.save(o); }
 *        function getWeeklyState()  { return GameState.missions.weekly.get(); }
 *        function saveWeeklyState(o){ GameState.missions.weekly.save(o); }
 *        function getStoreData()    { return GameState.inventory.avatars.get(); }
 *        function saveStoreData(d)  { GameState.inventory.avatars.save(d); }
 *        function getBgData()       { return GameState.inventory.backgrounds.get(); }
 *        function saveBgData(d)     { GameState.inventory.backgrounds.save(d); }
 *        function getRobotData()    { return GameState.inventory.robots.get(); }
 *        function saveRobotData(d)  { GameState.inventory.robots.save(d); }
 *        function getTrophyStorage(){ return GameState.trophies.get(); }
 *        function saveTrophyStorage(d){ GameState.trophies.save(d); }
 *        function getDailyBoxState(){ return GameState.dailyBox.get(); }
 *        function saveDailyBoxState(s){ GameState.dailyBox.save(s); }
 *        function getBPClaimed()    { return GameState.battlePass.getClaimed(); }
 *        function setBPClaimed(arr) { GameState.battlePass.setClaimed(arr); }
 *        function getStoryProgress(){ return GameState.story.get(); }
 *        function saveStoryProgress(p){ GameState.story.save(p); }
 */

const GameState = (() => {

  /* ─────────────────────────────────────────────
     Utilidades internas
  ───────────────────────────────────────────── */

  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function _write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }


  /* ─────────────────────────────────────────────
     MONEDAS
     Clave: 'trivia_coins'
     Valor: número entero
  ───────────────────────────────────────────── */
  const coins = {
    _KEY: 'trivia_coins',

    /** Devuelve el saldo actual de monedas (entero ≥ 0). */
    get() {
      return parseInt(localStorage.getItem(this._KEY) || '0', 10);
    },

    /** Establece el saldo exacto de monedas. */
    set(n) {
      localStorage.setItem(this._KEY, String(Math.max(0, n)));
    },

    /** Suma `amount` al saldo actual. */
    add(amount) {
      this.set(this.get() + amount);
    },
  };


  /* ─────────────────────────────────────────────
     XP Y NIVEL
     Clave: 'trivia_xp'
     Valor: { totalXP: number, level: number }
  ───────────────────────────────────────────── */
  const xp = {
    _KEY: 'trivia_xp',
    _DEFAULT: { totalXP: 0, level: 1 },

    /** Devuelve { totalXP, level }. */
    get() {
      return _read(this._KEY, this._DEFAULT);
    },

    /** Persiste el objeto { totalXP, level }. */
    save(data) {
      _write(this._KEY, data);
    },
  };


  /* ─────────────────────────────────────────────
     ESTADÍSTICAS ACUMULADAS
     Clave: 'trivia_stats'
     Valor: { games_played, wins, correct_total,
               boxes_opened, online_games, best_streak,
               current_streak, wins_crack, lightning_games,
               lightning_wins, category_games, special_games,
               online_wins, … }
  ───────────────────────────────────────────── */
  const stats = {
    _KEY: 'trivia_stats',

    /** Devuelve el objeto de estadísticas. */
    get() {
      return _read(this._KEY, {});
    },

    /** Persiste el objeto de estadísticas. */
    save(data) {
      _write(this._KEY, data);
    },
  };


  /* ─────────────────────────────────────────────
     MISIONES
  ───────────────────────────────────────────── */
  const missions = {

    /**
     * Misiones DIARIAS
     * Clave: 'trivia_daily'
     * Valor: { periodStart, missions[], progress{}, claimed[] }
     */
    daily: {
      _KEY: 'trivia_daily',

      get() {
        return _read(this._KEY, null);
      },

      save(obj) {
        _write(this._KEY, obj);
      },
    },

    /**
     * Misiones SEMANALES
     * Clave: 'trivia_weekly'
     * Valor: { periodStart, missions[], progress{}, claimed[] }
     */
    weekly: {
      _KEY: 'trivia_weekly',

      get() {
        return _read(this._KEY, null);
      },

      save(obj) {
        _write(this._KEY, obj);
      },
    },
  };


  /* ─────────────────────────────────────────────
     INVENTARIO (skins / avatares / fondos / robots)
  ───────────────────────────────────────────── */
  const inventory = {

    /**
     * Avatares de jugador
     * Clave: 'trivia_store'
     * Valor: { owned: string[], equipped: string }
     */
    avatars: {
      _KEY: 'trivia_store',
      _DEFAULT: { owned: ['default'], equipped: 'default' },

      get() {
        return _read(this._KEY, this._DEFAULT);
      },

      save(data) {
        _write(this._KEY, data);
      },

      isOwned(id) {
        return this.get().owned.includes(id);
      },

      getEquipped() {
        return this.get().equipped;
      },

      equip(id) {
        const d = this.get();
        d.equipped = id;
        this.save(d);
      },

      unlock(id) {
        const d = this.get();
        if (!d.owned.includes(id)) d.owned.push(id);
        this.save(d);
      },
    },

    /**
     * Fondos de pantalla
     * Clave: 'trivia_backgrounds'
     * Valor: { owned: string[], equipped: string }
     */
    backgrounds: {
      _KEY: 'trivia_backgrounds',
      _DEFAULT: { owned: ['default'], equipped: 'default' },

      get() {
        return _read(this._KEY, this._DEFAULT);
      },

      save(data) {
        _write(this._KEY, data);
      },

      isOwned(id) {
        return this.get().owned.includes(id);
      },

      getEquipped() {
        return this.get().equipped;
      },

      equip(id) {
        const d = this.get();
        d.equipped = id;
        this.save(d);
      },

      unlock(id) {
        const d = this.get();
        if (!d.owned.includes(id)) d.owned.push(id);
        this.save(d);
      },
    },

    /**
     * Skins de robot (IA rival)
     * Clave: 'trivia_robots'
     * Valor: { owned: string[], equipped: string }
     */
    robots: {
      _KEY: 'trivia_robots',
      _DEFAULT: { owned: ['default'], equipped: 'default' },

      get() {
        return _read(this._KEY, this._DEFAULT);
      },

      save(data) {
        _write(this._KEY, data);
      },

      isOwned(id) {
        return this.get().owned.includes(id);
      },

      getEquipped() {
        return this.get().equipped;
      },

      equip(id) {
        const d = this.get();
        d.equipped = id;
        this.save(d);
      },

      unlock(id) {
        const d = this.get();
        if (!d.owned.includes(id)) d.owned.push(id);
        this.save(d);
      },
    },
  };


  /* ─────────────────────────────────────────────
     TROFEOS
     Clave: 'trivia_trophies'
     Valor: { unlocked: { [trophyId]: timestamp } }
  ───────────────────────────────────────────── */
  const trophies = {
    _KEY: 'trivia_trophies',
    _DEFAULT: { unlocked: {} },

    get() {
      return _read(this._KEY, this._DEFAULT);
    },

    save(data) {
      _write(this._KEY, data);
    },

    isUnlocked(id) {
      return !!this.get().unlocked[id];
    },

    unlock(id) {
      const d = this.get();
      if (!d.unlocked[id]) {
        d.unlocked[id] = Date.now();
        this.save(d);
      }
    },
  };


  /* ─────────────────────────────────────────────
     CAJA DIARIA
     Clave: 'trivia_daily_box'
     Valor: { lastOpened: timestamp, … }
  ───────────────────────────────────────────── */
  const dailyBox = {
    _KEY: 'trivia_daily_box',

    get() {
      return _read(this._KEY, {});
    },

    save(data) {
      _write(this._KEY, data);
    },
  };


  /* ─────────────────────────────────────────────
     BATTLE PASS (Season 1)
     Clave: 'bp_claimed_s1'
     Valor: string[]  (ids de nodos reclamados)
  ───────────────────────────────────────────── */
  const battlePass = {
    _KEY: 'bp_claimed_s1',

    getClaimed() {
      return _read(this._KEY, []);
    },

    setClaimed(arr) {
      _write(this._KEY, arr);
    },

    claim(nodeId) {
      const claimed = this.getClaimed();
      if (!claimed.includes(nodeId)) {
        claimed.push(nodeId);
        this.setClaimed(claimed);
      }
    },

    isClaimed(nodeId) {
      return this.getClaimed().includes(nodeId);
    },
  };


  /* ─────────────────────────────────────────────
     MODO HISTORIA
     Clave: 'story_progress'
     Valor: { [chapterId]: { completed: bool, stars: number, … } }
  ───────────────────────────────────────────── */
  const story = {
    _KEY: 'story_progress',

    get() {
      return _read(this._KEY, {});
    },

    save(data) {
      _write(this._KEY, data);
    },

    getChapter(chapterId) {
      return this.get()[chapterId] || null;
    },

    saveChapter(chapterId, chapterData) {
      const p = this.get();
      p[chapterId] = { ...(p[chapterId] || {}), ...chapterData };
      this.save(p);
    },
  };


  /* ─────────────────────────────────────────────
     API PÚBLICA
  ───────────────────────────────────────────── */
  return {
    coins,
    xp,
    stats,
    missions,
    inventory,
    trophies,
    dailyBox,
    battlePass,
    story,
  };

})();

// Expose globally so shop.js and any other <script> can access it
window.GameState = GameState;
