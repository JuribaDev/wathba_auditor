// Shared UI primitives
const { useState, useEffect, useMemo, useRef, useCallback } = React;

function useT(lang) {
  return window.STRINGS[lang];
}

function Button({ variant = "primary", size = "md", icon, iconEnd, children, ...rest }) {
  const cls = `btn btn-${variant}${size === "lg" ? " btn-lg" : size === "sm" ? " btn-sm" : ""}`;
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </button>
  );
}

function Badge({ variant = "muted", dot, children }) {
  return <span className={`badge badge-${variant}${dot ? " badge-dot" : ""}`}>{children}</span>;
}

function StatusBadge({ status, lang }) {
  const t = useT(lang);
  const m = {
    draft: { variant: "warning", label: t.status.draft },
    community: { variant: "muted", label: t.status.community },
    reviewed: { variant: "success", label: t.status.reviewed },
  }[status];
  return <Badge variant={m.variant} dot>{m.label}</Badge>;
}

function Toggle({ on, onChange, label, id }) {
  return (
    <button id={id} className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label}>
      <div className="toggle-thumb"/>
    </button>
  );
}

function RadioCard({ selected, onClick, title, desc }) {
  return (
    <button type="button" className={`radio-card ${selected ? "selected" : ""}`} onClick={onClick} role="radio" aria-checked={selected}>
      <div className="radio-card-dot" />
      <div className="radio-card-body">
        <div className="radio-card-title">{title}</div>
        {desc && <div className="radio-card-desc">{desc}</div>}
      </div>
    </button>
  );
}

function CheckCard({ selected, onClick, title, desc }) {
  return (
    <button type="button" className={`check-card ${selected ? "selected" : ""}`} onClick={onClick} role="checkbox" aria-checked={selected}>
      <div className="check-box"><Icon name="check" size={12}/></div>
      <div className="radio-card-body">
        <div className="radio-card-title">{title}</div>
        {desc && <div className="radio-card-desc">{desc}</div>}
      </div>
    </button>
  );
}

function Disclosure({ summary, children }) {
  return (
    <details className="disclosure">
      <summary>
        <span className="disclosure-caret"><Icon name="chevron" size={12}/></span>
        {summary}
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

function Notice({ children, variant = "warning", icon }) {
  return (
    <div className={`notice ${variant === "info" ? "notice-info" : ""}`}>
      <div className="notice-icon"><Icon name={icon || (variant === "info" ? "info" : "warn")} size={18}/></div>
      <div>{children}</div>
    </div>
  );
}

function YesNoGroup({ value, onChange, yes, no }) {
  return (
    <div className="radio-group" style={{ gridTemplateColumns: "1fr 1fr", gridAutoFlow: "column", display: "grid" }}>
      <RadioCard selected={value === true} onClick={() => onChange(true)} title={yes} />
      <RadioCard selected={value === false} onClick={() => onChange(false)} title={no} />
    </div>
  );
}

function Stepper({ steps, current, lang }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`step-pill ${i === current ? "active" : i < current ? "done" : ""}`}>
            <div className="step-num">{i < current ? <Icon name="check" size={12} /> : i + 1}</div>
            <span>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="step-connector" />}
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, { Button, Badge, StatusBadge, Toggle, RadioCard, CheckCard, Disclosure, Notice, YesNoGroup, Stepper, useT });
