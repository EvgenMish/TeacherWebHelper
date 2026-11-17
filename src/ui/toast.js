let container;

export function toast(message, type = "info", action = null) {
  if (!container) {
    container = document.createElement("div");
    container.className = "toasts";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  const text = document.createElement("span");
  text.textContent = message;
  el.appendChild(text);

  const hide = () => {
    el.classList.remove("is-visible");
    setTimeout(() => el.remove(), 300);
  };

  if (action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast__action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      action.onClick();
      hide();
    });
    el.appendChild(btn);
  }

  container.appendChild(el);
  while (container.children.length > 3) container.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add("is-visible"));
  setTimeout(hide, action ? 7000 : type === "error" ? 4500 : 2800);
}
