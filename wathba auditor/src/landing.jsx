function Landing({ lang, setRoute }) {
  const t = useT(lang);
  const h = t.hero;
  return (
    <div className="page-enter">
      <section className="container">
        <div className="hero-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>{h.eyebrow}</div>
            <h1 className="display-xl" style={{ marginBottom: 22 }}>{h.title}</h1>
            <p className="lede" style={{ marginBottom: 28 }}>{h.lede}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Button variant="primary" size="lg" onClick={() => setRoute({ name: "generate" })} iconEnd={<Icon name="arrow" size={16}/>}>{h.ctaPrimary}</Button>
              <Button variant="ghost" size="lg" onClick={() => setRoute({ name: "library" })}>{h.ctaSecondary}</Button>
            </div>
            <p style={{ fontSize: 13, color: "var(--fg-soft)", marginTop: 22 }}>{h.microcopy}</p>
          </div>
          <HeroSample lang={lang} />
        </div>
      </section>

      <section className="container" style={{ paddingBlock: "32px 24px" }}>
        <div className="card card-sunken" style={{ padding: "32px 36px", maxWidth: 920, marginInline: "auto", background: "var(--surface)", borderRadius: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>§ 01</div>
          <h2 className="display-md" style={{ marginBottom: 14 }}>{t.whatIsTitle}</h2>
          <p style={{ fontSize: 16, color: "var(--fg-muted)", lineHeight: 1.65, maxWidth: "65ch" }}>{t.whatIsBody}</p>
        </div>
      </section>

      <section className="container">
        <div className="feature-grid">
          {t.features.map((f, i) => (
            <div key={i}>
              <div className="feature-num">{f.n}</div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: 14.5, lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-title-row">
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>§ 02</div>
            <h2 className="display-lg" style={{ marginBottom: 10 }}>{t.skillsHeading}</h2>
            <p className="lede">{t.skillsLede}</p>
          </div>
          <Button variant="secondary" onClick={() => setRoute({ name: "library" })} iconEnd={<Icon name="arrow" size={14}/>}>{t.nav.library}</Button>
        </div>
        <div className="skills-grid">
          {window.SKILLS.slice(0, 6).map(s => (
            <SkillMiniCard key={s.id} skill={s} lang={lang} onClick={() => setRoute({ name: "detail", id: s.id })} />
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroSample({ lang }) {
  const t = useT(lang);
  return (
    <div className="sample-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--fg-muted)" }}>
          <Icon name="file" size={14} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{t.sample.filename}</span>
        </div>
        <Badge variant="success" dot>{t.sample.headerBadge}</Badge>
      </div>
      <pre className="code-block" style={{ margin: 0, maxHeight: 340, fontSize: 12.5 }}>{window.SAMPLE_CLAUDE_BODY}</pre>
    </div>
  );
}

function SkillMiniCard({ skill, lang, onClick }) {
  const t = useT(lang);
  return (
    <div className="card card-hover skill-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="skill-card-head">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Badge variant={skill.category === "saudi" ? "primary" : skill.category === "security" ? "outline" : "outline"}>
            {skill.category === "saudi" ? (lang === "ar" ? "السعودية" : "Saudi") : skill.category === "security" ? (lang === "ar" ? "الأمن" : "Security") : (lang === "ar" ? "الهيكلة" : "Arch")}
          </Badge>
          <StatusBadge status={skill.status} lang={lang} />
        </div>
        <Icon name="arrow" size={14} />
      </div>
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 8, fontFamily: "var(--serif)" }}>{skill.name[lang]}</h3>
        <div className="skill-card-plain">{skill.plain[lang]}</div>
      </div>
      <div className="skill-card-meta">
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--fg-soft)" }}>v{skill.version}</span>
        <span style={{ fontSize: 12, color: "var(--fg-soft)" }}>·</span>
        <span style={{ fontSize: 12, color: "var(--fg-soft)" }}>{lang === "ar" ? "آخر تحقق" : "verified"} {skill.lastVerified}</span>
      </div>
    </div>
  );
}

Object.assign(window, { Landing, SkillMiniCard });
