const menus = new Set();

document.addEventListener("click", (e) => {
  for (const m of menus) if (m.isOpen() && !m.root.contains(e.target)) m.close();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  for (const m of menus)
    if (m.isOpen()) {
      m.close();
      m.button.focus();
    }
});

export function initMenu(button, list, { onOpen } = {}) {
  const m = {
    root: button.parentElement,
    button,
    isOpen: () => !list.hidden,
    open() {
      for (const other of menus) if (other !== m) other.close();
      onOpen?.();
      list.hidden = false;
      button.setAttribute("aria-expanded", "true");
      list.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    },
    close() {
      list.hidden = true;
      button.setAttribute("aria-expanded", "false");
    },
  };
  button.addEventListener("click", () => (m.isOpen() ? m.close() : m.open()));
  menus.add(m);
  return m;
}
