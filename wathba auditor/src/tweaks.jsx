function Tweaks({ lang, setLang, theme, setTheme, primary, setPrimary, onEdit }) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setActive(true);
      if (d.type === "__deactivate_edit_mode") setActive(false);
    }
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  if (!active) return null;

  const swatches = [
    { id: "default", color: "#8F4B24" },
    { id: "ink", color: "#2E4A6B" },
    { id: "olive", color: "#5C6A36" },
    { id: "slate", color: "#3A3A3A" },
  ];

  return (
    <div className={`tweaks ${open ? "" : "collapsed"}`} dir="ltr">
      <button className="tweaks-header" onClick={() => setOpen(v => !v)} style={{ width: "100%", border: 0, background: "var(--surface-variant)", cursor: "pointer", textAlign: "left" }}>
        <Icon name="sliders" size={14}/>
        <span style={{ flex: 1 }}>Tweaks</span>
        <Icon name={open ? "down" : "chevron"} size={12}/>
      </button>
      {open && (
        <div className="tweaks-body">
          <div className="tweaks-row">
            <span className="tweaks-row-label">Language</span>
            <div className="lang-toggle">
              <button className={lang === "en" ? "active" : ""} onClick={() => { setLang("en"); onEdit({ language: "en" }); }}>EN</button>
              <button className={lang === "ar" ? "active" : ""} onClick={() => { setLang("ar"); onEdit({ language: "ar" }); }}>العربية</button>
            </div>
          </div>
          <div className="tweaks-row">
            <span className="tweaks-row-label">Theme</span>
            <div className="theme-toggle">
              <button className={theme === "light" ? "active" : ""} onClick={() => { setTheme("light"); onEdit({ theme: "light" }); }}><Icon name="sun" size={12}/></button>
              <button className={theme === "dark" ? "active" : ""} onClick={() => { setTheme("dark"); onEdit({ theme: "dark" }); }}><Icon name="moon" size={12}/></button>
            </div>
          </div>
          <div className="tweaks-row">
            <span className="tweaks-row-label">Primary</span>
            <div className="swatch-row">
              {swatches.map(s => (
                <button key={s.id} className={`swatch ${primary === s.id ? "active" : ""}`} style={{ background: s.color }} onClick={() => { setPrimary(s.id); onEdit({ primary: s.id }); }} aria-label={s.id}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.Tweaks = Tweaks;
