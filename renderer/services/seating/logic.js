import { base64TNR } from "./base64_timesnrcyrmt.js";

let rows = 5;
let cols = 3;
let lastImportedJson = null;

/*
  seats[row][col] = [seat1, seat2]
*/
let seats = [];

// ученики, которые НЕ сидят
let freeStudents = [];

const grid = document.getElementById("desk-grid");
const studentList = document.getElementById("students-list");
const studentsPanel = document.querySelector(".students-panel");

const importBtn = document.getElementById("import-students-btn");
const fileInput = document.getElementById("students-file-input");
const importSeatingBtn = document.getElementById("import-seating-btn");
const clearBtn = document.getElementById("clear-classroom");
const randomSeatingBtn = document.getElementById("random-seating-btn");

const addRow = document.getElementById("add-row");
const removeRow = document.getElementById("remove-row");
const addColumn = document.getElementById("add-column");
const removeColumn = document.getElementById("remove-column");

const exportJSON = document.getElementById("export-json-btn");
const exportPDF = document.getElementById("export-pdf-btn");

importBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);

      if (!Array.isArray(json.students)) {
        throw new Error("Некорректный формат файла");
      }

      lastImportedJson = json; // ← ВАЖНО

      const newStudents = json.students.map((s) =>
        [s.name, s.lastname, s.surname].filter(Boolean).join(" ")
      );

      // очищаем рассадку
      for (let r = 0; r < seats.length; r++) {
        for (let c = 0; c < seats[r].length; c++) {
          seats[r][c] = [null, null];
        }
      }

      freeStudents = [...newStudents];

      render();
    } catch (err) {
      console.error("Ошибка импорта:", err);
      alert("Ошибка при импорте JSON-файла");
    }
  };

  reader.readAsText(file, "UTF-8");

  // Позволяет выбрать тот же файл повторно
  fileInput.value = "";
});

importSeatingBtn.addEventListener("click", () => {
  if (!lastImportedJson?.seating) {
    alert("Сначала импортируйте JSON");
    return;
  }

  const seating = lastImportedJson.seating;

  if (!Array.isArray(seating.seats)) {
    alert("Некорректные данные рассадки");
    return;
  }

  // 1️⃣ Обновляем размеры
  rows = seating.rows;
  cols = seating.cols;

  // 2️⃣ Создаем пустую сетку нужного размера
  seats = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [null, null])
  );

  // 3️⃣ Копируем рассадку из JSON
  seats = seating.seats.map((row) => row.map((pair) => [...pair]));

  // 4️⃣ Убираем рассаженных учеников из freeStudents
  const seatedStudents = new Set();
  for (const row of seats) {
    for (const [a, b] of row) {
      if (a) seatedStudents.add(a);
      if (b) seatedStudents.add(b);
    }
  }

  // Если freeStudents пуст (например после importBtn), используем всех учеников
  if (!freeStudents.length && lastImportedJson.students) {
    freeStudents = lastImportedJson.students.map((s) =>
      [s.name, s.lastname, s.surname].filter(Boolean).join(" ")
    );
  }

  freeStudents = freeStudents.filter((name) => !seatedStudents.has(name));

  render();
});

clearBtn.addEventListener("click", clearClassroom);

randomSeatingBtn.addEventListener("click", randomSeating);

// Рандомная рассадка
function randomSeating() {
  // 1 Собираем всех учеников
  let allStudents = [];

  seats.forEach((row) =>
    row.forEach((desk) =>
      desk.forEach((student) => {
        if (student) allStudents.push(student);
      })
    )
  );

  allStudents.push(...freeStudents);

  // 2 Перемешиваем
  for (let i = allStudents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allStudents[i], allStudents[j]] = [allStudents[j], allStudents[i]];
  }

  // 3 Очищаем рассадку
  seats = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [null, null])
  );
  freeStudents = [];

  // 4 Заполняем СНИЗУ и СПРАВА
  let index = 0;

  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      for (let s = 0; s < 2; s++) {
        if (index < allStudents.length) {
          seats[r][c][s] = allStudents[index++];
        }
      }
    }
  }

  // 5 Остаток — в список
  if (index < allStudents.length) {
    freeStudents = allStudents.slice(index);
  }

  render();
}

// Очистка всей рассадки
function clearClassroom() {
  // Перемещаем всех рассаженных учеников в freeStudents
  seats.forEach((row) => {
    row.forEach((desk) => {
      desk.forEach((student) => {
        if (student) freeStudents.push(student);
      });
    });
  });

  // Создаём пустую рассадку
  seats = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [null, null])
  );

  render();
}

/* ================= ИНИЦИАЛИЗАЦИЯ ===================== */

function initSeats() {
  seats = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [null, null])
  );
}

/* ======================= RENDER ====================== */

function render() {
  renderGrid();
  renderStudents();
}

function renderGrid() {
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  seats.forEach((row, r) => {
    row.forEach((desk, c) => {
      const deskDiv = document.createElement("div");
      deskDiv.className = "desk";
      deskDiv.draggable = true;
      deskDiv.dataset.row = r;
      deskDiv.dataset.col = c;

      enableDeskDnD(deskDiv);

      desk.forEach((student, s) => {
        const seatDiv = document.createElement("div");
        seatDiv.className = "seat";
        seatDiv.textContent = student ?? "";

        seatDiv.dataset.row = r;
        seatDiv.dataset.col = c;
        seatDiv.dataset.seat = s;

        // --------------------
        // Подкрашиваем цвет текста по gender
        if (student && lastImportedJson?.students) {
          const studentObj = lastImportedJson.students.find((stu) => {
            const fullName = [stu.name, stu.lastname, stu.surname]
              .filter(Boolean)
              .join(" ");
            return fullName === student;
          });

          if (studentObj?.gender === "male") {
            seatDiv.style.color = "#a0d8f0"; // голубой
          } else if (studentObj?.gender === "female") {
            seatDiv.style.color = "#f4a0c0"; // розовый
          } else {
            seatDiv.style.color = "#ddd"; // нейтральный
          }
        }

        // --------------------
        enableSeatDnD(seatDiv);
        deskDiv.appendChild(seatDiv);
      });

      grid.appendChild(deskDiv);
    });
  });
}

function renderStudents() {
  studentList.innerHTML = "";

  freeStudents.forEach((name) => {
    const div = document.createElement("div");
    div.className = "student";
    div.textContent = name;
    div.draggable = true;

    // Определяем пол ученика
    let gender = null;
    if (lastImportedJson?.students) {
      const student = lastImportedJson.students.find((s) => {
        const fullName = [s.name, s.lastname, s.surname]
          .filter(Boolean)
          .join(" ");
        return fullName === name;
      });
      if (student) gender = student.gender;
    }

    // Подкрашиваем фон
    if (gender === "male") {
      div.style.color = "#a0d8f0"; // голубой
    } else if (gender === "female") {
      div.style.color = "#f4a0c0"; // розовый
    } else {
      div.style.color = "#ddd"; // нейтральный
    }

    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("student", name);
      e.dataTransfer.setData("from", "list");
    });

    studentList.appendChild(div);
  });
}

/* ==================== DRAG STUDENT =================== */

function enableSeatDnD(seatDiv) {
  seatDiv.addEventListener("dragover", (e) => {
    e.preventDefault();
    seatDiv.classList.add("drag-over");
  });

  seatDiv.addEventListener("dragleave", () => {
    seatDiv.classList.remove("drag-over");
  });

  seatDiv.addEventListener("drop", (e) => {
    e.preventDefault();
    seatDiv.classList.remove("drag-over");

    const r = +seatDiv.dataset.row;
    const c = +seatDiv.dataset.col;
    const s = +seatDiv.dataset.seat;

    const name = e.dataTransfer.getData("student");
    const from = e.dataTransfer.getData("from");
    if (!name) return;

    if (from.startsWith("seat")) {
      // Перетаскиваем с другого места
      const [fr, fc, fs] = from.split(":").slice(1).map(Number);

      if (fr === r && fc === c && fs === s) return; // та же ячейка

      // Меняем местами
      const targetStudent = seats[r][c][s];
      seats[r][c][s] = name;
      seats[fr][fc][fs] = targetStudent || null;
    } else if (from === "list") {
      // Перетаскиваем со списка
      const targetStudent = seats[r][c][s];
      seats[r][c][s] = name;

      // Если место было занято, возвращаем старого в список
      if (targetStudent) freeStudents.push(targetStudent);

      // Убираем нового из списка
      freeStudents = freeStudents.filter((n) => n !== name);
    }

    render();
  });

  if (seatDiv.textContent) {
    seatDiv.draggable = true;

    seatDiv.addEventListener("dragstart", (e) => {
      e.stopPropagation(); // ❗ важно
      e.dataTransfer.setData("student", seatDiv.textContent);
      e.dataTransfer.setData(
        "from",
        `seat:${seatDiv.dataset.row}:${seatDiv.dataset.col}:${seatDiv.dataset.seat}`
      );
    });
  }
}

/* ==================== DRAG DESK ====================== */

function enableDeskDnD(deskDiv) {
  deskDiv.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData(
      "desk",
      `${deskDiv.dataset.row}:${deskDiv.dataset.col}`
    );
  });

  deskDiv.addEventListener("dragover", (e) => {
    e.preventDefault();
    deskDiv.classList.add("drag-over");
  });

  deskDiv.addEventListener("dragleave", () => {
    deskDiv.classList.remove("drag-over");
  });

  deskDiv.addEventListener("drop", (e) => {
    e.preventDefault();
    deskDiv.classList.remove("drag-over");

    const from = e.dataTransfer.getData("desk");
    if (!from) return;

    const [r1, c1] = from.split(":").map(Number);
    const r2 = +deskDiv.dataset.row;
    const c2 = +deskDiv.dataset.col;

    const tmp = seats[r1][c1];
    seats[r1][c1] = seats[r2][c2];
    seats[r2][c2] = tmp;

    render();
  });
}

/* ================= RETURN TO LIST ==================== */

studentsPanel.addEventListener("dragover", (e) => {
  e.preventDefault();
  studentsPanel.classList.add("drag-over");
});

studentsPanel.addEventListener("dragleave", () => {
  studentsPanel.classList.remove("drag-over");
});

studentsPanel.addEventListener("drop", (e) => {
  e.preventDefault();
  studentsPanel.classList.remove("drag-over");

  const name = e.dataTransfer.getData("student");
  const from = e.dataTransfer.getData("from");

  if (!name || !from.startsWith("seat")) return;

  const [r, c, s] = from.split(":").slice(1).map(Number);
  seats[r][c][s] = null;
  freeStudents.push(name);

  render();
});

/* ================= SIZE CONTROLS ===================== */

addRow.addEventListener("click", () => {
  rows++;
  seats.unshift(Array.from({ length: cols }, () => [null, null]));
  render();
});

removeRow.addEventListener("click", () => {
  if (rows <= 1) return;

  const removed = seats.shift();

  removed.forEach((desk) =>
    desk.forEach((student) => {
      if (student) freeStudents.push(student);
    })
  );

  rows--;
  render();
});

addColumn.addEventListener("click", () => {
  cols++;
  seats.forEach((row) => row.unshift([null, null]));
  render();
});

removeColumn.addEventListener("click", () => {
  if (cols <= 1) return;

  seats.forEach((row) => {
    const removed = row.shift();
    removed.forEach((student) => {
      if (student) freeStudents.push(student);
    });
  });

  cols--;
  render();
});

/* ====================== START ======================== */

initSeats();
render();

/* ====================== EXPORT JSON ======================== */
exportJSON.addEventListener("click", () => {
  if (!lastImportedJson) {
    alert("Сначала импортируйте список учеников");
    return;
  }

  const data = {
    // Все ученики из последнего импортированного JSON
    students: lastImportedJson.students,

    // Текущая рассадка
    seating: {
      rows,
      cols,
      seats,
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "seating.json";
  a.click();

  URL.revokeObjectURL(url);
});

/* ====================== EXPORT PDF ======================== */

import "../../../node_modules/jspdf/dist/jspdf.umd.js";
import "../../../node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.js";
exportPDF.addEventListener("click", () => {
  const doc = new window.jspdf.jsPDF();

  // Подключаем шрифт
  doc.addFileToVFS("timesnrcyrmt.ttf", base64TNR);
  doc.addFont("timesnrcyrmt.ttf", "TimesNewRoman", "normal");
  doc.setFont("TimesNewRoman");

  // Формируем данные таблицы
  const tableData = seats.map((row) =>
    row.map((cell) => cell.filter((name) => name?.trim()).join(",\n") || "")
  );

  const lastRow = Array.from({ length: cols }, (_, i) => `Ряд ${cols - i}`);
  tableData.push(lastRow);

  // Равная ширина колонок
  const pageWidth = doc.internal.pageSize.getWidth() - 20; // отступы
  const colWidth = pageWidth / cols;
  const columnStyles = {};
  lastRow.forEach((_, i) => (columnStyles[i] = { cellWidth: colWidth }));

  // Создание таблицы
  doc.autoTable({
    head: [],
    body: tableData,
    startY: 20,
    styles: { font: "TimesNewRoman", fontSize: 12, cellWidth: "wrap" },
    columnStyles,
    theme: "grid",
  });

  // Сохраняем PDF
  doc.save("seating.pdf");
});
