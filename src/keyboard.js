const seatKey = (el) => `seat:${el.dataset.r}:${el.dataset.c}:${el.dataset.s}`;
const studentKey = (el) =>
  el.dataset.seat ? `found:${el.dataset.name}` : `student:${el.dataset.name}`;

const isTyping = (t) => t.closest("input, textarea, select, [contenteditable]");

export function initKeyboard(root, actions) {
  let lastSeat = null;
  let lastStudent = null;

  const seats = () => [...root.querySelectorAll(".seat")];
  const students = () => [...root.querySelectorAll(".students__list .student")];
  const seatAt = (r, c, s) =>
    root.querySelector(`.seat[data-r="${r}"][data-c="${c}"][data-s="${s}"]`);

  function find(key) {
    if (!key) return null;
    const [kind, ...rest] = key.split(":");
    if (kind === "seat") return seatAt(...rest);
    const name = rest.join(":");
    return (
      students().find((n) =>
        kind === "found" ? n.dataset.seat && n.dataset.name === name : !n.dataset.seat && n.dataset.name === name
      ) ?? null
    );
  }

  function focus(el) {
    if (!el) return;
    rove();
    for (const n of el.classList.contains("seat") ? seats() : students()) n.tabIndex = -1;
    el.tabIndex = 0;
    el.focus({ preventScroll: false });
    el.scrollIntoView({ block: "nearest" });
  }

  function rove() {
    const allSeats = seats();
    const s = find(lastSeat) ?? allSeats[0];
    allSeats.forEach((n) => (n.tabIndex = n === s ? 0 : -1));

    const list = students();
    const st = find(lastStudent) ?? list[0];
    list.forEach((n) => (n.tabIndex = n === st ? 0 : -1));
  }

  root.addEventListener("focusin", (e) => {
    const t = e.target;
    if (t.classList?.contains("seat")) lastSeat = seatKey(t);
    else if (t.classList?.contains("student")) lastStudent = studentKey(t);
  });

  function moveInGrid(seat, key) {
    const r = +seat.dataset.r;
    const c = +seat.dataset.c;
    const s = +seat.dataset.s;
    const rows = Math.max(...seats().map((n) => +n.dataset.r)) + 1;
    const cols = Math.max(...seats().map((n) => +n.dataset.c)) + 1;
    let i = c * 2 + s;
    let row = r;
    const last = cols * 2 - 1;
    if (key === "ArrowLeft") i = Math.max(0, i - 1);
    else if (key === "ArrowRight") i = Math.min(last, i + 1);
    else if (key === "ArrowUp") row = Math.max(0, r - 1);
    else if (key === "ArrowDown") row = Math.min(rows - 1, r + 1);
    else if (key === "Home") i = 0;
    else if (key === "End") i = last;
    else return false;
    focus(seatAt(row, Math.floor(i / 2), i % 2));
    return true;
  }

  function moveInList(item, key) {
    const list = students();
    const i = list.indexOf(item);
    let j = i;
    if (key === "ArrowUp") j = Math.max(0, i - 1);
    else if (key === "ArrowDown") j = Math.min(list.length - 1, i + 1);
    else if (key === "Home") j = 0;
    else if (key === "End") j = list.length - 1;
    else return false;
    focus(list[j]);
    return true;
  }

  root.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    const seat = e.target.closest(".seat");
    const item = e.target.closest(".students__list .student");
    if (!seat && !item) return;
    const key = e.key;

    if (seat) {
      if (moveInGrid(seat, key)) return e.preventDefault();
      if ((key === "Enter" || key === " ") && e.shiftKey) {
        e.preventDefault();
        seat.closest(".desk")?.querySelector(".desk__handle")?.click();
        return;
      }
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        seat.click();
        return;
      }
      if ((key === "Delete" || key === "Backspace") && seat.classList.contains("is-taken")) {
        e.preventDefault();
        actions.removeFromSeat([+seat.dataset.r, +seat.dataset.c, +seat.dataset.s]);
        return;
      }
      if ((key === "e" || key === "у" || key === "F2") && seat.classList.contains("is-taken")) {
        e.preventDefault();
        actions.edit(seat.textContent);
      }
      return;
    }

    if (moveInList(item, key)) return e.preventDefault();
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      item.click();
      if (item.dataset.seat) {
        focus(seatAt(...item.dataset.seat.split(",")));
      } else if (actions.isSelecting()) {
        const free = seats().filter((n) => !n.classList.contains("is-taken"));
        focus(free[free.length - 1] ?? seats()[0]);
      }
      return;
    }
    if (key === "e" || key === "у" || key === "F2") {
      e.preventDefault();
      actions.edit(item.dataset.name);
    }
  });

  return {
    capture() {
      const a = document.activeElement;
      if (!a || !root.contains(a)) return null;
      if (a.classList.contains("seat")) return seatKey(a);
      if (a.classList.contains("student")) return studentKey(a);
      return null;
    },
    restore(key) {
      rove();
      if (!key) return;
      let el = find(key);
      if (!el && key.startsWith("student:")) el = students()[0];
      if (el) focus(el);
    },
  };
}
