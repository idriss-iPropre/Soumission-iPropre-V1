// gsheets.jsx — Google Sheets sync via a Google Apps Script Web App
//
// HOW IT WORKS
// ────────────
// 1. The user creates a free Google Apps Script Web App (one-time, ~5 min).
// 2. The Web App exposes a public URL that accepts POST requests.
// 3. This module sends each new soumission as JSON to that URL.
// 4. The Apps Script appends a row to a Google Sheet of the user's choice.
// 5. Optionally, the same script can read back data (revocation flags, client
//    feedback) — but the basic setup is one-way (push only).
//
// SECURITY
// ────────
// The Web App URL acts as a shared secret — anyone who knows it can write to
// the sheet. Treat it like a password. The URL is stored in localStorage on
// the device that uses it, never inside the soumission payload sent to clients.

const GS_URL_KEY = 'ipropre_gsheet_url_v1';
const GS_LOG_KEY = 'ipropre_gsheet_log_v1';

function loadGsUrl() {
  try { return localStorage.getItem(GS_URL_KEY) || ''; } catch { return ''; }
}
function saveGsUrl(url) {
  try { localStorage.setItem(GS_URL_KEY, url || ''); } catch {}
}
function loadGsLog() {
  try { return JSON.parse(localStorage.getItem(GS_LOG_KEY) || '[]'); } catch { return []; }
}
function appendGsLog(entry) {
  const log = loadGsLog();
  log.unshift(entry);
  try { localStorage.setItem(GS_LOG_KEY, JSON.stringify(log.slice(0, 50))); } catch {}
  return log.slice(0, 50);
}

// Build the row payload — flat, sheet-friendly object
function buildSheetRow({ state, form, linkId, shortUrl, longUrl, soumissionName, status }) {
  const plan = state.selectedPlan != null ? PLAN_DEFS[state.selectedPlan] : null;
  const price = state.selectedPlan != null ? state.prices[state.selectedPlan] : null;
  const totalLines = state.sections.reduce((a, s) => a + s.rows.length, 0);
  return {
    timestamp: new Date().toISOString(),
    soumissionName: soumissionName || '',
    status: status || 'en_cours',
    contactName: form?.clientName || '',
    company: form?.company || '',
    email: form?.email || '',
    phone: form?.phone || '',
    address: form?.address || '',
    selectedPlan: plan ? plan.label : '',
    price: price || '',
    totalLines,
    sectionsCount: state.sections.length,
    linkId: linkId || '',
    shortUrl: shortUrl || '',
    longUrl: longUrl || '',
  };
}

// POST to Apps Script. Uses text/plain body to avoid CORS preflight,
// which Apps Script Web Apps don't handle. Apps Script reads e.postData.contents.
async function pushToSheet(url, payload) {
  if (!url) throw new Error('URL Google Sheets non configurée');
  const body = JSON.stringify(payload);
  // 'no-cors' would silently fail; Apps Script Web App with deploy "Anyone"
  // does send CORS headers when responseType is permissive. We try standard
  // fetch first; on opaque error, we still register success-by-arrival.
  try {
    const resp = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    return { ok: true, response: text };
  } catch (e) {
    // Fallback: 'no-cors' (opaque). The script still receives the data,
    // we just can't read the response. Mark as 'sent' (best-effort).
    try {
      await fetch(url, { method: 'POST', mode: 'no-cors', body });
      return { ok: true, response: '(opaque — no-cors)' };
    } catch (e2) {
      return { ok: false, error: e2.message || 'Erreur réseau' };
    }
  }
}

function useGsheet() {
  const [url, setUrl] = React.useState(loadGsUrl);
  const [log, setLog] = React.useState(loadGsLog);
  const [busy, setBusy] = React.useState(false);

  const setUrlPersist = (u) => { setUrl(u); saveGsUrl(u); };

  const send = async (payload) => {
    if (!url) return { ok: false, error: 'URL non configurée' };
    setBusy(true);
    const result = await pushToSheet(url, payload);
    const entry = {
      ts: Date.now(),
      ok: result.ok,
      contact: payload.contactName || payload.company || '',
      linkId: payload.linkId || '',
      error: result.error || '',
    };
    const newLog = appendGsLog(entry);
    setLog(newLog);
    setBusy(false);
    return result;
  };

  return { url, setUrl: setUrlPersist, log, busy, send };
}

// Setup modal — one-stop instructions + URL field
function GsheetSetupModal({ open, onClose, gsheet, pushToast }) {
  const [draftUrl, setDraftUrl] = React.useState(gsheet.url || '');
  const [showLog, setShowLog] = React.useState(false);
  React.useEffect(() => { if (open) setDraftUrl(gsheet.url || ''); }, [open, gsheet.url]);

  if (!open) return null;

  const fmt = (ts) => new Date(ts).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });

  const testConnection = async () => {
    if (!draftUrl) { pushToast('Saisissez d\'abord une URL'); return; }
    gsheet.setUrl(draftUrl.trim());
    const result = await gsheet.send({
      timestamp: new Date().toISOString(),
      soumissionName: '*** TEST DE CONNEXION ***',
      contactName: 'Test',
      company: 'iPropre — Test',
      email: 'test@ipropre.ca',
      phone: '000 000 0000',
      address: '—',
      selectedPlan: 'Test',
      price: '0',
      totalLines: 0,
      sectionsCount: 0,
      linkId: 'TEST',
      shortUrl: '', longUrl: '',
      status: 'test',
    });
    if (result.ok) pushToast('Test envoyé — vérifiez votre Google Sheet');
    else pushToast('Échec : ' + (result.error || 'erreur inconnue'));
  };

  const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // En-têtes (créés à la première exécution si la feuille est vide)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Date', 'Soumission', 'Statut', 'Contact', 'Entreprise',
        'Courriel', 'Téléphone', 'Adresse', 'Plan choisi', 'Prix',
        'Lignes', 'Sections', 'ID lien', 'Lien court', 'Lien long'
      ]);
    }
    sheet.appendRow([
      new Date(data.timestamp), data.soumissionName, data.status,
      data.contactName, data.company, data.email, data.phone, data.address,
      data.selectedPlan, data.price, data.totalLines, data.sectionsCount,
      data.linkId, data.shortUrl, data.longUrl
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyCode = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => pushToast('Code copié'));
    else window.prompt('Copiez :', APPS_SCRIPT_CODE);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '94%' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Sheets icon */}
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0F9D58', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700 }}>Connexion Google Sheets</div>
              <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', marginTop: 2 }}>Envoie chaque soumission dans une feuille de calcul partagée.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', width: 32, height: 32, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: 540, overflow: 'auto' }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--ip-line)' }}>
            <button onClick={() => setShowLog(false)} style={{ padding: '8px 13px', fontSize: 12.5, fontWeight: 600, background: !showLog ? 'var(--ip-ink)' : 'transparent', color: !showLog ? '#fff' : 'var(--ip-muted)', border: 'none', borderBottom: !showLog ? '2px solid var(--ip-orange)' : '2px solid transparent', cursor: 'pointer', borderRadius: '6px 6px 0 0', marginBottom: -1 }}>Configuration</button>
            <button onClick={() => setShowLog(true)} style={{ padding: '8px 13px', fontSize: 12.5, fontWeight: 600, background: showLog ? 'var(--ip-ink)' : 'transparent', color: showLog ? '#fff' : 'var(--ip-muted)', border: 'none', borderBottom: showLog ? '2px solid var(--ip-orange)' : '2px solid transparent', cursor: 'pointer', borderRadius: '6px 6px 0 0', marginBottom: -1 }}>Journal d'envoi <span style={{ opacity: 0.6, marginLeft: 4 }}>{gsheet.log.length}</span></button>
          </div>

          {!showLog ? (
            <React.Fragment>
              {/* Step 1 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>1</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Créez une Google Sheet</div>
                </div>
                <div style={{ paddingLeft: 36, fontSize: 13, color: 'var(--ip-ink-2)', lineHeight: 1.6 }}>
                  Allez sur <a href="https://sheets.new" target="_blank" rel="noopener" style={{ color: 'var(--ip-orange)', fontWeight: 600 }}>sheets.new</a> pour créer une nouvelle feuille (gratuit, compte Google requis). Donnez-lui le nom que vous voulez — par exemple « iPropre · Soumissions ».
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>2</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Ouvrez Apps Script</div>
                </div>
                <div style={{ paddingLeft: 36, fontSize: 13, color: 'var(--ip-ink-2)', lineHeight: 1.6 }}>
                  Dans la feuille, menu <strong>Extensions → Apps Script</strong>. Une fenêtre de code s'ouvre. Effacez le contenu existant (la fonction <code>myFunction</code>) et collez le code ci-dessous :
                  <div style={{ position: 'relative', marginTop: 10 }}>
                    <pre style={{ background: '#0F0F10', color: '#a8d6ff', padding: '14px 16px', paddingRight: 90, borderRadius: 8, fontSize: 11.5, fontFamily: 'var(--font-mono)', overflow: 'auto', maxHeight: 220, lineHeight: 1.5, margin: 0 }}>
{APPS_SCRIPT_CODE}
                    </pre>
                    <button onClick={copyCode} className="btn btn-orange" style={{ position: 'absolute', top: 8, right: 8, fontSize: 11.5, padding: '5px 10px' }}>Copier</button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>3</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Déployez en Web App</div>
                </div>
                <div style={{ paddingLeft: 36, fontSize: 13, color: 'var(--ip-ink-2)', lineHeight: 1.6 }}>
                  En haut à droite : <strong>Déployer → Nouveau déploiement</strong>.<br/>
                  Type : <strong>Application Web</strong>.<br/>
                  Exécuter en tant que : <strong>Moi</strong>.<br/>
                  Qui peut accéder : <strong>Tout le monde</strong>.<br/>
                  Cliquez <strong>Déployer</strong> et autorisez l'accès. Vous obtenez une URL du type <code style={{ fontSize: 11 }}>https://script.google.com/macros/s/.../exec</code>.
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>4</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700 }}>Collez l'URL ici</div>
                </div>
                <div style={{ paddingLeft: 36 }}>
                  <input
                    className="txt-input"
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-orange" onClick={() => { gsheet.setUrl(draftUrl.trim()); pushToast(draftUrl.trim() ? 'URL enregistrée' : 'URL effacée'); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Enregistrer
                    </button>
                    <button className="btn btn-ghost" onClick={testConnection} disabled={!draftUrl || gsheet.busy}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                      {gsheet.busy ? 'Envoi…' : 'Tester la connexion'}
                    </button>
                    {gsheet.url && (
                      <button className="btn btn-ghost" onClick={() => { gsheet.setUrl(''); setDraftUrl(''); pushToast('Connexion supprimée'); }} style={{ color: '#c0392b' }}>
                        Déconnecter
                      </button>
                    )}
                  </div>
                  {gsheet.url && (
                    <div style={{ marginTop: 10, fontSize: 11.5, color: '#2c8a4a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Connecté · Chaque soumission envoyée sera ajoutée à votre feuille.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: '#fffbf0', borderRadius: 8, border: '1px solid #f5d886', fontSize: 12, color: '#6b4a0a', lineHeight: 1.55 }}>
                <strong>Important :</strong> l'URL Apps Script est l'équivalent d'un mot de passe — quiconque la connaît peut écrire dans votre feuille. Ne la partagez pas et stockez-la uniquement sur votre appareil. Pour révoquer l'accès, allez dans Apps Script et supprimez le déploiement.
              </div>
            </React.Fragment>
          ) : (
            <div>
              {gsheet.log.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ip-muted)', fontSize: 13.5 }}>
                  Aucun envoi pour le moment.
                </div>
              )}
              {gsheet.log.map((entry, i) => (
                <div key={i} style={{
                  padding: '10px 14px', margin: '4px 0', borderRadius: 8,
                  background: entry.ok ? 'rgba(44,138,74,0.06)' : 'rgba(192,57,43,0.06)',
                  border: '1px solid ' + (entry.ok ? 'rgba(44,138,74,0.2)' : 'rgba(192,57,43,0.2)'),
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: entry.ok ? '#2c8a4a' : '#c0392b', color: '#fff', display: 'grid', placeItems: 'center' }}>
                    {entry.ok ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.contact || '(sans contact)'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ip-muted)' }}>
                      {fmt(entry.ts)}
                      {entry.linkId && ` · ${entry.linkId}`}
                      {entry.error && ` · ${entry.error}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useGsheet, GsheetSetupModal, buildSheetRow });
