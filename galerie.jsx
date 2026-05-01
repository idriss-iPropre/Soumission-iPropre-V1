// Galerie — before/after slider and videos

const DEFAULT_GALLERY = [
  { id: 'g1', title: 'Plancher VCT — Clinique médicale', tag: 'Cirage & récurage',
    before: 'assets/galerie/plancher-avant.jpg', after: 'assets/galerie/plancher-apres.jpg',
    caption: 'Décapage complet puis cirage haute brillance. Remise à neuf en une intervention.' },
  { id: 'g2', title: 'Cirage CPE — vue d\'ensemble', tag: 'Plancher',
    image: 'assets/galerie/cirage-overview.jpg',
    caption: 'Trois salles d\'un CPE à Trois-Rivières après cirage.' },
];

function BeforeAfter({ before, after, caption }) {
  const [pos, setPos] = React.useState(50);
  const ref = React.useRef(null);
  const dragging = React.useRef(false);

  const move = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setPos((x / rect.width) * 100);
  };

  return (
    <div
      ref={ref}
      className="ba-wrap"
      onMouseDown={(e) => { dragging.current = true; move(e.clientX); }}
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => dragging.current = false}
      onMouseLeave={() => dragging.current = false}
      onTouchStart={(e) => move(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      style={{
        position: 'relative', width: '100%', aspectRatio: '16/10',
        background: '#111', borderRadius: 12, overflow: 'hidden', cursor: 'ew-resize',
        userSelect: 'none',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: after ? `url(${after}) center/cover` : 'linear-gradient(135deg, #d4e8d9 0%, #a8d0b3 100%)',
      }}>
        {!after && <Placeholder label="APRÈS" sub="photo après" accent="#5A8A5B" />}
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
        background: before ? `url(${before}) center/cover` : 'linear-gradient(135deg, #e8d9d4 0%, #d0a8a8 100%)',
      }}>
        {!before && <Placeholder label="AVANT" sub="photo avant" accent="#9E5A5A" />}
      </div>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
        width: 3, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
        transform: 'translateX(-50%)',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 40, height: 40, borderRadius: '50%',
          background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'grid', placeItems: 'center',
          color: 'var(--ip-ink)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(158,90,90,0.9)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}>AVANT</div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(90,138,91,0.9)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}>APRÈS</div>
    </div>
  );
}

function Placeholder({ label, sub, accent }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'grid', placeItems: 'center',
      backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.15) 12px 14px)',
    }}>
      <div style={{ textAlign: 'center', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, letterSpacing: '0.02em' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

function VideoCard({ src, tag, title, caption, tagClass = 'coral' }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        style={{ width: '100%', display: 'block', background: '#000', aspectRatio: '16/10', objectFit: 'cover' }}
      />
      <div style={{ padding: 16 }}>
        <span className={`pill ${tagClass}`}>{tag}</span>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginTop: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--ip-muted)', marginTop: 4 }}>{caption}</div>
      </div>
    </div>
  );
}

function GaleriePage() {
  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <span className="eyebrow">03 — Réalisations</span>
          <h1>Avant / après &amp; vidéos.</h1>
          <p className="sub">Glissez le curseur sur chaque photo pour comparer. Trois vidéos de réalisations en bas de page.</p>
        </div>
      </div>

      {/* Before/after grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 32 }}>
        {DEFAULT_GALLERY.map(g => (
          <div key={g.id} className="card" style={{ overflow: 'hidden' }}>
            {g.image ? (
              <div style={{ width: '100%', aspectRatio: '16/10', background: `#111 url(${g.image}) center/cover` }} />
            ) : (
              <BeforeAfter before={g.before} after={g.after} />
            )}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="pill orange">{g.tag}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{g.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ip-muted)' }}>{g.caption}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Videos */}
      <SectionTitle label="Vidéos de réalisation" color="var(--ip-orange)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <VideoCard
          src="assets/videos/realisation-cirage-1.mp4"
          tag="Cirage plancher"
          title="Cirage de plancher — démonstration"
          caption="Décapage, rinçage, cirage 3 couches."
        />
        <VideoCard
          src="assets/videos/peinture-cepsa.mp4"
          tag="Travaux spécifiques"
          title="Peinture — CEPSA"
          caption="Intervention de peinture commerciale sur site client."
          tagClass="blue"
        />
        <VideoCard
          src="assets/videos/fuite-eau.mp4"
          tag="Intervention d'urgence"
          title="Fuite d'eau — dégât contrôlé"
          caption="Intervention rapide suite à un dégât d'eau."
          tagClass=""
        />
      </div>
    </div>
  );
}

Object.assign(window, { GaleriePage });
