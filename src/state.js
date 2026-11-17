export const DEFAULT_ROWS = 5;
export const DEFAULT_COLS = 3;

export const fullName = (s) =>
  [s.name, s.lastname, s.surname].filter(Boolean).join(" ");

const emptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [null, null])
  );

export function createState() {
  return {
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    seats: emptyGrid(DEFAULT_ROWS, DEFAULT_COLS),
    freeStudents: [],
    imported: null,
  };
}

export function genderMap(state) {
  const map = new Map();
  for (const s of state.imported?.students ?? []) map.set(fullName(s), s.gender);
  return map;
}

export function seatedCount(state) {
  let n = 0;
  for (const row of state.seats)
    for (const desk of row) for (const s of desk) if (s) n++;
  return n;
}

export function loadStudents(state, data) {
  state.imported = data;
  state.freeStudents = data.students.map(fullName);
  state.seats.forEach((row, r) =>
    row.forEach((desk, c) => (state.seats[r][c] = [null, null]))
  );
}

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

function normalizeStudent(s) {
  const gender = s.gender === "male" || s.gender === "female" ? s.gender : "";
  return {
    lastname: clean(s.lastname),
    name: clean(s.name),
    surname: clean(s.surname),
    gender,
  };
}

function allNames(state) {
  const names = new Set(state.freeStudents);
  for (const row of state.seats) for (const desk of row) for (const s of desk) if (s) names.add(s);
  for (const s of state.imported?.students ?? []) names.add(fullName(s));
  return names;
}

export function findStudent(state, name) {
  return state.imported?.students?.find((s) => fullName(s) === name) ?? null;
}

export function addStudent(state, data) {
  const student = normalizeStudent(data);
  const name = fullName(student);
  if (!name) throw new Error("Введите фамилию или имя");
  if (allNames(state).has(name)) throw new Error(`«${name}» уже есть в списке`);
  if (!state.imported) state.imported = { students: [] };
  state.imported.students.push(student);
  state.freeStudents.push(name);
}

export function updateStudent(state, oldName, data) {
  const student = normalizeStudent(data);
  const name = fullName(student);
  if (!name) throw new Error("Введите фамилию или имя");
  if (name !== oldName && allNames(state).has(name))
    throw new Error(`«${name}» уже есть в списке`);

  if (!state.imported) state.imported = { students: [] };
  const obj = findStudent(state, oldName);
  if (obj) Object.assign(obj, student);
  else state.imported.students.push(student);

  if (name === oldName) return;
  state.freeStudents = state.freeStudents.map((n) => (n === oldName ? name : n));
  for (const row of state.seats)
    for (const desk of row)
      for (let i = 0; i < desk.length; i++) if (desk[i] === oldName) desk[i] = name;
}

export function removeStudent(state, name) {
  state.freeStudents = state.freeStudents.filter((n) => n !== name);
  for (const row of state.seats)
    for (const desk of row)
      for (let i = 0; i < desk.length; i++) if (desk[i] === name) desk[i] = null;
  if (state.imported?.students)
    state.imported.students = state.imported.students.filter((s) => fullName(s) !== name);
}

export function findSeat(state, name) {
  for (let r = 0; r < state.rows; r++)
    for (let c = 0; c < state.cols; c++)
      for (let s = 0; s < 2; s++) if (state.seats[r][c][s] === name) return [r, c, s];
  return null;
}

export function seatLabel(state, [r, c]) {
  return `ряд ${state.cols - c}, парта ${state.rows - r}`;
}

export function randomSeating(state) {
  const { rows, cols } = state;
  const all = [];
  state.seats.forEach((row) =>
    row.forEach((desk) => desk.forEach((s) => s && all.push(s)))
  );
  all.push(...state.freeStudents);

  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  state.seats = emptyGrid(rows, cols);
  state.freeStudents = [];

  let index = 0;
  for (let r = rows - 1; r >= 0; r--)
    for (let c = cols - 1; c >= 0; c--)
      for (let s = 0; s < 2; s++)
        if (index < all.length) state.seats[r][c][s] = all[index++];

  if (index < all.length) state.freeStudents = all.slice(index);
}

export function clearClassroom(state) {
  state.seats.forEach((row) =>
    row.forEach((desk) =>
      desk.forEach((s) => s && state.freeStudents.push(s))
    )
  );
  state.seats = emptyGrid(state.rows, state.cols);
}

export function addRow(state) {
  state.rows++;
  state.seats.unshift(Array.from({ length: state.cols }, () => [null, null]));
}

export function removeRow(state) {
  if (state.rows <= 1) return;
  const removed = state.seats.shift();
  removed.forEach((desk) =>
    desk.forEach((s) => s && state.freeStudents.push(s))
  );
  state.rows--;
}

export function addColumn(state) {
  state.cols++;
  state.seats.forEach((row) => row.unshift([null, null]));
}

export function removeColumn(state) {
  if (state.cols <= 1) return;
  state.seats.forEach((row) => {
    const removed = row.shift();
    removed.forEach((s) => s && state.freeStudents.push(s));
  });
  state.cols--;
}

export function listToSeat(state, name, [r, c, s]) {
  const target = state.seats[r][c][s];
  state.seats[r][c][s] = name;
  if (target) state.freeStudents.push(target);
  state.freeStudents = state.freeStudents.filter((n) => n !== name);
}

export function seatToSeat(state, [fr, fc, fs], [r, c, s]) {
  if (fr === r && fc === c && fs === s) return;
  const name = state.seats[fr][fc][fs];
  if (!name) return;
  const target = state.seats[r][c][s];
  state.seats[r][c][s] = name;
  state.seats[fr][fc][fs] = target || null;
}

export function seatToList(state, [r, c, s]) {
  const name = state.seats[r][c][s];
  if (!name) return;
  state.seats[r][c][s] = null;
  state.freeStudents.push(name);
}

export function swapDesks(state, [r1, c1], [r2, c2]) {
  const tmp = state.seats[r1][c1];
  state.seats[r1][c1] = state.seats[r2][c2];
  state.seats[r2][c2] = tmp;
}

export function deskToList(state, [r, c]) {
  const desk = state.seats[r][c];
  for (let i = 0; i < desk.length; i++) {
    if (desk[i]) state.freeStudents.push(desk[i]);
    desk[i] = null;
  }
}

const isName = (v) => v === null || typeof v === "string";

export function isValidState(s) {
  if (!s || typeof s !== "object") return false;
  if (!Number.isInteger(s.rows) || !Number.isInteger(s.cols)) return false;
  if (s.rows < 1 || s.cols < 1) return false;
  if (!Array.isArray(s.seats) || s.seats.length !== s.rows) return false;
  for (const row of s.seats) {
    if (!Array.isArray(row) || row.length !== s.cols) return false;
    for (const desk of row)
      if (!Array.isArray(desk) || desk.length !== 2 || !desk.every(isName))
        return false;
  }
  if (!Array.isArray(s.freeStudents) || !s.freeStudents.every((n) => typeof n === "string"))
    return false;
  if (s.imported !== null && !Array.isArray(s.imported?.students)) return false;
  return true;
}
