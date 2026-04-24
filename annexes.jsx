// Annexes — clickable documents grouped by "Contrat" and "Employé"

const ANNEXES = {
  contrat: {
    title: 'Contrat',
    accent: 'var(--ip-orange)',
    bg: 'linear-gradient(135deg, #F4A51C 0%, #d99115 100%)',
    items: [
      { label: "Grille d'appréciation", file: 'assets/annexes/grille-appreciation.pdf' },
      { label: 'Attestation RQ et CNESST', file: 'assets/annexes/attestation-rq-cnesst.pdf' },
      { label: 'Garantie Civile 5 000 000$', file: 'assets/annexes/assurance-5M.png', kind: 'image' },
      { label: 'Commentaires clients', file: 'assets/annexes/commentaires-clients.pdf' },
      { label: 'Éthique iPropre', file: 'assets/annexes/ethique-ipropre.pdf' },
      { label: 'Exemples céramique', file: 'assets/annexes/ceramique.pdf' },
      { label: 'Contrat complet', file: 'assets/annexes/contrat.pdf' },
    ],
  },
  employe: {
    title: 'Employé',
    accent: '#5c5c66',
    bg: 'linear-gradient(135deg, #5c5c66 0%, #3a3a3f 100%)',
    items: [
      { label: '70 Points contrôle de qualité', file: 'assets/annexes/70-points.pdf' },
      { label: 'Accord de confidentialité', file: 'assets/annexes/confidentialite.pdf' },
      { label: 'Politique alcool et drogue', file: 'assets/annexes/politique-alcool-drogue.pdf' },
      { label: 'Équipement et habillement', file: 'assets/annexes/equipement.pdf' },
      { label: 'Manuel du norme de travail', file: 'assets/annexes/manuel-norme-travail.pdf' },
    ],
  },
};

function AnnexesPage() {
  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <span className="eyebrow">04 — Annexes</span>
          <h1>Documents consultables.</h1>
          <p className="sub">Cliquez sur un document pour l'ouvrir dans un nouvel onglet. Les documents manquants peuvent être fournis.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {Object.values(ANNEXES).map((group) => (
          <div key={group.title} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px', background: group.bg, color: '#fff' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 6 }}>Dossier</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700 }}>{group.title}</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{group.items.length} document{group.items.length > 1 ? 's' : ''}</div>
            </div>
            <div style={{ padding: 8 }}>
              {group.items.map((it, i) => (
                <a
                  key={i}
                  href={it.missing ? '#' : it.file}
                  target={it.missing ? undefined : '_blank'}
                  rel="noopener"
                  onClick={(e) => { if (it.missing) e.preventDefault(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 10,
                    textDecoration: 'none', color: 'var(--ip-ink)',
                    transition: 'background 0.12s',
                    opacity: it.missing ? 0.55 : 1,
                    cursor: it.missing ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => { if (!it.missing) e.currentTarget.style.background = 'var(--ip-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: group.accent + '22', color: group.accent,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    {it.kind === 'image' ? <Icon.image /> : <Icon.doc />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{it.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {it.missing ? 'Document à fournir' : (it.kind === 'image' ? 'PNG' : 'PDF')}
                    </div>
                  </div>
                  {!it.missing && <Icon.external />}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AnnexesPage, ANNEXES });
