import "./styles.css";
import { version } from "../package.json";
import * as S from "./state.js";
import { readStudentsFile } from "./importers.js";
import { exportPdf, fileBase } from "./exporters.js";
import * as L from "./library.js";
import { createHistory } from "./history.js";
import { initDnd } from "./dnd.js";
import { initTap } from "./tap.js";
import { initTheme } from "./ui/theme.js";
import { toast } from "./ui/toast.js";
import { confirmDialog, nameDialog, studentDialog } from "./ui/dialogs.js";
import { initKeyboard } from "./keyboard.js";
import { initSwitcher } from "./ui/switcher.js";

const $ = (id) => document.getElementById(id);

const lib = L.loadLibrary();
let state = L.getActive(lib).state;
let query = "";

const histories = new Map();
const history = () => {
  if (!histories.has(lib.activeId)) histories.set(lib.activeId, createHistory());
  return histories.get(lib.activeId);
};

const el = {
  grid: $("desk-grid"),
  rowLabels: $("row-labels"),
  list: $("students-list"),
  count: $("students-count"),
  search: $("students-search"),
  searchWrap: $("search-wrap"),
  empty: $("students-empty"),
  allSeated: $("students-all-seated"),
  rowsValue: $("rows-value"),
  colsValue: $("cols-value"),
  removeRow: $("remove-row"),
  removeCol: $("remove-column"),
  undo: $("undo-btn"),
  redo: $("redo-btn"),
};

function genderClass(gender) {
  if (gender === "male") return "is-male";
  if (gender === "female") return "is-female";
  return "";
}

let renderedId = lib.activeId;

function render() {
  if (renderedId !== lib.activeId) {
    renderedId = lib.activeId;
    tap.clear();
  }
  const focusKey = keyboard.capture();
  const genders = S.genderMap(state);
  renderGrid(genders);
  renderStudents(genders);
  renderControls();
  tap.apply();
  keyboard.restore(focusKey);
}

const searchQuery = () => query.trim().toLowerCase();
const matches = (name, q) => !!q && name.toLowerCase().includes(q);

const EDIT_ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

function editButton(name) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "student__edit";
  b.dataset.edit = name;
  b.dataset.nodrag = "";
  b.tabIndex = -1;
  b.title = "Изменить";
  b.setAttribute("aria-label", `Изменить: ${name}`);
  b.innerHTML = EDIT_ICON;
  return b;
}

function renderGrid(genders) {
  const { rows, cols, seats } = state;
  const q = searchQuery();
  $("app").classList.toggle("is-searching", !!q);
  el.grid.style.setProperty("--cols", cols);
  el.rowLabels.style.setProperty("--cols", cols);

  const frag = document.createDocumentFragment();
  seats.forEach((row, r) =>
    row.forEach((desk, c) => {
      const deskEl = document.createElement("div");
      deskEl.className = "desk";
      deskEl.dataset.drop = "desk";
      deskEl.dataset.r = r;
      deskEl.dataset.c = c;

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "desk__handle";
      handle.dataset.drag = "desk";
      handle.setAttribute("aria-label", `Парта: ${S.seatLabel(state, [r, c])}`);
      handle.title = "Перетащите или нажмите, чтобы переставить парту";
      handle.tabIndex = -1;
      handle.innerHTML =
        '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
      deskEl.appendChild(handle);

      const seatsEl = document.createElement("div");
      seatsEl.className = "desk__seats";
      desk.forEach((name, s) => {
        const seat = document.createElement("div");
        seat.className = "seat";
        seat.dataset.drop = "seat";
        seat.dataset.r = r;
        seat.dataset.c = c;
        seat.dataset.s = s;
        seat.tabIndex = -1;
        seat.setAttribute("role", "button");
        const where = `${S.seatLabel(state, [r, c])}, место ${s + 1}`;
        if (name) {
          seat.dataset.drag = "seat";
          seat.classList.add("is-taken");
          const g = genderClass(genders.get(name));
          if (g) seat.classList.add(g);
          if (matches(name, q)) seat.classList.add("is-match");
          seat.textContent = name;
          seat.title = name;
          seat.setAttribute("aria-label", `${name} — ${where}`);
        } else {
          seat.setAttribute("aria-label", `Свободно — ${where}`);
        }
        seatsEl.appendChild(seat);
      });
      deskEl.appendChild(seatsEl);
      frag.appendChild(deskEl);
    })
  );
  el.grid.replaceChildren(frag);

  el.rowLabels.replaceChildren(
    ...Array.from({ length: cols }, (_, i) => {
      const span = document.createElement("span");
      span.textContent = `Ряд ${cols - i}`;
      return span;
    })
  );
  el.rowsValue.textContent = rows;
  el.colsValue.textContent = cols;
}

function renderStudents(genders) {
  const free = state.freeStudents;
  const total = free.length + S.seatedCount(state);
  const hasAny = total > 0 || state.imported;

  el.count.textContent = total ? `${free.length} / ${total}` : "0";
  el.count.title = total ? `Без места: ${free.length} из ${total}` : "";

  const q = searchQuery();
  const showSearch = total >= 8 || !!q;

  el.empty.hidden = !!hasAny;
  el.searchWrap.hidden = !showSearch;
  el.allSeated.hidden = !(hasAny && total > 0 && free.length === 0) || !!q;

  const row = (name, extraClass = "") => {
    const item = document.createElement("div");
    item.className = "student" + extraClass;
    item.setAttribute("role", "button");
    item.tabIndex = -1;
    const g = genderClass(genders.get(name));
    if (g) item.classList.add(g);
    const dot = document.createElement("span");
    dot.className = "student__dot";
    const text = document.createElement("span");
    text.className = "student__name";
    text.textContent = name;
    item.append(dot, text);
    return item;
  };

  const frag = document.createDocumentFragment();
  let shown = 0;
  for (const name of free) {
    if (q && !matches(name, q)) continue;
    const item = row(name);
    item.dataset.drag = "student";
    item.dataset.name = name;
    item.appendChild(editButton(name));
    frag.appendChild(item);
    shown++;
  }

  if (q) {
    const seated = [];
    state.seats.forEach((r, ri) =>
      r.forEach((desk, ci) =>
        desk.forEach((name, si) => {
          if (name && matches(name, q)) seated.push([name, [ri, ci, si]]);
        })
      )
    );
    if (seated.length) {
      const h = document.createElement("div");
      h.className = "students__section";
      h.textContent = "На партах";
      frag.appendChild(h);
      for (const [name, pos] of seated) {
        const item = row(name, " student--found");
        item.dataset.name = name;
        item.dataset.seat = pos.join(",");
        const where = document.createElement("span");
        where.className = "student__where";
        where.textContent = S.seatLabel(state, pos);
        item.append(where, editButton(name));
        frag.appendChild(item);
        shown++;
      }
    }
    if (!shown) {
      const none = document.createElement("div");
      none.className = "students__none";
      none.textContent = "Никого не найдено";
      frag.appendChild(none);
    }
  }

  el.list.replaceChildren(frag);
  el.list.hidden = !hasAny || (!shown && !q);
}

function renderControls() {
  el.removeRow.disabled = state.rows <= 1;
  el.removeCol.disabled = state.cols <= 1;
  el.undo.disabled = !history().canUndo;
  el.redo.disabled = !history().canRedo;
  switcher.render(lib);
}

let warnedStorage = false;
function persist() {
  if (L.saveLibrary(lib)) {
    warnedStorage = false;
  } else if (!warnedStorage) {
    warnedStorage = true;
    toast("Браузер не дал сохранить изменения — освободите место или скачайте PDF", "error");
  }
}

function commit(fn) {
  tap.clear();
  const before = structuredClone(state);
  fn(state);
  if (JSON.stringify(before) === JSON.stringify(state)) return;
  history().record(before);
  L.touch(lib);
  render();
  persist();
}

function replaceState(next) {
  tap.clear();
  state = next;
  L.getActive(lib).state = next;
  L.touch(lib);
  render();
  persist();
}

function undo() {
  const prev = history().undo(state);
  if (prev) replaceState(prev);
}

function redo() {
  const next = history().redo(state);
  if (next) replaceState(next);
}

el.undo.addEventListener("click", undo);
el.redo.addEventListener("click", redo);

document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  if (document.querySelector("dialog[open]")) return;
  const t = e.target;
  if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))
    return;

  const key = e.key.toLowerCase();
  const isZ = key === "z" || e.code === "KeyZ";
  const isY = key === "y" || e.code === "KeyY";
  if (isZ && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if ((isZ && e.shiftKey) || (isY && !e.shiftKey)) {
    e.preventDefault();
    redo();
  }
});

function switchTo(id) {
  if (id === lib.activeId) return;
  tap.clear();
  L.setActive(lib, id);
  state = L.getActive(lib).state;
  query = "";
  el.search.value = "";
  render();
  persist();
}

function guard(fn) {
  try {
    fn();
  } catch (err) {
    toast(err.message, "error");
  }
}

const switcher = initSwitcher({
  onSelect: switchTo,

  async onCreate() {
    const hasStudents = !!state.imported?.students?.length;
    const res = await nameDialog({
      title: "Новая рассадка",
      okLabel: "Создать",
      withCopy: true,
      copyEnabled: hasStudents,
    });
    if (!res) return;
    guard(() => {
      const item = L.createSeating(lib, res.name, {
        copyStudentsFrom: res.copyStudents ? state : null,
      });
      state = item.state;
      query = "";
      el.search.value = "";
      render();
      persist();
      toast(`Создана «${item.name}»`, "success");
    });
  },

  async onRename(id) {
    const item = L.getItem(lib, id);
    const res = await nameDialog({ title: "Переименовать", okLabel: "Сохранить", value: item.name });
    if (!res) return;
    L.renameSeating(lib, id, res.name);
    render();
    persist();
  },

  onDuplicate(id) {
    guard(() => {
      const item = L.duplicateSeating(lib, id);
      state = item.state;
      render();
      persist();
      toast(`Создана «${item.name}»`, "success");
    });
  },

  async onDelete(id) {
    const item = L.getItem(lib, id);
    const ok = await confirmDialog({
      title: `Удалить «${item.name}»?`,
      text: "Рассадка и список учеников в ней будут удалены из браузера. Это нельзя отменить.",
      okLabel: "Удалить",
    });
    if (!ok) return;
    L.removeSeating(lib, id);
    histories.delete(id);
    state = L.getActive(lib).state;
    render();
    persist();
  },
});

const fileInput = $("students-file-input");

async function importFile(file) {
  try {
    const data = await readStudentsFile(file);
    commit((st) => S.loadStudents(st, data));
    toast(`Загружено учеников: ${data.students.length}`, "success");
  } catch (err) {
    console.error(err);
    toast(err.message || "Не удалось импортировать файл", "error");
  }
}

$("import-students-btn").addEventListener("click", () => fileInput.click());
$("pick-file-btn").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileInput.value = "";
  if (file) importFile(file);
});

const overlay = $("file-overlay");
let dragDepth = 0;
const hasFiles = (e) => e.dataTransfer?.types?.includes("Files");

window.addEventListener("dragenter", (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth++;
  overlay.hidden = false;
});
window.addEventListener("dragover", (e) => {
  if (hasFiles(e)) e.preventDefault();
});
window.addEventListener("dragleave", (e) => {
  if (!hasFiles(e)) return;
  if (--dragDepth <= 0) {
    dragDepth = 0;
    overlay.hidden = true;
  }
});
window.addEventListener("drop", (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  overlay.hidden = true;
  const file = e.dataTransfer.files[0];
  if (file) importFile(file);
});

$("random-seating-btn").addEventListener("click", () => {
  if (!state.freeStudents.length && !S.seatedCount(state)) {
    toast("Сначала загрузите список учеников");
    return;
  }
  commit(S.randomSeating);
});

$("clear-classroom").addEventListener("click", async () => {
  if (!S.seatedCount(state)) return;
  const ok = await confirmDialog({
    title: "Убрать всех с парт?",
    text: "Все ученики вернутся в список. Действие можно отменить.",
    okLabel: "Убрать",
  });
  if (ok) commit(S.clearClassroom);
});

$("add-row").addEventListener("click", () => commit(S.addRow));
el.removeRow.addEventListener("click", () => commit(S.removeRow));
$("add-column").addEventListener("click", () => commit(S.addColumn));
el.removeCol.addEventListener("click", () => commit(S.removeColumn));

el.search.addEventListener("input", () => {
  query = el.search.value;
  render();
});

async function addStudentDialog() {
  const res = await studentDialog({
    save: (data) => commit((st) => S.addStudent(st, data)),
  });
  if (res === "saved") toast("Ученик добавлен", "success");
}

async function editStudentDialog(name) {
  const student = S.findStudent(state, name) ?? { name, lastname: "", surname: "", gender: "" };
  const res = await studentDialog({
    student,
    save: (data) => commit((st) => S.updateStudent(st, name, data)),
    remove: () => commit((st) => S.removeStudent(st, name)),
  });
  if (res === "deleted")
    toast(`«${name}» удалён`, "info", { label: "Отменить", onClick: undo });
}

$("add-student-btn").addEventListener("click", addStudentDialog);
$("add-manually-btn").addEventListener("click", addStudentDialog);

el.list.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-edit]");
  if (btn) editStudentDialog(btn.dataset.edit);
});

let lastPointer = "mouse";
el.grid.addEventListener("pointerdown", (e) => (lastPointer = e.pointerType), true);
el.grid.addEventListener("dblclick", (e) => {
  if (lastPointer !== "mouse") return;
  const seat = e.target.closest(".seat.is-taken");
  if (seat) {
    tap.clear();
    editStudentDialog(seat.textContent);
  }
});

const keyboard = initKeyboard($("app"), {
  removeFromSeat: (pos) => commit((st) => S.seatToList(st, pos)),
  edit: editStudentDialog,
  isSelecting: () => tap.selection?.kind === "student",
});

const tap = initTap(
  $("app"),
  {
    listToSeat: (name, pos) => commit((st) => S.listToSeat(st, name, pos)),
    seatToSeat: (from, to) => commit((st) => S.seatToSeat(st, from, to)),
    seatToList: (pos) => commit((st) => S.seatToList(st, pos)),
    swapDesks: (from, to) => commit((st) => S.swapDesks(st, from, to)),
    deskToList: (pos) => commit((st) => S.deskToList(st, pos)),
  },
  {
    describe(sel) {
      if (sel.kind === "student") return `${sel.name} — нажмите на место`;
      if (sel.kind === "seat") {
        const [r, c, s] = sel.pos;
        return `${state.seats[r][c][s]} — нажмите на место или на список`;
      }
      return `Парта (${S.seatLabel(state, sel.pos)}) — нажмите на другую парту или на список`;
    },
  }
);

const pos = (node) => [+node.dataset.r, +node.dataset.c, +node.dataset.s];

initDnd($("app"), ({ kind, source, target }) => {
  const to = target.dataset.drop;

  if (kind === "student" && to === "seat") {
    commit((st) => S.listToSeat(st, source.dataset.name, pos(target)));
  } else if (kind === "seat" && to === "seat") {
    commit((st) => S.seatToSeat(st, pos(source), pos(target)));
  } else if (kind === "seat" && to === "list") {
    commit((st) => S.seatToList(st, pos(source)));
  } else if (kind === "desk") {
    const desk = source.closest(".desk");
    const from = [+desk.dataset.r, +desk.dataset.c];
    if (to === "desk") commit((st) => S.swapDesks(st, from, [+target.dataset.r, +target.dataset.c]));
    else if (to === "list") commit((st) => S.deskToList(st, from));
  }
});

const today = () =>
  new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function fillPrintTitle() {
  $("print-title-name").textContent = L.getActive(lib).name;
  $("print-title-date").textContent = today();
}
window.addEventListener("beforeprint", () => {
  tap.clear();
  fillPrintTitle();
});
$("print-btn").addEventListener("click", () => {
  if (!state.freeStudents.length && !S.seatedCount(state)) {
    toast("Сначала загрузите или добавьте учеников");
    return;
  }
  fillPrintTitle();
  window.print();
});

$("export-pdf-btn").addEventListener("click", async () => {
  try {
    const name = L.getActive(lib).name;
    await exportPdf(state, fileBase(name), { title: name, date: today() });
  } catch (err) {
    console.error(err);
    toast("Не удалось создать PDF", "error");
  }
});

$("format-help-btn").addEventListener("click", () => $("format-dialog").showModal());
$("footer-format-btn").addEventListener("click", () => $("format-dialog").showModal());
$("footer-year").textContent = new Date().getFullYear();
$("footer-version").textContent = version;
initTheme($("theme-toggle"));

render();
