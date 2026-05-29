/**
 * data.js — Capa de datos
 * Responsabilidad: CRUD de juegos contra Supabase (primario)
 * con localStorage como fallback offline.
 *
 * API pública (toda escritura es async):
 *   init()             → Promise<void>   carga juegos al iniciar
 *   getGames()         → Array           lectura desde caché en memoria
 *   addGame(game)      → Promise<void>
 *   updateGame(game)   → Promise<void>
 *   deleteGame(id)     → Promise<void>
 *   ADMIN_PASS         → string
 */

'use strict';

window.App = window.App || {};

App.Data = (function () {

  /* ── Configuración ──────────────────────────────── */

  var ADMIN_PASS = 'pocopan2024';
  var LS_KEY     = 'ppj_games_v4';

  /* ── Estado interno ─────────────────────────────── */

  var _cache  = null;   // juegos en memoria
  var _db     = null;   // cliente Supabase (null si no está configurado)

  /* ── Datos de ejemplo (se usan si la tabla está vacía) ── */

  var DEFAULTS = [
    {
      id: 'catan', name: 'Catan',
      description: 'Construí carreteras, asentamientos y ciudades en la isla de Catan. Comerciá recursos con otros jugadores y expandí tu civilización.',
      minPlayers: 3, maxPlayers: 4, minAge: 10,
      pace: 'slow', youtubeURL: 'https://www.youtube.com/watch?v=FaiDRMPVVgo', thumbnail: ''
    },
    {
      id: 'uno', name: 'Uno',
      description: 'El clásico juego de cartas donde debés deshacerte de todas las cartas antes que los demás. ¡No olvides gritar UNO!',
      minPlayers: 2, maxPlayers: 10, minAge: 7,
      pace: 'fast', youtubeURL: 'https://www.youtube.com/watch?v=JbAnxGKt8Xk', thumbnail: ''
    },
    {
      id: 'dobble', name: 'Dobble',
      description: 'Velocidad y concentración: encontrá el símbolo común entre dos cartas antes que los demás. Perfecto para todas las edades.',
      minPlayers: 2, maxPlayers: 8, minAge: 5,
      pace: 'fast', youtubeURL: 'https://www.youtube.com/watch?v=p-oBajkS6kc', thumbnail: ''
    },
    {
      id: 'pandemic', name: 'Pandemia',
      description: 'Trabajá en equipo para detener cuatro enfermedades mortales. Un juego cooperativo épico donde todos ganan o todos pierden.',
      minPlayers: 2, maxPlayers: 4, minAge: 10,
      pace: 'slow', youtubeURL: 'https://www.youtube.com/watch?v=kjXdFbM6v9w', thumbnail: ''
    },
    {
      id: 'dixit', name: 'Dixit',
      description: 'Usá tu imaginación para describir cartas con ilustraciones surrealistas. Creatividad, deducción y diversión para toda la familia.',
      minPlayers: 3, maxPlayers: 6, minAge: 7,
      pace: 'slow', youtubeURL: 'https://www.youtube.com/watch?v=5P-rD6DvKnM', thumbnail: ''
    }
  ];

  /* ── Mapeo DB (snake_case) ↔ JS (camelCase) ─────── */

  function _fromDB(row) {
    return {
      id:          row.id,
      name:        row.name        || '',
      description: row.description || '',
      minPlayers:  row.min_players,
      maxPlayers:  row.max_players,
      minAge:      row.min_age,
      pace:        row.pace        || 'slow',
      youtubeURL:  row.youtube_url || '',
      thumbnail:   row.thumbnail   || ''
    };
  }

  function _toDB(game) {
    return {
      id:          game.id,
      name:        game.name        || '',
      description: game.description || '',
      min_players: game.minPlayers,
      max_players: game.maxPlayers,
      min_age:     game.minAge,
      pace:        game.pace        || 'slow',
      youtube_url: game.youtubeURL  || '',
      thumbnail:   game.thumbnail   || ''
    };
  }

  /* ── Inicialización del cliente Supabase ─────────── */

  function _initClient() {
    var cfg = window.App && window.App.Config;
    if (!cfg || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('TU_PROYECTO')) {
      return false;
    }
    try {
      _db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
      return true;
    } catch (e) {
      console.error('[App.Data] Error al crear cliente Supabase:', e);
      return false;
    }
  }

  /* ── init ───────────────────────────────────────── */

  /**
   * Carga los juegos desde Supabase al iniciar la app.
   * Si Supabase no está configurado o falla, usa localStorage.
   * Si la tabla está vacía, siembra los datos de ejemplo.
   * @returns {Promise<void>}
   */
  function init() {
    if (!_initClient()) {
      console.warn('[App.Data] Supabase no configurado — usando localStorage');
      _cache = _lsRead();
      return Promise.resolve();
    }

    return _db
      .from('games')
      .select('*')
      .order('created_at', { ascending: true })
      .then(function (res) {
        if (res.error) throw res.error;

        _cache = res.data.map(_fromDB);
        console.info('[App.Data] ' + _cache.length + ' juego(s) cargado(s) desde Supabase');

        // Sembrar datos de ejemplo si la tabla está vacía
        if (_cache.length === 0) {
          console.info('[App.Data] Tabla vacía — sembrando datos de ejemplo');
          return _seedDefaults();
        }
      })
      .catch(function (err) {
        console.error('[App.Data] Fallo Supabase, usando localStorage:', err);
        _cache = _lsRead();
      });
  }

  function _seedDefaults() {
    var rows = DEFAULTS.map(_toDB);
    return _db
      .from('games')
      .insert(rows)
      .select()
      .then(function (res) {
        if (res.error) throw res.error;
        _cache = res.data.map(_fromDB);
      });
  }

  /* ── Lectura (síncrona desde caché) ─────────────── */

  function getGames() {
    return _cache || [];
  }

  var VALID_AGES_PUB = [3, 5, 7, 10, 15];

  /**
   * Devuelve true si el juego tiene todos los datos mínimos para
   * mostrarse a los clientes: nombre, URL de YouTube válida,
   * jugadores y edad correctos, ritmo definido.
   * @param {Object} game
   * @returns {boolean}
   */
  function isPublishable(game) {
    if (!game.name || !game.name.trim()) return false;
    if (!game.youtubeURL) return false;
    var yt = game.youtubeURL.toLowerCase();
    if (!yt.includes('youtube.com/') && !yt.includes('youtu.be/')) return false;
    if (!game.minPlayers || !game.maxPlayers) return false;
    if (game.minPlayers > game.maxPlayers) return false;
    if (VALID_AGES_PUB.indexOf(game.minAge) === -1) return false;
    if (game.pace !== 'slow' && game.pace !== 'fast') return false;
    return true;
  }

  /**
   * Devuelve solo los juegos listos para mostrarse a los clientes.
   * @returns {Array}
   */
  function getPublishableGames() {
    return (_cache || []).filter(isPublishable);
  }

  /* ── Escritura (async) ───────────────────────────── */

  /**
   * Inserta un nuevo juego.
   * @param {Object} game
   * @returns {Promise<void>}
   */
  function addGame(game) {
    if (_db) {
      return _db
        .from('games')
        .insert(_toDB(game))
        .select()
        .then(function (res) {
          if (res.error) throw res.error;
          _cache.push(_fromDB(res.data[0]));
        });
    }
    _cache.push(game);
    _lsWrite(_cache);
    return Promise.resolve();
  }

  /**
   * Actualiza un juego existente.
   * @param {Object} game
   * @returns {Promise<void>}
   */
  function updateGame(game) {
    if (_db) {
      return _db
        .from('games')
        .update(_toDB(game))
        .eq('id', game.id)
        .select()
        .then(function (res) {
          if (res.error) throw res.error;
          var idx = _cache.findIndex(function (g) { return g.id === game.id; });
          if (idx !== -1) _cache[idx] = _fromDB(res.data[0]);
        });
    }
    var i = _cache.findIndex(function (g) { return g.id === game.id; });
    if (i !== -1) _cache[i] = game;
    _lsWrite(_cache);
    return Promise.resolve();
  }

  /**
   * Elimina un juego por ID.
   * @param {string} id
   * @returns {Promise<void>}
   */
  function deleteGame(id) {
    if (_db) {
      return _db
        .from('games')
        .delete()
        .eq('id', id)
        .then(function (res) {
          if (res.error) throw res.error;
          _cache = _cache.filter(function (g) { return g.id !== id; });
        });
    }
    _cache = _cache.filter(function (g) { return g.id !== id; });
    _lsWrite(_cache);
    return Promise.resolve();
  }

  /**
   * Elimina TODOS los juegos del catálogo.
   * @returns {Promise<void>}
   */
  function deleteAllGames() {
    if (_db) {
      return _db
        .from('games')
        .delete()
        .neq('id', '')        // condición que coincide con todas las filas
        .then(function (res) {
          if (res.error) throw res.error;
          _cache = [];
        });
    }
    _cache = [];
    _lsWrite([]);
    return Promise.resolve();
  }

  /* ── localStorage helpers ───────────────────────── */

  function _lsRead() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULTS.slice();
  }

  function _lsWrite(games) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(games)); } catch (e) {}
  }

  /* ── API pública ────────────────────────────────── */

  return { init, getGames, getPublishableGames, isPublishable, addGame, updateGame, deleteGame, deleteAllGames, ADMIN_PASS };

}());
