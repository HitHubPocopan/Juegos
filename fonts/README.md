# Fuentes requeridas

Copiá los archivos `.otf` en esta misma carpeta (`fonts/`).
El CSS los carga automáticamente con `@font-face`.

---

## 1. Bakso Sapi
**Archivo esperado:** `fonts/BaksoSapi.otf`

- Descarga gratuita: https://www.dafont.com/bakso-sapi.font
- Autor: Khurasan
- Usada en: nombre de la tienda (home), títulos del wizard

## 2. Helvetica Rounded Bold
**Archivo esperado:** `fonts/HelveticaRounded-Bold.otf`

- Disponible en: https://www.myfonts.com/fonts/linotype/helvetica-rounded/
- Alternativa gratuita similar: "Nunito ExtraBold" → https://fonts.google.com/specimen/Nunito
- Usada en: toda la interfaz (botones, headers, tarjetas, formularios)

---

## Fallback automático
Si los archivos no están presentes el CSS cae a:
- Bakso Sapi → `cursive`
- Helvetica Rounded → `'Arial Rounded MT Bold'`, `'Helvetica Neue'`, `sans-serif`
