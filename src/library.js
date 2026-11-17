import { createState, fullName, isValidState } from "./state.js";

export const MAX_SEATINGS = 10;
export const NAME_MAX = 60;

const KEY = "seating:v2";
const LEGACY_KEY = "seating:v1";

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function defaultName(items) {
  let n = items.length + 1;
  const taken = new Set(items.map((i) => i.name));
  while (taken.has(`Рассадка ${n}`)) n++;
  return `Рассадка ${n}`;
}

function cleanName(name, items) {
  const s = String(name ?? "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  return s || defaultName(items);
}

const makeItem = (name, state = createState()) => ({
  id: newId(),
  name,
  updatedAt: Date.now(),
  state,
});

function isValidItem(i) {
  return (
    i &&
    typeof i.id === "string" &&
    typeof i.name === "string" &&
    isValidState(i.state)
  );
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadLibrary() {
  const data = readJson(KEY);
  if (data && Array.isArray(data.items)) {
    const items = data.items.filter(isValidItem).slice(0, MAX_SEATINGS);
    for (const i of items) if (typeof i.updatedAt !== "number") i.updatedAt = Date.now();
    if (items.length) {
      const activeId = items.some((i) => i.id === data.activeId)
        ? data.activeId
        : items[0].id;
      return { activeId, items };
    }
  }

  const legacy = readJson(LEGACY_KEY);
  const first = isValidState(legacy)
    ? makeItem("Моя рассадка", legacy)
    : makeItem("Рассадка 1");
  return { activeId: first.id, items: [first] };
}

export function saveLibrary(lib) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lib));
    localStorage.removeItem(LEGACY_KEY);
    return true;
  } catch {
    return false;
  }
}

export const getActive = (lib) => lib.items.find((i) => i.id === lib.activeId);
export const getItem = (lib, id) => lib.items.find((i) => i.id === id);

export function touch(lib) {
  const item = getActive(lib);
  if (item) item.updatedAt = Date.now();
}

function ensureRoom(lib) {
  if (lib.items.length >= MAX_SEATINGS)
    throw new Error(`Можно хранить не больше ${MAX_SEATINGS} рассадок`);
}

export function createSeating(lib, name, { copyStudentsFrom = null } = {}) {
  ensureRoom(lib);
  const state = createState();
  const students = copyStudentsFrom?.imported?.students;
  if (students?.length) {
    state.imported = { students: structuredClone(students) };
    state.freeStudents = students.map(fullName);
  }
  const item = makeItem(cleanName(name, lib.items), state);
  lib.items.push(item);
  lib.activeId = item.id;
  return item;
}

export function duplicateSeating(lib, id) {
  ensureRoom(lib);
  const src = getItem(lib, id);
  if (!src) return null;
  const name = cleanName(`${src.name} (копия)`, lib.items);
  const item = makeItem(name, structuredClone(src.state));
  lib.items.splice(lib.items.indexOf(src) + 1, 0, item);
  lib.activeId = item.id;
  return item;
}

export function renameSeating(lib, id, name) {
  const item = getItem(lib, id);
  if (!item) return;
  const others = lib.items.filter((i) => i !== item);
  item.name = cleanName(name, others);
  item.updatedAt = Date.now();
}

export function removeSeating(lib, id) {
  const idx = lib.items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  lib.items.splice(idx, 1);
  if (!lib.items.length) lib.items.push(makeItem("Рассадка 1"));
  if (lib.activeId === id)
    lib.activeId = lib.items[Math.min(idx, lib.items.length - 1)].id;
}

export function setActive(lib, id) {
  if (getItem(lib, id)) lib.activeId = id;
}
