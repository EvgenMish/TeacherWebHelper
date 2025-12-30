window.addEventListener("DOMContentLoaded", () => {
  const titlebar = document.createElement("div");
  titlebar.className = "titlebar";

  const btnMin = document.createElement("button");
  btnMin.textContent = "—";
  btnMin.addEventListener("click", () => window.windowAPI.minimize());

  const btnMax = document.createElement("button");
  btnMax.textContent = "▢";
  btnMax.addEventListener("click", () => window.windowAPI.toggleMaximize());

  const btnClose = document.createElement("button");
  btnClose.textContent = "×";
  btnClose.addEventListener("click", () => window.windowAPI.close());

  titlebar.appendChild(btnMin);
  titlebar.appendChild(btnMax);
  titlebar.appendChild(btnClose);

  document.body.prepend(titlebar);
});
