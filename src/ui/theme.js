const KEY = "theme";
const ORDER = ["auto", "light", "dark"];
const LABELS = { auto: "Тема: как в системе", light: "Тема: светлая", dark: "Тема: тёмная" };

function read() {
  try {
    const v = localStorage.getItem(KEY);
    return ORDER.includes(v) ? v : "auto";
  } catch {
    return "auto";
  }
}

function apply(mode, button) {
  const root = document.documentElement;
  if (mode === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  if (button) {
    button.dataset.mode = mode;
    button.title = LABELS[mode];
    button.setAttribute("aria-label", LABELS[mode]);
  }
}

export function initTheme(button) {
  let mode = read();
  apply(mode, button);
  button.addEventListener("click", () => {
    mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
    apply(mode, button);
  });
}
