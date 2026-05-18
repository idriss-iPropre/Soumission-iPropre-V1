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
// Uses LZ-string compression (when available) for much shorter URLs — typically
// 70%+ smaller, so the resulting link fits within is.gd's 5000-char limit.
// Format: starts with "c1." → compressed (encodeURIComponent-safe LZ-string),
//         otherwise plain base64 (legacy decoder still understands these).
function encodeStateToUrl(state, clientName) {
  try {
    const payload = { state, clientName: clientName || '', t: Date.now() };
    const json = JSON.stringify(payload);
    if (typeof LZString !== 'undefined' && LZString.compressToEncodedURIComponent) {
      const compressed = LZString.compressToEncodedURIComponent(json);
      if (compressed) return 'c1.' + compressed;
    }
    // Fallback: original UTF-8-safe base64 (URL-safe variant)
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) { return ''; }
}
function decodeStateFromUrl(s) {
  try {
    // Compressed format
    if (s.indexOf('c1.') === 0 && typeof LZString !== 'undefined') {
      const json = LZString.decompressFromEncodedURIComponent(s.slice(3));
      if (json) return JSON.parse(json);
    }
    // Legacy base64
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch (e) { return null; }
}
function detectClientMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') !== 'client') return null;
  const linkId = params.get('lid') || null;
  const editable = params.get('edit') === '1';

  // 1. Short-link mode: ?mode=client&s=<id>  — state needs to be fetched async.
  const shortId = params.get('s');
  if (shortId) {
    return { pendingShortId: shortId, editable: editable || params.get('e') === '1', linkId };
  }

  // 2. Inline data mode (legacy): ?mode=client&data=<base64-or-lzstring>
  const data = params.get('data');
  if (!data) return null;
  const decoded = decodeStateFromUrl(data);
  if (!decoded) return null;
  return { ...decoded, linkId, editable };
}

// Resolve a short-link to its full payload via the backend.
async function resolveShortLink(shortId) {
  if (!window.repo || !window.repo.ShortLinks) return null;
  try {
    const row = await window.repo.ShortLinks.resolve(shortId);
    if (!row || !row.dataJSON) return null;
    // The stored dataJSON was produced by encodeStateToUrl — decode it.
    const decoded = decodeStateFromUrl(row.dataJSON);
    if (!decoded) return null;
    return {
      state: decoded.state,
      clientName: decoded.clientName || row.clientName || '',
      editable: String(row.editable) === 'true',
    };
  } catch (e) {
    console.warn('resolveShortLink failed:', e);
    return null;
  }
}

// Service icons keyed by section id — replaces the iPropre logo next to each
// service section in the Soumission table.
const SECTION_ICONS = {
  garantie: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  entretien: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2L7 8l-3 1 4 3-1 5 5-3 5 3-1-5 4-3-3-1-2.5-6z" opacity="0.4"/>
      <path d="M14 14l6 6"/>
      <circle cx="9" cy="9" r="3"/>
    </svg>
  ),
  vitre: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="12" y1="3" x2="12" y2="21"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <path d="M6 7l3 3" opacity="0.6"/>
    </svg>
  ),
  tapis: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="1"/>
      <path d="M3 9h18M3 15h18" opacity="0.5"/>
      <path d="M7 6v12M12 6v12M17 6v12" opacity="0.4"/>
    </svg>
  ),
  plancher: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21l2-10h10l2 10"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" opacity="0.5"/>
      <circle cx="12" cy="16" r="0.8" fill="currentColor"/>
    </svg>
  ),
  travaux: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
};

function SectionIcon({ id, color }) {
  const icon = SECTION_ICONS[id] || (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  );
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9,
      background: 'linear-gradient(135deg, rgba(244,165,28,0.15), rgba(244,165,28,0.05))',
      color: color || 'var(--ip-orange)',
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
  );
}

window.SectionIcon = SectionIcon;
window.SECTION_ICONS = SECTION_ICONS;

function UserMenuItem({ onClick, icon, label, badge, badgeColor, trailing, danger }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: 'unset', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
        fontSize: 13, width: '100%', boxSizing: 'border-box',
        background: hover ? (danger ? 'rgba(220,53,69,0.08)' : 'var(--ip-line-2)') : 'transparent',
        color: danger ? '#c0392b' : 'var(--ip-ink)',
      }}
    >
      <span style={{ color: danger ? '#c0392b' : 'var(--ip-muted)', display: 'inline-flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span style={{ padding: '1px 7px', background: badgeColor || 'var(--ip-orange)', color: '#fff', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{badge}</span>
      )}
      {trailing}
    </button>
  );
}

function App() {
  // Detect client mode FIRST (read-only shared-link view)
  const clientPayload = React.useMemo(() => detectClientMode(), []);
  const clientMode = !!clientPayload;
  // Short-link async loading (when URL is ?mode=client&s=<id>)
  const [shortLoadState, setShortLoadState] = React.useState(
    clientPayload?.pendingShortId ? { loading: true, error: null, data: null } : null
  );
  React.useEffect(() => {
    if (!clientPayload?.pendingShortId) return;
    let cancelled = false;
    resolveShortLink(clientPayload.pendingShortId).then(result => {
      if (cancelled) return;
      if (!result) {
        setShortLoadState({ loading: false, error: 'Lien introuvable ou expiré.', data: null });
      } else {
        setShortLoadState({ loading: false, error: null, data: result });
      }
    });
    return () => { cancelled = true; };
  }, [clientPayload?.pendingShortId]);

  // Resolve effective client payload (short-link mode merges in fetched data)
  const effectiveClientPayload = React.useMemo(() => {
    if (!clientPayload) return null;
    if (clientPayload.pendingShortId) {
      if (!shortLoadState || shortLoadState.loading || shortLoadState.error) return null;
      return {
        state: shortLoadState.data.state,
        clientName: shortLoadState.data.clientName,
        editable: clientPayload.editable || shortLoadState.data.editable,
        linkId: clientPayload.linkId,
      };
    }
    return clientPayload;
  }, [clientPayload, shortLoadState]);

  const clientEditable = !!effectiveClientPayload?.editable;
  const initialClientState = effectiveClientPayload?.state || null;
  const clientLinkId = effectiveClientPayload?.linkId || null;
  // If client mode + linkId is revoked locally → show revoked screen instead of soumission
  const linkRevoked = clientMode && clientLinkId && typeof window.isLinkRevoked === 'function' && window.isLinkRevoked(clientLinkId);

  const [tab, setTabRaw] = React.useState(clientMode ? 'soumission' : 'presentation');
  // Wrapper: scroll to top whenever the active tab changes so the contact pill
  // always slides in from a consistent top-of-page position.
  const setTab = React.useCallback((next) => {
    setTabRaw(next);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
  }, []);
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
  // Tracks whether the editor has unsaved changes since last save/load.
  // Used to lock the Envoi tab and force user to save first.
  const [isDirty, setIsDirty] = React.useState(false);
  // Last PDF Drive URL associated with the current soumission.
  // Captured when Enregistrer succeeds; reused by Envoi (no re-upload).
  const [lastPdfUrl, setLastPdfUrl] = React.useState('');

  // ---------- Soumission templates (vendor-side, persisted in localStorage) ----------
  const TEMPLATES_KEY = 'ipropre.templates.v1';
  const [templatesList, setTemplatesList] = React.useState(() => {
    if (clientMode) return [];
    try {
      const raw = localStorage.getItem(TEMPLATES_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  });
  const persistTemplates = React.useCallback((next) => {
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(next)); } catch (e) {}
  }, []);
  const templates = React.useMemo(() => clientMode ? null : ({
    list: templatesList,
    save: (snapshot, name) => {
      const tpl = {
        id: 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name || 'Sans titre',
        createdAt: new Date().toISOString(),
        state: JSON.parse(JSON.stringify(snapshot)),
      };
      setTemplatesList(prev => {
        const next = [tpl, ...prev];
        persistTemplates(next);
        return next;
      });
    },
    remove: (id) => {
      setTemplatesList(prev => {
        const next = prev.filter(t => t.id !== id);
        persistTemplates(next);
        return next;
      });
    },
  }), [clientMode, templatesList, persistTemplates]);

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
      setIsDirty(true);
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

  // One-time pull of cross-device contacts on startup (vendor mode only).
  // Silent — failures are fine; the picker pulls again when opened.
  React.useEffect(() => {
    if (clientMode) return;
    if (typeof window.syncContactsFromCloud === 'function') {
      window.syncContactsFromCloud().catch(() => {});
    }
  }, [clientMode]);

  // Push current state to Google Sheets + Drive PDF.
  // Returns a promise that resolves with the Drive PDF URL (if any).
  // The PDF is then cached in `lastPdfUrl` and reused by the Envoi tab.
  const syncToSheets = async (savedItem, trigger = 'save') => {
    if (!gsheet || !gsheet.url || !savedItem) return null;
    let form = {};
    try { form = JSON.parse(localStorage.getItem('ipropre.envoi.form.v1') || '{}'); } catch (e) {}
    const record = (typeof buildSoumissionRecord === 'function')
      ? buildSoumissionRecord({ state, form, soumissionName: savedItem.name, status: savedItem.status || 'en_cours', id: savedItem.id })
      : null;
    if (!record) return null;

    // Soumissions row (fire-and-forget — local save is the source of truth)
    gsheet.saveSoumission(record);

    // Versions tab — push the most recent local snapshot.
    const lastVersion = (savedItem.versions || [])[0];
    if (lastVersion && window.repo && window.repo.Versions) {
      window.repo.Versions.create({
        soumissionId: savedItem.id,
        label: lastVersion.label || '',
        auteur: '',
        data: lastVersion.state,
      }).catch(() => {});
    }

    // PDF generation + Drive upload — awaited so we can cache the URL.
    if (window.pdfTools && window.repo && window.repo.Pdfs && typeof buildPrintableHtml === 'function') {
      try {
        const html = buildPrintableHtml(state, form, initialSnapshot);
        const filename = window.pdfTools.buildPdfFilename({
          soumissionName: savedItem.name,
          clientName: form.clientName || form.company,
          trigger,
        });
        const base64 = await window.pdfTools.htmlToPdfBase64(html, { filename });
        const result = await window.repo.Pdfs.upload({
          soumissionId: savedItem.id,
          base64,
          nomFichier: filename,
          label: trigger === 'send' ? 'Envoi client' : (lastVersion?.label || 'Enregistrement'),
          trigger,
        });
        if (result && result.url) {
          setLastPdfUrl(result.url);
          return result.url;
        }
      } catch (err) {
        console.warn('PDF upload failed:', err && err.message ? err.message : err);
      }
    }
    return null;
  };

  // Save current soumission (overwrites if currentId exists)
  const handleQuickSave = async () => {
    if (store.currentId) {
      const item = store.save(state, currentName);
      setIsDirty(false);
      toastFn('Enregistrement en cours…');
      const pdfUrl = await syncToSheets(item || { id: store.currentId, name: currentName });
      toastFn(pdfUrl ? '✓ Enregistrée + PDF sur Drive' : '✓ Enregistrée');
    } else {
      // Force save-as for first save
      setSaveAsName(currentName === 'Soumission sans titre' ? `Soumission du ${new Date().toLocaleDateString('fr-CA')}` : currentName);
      setShowSaveAsInline(true);
    }
  };

  const handleSaveAs = async (name) => {
    const item = store.saveAs(state, name);
    setCurrentName(item.name);
    setIsDirty(false);
    setShowSaveAsInline(false);
    setSaveAsName('');
    toastFn('Enregistrement en cours…');
    const pdfUrl = await syncToSheets(item);
    toastFn(pdfUrl ? '✓ Enregistrée + PDF sur Drive' : '✓ Enregistrée');
  };

  // Wrapped store — adds Sheets sync to status changes & version restores.
  // The local store stays the source of truth; Sheets is best-effort + silent.
  const storeWithSync = React.useMemo(() => ({
    ...store,
    setStatus: (id, statut) => {
      store.setStatus(id, statut);
      if (gsheet && gsheet.url && window.repo) {
        window.repo.Soumissions.setStatus(id, statut).catch(() => {});
      }
    },
    restoreVersion: (id, vid) => {
      const updated = store.restoreVersion(id, vid);
      if (updated && id === store.currentId) {
        // Reflect restored state in the active editor
        setStateRaw(updated.state);
        setHistory([]); setFuture([]);
      }
      // Push the new "current" snapshot to Sheets
      if (updated) syncToSheets(updated);
      return updated;
    },
  }), [store, gsheet]);

  const handleLoadSoumission = (item) => {
    setStateRaw(item.state);
    setHistory([]);
    setFuture([]);
    setCurrentName(item.name);
    store.setCurrentId(item.id);
    setShowSavedModal(false);
    setIsDirty(false);
    setLastPdfUrl(''); // Will be re-populated on next save
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
    setIsDirty(false);
    setLastPdfUrl('');
    setCurrentName('Soumission sans titre');
    store.setCurrentId(null);
    // Clear the "new soumission" envoi form slot so the next soumission starts blank.
    if (typeof window.clearEnvoiNewForm === 'function') window.clearEnvoiNewForm();
    setShowNewModal(false);
    toastFn('Nouvelle soumission');
    setTab('soumission');
  };

  // Direct PDF generation from action bar.
  // Vendor mode: requires the Envoi-form contact fields to be filled.
  // Client mode (lien partagé): skips validation — the client just wants to
  // print/save the soumission they're viewing, with whatever name was on the link.
  const handleQuickPdf = () => {
    if (typeof buildPrintableHtml !== 'function') { toastFn('Module PDF non charg\u00e9'); return; }

    if (clientMode) {
      // Use the name from the share-link payload; pad missing fields with placeholders.
      const cName = (clientPayload && clientPayload.clientName) || '';
      const form = {
        clientName: cName,
        company: cName,
        email: '', phone: '', address: '',
      };
      const html = buildPrintableHtml(state, form, initialSnapshot);
      const w = window.open('', '_blank');
      if (!w) { toastFn('D\u00e9bloquer les pop-ups pour le PDF'); return; }
      w.document.open(); w.document.write(html); w.document.close();
      toastFn('PDF pr\u00eat \u2014 utilisez Imprimer / Enregistrer');
      return;
    }

    // Vendor: read latest persisted Envoi-form for this soumission
    let form = pdfClientForm;
    try {
      if (typeof window.readEnvoiForm === 'function') {
        form = { ...form, ...window.readEnvoiForm(store.currentId || '') };
      } else {
        const raw = localStorage.getItem('ipropre.envoi.form.v1');
        if (raw) form = { ...form, ...JSON.parse(raw) };
      }
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
    const html = buildPrintableHtml(state, form, initialSnapshot);
    const w = window.open('', '_blank');
    if (!w) { toastFn('D\u00e9bloquer les pop-ups pour le PDF'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    toastFn('PDF pr\u00eat \u2014 utilisez Imprimer / Enregistrer');
  };

  // Direct DOCX (Word/Google Docs-compatible) generation. Wraps the printable
  // HTML in MS Office MIME so Word opens it natively and Google Drive offers
  // "Open with Google Docs".
  const handleQuickDocx = async () => {
    if (typeof buildPrintableHtml !== 'function') { toastFn('Module PDF non charg\u00e9'); return; }
    let form = pdfClientForm;
    try {
      if (typeof window.readEnvoiForm === 'function') {
        form = { ...form, ...window.readEnvoiForm(store.currentId || '') };
      }
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
    // Generate the short client-consultation link FIRST so we can embed it in the docx.
    let shortUrl = '';
    try {
      if (typeof window.encodeStateToUrl === 'function') {
        const longUrl = window.encodeStateToUrl(state, form.clientName || form.company || '');
        if (longUrl && longUrl.length < 4800) {
          for (const api of [
            `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`,
            `https://v.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`,
          ]) {
            try {
              const r = await fetch(api);
              const j = await r.json();
              if (j && j.shorturl) { shortUrl = j.shorturl; break; }
            } catch (e) {}
          }
          if (!shortUrl) shortUrl = longUrl; // fallback to long URL
        }
      }
    } catch (e) { console.warn('short link failed for docx', e); }

    // Use the COMPACT HTML for Word/Drive — header takes ~1/4 page, wider service column,
    // tighter rows, fits 2-3 pages even with many services. Embeds logo + clickable
    // consultation link button.
    const html = (typeof buildCompactDocxHtml === 'function')
      ? buildCompactDocxHtml(state, form, initialSnapshot, shortUrl)
      : buildPrintableHtml(state, form, initialSnapshot);
    const safeName = (form.company || form.clientName || 'client').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) || 'client';
    const stamp = new Date().toLocaleDateString('fr-CA').replace(/-/g, '');
    const baseName = `Soumission iPropre - ${safeName} - ${stamp}`;

    if (!(window.repo && window.repo.Docx && gsheet && gsheet.url)) {
      toastFn('Configurez Google Sheets dans Param\u00e8tres pour utiliser le t\u00e9l\u00e9chargement Word');
      return;
    }

    toastFn('Conversion en cours\u2026');
    window.repo.Docx.upload({
      soumissionId: store.currentId || '',
      html,
      nomFichier: baseName,
      label: currentName || '',
      trigger: 'manual',
    }).then((res) => {
      const url = res && (res.docxUrl || res.docUrl);
      if (!url) { toastFn('\u00c9chec de la conversion Word'); return; }
      // Open the Google Doc (editable) in a new tab — user can File > T\u00e9l\u00e9charger > .docx
      window.open(res.docUrl || url, '_blank');
      toastFn('\u2713 Soumission sur Drive (Google Docs + .docx)');
    }).catch((err) => {
      console.error('Docx upload failed', err);
      toastFn('Erreur : ' + (err && err.message ? err.message : 'conversion Word \u00e9chou\u00e9e'));
    });
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

  // ---------- Short-link loading / error screen (client mode only) ----------
  if (clientMode && clientPayload.pendingShortId) {
    if (!shortLoadState || shortLoadState.loading) {
      return (
        <div style={{
          minHeight: '100vh', display: 'grid', placeItems: 'center',
          background: 'linear-gradient(180deg, #faf6ef 0%, #f0eadf 100%)',
          padding: 24,
        }}>
          <div className="card card-pad" style={{ maxWidth: 420, textAlign: 'center', padding: 48, background: '#fff' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(244,165,28,0.10)', display: 'grid', placeItems: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ip-orange)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Chargement de votre soumission…</div>
            <div style={{ fontSize: 13, color: 'var(--ip-muted)' }}>Un instant, nous récupérons les détails.</div>
          </div>
        </div>
      );
    }
    if (shortLoadState.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #faf6ef 0%, #f0eadf 100%)', padding: 24 }}>
          <div className="card card-pad" style={{ maxWidth: 480, textAlign: 'center', padding: 44, background: '#fff' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(192,57,43,0.08)', color: '#c0392b', display: 'grid', placeItems: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Lien introuvable</div>
            <div style={{ fontSize: 13.5, color: 'var(--ip-muted)', lineHeight: 1.6, marginBottom: 24 }}>{shortLoadState.error}<br/>Contactez-nous pour recevoir un nouveau lien.</div>
            <a href="mailto:idriss@ipropre.ca" className="btn btn-orange" style={{ display: 'inline-flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              idriss@ipropre.ca
            </a>
          </div>
        </div>
      );
    }
  }

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

  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [actionMenuOpen, setActionMenuOpen] = React.useState(false);
  React.useEffect(() => {
    if (!actionMenuOpen) return;
    const onDown = (e) => {
      if (!e.target.closest || !e.target.closest('[data-action-menu]')) setActionMenuOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [actionMenuOpen]);
  React.useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e) => {
      if (!e.target.closest || !e.target.closest('[data-user-menu]')) setUserMenuOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [userMenuOpen]);

  return (
    <React.Fragment>
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <BrandMark size={40} />
            <div>
              <div className="name">i<em>Propre</em></div>
              <div className="tag" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ip-muted)', marginTop: 2 }}>Soumission</div>
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
          <div className="topbar-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          </div>
          {!clientMode ? (
            <div data-user-menu style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 12px 4px 4px',
                  border: '1px solid var(--ip-line)', borderRadius: 999, background: '#fff',
                  fontSize: 13,
                }}
                aria-expanded={userMenuOpen}
                title="Mon compte"
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="meta">
                  <div className="n" style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.15 }}>Idriss Sassi</div>
                  <div className="d" style={{ fontSize: 11, color: 'var(--ip-muted)' }}>Président</div>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2, color: 'var(--ip-muted)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60,
                  background: '#fff', border: '1px solid var(--ip-line)', borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)', minWidth: 240, overflow: 'hidden',
                  padding: 4,
                }}>
                  <UserMenuItem
                    onClick={() => { setShowSavedModal(true); setUserMenuOpen(false); }}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>}
                    label="Mes soumissions"
                    badge={store.list.length > 0 ? store.list.length : null}
                  />
                  {sentLinks && (
                    <UserMenuItem
                      onClick={() => { setShowLinksModal(true); setUserMenuOpen(false); }}
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
                      label="Liens envoyés"
                      badge={sentLinks.links.filter(l => !l.revoked).length || null}
                      badgeColor="#2c8a4a"
                    />
                  )}
                  {gsheet && (
                    <UserMenuItem
                      onClick={() => { setShowGsheetModal(true); setUserMenuOpen(false); }}
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>}
                      label="Google Sheets"
                      trailing={gsheet.url ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F9D58', display: 'inline-block' }} /> : null}
                    />
                  )}
                  <div style={{ height: 1, background: 'var(--ip-line-2)', margin: '4px 0' }} />
                  <UserMenuItem
                    onClick={() => { logout(); toastFn('Déconnecté'); setUserMenuOpen(false); }}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
                    label="Se déconnecter"
                    danger
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="client-badge" style={{ borderRadius: 999 }}>
              <div className="avatar" style={{ borderRadius: '50%' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="meta">
                <div className="n">{clientPayload?.clientName || 'Vous'}</div>
                <div className="d">Soumission iPropre</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {clientMode && (
          <div className="client-banner" style={{
            background: 'linear-gradient(90deg, #fff4da 0%, #fef8e9 100%)',
            borderBottom: '1px solid #f4d680',
            padding: '14px 32px',
            display: 'flex', alignItems: 'center', gap: 14, fontSize: 13.5, color: '#5a3f08',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4A51C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div style={{ flex: 1, lineHeight: 1.5 }}>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#3d2a05' }}>{clientEditable ? 'Vous pouvez modifier cette soumission préparée par iPropre.' : 'Vous consultez la soumission préparée par iPropre.'}</strong><br/>
              {clientEditable
                ? <React.Fragment>Modifiez n'importe quelle cellule, ajoutez ou retirez des lignes, puis téléchargez le PDF pour confirmer. Les cellules modifiées seront <strong style={{ color: '#7c5300' }}>surlignées en orange</strong> dans le document.</React.Fragment>
                : <React.Fragment>Cochez votre plan préféré et téléchargez le PDF pour le confirmer. Vous pouvez aussi ajouter des services à demander.</React.Fragment>}
              {' '}Pour toute question : <a href="mailto:idriss@ipropre.ca" style={{ color: '#7c5300', textDecoration: 'underline', fontWeight: 600 }}>idriss@ipropre.ca</a>
            </div>
          </div>
        )}
        {tab === 'presentation' && <PresentationPage />}
        {tab === 'soumission' && <SoumissionPage state={state} setState={setState} pushToast={toastFn} history={history} undo={undo} future={future} redo={redo} clientMode={clientMode} clientEditable={clientEditable} initialSnapshot={initialSnapshot} templates={templates} onNewSoumission={handleNewSoumission} onQuickSave={handleQuickSave} isDirty={isDirty} />}
        {tab === 'galerie' && <GaleriePage />}
        {tab === 'annexes' && <AnnexesPage />}
        {tab === 'envoi' && (
          <EnvoiPage
            state={state}
            pushToast={toastFn}
            onLogout={() => { logout(); toastFn('Déconnecté'); }}
            sentLinks={sentLinks}
            gsheet={gsheet}
            isDirty={clientMode ? false : isDirty}
            lastPdfUrl={lastPdfUrl}
            onGoToSoumission={() => setTab('soumission')}
            soumissionMeta={{
              id: store.currentId || '',
              name: currentName,
              status: store.list.find(s => s.id === store.currentId)?.status || 'en_cours',
            }}
          />
        )}

        {/* Contact card — visible at the bottom of every tab */}
        <ContactCard />
        {/* Floating contact pill — top-right, slides in on tab change / scroll-to-top */}
        <ContactPill tabKey={tab} />

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
          <div data-action-menu className={`action-buttons ${actionMenuOpen ? 'show' : ''}`}>
          {tab !== 'soumission' && (
            <button className="btn btn-light" onClick={() => { setTab('soumission'); setActionMenuOpen(false); }}>
              <Icon.edit /> Modifier le devis
            </button>
          )}
          <button className="btn btn-light" onClick={() => { handleQuickPdf(); setActionMenuOpen(false); }} title="G\u00e9n\u00e9rer le PDF de l'offre">
            <Icon.download /> Offre en PDF
          </button>
          {!clientMode && (
            <button
              className="btn btn-light"
              onClick={() => { handleQuickDocx(); setActionMenuOpen(false); }}
              title="Convertir en Google Docs / .docx sur Drive"
              style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon.download />
              <svg width="16" height="14" viewBox="0 0 87 78" xmlns="http://www.w3.org/2000/svg" aria-label="Google Drive">
                <path fill="#0066DA" d="M6.6 66.85L10.45 73.5c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z"/>
                <path fill="#00AC47" d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5L43.65 25z"/>
                <path fill="#EA4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.5 7.9 12.3z"/>
                <path fill="#00832D" d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2L43.65 25z"/>
                <path fill="#2684FC" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L59.8 53z"/>
                <path fill="#FFBA00" d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5l-12.65-22z"/>
              </svg>
            </button>
          )}
          {tab !== 'envoi' && !clientMode && (
            <button className="btn btn-orange" onClick={() => { setTab('envoi'); setActionMenuOpen(false); }}>
              <Icon.mail /> Envoyer l'offre <Icon.arrow />
            </button>
          )}
          </div>
          <button
            data-action-menu
            className="action-more-btn"
            onClick={() => setActionMenuOpen(o => !o)}
            title="Actions"
            aria-label="Plus d'actions"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
        </div>
      </main>

      {toastUI}

      {!clientMode && (
        <SoumissionsModal
          open={showSavedModal}
          onClose={() => setShowSavedModal(false)}
          store={storeWithSync}
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
