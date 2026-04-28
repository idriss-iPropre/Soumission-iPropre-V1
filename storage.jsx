// Local storage of named soumissions — with status workflow + version history

const STORAGE_KEY = 'ipropre_soumissions_v2';
const LEGACY_KEY = 'ipropre_soumissions_v1';
const MAX_VERSIONS = 20;
const LINKS_KEY = 'ipropre_sent_links_v1';

// ---------- Sent client-link tracking & revocation ----------
function loadLinks() {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    return raw ? (JSON.parse(raw) || []) : [];
  } catch { return []; }
}
function saveLinks(arr) {
  try { localStorage.setItem(LINKS_KEY, JSON.stringify(arr)); } catch {}
}
function makeLinkId() {
  // Short random ID — embedded in client URL, used as revocation key
  return 'L' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}
function isLinkRevoked(linkId) {
  if (!linkId) return false;
  const links = loadLinks();
  const entry = links.find(l => l.linkId === linkId);
  return !!(entry && entry.revoked);
}
window.isLinkRevoked = isLinkRevoked;

// Status workflow
const STATUSES = [
  { id: 'en_cours',  label: 'En cours',  color: '#F4A51C', bg: 'rgba(244,165,28,0.12)' },
  { id: 'plus_tard', label: 'Plus tard', color: '#6b7a99', bg: 'rgba(107,122,153,0.12)' },
  { id: 'conclue',   label: 'Conclue',   color: '#2c8a4a', bg: 'rgba(44,138,74,0.12)' },
  { id: 'refusee',   label: 'Refusée',   color: '#c0392b', bg: 'rgba(192,57,43,0.10)' },
];
const STATUS_BY_ID = Object.fromEntries(STATUSES.map(s => [s.id, s]));

function loadAll() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from v1
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const arr = JSON.parse(legacy);
        if (Array.isArray(arr)) {
          const upgraded = arr.map(it => ({
            ...it,
            status: it.status || 'en_cours',
            versions: it.versions || [],
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
          return upgraded;
        }
      }
      return [];
    }
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveAll(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

function makeId() { return 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function makeVersionId() { return 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4); }

function useSoumissions() {
  const [list, setList] = React.useState(loadAll);
  const [currentId, setCurrentId] = React.useState(null);

  const refresh = () => setList(loadAll());

  // Save: if the soumission already exists, push the previous state to versions[].
  const save = (state, name) => {
    const all = loadAll();
    const id = currentId || makeId();
    const idx = all.findIndex(x => x.id === id);
    if (idx >= 0) {
      const prev = all[idx];
      // Snapshot previous state as a version
      const snapshot = {
        vid: makeVersionId(),
        state: prev.state,
        savedAt: prev.updatedAt,
        label: 'Modification ' + new Date().toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }),
      };
      const versions = [snapshot, ...(prev.versions || [])].slice(0, MAX_VERSIONS);
      all[idx] = { ...prev, state, name: name || prev.name, updatedAt: Date.now(), versions };
    } else {
      all.push({
        id, name: name || `Soumission du ${new Date().toLocaleDateString('fr-CA')}`,
        state, updatedAt: Date.now(), createdAt: Date.now(),
        status: 'en_cours', versions: [],
      });
    }
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    saveAll(all);
    setList(all);
    setCurrentId(id);
    return all.find(x => x.id === id);
  };

  const saveAs = (state, name) => {
    const all = loadAll();
    const id = makeId();
    const item = {
      id, name, state, updatedAt: Date.now(), createdAt: Date.now(),
      status: 'en_cours', versions: [],
    };
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

  const setStatus = (id, status) => {
    const all = loadAll();
    const idx = all.findIndex(x => x.id === id);
    if (idx >= 0) { all[idx].status = status; all[idx].updatedAt = Date.now(); saveAll(all); setList(all); }
  };

  const remove = (id) => {
    const all = loadAll().filter(x => x.id !== id);
    saveAll(all);
    setList(all);
    if (currentId === id) setCurrentId(null);
  };

  const restoreVersion = (id, vid) => {
    const all = loadAll();
    const idx = all.findIndex(x => x.id === id);
    if (idx < 0) return null;
    const item = all[idx];
    const v = (item.versions || []).find(v => v.vid === vid);
    if (!v) return null;
    // Snapshot current state before replacing
    const snapshot = {
      vid: makeVersionId(),
      state: item.state,
      savedAt: item.updatedAt,
      label: 'Avant restauration ' + new Date().toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }),
    };
    const versions = [snapshot, ...(item.versions || [])].slice(0, MAX_VERSIONS);
    all[idx] = { ...item, state: v.state, updatedAt: Date.now(), versions };
    saveAll(all);
    setList(all);
    return all[idx];
  };

  const deleteVersion = (id, vid) => {
    const all = loadAll();
    const idx = all.findIndex(x => x.id === id);
    if (idx < 0) return;
    all[idx].versions = (all[idx].versions || []).filter(v => v.vid !== vid);
    saveAll(all);
    setList(all);
  };

  return {
    list, currentId, save, saveAs, load, rename, remove, refresh, setCurrentId,
    setStatus, restoreVersion, deleteVersion,
  };
}

// ---------- Sent links hook ----------
function useSentLinks() {
  const [links, setLinks] = React.useState(loadLinks);
  const refresh = () => setLinks(loadLinks());

  const record = (entry) => {
    const all = loadLinks();
    all.unshift(entry);
    // Keep last 200
    saveLinks(all.slice(0, 200));
    setLinks(all.slice(0, 200));
  };

  const revoke = (linkId) => {
    const all = loadLinks();
    const idx = all.findIndex(l => l.linkId === linkId);
    if (idx >= 0) {
      all[idx].revoked = true;
      all[idx].revokedAt = Date.now();
      saveLinks(all);
      setLinks([...all]);
    }
  };
  const unrevoke = (linkId) => {
    const all = loadLinks();
    const idx = all.findIndex(l => l.linkId === linkId);
    if (idx >= 0) {
      delete all[idx].revoked;
      delete all[idx].revokedAt;
      saveLinks(all);
      setLinks([...all]);
    }
  };
  const remove = (linkId) => {
    const all = loadLinks().filter(l => l.linkId !== linkId);
    saveLinks(all);
    setLinks(all);
  };
  const clear = () => { saveLinks([]); setLinks([]); };

  return { links, record, revoke, unrevoke, remove, clear, refresh };
}

// ---------- Status badge component ----------
function StatusBadge({ status, onClick, dropdown = false }) {
  const s = STATUS_BY_ID[status] || STATUS_BY_ID.en_cours;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', fontSize: 11,
        fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
        background: s.bg, color: s.color, border: '1px solid ' + s.color + '33',
        borderRadius: 999, fontWeight: 600, cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
      {dropdown && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 1 }}><polyline points="6 9 12 15 18 9"/></svg>}
    </button>
  );
}

// ---------- Soumissions modal ----------
function SoumissionsModal({ open, onClose, store, currentState, onLoad, pushToast }) {
  const [renaming, setRenaming] = React.useState(null);
  const [statusMenuFor, setStatusMenuFor] = React.useState(null); // id whose menu is open
  const [historyFor, setHistoryFor] = React.useState(null); // item showing history
  const [filter, setFilter] = React.useState('all');
  const [showSaveAs, setShowSaveAs] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  React.useEffect(() => {
    if (open) { setRenaming(null); setStatusMenuFor(null); setHistoryFor(null); setShowSaveAs(false); setNewName(''); }
  }, [open]);

  if (!open) return null;

  const fmt = (ts) => new Date(ts).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
  const filtered = filter === 'all' ? store.list : store.list.filter(it => (it.status || 'en_cours') === filter);

  const counts = { all: store.list.length };
  STATUSES.forEach(s => { counts[s.id] = store.list.filter(it => (it.status || 'en_cours') === s.id).length; });

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '94%' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Mes soumissions</div>
            <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>{store.list.length} au total · gestion par statut + historique des versions</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', width: 32, height: 32, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Status filter tabs */}
        <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--ip-line)' }}>
          {[{ id: 'all', label: 'Toutes', color: 'var(--ip-ink)' }, ...STATUSES].map(s => {
            const isActive = filter === s.id;
            const count = counts[s.id] || 0;
            return (
              <button
                key={s.id}
                onClick={() => setFilter(s.id)}
                style={{
                  padding: '8px 13px', fontSize: 12.5, fontWeight: 600,
                  background: isActive ? 'var(--ip-ink)' : 'transparent',
                  color: isActive ? '#fff' : (s.color || 'var(--ip-muted)'),
                  border: 'none', borderBottom: isActive ? '2px solid var(--ip-orange)' : '2px solid transparent',
                  cursor: 'pointer', borderRadius: '6px 6px 0 0',
                  marginBottom: -1,
                }}
              >
                {s.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* List or history */}
        {historyFor ? (
          <VersionHistory
            item={historyFor}
            store={store}
            onClose={() => setHistoryFor(null)}
            onRestore={(vid) => {
              const updated = store.restoreVersion(historyFor.id, vid);
              if (updated) { pushToast('Version restaurée'); setHistoryFor(updated); }
            }}
            onLoad={onLoad}
            pushToast={pushToast}
            fmt={fmt}
          />
        ) : (
          <div style={{ maxHeight: 440, overflow: 'auto', padding: '6px 12px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ip-muted)', fontSize: 13.5 }}>
                {filter === 'all' ? (
                  <span>Aucune soumission enregistrée.<br/>Utilisez <strong>Enregistrer</strong> dans la barre du haut.</span>
                ) : (
                  <span>Aucune soumission avec ce statut.</span>
                )}
              </div>
            )}
            {filtered.map(item => {
              const isCurrent = item.id === store.currentId;
              const isRen = renaming && renaming.id === item.id;
              const status = item.status || 'en_cours';
              const versionCount = (item.versions || []).length;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', margin: '4px 0',
                  borderRadius: 10,
                  background: isCurrent ? 'rgba(244,165,28,0.06)' : '#fff',
                  border: isCurrent ? '1px solid rgba(244,165,28,0.4)' : '1px solid var(--ip-line)',
                  position: 'relative',
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
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ip-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.name}
                          {isCurrent && <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--ip-orange)', color: '#fff', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>en cours</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span>Modifié : {fmt(item.updatedAt)}</span>
                          {versionCount > 0 && (
                            <button onClick={() => setHistoryFor(item)} style={{ background: 'transparent', border: 'none', color: 'var(--ip-orange)', cursor: 'pointer', fontSize: 11.5, padding: 0, fontWeight: 600, textDecoration: 'underline' }}>
                              {versionCount} version{versionCount > 1 ? 's' : ''} précédente{versionCount > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isRen && (
                    <div style={{ position: 'relative' }}>
                      <StatusBadge status={status} onClick={() => setStatusMenuFor(statusMenuFor === item.id ? null : item.id)} dropdown />
                      {statusMenuFor === item.id && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', border: '1px solid var(--ip-line)', borderRadius: 8, padding: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', zIndex: 5, minWidth: 140 }}>
                          {STATUSES.map(s => (
                            <button
                              key={s.id}
                              onClick={() => { store.setStatus(item.id, s.id); setStatusMenuFor(null); pushToast('Statut : ' + s.label); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                width: '100%', padding: '7px 10px', fontSize: 12.5,
                                background: status === s.id ? 'var(--ip-bg)' : 'transparent',
                                border: 'none', borderRadius: 5, textAlign: 'left',
                                cursor: 'pointer', color: 'var(--ip-ink)',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ip-bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = status === s.id ? 'var(--ip-bg)' : 'transparent'}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                              {s.label}
                              {status === s.id && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto', color: s.color }}><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {isRen ? (
                      <React.Fragment>
                        <button onClick={() => { store.rename(item.id, renaming.name.trim() || item.name); setRenaming(null); pushToast('Renommée'); }} title="Valider" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button onClick={() => setRenaming(null)} title="Annuler" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => onLoad(item)} title="Ouvrir" style={{ padding: '6px 12px', fontSize: 12.5 }}>Ouvrir</button>
                        <button onClick={() => setRenaming({ id: item.id, name: item.name })} title="Renommer" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => { if (confirm('Supprimer cette soumission ?')) { store.remove(item.id); pushToast('Supprimée'); } }} title="Supprimer" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer', color: '#c53030' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </React.Fragment>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!historyFor && (
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
                  Enregistrer en nouvelle entrée
                </button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Version history viewer ----------
function VersionHistory({ item, store, onClose, onRestore, pushToast, fmt }) {
  return (
    <div>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--ip-line)', width: 30, height: 30, borderRadius: 6, cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Retour">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Historique : {item.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ip-muted)' }}>Version actuelle modifiée le {fmt(item.updatedAt)}</div>
        </div>
      </div>
      <div style={{ maxHeight: 420, overflow: 'auto', padding: 12 }}>
        {/* Current */}
        <div style={{ padding: '12px 14px', margin: '4px 0', borderRadius: 10, background: 'rgba(244,165,28,0.08)', border: '1px solid rgba(244,165,28,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--ip-orange)', color: '#fff', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Actuelle</span>
            <span style={{ fontWeight: 600 }}>{fmt(item.updatedAt)}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ip-muted)', marginTop: 4 }}>
            {item.state.sections?.length || 0} sections · {item.state.sections?.reduce((a, s) => a + (s.rows?.length || 0), 0) || 0} lignes · prix {item.state.prices?.[item.state.selectedPlan] || '—'} $
          </div>
        </div>
        {(item.versions || []).length === 0 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--ip-muted)', fontSize: 13 }}>
            Aucune version précédente — l'historique se construit à chaque enregistrement après modification.
          </div>
        )}
        {(item.versions || []).map((v, i) => (
          <div key={v.vid} style={{ padding: '12px 14px', margin: '4px 0', borderRadius: 10, background: '#fff', border: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{v.label || `Version ${i + 1}`}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 2 }}>
                {fmt(v.savedAt)} · {v.state.sections?.length || 0} sections · {v.state.sections?.reduce((a, s) => a + (s.rows?.length || 0), 0) || 0} lignes · prix {v.state.prices?.[v.state.selectedPlan] || '—'} $
              </div>
            </div>
            <button className="btn btn-ghost" onClick={() => { if (confirm('Restaurer cette version ? La version actuelle sera sauvegardée dans l\'historique.')) onRestore(v.vid); }} style={{ fontSize: 12.5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Restaurer
            </button>
            <button onClick={() => { if (confirm('Supprimer cette version ?')) { store.deleteVersion(item.id, v.vid); pushToast('Version supprimée'); } }} title="Supprimer" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer', color: '#c53030' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Links manager modal ----------
function LinksManagerModal({ open, onClose, sentLinks, pushToast }) {
  const [filter, setFilter] = React.useState('all');
  if (!open) return null;
  const fmt = (ts) => new Date(ts).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
  const all = sentLinks.links || [];
  const filtered = filter === 'all' ? all : filter === 'active' ? all.filter(l => !l.revoked) : all.filter(l => l.revoked);
  const counts = { all: all.length, active: all.filter(l => !l.revoked).length, revoked: all.filter(l => l.revoked).length };

  const copyShort = (link) => {
    const url = link.shortUrl || link.url;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => pushToast('Lien copié'));
    else window.prompt('Copiez :', url);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, width: '94%' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Liens envoyés aux clients</div>
            <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>Suivi et révocation des liens partagés.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', width: 32, height: 32, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, borderBottom: '1px solid var(--ip-line)' }}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'revoked', label: 'Révoqués' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: '8px 13px', fontSize: 12.5, fontWeight: 600,
                background: filter === t.id ? 'var(--ip-ink)' : 'transparent',
                color: filter === t.id ? '#fff' : 'var(--ip-muted)',
                border: 'none', borderBottom: filter === t.id ? '2px solid var(--ip-orange)' : '2px solid transparent',
                cursor: 'pointer', borderRadius: '6px 6px 0 0', marginBottom: -1,
              }}
            >
              {t.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 460, overflow: 'auto', padding: '8px 12px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ip-muted)', fontSize: 13.5 }}>
              {filter === 'all' ? 'Aucun lien envoyé pour le moment.' : filter === 'active' ? 'Aucun lien actif.' : 'Aucun lien révoqué.'}
            </div>
          )}
          {filtered.map(link => (
            <div key={link.linkId} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', margin: '4px 0',
              borderRadius: 10,
              background: link.revoked ? 'rgba(192,57,43,0.04)' : '#fff',
              border: link.revoked ? '1px dashed rgba(192,57,43,0.3)' : '1px solid var(--ip-line)',
              opacity: link.revoked ? 0.85 : 1,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ip-ink)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {link.clientName || link.company || 'Client sans nom'}
                  {link.revoked && (
                    <span style={{ fontSize: 10, padding: '2px 7px', background: '#c0392b', color: '#fff', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Révoqué</span>
                  )}
                  {!link.revoked && (
                    <span style={{ fontSize: 10, padding: '2px 7px', background: '#2c8a4a', color: '#fff', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Actif</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  ID : {link.linkId}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 2 }}>
                  Envoyé : {fmt(link.sentAt)}
                  {link.revokedAt && ` · Révoqué : ${fmt(link.revokedAt)}`}
                </div>
                {(link.shortUrl || link.url) && !link.revoked && (
                  <div style={{ fontSize: 11, color: 'var(--ip-orange)', marginTop: 4, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>
                    {link.shortUrl || link.url.slice(0, 60) + '...'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {!link.revoked && (link.shortUrl || link.url) && (
                  <button className="btn btn-ghost" onClick={() => copyShort(link)} style={{ padding: '6px 12px', fontSize: 12.5 }}>
                    Copier
                  </button>
                )}
                {link.revoked ? (
                  <button className="btn btn-ghost" onClick={() => sentLinks.unrevoke(link.linkId)} title="Réactiver" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                    Réactiver
                  </button>
                ) : (
                  <button className="btn btn-ghost" onClick={() => { if (confirm('Révoquer ce lien ? Le client verra un message d\'expiration.')) { sentLinks.revoke(link.linkId); pushToast('Lien révoqué'); } }} style={{ padding: '6px 12px', fontSize: 12.5, color: '#c0392b', borderColor: 'rgba(192,57,43,0.3)' }}>
                    Révoquer
                  </button>
                )}
                <button onClick={() => { if (confirm('Supprimer cet enregistrement ?')) sentLinks.remove(link.linkId); }} title="Supprimer" style={{ width: 30, height: 30, border: '1px solid var(--ip-line)', background: '#fff', borderRadius: 6, cursor: 'pointer', color: '#c53030' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 11.5, color: 'var(--ip-muted)', lineHeight: 1.5 }}>
            <strong>Comment ça marche ?</strong> Chaque lien envoyé contient un identifiant unique. Quand vous le révoquez, le client qui l'ouvre voit une page « lien expiré » au lieu de la soumission. La révocation fonctionne sur le même appareil qui a envoyé le lien — pour une vraie révocation côté serveur, voir l'option Google Sheets.
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useSoumissions, SoumissionsModal, StatusBadge, STATUSES, STATUS_BY_ID, useSentLinks, makeLinkId, LinksManagerModal });
