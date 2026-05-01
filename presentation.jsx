// Presentation page — adapted from "Affiche iPropre V5.0"

function PresentationPage() {
  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <span className="eyebrow">01 — Présentation</span>
          <h1>Un espace propre,<br /><span style={{ color: 'var(--ip-orange)' }}>une image qui parle.</span></h1>
          <p className="sub">iPropre accompagne les entreprises avec des solutions d'entretien et de gestion efficaces, écologiques et sur mesure — pour que vous vous concentriez sur l'essentiel.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-ghost" href="assets/annexes/presentation.pdf" target="_blank">
            <Icon.external /> Affiche complète (PDF)
          </a>
        </div>
      </div>

      {/* Hero strip: key promises */}
      <div className="card" style={{ padding: 0, marginBottom: 22, overflow: 'hidden', background: 'linear-gradient(135deg, #0f0f10 0%, #2a2a30 100%)', color: '#fff' }}>
        <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <img src="assets/logo-full.png" alt="iPropre" style={{ height: 78, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ip-orange)', marginBottom: 6 }}>Entretien · Gestion · Formation — depuis 8 ans</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>La propreté, c'est notre promesse.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.08)' }}>
          {[
          { t: 'Produits biologiques', s: 'certifiés' },
          { t: 'Accord de confidentialité', s: 'signé' },
          { t: 'Assurance civile', s: '5 M$' },
          { t: 'Résolution', s: 'en 30 min' }].
          map((x) =>
          <div key={x.t} style={{ background: '#0f0f10', padding: '16px 20px' }}>
              <div style={{ fontSize: 12.5, color: '#c8c8cc' }}>{x.t}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ip-orange)', marginTop: 2 }}>{x.s}</div>
            </div>
          )}
        </div>
      </div>

      {/* 01 — Services */}
      <SectionTitle label="01 — Nos services" color="var(--ip-orange)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
        { t: 'Nettoyage commercial', d: "De l'entretien quotidien aux interventions spécialisées — nous prenons soin de vos espaces avec précision.", tags: ['Désinfection', 'Cirage', 'Tapis', 'Vitres', 'Décapage', 'Après sinistre'], accent: 'var(--ip-orange)' },
        { t: "Gestion d'édifice", d: "Au-delà du ménage : nous coordonnons la maintenance complète de votre immeuble pour zéro souci.", tags: ['Peinture', 'Électricité', 'Bricolage', 'Coordination fournisseurs'], accent: 'var(--ip-blue)' },
        { t: 'Consulting & Formation', d: "Programmes sur mesure pour perfectionner votre équipe et optimiser vos opérations de nettoyage.", tags: ['Programmes sur mesure', 'Formation terrain'], accent: 'var(--ip-coral)' }].
        map((s, i) =>
        <div key={s.t} className="card card-pad" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 18, right: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ip-muted)' }}>0{i + 1}</div>
            <div style={{ width: 36, height: 4, background: s.accent, borderRadius: 999, marginBottom: 14 }} />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.t}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ip-ink-2)', lineHeight: 1.55, marginBottom: 14 }}>{s.d}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {s.tags.map((t) => <span key={t} className="pill" style={{ background: s.accent + '1f', color: s.accent }}>{t}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* 02 — Nos chiffres */}
      <SectionTitle label="02 — Nos chiffres" color="var(--ip-orange)" />
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '22px 28px', background: 'var(--ip-orange-soft)', display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 56, fontWeight: 800, color: 'var(--ip-orange)', lineHeight: 0.9, letterSpacing: '-0.03em', flexShrink: 0 }}>1 %</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: '#7c5300', lineHeight: 1.35, flex: 1, minWidth: 240 }}>
            Nous faisons partie du <span style={{ background: '#fff', padding: '0 6px', borderRadius: 4, color: 'var(--ip-orange)' }}>top 1 %</span> des meilleures entreprises du secteur de l'entretien au Québec.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', alignItems: 'stretch' }}>
          {/* Left: 3-column grid of stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--ip-line-2)' }}>
            {[
            { big: '200k', u: 'pi²', lbl: 'nettoyés chaque jour' },
            { big: '1 400', u: '', lbl: 'bureaux entretenus chaque jour' },
            { big: '8', u: 'ans', lbl: 'de clients satisfaits sans exception' },
            { big: '1', u: 'seul', lbl: "client perdu en 8 ans d'opération" },
            { big: '5', u: 'min', lbl: 'temps de réponse moyen' },
            { big: '70', u: 'pts', lbl: "de contrôle et d'inspection" }].
            map((s, i) =>
            <div key={i} style={{
              padding: '22px 22px',
              borderTop: i >= 3 ? '1px solid var(--ip-line-2)' : 'none',
              borderLeft: i % 3 !== 0 ? '1px solid var(--ip-line-2)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 800, color: 'var(--ip-orange)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.big}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ip-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.u}</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ip-ink-2)', marginTop: 8, lineHeight: 1.45 }}>{s.lbl}</div>
              </div>
            )}
          </div>
          {/* Right: featured stat */}
          <div style={{
            borderTop: '1px solid var(--ip-line-2)',
            borderLeft: '1px solid var(--ip-line-2)',
            background: 'linear-gradient(155deg, #fff8eb 0%, var(--ip-orange-soft) 100%)',
            padding: '28px 26px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ip-muted)', marginBottom: 10 }}>
              Chez nos clients
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 72, fontWeight: 800, color: 'var(--ip-orange)', lineHeight: 0.9, letterSpacing: '-0.04em' }}>5 %</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 600, color: '#c0392b', lineHeight: 1, margin: '0 6px', fontStyle: 'italic' }}>&amp;</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 72, fontWeight: 800, color: 'var(--ip-ink)', lineHeight: 0.9, letterSpacing: '-0.04em' }}>0 %</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ip-ink)', marginTop: 14, lineHeight: 1.45, fontWeight: 500 }}>
              taux de <strong>roulement</strong> / <strong>absence</strong>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ip-muted)', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
              Une équipe stable et présente — pas de visages qui changent chaque mois.
            </div>
          </div>
        </div>
      </div>

      {/* 03 — Tarifs */}
      <SectionTitle label="03 — Notre approche tarifaire" color="var(--ip-orange)" />
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28, background: 'linear-gradient(135deg, #fff 0%, var(--ip-orange-soft) 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(220px, 280px)', gap: 0, alignItems: 'stretch' }}>
          <div style={{ padding: '32px 32px 32px 32px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 10 }}>
              Le meilleur service au juste prix — <span style={{ color: 'var(--ip-orange)' }}>garanti</span>.
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--ip-ink-2)', lineHeight: 1.6, marginBottom: 18 }}>
              Nous ne vendons pas une formule fixe. En 30 minutes, nous vous présentons <strong>3 options adaptées</strong> à votre budget et vos besoins réels — sans surprise, sans engagement.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="pill orange">✦ 3 propositions</span>
              <span className="pill orange">30 minutes</span>
              <span className="pill orange">Prix garanti par écrit</span>
            </div>
          </div>
          {/* Square calendar CTA, right side */}
          <a
            href="https://calendar.app.google/iUAHZ6JXVyHSXojq7"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              alignSelf: 'stretch',
              margin: 24,
              aspectRatio: '1 / 1',
              maxWidth: 240,
              minHeight: 220,

              background: 'var(--ip-ink)',
              color: '#fff',
              display: 'flex', flexDirection: 'column',
              padding: '20px 22px',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(244,165,28,0.32), 0 3px 8px rgba(0,0,0,0.12)',
              transition: 'transform .15s ease, box-shadow .15s ease',
              position: 'relative',
              overflow: 'hidden', textAlign: "center", backgroundColor: "rgb(4, 4, 4)", borderRadius: "30px", opacity: "1"
            }}
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-3px)';e.currentTarget.style.boxShadow = '0 14px 36px rgba(244,165,28,0.42), 0 5px 12px rgba(0,0,0,0.16)';}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = '';e.currentTarget.style.boxShadow = '0 10px 30px rgba(244,165,28,0.32), 0 3px 8px rgba(0,0,0,0.12)';}}>
            
            {/* Decorative orange corner accent */}
            <div style={{
              position: 'absolute', top: -36, right: -36, width: 110, height: 110,
              background: 'radial-gradient(circle at 30% 30%, rgba(244,165,28,0.55), transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              borderRadius: 14,
              background: 'var(--ip-orange)', color: '#fff',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 12px rgba(244,165,28,0.35)', width: "70px", letterSpacing: "0px", lineHeight: "1.4", fontWeight: "400", fontSize: "16px", height: "70px"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "50px", height: "50px" }}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="8" cy="15" r="1.6" fill="currentColor" />
                <circle cx="13" cy="15" r="1.6" fill="currentColor" opacity="0.55" />
                <circle cx="17" cy="15" r="1.6" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: 4, textAlign: "left" }}>
              30 min · sans engagement
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              Prendre votre <span style={{ color: 'var(--ip-orange)' }}>RDV</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)' }}>
              <span>Réserver</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </div>
          </a>
        </div>
      </div>

      {/* 04 — Témoignages */}
      <SectionTitle label="04 — Ce que nos clients disent" color="var(--ip-orange)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
        { q: "C'est magnifique ! Tu as réussi à raviver notre salle à dîner. C'est tellement plus lumineux ! Un grand merci à ton équipe pour ce petit miracle.", n: 'Valérie Brodeur', r: 'Conseillère RH — CEPSA Chimie Bécancour' },
        { q: "Chez Progi, nous faisons affaires avec iPropre depuis 6 ans. Un allié fiable, qui livre toujours haut dessus des attentes. Nous recommandons sans hésiter.", n: 'Alexandre Rocheleau', r: 'Directeur marketing — Progi' },
        { q: "Merci beaucoup pour votre dévouement, c'est très rafraichissant puisque c'est quand même une rareté dans votre domaine.", n: 'Nathalie Guindon', r: 'Directrice Gestion et Développement — Biron' }].
        map((t, i) =>
        <div key={i} className="card card-pad" style={{ position: 'relative', paddingTop: 34 }}>
            <div style={{ position: 'absolute', top: 16, left: 22, fontFamily: 'var(--font-serif)', fontSize: 60, lineHeight: 0.8, color: 'var(--ip-orange)', opacity: 0.28 }}>"</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ip-ink-2)', fontStyle: 'italic', marginBottom: 14 }}>
              « {t.q} »
            </div>
            <div style={{ borderTop: '1px solid var(--ip-line-2)', paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.n}</div>
              <div style={{ fontSize: 12, color: 'var(--ip-muted)' }}>{t.r}</div>
            </div>
          </div>
        )}
      </div>

      {/* 05 — Clients */}
      <SectionTitle label="05 — Ils nous font confiance" color="var(--ip-orange)" />
      <div style={{ fontSize: 13.5, color: 'var(--ip-muted)', marginTop: -6, marginBottom: 16, maxWidth: 520 }}>
        Plus de 1 400 bureaux entretenus chaque jour, dans 4 grands secteurs.
      </div>
      {[
      { title: 'Immeubles & Bureaux', items: [
        { src: 'assets/logos/remax.png', name: 'Remax De Francheville' },
        { src: 'assets/logos/progi.jpeg', name: 'Progi' },
        { src: 'assets/logos/immeubles-polyclinique.png', name: 'Immeubles de la Polyclinique' },
        { src: 'assets/logos/edifice-trifluvien.jpg', name: 'Édifice Le Trifluvien', photo: true },
        { src: 'assets/logos/upa.jpg', name: 'UPA' }]
      },
      { title: 'Secteur médical', items: [
        { src: 'assets/logos/biron.png', name: 'Biron' },
        { src: 'assets/logos/gmf.png', name: 'GMF Trois-Rivières' },
        { src: 'assets/logos/imagix.png', name: 'IMAGIX' },
        { src: 'assets/logos/polyclinique-oreille.png', name: "Polyclinique de l'Oreille" },
        { src: 'assets/logos/neuractiv.jpeg', name: 'Neuractiv' }]
      },
      { title: 'Éducation & Loisirs', items: [
        { src: 'assets/logos/clmp.png', name: 'Centre Multiplus' },
        { src: 'assets/logos/cpe.jpeg', name: 'CPE Mamuse et Méduque' }]
      },
      { title: 'Industriel', items: [
        { src: 'assets/logos/moeve.png', name: 'MOEVE' },
        { src: 'assets/logos/yvon-couture.png', name: 'Yvon Couture', scale: 1.35 },
        { src: 'assets/logos/cci.webp', name: 'CCI' },
        { src: 'assets/logos/canadoil.webp', name: 'Canadoil' }]
      }].
      map((sec) =>
      <div key={sec.title} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 6, height: 20, background: 'var(--ip-orange)', borderRadius: 3 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ip-ink-2)' }}>
              {sec.title}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {sec.items.map((it) =>
          <div key={it.name} style={{
            height: 120, borderRadius: 12, background: '#fff',
            border: '1px solid var(--ip-line-2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: it.photo ? 0 : 10, gap: 6, overflow: 'hidden', position: 'relative'
          }}>
                {it.photo ?
            <>
                    <img src={it.src} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: '6px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))',
                color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 600,
                textAlign: 'center', letterSpacing: '-0.01em'
              }}>{it.name}</div>
                  </> :
            it.src ?
            <img src={it.src} alt={it.name} style={{ maxWidth: '94%', maxHeight: '100%', objectFit: 'contain', transform: it.scale ? `scale(${it.scale})` : undefined }} /> :

            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--ip-muted)', letterSpacing: '-0.01em', textAlign: 'center' }}>{it.name}</div>
            }
              </div>
          )}
          </div>
        </div>
      )}
    </div>);

}

Object.assign(window, { PresentationPage });