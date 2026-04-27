// App shell — tabs, state, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "signature",
  "density": "comfortable",
  "serifTitles": true,
  "showRibbon": true
}/*EDITMODE-END*/;

const THEMES = {
  signature: { '--ip-orange': '#F4A51C', '--ip-blue': '#8C9BD4', '--ip-coral': '#F5A880' },
  midnight:  { '--ip-orange': '#E8A838', '--ip-blue': '#6B7FB8', '--ip-coral': '#D68A6B' },
  forest:    { '--ip-orange': '#6A9E5A', '--ip-blue': '#7DA8B0', '--ip-coral': '#C89B6A' },
  mono:      { '--ip-orange': '#2a2a30', '--ip-blue': '#7B7B82', '--ip-coral': '#c8c8cc' },
};

// --- Client mode helpers (lien partagé) ---
// Encode/decode soumission state in URL for read-only client preview link.
function encodeStateToUrl(state, clientName) {
  try {
    const payload = { state, clientName: clientName || '', t: Date.now() };
    const json = JSON.stringify(payload);
    // UTF-8 safe base64
    const b64 = btoa(unescape(encodeURIComponent(json)));
    // URL-safe variant
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) { return ''; }
}
function decodeStateFromUrl(s) {
  try {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch (e) { return null; }
}
function detectClientMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') !== 'client') return null;
  const data = params.get('data');
  if (!data) return null;
  const decoded = decodeStateFromUrl(data);
  if (!decoded) return null;
  const linkId = params.get('lid') || null;
  return { ...decoded, linkId };
}

function App() {
  // Detect client mode FIRST (read-only shared-link view)
  const clientPayload = React.useMemo(() => detectClientMode(), []);
  const clientMode = !!clientPayload;
  const initialClientState = clientPayload?.state || null;
  const clientLinkId = clientPayload?.linkId || null;
  // If client mode + linkId is revoked locally → show revoked screen instead of soumission
  const linkRevoked = clientMode && clientLinkId && typeof window.isLinkRevoked === 'function' && window.isLinkRevoked(clientLinkId);

  const [tab, setTab] = React.useState(clientMode ? 'soumission' : 'presentation');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [toastFn, toastUI] = useToasts();
  const { authed, login, logout } = useAuth();
  const store = useSoumissions();
  const sentLinks = typeof useSentLinks === 'function' ? useSentLinks() : null;
  const gsheet = typeof useGsheet === 'function' ? useGsheet() : null;
  const [showSavedModal, setShowSavedModal] = React.useState(false);
  const [showLinksModal, setShowLinksModal] = React.useState(false);
  const [showGsheetModal, setShowGsheetModal] = React.useState(false);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [showSaveAsInline, setShowSaveAsInline] = React.useState(false);
  const [saveAsName, setSaveAsName] = React.useState('');
  const [currentName, setCurrentName] = React.useState('Soumission sans titre');
  const [pdfClientForm, setPdfClientForm] = React.useState({
    clientName: '', company: '', email: '', phone: '', address: ''
  });
  const [showPdfClientPrompt, setShowPdfClientPrompt] = React.useState(false);

  const initialState = initialClientState || {
    sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
    prices: ['', '', ''],
    selectedPlan: 1,
    hiddenPlans: [],
  };
  // Snapshot of the soumission as received by the client — used to detect client-added rows.
  const initialSnapshot = React.useMemo(() => clientMode ? JSON.parse(JSON.stringify(initialState)) : null, []);
  const [state, setStateRaw] = React.useState(initialState);
  const [history, setHistory] = React.useState([]);
  const [future, setFuture] = React.useState([]);

  const setState = React.useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setHistory(h => {
        const snap = JSON.stringify(prev);
        const last = h[h.length - 1];
        if (last === snap) return h;
        const nh = [...h, snap];
        return nh.length > 50 ? nh.slice(nh.length - 50) : nh;
      });
      setFuture([]);
      return next;
    });
  }, []);

  const undo = React.useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const snap = h[h.length - 1];
      setStateRaw(curr => {
        setFuture(f => [...f, JSON.stringify(curr)]);
        try { return JSON.parse(snap); } catch(e) { return curr; }
      });
      toastFn('Action annulée');
      return h.slice(0, -1);
    });
  }, [toastFn]);

  const redo = React.useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const snap = f[f.length - 1];
      setStateRaw(curr => {
        setHistory(h => [...h, JSON.stringify(curr)]);
        try { return JSON.parse(snap); } catch(e) { return curr; }
      });
      toastFn('Action rétablie');
      return f.slice(0, -1);
    });
  }, [toastFn]);

  // Apply theme
  React.useEffect(() => {
    const t = THEMES[tweaks.theme] || THEMES.signature;
    for (const [k, v] of Object.entries(t)) document.documentElement.style.setProperty(k, v);
  }, [tweaks.theme]);

  // Save current soumission (overwrites if currentId exists)
  const handleQuickSave = () => {
    if (store.currentId) {
      store.save(state, currentName);
      toastFn('Enregistrée');
    } else {
      // Force save-as for first save
      setSaveAsName(currentName === 'Soumission sans titre' ? `Soumission du ${new Date().toLocaleDateString('fr-CA')}` : currentName);
      setShowSaveAsInline(true);
    }
  };

  const handleSaveAs = (name) => {
    const item = store.saveAs(state, name);
    setCurrentName(item.name);
    toastFn('Enregistrée');
    setShowSaveAsInline(false);
    setSaveAsName('');
  };

  const handleLoadSoumission = (item) => {
    setStateRaw(item.state);
    setHistory([]);
    setFuture([]);
    setCurrentName(item.name);
    store.setCurrentId(item.id);
    setShowSavedModal(false);
    toastFn(`Ouvert : ${item.name}`);
    setTab('soumission');
  };

  const handleNewSoumission = () => {
    // Replaced confirm() with elegant modal — see <NewSoumissionModal /> render below
    setShowNewModal(true);
  };

  const performNewSoumission = () => {
    setStateRaw({
      sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
      prices: ['', '', ''],
      selectedPlan: 1,
      hiddenPlans: [],
    });
    setHistory([]);
    setFuture([]);
    setCurrentName('Soumission sans titre');
    store.setCurrentId(null);
    setShowNewModal(false);
    toastFn('Nouvelle soumission');
    setTab('soumission');
  };

  // Direct PDF generation from action bar — requires the client form to be filled
  const handleQuickPdf = () => {
    if (typeof buildPrintableHtml !== 'function') { toastFn('Module PDF non charg\u00e9'); return; }
    // Read latest persisted form from localStorage (envoi.jsx persists on every keystroke)
    let form = pdfClientForm;
    try {
      const raw = localStorage.getItem('ipropre.envoi.form.v1');
      if (raw) form = { ...form, ...JSON.parse(raw) };
    } catch (e) {}
    const missing = [];
    if (!form.clientName?.trim()) missing.push('Contact');
    if (!form.company?.trim()) missing.push('Entreprise');
    if (!form.email?.trim()) missing.push('Courriel');
    if (!form.phone?.trim()) missing.push('T\u00e9l\u00e9phone');
    if (!form.address?.trim()) missing.push('Adresse du service');
    if (missing.length || !/^\d{3} \d{3} \d{4}$/.test(String(form.phone||'').trim())) {
      toastFn('Compl\u00e9tez d\'abord les coordonn\u00e9es client dans l\'onglet Envoi');
      setTab('envoi');
      return;
    }
    const html = buildPrintableHtml(state, form);
    const w = window.open('', '_blank');
    if (!w) { toastFn('D\u00e9bloquer les pop-ups pour le PDF'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    toastFn('PDF pr\u00eat \u2014 utilisez Imprimer / Enregistrer');
  };

  const tabs = [
    { id: 'presentation', label: 'Présentation' },
    { id: 'soumission', label: 'Soumission', dot: true },
    { id: 'galerie', label: 'Réalisations' },
    { id: 'annexes', label: 'Annexes' },
    { id: 'envoi', label: 'Envoi' },
  ].filter(t => !clientMode || t.id !== 'envoi');

  const totalLines = state.sections.reduce((a, s) => a + s.rows.length, 0);
  const plan = state.selectedPlan != null ? PLAN_DEFS[state.selectedPlan] : null;
  const price = state.selectedPlan != null ? state.prices[state.selectedPlan] : null;

  // ---------- Revoked-link screen (client mode only) ----------
  if (linkRevoked) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: 'linear-gradient(180deg, #faf6ef 0%, #f0eadf 100%)',
        padding: 24,
      }}>
        <div className="card card-pad" style={{ maxWidth: 520, textAlign: 'center', padding: 48, background: '#fff' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(192,57,43,0.10)', color: '#c0392b', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, marginBottom: 12, color: 'var(--ip-ink)' }}>Lien expiré</div>
          <div style={{ color: 'var(--ip-muted)', lineHeight: 1.6, fontSize: 14, marginBottom: 8 }}>
            Ce lien de soumission a été révoqué et n'est plus accessible.
          </div>
          <div style={{ color: 'var(--ip-muted)', lineHeight: 1.6, fontSize: 14, marginBottom: 28 }}>
            Pour obtenir une soumission à jour, contactez-nous directement.
          </div>
          <a href="mailto:idriss@ipropre.ca" className="btn btn-orange" style={{ display: 'inline-flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Écrire à idriss@ipropre.ca
          </a>
          <div style={{ marginTop: 36, fontSize: 11, color: 'var(--ip-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            iPropre · Laval, QC
          </div>
        </div>
      </div>
    );
  }

  // ---------- Global auth gate (vendor-side only) ----------
  if (!clientMode && !authed) {
    return (
      <React.Fragment>
        <LoginGate onSuccess={(remember) => { login(remember); toastFn('Connexion réussie'); }} fullscreen />
        {toastUI}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <BrandMark size={40} />
            <div>
              <div className="name">i<em>Propre</em></div>
              <div className="tag">Soumission interactive</div>
            </div>
          </div>
          <nav className="nav-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={tab === t.id ? 'active' : ''}
                onClick={() => setTab(t.id)}
              >
                {t.dot && tab !== t.id && <span className="dot" />}
                {t.label}
              </button>
            ))}
          </nav>
          <div className="topbar-actions" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {!clientMode && (
              <React.Fragment>
                <button className="btn btn-ghost" onClick={handleNewSoumission} title="Démarrer une nouvelle soumission" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nouvelle
                </button>
                <button className="btn btn-ghost" onClick={handleQuickSave} title="Enregistrer cette soumission" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Enregistrer
                </button>
                <button className="btn btn-ghost" onClick={() => setShowSavedModal(true)} title="Mes soumissions enregistr&#233;es" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Mes soumissions {store.list.length > 0 && <span style={{ display: 'inline-block', marginLeft: 4, padding: '1px 6px', background: 'var(--ip-orange)', color: '#fff', borderRadius: 999, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{store.list.length}</span>}
                </button>
                {sentLinks && (
                  <button className="btn btn-ghost" onClick={() => setShowLinksModal(true)} title="Liens envoyés aux clients" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Liens {sentLinks.links.filter(l => !l.revoked).length > 0 && <span style={{ display: 'inline-block', marginLeft: 4, padding: '1px 6px', background: '#2c8a4a', color: '#fff', borderRadius: 999, fontSize: 10, fontFamily: 'var(--font-mono)' }}>{sentLinks.links.filter(l => !l.revoked).length}</span>}
                  </button>
                )}
                {gsheet && (
                  <button className="btn btn-ghost" onClick={() => setShowGsheetModal(true)} title="Connexion Google Sheets" style={{ padding: '6px 12px', fontSize: 12.5, color: gsheet.url ? '#0F9D58' : undefined, borderColor: gsheet.url ? 'rgba(15,157,88,0.3)' : undefined }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                    Sheets {gsheet.url && <span style={{ display: 'inline-block', marginLeft: 4, width: 6, height: 6, background: '#0F9D58', borderRadius: '50%' }} />}
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => { logout(); toastFn('Déconnecté'); }} title="Se déconnecter" style={{ padding: '6px 10px', fontSize: 12.5, color: 'var(--ip-muted)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
              </React.Fragment>
            )}
          </div>
          <div className="client-badge">
            <div className="avatar">{clientMode ? 'V' : 'IP'}</div>
            <div className="meta">
              <div className="n">{clientMode ? (clientPayload?.clientName || 'Vous') : 'Idriss Sassi'}</div>
              <div className="d">{clientMode ? 'Soumission iPropre' : 'Pr\u00e9sident · Laval, QC'}</div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {clientMode && (
          <div style={{
            background: 'linear-gradient(90deg, #fff4da 0%, #fef8e9 100%)',
            borderBottom: '1px solid #f4d680',
            padding: '14px 32px',
            display: 'flex', alignItems: 'center', gap: 14, fontSize: 13.5, color: '#5a3f08',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4A51C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div style={{ flex: 1, lineHeight: 1.5 }}>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#3d2a05' }}>Vous consultez la soumission préparée par iPropre.</strong><br/>
              Cochez votre plan préféré et téléchargez le PDF pour le confirmer. Vous pouvez aussi ajouter des services à demander.
              Pour toute question : <a href="mailto:idriss@ipropre.ca" style={{ color: '#7c5300', textDecoration: 'underline', fontWeight: 600 }}>idriss@ipropre.ca</a>
            </div>
          </div>
        )}
        {tab === 'presentation' && <PresentationPage />}
        {tab === 'soumission' && <SoumissionPage state={state} setState={setState} pushToast={toastFn} history={history} undo={undo} future={future} redo={redo} clientMode={clientMode} initialSnapshot={initialSnapshot} />}
        {tab === 'galerie' && <GaleriePage />}
        {tab === 'annexes' && <AnnexesPage />}
        {tab === 'envoi' && (
          <EnvoiPage
            state={state}
            pushToast={toastFn}
            onLogout={() => { logout(); toastFn('Déconnecté'); }}
            sentLinks={sentLinks}
            gsheet={gsheet}
            soumissionMeta={{
              name: currentName,
              status: store.list.find(s => s.id === store.currentId)?.status || 'en_cours',
            }}
          />
        )}

        {/* Sticky action bar (always visible) */}
        <div className="actionbar">
          <div className="total-box">
            <div>
              <div className="k">Plan</div>
              <div className="v">{plan ? plan.label : <span style={{ color: 'var(--ip-muted)', fontStyle: 'italic', fontSize: 14 }}>Aucun choix</span>}</div>
            </div>
          </div>
          <div className="total-box">
            <div>
              <div className="k">Prix / mois</div>
              <div className="v">{price || '—'} $</div>
            </div>
          </div>
          <div className="total-box" style={{ borderRight: 'none' }}>
            <div>
              <div className="k">Lignes</div>
              <div className="v" style={{ fontSize: 18 }}>{totalLines}</div>
            </div>
          </div>
          <div className="spacer" />
          {tab !== 'soumission' && (
            <button className="btn btn-light" onClick={() => setTab('soumission')}>
              <Icon.edit /> Modifier le devis
            </button>
          )}
          <button className="btn btn-light" onClick={handleQuickPdf} title="G\u00e9n\u00e9rer le PDF de l'offre">
            <Icon.download /> Offre en PDF
          </button>
          {tab !== 'envoi' && !clientMode && (
            <button className="btn btn-orange" onClick={() => setTab('envoi')}>
              <Icon.mail /> Envoyer l'offre <Icon.arrow />
            </button>
          )}
        </div>
      </main>

      {toastUI}

      {!clientMode && (
        <SoumissionsModal
          open={showSavedModal}
          onClose={() => setShowSavedModal(false)}
          store={store}
          currentState={state}
          onLoad={handleLoadSoumission}
          pushToast={toastFn}
        />
      )}
      {/* Inline Save-As prompt (first save) */}
      {showSaveAsInline && !clientMode && (
        <div className="modal-bg" onClick={() => setShowSaveAsInline(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, width: '92%' }}>
            <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700 }}>Enregistrer la soumission</div>
              <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>Donnez un nom pour la retrouver facilement.</div>
            </div>
            <div style={{ padding: 24 }}>
              <input
                className="txt-input"
                autoFocus
                placeholder="Ex : Soumission ABC Immobilier"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && saveAsName.trim()) handleSaveAs(saveAsName.trim());
                  if (e.key === 'Escape') setShowSaveAsInline(false);
                }}
              />
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowSaveAsInline(false)}>Annuler</button>
              <button className="btn btn-orange" onClick={() => saveAsName.trim() && handleSaveAs(saveAsName.trim())} disabled={!saveAsName.trim()} style={{ opacity: saveAsName.trim() ? 1 : 0.5 }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Sent links manager (revocation) */}
      {!clientMode && sentLinks && (
        <LinksManagerModal
          open={showLinksModal}
          onClose={() => setShowLinksModal(false)}
          sentLinks={sentLinks}
          pushToast={toastFn}
        />
      )}

      {/* Google Sheets connection setup */}
      {!clientMode && gsheet && (
        <GsheetSetupModal
          open={showGsheetModal}
          onClose={() => setShowGsheetModal(false)}
          gsheet={gsheet}
          pushToast={toastFn}
        />
      )}

      {/* New soumission confirmation modal */}
      {!clientMode && showNewModal && (
        <div className="modal-bg" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '92%' }}>
            <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--ip-line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(244,165,28,0.12)', color: 'var(--ip-orange)', display: 'grid', placeItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Nouvelle soumission</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>Démarrer un devis vierge.</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 28px', fontSize: 14, lineHeight: 1.6, color: 'var(--ip-ink-2)' }}>
              {store.currentId ? (
                <React.Fragment>
                  Votre soumission actuelle <strong>« {currentName} »</strong> est déjà enregistrée — elle reste accessible depuis <em>Mes soumissions</em>.
                </React.Fragment>
              ) : (
                <React.Fragment>
                  La soumission en cours <strong>n'est pas encore enregistrée</strong>. Si vous continuez sans enregistrer, le travail sera perdu.
                </React.Fragment>
              )}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--ip-bg)', borderRadius: 8, fontSize: 13, color: 'var(--ip-muted)' }}>
                Le devis sera réinitialisé avec les sections par défaut. Aucun rafraîchissement de page n'est nécessaire.
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Annuler</button>
              {!store.currentId && (
                <button className="btn btn-ghost" onClick={() => {
                  setShowNewModal(false);
                  setSaveAsName(currentName === 'Soumission sans titre' ? `Soumission du ${new Date().toLocaleDateString('fr-CA')}` : currentName);
                  setShowSaveAsInline(true);
                }}>
                  Enregistrer d'abord
                </button>
              )}
              <button className="btn btn-orange" onClick={performNewSoumission}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Démarrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tweaks */}
      {!clientMode && (
      <TweaksPanel>
        <TweakSection label="Thème de couleur" />
        <TweakRadio
          label="Palette"
          value={tweaks.theme}
          onChange={(v) => setTweak('theme', v)}
          options={['signature', 'midnight', 'forest', 'mono']}
        />
        <TweakSection label="Affichage" />
        <TweakToggle
          label="Titres en serif"
          value={tweaks.serifTitles}
          onChange={(v) => setTweak('serifTitles', v)}
        />
        <TweakToggle
          label="Bannière 'Recommandé'"
          value={tweaks.showRibbon}
          onChange={(v) => setTweak('showRibbon', v)}
        />
      </TweaksPanel>
      )}
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('app-root'));
root.render(<App />);

// Expose for cross-module use (envoi.jsx generates client-share links)
window.encodeStateToUrl = encodeStateToUrl;
