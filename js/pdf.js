/* pdf.js - Generador programático con jsPDF (sin html2canvas) */
function downloadPDF() {
  if (!window.jspdf) {
    alert('No se cargó jsPDF. Verifica la línea del script en index.html.');
    return;
  }
  const state = window.APP_STATE || {};
  const ficha = state.ficha;
  const it = state.itinerario || [];
  if (!ficha) {
    alert('Primero presiona "Generar" para crear la ficha.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const left = 12;
  const maxW = 186;      // ancho útil (210 - márgenes)
  let y = 16;

  const H = (t, size = 14) => { doc.setFontSize(size); doc.setFont('Helvetica','bold'); };
  const N = (t, size = 11) => { doc.setFontSize(size); doc.setFont('Helvetica','normal'); };

  const wrap = (txt, w = maxW, lh = 6) => {
    const lines = doc.splitTextToSize(txt, w);
    doc.text(lines, left, y);
    y += lines.length * lh;
  };
  const line = () => { doc.setDrawColor(200); doc.line(left, y, left + maxW, y); y += 4; };
  const ensurePage = () => { if (y > 280) { doc.addPage(); y = 16; } };

  // --- Título
  H(); doc.text('Ficha técnica de formalización – Costa Rica', left, y); y += 8; line();

  // --- Datos básicos
  H(); doc.text('Resumen del caso', left, y); y += 7; N();
  wrap(`Tipo de figura: ${ficha.tipo_sociedad}`);
  wrap(`Actividad: ${ficha.actividad_ciiu || '—'}`);
  wrap(`Cantón: ${ficha.canton || '—'}`);
  wrap(`¿Tendrá personal?: ${ficha.tendra_personal ? 'Sí' : 'No'}`);
  y += 2; line(); ensurePage();

  // --- Parámetros clave
  H(); doc.text('Parámetros y entidades clave', left, y); y += 7; N();
  wrap(`Registro Nacional: ${ficha.registro_nacional.requerido ? 'Requerido' : 'No aplica'} – ${ficha.registro_nacional.enlace}`);
  wrap(`Hacienda (ATV): régimen ${ficha.hacienda_atv.regimen} – ${ficha.hacienda_atv.enlace}`);
  wrap(`CCSS: ${ficha.ccss.tipo} – ${ficha.ccss.enlace}`);
  wrap(`INS (RT): ${ficha.ins_rt.aplica ? 'Aplica' : 'No aplica'} – ${ficha.ins_rt.enlace}`);
  wrap(`Municipalidad: uso de suelo/patente – ${ficha.municipalidad.enlace}`);
  wrap(`Ministerio de Salud: PSF ${ficha.salud.psf ? 'obligatorio' : 'no requerido'} – ${ficha.salud.enlace}`);
  wrap(`MEIC (PYME): Opcional – ${ficha.meic_pyme.enlace}`);
  y += 2; line(); ensurePage();

  // --- Itinerario
  H(); doc.text('Itinerario de trámites', left, y); y += 7; N();

  it.forEach(step => {
    ensurePage();
    H(); doc.text(`${step.orden}. ${step.entidad}`, left, y); y += 6; N();
    wrap(`Proceso: ${step.proceso}`);
    if (step.prerequisitos?.length) wrap(`Prerequisitos: ${step.prerequisitos.join(', ')}`);
    if (step.documentos?.length)    wrap(`Documentos: ${step.documentos.join(', ')}`);
    if (step.enlace)                 wrap(`Enlace: ${step.enlace}`);
    y += 3;
  });

  // --- Pie
  ensurePage(); line();
  N(10); y += 4;
  wrap('Nota: Esta ficha es informativa y debe contrastarse con fuentes oficiales (MEIC, Registro Nacional, Hacienda, CCSS, INS, Municipalidades y Ministerio de Salud).');

  doc.save('ficha-formalizacion.pdf');
}
