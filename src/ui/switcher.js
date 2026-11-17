import { MAX_SEATINGS } from "../library.js";
import { initMenu } from "./menu.js";

const $ = (id) => document.getElementById(id);

const ICONS = {
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  rename: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
};

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return `сегодня, ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  return dateFmt.format(d);
}

export function initSwitcher(handlers) {
  const nameEl = $("switcher-name");
  const items = $("switcher-items");
  const count = $("switcher-count");
  const newBtn = $("new-seating-btn");
  const limit = $("switcher-limit");
  let lib = null;

  const menu = initMenu($("switcher-btn"), $("switcher-menu"), {
    onOpen: () => renderItems(),
  });

  const run = (fn) => {
    menu.close();
    fn();
  };

  newBtn.addEventListener("click", () => run(handlers.onCreate));

  items.addEventListener("click", (e) => {
    const row = e.target.closest("[data-id]");
    if (!row) return;
    const id = row.dataset.id;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "rename") run(() => handlers.onRename(id));
    else if (action === "duplicate") run(() => handlers.onDuplicate(id));
    else if (action === "delete") run(() => handlers.onDelete(id));
    else run(() => handlers.onSelect(id));
  });

  function renderItems() {
    if (!lib) return;
    const full = lib.items.length >= MAX_SEATINGS;
    const frag = document.createDocumentFragment();

    for (const item of lib.items) {
      const active = item.id === lib.activeId;
      const row = document.createElement("div");
      row.className = "switcher__item" + (active ? " is-active" : "");
      row.dataset.id = item.id;

      const main = document.createElement("button");
      main.type = "button";
      main.className = "switcher__main";
      main.setAttribute("role", "menuitemradio");
      main.setAttribute("aria-checked", String(active));
      main.innerHTML = `<span class="switcher__check">${active ? ICONS.check : ""}</span>`;
      const text = document.createElement("span");
      text.className = "switcher__text";
      const title = document.createElement("span");
      title.className = "switcher__title";
      title.textContent = item.name;
      const meta = document.createElement("small");
      meta.textContent = formatDate(item.updatedAt);
      text.append(title, meta);
      main.appendChild(text);
      row.appendChild(main);

      const actions = document.createElement("div");
      actions.className = "switcher__actions";
      for (const [action, icon, label, disabled] of [
        ["rename", ICONS.rename, "Переименовать", false],
        ["duplicate", ICONS.copy, "Дублировать", full],
        ["delete", ICONS.trash, "Удалить", false],
      ]) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "icon-btn icon-btn--sm" + (action === "delete" ? " icon-btn--danger" : "");
        b.dataset.action = action;
        b.title = label;
        b.setAttribute("aria-label", `${label}: ${item.name}`);
        b.disabled = disabled;
        b.innerHTML = icon;
        actions.appendChild(b);
      }
      row.appendChild(actions);
      frag.appendChild(row);
    }

    items.replaceChildren(frag);
    items.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
    count.textContent = `${lib.items.length} из ${MAX_SEATINGS}`;
    newBtn.disabled = full;
    limit.hidden = !full;
  }

  return {
    render(next) {
      lib = next;
      const active = lib.items.find((i) => i.id === lib.activeId);
      nameEl.textContent = active?.name ?? "";
      $("switcher-btn").title = active?.name ?? "";
      if (menu.isOpen()) renderItems();
    },
  };
}
