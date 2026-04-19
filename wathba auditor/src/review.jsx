// Review step (recommended + manual) + Generate step with targets and download
function StepReview({ t, lang, answers, setAnswers }) {
  const recIds = useMemo(() => window.recommendedSkillIds(answers), [answers]);
  const [manualOpen, setManualOpen] = useState(false);
  const selected = answers.selected || {};

  // Init selected on first mount for this step
  useEffect(() => {
    if (!answers.selected) {
      const init = {};
      recIds.forEach(id => { init[id] = { on: true, source: "auto" }; });
      setAnswers(a => ({ ...a, selected: init }));
    }
  }, []);

  function toggle(id, source = "auto") {
    setAnswers(a => {
      const cur = a.selected || {};
      const existing = cur[id];
      const next = { ...cur };
      if (existing) {
        next[id] = { ...existing, on: !existing.on };
      } else {
        next[id] = { on: true, source };
      }
      return { ...a, selected: next };
    });
  }

  const activeIds = Object.entries(selected).filter(([, v]) => v.on).map(([k]) => k);
  const nonRec = window.SKILLS.filter(s => !recIds.includes(s.id));

  // Variables needed for active skills
  const varSkills = window.SKILLS.filter(s => activeIds.includes(s.id) && s.variables.length > 0);
  const varVals = answers.varVals || {};
  function setVar(skillId, varId, v) {
    setAnswers(a => ({ ...a, varVals: { ...(a.varVals || {}), [`${skillId}.${varId}`]: v } }));
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>03 / 04</div>
        <h1 className="display-lg" style={{ marginBottom: 10 }}>{t.review.title}</h1>
        <p className="lede">{t.review.lede}</p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {recIds.map(id => {
          const s = window.SKILLS.find(x => x.id === id);
          const on = selected[id]?.on ?? true;
          return <RevSkillRow key={id} skill={s} lang={lang} on={on} onToggle={() => toggle(id, "auto")} sourceLabel={t.review.autoLabel} />;
        })}
        {Object.entries(selected).filter(([id, v]) => v.source === "manual" && v.on).map(([id]) => {
          const s = window.SKILLS.find(x => x.id === id);
          if (!s) return null;
          return <RevSkillRow key={id} skill={s} lang={lang} on manual onToggle={() => toggle(id, "manual")} sourceLabel={t.review.manualLabel} />;
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <Button variant="ghost" onClick={() => setManualOpen(v => !v)} icon={<Icon name="plus" size={14}/>}>{t.review.addMore}</Button>
      </div>

      {manualOpen && (
        <div className="card card-sunken" style={{ padding: 18, marginTop: 14 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {nonRec.map(s => {
              const on = selected[s.id]?.on ?? false;
              return (
                <CheckCard key={s.id} selected={on} onClick={() => toggle(s.id, "manual")} title={s.name[lang]} desc={s.plain[lang]} />
              );
            })}
          </div>
        </div>
      )}

      {varSkills.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 className="display-md" style={{ marginBottom: 6 }}>{t.review.variables}</h2>
          <p style={{ color: "var(--fg-muted)", fontSize: 14.5, marginBottom: 20 }}>{t.review.variablesLede}</p>
          <div style={{ display: "grid", gap: 14 }}>
            {varSkills.map(s => (
              <div key={s.id} className="card" style={{ padding: 20 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 16, marginBottom: 14 }}>{s.name[lang]}</div>
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {s.variables.map(v => {
                    const key = `${s.id}.${v.id}`;
                    const val = varVals[key] ?? (answers[v.id] ?? "");
                    return (
                      <div key={v.id}>
                        <label className="label">{v.label[lang]}</label>
                        {v.kind === "select" && (
                          <select className="select-input" value={val} onChange={e => setVar(s.id, v.id, e.target.value)}>
                            <option value="">—</option>
                            {v.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                        {v.kind === "boolean" && (
                          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
                            <Toggle on={!!val} onChange={b => setVar(s.id, v.id, b)} label={v.label[lang]} />
                            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{val ? t.q.yes : t.q.no}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevSkillRow({ skill, lang, on, onToggle, sourceLabel, manual }) {
  return (
    <div className={`rev-skill ${on ? "" : "disabled"} ${manual ? "manual" : ""}`}>
      <button type="button" onClick={onToggle} className={`check-box ${on ? "" : ""}`} style={{
        width: 22, height: 22, borderRadius: 6, border: "1.5px solid var(--border-strong)",
        background: on ? "var(--primary)" : "transparent", display: "grid", placeItems: "center",
        flexShrink: 0, marginTop: 2, cursor: "pointer",
      }} aria-pressed={on}>
        {on && <Icon name="check" size={14} />}
      </button>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, margin: 0 }}>{skill.name[lang]}</h3>
          <Badge variant={manual ? "outline" : "primary"}>{sourceLabel}</Badge>
          <StatusBadge status={skill.status} lang={lang} />
        </div>
        <div style={{ fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.55 }}>{skill.plain[lang]}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--fg-soft)" }}>
          <span>v{skill.version}</span>
          <span>verified {skill.lastVerified}</span>
          {skill.disclaimer && <span>· disclaimer</span>}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-soft)", fontFamily: "var(--mono)" }}>#{skill.id}</div>
    </div>
  );
}

function StepGenerate({ t, lang, answers }) {
  const selected = answers.selected || {};
  const agents = answers.agents || ["claude"];
  const [activeAgent, setActiveAgent] = useState(agents[0] || "claude");
  const [dlState, setDlState] = useState("idle"); // idle | working | done
  const activeIds = Object.entries(selected).filter(([, v]) => v.on).map(([k]) => k);

  useEffect(() => {
    if (!agents.includes(activeAgent)) setActiveAgent(agents[0]);
  }, [agents]);

  const agentLabels = {
    claude: "Claude Code",
    cursor: "Cursor",
    codex: "Codex",
    generic: "AGENTS.md",
  };

  const filesByAgent = {
    claude: activeIds.flatMap(id => {
      const s = window.SKILLS.find(x => x.id === id);
      const base = `.claude/skills/${s.slug}/`;
      const files = [`${base}SKILL.md`];
      for (let i = 0; i < s.references; i++) files.push(`${base}references/ref-${i + 1}.md`);
      for (let i = 0; i < s.scripts; i++) files.push(`${base}scripts/helper-${i + 1}.sh`);
      return files;
    }),
    cursor: activeIds.map(id => `.cursor/rules/${window.SKILLS.find(s => s.id === id).slug}.mdc`),
    codex: ["AGENTS.md"],
    generic: ["AGENTS.md"],
  };

  const files = filesByAgent[activeAgent] || [];
  const totalFiles = agents.reduce((n, a) => n + (filesByAgent[a]?.length || 0), 0);

  const body = activeAgent === "claude" ? window.SAMPLE_CLAUDE_BODY : activeAgent === "cursor" ? window.SAMPLE_CURSOR_BODY : window.SAMPLE_CODEX_BODY;

  function download() {
    setDlState("working");
    setTimeout(() => setDlState("done"), 900);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>04 / 04</div>
        <h1 className="display-lg" style={{ marginBottom: 10 }}>{t.generate.title}</h1>
        <p className="lede">{t.generate.lede}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }} className="gen-grid">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.generate.zipLabel}</div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--fg)" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <Icon name="folder" size={13}/>
                <span className="tree-dir">my-project-skills-2026-04-19.zip</span>
              </div>
              <FileTree agents={agents} filesByAgent={filesByAgent} />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14, fontSize: 12.5, color: "var(--fg-muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                <strong style={{ color: "var(--fg)" }}>{totalFiles} {t.generate.fileCount}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span>{lang === "ar" ? "المهارات" : "Skills"}</span>
                <strong style={{ color: "var(--fg)" }}>{activeIds.length}</strong>
              </div>
            </div>
            <Button variant="primary" onClick={download} disabled={dlState === "working" || activeIds.length === 0} icon={dlState === "done" ? <Icon name="check" size={14}/> : <Icon name="download" size={14}/>} style={{ width: "100%", marginTop: 14, justifyContent: "center" }}>
              {dlState === "working" ? t.generate.downloading : dlState === "done" ? t.generate.downloaded : t.generate.downloadBtn}
            </Button>
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.generate.targetPreview}</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="big-tabs" style={{ padding: "0 18px" }}>
              {agents.map(a => (
                <button key={a} type="button" className={`big-tab ${activeAgent === a ? "active" : ""}`} onClick={() => setActiveAgent(a)}>
                  <div>{agentLabels[a]}</div>
                </button>
              ))}
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBottom: 10 }}>
                {t.generate.targetNotes[activeAgent]}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg-soft)" }}>
                <Icon name="file" size={12}/>
                <span>{files[0] || "—"}</span>
              </div>
              <pre className="code-block" style={{ maxHeight: 460, fontSize: 12.5 }}>{body}</pre>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .gen-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function FileTree({ agents, filesByAgent }) {
  return (
    <div>
      {agents.map((a, i) => {
        const files = filesByAgent[a] || [];
        const grouped = {};
        files.forEach(f => {
          const parts = f.split("/");
          const dir = parts.slice(0, -1).join("/") || ".";
          grouped[dir] = grouped[dir] || [];
          grouped[dir].push(parts[parts.length - 1]);
        });
        return (
          <div key={a} style={{ marginTop: i === 0 ? 0 : 8, paddingInlineStart: 14 }}>
            {Object.entries(grouped).map(([dir, fs]) => (
              <div key={dir}>
                <div style={{ color: "var(--primary)", fontSize: 11.5 }}>
                  <Icon name="folder" size={11}/> {dir}/
                </div>
                {fs.map(f => (
                  <div key={f} style={{ paddingInlineStart: 14, color: "var(--fg-muted)", fontSize: 11.5 }}>— {f}</div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { StepReview, StepGenerate });
