/**
 * views/search.js — Vista "Buscar Juego"
 * Responsabilidad: mostrar el catálogo completo al entrar,
 * actualizar resultados en tiempo real mientras el usuario escribe.
 */

'use strict';

window.App        = window.App || {};
window.App.Views  = window.App.Views || {};

App.Views.search = (function () {

  /* ── Configuración ──────────────────────────────── */

  const INPUT_ID    = 'srch-inp';
  const RESULTS_ID  = 'srch-cards';
  const FOCUS_DELAY = 280; // ms — espera a que la transición de vista termine

  /* ── Setup ──────────────────────────────────────── */

  /**
   * Llamado por el router al navegar a esta vista.
   * Limpia el campo de búsqueda, muestra todos los juegos y enfoca el input.
   */
  function setup() {
    const input = document.getElementById(INPUT_ID);
    if (input) input.value = '';

    _renderResults(App.Data.getGames(), '');

    // Enfocar teclado tras la animación de entrada
    setTimeout(function () {
      const inp = document.getElementById(INPUT_ID);
      if (inp) inp.focus();
    }, FOCUS_DELAY);
  }

  /* ── Búsqueda en tiempo real ────────────────────── */

  /**
   * Disparado por el evento 'input' del campo de búsqueda.
   * @param {string} query — texto actual del input
   */
  function onSearch(query) {
    const results = App.Search.searchGames(query);
    _renderResults(results, query);
  }

  /* ── Renderizado ────────────────────────────────── */

  /**
   * @param {Array<Object>} games
   * @param {string}        query
   */
  function _renderResults(games, query) {
    App.Utils.renderCards(RESULTS_ID, games, 'search', query);
  }

  /* ── API pública ────────────────────────────────── */

  return { setup, onSearch };

}());
