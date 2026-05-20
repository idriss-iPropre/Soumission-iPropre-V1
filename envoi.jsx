// Envoi — email sending step with PDF generation (opens a dedicated print window)

// Pure function — builds the printable HTML for any state + client form.
// Exposed globally so the top-level "Offre en PDF" button can call it too.
function buildPrintableHtml(state, form, initialSnapshot) {
  form = form || {};
  const hiddenPlans = state.hiddenPlans || [];
  const visiblePlans = PLAN_DEFS.map((p, i) => ({ p, i })).filter(({ i }) => !hiddenPlans.includes(i));
  const plan = PLAN_DEFS[state.selectedPlan];
  const price = state.prices[state.selectedPlan];
  const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const today = new Date().toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' });

    // Column widths fixed for alignment across all tables
    const planColW = `${(60 / Math.max(visiblePlans.length, 1)).toFixed(2)}%`;
    const COLW = { label: '40%', plan: planColW };

    // Detect client modifications (rows with clientAdded: true OR cell values different from snapshot)
    const hasClientAdditions = state.sections.some(sec => sec.rows.some(r => r.clientAdded));
    const hasClientEdits = !!initialSnapshot && state.sections.some((sec, si) => sec.rows.some((r, ri) => {
      if (r.clientAdded) return false;
      const snap = initialSnapshot.sections?.[si]?.rows?.[ri];
      if (!snap) return false;
      return r.v.some((v, pi) => v !== snap.v?.[pi]) || r.label !== snap.label;
    }));
    const hasClientChanges = hasClientAdditions || hasClientEdits;

    const sectionsHtml = state.sections.map((sec, secIdx) => {
      const rows = sec.rows.map((r, rowIdx) => {
        const isAdded = !!r.clientAdded;
        const snap = !isAdded && initialSnapshot ? initialSnapshot.sections?.[secIdx]?.rows?.[rowIdx] : null;
        const labelEdited = !!snap && r.label !== snap.label;
        const labelHtml = isAdded
          ? `<span style="display:inline-block;padding:2px 7px;background:#F4A51C;color:#fff;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:0.1em;text-transform:uppercase;border-radius:999px;margin-right:6px;vertical-align:middle">Ajouté</span>${esc(r.label) || '<span style="color:#bbb">—</span>'}`
          : labelEdited
            ? `<span style="background:rgba(244,165,28,0.18);padding:2px 5px;border-radius:3px;border-bottom:1.5px solid #F4A51C">${esc(r.label) || '<span style="color:#bbb">—</span>'}</span>`
            : `${esc(r.label) || '<span style="color:#bbb">—</span>'}`;
        const rowEdited = labelEdited || (snap && r.v.some((v, pi) => v !== snap.v?.[pi]));
        return `
        <tr${isAdded ? ' style="background:rgba(244,165,28,0.05)"' : rowEdited ? ' style="background:rgba(244,165,28,0.04)"' : ''}>
          <td style="padding:9px 12px;border-bottom:1px solid #ededed;width:${COLW.label};vertical-align:middle;font-weight:500">${labelHtml}</td>
          ${visiblePlans.map(({ p, i: pi }) => {
            const isSel = pi === state.selectedPlan;
            const val = r.v[pi] || '—';
            const isEmptyAdded = isAdded && !r.v[pi];
            const cellEdited = !isAdded && snap && val !== (snap.v?.[pi] || '—') && (snap.v?.[pi] !== undefined);
            const cellStyle = isEmptyAdded
              ? 'color:#c0392b;font-style:italic'
              : cellEdited
                ? (isSel ? 'background:linear-gradient(180deg,#FFF4DA 0%,#FFE7B0 100%);font-weight:700;color:#7c5300;border-left:2px solid #F4A51C;border-right:2px solid #F4A51C' : 'background:rgba(244,165,28,0.18);font-weight:600;color:#7c5300')
                : (isSel ? 'background:#FFF4DA;font-weight:600;color:#111' : 'color:#555');
            const editBadge = cellEdited ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F4A51C;margin-left:5px;vertical-align:middle" title="Modifié"></span>' : '';
            return `<td style="padding:9px 12px;border-bottom:1px solid #ededed;text-align:center;width:${COLW.plan};vertical-align:middle;${cellStyle}">${isEmptyAdded ? 'À discuter' : esc(val)}${editBadge}</td>`;
          }).join('')}
        </tr>`;
      }).join('');
      return `
        <div style="margin-bottom:16px;page-break-inside:avoid">
          <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px">
            <div style="width:4px;height:20px;background:#F4A51C;border-radius:2px"></div>
            <h3 style="font-family:'Playfair Display',serif;color:#111;margin:0;font-size:16px;font-weight:700;letter-spacing:-0.01em;">${esc(sec.title)}</h3>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e5e5;table-layout:fixed">
            <colgroup>
              <col style="width:${COLW.label}" />
              ${visiblePlans.map(() => `<col style="width:${COLW.plan}" />`).join('')}
            </colgroup>
            <thead>
              <tr style="background:#fafaf6">
                <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;border-bottom:1px solid #e0e0e0;font-weight:600">Prestation</th>
                ${visiblePlans.map(({ p, i: pi }) => {
                  const isSel = pi === state.selectedPlan;
                  return `<th style="padding:8px 6px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;border-bottom:1px solid #e0e0e0;font-weight:600;${isSel?'background:#F4A51C;color:#fff':'color:#888'}">${esc(p.label)}${isSel?' ✓':''}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    const pricesHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px;border:1px solid #e5e5e5;table-layout:fixed">
        <colgroup>
          <col style="width:${COLW.label}" />
          ${visiblePlans.map(() => `<col style="width:${COLW.plan}" />`).join('')}
        </colgroup>
        <tr style="background:#111;color:#fff">
          <td style="padding:14px 14px;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;vertical-align:middle">Prix mensuel</td>
          ${visiblePlans.map(({ p, i: pi }) => {
            const isSel = pi === state.selectedPlan;
            const px = state.prices[pi];
            const isEmpty = !px;
            return `<td style="padding:14px 6px;text-align:center;font-family:'Playfair Display',serif;font-size:${isEmpty?'14px':'22px'};font-weight:700;${isEmpty?'background:#fff5f3;color:#c0392b':isSel?'background:#F4A51C;color:#1a1208':'background:#fafaf6;color:#333'}">${isEmpty ? 'À confirmer' : esc(px) + ' $'}</td>`;
          }).join('')}
        </tr>
        <tr>
          <td style="padding:9px 14px;background:#fafaf6;font-size:10.5px;color:#888;text-transform:uppercase;letter-spacing:0.12em">Taxes en sus</td>
          ${visiblePlans.map(({ p, i: pi }) => {
            const isSel = pi === state.selectedPlan;
            return `<td style="padding:9px 6px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;${isSel?'background:#FFF4DA;color:#7c5300':'background:#fafaf6;color:#aaa'}">${isSel?'Plan sélectionné':'—'}</td>`;
          }).join('')}
        </tr>
      </table>`;

    return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Soumission iPropre — ${esc(form.company || form.clientName || 'Client')}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { margin:0; padding:0; font-family:'Inter',system-ui,sans-serif; color:#111; background:#fff; font-size:12.5px; line-height:1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc { max-width: 820px; margin: 0 auto; padding: 18px 24px; }
  .hdr { display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F4A51C;padding-bottom:16px;margin-bottom:22px; }
  .hdr-left { display:flex;align-items:center;gap:14px; }
  .hdr-left img { height:64px;width:auto;display:block }
  .hdr-left .sub { font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#F4A51C;margin-top:2px }
  .hdr-left .tag { font-size:11.5px;color:#666;margin-top:3px }
  .meta { text-align:right;font-size:11.5px;color:#666; }
  .meta .num { font-family:'Playfair Display',serif;font-size:18px;color:#111;font-weight:700;margin-bottom:2px; }
  .client-box { background:#fafaf6;border:1px solid #e5e5e5;border-radius:8px;padding:16px 20px;margin-bottom:22px;display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;font-size:12px; }
  .client-box .lab { font-size:9.5px;text-transform:uppercase;letter-spacing:0.14em;color:#999;margin-bottom:3px;font-weight:600; }
  .client-box .val { font-weight:600;color:#111;font-size:13px; }
  h2 { font-family:'Playfair Display',serif;font-size:20px;margin:24px 0 12px;font-weight:700;letter-spacing:-0.01em;color:#111; }
  .highlight { margin-top:14px;padding:14px 18px;background:linear-gradient(135deg,#FFF4DA 0%,#FBE5B2 100%);border-radius:8px;font-size:13px;display:flex;justify-content:space-between;align-items:center;border:1px solid #f0d17a }
  .highlight .l { font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#7c5300;margin-bottom:3px;font-weight:600 }
  .highlight .v { font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#1a1208 }
  .footer { margin-top:28px;padding-top:14px;border-top:1px solid #eee;font-size:10.5px;color:#999;text-align:center;line-height:1.6 }
  .no-print { padding:14px;background:#F4A51C;color:#1a1208;text-align:center;font-weight:600;position:sticky;top:0;z-index:100;display:flex;justify-content:center;gap:12px;align-items:center; }
  .no-print button { background:#111;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-weight:600;cursor:pointer;font-family:inherit;font-size:13px; }
  @media print {
    .no-print { display:none !important; }
    html, body, * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    html, body { margin: 0 !important; padding: 0 !important; }
    /* Bake margins into .doc instead of @page — works reliably regardless of
       the user's "Marges" choice (Minimum/Default/Aucune) in the print dialog. */
    .doc { max-width: 100% !important; margin: 0 !important; padding: 14mm 14mm 16mm 14mm !important; box-sizing: border-box; }
  }
</style>
</head><body>
<div class="no-print">
  <span>📄 Aperçu PDF — utilisez Cmd/Ctrl+P ou</span>
  <button onclick="window.print()">Imprimer / Enregistrer PDF</button>
</div>
<div class="doc">
  <div class="hdr">
    <div class="hdr-left">
      <img src="assets/logo-full.png" alt="iPropre" onerror="this.style.display='none'" />
      <div>
        <div class="sub">Soumission commerciale</div>
        <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:800;letter-spacing:-0.02em;margin-top:4px;color:#111">i<span style="color:#F4A51C">Propre</span></div>
        <div class="tag">3095 A. Jean-Noël-Lavoie, Bureau 202, Laval QC H7P 4W5</div>
        <div class="tag">+1 (819) 995-2414 · www.ipropre.ca</div>
      </div>
    </div>
    <div class="meta">
      <div class="num">N° ${Date.now().toString().slice(-6)}</div>
      <div>Date : ${today}</div>
      <div style="margin-top:6px">Président : Idriss Sassi</div>
      <div style="margin-top:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#F4A51C">Valide 30 jours</div>
    </div>
  </div>

  <div class="client-box">
    <div><div class="lab">Contact</div><div class="val">${esc(form.clientName) || '—'}</div></div>
    <div><div class="lab">Entreprise</div><div class="val">${esc(form.company) || '—'}</div></div>
    <div><div class="lab">Courriel</div><div class="val">${esc(form.email) || '—'}</div></div>
    <div><div class="lab">Téléphone</div><div class="val">${esc(form.phone) || '—'}</div></div>
    <div style="grid-column:1/-1"><div class="lab">Adresse du service</div><div class="val">${esc(form.address) || '—'}</div></div>
  </div>

  ${hasClientChanges ? `
  <div style="margin:14px 0 18px;padding:14px 16px;background:#fff5f3;border:1.5px solid #e87a6c;border-radius:8px;display:flex;align-items:center;gap:12px;page-break-inside:avoid">
    <div style="width:30px;height:30px;border-radius:7px;background:#c0392b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0">!</div>
    <div style="flex:1;font-size:12.5px;color:#5a1f15;line-height:1.5">
      <strong style="font-family:'Playfair Display',serif;font-size:14px;color:#1a0e07">Soumission modifiée par le client</strong><br/>
      ${hasClientAdditions && hasClientEdits
        ? 'Le client a ajouté des lignes (badges « Ajouté ») <strong>et</strong> modifié des cellules existantes (surlignées en orange, marquées d\'un point ●). À valider avec iPropre avant signature.'
        : hasClientAdditions
          ? 'Cette soumission contient des lignes ajoutées par le client (badges « Ajouté » + tarifs « À confirmer » en rouge). À valider avec iPropre avant signature.'
          : 'Le client a modifié certaines cellules de la soumission originale (surlignées en orange, marquées d\'un point ●). À valider avec iPropre avant signature.'}
    </div>
  </div>` : ''}

  <h2>Détail de la soumission</h2>
  ${sectionsHtml}

  <h2>Tarification</h2>
  ${pricesHtml}

  ${state.selectedPlan != null ? `
  <div class="highlight">
    <div>
      <div class="l">Plan retenu</div>
      <div class="v">${esc(plan.label)}</div>
    </div>
    <div style="text-align:right">
      <div class="l">Prix total</div>
      <div class="v">${esc(price || '—')} $ <span style="font-size:12px;color:#7c5300;font-family:'Inter',sans-serif;font-weight:500">/ mois + tx</span></div>
    </div>
  </div>` : `
  <div style="margin-top:14px;padding:16px 18px;background:#f4f6fc;border:1px solid #c9d3eb;border-radius:8px;font-size:13px;color:#2c3e50;line-height:1.6">
    <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#1a2540;margin-bottom:4px">${visiblePlans.length} options à comparer</div>
    Cette soumission présente plusieurs offres. Sélectionnez celle qui vous convient le mieux et faites-le-nous savoir : nous serons ravis d'en discuter avec vous.
  </div>`}

  <div style="margin-top:18px;padding:14px 16px;background:#f7f5ef;border-radius:8px;font-size:11.5px;color:#555;line-height:1.6">
    <strong style="color:#111">Nos garanties :</strong> Produits biologiques certifiés · Accord de confidentialité · Assurance civile 5 M$ · Résolution en 30 min · 70 points de contrôle et d'inspection.
  </div>

  <div class="footer">
    iPropre · (Performance + Fiabilité) × Développement<br/>
    La propreté, c'est notre promesse. · Document généré le ${today}
  </div>
</div>
</body></html>`;
}

// ---- COMPACT HTML builder for DOCX / contract attachment (2-3 pages max) ----
// Differs from buildPrintableHtml: tight margins, smaller header (1/4 page),
// wider service column (~55%), tighter table padding, no decorative gradients.
function buildCompactDocxHtml(state, form, initialSnapshot, shortUrl) {
  form = form || {};
  const logoSrc = (typeof window !== 'undefined' && window.IPROPRE_LOGO_B64) || '';
  const hiddenPlans = state.hiddenPlans || [];
  const visiblePlans = PLAN_DEFS.map((p, i) => ({ p, i })).filter(({ i }) => !hiddenPlans.includes(i));
  const plan = PLAN_DEFS[state.selectedPlan];
  const price = state.prices[state.selectedPlan];
  const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const today = new Date().toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' });

  // Wider service column for clear descriptions
  const planColW = `${(45 / Math.max(visiblePlans.length, 1)).toFixed(2)}%`;
  const COLW = { label: '55%', plan: planColW };

  const hasClientAdditions = state.sections.some(sec => sec.rows.some(r => r.clientAdded));

  const sectionsHtml = state.sections.map((sec) => {
    const rows = sec.rows.map((r) => {
      const isAdded = !!r.clientAdded;
      const labelHtml = isAdded
        ? `[AJOUTÉ] ${esc(r.label) || '—'}`
        : `${esc(r.label) || '—'}`;
      return `<tr>
        <td style="padding:3px 6px;border:1px solid #d0d0d0;font-size:9.5pt;${isAdded?'background:#fff4da;':''}">${labelHtml}</td>
        ${visiblePlans.map(({ p, i: pi }) => {
          const isSel = pi === state.selectedPlan;
          const val = r.v[pi] || '—';
          const isEmptyAdded = isAdded && !r.v[pi];
          const style = isEmptyAdded
            ? 'color:#c0392b;font-style:italic;'
            : isSel ? 'background:#fff4da;font-weight:600;' : '';
          return `<td style="padding:3px 4px;border:1px solid #d0d0d0;text-align:center;font-size:9pt;${style}">${isEmptyAdded?'À discuter':esc(val)}</td>`;
        }).join('')}
      </tr>`;
    }).join('');
    return `<div style="margin:8px 0 6px;page-break-inside:avoid">
      <div style="font-family:Georgia,serif;font-size:11pt;font-weight:700;color:#111;margin:6px 0 3px;border-left:3px solid #F4A51C;padding-left:6px">${esc(sec.title)}</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <colgroup>
          <col style="width:${COLW.label}" />
          ${visiblePlans.map(() => `<col style="width:${COLW.plan}" />`).join('')}
        </colgroup>
        <thead><tr style="background:#f0f0f0">
          <th style="padding:3px 6px;border:1px solid #d0d0d0;text-align:left;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Description du service</th>
          ${visiblePlans.map(({ p, i: pi }) => {
            const isSel = pi === state.selectedPlan;
            return `<th style="padding:3px 4px;border:1px solid #d0d0d0;text-align:center;font-size:8.5pt;font-weight:700;${isSel?'background:#F4A51C;color:#fff':''}">${esc(p.label)}${isSel?' ✓':''}</th>`;
          }).join('')}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  const pricesHtml = `<table style="width:100%;border-collapse:collapse;margin-top:6px;table-layout:fixed">
    <colgroup>
      <col style="width:${COLW.label}" />
      ${visiblePlans.map(() => `<col style="width:${COLW.plan}" />`).join('')}
    </colgroup>
    <tr style="background:#111;color:#fff">
      <td style="padding:5px 8px;font-family:Georgia,serif;font-size:11pt;font-weight:700">Prix mensuel (taxes en sus)</td>
      ${visiblePlans.map(({ p, i: pi }) => {
        const isSel = pi === state.selectedPlan;
        const px = state.prices[pi];
        return `<td style="padding:5px 4px;text-align:center;font-family:Georgia,serif;font-size:${px?'12pt':'9.5pt'};font-weight:700;${!px?'background:#fff5f3;color:#c0392b':isSel?'background:#F4A51C;color:#1a1208':'background:#fafaf6;color:#333'}">${px ? esc(px) + ' $' : 'À confirmer'}</td>`;
      }).join('')}
    </tr>
  </table>`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Soumission iPropre — ${esc(form.company || form.clientName || 'Client')}</title>
<style>
  @page { size: Letter; margin: 12mm 12mm 14mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:Georgia,'Times New Roman',serif; color:#111; font-size:10pt; line-height:1.35; }
  table { border-collapse:collapse; }
  h2 { font-family:Georgia,serif; font-size:13pt; margin:12px 0 5px; font-weight:700; color:#111; border-bottom:1.5px solid #F4A51C; padding-bottom:2px }
</style>
</head><body>

<!-- COMPACT HEADER : 1 row with logo, brand block, meta — ~1/4 page max -->
<table style="width:100%;border-collapse:collapse;border-bottom:2px solid #F4A51C;margin-bottom:8px">
  <tr>
    ${logoSrc ? `<td style="padding:6px 10px 6px 0;vertical-align:middle;width:70px">
      <img src="${logoSrc}" alt="iPropre" style="height:60px;width:auto;display:block" />
    </td>` : ''}
    <td style="padding:6px 0;vertical-align:middle">
      <div style="font-family:Georgia,serif;font-size:20pt;font-weight:700;letter-spacing:-0.02em;line-height:1">i<span style="color:#F4A51C">Propre</span></div>
      <div style="font-size:8pt;color:#666;margin-top:1px">3095 A. Jean-Noël-Lavoie, Bureau 202, Laval QC H7P 4W5 · +1 (819) 995-2414 · www.ipropre.ca</div>
    </td>
    <td style="padding:6px 0;vertical-align:middle;text-align:right;font-size:9pt;color:#444;width:140px">
      <div style="font-family:Georgia,serif;font-size:11pt;font-weight:700;color:#111">N° ${Date.now().toString().slice(-6)}</div>
      <div>Date : ${today}</div>
      <div style="color:#F4A51C;font-size:8pt;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-top:1px">Valide 30 jours</div>
    </td>
  </tr>
</table>

${shortUrl ? `
<!-- ONLINE CONSULTATION LINK BUTTON (compact, no inline URL) -->
<table style="width:100%;border-collapse:collapse;margin-bottom:10px">
  <tr>
    <td style="padding:0">
      <a href="${esc(shortUrl)}" style="display:inline-block;text-decoration:none;background:#F4A51C;color:#fff;padding:8px 18px;border-radius:6px;font-family:Georgia,serif;font-size:10.5pt;font-weight:700;border:2px solid #F4A51C">
        🔗 Consulter la soumission en ligne
      </a>
      <span style="display:inline-block;margin-left:10px;font-size:8.5pt;color:#888;vertical-align:middle">version interactive (lecture seule)</span>
    </td>
  </tr>
</table>` : ''}

<!-- COMPACT CLIENT BOX : 1 row, 5 columns -->
<table style="width:100%;border-collapse:collapse;background:#fafaf6;border:1px solid #e0e0e0;margin-bottom:8px;table-layout:fixed">
  <tr>
    <td style="padding:5px 8px;vertical-align:top;border-right:1px solid #e0e0e0;width:20%">
      <div style="font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Contact</div>
      <div style="font-size:10pt;font-weight:600">${esc(form.clientName) || '—'}</div>
    </td>
    <td style="padding:5px 8px;vertical-align:top;border-right:1px solid #e0e0e0;width:25%">
      <div style="font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Entreprise</div>
      <div style="font-size:10pt;font-weight:600">${esc(form.company) || '—'}</div>
    </td>
    <td style="padding:5px 8px;vertical-align:top;border-right:1px solid #e0e0e0;width:25%">
      <div style="font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Courriel</div>
      <div style="font-size:9.5pt;font-weight:600">${esc(form.email) || '—'}</div>
    </td>
    <td style="padding:5px 8px;vertical-align:top;width:30%">
      <div style="font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Téléphone</div>
      <div style="font-size:10pt;font-weight:600">${esc(form.phone) || '—'}</div>
    </td>
  </tr>
  <tr>
    <td colspan="4" style="padding:5px 8px;border-top:1px solid #e0e0e0">
      <span style="font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Adresse du service&nbsp;:</span>
      <span style="font-size:10pt;font-weight:600">${esc(form.address) || '—'}</span>
    </td>
  </tr>
</table>

<h2>Détail de la soumission</h2>
${sectionsHtml}

<h2>Tarification</h2>
${pricesHtml}

${state.selectedPlan != null ? `
<table style="width:100%;border-collapse:collapse;margin-top:6px;background:#fff4da;border:1px solid #f0d17a">
  <tr>
    <td style="padding:6px 10px;font-size:8.5pt;color:#7c5300;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">Plan retenu</td>
    <td style="padding:6px 10px;font-family:Georgia,serif;font-size:12pt;font-weight:700;color:#1a1208;text-align:right">${esc(plan.label)} — ${esc(price || '—')} $ / mois + tx</td>
  </tr>
</table>` : ''}

<div style="margin-top:8px;padding:6px 10px;background:#f7f5ef;font-size:8.5pt;color:#444;line-height:1.4">
  <strong style="color:#111">Nos garanties :</strong> Produits biologiques certifiés · Accord de confidentialité · Assurance civile 5 M$ · Résolution en 30 min · 70 points de contrôle.
</div>

<div style="margin-top:6px;font-size:7.5pt;color:#888;text-align:center;border-top:1px solid #eee;padding-top:4px">
  iPropre · La propreté, c'est notre promesse. · Document généré le ${today}
</div>

</body></html>`;
}

Object.assign(window, { buildCompactDocxHtml });

// ---- Phone formatting & validation ----
// Accepts only digits, formats as "xxx xxx xxxx" while typing.
// Optional extension after "#" (e.g. "514 555 1234 #123") — typed by user.
function formatPhone(raw) {
  const s = String(raw || '');
  const hashIdx = s.indexOf('#');
  const mainPart = hashIdx >= 0 ? s.slice(0, hashIdx) : s;
  const extPart = hashIdx >= 0 ? s.slice(hashIdx + 1) : '';

  const d = mainPart.replace(/\D/g, '').slice(0, 10);
  let main = '';
  if (d.length <= 3) main = d;
  else if (d.length <= 6) main = d.slice(0, 3) + ' ' + d.slice(3);
  else main = d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);

  if (hashIdx >= 0) {
    const ext = extPart.replace(/\D/g, '').slice(0, 8);
    return main + ' #' + ext;
  }
  return main;
}
function isValidPhone(s) {
  return /^\d{3} \d{3} \d{4}( #\d+)?$/.test(String(s || '').trim());
}

const ENVOI_FORM_KEY_PREFIX = 'ipropre.envoi.form.v2.';
const ENVOI_FORM_KEY_LEGACY = 'ipropre.envoi.form.v1';
const NEW_SUFFIX = '__new__';
const DEFAULT_MESSAGE = "Bonjour,\n\nVoici la soumission personnalisée que nous avons préparée pour vous. Vous trouverez ci-joint le PDF détaillé avec nos services et les options tarifaires.\n\nSi vous avez la moindre question, n'hésitez pas à nous contacter — ce serait un plaisir d'en discuter avec vous.\n\nCordialement,\nIdriss Sassi — iPropre\n+1 (819) 995-2414";

// ---- Per-soumission form helpers (exposed globally so app.jsx can clear/migrate) ----
function envoiFormKey(soumissionId) {
  return ENVOI_FORM_KEY_PREFIX + (soumissionId || NEW_SUFFIX);
}
function loadEnvoiForm(soumissionId) {
  try {
    const key = envoiFormKey(soumissionId);
    let raw = localStorage.getItem(key);
    // Migrate the old global key into the "new soumission" slot on first run
    if (!raw && !soumissionId) {
      const legacy = localStorage.getItem(ENVOI_FORM_KEY_LEGACY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        localStorage.removeItem(ENVOI_FORM_KEY_LEGACY);
        raw = legacy;
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        clientName: parsed.clientName || '',
        company: parsed.company || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
        message: parsed.message || DEFAULT_MESSAGE,
      };
    }
  } catch (e) {}
  return { clientName:'', company:'', email:'', phone:'', address:'', message: DEFAULT_MESSAGE };
}
function clearEnvoiNewForm() {
  try { localStorage.removeItem(envoiFormKey(null)); } catch (e) {}
}
// Read whatever form is currently active for a given soumission id — used by app.jsx
// for the top-bar "Offre en PDF" button which doesn't render EnvoiPage.
function readEnvoiForm(soumissionId) {
  return loadEnvoiForm(soumissionId);
}
Object.assign(window, { clearEnvoiNewForm, readEnvoiForm });

// ---- Auto-download PDF using html2pdf (no print dialog) ----
async function autoDownloadPdf(state, form, initialSnapshot) {
  if (typeof window.html2pdf !== 'function') return false;
  const full = buildPrintableHtml(state, form, initialSnapshot);

  const styleMatch = full.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyMatch = full.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const css = styleMatch ? styleMatch[1] : '';
  let bodyHtml = bodyMatch ? bodyMatch[1] : full;
  bodyHtml = bodyHtml.replace(/<div class=\"no-print\"[\s\S]*?<\/div>/i, '');

  // Naive but adequate CSS scoper — prefixes every non-@ selector with #ipropre-pdf-wrap
  // so the temporarily-injected styles don't bleed onto the live app.
  const scopeCss = (rawCss, scope) => {
    return rawCss.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sels, body) => {
      const trimmed = sels.trim();
      if (!trimmed || trimmed.startsWith('@')) return m;
      const scopedSels = trimmed.split(',').map(s => {
        const sel = s.trim();
        if (!sel) return sel;
        if (/^(html|body|\*)$/.test(sel)) return scope;
        if (/^(html|body)\b/.test(sel)) return scope + sel.replace(/^(html|body)\b/, '');
        return scope + ' ' + sel;
      }).join(', ');
      return scopedSels + '{' + body + '}';
    });
  };

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-ipropre-pdf', '1');
  styleEl.textContent = scopeCss(css, '#ipropre-pdf-wrap');
  document.head.appendChild(styleEl);

  const wrap = document.createElement('div');
  wrap.id = 'ipropre-pdf-wrap';
  // Keep on-screen but invisible — html2canvas needs the element to be laid out.
  wrap.style.cssText = 'position:fixed;left:-99999px;top:0;width:820px;background:#fff;color:#111;';
  wrap.innerHTML = bodyHtml;
  document.body.appendChild(wrap);

  // Let fonts and images settle.
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  await new Promise(r => setTimeout(r, 250));

  const safeName = (form.company || form.clientName || 'client').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) || 'client';
  const stamp = new Date().toLocaleDateString('fr-CA').replace(/-/g, '');
  const filename = `Soumission iPropre - ${safeName} - ${stamp}.pdf`;

  let ok = false;
  try {
    await window.html2pdf().from(wrap).set({
      margin: [10, 10, 12, 10],
      filename,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }).save();
    ok = true;
  } catch (e) {
    console.error('autoDownloadPdf failed', e);
  } finally {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  }
  return ok;
}

// ---- Standalone contacts (saved manually, no envoi required) ----
// Synced to Google Sheets when available (cross-device sharing).
const STANDALONE_CONTACTS_KEY = 'ipropre.contacts.v1';
function loadStandaloneContacts() {
  try {
    const raw = localStorage.getItem(STANDALONE_CONTACTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function persistStandaloneContacts(list) {
  try { localStorage.setItem(STANDALONE_CONTACTS_KEY, JSON.stringify(list)); } catch (e) {}
}
// Build a dedup key for a contact — email if present, else name+company.
function contactKey(c) {
  return (c.email || '').toLowerCase().trim()
    || (((c.clientName||'') + '|' + (c.company||'')).toLowerCase().trim());
}
// Returns: false on failure, { updated: true } if an existing contact was
// merged/updated, { created: true } if a new contact was added.
function saveStandaloneContact(c) {
  const list = loadStandaloneContacts();
  const dedupKey = contactKey(c);
  if (!dedupKey) return false;
  const idx = list.findIndex(x => contactKey(x) === dedupKey);
  // Reuse existing id if found, otherwise generate a fresh one
  const id = (idx >= 0 && list[idx].id) ? list[idx].id : ('c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6));
  const entry = {
    id,
    clientName: c.clientName || '',
    company: c.company || '',
    email: c.email || '',
    phone: c.phone || '',
    address: c.address || '',
    updatedAt: Date.now(),
  };
  if (idx >= 0) list[idx] = entry; else list.unshift(entry);
  persistStandaloneContacts(list);
  // Fire-and-forget push to Google Sheets (cross-device sync)
  if (window.repo && window.repo.Contacts) {
    window.repo.Contacts.save({ ...entry, updatedAt: new Date(entry.updatedAt).toISOString() }).catch(() => {});
  }
  return idx >= 0 ? { updated: true } : { created: true };
}
// Pull contacts from Google Sheets, merge with local — newer updatedAt wins per id.
async function syncContactsFromCloud() {
  if (!window.repo || !window.repo.Contacts) return null;
  try {
    const remote = await window.repo.Contacts.list();
    if (!Array.isArray(remote)) return null;
    const local = loadStandaloneContacts();
    const merged = new Map();
    // Index by dedup key — id from sheet, fallback to dedup
    const tsOf = (x) => {
      const v = x.updatedAt;
      if (!v) return 0;
      if (typeof v === 'number') return v;
      const t = Date.parse(v); return isNaN(t) ? 0 : t;
    };
    for (const c of local) {
      const k = contactKey(c) || c.id;
      if (!k) continue;
      merged.set(k, { ...c, updatedAt: tsOf(c) });
    }
    for (const r of remote) {
      const k = contactKey(r) || r.id;
      if (!k) continue;
      const existing = merged.get(k);
      const rEntry = {
        id: r.id || ('c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6)),
        clientName: r.clientName || '',
        company: r.company || '',
        email: r.email || '',
        phone: r.phone || '',
        address: r.address || '',
        updatedAt: tsOf(r),
      };
      if (!existing || tsOf(rEntry) >= tsOf(existing)) merged.set(k, rEntry);
    }
    const out = Array.from(merged.values()).filter(c => c.clientName || c.company || c.email || c.phone);
    out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    persistStandaloneContacts(out);
    return out;
  } catch (e) {
    return null;
  }
}
Object.assign(window, { loadStandaloneContacts, saveStandaloneContact, syncContactsFromCloud });

// ---- Load all saved contacts from per-soumission envoi-form slots ----
// Returns a deduped list (by email, then by name+company) so the user can
// quickly look up a previous client and pre-fill the form.
function loadAllSavedContacts() {
  const out = [];
  const seen = new Set();
  const push = (c) => {
    const hasAny = c.clientName || c.company || c.email || c.phone;
    if (!hasAny) return;
    const dedupKey = (c.email || '').toLowerCase().trim()
      || (((c.clientName||'') + '|' + (c.company||'')).toLowerCase().trim());
    if (!dedupKey || seen.has(dedupKey)) return;
    seen.add(dedupKey);
    out.push({
      clientName: c.clientName || '',
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
    });
  };
  // Standalone (manually saved) contacts first — they're explicitly curated.
  try { loadStandaloneContacts().forEach(push); } catch (e) {}
  // Then auto-collected envoi forms.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key.indexOf(ENVOI_FORM_KEY_PREFIX) !== 0) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        if (parsed) push(parsed);
      } catch (e) {}
    }
  } catch (e) {}
  out.sort((a, b) => (a.company || a.clientName || '').localeCompare(b.company || b.clientName || '', 'fr'));
  return out;
}
Object.assign(window, { loadAllSavedContacts });

// EnvoiPage component
function EnvoiPage({ state, pushToast, onLogout, sentLinks, gsheet, soumissionMeta, isDirty, lastPdfUrl, onGoToSoumission }) {
  const currentSoumId = soumissionMeta?.id || '';
  // Load persisted form keyed by the current soumission id (or the "new" slot).
  const [form, setForm] = React.useState(() => loadEnvoiForm(currentSoumId));
  const [sent, setSent] = React.useState(false);
  const lastSoumIdRef = React.useRef(currentSoumId);

  // When switching soumissions (id changes), reload that soumission's form.
  // Special case: when a brand-new soumission gets saved for the first time
  // (prev id was empty → now has an id), migrate the "__new__" form data
  // into the new id's slot so the contact info typed before saving sticks.
  React.useEffect(() => {
    if (lastSoumIdRef.current !== currentSoumId) {
      const prevId = lastSoumIdRef.current;
      lastSoumIdRef.current = currentSoumId;
      if (!prevId && currentSoumId) {
        try {
          const newSlotRaw = localStorage.getItem(envoiFormKey(null));
          const targetRaw = localStorage.getItem(envoiFormKey(currentSoumId));
          if (newSlotRaw && !targetRaw) {
            localStorage.setItem(envoiFormKey(currentSoumId), newSlotRaw);
            localStorage.removeItem(envoiFormKey(null));
          }
        } catch (e) {}
      }
      setForm(loadEnvoiForm(currentSoumId));
      setSent(false);
    }
  }, [currentSoumId]);

  // Persist form on every change — under the current soumission's key.
  React.useEffect(() => {
    try { localStorage.setItem(envoiFormKey(currentSoumId), JSON.stringify(form)); } catch (e) {}
  }, [form, currentSoumId]);

  const hiddenPlans = state.hiddenPlans || [];
  const visiblePlanIndices = PLAN_DEFS.map((_, i) => i).filter(i => !hiddenPlans.includes(i));
  const hasSelected = state.selectedPlan != null;
  const plan = hasSelected ? PLAN_DEFS[state.selectedPlan] : null;
  const price = hasSelected ? state.prices[state.selectedPlan] : null;

  // Build the email body with the 3 (visible) prices, bold + UPPERCASE on the chosen one.
  // linkMode: 'edit' | 'readonly' | 'none' — controls which link block is appended.
  const buildEmailBody = (linkMode = 'edit', linkUrl = null) => {
    const lines = visiblePlanIndices.map(i => {
      const p = PLAN_DEFS[i];
      const px = state.prices[i] || '—';
      const isSel = i === state.selectedPlan;
      if (isSel) {
        return `  → *${p.label.toUpperCase()} : ${px} $/MOIS*  — VOTRE CHOIX`;
      }
      return `    ${p.label} : ${px} $/mois`;
    }).join('\n');

    const optionsBlock = hasSelected
      ? `Voici les options présentées, votre choix est mis en évidence :\n\n${lines}\n`
      : `Voici les ${visiblePlanIndices.length} options à comparer :\n\n${lines}\n\nFaites-nous savoir laquelle vous préférez — nous sommes là pour en discuter.`;

    let linkBlock = '';
    if (linkMode === 'edit') {
      const url = linkUrl || buildLongUrl(undefined, { editable: true });
      if (url) {
        linkBlock = `\n────────────────────────────────────\nVOIR & MODIFIER LA SOUMISSION EN LIGNE :\n${url}\n\n(Ce lien vous permet d'ajuster les colonnes, ajouter des lignes ou changer de plan ; les cellules modifiées apparaîtront surlignées dans le PDF que vous téléchargerez.)\n`;
      }
    } else if (linkMode === 'readonly') {
      const url = linkUrl || buildLongUrl(undefined, { editable: false });
      if (url) {
        linkBlock = `\n────────────────────────────────────\nCONSULTER LA SOUMISSION EN LIGNE :\n${url}\n\n(Ce lien vous permet de consulter et imprimer la soumission en ligne — version lecture seule.)\n`;
      }
    }

    return `${form.message}\n\n────────────────────────────────────\n${optionsBlock}${linkBlock}────────────────────────────────────\n\nPour me répondre directement : idriss@ipropre.ca\n\n(Le PDF détaillé est joint à ce courriel.)`;
  };

  const buildMailtoUrl = (linkMode = 'edit', linkUrl = null) => {
    const subject = encodeURIComponent(`Soumission iPropre — ${form.company || form.clientName || 'votre entreprise'}`);
    const body = encodeURIComponent(buildEmailBody(linkMode, linkUrl));
    const cc = encodeURIComponent('idriss@ipropre.ca');
    return `mailto:${form.email}?cc=${cc}&subject=${subject}&body=${body}`;
  };

  const openPdfWindow = () => {
    const w = window.open('', '_blank');
    if (!w) { pushToast('Débloquer les pop-ups pour générer le PDF'); return; }
    w.document.open();
    w.document.write(buildPrintableHtml(state, form));
    w.document.close();
    pushToast('PDF prêt — utilisez Imprimer / Enregistrer');
  };

  // Validate all required client fields before allowing PDF/email
  const validateClient = () => {
    const missing = [];
    if (!form.clientName.trim()) missing.push('Contact');
    if (!form.company.trim()) missing.push('Entreprise');
    if (!form.email.trim()) missing.push('Courriel');
    if (!form.phone.trim()) missing.push('Téléphone');
    if (!form.address.trim()) missing.push('Adresse du service');
    if (missing.length) {
      pushToast('Champs requis : ' + missing.join(', '));
      return false;
    }
    if (!isValidPhone(form.phone)) {
      pushToast('Téléphone invalide — format : xxx xxx xxxx (extension optionnelle : #poste)');
      return false;
    }
    return true;
  };

  const handleSend = (e) => {
    e.preventDefault();
    // Default form submit → "email + editable link" (same as primary button)
    sendWithLink('edit');
  };

  // Unified send flow:
  // 1) validate client info
  // 2) open the print window so the user can save the PDF (reliable across browsers)
  // 3) try to shorten the chosen link
  // 4) open the user's mail app with the link pre-embedded in the body
  const [sending, setSending] = React.useState(false);
  const sendWithLink = async (linkMode /* 'edit' | 'readonly' */) => {
    if (sending) return;
    if (!validateClient()) return;
    setSending(true);
    try {
      // 1) open the print window — proven to render the full styled PDF
      pushToast('Ouverture du PDF…');
      openPdfWindow();

      // 2) Generate the internal short link (server-stored ID).
      const editable = linkMode === 'edit';
      const finalUrl = await createShortLink(editable);
      if (!finalUrl) {
        pushToast('Erreur lors de la génération du lien');
        return;
      }

      // 3) record the sent link
      const referenceUrl = buildLongUrl(undefined, { editable }); // for tracking only
      await recordSentLink({ url: referenceUrl, shortUrl: finalUrl !== referenceUrl ? finalUrl : '' });

      // 4) open the mail client with link + body
      setTimeout(() => { window.location.href = buildMailtoUrl(linkMode, finalUrl); }, 400);
      setSent(true);
      pushToast(linkMode === 'edit'
        ? '✓ PDF ouvert (à enregistrer) + courriel avec lien formulaire'
        : '✓ PDF ouvert (à enregistrer) + courriel avec lien lecture seule');
    } finally {
      setSending(false);
    }
  };

  const handlePdfOnly = () => {
    if (!validateClient()) return;
    openPdfWindow();
    pushToast('PDF ouvert — utilisez Imprimer / Enregistrer');
  };

  const handleMailto = () => {
    if (!form.email) { pushToast('Veuillez saisir un courriel'); return; }
    window.location.href = buildMailtoUrl('edit');
  };

  const [shortening, setShortening] = React.useState(false);

  // We attach a linkId to every generated client URL so it can be revoked later.
  // The linkId stays the same as long as we're on this Envoi screen — clicking
  // "Copier" twice doesn't create a duplicate entry; sending generates one.
  const [pendingLinkId, setPendingLinkId] = React.useState(() => (window.makeLinkId ? window.makeLinkId() : 'L' + Date.now()));

  // Build a client URL: encode the soumission state directly in the URL
  // (`?mode=client&data=…`), then shorten via is.gd/v.gd/tinyurl. No backend
  // needed — the URL itself carries everything, so it stays valid forever and
  // resolves instantly (just an HTTP redirect, like the legacy is.gd links).
  // Returns the short URL when shortening succeeds, or the long URL otherwise.
  const createShortLink = async (editable, linkIdOverride) => {
    const longUrl = buildLongUrl(linkIdOverride, { editable });
    if (!longUrl) return null;
    console.log('[iPropre] createShortLink v2 (is.gd/tinyurl) — long URL length:', longUrl.length);
    const shortUrl = await shortenUrl(longUrl);
    console.log('[iPropre] createShortLink result:', shortUrl || longUrl);
    return shortUrl || longUrl;
  };

  // Legacy long-URL builder kept for previews and email body fallback.
  const buildLongUrl = (linkIdOverride, opts = {}) => {
    if (typeof window.encodeStateToUrl !== 'function') return null;
    const encoded = window.encodeStateToUrl(state, form.clientName || form.company || '');
    if (!encoded) return null;
    const linkId = linkIdOverride || pendingLinkId;
    const editParam = opts.editable ? '&edit=1' : '';
    return `${location.origin}${location.pathname}?mode=client&data=${encoded}&lid=${linkId}${editParam}`;
  };

  // Record that we sent a link, optionally push to Google Sheets.
  const recordSentLink = async ({ url, shortUrl }) => {
    if (!sentLinks) return;
    const entry = {
      linkId: pendingLinkId,
      sentAt: Date.now(),
      clientName: form.clientName || '',
      company: form.company || '',
      email: form.email || '',
      url, shortUrl: shortUrl || '',
      revoked: false,
    };
    sentLinks.record(entry);
    // Rotate the pending id for the next send
    if (window.makeLinkId) setPendingLinkId(window.makeLinkId());

    // Push to Google Sheets (silently — local link tracking is the source of truth).
    if (gsheet && gsheet.url) {
      const soumissionId = (soumissionMeta && soumissionMeta.id) || '';
      // Track the link in the LiensEnvoyes tab
      gsheet.recordLien({ linkId: entry.linkId, soumissionId, destinataire: form.email || '' });
      // Record the email send in the Envois tab — reuse the already-uploaded PDF
      // (the Save flow uploaded it; we don't re-generate here to avoid duplicates).
      gsheet.recordEnvoi({
        soumissionId,
        type: 'premier',
        destinataire: form.email || '',
        objet: `Soumission iPropre — ${form.company || form.clientName || ''}`,
        linkId: entry.linkId,
        notes: shortUrl || url || '',
        pdfUrl: lastPdfUrl || '',
      });
    }
  };

  // Try multiple shortener services in order — first one that succeeds wins.
  // PRIMARY: server-side via Apps Script (UrlFetchApp.fetch on is.gd → no CORS
  // problem because the response comes from our own backend).
  // FALLBACK: direct calls + corsproxy.io if Apps Script is unreachable.
  const shortenUrl = async (longUrl) => {
    if (!longUrl) return null;

    // 1) Server-side via Apps Script — best path, returns clean is.gd links.
    if (window.repo && window.repo.Shortener) {
      try {
        const result = await window.repo.Shortener.shorten(longUrl);
        if (result && result.shortUrl) {
          console.log('[iPropre] Shortener (server-side ' + (result.service || '?') + '):', result.shortUrl);
          return result.shortUrl;
        }
      } catch (e) {
        console.warn('[iPropre] Server-side shortener failed, falling back:', e);
      }
    }

    // 2) Fallback: direct calls via public CORS proxy
    const proxied = [
      `https://corsproxy.io/?url=${encodeURIComponent('https://is.gd/create.php?format=json&url=' + encodeURIComponent(longUrl))}`,
      `https://corsproxy.io/?url=${encodeURIComponent('https://v.gd/create.php?format=json&url=' + encodeURIComponent(longUrl))}`,
    ];
    for (const api of proxied) {
      try {
        const resp = await fetch(api);
        const data = await resp.json();
        if (data && data.shorturl) return data.shorturl;
      } catch (e) {}
    }

    // 3) Last resort: TinyURL direct (still works without CORS proxy, but
    //    now forces a /preview/ interstitial with ads — only use if all else
    //    failed).
    try {
      const resp = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      const text = await resp.text();
      if (text && text.startsWith('http')) return text.trim();
    } catch (e) {}

    return null;
  };

  // Fallback copy: works AFTER an async/await (the user-gesture context is
  // lost, so navigator.clipboard.writeText() can silently fail). execCommand
  // on a temporary textarea works in that case.
  const copyToClipboardSync = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) { return false; }
  };

  const copyToClipboard = (text, successMsg) => {
    // 1) Try the sync execCommand path first — it works whether or not the
    //    user-gesture context is still active. This is what fixes the
    //    "I have to click 2-3 times" bug after the async shortener call.
    if (copyToClipboardSync(text)) {
      pushToast(successMsg);
      return;
    }
    // 2) Modern async path as fallback (some browsers prefer it).
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => pushToast(successMsg),
        () => { window.prompt('Copiez ce lien :', text); }
      );
    } else {
      window.prompt('Copiez ce lien :', text);
    }
  };

  const handleCopyClientLink = async () => {
    setShortening(true);
    pushToast('Génération du lien court…');
    const url = await createShortLink(true);
    setShortening(false);
    if (!url) { pushToast('Erreur lors de la génération du lien'); return; }
    copyToClipboard(url, `Lien client copié : ${url}`);
    const reference = buildLongUrl(undefined, { editable: true });
    recordSentLink({ url: reference, shortUrl: url !== reference ? url : '' });
  };

  const handleCopyLongLink = () => {
    const url = buildLongUrl(undefined, { editable: true });
    if (!url) { pushToast('Erreur lors de l\'encodage'); return; }
    copyToClipboard(url, 'Lien long copié');
    recordSentLink({ url });
  };

  const handleOpenClientPreview = async () => {
    const url = await createShortLink(true);
    if (!url) { pushToast('Erreur lors de la génération du lien'); return; }
    window.open(url, '_blank');
  };

  const handleCopyReadOnlyLink = async () => {
    setShortening(true);
    pushToast('Génération du lien court…');
    const url = await createShortLink(false);
    setShortening(false);
    if (!url) { pushToast('Erreur lors de la génération du lien'); return; }
    copyToClipboard(url, `Lien lecture seule copié : ${url}`);
  };

  if (sent) {
    return (
      <div className="page active">
        <div className="card card-pad" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', padding: 48 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <Icon.check size={32} />
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 700, marginBottom: 10 }}>Soumission prête</div>
          <div style={{ color: 'var(--ip-muted)', marginBottom: 8, maxWidth: 460, margin: '0 auto 8px' }}>
            Le PDF s'est ouvert dans un nouvel onglet et votre application courriel s'ouvre avec <strong style={{ color: 'var(--ip-ink)' }}>{form.email}</strong> pré-rempli.
          </div>
          <div style={{ color: 'var(--ip-muted)', fontSize: 12.5, marginBottom: 28, fontStyle: 'italic' }}>
            Astuce : dans l'onglet PDF, faites « Enregistrer sous PDF », puis joignez-le au courriel.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-orange" onClick={openPdfWindow}>
              <Icon.download /> Re-générer le PDF
            </button>
            <button className="btn btn-ghost" onClick={handleMailto}>
              <Icon.mail /> Ré-ouvrir le courriel
            </button>
            <button className="btn btn-ghost" onClick={() => setSent(false)}>
              Modifier
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <span className="eyebrow">05 — Envoi</span>
          <h1>Envoyer la soumission.</h1>
          <p className="sub">Saisissez les coordonnées du client. Un PDF est généré avec tout le détail et votre application courriel s'ouvre pré-remplie.</p>
        </div>
        {onLogout && (
          <button type="button" className="btn btn-light" onClick={onLogout} title="Se déconnecter" style={{ alignSelf: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Se déconnecter
          </button>
        )}
      </div>

      <div className="envoi-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, position: 'relative' }}>
        {isDirty && <DirtyLockBanner onGoToSoumission={onGoToSoumission} />}
        {/* Form */}
        <form className="card card-pad" onSubmit={handleSend}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Coordonnées du client</div>
              <div style={{ color: 'var(--ip-muted)', fontSize: 13 }}>Ces champs sont repris en en-tête du PDF généré.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(() => {
                const k = contactKey(form);
                const isExisting = !!(k && loadStandaloneContacts().some(c => contactKey(c) === k));
                return (
              <button
                type="button"
                onClick={() => {
                  const hasAny = (form.clientName || form.company || form.email || form.phone || form.address);
                  if (!hasAny) { pushToast('Remplissez au moins un champ avant d\'enregistrer'); return; }
                  const res = saveStandaloneContact(form);
                  if (res && res.updated) pushToast('✓ Contact mis à jour');
                  else if (res && res.created) pushToast('✓ Contact enregistré');
                  else pushToast('Impossible d\'enregistrer ce contact');
                }}
                title={isExisting ? 'Mettre à jour ce contact existant' : 'Enregistrer ce contact comme nouveau'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', fontSize: 12.5,
                  border: '1px solid ' + (isExisting ? 'var(--ip-orange)' : 'var(--ip-line)'), borderRadius: 9,
                  background: isExisting ? 'rgba(244,165,28,0.10)' : '#fff', cursor: 'pointer',
                  color: 'var(--ip-ink)', fontWeight: isExisting ? 600 : 500,
                }}
              >
                {isExisting ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                )}
                {isExisting ? 'Mettre à jour' : 'Enregistrer ce contact'}
              </button>
                );
              })()}
              <ContactsPicker
                currentEmail={form.email}
                onPick={(c) => {
                  setForm(f => ({
                    ...f,
                    clientName: c.clientName || f.clientName,
                    company: c.company || f.company,
                    email: c.email || f.email,
                    phone: c.phone || f.phone,
                    address: c.address || f.address,
                  }));
                  pushToast(`Contact chargé : ${c.clientName || c.company || c.email}`);
                }}
              />
            </div>
          </div>
          <div style={{ height: 18 }} />

          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Nom du contact *" value={form.clientName} onChange={v => setForm(f => ({...f, clientName: v}))} placeholder="Jean Tremblay" required />
            <Field label="Entreprise *" value={form.company} onChange={v => setForm(f => ({...f, company: v}))} placeholder="ABC Immobilier inc." required />
            <Field label="Courriel *" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} type="email" placeholder="client@exemple.com" required />
            <Field
              label="Téléphone *"
              value={form.phone}
              onChange={v => setForm(f => ({...f, phone: formatPhone(v)}))}
              placeholder="514 000 0000  ou  514 000 0000 #123"
              required
              invalid={form.phone && !isValidPhone(form.phone)}
              hint={form.phone && !isValidPhone(form.phone) ? 'Format requis : xxx xxx xxxx  (extension optionnelle : # suivi du numéro de poste)' : null}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Adresse du service *" value={form.address} onChange={v => setForm(f => ({...f, address: v}))} placeholder="3095 Jean-Noël-Lavoie, Laval" required />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ip-muted)', marginBottom: 6 }}>
              Message d'accompagnement
            </label>
            <textarea
              className="txt-input"
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              rows={6}
              style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-orange" disabled={sending} style={{ opacity: sending ? 0.6 : 1 }}>
              {sending ? <React.Fragment><Icon.mail /> Envoi en cours…</React.Fragment> : <React.Fragment>✉️ Courriel + 📝 Formulaire</React.Fragment>}
            </button>
            <button type="button" className="btn btn-orange" onClick={() => sendWithLink('readonly')} disabled={sending} style={{ opacity: sending ? 0.6 : 1, background: '#5a4d3a' }}>
              {sending ? <React.Fragment><Icon.mail /> …</React.Fragment> : <React.Fragment>✉️ Courriel + 👁️ Lien Lecture</React.Fragment>}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handlePdfOnly} disabled={sending}>
              ⬇️ PDF
            </button>
          </div>
        </form>

        {/* Summary */}
        <aside className="card" style={{ overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: 100 }}>
          {/* Client link panel — primary action of this screen */}
          <div style={{ padding: '18px 18px 16px', background: 'linear-gradient(180deg, #fff8eb 0%, #fff 100%)', borderBottom: '1px solid var(--ip-line-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ip-muted)' }}>Aperçu pour votre client</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>Lien interactif</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', lineHeight: 1.5, marginBottom: 10 }}>
              Le client peut <strong style={{ color: 'var(--ip-ink)' }}>modifier toutes les cellules</strong>, ajouter des lignes ou choisir son plan. Les changements seront <strong style={{ color: '#7c5300' }}>surlignés en orange</strong> dans le PDF.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn btn-orange" onClick={handleCopyClientLink} style={{ fontSize: 11.5, flex: 1, justifyContent: 'center', padding: '8px 8px' }} disabled={shortening} title="Lien éditable — le client peut modifier les cellules">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {shortening ? '…' : 'Formulaire'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleCopyReadOnlyLink} style={{ fontSize: 11.5, flex: 1, justifyContent: 'center', padding: '8px 8px', background: '#fff' }} disabled={shortening} title="Lien lecture seule (sans édition)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Lecture seule
                </button>
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleOpenClientPreview} style={{ fontSize: 11, justifyContent: 'center', padding: '5px 8px' }}>
                <Icon.external /> Aperçu dans un nouvel onglet
              </button>
            </div>
          </div>
          <div style={{ padding: '14px 20px' }}>
            {hasSelected ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--ip-line-2)' }}>
                <span style={{ fontSize: 12, color: 'var(--ip-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{plan.label}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>{price || '—'} $</span>
              </div>
            ) : (
              <div style={{ padding: '4px 0 8px', borderBottom: '1px solid var(--ip-line-2)' }}>
                {visiblePlanIndices.map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--ip-muted)' }}>{PLAN_DEFS[i].label}</span>
                    <span style={{ fontWeight: 600 }}>{state.prices[i] || '—'} $</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ip-line-2)', fontSize: 12.5 }}>
              <span style={{ color: 'var(--ip-muted)' }}>Sections incluses</span>
              <span style={{ fontWeight: 600 }}>{state.sections.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12.5 }}>
              <span style={{ color: 'var(--ip-muted)' }}>Lignes totales</span>
              <span style={{ fontWeight: 600 }}>{state.sections.reduce((a, s) => a + s.rows.length, 0)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ContactsPicker({ currentEmail, onPick }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [contacts, setContacts] = React.useState([]);
  const [syncing, setSyncing] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    // Show local list immediately, then refresh from cloud in background
    setContacts(loadAllSavedContacts());
    let cancelled = false;
    setSyncing(true);
    syncContactsFromCloud().then(() => {
      if (!cancelled) setContacts(loadAllSavedContacts());
    }).finally(() => { if (!cancelled) setSyncing(false); });
    return () => { cancelled = true; };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c => (
      (c.clientName || '').toLowerCase().includes(q)
      || (c.company || '').toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q)
      || (c.phone || '').includes(q)
    ));
  }, [contacts, search]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Charger un contact enregistré"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', fontSize: 12.5,
          border: '1px solid var(--ip-line)', borderRadius: 9,
          background: open ? 'var(--ip-line-2)' : '#fff',
          cursor: 'pointer', color: 'var(--ip-ink)', fontWeight: 500,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Contacts enregistrés
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', color: 'var(--ip-muted)' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div
          className="contacts-picker-dropdown"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60,
            background: '#fff', border: '1px solid var(--ip-line)', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)', width: 320, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ip-line-2)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus
              className="txt-input"
              placeholder={`Rechercher dans ${contacts.length} contact${contacts.length > 1 ? 's' : ''}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: 12.5, flex: 1 }}
            />
            {syncing && (
              <span title="Synchronisation en cours…" style={{ display: 'inline-grid', placeItems: 'center', width: 24, height: 24 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ip-orange)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </span>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '22px 16px', fontSize: 12.5, color: 'var(--ip-muted)', textAlign: 'center', lineHeight: 1.55 }}>
                {contacts.length === 0
                  ? <React.Fragment>Aucun contact enregistré pour l'instant.<br/>Les contacts s'ajoutent automatiquement après un envoi.</React.Fragment>
                  : 'Aucun résultat'}
              </div>
            ) : (
              filtered.map((c, i) => {
                const isCurrent = (c.email || '').toLowerCase() === (currentEmail || '').toLowerCase() && c.email;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => { onPick(c); setOpen(false); setSearch(''); }}
                    style={{
                      all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box',
                      padding: '10px 14px', borderBottom: '1px solid var(--ip-line-2)',
                      background: isCurrent ? 'rgba(244,165,28,0.08)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'var(--ip-bg)'; }}
                    onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ip-ink)', lineHeight: 1.25, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.company || c.clientName || <em style={{ color: 'var(--ip-muted)' }}>Sans nom</em>}
                      {isCurrent && <span style={{ fontSize: 9.5, padding: '1px 6px', background: 'var(--ip-orange)', color: '#fff', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>actuel</span>}
                    </div>
                    {c.company && c.clientName && (
                      <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 2 }}>{c.clientName}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 3, fontFamily: 'var(--font-mono)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {c.email && <span>{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder, required, invalid, hint }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: invalid ? '#c0392b' : 'var(--ip-muted)', marginBottom: 6 }}>{label}</div>
      <input
        className="txt-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={invalid ? { borderColor: '#c0392b', boxShadow: '0 0 0 3px rgba(192,57,43,0.08)' } : undefined}
      />
      {hint && <div style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

Object.assign(window, { EnvoiPage, buildPrintableHtml });

function DirtyLockBanner({ onGoToSoumission }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(247, 244, 239, 0.92)',
      backdropFilter: 'blur(2px)',
      display: 'grid', placeItems: 'center',
      borderRadius: 12,
    }}>
      <div className="card card-pad" style={{ maxWidth: 480, textAlign: 'center', padding: 32, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff4e6', color: 'var(--ip-orange)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Modifications non enregistrées</div>
        <div style={{ color: 'var(--ip-muted)', fontSize: 13.5, lineHeight: 1.55, marginBottom: 20 }}>
          Vous avez modifié la soumission depuis le dernier enregistrement. Pour garantir que le PDF envoyé au client correspond exactement à ce qui est sauvegardé, retournez à l'onglet <strong style={{ color: 'var(--ip-ink)' }}>Soumission</strong> et cliquez <strong style={{ color: 'var(--ip-ink)' }}>Enregistrer</strong>.
        </div>
        {onGoToSoumission && (
          <button type="button" className="btn btn-orange" onClick={onGoToSoumission}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour à Soumission
          </button>
        )}
      </div>
    </div>
  );
}
