/**
 * router.js — Enrutador de vistas
 * Responsabilidad: mostrar/ocultar vistas con transición,
 * notificar a cada vista cuando debe inicializarse.
 */

'use strict';

window.App = window.App || {};

App.Router = (function () {

  let _current  = '';
  let _previous = '';

  /**
   * Navega a una vista por su ID.
   * Llama a App.Views[id].setup() salvo que skipSetup sea true.
   *
   * @param {string}  id         — ID de la vista (sin prefijo "v-")
   * @param {boolean} skipSetup  — Si true, no llama a setup()
   */
  function go(id, skipSetup) {
    if (id === _current) return;

    // Salir de la vista actual
    const oldEl = _current ? document.getElementById('v-' + _current) : null;
    if (oldEl) {
      oldEl.classList.remove('active');
      oldEl.classList.add('exit');
      setTimeout(() => oldEl.classList.remove('exit'), 300);
    }

    // Notificar a la vista saliente para que libere recursos
    const leavingView = App.Views && App.Views[_current];
    if (leavingView && typeof leavingView.teardown === 'function') {
      leavingView.teardown();
    }

    _previous = _current;
    _current  = id;

    // Activar nueva vista
    const newEl = document.getElementById('v-' + id);
    if (!newEl) {
      console.warn('[App.Router] Vista no encontrada: v-' + id);
      return;
    }
    newEl.classList.add('active');

    // Inicializar vista si tiene handler registrado
    if (!skipSetup) {
      const view = App.Views && App.Views[id];
      if (view && typeof view.setup === 'function') {
        view.setup();
      }
    }
  }

  /**
   * Vuelve a la vista anterior.
   */
  function goBack() {
    go(_previous || 'home');
  }

  /** @returns {string} ID de la vista activa */
  function current() { return _current; }

  /** @returns {string} ID de la vista anterior */
  function previous() { return _previous; }

  return { go, goBack, current, previous };

}());
