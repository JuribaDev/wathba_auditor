function Library({ lang, setRoute }) {
  const t = useT(lang);
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = window.SKILLS.filter(s => {
    if (cat !== "all" && s.category !== cat) return false;
    if (status !== "all" && s.status !== status) return false;
    return true;
  });
  const filters = [
    { id: "all", label: t.library.filterAll },
    { id: "saudi", label: t.library.filterSaudi },
    { id: "security", label: t.library.filterSecurity },
    { id: "architecture", label: t.library.filterArch },
  ];
  const statusFilters = [
    { id: "all", label: lang === "ar" ? "كل الحالات" : "All statuses" },
    { id: "reviewed", label: t.status.reviewed },
    { id: "community", label: t.status.community },
    { id: "draft", label: t.status.draft },
  ];
  return (
    <div className="container page-enter" style={{ paddingBlock: "40px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>§ 02</div>
        <h1 className="display-lg" style={{ marginBottom: 12 }}>{t.library.title}</h1>
        <p className="lede">{t.library.lede}</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs">
          {filters.map(f => <button key={f.id} type="button" className={`tab ${cat === f.id ? "active" : ""}`} onClick={() => setCat(f.id)}>{f.label}</button>)}
        </div>
        <div className="tabs">
          {statusFilters.map(f => <button key={f.id} type="button" className={`tab ${status === f.id ? "active" : ""}`} onClick={() => setStatus(f.id)}>{f.label}</button>)}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--fg-muted)" }}>{t.library.empty}</div>
      ) : (
        <div className="skills-grid">
          {filtered.map(s => <SkillMiniCard key={s.id} skill={s} lang={lang} onClick={() => setRoute({ name: "detail", id: s.id })} />)}
        </div>
      )}
    </div>
  );
}

function SkillDetail({ lang, id, setRoute }) {
  const t = useT(lang);
  const skill = window.SKILLS.find(s => s.id === id);
  if (!skill) return <div className="container" style={{ padding: 40 }}>Not found</div>;
  return (
    <div className="container-narrow page-enter" style={{ paddingBlock: "32px 60px" }}>
      <Button variant="ghost" onClick={() => setRoute({ name: "library" })} icon={<Icon name="arrowBack" size={14}/>} style={{ marginBottom: 20 }}>{t.detail.back}</Button>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <Badge variant="primary">{skill.category === "saudi" ? (lang === "ar" ? "الامتثال السعودي" : "Saudi compliance") : skill.category === "security" ? (lang === "ar" ? "الأمن" : "Security") : (lang === "ar" ? "الهيكلة" : "Architecture")}</Badge>
          <StatusBadge status={skill.status} lang={lang} />
          <Badge variant="outline"><span style={{ fontFamily: "var(--mono)" }}>v{skill.version}</span></Badge>
          <Badge variant="outline">{t.detail.lastVerified} {skill.lastVerified}</Badge>
        </div>
        <h1 className="display-lg" style={{ marginBottom: 14 }}>{skill.name[lang]}</h1>
        <p className="lede">{skill.plain[lang]}</p>
      </div>

      {skill.disclaimer && (
        <div style={{ marginBottom: 24 }}>
          <Notice variant="warning">
            <strong>{t.detail.disclaimer}.</strong> {t.detail.disclaimerBody}
          </Notice>
        </div>
      )}

      <div className="card" style={{ padding: 26, marginBottom: 20 }}>
        <h2 className="display-md" style={{ marginBottom: 12 }}>{t.detail.whatThisCovers}</h2>
        <p style={{ color: "var(--fg-muted)", lineHeight: 1.65, fontSize: 15 }}>{skill.desc[lang]}</p>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 12.5, color: "var(--fg-muted)", fontFamily: "var(--mono)", display: "flex", gap: 8, alignItems: "center" }}>
          <Icon name="file" size={13}/> SKILL.md
        </div>
        <pre className="code-block" style={{ border: 0, borderRadius: 0, margin: 0, maxHeight: 500, fontSize: 12.5 }}>{window.SAMPLE_CLAUDE_BODY}</pre>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t.detail.variables}</div>
          {skill.variables.length > 0 ? (
            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {skill.variables.map(v => <li key={v.id} style={{ fontSize: 13 }}><code className="code-inline">{v.id}</code> <span style={{ color: "var(--fg-muted)" }}>· {v.label[lang]}</span></li>)}
            </ul>
          ) : <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>—</div>}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t.detail.references}</div>
          <div style={{ fontSize: 13, color: skill.references ? "var(--fg)" : "var(--fg-muted)" }}>{skill.references ? `${skill.references} ${lang === "ar" ? "ملفات" : "files"}` : "—"}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{t.detail.scripts}</div>
          <div style={{ fontSize: 13, color: skill.scripts ? "var(--fg)" : "var(--fg-muted)" }}>{skill.scripts ? `${skill.scripts} ${lang === "ar" ? "سكربت" : "script"}` : "—"}</div>
        </div>
      </div>

      {skill.sources.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.detail.sources}</div>
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {skill.sources.map((src, i) => (
              <li key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <Icon name="external" size={14}/>
                <a href="#">{src[lang]}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="meta-row" style={{ justifyContent: "space-between" }}>
        <div>{t.detail.maintainedBy} <strong style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{skill.maintainers.join(", ")}</strong></div>
        <div>{t.detail.version} <strong style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{skill.version}</strong></div>
      </div>
    </div>
  );
}

Object.assign(window, { Library, SkillDetail });
