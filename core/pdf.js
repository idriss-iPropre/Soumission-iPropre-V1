// core/pdf.js — Convert printable HTML to a PDF Blob, then base64.
// Uses html2pdf.js (must be loaded before this script).

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

  // Wait for all <img> in a container to load (or fail fast on timeout).
  function waitForImages(container, timeoutMs = 6000) {
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length === 0) return Promise.resolve();
    return new Promise((resolve) => {
      let remaining = imgs.length;
      const done = () => { remaining--; if (remaining <= 0) resolve(); };
      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) { done(); return; }
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
      setTimeout(resolve, timeoutMs);
    });
  }

  // Wait for fonts on the document. Falls back to a 1.5s timeout.
  function waitForFonts(timeoutMs = 2000) {
    if (!document.fonts || !document.fonts.ready) return new Promise((r) => setTimeout(r, 500));
    return Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]);
  }

  // Render printable HTML offscreen, capture to PDF, return a Blob.
  async function htmlToPdfBlob(html, { filename = 'soumission.pdf' } = {}) {
    if (!window.html2pdf) throw new Error('html2pdf.js not loaded');

    // Extract body + styles from the full HTML document
    let body = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) body = bodyMatch[1];
    // Remove any no-print toolbar
    body = body.replace(/<div class="no-print"[\s\S]*?<\/div>\s*(?=<div class="doc")/i, '');

    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    let styles = styleMatch ? styleMatch[1] : '';

    // ⚠️ html2canvas does NOT load <link rel="stylesheet"> resources.
    //    Replace Google-Fonts font-families with safe system fallbacks so text actually renders.
    //    The visual hierarchy survives — Playfair → serif, Inter → sans, JetBrains Mono → monospace.
    const safeStyleOverride = `
      /* PDF capture safe-overrides — html2canvas can't load external fonts */
      .pdf-root, .pdf-root * {
        font-family: Georgia, 'Times New Roman', serif !important;
      }
      .pdf-root [style*="Inter"],
      .pdf-root [style*="Inter"] * { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif !important; }
      .pdf-root [style*="JetBrains"],
      .pdf-root [style*="JetBrains"] * { font-family: 'Courier New', monospace !important; }
      /* Make sure the wrapper itself is opaque white so html2canvas captures it */
      .pdf-root { background: #ffffff !important; color: #111 !important; }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'pdf-root';
    // Mount in flow but invisible — html2canvas needs real layout boxes.
    wrap.style.position = 'absolute';
    wrap.style.top = '0';
    wrap.style.left = '0';
    wrap.style.width = '794px'; // ~A4 width @ 96dpi
    wrap.style.background = '#ffffff';
    wrap.style.color = '#000000';
    wrap.style.zIndex = '-1';
    wrap.style.opacity = '0.01'; // not 0 — some browsers skip painting at exactly 0
    wrap.style.pointerEvents = 'none';
    wrap.innerHTML =
      '<style>' + styles + '</style>' +
      '<style>' + safeStyleOverride + '</style>' +
      '<div style="width:794px;background:#fff;color:#111">' + body + '</div>';
    document.body.appendChild(wrap);

    try {
      // Wait for images + fonts + a couple of paint frames
      await Promise.all([waitForImages(wrap), waitForFonts()]);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      // Sanity check — if the wrapper has zero rendered height, bail with a clear error
      const rect = wrap.getBoundingClientRect();
      if (rect.height < 50) {
        console.warn('[pdf] wrapper height too small:', rect);
      }

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
          width: 794,
          // Capture at the wrapper position, not viewport
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          foreignObjectRendering: false,
          removeContainer: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css', 'legacy'] },
      };
      const blob = await window.html2pdf().set(opts).from(wrap).outputPdf('blob');
      return blob;
    } finally {
      try { document.body.removeChild(wrap); } catch (e) {}
    }
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
