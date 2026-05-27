/**
 * views/video.js — Vista del reproductor de video
 * Responsabilidad: embeber el iframe de YouTube, manejar replay
 * y recordar desde qué vista se llegó (para el botón "atrás").
 */

'use strict';

window.App        = window.App || {};
window.App.Views  = window.App.Views || {};

App.Views.video = (function () {

  /* ── Estado privado ─────────────────────────────── */

  var _currentGame   = null;
  var _originView    = 'search'; // vista desde la que se abrió el video

  /* ── API pública ────────────────────────────────── */

  /**
   * Abre el reproductor para un juego concreto.
   * Llamado desde las tarjetas en búsqueda o recomendaciones.
   *
   * @param {Object} game       — objeto del juego
   * @param {string} originView — 'search' | 'reco'
   */
  function open(game, originView) {
    _currentGame = game;
    _originView  = originView || 'search';

    document.getElementById('vid-title').textContent = game.name;
    _embedVideo(game.youtubeURL);

    // Navegar sin llamar a setup() (esta vista se inicializa aquí)
    App.Router.go('video', true);
  }

  /**
   * Detiene el video limpiando el iframe.
   * Llamado automáticamente por el router al salir de esta vista.
   */
  function teardown() {
    var wrap = document.getElementById('vid-wrap');
    if (wrap) wrap.innerHTML = '';
  }

  /**
   * Reinicia la reproducción del video actual.
   */
  function replay() {
    if (!_currentGame) return;
    // Limpiar iframe y recrearlo para forzar autoplay
    var wrap = document.getElementById('vid-wrap');
    wrap.innerHTML = '';
    setTimeout(function () {
      _embedVideo(_currentGame.youtubeURL);
    }, 50);
  }

  /**
   * Devuelve la vista de origen para el botón "atrás" del header del video.
   * @returns {string}
   */
  function getOrigin() {
    return _originView;
  }

  /* ── Helpers privados ───────────────────────────── */

  /**
   * Inserta el iframe de YouTube (youtube-nocookie.com) o un placeholder
   * si la URL no es válida.
   * @param {string} url
   */
  function _embedVideo(url) {
    var wrap = document.getElementById('vid-wrap');
    var id   = _extractYouTubeId(url);

    if (id) {
      wrap.innerHTML =
        '<iframe ' +
          'src="https://www.youtube-nocookie.com/embed/' + id +
            '?autoplay=1&rel=0&modestbranding=1&playsinline=1" ' +
          'allow="accelerometer; autoplay; clipboard-write; ' +
                 'encrypted-media; gyroscope; picture-in-picture" ' +
          'allowfullscreen>' +
        '</iframe>';
    } else {
      wrap.innerHTML =
        '<div class="vid-no-video">' +
          '<span aria-hidden="true">🎬</span>' +
          'Video no disponible' +
        '</div>';
    }
  }

  /**
   * Extrae el ID de video de YouTube desde varios formatos de URL.
   * Soporta:
   *   - https://www.youtube.com/watch?v=VIDEO_ID
   *   - https://youtu.be/VIDEO_ID
   *   - https://www.youtube.com/embed/VIDEO_ID
   *   - https://www.youtube.com/shorts/VIDEO_ID
   *   - VIDEO_ID directo (11 caracteres)
   *
   * @param {string} url
   * @returns {string|null}
   */
  function _extractYouTubeId(url) {
    if (!url) return null;

    var match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
    );
    if (match) return match[1];

    // ID directo
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;

    return null;
  }

  /* ── API pública ────────────────────────────────── */

  return { open, replay, teardown, getOrigin };

}());
