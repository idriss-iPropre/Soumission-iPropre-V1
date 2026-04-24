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

function App() {
  const [tab, setTab] = React.useState('presentation');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [toastFn, toastUI] = useToasts();
  const { authed, login, logout } = useAuth();

  const initialState = {
    sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
    prices: ['', '', ''],
    selectedPlan: 1,
  };
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

  const tabs = [
    { id: 'presentation', label: 'Présentation' },
    { id: 'soumission', label: 'Soumission', dot: true },
    { id: 'galerie', label: 'Réalisations' },
    { id: 'annexes', label: 'Annexes' },
    { id: 'envoi', label: 'Envoi' },
  ];

  const totalLines = state.sections.reduce((a, s) => a + s.rows.length, 0);
  const plan = PLAN_DEFS[state.selectedPlan];
  const price = state.prices[state.selectedPlan];

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
          <div className="client-badge">
            <div className="avatar">IP</div>
            <div className="meta">
              <div className="n">Idriss Sassi</div>
              <div className="d">Président · Laval, QC</div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {tab === 'presentation' && <PresentationPage />}
        {tab === 'soumission' && <SoumissionPage state={state} setState={setState} pushToast={toastFn} history={history} undo={undo} future={future} redo={redo} />}
        {tab === 'galerie' && <GaleriePage />}
        {tab === 'annexes' && <AnnexesPage />}
        {tab === 'envoi' && (authed
          ? <EnvoiPage state={state} pushToast={toastFn} onLogout={() => { logout(); toastFn('Déconnecté'); }} />
          : <LoginGate onSuccess={(remember) => { login(remember); toastFn('Connexion réussie'); }} />
        )}

        {/* Sticky action bar (always visible) */}
        <div className="actionbar">
          <div className="total-box">
            <div>
              <div className="k">Plan</div>
              <div className="v">{plan.label}</div>
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
          {tab !== 'envoi' && (
            <button className="btn btn-orange" onClick={() => setTab('envoi')}>
              <Icon.mail /> Envoyer au client <Icon.arrow />
            </button>
          )}
        </div>
      </main>

      {toastUI}

      {/* Tweaks */}
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
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('app-root'));
root.render(<App />);
