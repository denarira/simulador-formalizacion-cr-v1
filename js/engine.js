
/* engine.js - Lógica mínima para Versión 1 (estático) */
let RULES = null;
window.APP_STATE = { itinerario: [], ficha: null };
let MAP = null;
let markers = [];

async function loadRules() {
  const res = await fetch('data/rules.json');
  RULES = await res.json();
}

function initMap() {
  MAP = L.map('map').setView([9.7489, -83.7534], 7); // CR centro
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(MAP);
}

function clearMarkers() {
  markers.forEach(m => MAP.removeLayer(m));
  markers = [];
}

function actividadRequierePSF(actividad) {
  if (!actividad) return false;
  const list = RULES.defaults.actividad_requiere_psf || [];
  const a = actividad.toLowerCase();
  return list.some(k => a.includes(k));
}

function includeStep(step, ctx) {
  const cond = step.include_if || {};
  if (cond.always) return true;
  if (cond.tendra_personal !== undefined) {
    if (cond.tendra_personal !== ctx.tendra_personal) return false;
  }
  if (cond.tipo_sociedad_in) {
    if (!cond.tipo_sociedad_in.includes(ctx.tipo_sociedad)) return false;
  }
  if (cond.or) {
    // OR de condiciones; si alguna pasa, incluimos
    const any = cond.or.some(c => includeStep({include_if: c}, ctx));
    return any;
  }
  if (cond.actividad_requiere_psf !== undefined) {
    const req = actividadRequierePSF(ctx.actividad_ciiu);
    if (cond.actividad_requiere_psf !== req) return false;
  }
  if (cond.opcional) {
    // Por defecto incluir, puedes cambiar esto a checkbox en UI si quieres
    return true;
  }
  // Si no hubo condiciones explícitas distintas a 'always', incluir por defecto
  return Object.keys(cond).length === 0;
}

function buildItinerary(ctx) {
  const flow = RULES.flows[ctx.tipo_sociedad] || [];
  const out = [];
  let order = 1;

  for (const stepKey of flow) {
    const step = RULES.steps[stepKey];
    if (!step) continue;
    if (!includeStep(step, ctx)) continue;

    const entidad = RULES.entities[step.entidad_ref];
    const item = {
      orden: order++,
      entidad: entidad?.nombre || step.entidad_ref,
      proceso: step.proceso,
      prerequisitos: step.prerequisitos || [],
      documentos: step.documentos || [],
      enlace: entidad?.enlace || null,
      mapa: entidad?.mapa || {tipo:'online', lat:null, lng:null},
      notas: entidad?.notas || ""
    };
    out.push(item);
  }
  return out;
}

function suggestRegimen(actividad) {
  // Regla muy simple de demo: si actividad tiene 'restaurante' o 'comercio' -> sugerir simplificado, si no tradicional.
  if (!actividad) return RULES.defaults.regimen_tributario_por_defecto || "tradicional";
  const a = actividad.toLowerCase();
  if (a.includes("restaurante") || a.includes("comercio")) return "simplificado";
  return "tradicional";
}

function buildFicha(ctx, itinerario) {
  const hasPatrono = ctx.tendra_personal;
  const needsPSF = actividadRequierePSF(ctx.actividad_ciiu);
  const regimen = ctx.regimen === 'auto' ? suggestRegimen(ctx.actividad_ciiu) : ctx.regimen;

  const ficha = {
    tipo_sociedad: ctx.tipo_sociedad,
    actividad_ciiu: ctx.actividad_ciiu,
    canton: ctx.canton,
    tendra_personal: ctx.tendra_personal,
    registro_nacional: {
      requerido: ctx.tipo_sociedad !== 'persona_fisica',
      enlace: RULES.entities.registro_nacional.enlace
    },
    hacienda_atv: {
      regimen,
      enlace: RULES.entities.hacienda_atv.enlace
    },
    ccss: {
      tipo: hasPatrono ? 'patrono' : (ctx.tipo_sociedad === 'persona_fisica' ? 'independiente' : 'segun_caso'),
      enlace: RULES.entities.ccss.enlace
    },
    ins_rt: {
      aplica: hasPatrono,
      enlace: RULES.entities.ins_rt.enlace
    },
    municipalidad: {
      permiso_uso_suelo: true,
      patente: true,
      enlace: RULES.entities.municipalidad.enlace
    },
    salud: {
      psf: needsPSF,
      enlace: RULES.entities.ministerio_salud.enlace
    },
    meic_pyme: {
      opcional: true,
      enlace: RULES.entities.meic_pyme.enlace
    }
  };
  return ficha;
}

function renderItinerary(it) {
  const cont = document.getElementById('itinerario');
  cont.innerHTML = '';
  clearMarkers();

  it.forEach(step => {
    const div = document.createElement('div');
    div.className = 'step';
    div.innerHTML = `
      <div><strong>${step.orden}. ${step.entidad}</strong></div>
      <div>${step.proceso}</div>
      <div class="small">Prerequisitos: ${step.prerequisitos.join(', ') || '—'}</div>
      <div class="small">Documentos: ${step.documentos.join(', ') || '—'}</div>
      <div class="small">Enlace: ${step.enlace ? `<a href="${step.enlace}" target="_blank" rel="noopener">Abrir</a>` : '—'}</div>
      <div class="small">${step.notas || ''}</div>
    `;
    cont.appendChild(div);

    if (step.mapa && step.mapa.tipo === 'fisico' && step.mapa.lat && step.mapa.lng) {
      const m = L.marker([step.mapa.lat, step.mapa.lng]).addTo(MAP).bindPopup(`<b>${step.entidad}</b><br>${step.proceso}`);
      markers.push(m);
    }
  });

  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    MAP.fitBounds(group.getBounds().pad(0.2));
  } else {
    MAP.setView([9.7489, -83.7534], 7);
  }
}

function renderFicha(ficha) {
 const cont = document.getElementById('ficha');
  cont.innerHTML = `
    <div id="pdfArea">
      <h3>Ficha técnica de formalización</h3>
      <p><strong>Tipo de figura:</strong> ${ficha.tipo_sociedad}</p>
      <p><strong>Actividad:</strong> ${ficha.actividad_ciiu}</p>
      <p><strong>Cantón:</strong> ${ficha.canton}</p>
      <p><strong>¿Tendrá personal?:</strong> ${ficha.tendra_personal ? 'Sí' : 'No'}</p>
      <hr/>
      <p><strong>Registro Nacional:</strong> ${ficha.registro_nacional.requerido ? 'Requerido' : 'No aplica'} – <a href="${ficha.registro_nacional.enlace}" target="_blank" rel="noopener">Enlace</a></p>
      <p><strong>Hacienda (ATV):</strong> Régimen ${ficha.hacienda_atv.regimen} – <a href="${ficha.hacienda_atv.enlace}" target="_blank" rel="noopener">Enlace</a></p>
      <p><strong>CCSS:</strong> ${ficha.ccss.tipo} – <a href="${ficha.ccss.enlace}" target="_blank" rel="noopener">Enlace</a></p>
      <p><strong>INS (RT):</strong> ${ficha.ins_rt.aplica ? 'Aplica' : 'No aplica'} – <a href="${ficha.ins_rt.enlace}" target="_blank" rel="noopener">Enlace</a></p>
      <p><strong>Municipalidad:</strong> Uso de suelo y patente – <a href="${ficha.municipalidad.enlace}" target="_blank" rel="noopener">Directorio</a></p>
      <p><strong>Ministerio de Salud:</strong> PSF ${ficha.salud.psf ? 'obligatorio' : 'no requerido'} – <a href="${ficha.salud.enlace}" target="_blank" rel="noopener">Enlace</a></p>
      <p><strong>MEIC (PYME):</strong> Opcional – <a href="${ficha.meic_pyme.enlace}" target="_blank" rel="noopener">Enlace</a></p>
    </div>
  `;
}

function renderJSON(obj) {
  const pre = document.getElementById('jsonOut');
  pre.textContent = JSON.stringify(obj, null, 2);
}

async function main() {
  await loadRules();
  initMap();
  document.getElementById('btnPdf').disabled = true; // desactiva al iniciar
  
  document.getElementById('btnSimular').addEventListener('click', () => {
    const ctx = {
      tipo_sociedad: document.getElementById('tipo_sociedad').value,
      actividad_ciiu: document.getElementById('ciiu').value.trim(),
      canton: document.getElementById('canton').value.trim(),
      regimen: document.getElementById('regimen').value,
      tendra_personal: document.getElementById('tendra_personal').checked
    };

    const itinerario = buildItinerary(ctx);
    renderItinerary(itinerario);
    const ficha = buildFicha(ctx, itinerario);
    renderFicha(ficha);
    window.APP_STATE = { itinerario, ficha };
    document.getElementById('btnPdf').disabled = false;
    renderJSON({ itinerario, ficha_tecnica: ficha });
  });

  document.getElementById('btnPdf').addEventListener('click', () => {
    downloadPDF();
  });
}

window.addEventListener('DOMContentLoaded', main);
