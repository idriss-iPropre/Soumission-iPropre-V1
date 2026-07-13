// carte.jsx — Scan d'une carte de visite (photo → OCR → remplissage auto du formulaire Envoi).
// L'OCR est fait côté serveur par Apps Script (API Drive avancée, ocr=true),
// donc aucune librairie lourde n'est chargée dans le navigateur.

// ---- Redimensionne + compresse la photo en JPEG base64 (max 1600px) ----
function cardFileToBase64(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl, base64: dataUrl.split(',')[1] });
      };
      img.onerror = () => reject(new Error('Image illisible'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}

// ---- Analyse heuristique du texte OCR d'une carte de visite (FR/EN) ----
function parseBusinessCardText(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = { clientName: '', company: '', email: '', phone: '', address: '' };

  const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const phoneRe = /(\+?1[\s.\-]?)?\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})(\s*(?:x|poste|ext\.?|#)\s*(\d+))?/i;
  const postalRe = /[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/;
  const urlRe = /(www\.|https?:\/\/)[\w.-]+/i;
  const companyHints = /(inc\b|enr\b|lt[ée]e|ltd\b|s\.?e\.?n\.?c|corp\b|groupe?\b|solutions|services|immobilier|gestion|construction|entretien|nettoyage|conciergerie|distribution|consultants?)/i;
  const titleHints = /(pr[ée]sident|directeur|directrice|vice-|v\.?-?p\.?|gestionnaire|conseill|repr[ée]sentant|manager|coordonnat|superviseur|charg[ée]|fondateur|fondatrice|associ[ée]|courtier|agent|technicien|CPA|ing\.)/i;
  const addrHints = /(\brue\b|\bboul|avenue|\bav\.|chemin|\bch\.|place\b|suite|bureau|local\b|montr[ée]al|laval|qu[ée]bec|\bqc\b|gatineau|longueuil|ontario)/i;

  const used = new Set();

  // 1. Courriel
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(emailRe);
    if (m) { out.email = m[0].toLowerCase(); used.add(i); break; }
  }

  // 2. Téléphone — ignore les lignes fax, préfère cell/tél
  let phoneCandidate = null;
  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    const l = lines[i];
    const m = l.match(phoneRe);
    if (!m) continue;
    if (/fax|t[ée]l[ée]c/i.test(l)) { used.add(i); continue; }
    const formatted = `${m[2]} ${m[3]} ${m[4]}` + (m[6] ? ` #${m[6]}` : '');
    const isMobile = /cell|mobile|\bc\.?\s*:/i.test(l);
    if (!phoneCandidate || isMobile) { phoneCandidate = { formatted, idx: i }; if (isMobile) break; }
  }
  if (phoneCandidate) { out.phone = phoneCandidate.formatted; used.add(phoneCandidate.idx); }

  // 3. Adresse — ligne avec code postal (+ ligne précédente si numéro civique)
  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    const l = lines[i];
    if (postalRe.test(l) || (addrHints.test(l) && /\d/.test(l))) {
      let addr = l;
      if (postalRe.test(l) && !/\d{2,}[^,]*(rue|boul|av|chemin|ch\.)/i.test(l) && i > 0 && !used.has(i - 1) && /\d/.test(lines[i - 1]) && !phoneRe.test(lines[i - 1])) {
        addr = lines[i - 1].replace(/,\s*$/, '') + ', ' + l;
        used.add(i - 1);
      }
      out.address = addr; used.add(i);
      break;
    }
  }

  // Lignes restantes utilisables (ni site web, ni titre de poste)
  const remaining = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l, i }) => !used.has(i) && !urlRe.test(l) && !emailRe.test(l) && !phoneRe.test(l) && l.length > 1);

  // 4. Entreprise — indices juridiques ou ligne TOUT EN MAJUSCULES
  for (const { l, i } of remaining) {
    if (titleHints.test(l)) { used.add(i); continue; }
    if (companyHints.test(l) || (l === l.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(l))) {
      out.company = l; used.add(i); break;
    }
  }

  // 5. Nom — 2 à 4 mots capitalisés
  for (const { l, i } of remaining) {
    if (used.has(i) || titleHints.test(l)) continue;
    const words = l.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-ZÀ-Ý]/.test(w)) && !/\d/.test(l)) {
      out.clientName = l; used.add(i); break;
    }
  }

  // Repli : première ligne restante devient l'entreprise
  if (!out.company) {
    const rest = remaining.filter(({ i }) => !used.has(i) && !titleHints.test(lines[i]));
    if (rest.length) out.company = rest[0].l;
  }
  return out;
}

// ---- Modal de scan ----
function CardScanModal({ onClose, onApply, pushToast }) {
  const [photo, setPhoto] = React.useState(null);      // { dataUrl, base64 }
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);       // { kind: 'update' | 'generic', msg }
  const [fields, setFields] = React.useState(null);     // résultat éditable
  const [rawText, setRawText] = React.useState('');
  const [showRaw, setShowRaw] = React.useState(false);
  const inputRef = React.useRef(null);

  const pickFile = async (file) => {
    if (!file) return;
    setError(null); setFields(null); setRawText('');
    try {
      const res = await cardFileToBase64(file);
      setPhoto(res);
    } catch (e) {
      setError({ kind: 'generic', msg: 'Impossible de lire cette image. Essayez une autre photo.' });
    }
  };

  const analyze = async () => {
    if (!photo || busy) return;
    if (!(window.repo && window.repo.Ocr && window.api && window.api.getUrl())) {
      setError({ kind: 'update', msg: '' });
      return;
    }
    setBusy(true); setError(null);
    try {
      const res = await window.repo.Ocr.card({ base64: photo.base64, mimeType: 'image/jpeg' });
      const text = (res && res.text) || '';
      setRawText(text);
      if (!text.trim()) {
        setError({ kind: 'generic', msg: 'Aucun texte détecté. Rapprochez-vous, ajoutez de la lumière et reprenez la photo.' });
      } else {
        const parsed = parseBusinessCardText(text);
        setFields(parsed);
      }
    } catch (e) {
      const msg = (e && e.message) || '';
      if (/action inconnue|unknown|introuvable/i.test(msg)) {
        setError({ kind: 'update', msg });
      } else {
        setError({ kind: 'generic', msg: 'Analyse impossible : ' + (msg || 'erreur réseau') + '. Réessayez.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const F = ({ label, k, placeholder }) => (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ip-muted)', marginBottom: 4 }}>{label}</div>
      <input
        className="txt-input"
        value={fields[k]}
        placeholder={placeholder}
        onChange={(e) => setFields(f => ({ ...f, [k]: e.target.value }))}
        style={{ fontSize: 13 }}
      />
    </label>
  );

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '94%' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--ip-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(244,165,28,0.14)', color: 'var(--ip-orange)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700 }}>Scanner une carte de visite</div>
            <div style={{ fontSize: 12, color: 'var(--ip-muted)', marginTop: 1 }}>Photographiez la carte — les coordonnées se remplissent automatiquement.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', width: 32, height: 32, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '18px 24px' }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => pickFile(e.target.files && e.target.files[0])}
          />

          {/* Zone photo */}
          {!photo ? (
            <button
              type="button"
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{
                width: '100%', padding: '34px 20px', borderRadius: 14,
                border: '1.5px dashed var(--ip-line)', background: 'var(--ip-bg)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                cursor: 'pointer', color: 'var(--ip-ink-2)',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--ip-orange)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Prendre une photo / choisir une image</div>
              <div style={{ fontSize: 12, color: 'var(--ip-muted)' }}>Cadrez la carte de près, bien éclairée et à plat.</div>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={photo.dataUrl} alt="Carte de visite" style={{ width: 190, borderRadius: 10, display: 'block', border: '1px solid var(--ip-line)' }} />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setFields(null); setRawText(''); setError(null); if (inputRef.current) inputRef.current.value = ''; }}
                  title="Reprendre la photo"
                  style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 8, background: 'rgba(15,15,16,0.72)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {!fields && !busy && !error && (
                  <div style={{ fontSize: 12.5, color: 'var(--ip-muted)', lineHeight: 1.55, marginBottom: 12 }}>
                    Photo prête. Lancez l'analyse pour extraire le nom, l'entreprise, le courriel, le téléphone et l'adresse.
                  </div>
                )}
                {busy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0 14px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ip-orange)" strokeWidth="2.4" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <div style={{ fontSize: 12.5, color: 'var(--ip-ink-2)' }}>Analyse en cours… <span style={{ color: 'var(--ip-muted)' }}>(5 à 20 secondes)</span></div>
                  </div>
                )}
                {!fields && !busy && (
                  <button type="button" className="btn btn-orange" onClick={analyze} style={{ width: '100%', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Analyser la carte
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Erreurs */}
          {error && error.kind === 'update' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, fontSize: 12.5, color: '#7a2318', lineHeight: 1.55 }}>
              <strong>Mise à jour requise.</strong> Le script Google (Apps Script) doit être mis à jour pour activer la lecture de cartes — utilisez le fichier <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 4 }}>apps-script-v4</code> fourni, puis redéployez. En attendant, remplissez les champs manuellement.
            </div>
          )}
          {error && error.kind === 'generic' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, fontSize: 12.5, color: '#7a2318' }}>
              {error.msg}
            </div>
          )}

          {/* Résultats éditables */}
          {fields && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2c8a4a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Informations détectées — vérifiez et corrigez au besoin</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <F label="Nom du contact" k="clientName" placeholder="Jean Tremblay" />
                <F label="Entreprise" k="company" placeholder="ABC inc." />
                <F label="Courriel" k="email" placeholder="jean@abc.com" />
                <F label="Téléphone" k="phone" placeholder="514 000 0000" />
              </div>
              <div style={{ marginTop: 10 }}>
                <F label="Adresse" k="address" placeholder="123 rue Principale, Laval" />
              </div>
              {rawText && (
                <button type="button" onClick={() => setShowRaw(s => !s)} style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ip-muted)', textDecoration: 'underline', padding: 0 }}>
                  {showRaw ? 'Masquer le texte brut' : 'Voir le texte détecté'}
                </button>
              )}
              {showRaw && (
                <pre style={{ marginTop: 8, padding: '10px 12px', background: 'var(--ip-bg)', borderRadius: 8, fontSize: 11, whiteSpace: 'pre-wrap', color: 'var(--ip-ink-2)', maxHeight: 140, overflow: 'auto', fontFamily: 'var(--font-mono)' }}>{rawText}</pre>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ip-line)', background: 'var(--ip-bg)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-orange"
            disabled={!fields}
            style={{ opacity: fields ? 1 : 0.5 }}
            onClick={() => {
              if (!fields) return;
              onApply(fields);
              onClose();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Remplir le formulaire
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CardScanModal, parseBusinessCardText });
