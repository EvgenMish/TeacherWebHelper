let calc = null;
const COLORS = ["#4caf50", "#f44336", "#2196f3", "#ff9800", "#9c27b0"];

function initCalculator() {
  if (calc) return;
  const elt = document.getElementById("plot");
  calc = Desmos.GraphingCalculator(elt, {
    expressions: true,
    keypad: false,
    settingsMenu: false,
    zoomButtons: true,
  });
}

function addFunction() {
  const container = document.getElementById("functions-container");
  const div = document.createElement("div");
  div.className = "func-row";
  div.innerHTML = `<input type="text" class="func-input" placeholder="x^2 + sin(x)">
                   <button onclick="removeFunction(this)">×</button>`;
  container.appendChild(div);
}

function removeFunction(btn) {
  btn.parentElement.remove();
}

function getColor(idx) {
  return COLORS[idx % COLORS.length];
}

function userInputToLatex(str) {
  if (!str) return "";
  let s = str.trim();
  s = s.replace(/pi/gi, "\\pi");
  s = s.replace(/sin\(/gi, "\\sin(");
  s = s.replace(/cos\(/gi, "\\cos(");
  s = s.replace(/tan\(/gi, "\\tan(");
  s = s.replace(/log\(/gi, "\\log(");
  return s;
}

function plotFunctions() {
  initCalculator();
  if (!calc) return;

  calc.setExpressions([]); // очистка старых

  const inputs = document.querySelectorAll(".func-input");
  let idCounter = 1;

  inputs.forEach((input) => {
    let val = input.value.trim();
    if (!val) return;

    let latex = userInputToLatex(val);

    // добавляем y= только если не начинается с y= или f(
    if (!/^y\s*=/.test(latex) && !/^f\s*\(/.test(latex)) {
      latex = "y=" + latex;
    }

    try {
      calc.setExpression({
        id: "f" + idCounter,
        latex: latex,
        color: getColor(idCounter - 1),
      });
      idCounter++;
    } catch (e) {
      console.error("Ошибка построения графика:", val, e);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCalculator();
  document.getElementById("plot-btn").addEventListener("click", plotFunctions);
});
