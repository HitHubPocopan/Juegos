/**
 * views/advisor.js — Vista "Asesorarme" (wizard 3 pasos)
 * Responsabilidad: guiar al usuario por 3 preguntas,
 * filtrar el catálogo según sus respuestas y navegar a recomendaciones.
 */

'use strict';

window.App        = window.App || {};
window.App.Views  = window.App.Views || {};

App.Views.advisor = (function () {

  /* ── Definición de los pasos ────────────────────── */

  var STEPS = [
    {
      key:      'players',
      question: '¿Cuántos jugadores son?',
      options: [
        { label: '👤 Solo 2',    value: '2'   },
        { label: '👥 Hasta 4',    value: '2-4' },
        { label: '🎉 Mas de 4',    value: '4-6' },
      ]
    },
    {
      key:      'age',
      question: '¿La edad más baja del grupo?',
      options: [
        { label: ' + 3 ',   value: '3'  },
        { label: ' + 5 ',   value: '5'  },
        { label: ' + 7 ',  value: '7'  },
        { label: ' + 10 ', value: '10' },
        { label: ' + 15 ',   value: '15' }
      ]
    },
    {
      key:      'pace',
      question: '¿Preferís un juego lento o rápido?',
      options: [
        { label: 'Tranquilo 🧩', value: 'slow' },
        { label: 'Rápido ⚡',    value: 'fast' }
      ]
    }
  ];

  /* ── Estado privado ─────────────────────────────── */

  var _step    = 0;        // paso actual (0-based)
  var _answers = {};       // { players, age, pace }

  /* ── Setup ──────────────────────────────────────── */

  /**
   * Llamado por el router al navegar a esta vista.
   * Reinicia el wizard desde el paso 0.
   */
  function setup() {
    _step    = 0;
    _answers = {};
    _render();
  }

  /* ── Navegación interna ─────────────────────────── */

  /**
   * El botón "atrás" del header hace cosas distintas según el paso:
   *   - Paso 0 → volver al home
   *   - Pasos 1–2 → retroceder un paso del wizard
   */
  function back() {
    if (_step === 0) {
      App.Router.go('home');
    } else {
      _step--;
      _render();
    }
  }

  /**
   * Registra la respuesta del paso actual y avanza.
   * @param {string} value — valor de la opción elegida
   */
  function pick(value) {
    _answers[STEPS[_step].key] = value;

    if (_step < STEPS.length - 1) {
      _step++;
      _render();
    } else {
      _showRecommendations();
    }
  }

  /* ── Renderizado del paso actual ────────────────── */

  function _render() {
    _updateProgressDots();
    _updateBackButton();
    _renderStepContent();
  }

  function _updateProgressDots() {
    for (var i = 0; i < STEPS.length; i++) {
      var dot = document.getElementById('wd' + i);
      dot.className = 'wiz-dot' +
        (i < _step ? ' done' : i === _step ? ' now' : '');
    }
  }

  function _updateBackButton() {
    var btn = document.getElementById('wiz-back-btn');
    // Rebindear onclick en cada render para reflejar el paso actual
    btn.onclick = back;
  }

  function _renderStepContent() {
    var step     = STEPS[_step];
    var body     = document.getElementById('wiz-body');
    var labelEl  = document.createElement('div');
    var questionEl = document.createElement('div');
    var optsEl   = document.createElement('div');

    labelEl.className     = 'wiz-step-lbl';
    labelEl.textContent   = 'Paso ' + (_step + 1) + ' de ' + STEPS.length;

    questionEl.className  = 'wiz-q';
    questionEl.textContent = step.question;

    optsEl.className = 'wiz-opts';

    step.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className   = 'wiz-opt';
      btn.textContent = opt.label;
      // Capturar valor en clausura
      btn.onclick = (function (v) {
        return function () { pick(v); };
      }(opt.value));
      optsEl.appendChild(btn);
    });

    body.innerHTML = '';
    body.appendChild(labelEl);
    body.appendChild(questionEl);
    body.appendChild(optsEl);
  }

  /* ── Filtrar y mostrar recomendaciones ──────────── */

  function _showRecommendations() {
    var games   = App.Data.getPublishableGames();
    var players = _answers.players;
    var minAge  = parseInt(_answers.age, 10) || 0;
    var pace    = _answers.pace;

    // Rango de jugadores según la opción elegida
    var minP = 2, maxP = 99;
    switch (players) {
      case '2':   minP = 2; maxP = 2;  break;
      case '2-4': minP = 2; maxP = 4;  break;
      case '4-6': minP = 4; maxP = 99; break;  // "Más de 4"
    }

    // Rango de edad según la categoría seleccionada.
    // Cada nivel incluye su categoría inmediatamente anterior para ampliar un poco
    // los resultados sin perder relevancia:
    //   +15 → muestra juegos de +10 y +15
    //   +10 → muestra juegos de +7  y +10
    //   +7  → muestra juegos de +5  y +7
    //   +5  → muestra juegos de +3  y +5
    //   +3  → muestra solo juegos de +3
    var AGE_RANGE = {
      '15': { min: 10, max: 15 },
      '10': { min: 7,  max: 10 },
      '7':  { min: 5,  max: 7  },
      '5':  { min: 3,  max: 5  },
      '3':  { min: 3,  max: 3  }
    };
    var ageRange = AGE_RANGE[String(minAge)] || { min: minAge, max: minAge };

    // Filtro AND estricto — las tres condiciones deben cumplirse simultáneamente.
    // No hay fallback: si ningún juego coincide se muestra el estado vacío.
    var filtered = games.filter(function (g) {
      var playerOk = g.minPlayers <= maxP && g.maxPlayers >= minP;
      var ageOk    = g.minAge >= ageRange.min && g.minAge <= ageRange.max;
      var paceOk   = g.pace === pace;
      return playerOk && ageOk && paceOk;
    });

    // Subtítulo descriptivo
    var playersLbl = players === '2'   ? 'Solo 2'   :
                     players === '2-4' ? 'Hasta 4'  : 'Más de 4';
    var ageLbl     = '+' + minAge + ' años';
    var paceLbl    = pace === 'fast' ? 'Rápido ⚡' : 'Tranquilo 🧩';

    document.getElementById('reco-sub').textContent =
      playersLbl + ' jugadores · ' + ageLbl + ' · ' + paceLbl;

    // Renderizar resultados o estado vacío
    var container = document.getElementById('reco-cards');
    container.innerHTML = '';

    if (!filtered.length) {
      container.innerHTML =
        '<div class="empty">' +
          '<span>🎲</span>' +
          '<p>No encontramos juegos para esta combinación.<br>' +
          'Consultanos en el local y te ayudamos a elegir.</p>' +
        '</div>';
    } else {
      App.Utils.renderCards('reco-cards', filtered, 'reco');
    }

    App.Router.go('reco');
  }

  /* ── API pública ────────────────────────────────── */

  return { setup, back, pick };

}());
