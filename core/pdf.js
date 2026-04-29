// core/pdf.js — Convert printable HTML to a PDF Blob, then base64.
// Uses html2pdf.js (must be loaded before this script).

(function () {
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Result looks like "data:application/pdf;base64,JVBERi0xLjQK..."
        const result = reader.result || '';
        const idx = result.indexOf('base64,');
        resolve(idx >= 0 ? result.slice(idx + 7) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Render printable HTML offscreen, capture to PDF, return a Blob.
  // We mount the HTML in a hidden container so html2canvas can rasterize it.
  async function htmlToPdfBlob(html, { filename = 'soumission.pdf' } = {}) {
    if (!window.html2pdf) throw new Error('html2pdf.js not loaded');

    // The buildPrintableHtml output is a full document. We only need the body.
    // Strip everything outside <body>...</body> and the no-print bar.
    let body = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) body = bodyMatch[1];
    body = body.replace(/<div class="no-print"[\s\S]*?<\/div>/i, '');

    // Pull out <style> from head so we can inject it inline
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? styleMatch[1] : '';

    // Build offscreen container
    const wrap = document.createElement('div');
    wrap.style.position = 'fixed';
    wrap.style.left = '-9999px';
    wrap.style.top = '0';
    wrap.style.width = '794px'; // ~A4 width @ 96dpi
    wrap.style.background = '#fff';
    wrap.innerHTML = '<style>' + styles + '</style>' + body;
    document.body.appendChild(wrap);

    try {
      const opts = {
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css', 'legacy'] },
      };
      const blob = await window.html2pdf().set(opts).from(wrap).outputPdf('blob');
      return blob;
    } finally {
      document.body.removeChild(wrap);
    }
  }

  // Convenience: HTML → base64 string ready for Apps Script
  async function htmlToPdfBase64(html, opts) {
    const blob = await htmlToPdfBlob(html, opts);
    return blobToBase64(blob);
  }

  // Sanitize a string for use in a filename
  function safeFilename(s) {
    return String(s || 'soumission')
      .replace(/[^\w\s\-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 60);
  }

  function buildPdfFilename({ soumissionName, clientName, trigger }) {
    const ts = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}_${pad(ts.getHours())}h${pad(ts.getMinutes())}`;
    const who = safeFilename(clientName || soumissionName || 'soumission');
    const t = trigger === 'send' ? 'envoi' : 'save';
    return `iPropre_${who}_${stamp}_${t}.pdf`;
  }

  window.pdfTools = { htmlToPdfBlob, htmlToPdfBase64, blobToBase64, buildPdfFilename, safeFilename };
})();
