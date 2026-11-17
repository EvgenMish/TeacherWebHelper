export function fileBase(name) {
  const s = String(name ?? "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 80);
  return s || "rassadka-klassa";
}

const MARGIN = 12;
const COL_GAP = 6;
const ROW_GAP = 4;
const MAX_DESK_H = 22;
const BLACK = [0, 0, 0];
const GRAY = [85, 85, 85];
const LINE = [136, 136, 136];
const DIVIDER = [187, 187, 187];

function fitText(doc, text, x, y, w, h) {
  if (!text) return;
  let size = 11;
  let lines;
  for (;;) {
    doc.setFontSize(size);
    lines = doc.splitTextToSize(text, w - 3);
    const lineH = (size * 0.3528) * 1.15;
    if (lines.length * lineH <= h - 2 || size <= 7) {
      const top = y + h / 2 - (lines.length * lineH) / 2 + lineH * 0.78;
      lines.forEach((ln, i) => doc.text(ln, x + w / 2, top + i * lineH, { align: "center" }));
      return;
    }
    size -= 0.5;
  }
}

export async function exportPdf(state, name = "rassadka-klassa", { title = "", date = "" } = {}) {
  const [{ jsPDF }, { base64TNR }] = await Promise.all([
    import("jspdf"),
    import("./fonts/base64_timesnrcyrmt.js"),
  ]);

  const { rows, cols, seats } = state;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.addFileToVFS("timesnrcyrmt.ttf", base64TNR);
  doc.addFont("timesnrcyrmt.ttf", "TimesNewRoman", "normal");
  doc.setFont("TimesNewRoman");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;

  let y = MARGIN + 5;
  doc.setTextColor(...BLACK);
  doc.setFontSize(16);
  doc.text(title, MARGIN, y, { maxWidth: contentW - 50 });
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(date, pageW - MARGIN, y, { align: "right" });
  y += 3;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 8;

  const labelsH = 7;
  const boardH = 9;
  const bottomH = labelsH + 4 + boardH;
  const deskW = (contentW - COL_GAP * (cols - 1)) / cols;
  const available = pageH - MARGIN - y - bottomH;
  const deskH = Math.min(MAX_DESK_H, (available - ROW_GAP * (rows - 1)) / rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = MARGIN + c * (deskW + COL_GAP);
      const dy = y + r * (deskH + ROW_GAP);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, dy, deskW, deskH, 2, 2);
      doc.setDrawColor(...DIVIDER);
      doc.line(x + deskW / 2, dy, x + deskW / 2, dy + deskH);

      doc.setTextColor(...BLACK);
      seats[r][c].forEach((student, s) =>
        fitText(doc, student ?? "", x + s * (deskW / 2), dy, deskW / 2, deskH)
      );
    }
  }

  let by = y + rows * deskH + (rows - 1) * ROW_GAP + 5;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  for (let c = 0; c < cols; c++) {
    const x = MARGIN + c * (deskW + COL_GAP) + deskW / 2;
    doc.text(`РЯД ${cols - c}`, x, by, { align: "center" });
  }
  by += 4;
  const bw = Math.min(110, contentW * 0.35);
  const bx = (pageW - bw) / 2;
  doc.setDrawColor(...LINE);
  doc.setLineDashPattern([1.2, 1.2], 0);
  doc.roundedRect(bx, by, bw, boardH, 1.5, 1.5);
  doc.setLineDashPattern([], 0);
  doc.text("ДОСКА", pageW / 2, by + 6, { align: "center" });

  doc.save(`${name}.pdf`);
}
