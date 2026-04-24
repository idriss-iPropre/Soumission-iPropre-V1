// Soumission — interactive quote form with dynamic rows and custom dropdown values.
// This is the pièce maîtresse.

const FREQ_OPTIONS = [
  'NA', 'SD', 'Au besoin', 'Fréquence',
  '1x / semaine', '2x / semaine', '3x / semaine', '5x / semaine',
  '1x / 2 semaines', '1x / mois', '2x / mois',
  '1x / an', '2x / an', '3h / an',
];

const GUARANTEE_OPTIONS = ['Inclus', 'Non inclus', 'En option'];

// Section templates — match the iPropre PDF structure but simplified
const DEFAULT_SECTIONS = [
  {
    id: 'garantie',
    title: 'Garantie de Travail',
    color: 'var(--ip-orange)',
    options: GUARANTEE_OPTIONS,
    defaultValue: 'Inclus',
    rows: [
      { label: 'Assurance Civile', v: ['Inclus', 'Inclus', 'Inclus'] },
      { label: 'Confidentialité', v: ['Inclus', 'Inclus', 'Inclus'] },
      { label: 'Politique alcool et drogue', v: ['Inclus', 'Inclus', 'Inclus'] },
      { label: 'Norme de travail (70 points)', v: ['Inclus', 'Inclus', 'Inclus'] },
      { label: 'Journal des tâches', v: ['Inclus', 'Inclus', 'Inclus'] },
      { label: "Grille d'évaluation qualité", v: ['Inclus', 'Inclus', 'Inclus'] },
    ],
  },
  {
    id: 'entretien',
    title: 'Service : Entretien',
    options: FREQ_OPTIONS,
    rows: [
      { label: 'Service complet', v: ['NA', 'NA', 'NA'] },
      { label: "Service d'appoint", v: ['SD', 'SD', 'SD'] },
      { label: 'Service de bricolage', v: ['3h / an', '3h / an', '3h / an'] },
      { label: "Intervention d'urgence", v: ['Au besoin', 'Au besoin', 'Au besoin'] },
    ],
  },
  {
    id: 'vitre',
    title: 'Service : Vitre',
    options: FREQ_OPTIONS,
    rows: [
      { label: "Vitres des portes d'entrée", v: ['Au besoin', 'Au besoin', 'Au besoin'] },
      { label: 'Vitres extérieurs + cadres', v: ['Fréquence', 'Fréquence', 'Fréquence'] },
      { label: "Vitres d'intérieur", v: ['1x / 2 semaines', '1x / 2 semaines', '1x / 2 semaines'] },
    ],
  },
  {
    id: 'tapis',
    title: 'Service : Tapis',
    options: FREQ_OPTIONS,
    rows: [
      { label: "Installation tapis d'hiver (Sur mesure)", v: ['', '', ''] },
      { label: "Lavage des tapis d'hiver (Avec brosse)", v: ['1x / mois', '1x / mois', '1x / mois'] },
      { label: 'Lavage des surfaces sol en tapis', v: ['Fréquence', 'Fréquence', 'Fréquence'] },
    ],
  },
  {
    id: 'plancher',
    title: 'Service : Plancher spécifique',
    options: FREQ_OPTIONS,
    rows: [
      { label: 'Polissage du plancher', v: ['Fréquence', 'Fréquence', 'Fréquence'] },
      { label: 'Décapage & Cirage plancher', v: ['Au besoin', 'Au besoin', 'Au besoin'] },
      { label: 'Récurage céramique', v: ['Au besoin', 'Au besoin', 'Au besoin'] },
    ],
  },
  {
    id: 'travaux',
    title: 'Travaux spécifiques',
    options: FREQ_OPTIONS,
    rows: [
      { label: 'Traitement insecticide', v: ['Au besoin', 'Au besoin', 'Au besoin'] },
      { label: 'Nettoyage des grilles de ventilation', v: ['Au besoin', 'Au besoin', 'Au besoin'] },
      { label: "Nettoyage d'éclairage", v: ['Au besoin', 'Au besoin', 'Au besoin'] },
      { label: 'Lavage des murs', v: ['1x / an', '1x / an', '1x / an'] },
      { label: "Lavage de l'intérieur des frigidaires", v: ['', '', ''] },
      { label: 'Nettoyage à pression', v: ['', '', ''] },
    ],
  },
];

const PLAN_DEFS = [
  { key: 0, label: 'Devis initial', sub: 'Votre base', headCls: 'initial', colCls: 'col-initial' },
  { key: 1, label: 'Offre iPropre', sub: 'Recommandé',  headCls: 'offre',   colCls: 'col-offre', ribbon: 'Recommandé' },
  { key: 2, label: 'VIP Tout inclus', sub: 'Premium',    headCls: 'vip',     colCls: 'col-vip' },
];

function SoumissionPage({ state, setState, pushToast, history, undo, future, redo }) {
  const { sections, prices, selectedPlan } = state;
  const [collapsed, setCollapsed] = React.useState({});

  const toggleCollapse = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }));
  const allOpen = sections.every(s => !collapsed[s.id]);
  const toggleAll = () => {
    if (allOpen) {
      const next = {}; sections.forEach(s => next[s.id] = true);
      setCollapsed(next);
    } else {
      setCollapsed({});
    }
  };

  const updateRowValue = (secIdx, rowIdx, planIdx, val) => {
    setState(s => {
      const secs = s.sections.map((sec, si) => {
        if (si !== secIdx) return sec;
        const rows = sec.rows.map((r, ri) => ri === rowIdx ? { ...r, v: r.v.map((x, pi) => pi === planIdx ? val : x) } : r);
        return { ...sec, rows };
      });
      return { ...s, sections: secs };
    });
  };

  const updateRowLabel = (secIdx, rowIdx, label) => {
    setState(s => {
      const secs = s.sections.map((sec, si) => {
        if (si !== secIdx) return sec;
        return { ...sec, rows: sec.rows.map((r, ri) => ri === rowIdx ? { ...r, label } : r) };
      });
      return { ...s, sections: secs };
    });
  };

  const addRow = (secIdx) => {
    setState(s => {
      const secs = s.sections.map((sec, si) => {
        if (si !== secIdx) return sec;
        return { ...sec, rows: [...sec.rows, { label: '', v: ['', '', ''], isNew: true }] };
      });
      return { ...s, sections: secs };
    });
    pushToast('Ligne ajoutée');
  };

  const removeRow = (secIdx, rowIdx) => {
    setState(s => {
      const secs = s.sections.map((sec, si) => {
        if (si !== secIdx) return sec;
        return { ...sec, rows: sec.rows.filter((_, ri) => ri !== rowIdx) };
      });
      return { ...s, sections: secs };
    });
    pushToast('Ligne supprimée');
  };

  const addSection = () => {
    setState(s => {
      const id = 'custom-' + Date.now();
      return {
        ...s,
        sections: [...s.sections, {
          id, title: 'Nouveau service', options: FREQ_OPTIONS,
          rows: [{ label: '', v: ['', '', ''], isNew: true }],
          isCustom: true,
        }]
      };
    });
    pushToast('Section ajoutée');
  };

  const removeSection = (secIdx) => {
    setState(s => ({ ...s, sections: s.sections.filter((_, i) => i !== secIdx) }));
    pushToast('Section supprimée');
  };

  const renameSection = (secIdx, title) => {
    setState(s => ({ ...s, sections: s.sections.map((sec, i) => i === secIdx ? { ...sec, title } : sec) }));
  };

  const setPrice = (planIdx, val) => {
    setState(s => ({ ...s, prices: s.prices.map((p, i) => i === planIdx ? val : p) }));
  };

  const setSelectedPlan = (idx) => {
    setState(s => ({ ...s, selectedPlan: idx }));
    pushToast(`Plan sélectionné : ${PLAN_DEFS[idx].label}`);
  };

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <span className="eyebrow">02 — Soumission</span>
          <h1>Devis interactif.</h1>
          <p className="sub">Ajoutez ou supprimez des lignes par service. Chaque case propose des options ou un champ libre « Personnaliser ».</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={undo} disabled={!history || history.length === 0} style={{ opacity: (!history || history.length === 0) ? 0.4 : 1 }} title="Annuler la dernière action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
            Annuler {history && history.length > 0 ? `(${history.length})` : ''}
          </button>
          <button className="btn btn-ghost" onClick={() => { if (typeof redo === 'function') redo(); }} disabled={!future || future.length === 0} style={{ opacity: (!future || future.length === 0) ? 0.4 : 1 }} title="Rétablir / Avancé">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>
            Avancé {future && future.length > 0 ? `(${future.length})` : ''}
          </button>
          <button className="btn btn-ghost" onClick={toggleAll}>
            {allOpen ? 'Tout replier' : 'Tout déplier'}
          </button>
          <button className="btn btn-ghost" onClick={addSection}>
            <Icon.plus /> Ajouter un service
          </button>
        </div>
      </div>

      {/* Plan header card */}
      <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div className="plan-header-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.6fr) repeat(3, 1fr)' }}>
          <div style={{ padding: '22px 24px', borderRight: '1px solid var(--ip-line)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ip-muted)', marginBottom: 6 }}>Nos tarifs</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700 }}>Plans de service</div>
            <div style={{ fontSize: 13, color: 'var(--ip-muted)', marginTop: 6 }}>Comparez les 3 plans côte à côte, puis sélectionnez celui qui convient.</div>
          </div>
          {PLAN_DEFS.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setSelectedPlan(i)}
              className={`plan-head ${p.headCls}`}
              style={{
                border: 'none', cursor: 'pointer',
                borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                outline: selectedPlan === i ? '3px solid var(--ip-ink)' : 'none',
                outlineOffset: -3,
                transition: 'outline 0.15s',
              }}
            >
              <div className="lbl">{p.label}</div>
              <div className="sub" style={{ color: 'var(--ip-ink-2)' }}>{p.sub}</div>
              {p.ribbon && <div className="ribbon">{p.ribbon}</div>}
              {selectedPlan === i && (
                <div style={{ position: 'absolute', top: 8, right: 10, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--ip-ink)', color: '#fff', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <Icon.check size={10}/> Choisi
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((sec, secIdx) => {
        const isClosed = !!collapsed[sec.id];
        return (
        <div key={sec.id} className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isClosed ? 'none' : '1px solid var(--ip-line-2)' }}>
            <button
              className="btn-icon"
              onClick={() => toggleCollapse(sec.id)}
              title={isClosed ? 'Déplier' : 'Replier'}
              style={{
                border: 'none', background: 'transparent',
                width: 32, height: 32,
                transform: isClosed ? 'rotate(-90deg)' : 'rotate(0)',
                transition: 'transform 0.18s ease',
              }}
            >
              <Icon.chev size={14} />
            </button>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ip-bg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <BrandMark size={20} />
            </div>
            {sec.isCustom ? (
              <input
                className="txt-input"
                value={sec.title}
                onChange={(e) => renameSection(secIdx, e.target.value)}
                style={{ flex: 1, maxWidth: 360, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--ip-orange)', border: 'none', background: 'transparent', padding: '4px 0' }}
              />
            ) : (
              <h3
                onClick={() => toggleCollapse(sec.id)}
                style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--ip-orange)', letterSpacing: '-0.01em', flex: 1, cursor: 'pointer' }}
              >{sec.title}</h3>
            )}
            <span className="pill">{sec.rows.length} ligne{sec.rows.length>1?'s':''}</span>
            {isClosed && (
              <span className="pill" style={{ background: 'var(--ip-orange-soft)', color: '#7c5300' }}>replié</span>
            )}
            <button className="btn-icon danger" title="Supprimer la section" onClick={() => removeSection(secIdx)}>
              <Icon.trash />
            </button>
          </div>

          {!isClosed && <table className="stable">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Prestation</th>
                {PLAN_DEFS.map(p => <th key={p.key} style={{ width: '18%' }}>{p.label}</th>)}
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {sec.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td>
                    <input
                      className="txt-input"
                      value={row.label}
                      placeholder="Nom de la prestation…"
                      onChange={(e) => updateRowLabel(secIdx, rowIdx, e.target.value)}
                      style={{ border: 'none', background: 'transparent', padding: '4px 6px', fontWeight: 500 }}
                    />
                  </td>
                  {PLAN_DEFS.map((p, pi) => (
                    <td key={p.key} data-plan={p.label}>
                      <SmartSelect
                        value={row.v[pi]}
                        onChange={(val) => updateRowValue(secIdx, rowIdx, pi, val)}
                        options={sec.options}
                        extraClass={p.colCls}
                      />
                    </td>
                  ))}
                  <td className="row-delete">
                    <button className="btn-icon danger" title="Supprimer la ligne" onClick={() => removeRow(secIdx, rowIdx)}>
                      <Icon.trash />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="add-line-row">
                <td colSpan={5} className="add-line" style={{ padding: '10px 14px', borderBottom: 'none' }}>
                  <button className="btn btn-ghost" onClick={() => addRow(secIdx)} style={{ padding: '7px 12px', fontSize: 12.5 }}>
                    <Icon.plus size={12} /> Ajouter une ligne
                  </button>
                </td>
              </tr>
            </tbody>
          </table>}
        </div>
        );
      })}

      {/* Prices row */}
      <div className="card" style={{ marginTop: 20, marginBottom: 20, overflow: 'hidden' }}>
        <div className="prices-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.6fr) repeat(3, 1fr)' }}>
          <div style={{ padding: '18px 24px', background: 'var(--ip-ink)', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Prix</div>
            <div style={{ fontSize: 12, color: '#a9a9b0' }}>par mois, taxes en sus</div>
          </div>
          {PLAN_DEFS.map((p, i) => (
            <div key={p.key} className={`plan-head ${p.headCls}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              padding: '16px 14px', outline: selectedPlan === i ? '3px solid var(--ip-ink)' : 'none', outlineOffset: -3,
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ip-muted)' }}>$</span>
              <input
                className="txt-input"
                value={prices[i]}
                onChange={(e) => setPrice(i, e.target.value)}
                placeholder="0"
                style={{
                  width: 110, textAlign: 'right',
                  fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)',
                  padding: '6px 10px',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ip-ink-2)' }}>/mois</span>
            </div>
          ))}
        </div>

        {/* Plan-choice checkbox row */}
        <div className="choice-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.6fr) repeat(3, 1fr)', borderTop: '1px solid var(--ip-line)' }}>
          <div style={{ padding: '14px 24px', background: '#fafaf6', display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid var(--ip-line)' }}>
            <Icon.check size={14} />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Mon choix</div>
              <div style={{ fontSize: 11.5, color: 'var(--ip-muted)' }}>Cochez le plan désiré</div>
            </div>
          </div>
          {PLAN_DEFS.map((p, i) => {
            const isSel = selectedPlan === i;
            return (
            <label
              key={p.key}
              onClick={() => setSelectedPlan(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 14px', cursor: 'pointer',
                borderLeft: i > 0 ? '1px solid var(--ip-line-2)' : 'none',
                background: isSel ? 'rgba(244,165,28,0.10)' : '#fafaf6',
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                border: isSel ? '2px solid var(--ip-orange)' : '2px solid var(--ip-line)',
                background: isSel ? 'var(--ip-orange)' : '#fff',
                display: 'grid', placeItems: 'center',
                transition: 'all 0.15s',
              }}>
                {isSel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>}
              </span>
              <span style={{ fontWeight: isSel ? 700 : 500, fontSize: 13.5, color: isSel ? 'var(--ip-ink)' : 'var(--ip-ink-2)' }}>
                {isSel ? 'Plan sélectionné' : `Choisir ${p.label}`}
              </span>
            </label>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ fontSize: 12, color: 'var(--ip-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginBottom: 8 }}>
        NA : non applicable &nbsp;·&nbsp; SD : sur demande &nbsp;·&nbsp; 1x : une fois &nbsp;·&nbsp; 2x : deux fois &nbsp;·&nbsp; Tous les champs sont éditables
      </div>
    </div>
  );
}

Object.assign(window, { SoumissionPage, DEFAULT_SECTIONS, PLAN_DEFS, FREQ_OPTIONS, GUARANTEE_OPTIONS });
