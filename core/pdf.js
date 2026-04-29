// core/pdf.js — Convert printable HTML to a PDF Blob, then base64.
// Uses html2pdf.js (must be loaded before this script).
//
// IMPORTANT: html2pdf must receive an HTML *string* (not a DOM element).
// When given a DOM node, its internal clone loses computed height and
// html2canvas captures a 0-height image → blank PDF.

(function () {
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result || '';
        const idx = result.indexOf('base64,');
        resolve(idx >= 0 ? result.slice(idx + 7) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Wait for fonts on the document (so the printable inherits them).
  function waitForFonts(timeoutMs = 2000) {
    if (!document.fonts || !document.fonts.ready) return new Promise((r) => setTimeout(r, 300));
    return Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]);
  }

  // Pre-load every <img> referenced in the HTML so html2canvas finds them in cache.
  function preloadImages(html, timeoutMs = 5000) {
    const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
    if (matches.length === 0) return Promise.resolve();
    return Promise.race([
      Promise.all(matches.map(m => new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // fail-safe — don't block on broken images
        img.src = m[1];
      }))),
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]);
  }

  // Render printable HTML to a PDF Blob.
  async function htmlToPdfBlob(html, { filename = 'soumission.pdf' } = {}) {
    if (!window.html2pdf) throw new Error('html2pdf.js not loaded');

    // Extract body + styles from the full HTML document
    let body = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) body = bodyMatch[1];
    // Strip the no-print toolbar (it's only for the print-window flow)
    body = body.replace(/<div class="no-print"[\s\S]*?<\/div>\s*(?=<div class="doc")/i, '');

    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? styleMatch[1] : '';

    // html2canvas can't fetch <link rel="stylesheet">. Force safe system fonts
    // so text renders even if Google Fonts didn't load in the capture context.
    const safeFontOverride = `
      .pdf-root, .pdf-root * { font-family: Georgia, 'Times New Roman', serif !important; }
      .pdf-root [style*="Inter"],
      .pdf-root [style*="Inter"] * { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif !important; }
      .pdf-root [style*="JetBrains"],
      .pdf-root [style*="JetBrains"] * { font-family: 'Courier New', monospace !important; }
      .pdf-root { background:#fff !important; color:#111 !important; }
    `;

    // Build the auto-contained HTML STRING that html2pdf will parse.
    const fullHtml =
      '<style>' + styles + '</style>' +
      '<style>' + safeFontOverride + '</style>' +
      '<div class="pdf-root" style="width:794px;background:#fff;color:#111;padding:0;margin:0">' +
      body +
      '</div>';

    // Pre-warm: fonts + images. html2pdf creates its own offscreen container,
    // so we just need the browser cache populated before capture starts.
    await Promise.all([waitForFonts(), preloadImages(html)]);

    const opts = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    // Pass the STRING — never a DOM element. (Element loses height in clone → blank PDF.)
    const blob = await window.html2pdf().set(opts).from(fullHtml).outputPdf('blob');
    return blob;
  }

  async function htmlToPdfBase64(html, opts) {
    const blob = await htmlToPdfBlob(html, opts);
    return blobToBase64(blob);
  }

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
