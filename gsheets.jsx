// gsheets.jsx — UI for Google Sheets connection + send history.
// Business logic lives in core/api.js (apiCall) and core/repo.js (resources).
// This file is purely presentational + hooks that wrap window.repo.

const GS_LOG_KEY = 'ipropre_gsheet_log_v2';

function loadGsLog() {
  try { return JSON.parse(localStorage.getItem(GS_LOG_KEY) || '[]'); } catch { return []; }
}
function appendGsLog(entry) {
  const log = loadGsLog();
  log.unshift(entry);
  try { localStorage.setItem(GS_LOG_KEY, JSON.stringify(log.slice(0, 100))); } catch {}
  return log.slice(0, 100);
}

// Build a flat soumission row for the Sheet (Soumissions tab).
function buildSoumissionRecord({ state, form, soumissionName, status, id }) {
  const plans = window.PLAN_DEFS || [];
  const plan = state.selectedPlan != null ? plans[state.selectedPlan] : null;
  return {
    id: id || ('s_' + Date.now().toString(36)),
    nom: soumissionName || '',
    statut: status || 'en_cours',
    client: form?.clientName || '',
    entreprise: form?.company || '',
    courriel: form?.email || '',
    telephone: form?.phone || '',
    adresse: form?.address || '',
    planChoisi: plan ? plan.label : '',
    prixInitial: state.prices?.[0] || '',
    prixStandard: state.prices?.[1] || '',
    prixVIP: state.prices?.[2] || '',
    data: state, // serialized to dataJSON by repo.Soumissions.save
  };
}

function useGsheet() {
  const [url, setUrl] = React.useState(() => window.api?.getUrl() || '');
  const [log, setLog] = React.useState(loadGsLog);
  const [busy, setBusy] = React.useState(false);
  const [connected, setConnected] = React.useState(null); // null = unknown, true/false after ping

  const setUrlPersist = (u) => {
    setUrl(u);
    if (window.api) window.api.setUrl(u);
    setConnected(null);
  };

  // ---- High-level operations (delegate to repo) ----

  const saveSoumission = async (record) => {
    if (!window.repo) return { ok: false, error: 'core/repo.js non chargé' };
    setBusy(true);
    try {
      const data = await window.repo.Soumissions.save(record);
      const entry = { ts: Date.now(), ok: true, type: 'save', label: record.nom || record.client || '(sans nom)' };
      setLog(appendGsLog(entry));
      return { ok: true, data };
    } catch (err) {
      const entry = { ts: Date.now(), ok: false, type: 'save', label: record.nom || '', error: err.message };
      setLog(appendGsLog(entry));
      return { ok: false, error: err.message };
    } finally {
      setBusy(false);
    }
  };

  const recordEnvoi = async ({ soumissionId, type, destinataire, objet, linkId, notes }) => {
    if (!window.repo) return { ok: false, error: 'repo non chargé' };
    setBusy(true);
    try {
      const data = await window.repo.Envois.create({ soumissionId, type, destinataire, objet, linkId, notes });
      const entry = { ts: Date.now(), ok: true, type: 'envoi:' + type, label: destinataire || objet };
      setLog(appendGsLog(entry));
      return { ok: true, data };
    } catch (err) {
      setLog(appendGsLog({ ts: Date.now(), ok: false, type: 'envoi', error: err.message }));
      return { ok: false, error: err.message };
    } finally {
      setBusy(false);
    }
  };

  const recordLien = async ({ linkId, soumissionId, destinataire }) => {
    if (!window.repo) return { ok: false, error: 'repo non chargé' };
    try {
      await window.repo.Liens.create({ linkId, soumissionId, destinataire });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const testConnection = async () => {
    if (!window.api) return false;
    setBusy(true);
    const ok = await window.api.ping();
    setConnected(ok);
    setLog(appendGsLog({ ts: Date.now(), ok, type: 'test', label: ok ? 'Connexion réussie' : 'Échec' }));
    setBusy(false);
    return ok;
  };

  return {
    url, setUrl: setUrlPersist, log, busy, connected,
    saveSoumission, recordEnvoi, recordLien, testConnection,
  };
}

function GsheetSetupModal({ open, onClose, gsheet, pushToast }) {
  const [draftUrl, setDraftUrl] = React.useState(gsheet.url || '');
  const [showLog, setShowLog] = React.useState(false);
  React.useEffect(() => { if (open) setDraftUrl(gsheet.url || ''); }, [open, gsheet.url]);

  if (!open) return null;
  const fmt = (ts) => new Date(ts).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });

  const handleSave = () => {
    gsheet.setUrl(draftUrl.trim());
    pushToast(draftUrl.trim() ? 'URL enregistrée' : 'URL effacée');
  };
  const handleTest = async () => {
    if (!draftUrl.trim()) { pushToast('Saisissez d\'abord une URL'); return; }
    gsheet.setUrl(draftUrl.trim());
    const ok = await gsheet.testConnection();
    pushToast(ok ? '✓ Connexion établie' : '✗ Échec — vérifiez l\'URL et le déploiement');
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '94%' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0F9D58', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Base de données Google Sheets</div>
              <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>Synchronisation automatique des soumissions, envois et liens.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', width: 32, height: 32, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: 540, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--ip-line)' }}>
            <button onClick={() => setShowLog(false)} style={{ padding: '8px 13px', fontSize: 12.5, fontWeight: 600, background: !showLog ? 'var(--ip-ink)' : 'transparent', color: !showLog ? '#fff' : 'var(--ip-muted)', border: 'none', borderBottom: !showLog ? '2px solid var(--ip-orange)' : '2px solid transparent', cursor: 'pointer', borderRadius: '6px 6px 0 0', marginBottom: -1 }}>Connexion</button>
            <button onClick={() => setShowLog(true)} style={{ padding: '8px 13px', fontSize: 12.5, fontWeight: 600, background: showLog ? 'var(--ip-ink)' : 'transparent', color: showLog ? '#fff' : 'var(--ip-muted)', border: 'none', borderBottom: showLog ? '2px solid var(--ip-orange)' : '2px solid transparent', cursor: 'pointer', borderRadius: '6px 6px 0 0', marginBottom: -1 }}>Journal <span style={{ opacity: 0.6, marginLeft: 4 }}>{gsheet.log.length}</span></button>
          </div>

          {!showLog ? (
            <React.Fragment>
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ip-ink-2)', lineHeight: 1.6 }}>
                Collez l'URL de votre déploiement Apps Script (terminée par <code>/exec</code>). Une URL est déjà pré-configurée — vous pouvez la remplacer si vous utilisez votre propre Sheet.
              </div>

              <input
                className="txt-input"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-orange" onClick={handleSave}>Enregistrer</button>
                <button className="btn btn-ghost" onClick={handleTest} disabled={!draftUrl || gsheet.busy}>
                  {gsheet.busy ? 'Test en cours…' : 'Tester la connexion'}
                </button>
                {gsheet.url && (
                  <button className="btn btn-ghost" onClick={() => { gsheet.setUrl(''); setDraftUrl(''); pushToast('Déconnecté'); }} style={{ color: '#c0392b' }}>
                    Déconnecter
                  </button>
                )}
              </div>

              {gsheet.connected === true && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#2c8a4a' }}>✓ Connexion vérifiée — sync automatique active.</div>
              )}
              {gsheet.connected === false && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#c0392b' }}>✗ Connexion impossible — vérifiez l'URL et que le déploiement est en accès « Tout le monde ».</div>
              )}

              <div style={{ marginTop: 20, padding: '14px 16px', background: '#fffbf0', borderRadius: 8, border: '1px solid #f5d886', fontSize: 12.5, color: '#6b4a0a', lineHeight: 1.6 }}>
                <strong>Que synchronise l'app ?</strong>
                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Chaque <strong>enregistrement</strong> de soumission → onglet <code>Soumissions</code></li>
                  <li>Chaque <strong>envoi courriel</strong> (premier ou relance) → onglet <code>Envois</code></li>
                  <li>Chaque <strong>lien client</strong> partagé + ouvertures → onglet <code>LiensEnvoyes</code></li>
                  <li>Chaque <strong>version</strong> sauvegardée → onglet <code>Versions</code></li>
                </ul>
              </div>
            </React.Fragment>
          ) : (
            <div>
              {gsheet.log.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ip-muted)', fontSize: 13.5 }}>Aucune activité pour le moment.</div>
              )}
              {gsheet.log.map((entry, i) => (
                <div key={i} style={{ padding: '10px 14px', margin: '4px 0', borderRadius: 8, background: entry.ok ? 'rgba(44,138,74,0.06)' : 'rgba(192,57,43,0.06)', border: '1px solid ' + (entry.ok ? 'rgba(44,138,74,0.2)' : 'rgba(192,57,43,0.2)'), display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: entry.ok ? '#2c8a4a' : '#c0392b', color: '#fff', display: 'grid', placeItems: 'center' }}>
                    {entry.ok ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.label || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ip-muted)' }}>{fmt(entry.ts)} · {entry.type}{entry.error ? ' · ' + entry.error : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useGsheet, GsheetSetupModal, buildSoumissionRecord });
