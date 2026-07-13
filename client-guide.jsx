// client-guide.jsx — Petit guide d'accueil pour les visiteurs (mode client).
// 4 messages max, affichés une seule fois (persisté), rejouable via la bannière.

const GUIDE_DONE_KEY = 'ipropre.clientguide.v1.done';

function buildGuideSteps(editable) {
  return [
    {
      title: 'Bienvenue chez iPropre !',
      text: <React.Fragment>Voici la soumission préparée <strong>pour vous</strong>. Naviguez avec les onglets du haut : <strong>Présentation</strong>, <strong>Soumission</strong> (le détail des services), <strong>Réalisations</strong> et <strong>Annexes</strong>.</React.Fragment>,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z"/></svg>
      ),
    },
    {
      title: 'Comparez les plans',
      text: <React.Fragment>Chaque colonne du tableau est un plan de service. <strong>Touchez l'en-tête d'un plan</strong> pour le choisir : il se surligne en orange et le prix s'affiche en bas de l'écran.</React.Fragment>,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
      ),
    },
    editable ? {
      title: 'Ajustez à votre goût',
      text: <React.Fragment>Vous pouvez <strong>modifier n'importe quelle cellule</strong> ou ajouter des lignes de service. Vos changements seront surlignés en orange dans le PDF final — nous les validerons ensemble.</React.Fragment>,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      ),
    } : {
      title: 'Besoin d\'un service de plus ?',
      text: <React.Fragment>Utilisez <strong>« Ajouter une ligne »</strong> dans une section pour demander un service supplémentaire. Nous confirmerons le tarif avec vous rapidement.</React.Fragment>,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      ),
    },
    {
      title: 'Confirmez votre choix',
      text: <React.Fragment>Quand tout vous convient, téléchargez le document avec <strong>« Offre en PDF »</strong> dans la barre du bas, ou écrivez-nous : <a href="mailto:idriss@ipropre.ca" style={{ color: 'var(--ip-orange)', fontWeight: 600 }}>idriss@ipropre.ca</a>.</React.Fragment>,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      ),
    },
  ];
}

function ClientGuide({ editable }) {
  const [visible, setVisible] = React.useState(() => {
    try { return localStorage.getItem(GUIDE_DONE_KEY) !== '1'; } catch (e) { return true; }
  });
  const [step, setStep] = React.useState(0);
  const steps = React.useMemo(() => buildGuideSteps(editable), [editable]);

  // Rejouer le guide depuis la bannière ("Revoir le guide")
  React.useEffect(() => {
    window.ipropreReplayGuide = () => { setStep(0); setVisible(true); };
    return () => { if (window.ipropreReplayGuide) delete window.ipropreReplayGuide; };
  }, []);

  const finish = () => {
    setVisible(false);
    try { localStorage.setItem(GUIDE_DONE_KEY, '1'); } catch (e) {}
  };

  if (!visible) return null;
  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="client-guide-card" role="dialog" aria-label="Guide d'utilisation">
      <style>{`
        .client-guide-card {
          position: fixed; right: 20px; bottom: 92px; z-index: 70;
          width: 330px; max-width: calc(100vw - 24px);
          background: rgba(255,255,255,0.82);
          -webkit-backdrop-filter: saturate(170%) blur(22px);
          backdrop-filter: saturate(170%) blur(22px);
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 18px 50px rgba(15,15,16,0.18), inset 0 1px 0 rgba(255,255,255,0.85);
          border-radius: 20px; padding: 18px 18px 14px;
          animation: guideIn 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) both;
        }
        @keyframes guideIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 720px) {
          .client-guide-card { right: 12px; left: 12px; width: auto; bottom: 150px; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: 'var(--ip-orange)', color: '#fff',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 6px 16px rgba(244,165,28,0.35)',
        }}>
          {s.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16.5, fontWeight: 700, lineHeight: 1.25 }}>{s.title}</div>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ip-muted)', flexShrink: 0 }}>{step + 1}/{steps.length}</div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ip-ink-2)', lineHeight: 1.55, marginTop: 5 }}>{s.text}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Étape ${i + 1}`}
              style={{
                width: i === step ? 18 : 7, height: 7, borderRadius: 999, padding: 0,
                background: i === step ? 'var(--ip-orange)' : 'rgba(15,15,16,0.16)',
                border: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {!isLast && (
          <button onClick={finish} style={{ fontSize: 12, color: 'var(--ip-muted)', padding: '7px 8px', borderRadius: 8 }}>
            Passer
          </button>
        )}
        <button
          onClick={() => (isLast ? finish() : setStep(step + 1))}
          className="btn btn-orange"
          style={{ padding: '8px 16px', fontSize: 12.5, borderRadius: 10 }}
        >
          {isLast ? 'C\'est parti !' : 'Suivant'}
          {!isLast && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ClientGuide });
