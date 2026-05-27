/**
 * app.js — Bootstrap de la aplicación
 * Responsabilidad: bindear todos los eventos estáticos del HTML,
 * manejar el hash-routing para el admin panel e inicializar la app.
 *
 * Este archivo es el único punto de entrada. Depende de que todos
 * los demás módulos estén cargados antes (ver orden en index.html).
 */

'use strict';

(function () {

  /* ── Esperar a que el DOM esté listo ────────────── */
  // Los scripts al final del <body> se ejecutan con el DOM ya disponible
  // (readyState === 'interactive' o 'complete'). Se cubre ambos casos.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      _bindEvents();
      _initHashRouting();
    });
  } else {
    _bindEvents();
    _initHashRouting();
  }

  /* ── Bindings de eventos estáticos ─────────────── */

  function _bindEvents() {

    /* -- HOME -- */
    _on('btn-go-search',  'click', function () { App.Router.go('search');  });
    _on('btn-go-advisor', 'click', function () { App.Router.go('advisor'); });

    /* -- SEARCH -- */
    _on('search-back', 'click', function () { App.Router.go('home'); });
    _on('srch-inp',    'input', function (e) {
      App.Views.search.onSearch(e.target.value);
    });

    /* -- VIDEO -- */
    _on('vid-back',   'click', function () {
      // Volver a la vista desde donde se abrió el video
      App.Router.go(App.Views.video.getOrigin());
    });
    _on('vid-replay', 'click', function () { App.Views.video.replay(); });
    _on('vid-home',   'click', function () { App.Router.go('home'); });

    /* -- RECOMENDACIONES -- */
    _on('reco-back', 'click', function () { App.Router.go('advisor'); });

    /* -- ADMIN: login -- */
    _on('adm-pw', 'keydown', function (e) {
      if (e.key === 'Enter') App.Views.admin.login();
    });
    _on('adm-login-btn',  'click', function () { App.Views.admin.login();  });
    _on('exit-admin-btn', 'click', function () { App.Views.admin.exit();   });

    /* -- ADMIN: panel -- */
    _on('adm-logout-btn', 'click', function () { App.Views.admin.logout();           });
    _on('adm-add-btn',    'click', function () { App.Views.admin.openModal(null);    });

    /* -- MODAL -- */
    _on('modal-close-btn', 'click', function () { App.Views.admin.closeModal();      });
    _on('modal-save-btn',  'click', function () { App.Views.admin.saveGame();        });
    _on('game-modal',      'click', function (e) { App.Views.admin.modalBgClick(e); });
  }

  /* ── Hash routing ───────────────────────────────── */

  function _initHashRouting() {
    window.addEventListener('hashchange', _checkHash);
    _checkHash();
  }

  function _checkHash() {
    if (location.hash === '#admin-panel-access') {
      App.Router.go('admin');
    } else if (!App.Router.current()) {
      // Primera carga: sembrar datos y mostrar home
      App.Data.getGames();
      App.Router.go('home');
    }
  }

  /* ── Utilidad interna ───────────────────────────── */

  /**
   * Ataja el boilerplate de addEventListener con manejo de elemento no encontrado.
   * @param {string}   id       — ID del elemento
   * @param {string}   event    — tipo de evento
   * @param {Function} handler
   */
  function _on(id, event, handler) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener(event, handler);
    } else {
      console.warn('[App] Elemento no encontrado para bindear evento: #' + id);
    }
  }

}());
