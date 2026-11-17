const seatPos = (el) => [+el.dataset.r, +el.dataset.c, +el.dataset.s];
const deskPos = (el) => [+el.dataset.r, +el.dataset.c];
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function initTap(root, actions, { describe }) {
  let selection = null;
  const hint = document.getElementById("selection-hint");
  const hintText = document.getElementById("selection-hint-text");

  function set(next) {
    selection = next;
    apply();
  }

  function apply() {
    root.querySelectorAll(".is-selected").forEach((n) => n.classList.remove("is-selected"));
    root.classList.toggle("has-selection", !!selection);
    root.dataset.selection = selection?.kind ?? "";

    let node = null;
    if (selection?.kind === "student") {
      node = [...root.querySelectorAll(".student:not(.student--found)")].find(
        (n) => n.dataset.name === selection.name
      );
    } else if (selection?.kind === "seat") {
      const [r, c, s] = selection.pos;
      node = root.querySelector(`.seat[data-r="${r}"][data-c="${c}"][data-s="${s}"]`);
      if (node && !node.classList.contains("is-taken")) node = null;
    } else if (selection?.kind === "desk") {
      const [r, c] = selection.pos;
      node = root.querySelector(`.desk[data-r="${r}"][data-c="${c}"]`);
    }

    if (selection && !node && selection.kind !== "student") selection = null;
    node?.classList.add("is-selected");

    hint.hidden = !selection;
    if (selection) hintText.textContent = describe(selection);
  }

  function onClick(e) {
    const t = e.target;
    const handle = t.closest(".desk__handle");
    if (!handle && t.closest("button, input, label, a")) return;

    let seat = t.closest(".seat");
    let desk = t.closest(".desk");
    let student = t.closest(".student");

    if (student?.dataset.seat) {
      const [r, c, s] = student.dataset.seat.split(",");
      seat = root.querySelector(`.seat[data-r="${r}"][data-c="${c}"][data-s="${s}"]`);
      desk = seat?.closest(".desk") ?? null;
      student = null;
      seat?.scrollIntoView({ block: "center", behavior: "smooth" });
      if (!seat) return;
    }
    const list = t.closest('[data-drop="list"]');
    const sel = selection;

    if (handle) {
      const pos = deskPos(desk);
      if (sel?.kind === "desk") {
        if (same(sel.pos, pos)) return set(null);
        return actions.swapDesks(sel.pos, pos);
      }
      return set({ kind: "desk", pos });
    }

    if (seat) {
      const pos = seatPos(seat);
      const taken = seat.classList.contains("is-taken");
      if (sel?.kind === "student") return actions.listToSeat(sel.name, pos);
      if (sel?.kind === "seat") {
        if (same(sel.pos, pos)) return set(null);
        return actions.seatToSeat(sel.pos, pos);
      }
      if (sel?.kind === "desk") {
        const target = deskPos(desk);
        if (same(sel.pos, target)) return set(null);
        return actions.swapDesks(sel.pos, target);
      }
      return set(taken ? { kind: "seat", pos } : null);
    }

    if (desk) {
      const pos = deskPos(desk);
      if (sel?.kind === "desk" && !same(sel.pos, pos)) return actions.swapDesks(sel.pos, pos);
      return set(null);
    }

    if (student) {
      const name = student.dataset.name;
      if (sel?.kind === "seat") return actions.listToSeat(name, sel.pos);
      if (sel?.kind === "student" && sel.name === name) return set(null);
      return set({ kind: "student", name });
    }

    if (list) {
      if (sel?.kind === "seat") return actions.seatToList(sel.pos);
      if (sel?.kind === "desk") return actions.deskToList(sel.pos);
      return set(null);
    }

    set(null);
  }

  root.addEventListener("click", onClick);

  document.addEventListener("click", (e) => {
    if (!selection) return;
    if (root.contains(e.target) || hint.contains(e.target)) return;
    if (e.target.closest("dialog")) return;
    set(null);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && selection && !document.querySelector("dialog[open]")) set(null);
  });
  document.getElementById("selection-cancel").addEventListener("click", () => set(null));

  return {
    apply,
    clear: () => set(null),
    get selection() {
      return selection;
    },
  };
}
