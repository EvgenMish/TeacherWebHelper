const THRESHOLD = 5;
const LONG_PRESS = 220;
const EDGE = 64;

const ACCEPTS = {
  student: ["seat", "list"],
  seat: ["seat", "list"],
  desk: ["desk", "list"],
};

function suppressNextClick() {
  const block = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  window.addEventListener("click", block, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", block, { capture: true }), 100);
}

export function initDnd(root, onDrop) {
  let session = null;

  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || session) return;
    if (e.target.closest("[data-nodrag]")) return;
    const source = e.target.closest("[data-drag]");
    if (!source || !root.contains(source)) return;

    session = {
      source,
      kind: source.dataset.drag,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      touch: e.pointerType !== "mouse",
      active: false,
      timer: 0,
      ghost: null,
      offsetX: 0,
      offsetY: 0,
      target: null,
      raf: 0,
    };

    if (session.touch) {
      session.timer = setTimeout(() => start(), LONG_PRESS);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", cancel);
  });

  document.addEventListener(
    "touchmove",
    (e) => {
      if (session?.active) e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener("contextmenu", (e) => {
    if (session) e.preventDefault();
  });

  function start() {
    const s = session;
    if (!s || s.active) return;
    s.active = true;

    const ghostSource = s.kind === "desk" ? s.source.closest(".desk") : s.source;
    const ghostRect = ghostSource.getBoundingClientRect();
    s.offsetX = s.startX - ghostRect.left;
    s.offsetY = s.startY - ghostRect.top;

    const ghost = ghostSource.cloneNode(true);
    ghost.classList.add("drag-ghost");
    ghost.removeAttribute("data-drop");
    ghost.style.width = `${ghostRect.width}px`;
    ghost.style.height = `${ghostRect.height}px`;
    document.body.appendChild(ghost);
    s.ghost = ghost;
    s.origin = ghostSource;

    ghostSource.classList.add("is-drag-source");
    document.body.classList.add("is-dragging");
    if (s.touch && navigator.vibrate) navigator.vibrate(10);

    position();
    s.raf = requestAnimationFrame(autoScroll);
  }

  function onMove(e) {
    const s = session;
    if (!s || e.pointerId !== s.pointerId) return;
    s.x = e.clientX;
    s.y = e.clientY;

    if (!s.active) {
      const moved = Math.hypot(s.x - s.startX, s.y - s.startY) > THRESHOLD;
      if (!moved) return;
      if (s.touch) return cancel();
      start();
    }
    position();
  }

  function position() {
    const s = session;
    s.ghost.style.transform = `translate(${s.x - s.offsetX}px, ${s.y - s.offsetY}px)`;
    updateTarget();
  }

  function updateTarget() {
    const s = session;
    const el = document.elementFromPoint(s.x, s.y);
    let target = el?.closest("[data-drop]") ?? null;

    while (target && !ACCEPTS[s.kind].includes(target.dataset.drop)) {
      target = target.parentElement?.closest("[data-drop]") ?? null;
    }
    if (target && !root.contains(target)) target = null;

    if (target !== s.target) {
      s.target?.classList.remove("is-drop-target");
      target?.classList.add("is-drop-target");
      s.target = target;
    }
  }

  function autoScroll() {
    const s = session;
    if (!s?.active) return;
    let dy = 0;
    if (s.y < EDGE) dy = -Math.ceil((EDGE - s.y) / 4);
    else if (s.y > innerHeight - EDGE) dy = Math.ceil((s.y - (innerHeight - EDGE)) / 4);
    if (dy) {
      window.scrollBy(0, dy);
      updateTarget();
    }
    s.raf = requestAnimationFrame(autoScroll);
  }

  function onUp(e) {
    const s = session;
    if (!s || e.pointerId !== s.pointerId) return;
    const { active, kind, source, target } = s;
    cleanup();
    if (active) {
      suppressNextClick();
      if (target) onDrop({ kind, source, target });
    }
  }

  function cancel() {
    cleanup();
  }

  function cleanup() {
    const s = session;
    if (!s) return;
    clearTimeout(s.timer);
    cancelAnimationFrame(s.raf);
    s.ghost?.remove();
    s.origin?.classList.remove("is-drag-source");
    s.target?.classList.remove("is-drop-target");
    document.body.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", cancel);
    session = null;
  }
}
