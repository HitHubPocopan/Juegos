/**
 * data.js — Capa de datos
 * Responsabilidad: juegos por defecto, lectura/escritura en localStorage,
 * constantes de configuración.
 */

'use strict';

window.App = window.App || {};

App.Data = (function () {

  /* ── Configuración ──────────────────────────────── */

  const STORE_KEY  = 'ppj_games_v4';  // v4: thumbnails sin hotlink externo
  const ADMIN_PASS = 'pocopan2024';

  /* ── Datos de ejemplo ───────────────────────────── */

  const DEFAULTS = [
    {
      id: 'catan',
      name: 'Catan',
      description: 'Construí carreteras, asentamientos y ciudades en la isla de Catan. ' +
        'Comerciá recursos con otros jugadores y expandí tu civilización.',
      price: '$4.500',
      minPlayers: 3,
      maxPlayers: 4,
      minAge: 10,
      pace: 'slow',
      youtubeURL: 'https://www.youtube.com/watch?v=FaiDRMPVVgo',
      thumbnail:  ''   // agregá la URL desde el panel admin
    },
    {
      id: 'uno',
      name: 'Uno',
      description: 'El clásico juego de cartas donde debés deshacerte de todas las cartas ' +
        'antes que los demás. ¡No olvides gritar UNO!',
      price: '$1.200',
      minPlayers: 2,
      maxPlayers: 10,
      minAge: 7,
      pace: 'fast',
      youtubeURL: 'https://www.youtube.com/watch?v=JbAnxGKt8Xk',
      thumbnail:  ''
    },
    {
      id: 'dobble',
      name: 'Dobble',
      description: 'Velocidad y concentración: encontrá el símbolo común entre dos cartas ' +
        'antes que los demás. Perfecto para todas las edades.',
      price: '$1.800',
      minPlayers: 2,
      maxPlayers: 8,
      minAge: 6,
      pace: 'fast',
      youtubeURL: 'https://www.youtube.com/watch?v=p-oBajkS6kc',
      thumbnail:  ''
    },
    {
      id: 'pandemic',
      name: 'Pandemia',
      description: 'Trabajá en equipo para detener cuatro enfermedades mortales. ' +
        'Un juego cooperativo épico donde todos ganan o todos pierden.',
      price: '$5.200',
      minPlayers: 2,
      maxPlayers: 4,
      minAge: 8,
      pace: 'slow',
      youtubeURL: 'https://www.youtube.com/watch?v=kjXdFbM6v9w',
      thumbnail:  ''
    },
    {
      id: 'dixit',
      name: 'Dixit',
      description: 'Usá tu imaginación para describir cartas con ilustraciones surrealistas. ' +
        'Creatividad, deducción y diversión para toda la familia.',
      price: '$3.800',
      minPlayers: 3,
      maxPlayers: 6,
      minAge: 8,
      pace: 'slow',
      youtubeURL: 'https://www.youtube.com/watch?v=5P-rD6DvKnM',
      thumbnail:  ''
    }
  ];

  /* ── API pública ────────────────────────────────── */

  /**
   * Lee los juegos desde localStorage.
   * Si no hay datos guardados, persiste los valores por defecto y los devuelve.
   * @returns {Array<Object>}
   */
  function getGames() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[App.Data] Error al leer localStorage:', e);
    }
    // Primera ejecución: sembrar datos de ejemplo
    localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULTS));
    return DEFAULTS.slice();
  }

  /**
   * Persiste el array de juegos en localStorage.
   * @param {Array<Object>} games
   */
  function setGames(games) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(games));
    } catch (e) {
      console.error('[App.Data] Error al escribir localStorage:', e);
    }
  }

  return {
    getGames,
    setGames,
    ADMIN_PASS
  };

}());
