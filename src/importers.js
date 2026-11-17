export async function readStudentsFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext !== "xlsx" && ext !== "xls")
    throw new Error("Поддерживаются только файлы Excel (.xlsx)");
  return parseExcel(new Uint8Array(await file.arrayBuffer()), await import("xlsx"));
}

const cell = (v) => String(v ?? "").trim();

function parseExcel(data, { read, utils }) {
  let rows;
  try {
    const workbook = read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  } catch {
    throw new Error("Не удалось прочитать Excel-файл");
  }

  const students = rows
    .map((row) => {
      const lastname = cell(row[0]);
      const name = cell(row[1]);
      const surname = cell(row[2]);

      const genderRaw = cell(row[3]).toLowerCase();
      let gender = "";
      if (genderRaw === "м" || genderRaw === "муж") gender = "male";
      else if (genderRaw === "ж" || genderRaw === "жен") gender = "female";

      if (!lastname && !name && !surname && !gender) return null;
      return { lastname, name, surname, gender };
    })
    .filter(Boolean);

  if (!students.length) throw new Error("Нет корректных данных для импорта");
  return { students };
}
