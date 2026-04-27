// Envoi — email sending step with PDF generation (opens a dedicated print window)

// Pure function — builds the printable HTML for any state + client form.
// Exposed globally so the top-level "Offre en PDF" button can call it too.
function buildPrintableHtml(state, form) {
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

    // Detect client modifications (rows with clientAdded: true)
    const hasClientAdditions = state.sections.some(sec => sec.rows.some(r => r.clientAdded));

    const sectionsHtml = state.sections.map(sec => {
      const rows = sec.rows.map(r => {
        const isAdded = !!r.clientAdded;
        const labelHtml = isAdded
          ? `<span style="display:inline-block;padding:2px 7px;background:#F4A51C;color:#fff;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:0.1em;text-transform:uppercase;border-radius:999px;margin-right:6px;vertical-align:middle">Ajouté</span>${esc(r.label) || '<span style="color:#bbb">—</span>'}`
          : `${esc(r.label) || '<span style="color:#bbb">—</span>'}`;
        return `
        <tr${isAdded ? ' style="background:rgba(244,165,28,0.05)"' : ''}>
          <td style="padding:9px 12px;border-bottom:1px solid #ededed;width:${COLW.label};vertical-align:middle;font-weight:500">${labelHtml}</td>
          ${visiblePlans.map(({ p, i: pi }) => {
            const isSel = pi === state.selectedPlan;
            const val = r.v[pi] || '—';
            // Empty values for client-added rows ⇒ red emphasis
            const isEmptyAdded = isAdded && !r.v[pi];
            return `<td style="padding:9px 12px;border-bottom:1px solid #ededed;text-align:center;width:${COLW.plan};vertical-align:middle;${isEmptyAdded?'color:#c0392b;font-style:italic':isSel?'background:#FFF4DA;font-weight:600;color:#111':'color:#555'}">${isEmptyAdded ? 'À discuter' : esc(val)}</td>`;
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
  @page { size: Letter; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; font-family:'Inter',system-ui,sans-serif; color:#111; background:#fff; font-size:12.5px; line-height:1.5; }
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
  @media print { .no-print { display:none !important; } }
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

  ${hasClientAdditions ? `
  <div style="margin:14px 0 18px;padding:14px 16px;background:#fff5f3;border:1.5px solid #e87a6c;border-radius:8px;display:flex;align-items:center;gap:12px;page-break-inside:avoid">
    <div style="width:30px;height:30px;border-radius:7px;background:#c0392b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0">!</div>
    <div style="flex:1;font-size:12.5px;color:#5a1f15;line-height:1.5">
      <strong style="font-family:'Playfair Display',serif;font-size:14px;color:#1a0e07">Services modifiés par le client</strong><br/>
      Cette soumission contient des lignes ajoutées par le client (badges « Ajouté » + tarifs « À confirmer » en rouge). À valider avec iPropre avant signature.
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

// EnvoiPage component
function EnvoiPage({ state, pushToast, onLogout }) {
  const [form, setForm] = React.useState({
    clientName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    message: "Bonjour,\n\nVoici la soumission personnalisée que nous avons préparée pour vous. Vous trouverez ci-joint le PDF détaillé avec nos services et les options tarifaires.\n\nSi vous avez la moindre question, n'hésitez pas à nous contacter — ce serait un plaisir d'en discuter avec vous.\n\nCordialement,\nIdriss Sassi — iPropre\n+1 (819) 995-2414",
  });
  const [sent, setSent] = React.useState(false);

  const hiddenPlans = state.hiddenPlans || [];
  const visiblePlanIndices = PLAN_DEFS.map((_, i) => i).filter(i => !hiddenPlans.includes(i));
  const hasSelected = state.selectedPlan != null;
  const plan = hasSelected ? PLAN_DEFS[state.selectedPlan] : null;
  const price = hasSelected ? state.prices[state.selectedPlan] : null;

  // Build the email body with the 3 (visible) prices, bold + UPPERCASE on the chosen one
  const buildEmailBody = () => {
    const lines = visiblePlanIndices.map(i => {
      const p = PLAN_DEFS[i];
      const px = state.prices[i] || '—';
      const isSel = i === state.selectedPlan;
      // mailto sends plain text; many clients render *text* or **text** as bold (Outlook auto-formats, others show stars).
      // We use ALL CAPS + arrow + asterisks to make the choice unmissable in any client.
      if (isSel) {
        return `  → *${p.label.toUpperCase()} : ${px} $/MOIS*  — VOTRE CHOIX`;
      }
      return `    ${p.label} : ${px} $/mois`;
    }).join('\n');

    const optionsBlock = hasSelected
      ? `Voici les options présentées, votre choix est mis en évidence :\n\n${lines}\n`
      : `Voici les ${visiblePlanIndices.length} options à comparer :\n\n${lines}\n\nFaites-nous savoir laquelle vous préférez — nous sommes là pour en discuter.`;

    return `${form.message}\n\n────────────────────────────────────\n${optionsBlock}\n────────────────────────────────────\n\nPour me répondre directement : idriss@ipropre.ca\n\n(Le PDF détaillé est joint à ce courriel.)`;
  };

  const buildMailtoUrl = () => {
    const subject = encodeURIComponent(`Soumission iPropre — ${form.company || form.clientName || 'votre entreprise'}`);
    const body = encodeURIComponent(buildEmailBody());
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

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.email) { pushToast('Veuillez saisir un courriel'); return; }
    openPdfWindow();
    setTimeout(() => { window.location.href = buildMailtoUrl(); }, 400);
    setSent(true);
    pushToast('PDF ouvert et courriel préparé');
  };

  const handleMailto = () => {
    if (!form.email) { pushToast('Veuillez saisir un courriel'); return; }
    window.location.href = buildMailtoUrl();
  };

  const handleCopyClientLink = () => {
    if (typeof window.encodeStateToUrl !== 'function') { pushToast('Erreur : encodeur indisponible'); return; }
    const encoded = window.encodeStateToUrl(state, form.clientName || form.company || '');
    if (!encoded) { pushToast('Erreur lors de l\'encodage'); return; }
    const url = `${location.origin}${location.pathname}?mode=client&data=${encoded}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => pushToast('Lien client copié — collez-le dans votre courriel'),
        () => { window.prompt('Copiez ce lien :', url); }
      );
    } else {
      window.prompt('Copiez ce lien :', url);
    }
  };

  const handleOpenClientPreview = () => {
    if (typeof window.encodeStateToUrl !== 'function') { pushToast('Erreur : encodeur indisponible'); return; }
    const encoded = window.encodeStateToUrl(state, form.clientName || form.company || '');
    if (!encoded) { pushToast('Erreur lors de l\'encodage'); return; }
    const url = `${location.origin}${location.pathname}?mode=client&data=${encoded}`;
    window.open(url, '_blank');
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

      <div className="envoi-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20 }}>
        {/* Form */}
        <form className="card card-pad" onSubmit={handleSend}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Coordonnées du client</div>
          <div style={{ color: 'var(--ip-muted)', fontSize: 13, marginBottom: 22 }}>Ces champs sont repris en en-tête du PDF généré.</div>

          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Nom du contact" value={form.clientName} onChange={v => setForm(f => ({...f, clientName: v}))} placeholder="Jean Tremblay" />
            <Field label="Entreprise" value={form.company} onChange={v => setForm(f => ({...f, company: v}))} placeholder="ABC Immobilier inc." />
            <Field label="Courriel *" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} type="email" placeholder="client@exemple.com" required />
            <Field label="Téléphone" value={form.phone} onChange={v => setForm(f => ({...f, phone: v}))} placeholder="(514) 000-0000" />
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Adresse du service" value={form.address} onChange={v => setForm(f => ({...f, address: v}))} placeholder="3095 Jean-Noël-Lavoie, Laval" />
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
            <button type="submit" className="btn btn-orange">
              <Icon.mail /> Générer PDF &amp; ouvrir courriel
            </button>
            <button type="button" className="btn btn-ghost" onClick={openPdfWindow}>
              <Icon.download /> Télécharger PDF seulement
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleMailto}>
              <Icon.external /> Ouvrir courriel seulement
            </button>
          </div>

          {/* Client preview link */}
          <div style={{ marginTop: 14, padding: '14px 16px', background: '#fff', border: '1.5px dashed var(--ip-orange)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700 }}>Aperçu pour votre client</div>
                <div style={{ fontSize: 12, color: 'var(--ip-muted)' }}>Copiez un lien que le client peut consulter en lecture seule pour cocher son plan.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={handleCopyClientLink} style={{ fontSize: 12.5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copier le lien client
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleOpenClientPreview} style={{ fontSize: 12.5 }}>
                <Icon.external /> Aperçu de la vue client
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ip-muted)', lineHeight: 1.5 }}>
              <em>Note :</em> ce lien encode toute la soumission dans l'URL (sans serveur). Le client peut cocher son plan ou demander des services supplémentaires, puis vous renvoyer le PDF mis à jour par courriel.
            </div>
          </div>

          <div style={{ marginTop: 18, padding: '12px 14px', background: '#fffbf0', borderRadius: 8, border: '1px solid #f5d886', fontSize: 12.5, color: '#6b4a0a', lineHeight: 1.55 }}>
            <strong>À propos de l'envoi :</strong> l'envoi automatique de courriel nécessite un serveur côté iPropre (non disponible dans ce prototype). Le bouton ouvre donc votre application courriel (Outlook, Gmail, Apple Mail…) pré-remplie ; vous joignez simplement le PDF téléchargé avant d'envoyer.
          </div>
        </form>

        {/* Summary */}
        <aside className="card" style={{ overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: 100 }}>
          {hasSelected ? (
            <div className={`plan-head ${plan.headCls}`} style={{ padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ip-ink-2)', marginBottom: 4 }}>Plan sélectionné</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>{plan.label}</div>
            </div>
          ) : (
            <div style={{ padding: '20px 18px', textAlign: 'center', background: '#f4f6fc', borderBottom: '1px solid #c9d3eb' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b7a99', marginBottom: 4 }}>Mode comparatif</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: '#1a2540' }}>{visiblePlanIndices.length} options à comparer</div>
            </div>
          )}
          <div style={{ padding: '18px 20px' }}>
            {hasSelected ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid var(--ip-line-2)' }}>
                <span style={{ fontSize: 13, color: 'var(--ip-muted)' }}>Prix mensuel</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>{price || '—'} $</span>
              </div>
            ) : (
              <div style={{ padding: '4px 0 10px', borderBottom: '1px solid var(--ip-line-2)' }}>
                {visiblePlanIndices.map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--ip-muted)' }}>{PLAN_DEFS[i].label}</span>
                    <span style={{ fontWeight: 600 }}>{state.prices[i] || '—'} $</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--ip-line-2)', fontSize: 13 }}>
              <span style={{ color: 'var(--ip-muted)' }}>Sections incluses</span>
              <span style={{ fontWeight: 600 }}>{state.sections.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--ip-muted)' }}>Lignes totales</span>
              <span style={{ fontWeight: 600 }}>{state.sections.reduce((a, s) => a + s.rows.length, 0)}</span>
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Annexes jointes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="pill orange"><Icon.doc size={11}/> Contrat</span>
              <span className="pill"><Icon.doc size={11}/> 70 points</span>
              <span className="pill"><Icon.doc size={11}/> Assurance 5 M$</span>
              <span className="pill">+ autres</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder, required }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ip-muted)', marginBottom: 6 }}>{label}</div>
      <input
        className="txt-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

Object.assign(window, { EnvoiPage, buildPrintableHtml });
