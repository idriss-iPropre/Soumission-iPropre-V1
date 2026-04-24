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
Object.assign(window, { Icon, useToasts, BrandMark, fmtMoney, SectionTitle, SmartSelect });
