/**
 * search.js — Motor de búsqueda difusa
 * Responsabilidad: normalización de texto, distancia de Levenshtein,
 * puntuación de relevancia y filtrado del catálogo.
 */

'use strict';

window.App = window.App || {};

App.Search = (function () {

  /* ── Normalización ──────────────────────────────── */

  /**
   * Convierte un string a minúsculas, elimina tildes y caracteres
   * no alfanuméricos. Prepara el texto para comparación.
   * @param {string} str
   * @returns {string}
   */
  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')  // quitar diacríticos (tildes, ü, ñ→n, etc.)
      .replace(/[^a-z0-9 ]/g, ' ')      // reemplazar resto por espacio
      .trim();
  }

  /* ── Distancia de Levenshtein ───────────────────── */

  /**
   * Calcula la distancia de edición mínima entre dos strings.
   * Implementación con dos filas para O(n) de espacio.
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;

    if (m === 0) return n;
    if (n === 0) return m;

    // Fila anterior inicializada con índices
    const prev = Array.from({ length: n + 1 }, function (_, i) { return i; });
    const curr = new Array(n + 1);

    for (var i = 1; i <= m; i++) {
      curr[0] = i;
      for (var j = 1; j <= n; j++) {
        curr[j] = a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }
      // Copiar curr → prev para la siguiente iteración
      for (var k = 0; k <= n; k++) prev[k] = curr[k];
    }

    return prev[n];
  }

  /* ── Puntuación de relevancia ───────────────────── */

  /**
   * Devuelve un score 0–100 indicando qué tan bien coincide
   * la consulta con el texto objetivo.
   *
   * Criterios (decreciente):
   *   100 — coincidencia exacta de substring
   *    90 — alguna palabra empieza con la consulta
   *    80 — distancia Levenshtein baja a nivel de palabra
   *    60 — distancia Levenshtein baja a nivel de texto completo
   *
   * @param {string} query
   * @param {string} text
   * @returns {number}
   */
  function fuzzyScore(query, text) {
    query = normalize(query);
    text  = normalize(text);

    if (!query) return 100;

    // Coincidencia exacta de substring
    if (text.includes(query)) return 100;

    const words = text.split(/\s+/);

    // Alguna palabra empieza con la consulta
    for (var wi = 0; wi < words.length; wi++) {
      if (words[wi].startsWith(query)) return 90;
    }

    // Levenshtein por palabra (tolerancia a errores tipográficos)
    var bestWordScore = 0;
    for (var wj = 0; wj < words.length; wj++) {
      var word    = words[wj];
      var sub     = word.slice(0, query.length + 2);    // ventana comparable
      var maxLen  = Math.max(query.length, sub.length);
      if (maxLen === 0) continue;
      var sc = (1 - levenshtein(query, sub) / maxLen) * 80;
      if (sc > bestWordScore) bestWordScore = sc;
    }

    // Levenshtein sobre el texto completo
    var fullMax   = Math.max(query.length, text.length);
    var fullScore = fullMax ? (1 - levenshtein(query, text) / fullMax) * 60 : 0;

    return Math.max(bestWordScore, fullScore);
  }

  /* ── Búsqueda en el catálogo ────────────────────── */

  /**
   * Filtra y ordena los juegos del catálogo según la consulta.
   * Si la consulta está vacía devuelve todos los juegos.
   *
   * @param {string} query
   * @returns {Array<Object>}
   */
  function searchGames(query) {
    const games = App.Data.getGames();

    if (!query.trim()) return games;

    return games
      .map(function (game) {
        return {
          game: game,
          score: Math.max(
            fuzzyScore(query, game.name),
            fuzzyScore(query, game.description || '')
          )
        };
      })
      .filter(function (item) { return item.score > 38; })
      .sort(function (a, b)   { return b.score - a.score; })
      .map(function (item)    { return item.game; });
  }

  /* ── API pública ────────────────────────────────── */

  return { normalize, levenshtein, fuzzyScore, searchGames };

}());
