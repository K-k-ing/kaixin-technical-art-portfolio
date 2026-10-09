(() => {
  // A saved-case viewer only: these controls never run the WORLDIR compiler.
  document.querySelectorAll('[data-floor-viewer]').forEach((viewer) => {
    const controls = viewer.querySelector('[data-view-controls]');
    const buttons = [...viewer.querySelectorAll('[data-floor-select]')];
    const panels = [...viewer.querySelectorAll('[data-floor-panel]')];
    if (!controls || buttons.length !== 2 || panels.length !== 2) return;
    const select = (name) => {
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.floorSelect === name)));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.floorPanel !== name;
        if (!panel.hidden) requestAnimationFrame(() => {
          // Retain readable native station labels on phones; users can pan the real image.
          const pan = panel.querySelector('[data-floor-pan]') || panel;
          pan.scrollLeft = Math.max(0, pan.scrollWidth - pan.clientWidth) * 2 / 3;
        });
      });
    };
    buttons.forEach((button) => button.addEventListener('click', () => select(button.dataset.floorSelect)));
    controls.hidden = false;
    select('reconstruction');
  });

  const revealAnchor = () => {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    for (let node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
    // Reposition after opening a collapsed evidence section for legacy anchors.
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  window.addEventListener('hashchange', revealAnchor);
  if (window.location.hash) revealAnchor();
  document.querySelectorAll('[data-worldir-language]').forEach((link) => {
    link.addEventListener('click', () => {
      const destination = new URL(link.href, window.location.href);
      destination.hash = window.location.hash;
      link.href = destination.href;
    });
  });
})();
