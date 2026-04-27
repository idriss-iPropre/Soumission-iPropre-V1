// auth.jsx — Login gate for the Envoi page
// Credentials are verified against a SHA-256 hash of "username::password".
// The plaintext password never appears in the source.

const AUTH_HASH = 'abec29eed6a5084ba6e9493e538aafb6215c1e17e90a479b11aa8ce17280c01d';
const AUTH_STORAGE_KEY = 'ipropre_auth_v1';
const SESSION_DAYS = 30;

async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function isSessionValid() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const { exp } = JSON.parse(raw);
    return typeof exp === 'number' && Date.now() < exp;
  } catch { return false; }
}

function saveSession(remember) {
  const exp = remember
    ? Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    : Date.now() + 4 * 60 * 60 * 1000; // 4h si non coché
  try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ exp, remember })); } catch {}
}

function clearSession() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
}

function useAuth() {
  const [authed, setAuthed] = React.useState(() => isSessionValid());
  React.useEffect(() => {
    const onFocus = () => setAuthed(isSessionValid());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  const login = React.useCallback((remember) => {
    saveSession(remember);
    setAuthed(true);
  }, []);
  const logout = React.useCallback(() => {
    clearSession();
    setAuthed(false);
  }, []);
  return { authed, login, logout };
}

// Expose to other Babel scripts
window.useAuth = window.useAuth || null;

function LoginGate({ onSuccess }) {
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [showPass, setShowPass] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const h = await sha256Hex(`${user.trim().toLowerCase()}::${pass}`);
      if (h === AUTH_HASH) {
        onSuccess(remember);
      } else {
        setErr('Identifiants incorrects.');
      }
    } catch {
      setErr('Erreur de vérification. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{
        maxWidth: 440, margin: '40px auto', background: '#fff',
        border: '1px solid var(--ip-line)', borderRadius: 16,
        padding: '32px 30px', boxShadow: '0 10px 40px rgba(20,23,40,0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'var(--ip-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0, color: 'var(--ip-ink)' }}>
            Accès protégé
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ip-muted)', margin: '6px 0 0' }}>
            L'envoi au client est réservé aux utilisateurs autorisés.
          </p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ip-muted)', marginBottom: 6 }}>
              Courriel
            </div>
            <input
              type="email"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
              required
              autoComplete="username"
              placeholder="vous@ipropre.ca"
              style={{
                width: '100%', padding: '11px 14px', fontSize: 15,
                border: '1px solid var(--ip-line)', borderRadius: 10,
                background: '#fafbfc', outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--ip-orange)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--ip-line)'}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ip-muted)', marginBottom: 6 }}>
              Mot de passe
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 42px 11px 14px', fontSize: 15,
                  border: '1px solid var(--ip-line)', borderRadius: 10,
                  background: '#fafbfc', outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--ip-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--ip-line)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Masquer' : 'Afficher'}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--ip-muted)', padding: 6, borderRadius: 6
                }}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: 14, color: 'var(--ip-ink)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Rester connecté sur cet appareil (30 jours)
          </label>

          {err && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14
            }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-orange"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Vérification…' : 'Se connecter'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--ip-muted)', textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
            Accès réservé à iPropre · Toute activité est journalisée localement
          </p>
        </form>
      </div>
    </section>
  );
}

// Expose for app.jsx (each Babel script has its own scope)
Object.assign(window, { useAuth, LoginGate, clearAuthSession: clearSession });
