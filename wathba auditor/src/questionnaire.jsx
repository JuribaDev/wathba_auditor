function Questionnaire({ lang, answers, setAnswers, setRoute }) {
  const t = useT(lang);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const ksa = answers.market === "ksa" || answers.market === "gcc";

  const steps = [t.q.stepAbout, t.q.stepTech, t.q.stepReview, t.q.stepGenerate];

  function set(key, val) {
    setAnswers(a => ({ ...a, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  }

  function validateStep() {
    const e = {};
    if (step === 0) {
      if (!answers.market) e.market = true;
      if (ksa) {
        if (answers.invoicing == null) e.invoicing = true;
        if (answers.pii == null) e.pii = true;
        if (answers.payments == null) e.payments = true;
        if (answers.identity == null) e.identity = true;
      } else {
        if (answers.pii == null) e.pii = true;
      }
    } else if (step === 1) {
      if (!answers.stack) e.stack = true;
      if (!answers.agents || answers.agents.length === 0) e.agents = true;
      if (answers.ci == null) e.ci = true;
      if (!answers.secrets) e.secrets = true;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    if (step < 3) setStep(step + 1);
  }
  function prev() {
    if (step === 0) setRoute({ name: "home" });
    else setStep(step - 1);
  }

  return (
    <div className="container-narrow page-enter" style={{ paddingBlock: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <Stepper steps={steps} current={step} lang={lang} />
      </div>

      {step === 0 && <StepAbout t={t} lang={lang} answers={answers} set={set} errors={errors} ksa={ksa}/>}
      {step === 1 && <StepTech t={t} lang={lang} answers={answers} set={set} errors={errors}/>}
      {step === 2 && <StepReview t={t} lang={lang} answers={answers} setAnswers={setAnswers} />}
      {step === 3 && <StepGenerate t={t} lang={lang} answers={answers} />}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <Button variant="ghost" onClick={prev} icon={<Icon name="arrowBack" size={14}/>}>{t.prevStep}</Button>
        {step < 3 ? (
          <Button variant="primary" onClick={next} iconEnd={<Icon name="arrow" size={14}/>}>
            {step === 2 ? t.downloadCta : t.nextStep}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Question({ title, desc, why, error, children }) {
  return (
    <div className="question-block">
      <div>
        <div className="question-title">{title}</div>
        {desc && <div style={{ fontSize: 14, color: "var(--fg-muted)", marginTop: 4 }}>{desc}</div>}
      </div>
      {children}
      {why && <Disclosure summary={window.useT === window.useT ? "Why we ask" : "Why we ask"}>{why}</Disclosure>}
      {error && <div style={{ fontSize: 13, color: "var(--destructive)" }}>{window.__requiredMsg || "Required"}</div>}
    </div>
  );
}

function QuestionX({ lang, title, desc, why, error, children }) {
  const t = useT(lang);
  const required = lang === "ar" ? "مطلوب" : "Required";
  return (
    <div className="question-block">
      <div>
        <div className="question-title">{title}</div>
        {desc && <div style={{ fontSize: 14, color: "var(--fg-muted)", marginTop: 4 }}>{desc}</div>}
      </div>
      {children}
      {why && <Disclosure summary={t.detail.whyAsk}>{why}</Disclosure>}
      {error && <div style={{ fontSize: 13, color: "var(--destructive)" }}>{required}</div>}
    </div>
  );
}

function StepAbout({ t, lang, answers, set, errors, ksa }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>01 / 04</div>
        <h1 className="display-lg">{t.q.stepAbout}</h1>
      </div>

      <QuestionX lang={lang} title={t.q.market.title} desc={t.q.market.desc} why={t.q.market.why} error={errors.market}>
        <div className="radio-group">
          {t.q.market.options.map(o => (
            <RadioCard key={o.id} title={o.label} desc={o.desc} selected={answers.market === o.id} onClick={() => set("market", o.id)} />
          ))}
        </div>
      </QuestionX>

      {ksa && (
        <QuestionX lang={lang} title={t.q.invoicing.title} desc={t.q.invoicing.desc} why={t.q.invoicing.why} error={errors.invoicing}>
          <YesNoGroup value={answers.invoicing} onChange={v => set("invoicing", v)} yes={t.q.yes} no={t.q.no}/>
        </QuestionX>
      )}

      <QuestionX lang={lang} title={t.q.pii.title} desc={t.q.pii.desc} why={t.q.pii.why} error={errors.pii}>
        <YesNoGroup value={answers.pii} onChange={v => set("pii", v)} yes={t.q.yes} no={t.q.no}/>
      </QuestionX>

      {ksa && (
        <>
          <QuestionX lang={lang} title={t.q.payments.title} desc={t.q.payments.desc} why={t.q.payments.why} error={errors.payments}>
            <YesNoGroup value={answers.payments} onChange={v => set("payments", v)} yes={t.q.yes} no={t.q.no}/>
          </QuestionX>
          <QuestionX lang={lang} title={t.q.identity.title} desc={t.q.identity.desc} why={t.q.identity.why} error={errors.identity}>
            <YesNoGroup value={answers.identity} onChange={v => set("identity", v)} yes={t.q.yes} no={t.q.no}/>
          </QuestionX>
        </>
      )}
    </div>
  );
}

function StepTech({ t, lang, answers, set, errors }) {
  function toggleAgent(id) {
    const cur = answers.agents || [];
    set("agents", cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  }
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>02 / 04</div>
        <h1 className="display-lg">{t.q.stepTech}</h1>
      </div>

      <QuestionX lang={lang} title={t.q.stack.title} desc={t.q.stack.desc} error={errors.stack}>
        <div className="radio-group">
          {t.q.stack.options.map(o => (
            <RadioCard key={o.id} title={o.label} desc={o.desc} selected={answers.stack === o.id} onClick={() => set("stack", o.id)} />
          ))}
        </div>
      </QuestionX>

      <QuestionX lang={lang} title={t.q.agents.title} desc={t.q.agents.desc} error={errors.agents}>
        <div className="radio-group">
          {t.q.agents.options.map(o => (
            <CheckCard key={o.id} title={o.label} desc={o.desc} selected={(answers.agents || []).includes(o.id)} onClick={() => toggleAgent(o.id)} />
          ))}
        </div>
      </QuestionX>

      <QuestionX lang={lang} title={t.q.ci.title} desc={t.q.ci.desc} why={t.q.ci.why} error={errors.ci}>
        <YesNoGroup value={answers.ci} onChange={v => set("ci", v)} yes={t.q.yes} no={t.q.no}/>
      </QuestionX>

      <QuestionX lang={lang} title={t.q.secrets.title} desc={t.q.secrets.desc} error={errors.secrets}>
        <div className="radio-group">
          {t.q.secrets.options.map(o => (
            <RadioCard key={o.id} title={o.label} desc={o.desc} selected={answers.secrets === o.id} onClick={() => set("secrets", o.id)} />
          ))}
        </div>
      </QuestionX>
    </div>
  );
}

Object.assign(window, { Questionnaire });
