// Icon components — minimal inline SVGs
function Icon({ name, size = 16, stroke = 1.6 }) {
  const s = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    arrow: <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
    arrowBack: <svg viewBox="0 0 24 24" {...s}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>,
    check: <svg viewBox="0 0 24 24" {...s}><path d="M5 12l5 5L20 7"/></svg>,
    x: <svg viewBox="0 0 24 24" {...s}><path d="M6 6l12 12M18 6L6 18"/></svg>,
    plus: <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14"/></svg>,
    chevron: <svg viewBox="0 0 24 24" {...s}><path d="M9 6l6 6-6 6"/></svg>,
    down: <svg viewBox="0 0 24 24" {...s}><path d="M6 9l6 6 6-6"/></svg>,
    download: <svg viewBox="0 0 24 24" {...s}><path d="M12 3v12M6 11l6 6 6-6M5 21h14"/></svg>,
    shield: <svg viewBox="0 0 24 24" {...s}><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z"/></svg>,
    book: <svg viewBox="0 0 24 24" {...s}><path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14H6a2 2 0 00-2 2V5z"/><path d="M4 19a2 2 0 012-2h14"/></svg>,
    bolt: <svg viewBox="0 0 24 24" {...s}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>,
    gear: <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1A2 2 0 117 4.6l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>,
    file: <svg viewBox="0 0 24 24" {...s}><path d="M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-6-6z"/><path d="M13 3v6h6"/></svg>,
    folder: <svg viewBox="0 0 24 24" {...s}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
    info: <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>,
    warn: <svg viewBox="0 0 24 24" {...s}><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v5M12 17h.01"/></svg>,
    sparkle: <svg viewBox="0 0 24 24" {...s}><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3zM19 15l.8 2 2 .6-2 .6-.8 2-.8-2-2-.6 2-.6.8-2zM5 15l.6 1.5 1.5.4-1.5.4L5 18.8l-.6-1.5-1.5-.4 1.5-.4L5 15z"/></svg>,
    clock: <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    code: <svg viewBox="0 0 24 24" {...s}><path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/></svg>,
    link: <svg viewBox="0 0 24 24" {...s}><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>,
    sliders: <svg viewBox="0 0 24 24" {...s}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>,
    sun: <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>,
    moon: <svg viewBox="0 0 24 24" {...s}><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></svg>,
    globe: <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>,
    external: <svg viewBox="0 0 24 24" {...s}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>,
    github: <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width:size,height:size}}><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 011.2-3.2c-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.5 4.9 18.5 5.2 18.5 5.2c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3"/></svg>,
  };
  return icons[name] || null;
}

window.Icon = Icon;
