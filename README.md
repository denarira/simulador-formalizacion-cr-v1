# Simulador de formalización (CR) – Versión 1 (estático)

Este prototipo funciona **sin servidor**: es un sitio estático en HTML/JS. Usa:
- [Leaflet](https://leafletjs.com/) para el mapa (teselas de OpenStreetMap).
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) para descargar la ficha técnica.
- Un archivo `/data/rules.json` como **fuente de verdad** con entidades, pasos y flujos por tipo de figura.

## Estructura
```
.
├─ index.html
├─ css/styles.css
├─ js/engine.js
├─ js/pdf.js
└─ data/rules.json
```

## Cómo ejecutar localmente
1. Descarga este folder y **abre `index.html` en tu navegador**. Para Chrome puede requerir ejecutar con un servidor local debido al `fetch` de `rules.json`.
2. Opción rápida (sin instalar nada): usa **VS Code** + extensión **Live Server** o ejecuta:
   ```bash
   # si tienes Python 3:
   cd simulador-formalizacion-cr-v1
   python -m http.server 5500
   # navega a http://localhost:5500
   ```

## Cómo publicar gratis
### GitHub Pages
1. Crea un repo nuevo y sube estos archivos.
2. En **Settings → Pages**, elige **Deploy from a branch**, rama `main`, carpeta `/root`.
3. Espera a que se construya; la URL pública aparecerá en ese panel.

### Netlify
1. Ve a https://app.netlify.com/ → **Add new site → Deploy manually**.
2. Arrastra y suelta este folder. ¡Listo!

## Configurar reglas
Edita `/data/rules.json`. Claves:
- `entities`: catálogo de entidades (nombre, enlace, mapa, notas).
- `steps`: cada paso con `entidad_ref`, `proceso`, `prerequisitos`, `documentos` y condiciones `include_if`.
- `flows`: el **orden** de pasos por tipo de figura (`persona_fisica`, `sociedad_anonima`, `sociedad_responsabilidad_limitada`).
- `defaults`: utilidades (por ejemplo, actividades que requieren PSF).

> **Sugerencia**: mantén este JSON alineado con fuentes oficiales (MEIC, Registro Nacional, Hacienda ATV, CCSS, INS, Municipalidades y Ministerio de Salud).

## Personalizar
- Cambia estilos en `css/styles.css`.
- Ajusta la lógica en `js/engine.js` para nuevas condiciones (por ejemplo, giros específicos por cantón).
- Integra coordenadas reales de oficinas cantonales en `entities.*.mapa` (lat/lng).

## Limitaciones de la V1
- No guarda datos del usuario ni tiene login.
- Las ubicaciones de ejemplo son referenciales (San José). Actualiza con sedes reales si lo necesitas.
- La sugerencia de régimen tributario es **demostrativa**. No constituye asesoría tributaria.
