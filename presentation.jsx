// Presentation page — adapted from "Affiche iPropre V5.0"

function PresentationPage() {
  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <span className="eyebrow">01 — Présentation</span>
          <h1>Un espace propre,<br/><span style={{ color: 'var(--ip-orange)' }}>une image qui parle.</span></h1>
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
            { t: 'Résolution', s: 'en 30 min' },
          ].map(x => (
            <div key={x.t} style={{ background: '#0f0f10', padding: '16px 20px' }}>
              <div style={{ fontSize: 12.5, color: '#c8c8cc' }}>{x.t}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ip-orange)', marginTop: 2 }}>{x.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 01 — Services */}
      <SectionTitle label="01 — Nos services" color="var(--ip-orange)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { t: 'Nettoyage commercial', d: "De l'entretien quotidien aux interventions spécialisées — nous prenons soin de vos espaces avec précision.", tags: ['Désinfection', 'Cirage', 'Tapis', 'Vitres', 'Décapage', 'Après sinistre'], accent: 'var(--ip-orange)' },
          { t: "Gestion d'édifice", d: "Au-delà du ménage : nous coordonnons la maintenance complète de votre immeuble pour zéro souci.", tags: ['Peinture', 'Électricité', 'Bricolage', 'Coordination fournisseurs'], accent: 'var(--ip-blue)' },
          { t: 'Consulting & Formation', d: "Programmes sur mesure pour perfectionner votre équipe et optimiser vos opérations de nettoyage.", tags: ['Programmes sur mesure', 'Formation terrain'], accent: 'var(--ip-coral)' },
        ].map((s, i) => (
          <div key={s.t} className="card card-pad" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 18, right: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ip-muted)' }}>0{i+1}</div>
            <div style={{ width: 36, height: 4, background: s.accent, borderRadius: 999, marginBottom: 14 }} />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.t}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ip-ink-2)', lineHeight: 1.55, marginBottom: 14 }}>{s.d}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {s.tags.map(t => <span key={t} className="pill" style={{ background: s.accent + '1f', color: s.accent }}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* 02 — Nos chiffres */}
      <SectionTitle label="02 — Nos chiffres" color="var(--ip-orange)" />
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '20px 26px', background: 'var(--ip-orange-soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: '#7c5300' }}>
            Nous faisons partie du 1 % des meilleures entreprises du secteur de l'entretien au Québec.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            { big: '200k', u: 'pi²', lbl: 'nettoyés chaque jour' },
            { big: '1 400', u: '', lbl: 'bureaux entretenus chaque jour' },
            { big: '8', u: 'ans', lbl: 'de clients satisfaits sans exception' },
            { big: '1', u: 'seul', lbl: "client perdu en 8 ans d'opération" },
            { big: '5', u: 'min', lbl: 'temps de réponse moyen' },
            { big: '5 %', u: '/ 0 %', lbl: 'taux de roulement / absence chez nos clients' },
            { big: '70', u: 'pts', lbl: "de contrôle et d'inspection" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '22px 22px',
              borderTop: '1px solid var(--ip-line-2)',
              borderLeft: (i % 4 !== 0) ? '1px solid var(--ip-line-2)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 800, color: 'var(--ip-orange)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.big}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ip-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.u}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ip-ink-2)', marginTop: 8, lineHeight: 1.45 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 04 — Tarifs */}
      <SectionTitle label="04 — Notre approche tarifaire" color="var(--ip-orange)" />
      <div className="card" style={{ padding: 32, marginBottom: 28, background: 'linear-gradient(135deg, #fff 0%, var(--ip-orange-soft) 100%)' }}>
        <div style={{ maxWidth: 680 }}>
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
      </div>

      {/* Testimonials */}
      <SectionTitle label="Ce que nos clients disent" color="var(--ip-orange)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { q: "C'est magnifique ! Tu as réussi à raviver notre salle à dîner. C'est tellement plus lumineux ! Un grand merci à ton équipe pour ce petit miracle.", n: 'Valérie Brodeur', r: 'Conseillère RH — CEPSA Chimie Bécancour' },
          { q: "Chez Progi, nous faisons affaires avec iPropre depuis 6 ans. Un allié fiable, qui livre toujours haut dessus des attentes. Nous recommandons sans hésiter.", n: 'Alexandre Rocheleau', r: 'Directeur marketing — Progi' },
          { q: "Merci beaucoup pour votre dévouement, c'est très rafraichissant puisque c'est quand même une rareté dans votre domaine.", n: 'Nathalie Guindon', r: 'Directrice Gestion et Développement — Biron' },
        ].map((t, i) => (
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
        ))}
      </div>

      {/* Services & Clients combined: show short clients teaser at bottom */}
      <SectionTitle label="Ils nous font confiance" color="var(--ip-orange)" />
      <div style={{ fontSize: 13.5, color: 'var(--ip-muted)', marginTop: -6, marginBottom: 16, maxWidth: 520 }}>
        Plus de 1 400 bureaux entretenus chaque jour, dans 4 grands secteurs.
      </div>
      {[
        { title: 'Immeubles & Bureaux', items: [
          { src: 'assets/logos/remax.png', name: 'Remax De Francheville' },
          { src: 'assets/logos/progi.jpeg', name: 'Progi' },
          { name: 'Polyclinique' }, { name: 'Trifluviens' }, { name: 'UPA' },
        ]},
        { title: 'Secteur médical', items: [
          { src: 'assets/logos/biron.png', name: 'Biron' },
          { src: 'assets/logos/gmf.png', name: 'GMF Trois-Rivières' },
          { name: 'IMAGIX' }, { name: 'Épiderma' }, { name: 'GMF Poly' },
        ]},
        { title: 'Éducation & Loisirs', items: [
          { src: 'assets/logos/clmp.png', name: 'Centre Multiplus' },
          { src: 'assets/logos/cpe.jpeg', name: 'CPE Mamuse et Méduque' },
          { name: 'CPE Méduc' },
        ]},
        { title: 'Industriel', items: [
          { src: 'assets/logos/moeve.png', name: 'MOEVE' },
          { name: 'Yvon Couture' }, { name: 'CCI' }, { name: 'Canadoil' },
        ]},
      ].map(sec => (
        <div key={sec.title} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 6, height: 20, background: 'var(--ip-orange)', borderRadius: 3 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ip-ink-2)' }}>
              {sec.title}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {sec.items.map(it => (
              <div key={it.name} style={{
                height: 100, borderRadius: 12, background: '#fff',
                border: '1px solid var(--ip-line-2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 14, gap: 6,
              }}>
                {it.src ? (
                  <img src={it.src} alt={it.name} style={{ maxWidth: '88%', maxHeight: 48, objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--ip-muted)', letterSpacing: '-0.01em', textAlign: 'center' }}>{it.name}</div>
                )}
                <div style={{ fontSize: 10.5, color: 'var(--ip-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textAlign: 'center' }}>{it.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PresentationPage });
