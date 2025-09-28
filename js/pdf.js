
/* pdf.js - Descarga la sección #pdfArea como PDF usando html2pdf */
function downloadPDF() {
  const element = document.getElementById('pdfArea');
  if (!element) return;
  const opt = {
    margin:       10,
    filename:     'ficha-formalizacion.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
