
/* pdf.js - Genera PDF con html2pdf; si falla, usa jsPDF como respaldo */
function downloadPDF() {
  const el = document.getElementById('pdfArea');
  if (!el) { alert('Primero genera la ficha técnica.'); return; }
  if (el.innerText.trim().length < 20) {
    alert('La ficha parece vacía. Presiona "Generar" y vuelve a intentar.');
    return;
  }

  const opt = {
    margin: 10,
    filename: 'ficha-formalizacion.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(el).save().catch(async () => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      await doc.html(el, { x: 10, y: 10, width: 190, windowWidth: document.documentElement.scrollWidth });
      doc.save('ficha-formalizacion.pdf');
    } catch (e) {
      alert('No se pudo generar el PDF. Como alternativa, usa Ctrl+P → “Guardar como PDF”.');
    }
  });
}
