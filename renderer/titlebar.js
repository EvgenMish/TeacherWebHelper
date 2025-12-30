window.addEventListener("DOMContentLoaded", async () => {
  const rendererRoot =
    window.location.pathname.split("/renderer/")[0] + "/renderer/";
  try {
    const response = await fetch(`file://${rendererRoot}titlebar.html`);
    const titlebarHTML = await response.text();
    document.body.insertAdjacentHTML("afterbegin", titlebarHTML);

    document
      .getElementById("min-btn")
      .addEventListener("click", () => window.windowAPI.minimize());
    document
      .getElementById("max-btn")
      .addEventListener("click", () => window.windowAPI.toggleMaximize());
    document
      .getElementById("close-btn")
      .addEventListener("click", () => window.windowAPI.close());
  } catch (err) {
    console.error("Не удалось загрузить titlebar.html:", err);
  }
});
