// Common helpers and small shared components for the iPropre soumission app

// ---------- Icons (inline SVG, minimal set) ----------
const Icon = {
  plus: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  trash: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14M10 11v6M14 11v6"/></svg>,
  check: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  mail: (p={}) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  download: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-5-5l5 5 5-5M5 21h14"/></svg>,
  edit: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  close: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  arrow: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  chev: (p={}) => <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  play: (p={}) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>,
  doc: (p={}) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  external: (p={}) => <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>,
  image: (p={}) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  video: (p={}) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>,
  star: (p={}) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

// ---------- Toast system ----------
function useToasts() {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setItems(s => [...s, { id, msg }]);
    setTimeout(() => setItems(s => s.filter(t => t.id !== id)), 2600);
  }, []);
  const ui = (
    <div className="toast-stack">
      {items.map(t => (
        <div key={t.id} className="toast"><span className="dot" />{t.msg}</div>
      ))}
    </div>
  );
  return [push, ui];
}

// ---------- Logo header (tiny) ----------
function BrandMark({ size = 38 }) {
  return <img src="assets/logo.png" alt="iPropre" style={{ height: size, width: 'auto', display: 'block' }} />;
}

// ---------- Contact card — shown at bottom of every tab ----------
function ContactCard({ variant = 'inline' }) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: '14px 18px', borderRadius: 14,
      background: 'linear-gradient(135deg, #fff8eb 0%, #fff 60%, #fbe5b2 100%)',
      border: '1px solid #f0d17a',
      boxShadow: '0 2px 10px rgba(244,165,28,0.08)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: 'var(--ip-orange)', color: '#fff',
        display: 'grid', placeItems: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--ip-ink)', lineHeight: 1.2 }}>
          Une question&nbsp;? Contactez-nous à tout moment.
        </div>
        <div style={{ fontSize: 12, color: 'var(--ip-muted)', marginTop: 3 }}>
          Idriss Sassi, président — réponse rapide garantie.
        </div>
      </div>
      <a
        href="mailto:idriss@ipropre.ca"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: '#fff', color: 'var(--ip-ink)', border: '1px solid var(--ip-line)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ip-orange)'; e.currentTarget.style.color = 'var(--ip-orange)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ip-line)'; e.currentTarget.style.color = 'var(--ip-ink)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        idriss@ipropre.ca
      </a>
      <a
        href="tel:+18199952414"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: 'var(--ip-ink)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a30'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ip-ink)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        819 995-2414
      </a>
    </div>
  );
  return <div style={{ margin: '28px 0 18px' }}>{inner}</div>;
}

// ---------- Floating contact pill — top-right, slides in when scrolled to top / tab change ----------
function ContactPill({ tabKey }) {
  const [show, setShow] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const lastScrollY = React.useRef(0);

  // Re-trigger the slide-in animation whenever the active tab changes,
  // and scroll the page back to the top so the pill appears on a fresh view.
  React.useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, [tabKey]);

  // Hide on scroll-down, re-show on scroll-up (consistent behaviour across every tab).
  React.useEffect(() => {
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastScrollY.current + 4;
      const goingUp = y < lastScrollY.current - 4;
      if (y < 60) {
        // Near the top: always visible
        setShow(true);
      } else if (goingDown && y > 120) {
        setShow(false);
      } else if (goingUp) {
        setShow(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="contact-pill"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: 78, right: 24,
        zIndex: 35,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px 8px 10px',
        borderRadius: 999,
        background: 'linear-gradient(135deg, #fff8eb 0%, #fff 60%, #fbe5b2 100%)',
        border: '1px solid #f0d17a',
        boxShadow: hovered ? '0 8px 24px rgba(244,165,28,0.28)' : '0 4px 14px rgba(244,165,28,0.18)',
        transform: show ? 'translateY(0)' : 'translateY(-120%)',
        opacity: show ? 1 : 0,
        transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease, box-shadow 0.2s ease',
        fontSize: 12.5,
        maxWidth: 'calc(100vw - 48px)',
      }}
    >
      <div className="contact-pill-icon-main" style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'var(--ip-orange)', color: '#fff',
        display: 'grid', placeItems: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </div>
      <div className="contact-pill-text" style={{ fontWeight: 600, color: 'var(--ip-ink)', fontFamily: 'var(--font-serif)', fontSize: 13, whiteSpace: 'nowrap' }}>
        Contactez-nous à tout moment
      </div>
      <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
        <a href="mailto:idriss@ipropre.ca" title="idriss@ipropre.ca" style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%', background: '#fff', color: 'var(--ip-ink)', border: '1px solid var(--ip-line)', textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </a>
        <a href="tel:+18199952414" title="819 995-2414" style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%', background: 'var(--ip-ink)', color: '#fff', textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
      </div>
    </div>
  );
}

// ---------- Currency helpers ----------
const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// ---------- Section heading with iPropre signature style ----------
function SectionTitle({ label, idx, color = 'var(--ip-orange)', onRename }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: '#fff', border: '1px solid var(--ip-line)',
        display: 'grid', placeItems: 'center', flexShrink: 0
      }}>
        <BrandMark size={22} />
      </div>
      <h3 style={{
        margin: 0, fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color,
        letterSpacing: '-0.01em',
      }}>{label}</h3>
      {idx != null && <span className="pill" style={{ marginLeft: 4 }}>{String(idx).padStart(2,'0')}</span>}
    </div>
  );
}

// ---------- Shared select ----------
function SmartSelect({ value, onChange, options, extraClass = '' }) {
  const [customMode, setCustomMode] = React.useState(false);
  const [customDraft, setCustomDraft] = React.useState(value || '');
  const isCustom = value && !options.includes(value) && value !== '';

  React.useEffect(() => {
    if (isCustom) setCustomDraft(value);
  }, [value, isCustom]);

  if (customMode || isCustom) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          className={`txt-input sel is-custom ${extraClass}`}
          value={customDraft}
          autoFocus={customMode}
          placeholder="Personnaliser…"
          onChange={(e) => setCustomDraft(e.target.value)}
          onBlur={() => { onChange(customDraft); setCustomMode(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onChange(customDraft); setCustomMode(false); e.target.blur(); }
            if (e.key === 'Escape') { setCustomMode(false); setCustomDraft(value||''); }
          }}
          style={{ flex: 1, background: 'var(--ip-blue-soft)' }}
        />
        <button className="btn-icon" title="Revenir aux options"
                onClick={() => { onChange(''); setCustomMode(false); }}>
          <Icon.close />
        </button>
      </div>
    );
  }

  return (
    <select
      className={`sel ${extraClass}`}
      value={value || ''}
      onChange={(e) => {
        if (e.target.value === '__custom__') { setCustomMode(true); setCustomDraft(''); }
        else onChange(e.target.value);
      }}
    >
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
      <option value="__custom__">✏️ Personnaliser…</option>
    </select>
  );
}

// Expose globally for other Babel scripts
Object.assign(window, { Icon, useToasts, BrandMark, ContactCard, ContactPill, fmtMoney, SectionTitle, SmartSelect });
