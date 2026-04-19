// Main app shell, routing, and Tweaks defaults
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "language": "en",
  "theme": "light",
  "primary": "default"
}/*EDITMODE-END*/;

function App() {
  const [lang, setLang] = useState(TWEAK_DEFAULTS.language);
  const [theme, setTheme] = useState(TWEAK_DEFAULTS.theme);
  const [primary, setPrimary] = useState(TWEAK_DEFAULTS.primary);
  const [route, setRoute] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wathbaSkills.route") || "null");
      return saved || { name: "home" };
    } catch { return { name: "home" }; }
  });
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wathbaSkills.answers") || "null") || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-primary", primary);
  }, [lang, theme, primary]);

  useEffect(() => {
    localStorage.setItem("wathbaSkills.route", JSON.stringify(route));
  }, [route]);
  useEffect(() => {
    localStorage.setItem("wathbaSkills.answers", JSON.stringify(answers));
  }, [answers]);

  function onEdit(partial) {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: partial }, "*");
  }

  const t = useT(lang);

  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="container nav-inner">
          <button className="brand" onClick={() => setRoute({ name: "home" })}>
            <span className="brand-mark">S</span>
            <span>{t.brand}</span>
          </button>
          <div className="nav-links">
            <button className={`nav-link ${route.name === "library" ? "active" : ""}`} onClick={() => setRoute({ name: "library" })}>{t.nav.library}</button>
            <button className={`nav-link ${route.name === "generate" ? "active" : ""}`} onClick={() => setRoute({ name: "generate" })}>{t.nav.generate}</button>
            <button className="nav-link" onClick={() => setRoute({ name: "compare" })}>{lang === "ar" ? "مقارنة" : "EN / AR"}</button>
            <a className="nav-link" href="#" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Icon name="github" size={14}/> GitHub</a>
            <Button size="sm" variant="primary" onClick={() => setRoute({ name: "generate" })}>{t.hero.ctaPrimary}</Button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {route.name === "home" && <Landing lang={lang} setRoute={setRoute}/>}
        {route.name === "library" && <Library lang={lang} setRoute={setRoute}/>}
        {route.name === "detail" && <SkillDetail lang={lang} id={route.id} setRoute={setRoute}/>}
        {route.name === "generate" && <Questionnaire lang={lang} answers={answers} setAnswers={setAnswers} setRoute={setRoute}/>}
        {route.name === "compare" && <Compare setRoute={setRoute}/>}
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>{t.footer}</div>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#">MIT License</a>
            <a href="#">Disclaimer</a>
            <a href="#">Contributing</a>
          </div>
        </div>
      </footer>

      <Tweaks lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} primary={primary} setPrimary={setPrimary} onEdit={onEdit}/>
    </div>
  );
}

// Compare view — EN + AR side by side, scaled down
function Compare({ setRoute }) {
  const [screen, setScreen] = useState("landing");
  const screens = [
    { id: "landing", label: "Landing" },
    { id: "q1", label: "Questionnaire" },
    { id: "review", label: "Review" },
    { id: "generate", label: "Generate" },
    { id: "detail", label: "Skill detail" },
  ];
  return (
    <div style={{ padding: "28px 20px" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", marginBottom: 18, maxWidth: 1600, marginInline: "auto", flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow">Canvas</div>
          <h2 className="display-md" style={{ marginTop: 4 }}>Bilingual parity check</h2>
          <p style={{ color: "var(--fg-muted)", fontSize: 14, marginTop: 4 }}>The same screen in English (LTR) and Arabic (RTL), rendered from a single data source.</p>
        </div>
        <div className="tabs">
          {screens.map(s => <button key={s.id} className={`tab ${screen === s.id ? "active" : ""}`} onClick={() => setScreen(s.id)}>{s.label}</button>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1800, marginInline: "auto" }}>
        <CompareFrame lang="en" screen={screen}/>
        <CompareFrame lang="ar" screen={screen}/>
      </div>
    </div>
  );
}

function CompareFrame({ lang, screen }) {
  return (
    <div className="compare-frame">
      <div className="compare-frame-head">
        <span>{lang === "en" ? "English · LTR" : "العربية · RTL"}</span>
        <span style={{ fontFamily: "var(--mono)" }}>/{lang}</span>
      </div>
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ background: "var(--bg)", color: "var(--fg)", minHeight: 620, padding: 24, fontFamily: lang === "ar" ? "IBM Plex Sans Arabic, var(--sans)" : "var(--sans)" }}>
        <CompareContent lang={lang} screen={screen}/>
      </div>
    </div>
  );
}

function CompareContent({ lang, screen }) {
  const t = useT(lang);
  if (screen === "landing") {
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>{t.hero.eyebrow}</div>
        <h1 style={{ fontFamily: lang === "ar" ? "Amiri, serif" : "var(--serif)", fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 14, fontWeight: lang === "ar" ? 700 : 500 }}>{t.hero.title}</h1>
        <p style={{ color: "var(--fg-muted)", maxWidth: "48ch", marginBottom: 20, fontSize: 15 }}>{t.hero.lede}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="primary" iconEnd={<Icon name="arrow" size={14}/>}>{t.hero.ctaPrimary}</Button>
          <Button variant="ghost">{t.hero.ctaSecondary}</Button>
        </div>
        <div className="card" style={{ marginTop: 24, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-muted)" }}>
            <span>.claude/skills/zatca-phase2/SKILL.md</span>
            <Badge variant="success" dot>{t.sample.headerBadge}</Badge>
          </div>
          <pre className="code-block" style={{ margin: 0, maxHeight: 200, fontSize: 11.5 }}>{window.SAMPLE_CLAUDE_BODY.split("\n").slice(0, 14).join("\n")}</pre>
        </div>
      </div>
    );
  }
  if (screen === "q1") {
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>01 / 04</div>
        <h2 style={{ fontFamily: lang === "ar" ? "Amiri, serif" : "var(--serif)", fontSize: 26, marginBottom: 16, fontWeight: lang === "ar" ? 700 : 500 }}>{t.q.stepAbout}</h2>
        <div className="question-title" style={{ fontSize: 17, marginBottom: 6 }}>{t.q.market.title}</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 12 }}>{t.q.market.desc}</div>
        <div className="radio-group">
          {t.q.market.options.map((o, i) => <RadioCard key={o.id} selected={i === 0} title={o.label} desc={o.desc} onClick={() => {}}/>)}
        </div>
      </div>
    );
  }
  if (screen === "review") {
    const skills = window.SKILLS.slice(0, 3);
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>03 / 04</div>
        <h2 style={{ fontFamily: lang === "ar" ? "Amiri, serif" : "var(--serif)", fontSize: 26, marginBottom: 10, fontWeight: lang === "ar" ? 700 : 500 }}>{t.review.title}</h2>
        <p style={{ color: "var(--fg-muted)", fontSize: 14, marginBottom: 18 }}>{t.review.lede}</p>
        <div style={{ display: "grid", gap: 10 }}>
          {skills.map(s => <RevSkillRow key={s.id} skill={s} lang={lang} on onToggle={() => {}} sourceLabel={t.review.autoLabel}/>)}
        </div>
      </div>
    );
  }
  if (screen === "generate") {
    return (
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>04 / 04</div>
        <h2 style={{ fontFamily: lang === "ar" ? "Amiri, serif" : "var(--serif)", fontSize: 24, marginBottom: 14, fontWeight: lang === "ar" ? 700 : 500 }}>{t.generate.title}</h2>
        <div className="card" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.generate.zipLabel}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.9, direction: "ltr", textAlign: "left" }}>
            <div style={{ color: "var(--primary)" }}><Icon name="folder" size={11}/> my-project-skills.zip</div>
            <div style={{ paddingInlineStart: 14 }}>
              <div style={{ color: "var(--primary)" }}>.claude/skills/</div>
              <div style={{ paddingInlineStart: 14, color: "var(--fg-muted)" }}>— zatca-phase2/SKILL.md</div>
              <div style={{ paddingInlineStart: 14, color: "var(--fg-muted)" }}>— pdpl-basics/SKILL.md</div>
              <div style={{ paddingInlineStart: 14, color: "var(--fg-muted)" }}>— secrets-baseline/SKILL.md</div>
              <div style={{ color: "var(--primary)" }}>.cursor/rules/</div>
              <div style={{ paddingInlineStart: 14, color: "var(--fg-muted)" }}>— zatca-phase2.mdc</div>
            </div>
          </div>
          <Button variant="primary" icon={<Icon name="download" size={14}/>} style={{ width: "100%", marginTop: 14, justifyContent: "center" }}>{t.generate.downloadBtn}</Button>
        </div>
      </div>
    );
  }
  if (screen === "detail") {
    const skill = window.SKILLS[0];
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge variant="primary">{lang === "ar" ? "الامتثال السعودي" : "Saudi compliance"}</Badge>
          <StatusBadge status={skill.status} lang={lang}/>
          <Badge variant="outline"><span style={{ fontFamily: "var(--mono)" }}>v{skill.version}</span></Badge>
        </div>
        <h1 style={{ fontFamily: lang === "ar" ? "Amiri, serif" : "var(--serif)", fontSize: 28, lineHeight: 1.15, marginBottom: 12, fontWeight: lang === "ar" ? 700 : 500 }}>{skill.name[lang]}</h1>
        <p style={{ color: "var(--fg-muted)", fontSize: 14.5, marginBottom: 16 }}>{skill.plain[lang]}</p>
        <Notice variant="warning"><strong>{t.detail.disclaimer}.</strong> {t.detail.disclaimerBody}</Notice>
      </div>
    );
  }
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
