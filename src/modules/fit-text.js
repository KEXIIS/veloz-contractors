// Fits the VELOZ wordmark edge-to-edge across the viewport, Belgrade-Arbor
// style: measure at a known size, scale the font so the ink meets the edges.
export function fitWordmark() {
  const el = document.querySelector("[data-fit-text]");
  if (!el) return;

  const fit = () => {
    el.style.fontSize = "100px";
    const w = el.scrollWidth;
    if (!w) return;
    // 1.012: a hair past the edges, so the strokes kiss the viewport
    el.style.fontSize = `${(100 * window.innerWidth * 1.012) / w}px`;
    el.classList.add("is-fit");
  };

  fit();
  document.fonts?.ready.then(fit);
  let raf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fit);
  });
}
