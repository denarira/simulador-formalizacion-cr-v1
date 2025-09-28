/* pdf.js – PDF con enlaces clicables usando jsPDF */
function downloadPDF() {
  if (!window.jspdf) { alert('jsPDF no está cargado'); return; }
  const state = window.APP_STATE || {};
  const ficha = state.ficha;
  const it = state.itinerario || [];
  if (!ficha) { alert('Primero presiona "Generar".'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const left = 12, maxW = 186;
  let y = 16;

  const setN = (s=11)=>{ doc.setFont('Helvetica','normal'); doc.setFontSize(s); doc.setTextColor(0,0,0); };
  const setH = (s=14)=>{ doc.setFont('Helvetica','bold'); doc.setFontSize(s); doc.setTextColor(0,0,0); };
  const ensurePage = ()=>{ if (y>280){ doc.addPage(); y=16; } };

  // Helpers
  const wrapText = (txt)=> {
    const lines = doc.splitTextToSize(txt, maxW);
    doc.text(lines, left, y);
    y += lines.length * 6;
  };
  const linkLine = (label, url) => {
    // imprime "Label: " normal y a continuación el link en azul y clicable
    setN();
    const labelTxt = label + ': ';
    const w = doc.getTextWidth(labelTxt);
    doc.text(labelTxt, left, y);
    // decidir si cabe en la misma línea
    let x = left + w;
    if (x + doc.getTextWidth(url) > left + maxW) {
      y += 6; x = left; // salir a la siguiente línea si no cabe
    }
    doc.setTextColor(6,69,173); // azul estilo link
    doc.textWithLink(url, x, y, { url });
    doc.setTextColor(0,0,0);
    y += 6;
  };

  // Título
  setH(); doc.text('Ficha técnica de formalización – Costa Rica', left, y); y += 8;
  doc.setDrawColor(200); doc.line(left, y, left+maxW, y); y += 4;

  // Resumen
  setH(); doc.text('Resumen del caso', left, y); y += 7; setN();
  wrapText(`Tipo de figura: ${ficha.tipo_sociedad}`);
  wrapText(`Actividad: ${ficha.actividad_ciiu || '—'}`);
  wrapText(`Cantón: ${ficha.canton || '—'}`);
  wrapText(`¿Tendrá personal?: ${ficha.tendra_personal ? 'Sí' : 'No'}`);
  y += 2; ensurePage();

  // Parámetros y enlaces clave (clicables)
  setH(); doc.text('Parámetros y entidades clave', left, y); y += 7; setN();
  wrapText(`Registro Nacional: ${ficha.registro_nacional.requerido ? 'Requerido' : 'No aplica'}`);
  if (ficha.registro_nacional.enlace) linkLine('Sitio', ficha.registro_nacional.enlace);

  wrapText(`Hacienda (ATV): régimen ${ficha.hacienda_atv.regimen}`);
  if (ficha.hacienda_atv.enlace) linkLine('ATV', ficha.hacienda_atv.enlace);

  wrapText(`CCSS: ${ficha.ccss.tipo}`);
  if (ficha.ccss.enlace) linkLine('CCSS', ficha.ccss.enlace);

  wrapText(`INS (RT): ${ficha.ins_rt.aplica ? 'Aplica' : 'No aplica'}`);
  if (ficha.ins_rt.enlace) linkLine('INS', ficha.ins_rt.enlace);

  wrapText('Municipalidad: uso de suelo y patente');
  if (ficha.municipalidad.enlace) linkLine('Directorio municipal', ficha.municipalidad.enlace);

  wrapText(`Ministerio de Salud: PSF ${ficha.salud.psf ? 'obligatorio' : 'no requerido'}`);
  if (ficha.salud.enlace) linkLine('Salud', ficha.salud.enlace);

  if (ficha.meic_pyme?.enlace) linkLine('MEIC PYME', ficha.meic_pyme.enlace);
  y += 2; ensurePage();

  // Itinerario
  setH(); doc.text('Itinerario de trámites', left, y); y += 7; setN();
  it.forEach(step => {
    ensurePage();
    setH(12); doc.text(`${step.orden}. ${step.entidad}`, left, y); y += 6; setN();
    wrapText(`Proceso: ${step.proceso}`);
    if (step.prerequisitos?.length) wrapText(`Prerequisitos: ${step.prerequisitos.join(', ')}`);
    if (step.documentos?.length)    wrapText(`Documentos: ${step.documentos.join(', ')}`);
    if (step.enlace)                 linkLine('Enlace', step.enlace);
    y += 2;
  });

  // Nota
  ensurePage();
  doc.setDrawColor(200); doc.line(left, y, left+maxW, y); y += 4;
  wrapText('Nota: Esta ficha es informativa y debe contrastarse con fuentes oficiales (MEIC, Registro Nacional, Hacienda, CCSS, INS, Municipalidades y Ministerio de Salud).');

  doc.save('ficha-formalizacion.pdf');
}
