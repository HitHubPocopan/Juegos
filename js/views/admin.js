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
          '<div class="adm-gname">' + App.Utils.esc(game.name) + '</div>' +
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
      $('f-age').value   = String(game.minAge || '');
      $('f-minp').value  = game.minPlayers  || '';
      $('f-maxp').value  = game.maxPlayers  || '';
      $('f-pace').value  = game.pace        || 'slow';
      $('f-yt').value    = game.youtubeURL  || '';
      $('f-img').value   = game.thumbnail   || '';
    } else {
      // Limpiar todos los campos
      ['f-name', 'f-desc', 'f-age', 'f-minp', 'f-maxp', 'f-yt', 'f-img']
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
    var minAge = parseInt($('f-age').value, 10);
    var minP   = parseInt($('f-minp').value, 10);
    var maxP   = parseInt($('f-maxp').value, 10);

    // Validaciones
    if (!name)                        return _showModalError('El nombre es obligatorio');
    if (isNaN(minAge))                return _showModalError('Seleccioná la edad mínima');
    if (VALID_AGES.indexOf(minAge) === -1)
                                      return _showModalError('Edad inválida. Opciones: +3, +5, +7, +10, +15');
    if (isNaN(minP) || isNaN(maxP))   return _showModalError('Los jugadores son obligatorios');
    if (minP > maxP)                  return _showModalError('Jugadores mínimos no pueden superar los máximos');

    var gameData = {
      id:          _editingId || ('g' + Date.now()),
      name:        name,
      description: $('f-desc').value.trim(),
      minAge:      minAge,
      minPlayers:  minP,
      maxPlayers:  maxP,
      pace:        $('f-pace').value,
      youtubeURL:  $('f-yt').value.trim(),
      thumbnail:   $('f-img').value.trim()
    };

    var isEdit  = !!_editingId;
    var promise = isEdit
      ? App.Data.updateGame(gameData)
      : App.Data.addGame(gameData);

    // Deshabilitar botón mientras guarda
    var saveBtn = $('modal-save-btn');
    saveBtn.disabled = true;

    promise
      .then(function () {
        closeModal();
        _renderList();
        App.Utils.toast(isEdit ? '✅ Juego actualizado' : '✅ Juego agregado');
      })
      .catch(function (err) {
        console.error('[Admin] Error al guardar:', err);
        _showModalError('Error al guardar. Intentá de nuevo.');
      })
      .finally(function () {
        saveBtn.disabled = false;
      });
  }

  /* ── Eliminar juego ─────────────────────────────── */

  function _deleteGame(id) {
    if (!confirm('¿Eliminar este juego del catálogo?')) return;
    App.Data.deleteGame(id)
      .then(function () {
        _renderList();
        App.Utils.toast('🗑️ Juego eliminado');
      })
      .catch(function (err) {
        console.error('[Admin] Error al eliminar:', err);
        App.Utils.toast('❌ Error al eliminar. Intentá de nuevo.');
      });
  }

  /* ── Helper de error en modal ───────────────────── */

  function _showModalError(message) {
    var errEl = $('modal-err');
    errEl.textContent = message;
    errEl.hidden = false;
  }

  /* ── Importar Excel ─────────────────────────────── */

  var _importGames = [];  // juegos parseados del Excel, pendientes de confirmar

  /** Abre el selector de archivo Excel. */
  function openImportFile() {
    $('excel-input').click();
  }

  /**
   * Llamado cuando el usuario elige un archivo.
   * Usa SheetJS para parsear y muestra el modal de previsualización.
   */
  function handleExcelFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    e.target.value = '';   // permite volver a seleccionar el mismo archivo

    if (typeof XLSX === 'undefined') {
      App.Utils.toast('❌ Librería Excel no disponible');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (evt) {
      try {
        var data     = new Uint8Array(evt.target.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var sheet    = workbook.Sheets[workbook.SheetNames[0]];
        var rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        var games    = _parseExcelRows(rows);

        if (!games.length) {
          App.Utils.toast('⚠️ No se encontraron juegos en el archivo');
          return;
        }
        _showImportModal(games);
      } catch (err) {
        console.error('[Admin] Error al leer Excel:', err);
        App.Utils.toast('❌ Error al leer el archivo');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Convierte las filas crudas del Excel en objetos de juego.
   * Acepta archivos con o sin encabezado.
   * Columnas reconocidas (case-insensitive):
   *   nombre / name / juego → nombre del juego (obligatorio)
   *   descripcion / description
   *   jugadores_min / jug_min / min_players
   *   jugadores_max / jug_max / max_players
   *   edad_min / edad / min_age
   *   ritmo / pace  (slow | fast | tranquilo | rapido)
   *   youtube / youtube_url / video
   *   imagen / thumbnail / img / foto
   * Si no hay encabezado, usa la primera columna como nombre.
   */
  function _parseExcelRows(rows) {
    if (!rows.length) return [];

    var first = rows[0].map(function (c) { return String(c).toLowerCase().trim(); });

    // Detectar encabezado
    var hasHeader = first.some(function (c) {
      return ['nombre', 'name', 'juego'].indexOf(c) !== -1;
    });

    // Índices de columnas (por defecto -1 = no existe)
    var col = { name: 0, desc: -1, minp: -1, maxp: -1, age: -1, pace: -1, yt: -1, img: -1 };

    if (hasHeader) {
      first.forEach(function (h, i) {
        if (['nombre', 'name', 'juego'].indexOf(h) !== -1)                           col.name = i;
        else if (['descripcion', 'description', 'desc'].indexOf(h) !== -1)           col.desc = i;
        else if (['jugadores_min', 'jug_min', 'min_players'].indexOf(h) !== -1)      col.minp = i;
        else if (['jugadores_max', 'jug_max', 'max_players'].indexOf(h) !== -1)      col.maxp = i;
        else if (['edad_min', 'edad', 'min_age'].indexOf(h) !== -1)                  col.age  = i;
        else if (['ritmo', 'pace'].indexOf(h) !== -1)                                col.pace = i;
        else if (['youtube', 'youtube_url', 'video'].indexOf(h) !== -1)              col.yt   = i;
        else if (['imagen', 'thumbnail', 'img', 'foto'].indexOf(h) !== -1)           col.img  = i;
      });
    }

    var dataRows = hasHeader ? rows.slice(1) : rows;
    var stamp    = Date.now();

    return dataRows
      .map(function (row, i) {
        var name = String(row[col.name] || '').trim();
        if (!name) return null;

        var minAge = col.age >= 0 ? parseInt(row[col.age], 10) : NaN;
        if (VALID_AGES.indexOf(minAge) === -1) minAge = 7;

        var minP   = col.minp >= 0 ? (parseInt(row[col.minp], 10) || 2) : 2;
        var maxP   = col.maxp >= 0 ? (parseInt(row[col.maxp], 10) || 4) : 4;
        var paceRaw = col.pace >= 0 ? String(row[col.pace] || '').toLowerCase() : '';
        var pace   = (paceRaw === 'fast' || paceRaw === 'rapido' || paceRaw === 'rápido') ? 'fast' : 'slow';

        return {
          id:          'imp_' + stamp + '_' + i,
          name:        name,
          description: col.desc >= 0 ? String(row[col.desc] || '').trim() : '',
          minAge:      minAge,
          minPlayers:  minP,
          maxPlayers:  maxP,
          pace:        pace,
          youtubeURL:  col.yt  >= 0 ? String(row[col.yt]  || '').trim() : '',
          thumbnail:   col.img >= 0 ? String(row[col.img] || '').trim() : ''
        };
      })
      .filter(Boolean);
  }

  /** Muestra el modal de previsualización con los juegos a importar. */
  function _showImportModal(games) {
    _importGames = games;

    $('import-summary').textContent =
      'Se encontraron ' + games.length + ' juego(s) para importar:';

    var list = $('import-list');
    list.innerHTML = '';
    games.forEach(function (g, i) {
      var item = document.createElement('div');
      item.className   = 'import-item';
      item.textContent = (i + 1) + '. ' + g.name;
      list.appendChild(item);
    });

    $('import-modal').classList.add('open');
  }

  /** Cierra el modal de importación. */
  function closeImportModal() {
    $('import-modal').classList.remove('open');
    _importGames = [];
  }

  /**
   * Confirma la importación: agrega todos los juegos nuevos (ignora duplicados
   * comparando por nombre en minúsculas) y cierra el modal.
   */
  function confirmImport() {
    if (!_importGames.length) return;

    var btn = $('import-confirm-btn');
    btn.disabled    = true;
    btn.textContent = 'Importando…';

    var existing = App.Data.getGames().map(function (g) {
      return g.name.toLowerCase();
    });
    var toImport = _importGames.filter(function (g) {
      return existing.indexOf(g.name.toLowerCase()) === -1;
    });
    var skipped  = _importGames.length - toImport.length;

    // Importar en serie para no saturar Supabase
    var idx = 0;
    function _next() {
      if (idx >= toImport.length) {
        closeImportModal();
        _renderList();
        var msg = '✅ ' + toImport.length + ' juego(s) importado(s)';
        if (skipped) msg += ' · ' + skipped + ' ya existían';
        App.Utils.toast(msg);
        btn.disabled    = false;
        btn.textContent = '✅ Importar todos';
        return;
      }
      App.Data.addGame(toImport[idx++])
        .then(_next)
        .catch(function (err) {
          console.error('[Admin] Error importando juego:', err);
          _next();   // continúa aunque falle uno
        });
    }
    _next();
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
    modalBgClick,
    openImportFile,
    handleExcelFile,
    closeImportModal,
    confirmImport
  };

}());
