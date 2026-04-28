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

function SoumissionPage({ state, setState, pushToast, history, undo, future, redo, clientMode = false, initialSnapshot = null }) {
  const { sections, prices, selectedPlan } = state;
  const hiddenPlans = state.hiddenPlans || [];
  const visiblePlans = PLAN_DEFS.map((p, i) => ({ p, i })).filter(({ i }) => !hiddenPlans.includes(i));
  const ro = clientMode; // read-only flag, terse alias
  const visibleCount = visiblePlans.length;
  const gridTpl = `minmax(240px, 1.6fr) repeat(${Math.max(visibleCount, 1)}, 1fr)`;
  const [openMenu, setOpenMenu] = React.useState(null); // plan index of open dot-menu
  const [collapsed, setCollapsed] = React.useState({});

  // Close menu when clicking outside
  React.useEffect(() => {
    if (openMenu === null) return;
    const onDown = () => setOpenMenu(null);
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  const hidePlan = (idx) => {
    setState(s => {
      const cur = s.hiddenPlans || [];
      if (cur.includes(idx)) return s;
      // Don't allow hiding all 3
      if (cur.length >= 2) { pushToast('Au moins une colonne doit rester visible'); return s; }
      // If hiding the selected plan, switch to first visible one
      let nextSelected = s.selectedPlan;
      const nextHidden = [...cur, idx];
      if (nextHidden.includes(nextSelected)) {
        nextSelected = PLAN_DEFS.findIndex((_, i) => !nextHidden.includes(i));
      }
      return { ...s, hiddenPlans: nextHidden, selectedPlan: nextSelected };
    });
    pushToast(`${PLAN_DEFS[idx].label} masqu\u00e9`);
    setOpenMenu(null);
  };

  const showPlan = (idx) => {
    setState(s => ({ ...s, hiddenPlans: (s.hiddenPlans || []).filter(i => i !== idx) }));
    pushToast(`${PLAN_DEFS[idx].label} r\u00e9affich\u00e9`);
  };

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
        const newRow = { label: '', v: ['', '', ''], isNew: true };
        if (ro) newRow.clientAdded = true;
        return { ...sec, rows: [...sec.rows, newRow] };
      });
      return { ...s, sections: secs };
    });
    pushToast(ro ? 'Service ajouté — modifiez le PDF puis renvoyez-le à iPropre' : 'Ligne ajoutée');
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
    setState(s => ({ ...s, selectedPlan: s.selectedPlan === idx ? null : idx }));
    pushToast(selectedPlan === idx ? 'Plan désélectionné' : `Plan sélectionné : ${PLAN_DEFS[idx].label}`);
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
          {!ro && (
          <React.Fragment>
          <button className="btn btn-ghost" onClick={undo} disabled={!history || history.length === 0} style={{ opacity: (!history || history.length === 0) ? 0.4 : 1 }} title="Annuler la dernière action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
            Annuler {history && history.length > 0 ? `(${history.length})` : ''}
          </button>
          <button className="btn btn-ghost" onClick={() => { if (typeof redo === 'function') redo(); }} disabled={!future || future.length === 0} style={{ opacity: (!future || future.length === 0) ? 0.4 : 1 }} title="Rétablir / Avancé">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>
            Avancé {future && future.length > 0 ? `(${future.length})` : ''}
          </button>
          </React.Fragment>
          )}
          <button className="btn btn-ghost" onClick={toggleAll}>
            {allOpen ? 'Tout replier' : 'Tout déplier'}
          </button>
          {!ro && (
          <button className="btn btn-ghost" onClick={addSection}>
            <Icon.plus /> Ajouter un service
          </button>
          )}
        </div>
      </div>

      {/* Hidden plans badge bar */}
      {!ro && hiddenPlans.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: 'rgba(244,165,28,0.06)', borderRadius: 8, border: '1px dashed rgba(244,165,28,0.4)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ip-muted)' }}>
            Colonnes masquées :
          </span>
          {hiddenPlans.map(idx => (
            <button key={idx} className="btn btn-ghost" onClick={() => showPlan(idx)} style={{ padding: '4px 10px', fontSize: 12, gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Réafficher {PLAN_DEFS[idx].label}
            </button>
          ))}
        </div>
      )}

      {/* Plan header card */}
      <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div className="plan-header-grid" style={{ display: 'grid', gridTemplateColumns: gridTpl }}>
          <div style={{ padding: '22px 24px', borderRight: '1px solid var(--ip-line)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ip-muted)', marginBottom: 6 }}>Nos tarifs</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700 }}>Plans de service</div>
            <div style={{ fontSize: 13, color: 'var(--ip-muted)', marginTop: 6 }}>Comparez les {visibleCount} plan{visibleCount>1?'s':''} côte à côte, puis sélectionnez celui qui convient.</div>
          </div>
          {visiblePlans.map(({ p, i: planIdx }, vi) => (
            <div
              key={p.key}
              className={`plan-head ${p.headCls}`}
              style={{
                position: 'relative',
                borderLeft: vi > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                outline: selectedPlan === planIdx ? '3px solid var(--ip-ink)' : 'none',
                outlineOffset: -3,
                transition: 'outline 0.15s',
              }}
            >
              <button
                onClick={() => setSelectedPlan(planIdx)}
                style={{ all: 'unset', display: 'block', width: '100%', height: '100%', padding: 'inherit', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}
              >
                <div className="lbl">{p.label}</div>
                <div className="sub" style={{ color: 'var(--ip-ink-2)' }}>{p.sub}</div>
                {p.ribbon && <div className="ribbon">{p.ribbon}</div>}
              </button>
              {selectedPlan === planIdx && (
                <div style={{ position: 'absolute', top: 8, right: 36, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--ip-ink)', color: '#fff', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', pointerEvents: 'none' }}>
                  <Icon.check size={10}/> Choisi
                </div>
              )}
              {/* 3-dot menu */}
              {!ro && (
              <div style={{ position: 'absolute', top: 6, right: 6 }} onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === planIdx ? null : planIdx); }}
                  title="Options de la colonne"
                  style={{
                    width: 28, height: 28, border: 'none', background: 'rgba(255,255,255,0.6)',
                    borderRadius: 6, cursor: 'pointer', display: 'grid', placeItems: 'center',
                    color: 'var(--ip-ink)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                </button>
                {openMenu === planIdx && (
                  <div style={{
                    position: 'absolute', top: 32, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid var(--ip-line)', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden',
                  }}>
                    <button onClick={() => hidePlan(planIdx)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                      padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                      fontSize: 13, color: 'var(--ip-ink)', fontFamily: 'var(--font-sans)',
                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ip-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      Cacher cette colonne
                    </button>
                    {selectedPlan !== planIdx && (
                      <button onClick={() => { setSelectedPlan(planIdx); setOpenMenu(null); }} style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                        padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                        fontSize: 13, color: 'var(--ip-ink)', fontFamily: 'var(--font-sans)', borderTop: '1px solid var(--ip-line-2)',
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ip-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <Icon.check size={12} /> Choisir ce plan
                      </button>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
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
            {sec.isCustom && !ro ? (
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
            {!ro && (
            <button className="btn-icon danger" title="Supprimer la section" onClick={() => removeSection(secIdx)}>
              <Icon.trash />
            </button>
            )}
          </div>

          {!isClosed && <table className="stable">
            <thead>
              <tr>
                <th style={{ width: '44%' }}>Prestation</th>
                {visiblePlans.map(({ p }) => <th key={p.key} style={{ width: `${Math.min(48 / visibleCount, 22)}%` }}>{p.label}</th>)}
                {!ro && <th style={{ width: 36 }}></th>}
              </tr>
            </thead>
            <tbody>
              {sec.rows.map((row, rowIdx) => (
                <tr key={rowIdx} style={row.clientAdded ? { background: 'rgba(244,165,28,0.05)' } : undefined}>
                  <td style={{ paddingRight: 18, position: 'relative' }}>
                    {ro && !row.clientAdded ? (
                      <div style={{ padding: '6px 10px 6px 6px', fontWeight: 500, lineHeight: 1.4, color: row.label ? 'var(--ip-ink)' : 'var(--ip-muted)' }}>
                        {row.label || <em style={{ color: '#bbb' }}>(sans nom)</em>}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {row.clientAdded && <span style={{ display: 'inline-block', padding: '2px 7px', background: '#F4A51C', color: '#fff', fontSize: 9.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 999, flexShrink: 0 }}>Ajouté</span>}
                        <input
                          className="txt-input"
                          value={row.label}
                          placeholder={ro ? 'Décrivez le service souhaité…' : 'Nom de la prestation…'}
                          onChange={(e) => updateRowLabel(secIdx, rowIdx, e.target.value)}
                          style={{ border: 'none', background: 'transparent', padding: '6px 10px 6px 6px', fontWeight: 500, lineHeight: 1.4, flex: 1 }}
                        />
                      </div>
                    )}
                  </td>
                  {visiblePlans.map(({ p, i: pi }) => (
                    <td key={p.key} data-plan={p.label}>
                      {ro && !row.clientAdded ? (
                        <div className={p.colCls} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 13.5, color: row.v[pi] ? 'var(--ip-ink)' : 'var(--ip-muted)', fontWeight: row.v[pi] ? 500 : 400 }}>
                          {row.v[pi] || '—'}
                        </div>
                      ) : (
                        <SmartSelect
                          value={row.v[pi]}
                          onChange={(val) => updateRowValue(secIdx, rowIdx, pi, val)}
                          options={sec.options}
                          extraClass={p.colCls}
                        />
                      )}
                    </td>
                  ))}
                  {!ro && (
                  <td className="row-delete">
                    <button className="btn-icon danger" title="Supprimer la ligne" onClick={() => removeRow(secIdx, rowIdx)}>
                      <Icon.trash />
                    </button>
                  </td>
                  )}
                  {ro && row.clientAdded && (
                    <td style={{ width: 36, textAlign: 'center' }}>
                      <button className="btn-icon danger" title="Retirer cette ligne ajoutée" onClick={() => removeRow(secIdx, rowIdx)} style={{ opacity: 0.6 }}>
                        <Icon.trash />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="add-line-row">
                <td colSpan={visibleCount + (ro ? 1 : 2)} className="add-line" style={{ padding: '10px 14px', borderBottom: 'none' }}>
                  <button className="btn btn-ghost" onClick={() => addRow(secIdx)} style={{ padding: '7px 12px', fontSize: 12.5 }}>
                    <Icon.plus size={12} /> {ro ? 'Demander un service supplémentaire' : 'Ajouter une ligne'}
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
        <div className="prices-grid" style={{ display: 'grid', gridTemplateColumns: gridTpl }}>
          <div style={{ padding: '18px 24px', background: 'var(--ip-ink)', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Prix</div>
            <div style={{ fontSize: 12, color: '#a9a9b0' }}>par mois, taxes en sus</div>
          </div>
          {visiblePlans.map(({ p, i: planIdx }, vi) => (
            <div key={p.key} className={`plan-head ${p.headCls}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              borderLeft: vi > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              padding: '16px 14px', outline: selectedPlan === planIdx ? '3px solid var(--ip-ink)' : 'none', outlineOffset: -3,
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ip-muted)' }}>$</span>
              {ro ? (
                <div style={{
                  width: 110, textAlign: 'right',
                  fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
                  padding: '6px 10px',
                  color: prices[planIdx] ? 'var(--ip-ink)' : '#c0392b',
                }}>
                  {prices[planIdx] || <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>À confirmer</span>}
                </div>
              ) : (
              <input
                className="txt-input"
                value={prices[planIdx]}
                onChange={(e) => setPrice(planIdx, e.target.value)}
                placeholder="0"
                style={{
                  width: 110, textAlign: 'right',
                  fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
                  background: 'rgba(255,255,255,0.7)',
                  border: prices[planIdx] ? '1px solid rgba(0,0,0,0.08)' : '1.5px solid #e87a6c',
                  color: prices[planIdx] ? 'var(--ip-ink)' : '#c0392b',
                  padding: '6px 10px',
                }}
              />
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ip-ink-2)' }}>/mois</span>
            </div>
          ))}
        </div>

        {/* Plan-choice checkbox row */}
        <div className="choice-grid" style={{ display: 'grid', gridTemplateColumns: gridTpl, borderTop: '1px solid var(--ip-line)' }}>
          <div style={{ padding: '14px 24px', background: '#fafaf6', display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid var(--ip-line)' }}>
            <Icon.check size={14} />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Mon choix</div>
              <div style={{ fontSize: 11.5, color: 'var(--ip-muted)' }}>Cochez le plan désiré</div>
            </div>
          </div>
          {visiblePlans.map(({ p, i: planIdx }, vi) => {
            const isSel = selectedPlan === planIdx;
            return (
            <label
              key={p.key}
              onClick={() => setSelectedPlan(planIdx)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 14px', cursor: 'pointer',
                borderLeft: vi > 0 ? '1px solid var(--ip-line-2)' : 'none',
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
