/* Допустимые значения */
const GRADES = [2, 3, 4, 5];
const ALLOWED_WEIGHTS = [15, 20, 25, 40, 50];

/* Табличные данные */
let tableData = [
  { grade: null, weight: null }, // стартовая пустая строка
];

/* Взвешенное среднее */
function weightedMean(data) {
  let sum = 0;
  let weightSum = 0;

  for (const row of data) {
    if (row.grade !== null && row.weight !== null) {
      sum += row.grade * row.weight;
      weightSum += row.weight;
    }
  }

  return weightSum === 0 ? 0 : sum / weightSum;
}

/* Обновление результата */
function updateResult() {
  const result = weightedMean(tableData);
  document.getElementById("resultDisplay").textContent =
    result === 0 ? "-" : result.toFixed(2);
}

/* Select оценки */
function createGradeSelect(current, index) {
  const select = document.createElement("select");

  const placeholder = document.createElement("option");
  placeholder.textContent = "Выберите";
  placeholder.disabled = true;
  placeholder.selected = current === null;
  select.appendChild(placeholder);

  GRADES.forEach((g) => {
    const option = document.createElement("option");
    option.value = g;
    option.textContent = g;
    if (g === current) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    tableData[index].grade = Number(select.value);
    checkAndAddRow(index);
    updateResult();
  });

  return select;
}

/* Select веса */
function createWeightSelect(current, index) {
  const select = document.createElement("select");

  const placeholder = document.createElement("option");
  placeholder.textContent = "Выберите";
  placeholder.disabled = true;
  placeholder.selected = current === null;
  select.appendChild(placeholder);

  ALLOWED_WEIGHTS.forEach((w) => {
    const option = document.createElement("option");
    option.value = w;
    option.textContent = w;
    if (w === current) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    tableData[index].weight = Number(select.value);
    checkAndAddRow(index);
    updateResult();
  });

  return select;
}

/* Кнопка удаления строки */
function createDeleteButton(index) {
  const button = document.createElement("button");
  button.innerHTML = "✕";
  button.classList.add("delete-button");
  button.title = "Удалить строку";
  button.style.cursor = "pointer";

  button.addEventListener("click", () => {
    tableData.splice(index, 1);
    renderTable();
  });

  return button;
}

/* Проверка: добавлять ли новую строку */
function checkAndAddRow(index) {
  const row = tableData[index];
  const isLastRow = index === tableData.length - 1;

  if (isLastRow && row.grade !== null && row.weight !== null) {
    tableData.push({ grade: null, weight: null });
    renderTable();
  }
}

/* Рендер таблицы */
function renderTable() {
  const tbody = document.querySelector("#calc2Table tbody");
  tbody.innerHTML = "";

  tableData.forEach((row, index) => {
    const tr = document.createElement("tr");

    const gradeTd = document.createElement("td");
    gradeTd.appendChild(createGradeSelect(row.grade, index));

    const weightTd = document.createElement("td");
    weightTd.appendChild(createWeightSelect(row.weight, index));

    const deleteTd = document.createElement("td");
    if (index < tableData.length - 1) {
      deleteTd.appendChild(createDeleteButton(index));
    }

    tr.appendChild(gradeTd);
    tr.appendChild(weightTd);
    tr.appendChild(deleteTd);
    tbody.appendChild(tr);
  });

  updateResult();
}

/* Старт */
renderTable();
