// Local storage of named soumissions

const STORAGE_KEY = 'ipropre_soumissions_v1';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveAll(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

function makeId() { return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function useSoumissions() {
  const [list, setList] = React.useState(loadAll);
  const [currentId, setCurrentId] = React.useState(null);

  const refresh = () => setList(loadAll());

  const save = (state, name) => {
    const all = loadAll();
    const id = currentId || makeId();
    const idx = all.findIndex(x => x.id === id);
    const item = { id, name: name || `Soumission du ${new Date().toLocaleDateString('fr-CA')}`, state, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = item; else all.push(item);
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    saveAll(all);
    setList(all);
    setCurrentId(id);
    return item;
  };

  const saveAs = (state, name) => {
    const all = loadAll();
    const id = makeId();
    const item = { id, name, state, updatedAt: Date.now() };
    all.push(item);
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    saveAll(all);
    setList(all);
    setCurrentId(id);
    return item;
  };

  const load = (id) => {
    const all = loadAll();
    const item = all.find(x => x.id === id);
    if (item) setCurrentId(id);
    return item;
  };

  const rename = (id, name) => {
    const all = loadAll();
    const idx = all.findIndex(x => x.id === id);
    if (idx >= 0) { all[idx].name = name; all[idx].updatedAt = Date.now(); saveAll(all); setList(all); }
  };

  const remove = (id) => {
    const all = loadAll().filter(x => x.id !== id);
    saveAll(all);
    setList(all);
    if (currentId === id) setCurrentId(null);
  };

  return { list, currentId, save, saveAs, load, rename, remove, refresh, setCurrentId };
}

// Modal — manage saved soumissions (open / rename / delete / save-as)
function SoumissionsModal({ open, onClose, store, currentState, onLoad, pushToast }) {
  const [renaming, setRenaming] = React.useState(null); // { id, name }
  const [newName, setNewName] = React.useState('');
  const [showSaveAs, setShowSaveAs] = React.useState(false);

  React.useEffect(() => {
    if (open) { setRenaming(null); setShowSaveAs(false); setNewName(''); }
  }, [open]);

  if (!open) return null;

  const fmt = (ts) => new Date(ts).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '92%' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Mes soumissions enregistrées</div>
            <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>{store.list.length} soumission{store.list.length > 1 ? 's' : ''} dans cet appareil</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', width: 32, height: 32, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ maxHeight: 420, overflow: 'auto', padding: '6px 12px' }}>
          {store.list.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ip-muted)', fontSize: 13.5 }}>
              Aucune soumission enregistrée.<br/>
              Cliquez sur <strong>Enregistrer</strong> dans la barre du haut pour sauvegarder votre travail.
            </div>
          )}
          {store.list.map(item => {
            const isCurrent = item.id === store.currentId;
            const isRen = renaming && renaming.id === item.id;
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', margin: '4px 0',
                borderRadius: 10,
                background: isCurrent ? 'rgba(244,165,28,0.08)' : 'transparent',
                border: isCurrent ? '1px solid rgba(244,165,28,0.4)' : '1px solid transparent',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isRen ? (
                    <input
                      className="txt-input"
                      autoFocus
                      value={renaming.name}
                      onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { store.rename(item.id, renaming.name.trim() || item.name); setRenaming(null); pushToast('Renommée'); }
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      style={{ fontSize: 14, padding: '6px 8px' }}
                    />
                  ) : (
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ip-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                      {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 7px', background: 'var(--ip-orange)', color: '#fff', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>en cours</span>}
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 2 }}>
                    Mise à jour : {fmt(item.updatedAt)} · {item.state.sections?.length || 0} sections
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {isRen ? (
                    <React.Fragment>
                      <button className="btn-icon" onClick={() => { store.rename(item.id, renaming.name.trim() || item.name); setRenaming(null); pushToast('Renommée'); }} title="Valider" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button className="btn-icon" onClick={() => setRenaming(null)} title="Annuler" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <button className="btn btn-ghost" onClick={() => { onLoad(item); }} title="Ouvrir" style={{ padding: '6px 12px', fontSize: 12.5 }}>Ouvrir</button>
                      <button className="btn-icon" onClick={() => setRenaming({ id: item.id, name: item.name })} title="Renommer" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-icon" onClick={() => { if (confirm('Supprimer cette soumission ?')) { store.remove(item.id); pushToast('Supprimée'); } }} title="Supprimer" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer', color: '#c53030' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {showSaveAs ? (
            <React.Fragment>
              <input
                className="txt-input"
                placeholder="Nom de la soumission"
                value={newName}
                autoFocus
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) { store.saveAs(currentState, newName.trim()); setShowSaveAs(false); setNewName(''); pushToast('Enregistrée'); }
                  if (e.key === 'Escape') { setShowSaveAs(false); setNewName(''); }
                }}
                style={{ flex: 1, minWidth: 200, fontSize: 13 }}
              />
              <button className="btn btn-orange" onClick={() => { if (newName.trim()) { store.saveAs(currentState, newName.trim()); setShowSaveAs(false); setNewName(''); pushToast('Enregistrée'); } }} disabled={!newName.trim()} style={{ opacity: newName.trim() ? 1 : 0.5 }}>Enregistrer</button>
              <button className="btn btn-ghost" onClick={() => { setShowSaveAs(false); setNewName(''); }}>Annuler</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="btn btn-orange" onClick={() => setShowSaveAs(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Nouvelle entrée
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useSoumissions, SoumissionsModal });
