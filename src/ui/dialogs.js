const $ = (id) => document.getElementById(id);

$("name-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    $("name-dialog").close("ok");
  }
});

function waitClose(dialog) {
  return new Promise((resolve) =>
    dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true })
  );
}

export function studentDialog({ student = null, save, remove }) {
  const dialog = $("student-dialog");
  const form = $("student-form");
  const fields = {
    lastname: $("student-lastname"),
    name: $("student-name"),
    surname: $("student-surname"),
  };
  const error = $("student-error");
  const del = $("student-delete");
  const editing = !!student;

  $("student-title").textContent = editing ? "Ученик" : "Новый ученик";
  $("student-ok").textContent = editing ? "Сохранить" : "Добавить";
  del.hidden = !editing;
  for (const [k, input] of Object.entries(fields)) input.value = student?.[k] ?? "";
  const gender = student?.gender ?? "";
  for (const r of form.elements["student-gender"]) r.checked = r.value === gender;
  error.hidden = true;

  const read = () => ({
    lastname: fields.lastname.value,
    name: fields.name.value,
    surname: fields.surname.value,
    gender: form.elements["student-gender"].value,
  });

  return new Promise((resolve) => {
    let result = null;

    const trySave = () => {
      try {
        save(read());
        result = "saved";
        dialog.close();
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
      }
    };

    const onSubmit = (e) => {
      e.preventDefault();
      const v = e.submitter?.value;
      if (v === "ok") trySave();
      else if (v === "delete") {
        remove?.();
        result = "deleted";
        dialog.close();
      } else dialog.close();
    };
    const onKey = (e) => {
      if (e.key === "Enter" && !e.isComposing && e.target.matches("input")) {
        e.preventDefault();
        trySave();
      }
    };

    form.addEventListener("submit", onSubmit);
    form.addEventListener("keydown", onKey);
    dialog.addEventListener(
      "close",
      () => {
        form.removeEventListener("submit", onSubmit);
        form.removeEventListener("keydown", onKey);
        resolve(result);
      },
      { once: true }
    );

    dialog.showModal();
    fields.lastname.focus();
  });
}

export async function confirmDialog({ title, text = "", okLabel = "OK" }) {
  const dialog = $("confirm-dialog");
  $("confirm-title").textContent = title;
  $("confirm-text").textContent = text;
  $("confirm-text").hidden = !text;
  $("confirm-ok").textContent = okLabel;
  dialog.returnValue = "";
  dialog.showModal();
  return (await waitClose(dialog)) === "ok";
}

export async function nameDialog({ title, okLabel, value = "", withCopy = false, copyEnabled = true }) {
  const dialog = $("name-dialog");
  const input = $("name-input");
  const copy = $("copy-students");

  $("name-title").textContent = title;
  $("name-ok").textContent = okLabel;
  input.value = value;
  $("copy-students-wrap").hidden = !withCopy;
  copy.checked = copyEnabled;
  copy.disabled = !copyEnabled;

  dialog.returnValue = "";
  dialog.showModal();
  input.focus();
  input.select();

  const result = await waitClose(dialog);
  if (result !== "ok") return null;
  return { name: input.value, copyStudents: withCopy && copy.checked };
}
