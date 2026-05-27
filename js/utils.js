/**
 * utils.js — Utilidades compartidas de UI
 * Responsabilidad: helpers reutilizables (escape HTML, tarjetas,
 * thumbnails, toast) que no pertenecen a ninguna vista en particular.
 */

'use strict';

window.App = window.App || {};

App.Utils = (function () {

  /* ── Escape HTML ────────────────────────────────── */

  /**
   * Escapa caracteres especiales para inserción segura en HTML.
   * @param {*} value
   * @returns {string}
   */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /* ── Thumbnails ─────────────────────────────────── */

  /**
   * Callback de error de imagen — sustituye el <img> roto por un placeholder.
   * Necesita estar en window para los atributos onerror inline generados dinámicamente.
   * @param {HTMLImageElement} img
   * @param {string}           cls  — clase base (sin el sufijo "-ph")
   */
  function onImgErr(img, cls) {
    const placeholder = document.createElement('div');
    placeholder.className  = cls + '-ph';
    placeholder.textContent = '🎲';
    if (img.parentNode) {
      img.parentNode.replaceChild(placeholder, img);
    }
  }
  // Exponer globalmente para que funcione en atributos onerror
  window.onImgErr = onImgErr;

  /**
   * Genera el HTML de la miniatura de un juego.
   * @param {Object} game
   * @param {string} cls  — 'card-thumb' | 'adm-thumb'
   * @returns {string} HTML string
   */
  function thumbHTML(game, cls) {
    if (game.thumbnail) {
      return `<img class="${cls}" src="${esc(game.thumbnail)}" ` +
             `alt="${esc(game.name)}" onerror="onImgErr(this,'${cls}')">`;
    }
    return `<div class="${cls}-ph">🎲</div>`;
  }

  /* ── Tarjeta de juego ───────────────────────────── */

  /**
   * Construye y devuelve un elemento DOM para una tarjeta de juego.
   * @param {Object}   game
   * @param {Function} onClickFn — handler al hacer tap
   * @returns {HTMLElement}
   */
  function buildCard(game, onClickFn) {
    const el = document.createElement('div');
    el.className  = 'card';
    el.setAttribute('role', 'listitem');
    el.onclick    = onClickFn;

    const paceTag = game.pace === 'fast'
      ? '<span class="tag tag-fast">Rápido ⚡</span>'
      : '<span class="tag tag-slow">Tranquilo 🧩</span>';

    el.innerHTML =
      thumbHTML(game, 'card-thumb') +
      `<div class="card-body">
         <div class="card-name">${esc(game.name)}</div>
         <div class="card-tags">
           <span class="tag">👥 ${game.minPlayers}–${game.maxPlayers}</span>
           <span class="tag">🎂 ${game.minAge}+</span>
           ${paceTag}
         </div>
         <div class="card-price">${esc(game.price)}</div>
       </div>
       <span class="card-play" aria-hidden="true">▶</span>`;

    return el;
  }

  /**
   * Renderiza una lista de juegos como tarjetas en un contenedor.
   * @param {string}        containerId — ID del elemento contenedor
   * @param {Array<Object>} games
   * @param {string}        origin      — vista de origen (para el back del video)
   * @param {string}        [query]     — término buscado (solo para mensaje vacío)
   */
  function renderCards(containerId, games, origin, query) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!games.length) {
      container.innerHTML =
        `<div class="empty">
           <span aria-hidden="true">🔍</span>
           <p>Sin resultados para "<strong>${esc(query || '')}</strong>"<br>
              Probá con otro término</p>
         </div>`;
      return;
    }

    games.forEach(function (game) {
      const card = buildCard(game, function () {
        App.Views.video.open(game, origin);
      });
      container.appendChild(card);
    });
  }

  /* ── Toast ──────────────────────────────────────── */

  let _toastTimer = null;

  /**
   * Muestra un mensaje de feedback breve en la parte inferior de la pantalla.
   * @param {string} message
   */
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2600);
  }

  /* ── API pública ────────────────────────────────── */

  return { esc, onImgErr, thumbHTML, buildCard, renderCards, toast };

}());
