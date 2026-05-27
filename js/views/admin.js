/**
 * views/admin.js — Panel de administración
 * Responsabilidad: autenticación, CRUD de juegos en el catálogo,
 * gestión del modal de alta/edición.
 * Accesible únicamente desde: tudominio.com/#admin-panel-access
 */

'use strict';

window.App        = window.App || {};
window.App.Views  = window.App.Views || {};

App.Views.admin = (function () {

  /* ── Estado privado ─────────────────────────────── */

  var _authenticated = false;  // persiste durante la sesión del navegador
  var _editingId     = null;   // ID del juego que se está editando (null = nuevo)

  /* ── Atajo de getElementById ────────────────────── */
  function $ (id) { return document.getElementById(id); }

  /* ── Setup ──────────────────────────────────────── */

  /**
   * Llamado por el router al navegar a esta vista.
   * Si ya autenticado, muestra el panel; si no, muestra login.
   */
  function setup() {
    if (_authenticated) {
      _showPanel();
    } else {
      _showLogin();
    }
  }

  /* ── Login / Logout ─────────────────────────────── */

  function _showLogin() {
    $('adm-login').hidden = false;
    $('adm-panel').hidden = true;
    $('adm-err').hidden   = true;
    $('adm-pw').value     = '';
  }

  function _showPanel() {
    $('adm-login').hidden = true;
    $('adm-panel').hidden = false;
    _renderList();
  }

  /**
   * Verifica la contraseña ingresada.
   * Si es correcta, muestra el panel. Si no, muestra error.
   */
  function login() {
    var pw = $('adm-pw').value;
    if (pw === App.Data.ADMIN_PASS) {
      _authenticated = true;
      _showPanel();
    } else {
      $('adm-err').hidden = false;
      $('adm-pw').value   = '';
      $('adm-pw').focus();
    }
  }

  /**
   * Cierra sesión y vuelve al home, limpiando el hash de la URL.
   */
  function logout() {
    _authenticated = false;
    exit();
  }

  /**
   * Sale del panel sin cerrar sesión (botón "Volver al inicio" en login).
   */
  function exit() {
    // Eliminar hash para que el panel no se abra al recargar
    history.replaceState('', document.title, location.pathname + location.search);
    App.Router.go('home');
  }

  /* ── Lista de juegos ────────────────────────────── */

  function _renderList() {
    var games = App.Data.getGames();
    var list  = $('adm-list');
    list.innerHTML = '';

    if (!games.length) {
      list.innerHTML = '<div class="adm-empty">No hay juegos cargados aún</div>';
      return;
    }

    games.forEach(function (game) {
      var row = document.createElement('div');
      row.className = 'adm-row';

      row.innerHTML =
        App.Utils.thumbHTML(game, 'adm-thumb') +
        '<div class="adm-info">' +
          '<div class="adm-gname">'  + App.Utils.esc(game.name)  + '</div>' +
          '<div class="adm-gprice">' + App.Utils.esc(game.price) + '</div>' +
        '</div>' +
        '<div class="adm-acts">' +
          '<button class="btn-ico btn-edit" aria-label="Editar '   + App.Utils.esc(game.name) + '">✏️</button>' +
          '<button class="btn-ico btn-del"  aria-label="Eliminar ' + App.Utils.esc(game.name) + '">🗑️</button>' +
        '</div>';

      // Bindear eventos directamente en el elemento para evitar closures problemáticas
      var id = game.id;
      row.querySelector('.btn-edit').onclick = function () { openModal(id); };
      row.querySelector('.btn-del').onclick  = function () { _deleteGame(id); };

      list.appendChild(row);
    });
  }

  /* ── Modal alta / edición ───────────────────────── */

  /**
   * Abre el modal de alta o edición.
   * @param {string|null} id — ID del juego a editar, o null para alta nueva
   */
  function openModal(id) {
    _editingId = id || null;
    $('modal-err').hidden = true;
    $('modal-h').textContent = id ? 'Editar juego' : 'Agregar juego';

    if (id) {
      var game = App.Data.getGames().find(function (g) { return g.id === id; });
      if (!game) return;

      $('f-name').value  = game.name        || '';
      $('f-desc').value  = game.description || '';
      $('f-price').value = game.price       || '';
      $('f-age').value   = String(game.minAge || '');
      $('f-minp').value  = game.minPlayers  || '';
      $('f-maxp').value  = game.maxPlayers  || '';
      $('f-pace').value  = game.pace        || 'slow';
      $('f-yt').value    = game.youtubeURL  || '';
      $('f-img').value   = game.thumbnail   || '';
    } else {
      // Limpiar todos los campos
      ['f-name', 'f-desc', 'f-price', 'f-age', 'f-minp', 'f-maxp', 'f-yt', 'f-img']
        .forEach(function (fieldId) { $(fieldId).value = ''; });
      $('f-pace').value = 'slow';
    }

    $('game-modal').classList.add('open');
  }

  /**
   * Cierra el modal y resetea el estado de edición.
   */
  function closeModal() {
    $('game-modal').classList.remove('open');
    _editingId = null;
  }

  /**
   * Cierra el modal al hacer click en el fondo oscuro.
   * @param {MouseEvent} event
   */
  function modalBgClick(event) {
    if (event.target === $('game-modal')) closeModal();
  }

  /* ── Guardar juego ──────────────────────────────── */

  /**
   * Valida los campos del formulario y persiste el juego.
   * Muestra errores inline si la validación falla.
   */
  // Edades permitidas — deben coincidir exactamente con las opciones del wizard
  var VALID_AGES = [3, 5, 7, 10, 15];

  function saveGame() {
    var name   = $('f-name').value.trim();
    var price  = $('f-price').value.trim();
    var minAge = parseInt($('f-age').value, 10);
    var minP   = parseInt($('f-minp').value, 10);
    var maxP   = parseInt($('f-maxp').value, 10);

    // Validaciones
    if (!name)                        return _showModalError('El nombre es obligatorio');
    if (!price)                       return _showModalError('El precio es obligatorio');
    if (isNaN(minAge))                return _showModalError('Seleccioná la edad mínima');
    if (VALID_AGES.indexOf(minAge) === -1)
                                      return _showModalError('Edad inválida. Opciones: +3, +5, +7, +10, +15');
    if (isNaN(minP) || isNaN(maxP))   return _showModalError('Los jugadores son obligatorios');
    if (minP > maxP)                  return _showModalError('Jugadores mínimos no pueden superar los máximos');

    var gameData = {
      id:          _editingId || ('g' + Date.now()),
      name:        name,
      description: $('f-desc').value.trim(),
      price:       price,
      minAge:      minAge,
      minPlayers:  minP,
      maxPlayers:  maxP,
      pace:        $('f-pace').value,
      youtubeURL:  $('f-yt').value.trim(),
      thumbnail:   $('f-img').value.trim()
    };

    var games = App.Data.getGames();
    var idx   = _editingId
      ? games.findIndex(function (g) { return g.id === _editingId; })
      : -1;

    if (idx !== -1) {
      games[idx] = gameData;  // actualizar
    } else {
      games.push(gameData);   // agregar
    }

    App.Data.setGames(games);
    closeModal();
    _renderList();
    App.Utils.toast(_editingId ? '✅ Juego actualizado' : '✅ Juego agregado');
  }

  /* ── Eliminar juego ─────────────────────────────── */

  function _deleteGame(id) {
    if (!confirm('¿Eliminar este juego del catálogo?')) return;
    App.Data.setGames(
      App.Data.getGames().filter(function (g) { return g.id !== id; })
    );
    _renderList();
    App.Utils.toast('🗑️ Juego eliminado');
  }

  /* ── Helper de error en modal ───────────────────── */

  function _showModalError(message) {
    var errEl = $('modal-err');
    errEl.textContent = message;
    errEl.hidden = false;
  }

  /* ── API pública ────────────────────────────────── */

  return {
    setup,
    login,
    logout,
    exit,
    openModal,
    closeModal,
    saveGame,
    modalBgClick
  };

}());
