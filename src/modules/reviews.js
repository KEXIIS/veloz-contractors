// Reviews - one quote at a time, swipeable with the same physics as the
// slider: 1:1 drag, velocity projection picks the landing slide, rubber-band
// at the ends, springs carry the release velocity. Arrows + keyboard too.
import { config } from "../config.js";
import { t, onLang } from "./i18n.js";
import { highlightedQuote } from "./review-text.js";
import { springTo, project, rubberband, createVelocityTracker } from "./physics.js";

export function initReviews({ reducedMotion = false } = {}) {
  const stage = document.querySelector("[data-rev]");
  const track = document.querySelector("[data-rev-track]");
  const counter = document.querySelector("[data-rev-counter]");
  const prev = document.querySelector("[data-rev-prev]");
  const next = document.querySelector("[data-rev-next]");
  if (!stage || !track || !counter || !prev || !next) return;

  const n = config.reviews.length;
  track.innerHTML = config.reviews
    .map(
      (r) => `
    <li class="rev-slide">
      <blockquote lang="en">
        <p class="rev-quote">${highlightedQuote(r)}</p>
        <footer class="rev-author"><b>${r.author}</b> · <span data-rev-src>Google review</span></footer>
      </blockquote>
    </li>`
    )
    .join("");

  let x = 0; // track translateX in px
  let index = 0;
  let anim = null;
  const W = () => stage.clientWidth;
  const min = () => -(n - 1) * W();

  function render(value) {
    x = value;
    track.style.transform = `translate3d(${x}px,0,0)`;
  }
  function setIndex(i) {
    index = Math.max(0, Math.min(n - 1, i));
    counter.textContent = `${index + 1} / ${n}`;
    prev.disabled = index === 0;
    next.disabled = index === n - 1;
  }
  function settle(velocity = 0) {
    const projected = x + (reducedMotion ? 0 : project(velocity));
    setIndex(Math.round(-Math.max(min(), Math.min(0, projected)) / W()));
    const target = -index * W();
    anim?.stop();
    if (reducedMotion) return render(target);
    const damping = Math.abs(velocity) > 420 ? 0.82 : 1;
    anim = springTo(x, target, { velocity, damping, response: 0.5, onUpdate: render });
  }

  const band = (raw) => {
    if (raw > 0) return rubberband(raw, W());
    if (raw < min()) return min() + rubberband(raw - min(), W());
    return raw;
  };

  // ---- drag ----
  const tracker = createVelocityTracker();
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    try { stage.setPointerCapture(e.pointerId); } catch {}
    anim?.stop(); // interruptible: catch it mid-flight
    stage.classList.add("is-grabbing");
    drag = { id: e.pointerId, startX: e.clientX, from: x, moved: false };
    tracker.reset();
    tracker.add(x, e.timeStamp);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < 6) return; // hysteresis before committing
    drag.moved = true;
    const raw = drag.from + dx;
    render(band(raw));
    tracker.add(raw, e.timeStamp);
  });
  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    stage.classList.remove("is-grabbing");
    settle(moved ? tracker.get(e.timeStamp) : 0);
  }
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("dragstart", (e) => e.preventDefault());

  function goTo(i) {
    setIndex(i);
    const target = -index * W();
    anim?.stop();
    if (reducedMotion) return render(target);
    anim = springTo(x, target, { velocity: 0, damping: 1, response: 0.5, onUpdate: render });
  }

  let autoTimer = null;
  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  let inView = false;
  function startAuto() {
    stopAuto();
    if (reducedMotion || !inView) return;
    autoTimer = setInterval(() => goTo(index === n - 1 ? 0 : index + 1), 6000);
  }
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    inView ? startAuto() : stopAuto();
  }, { threshold: 0.5 }).observe(stage);

  prev.addEventListener("click", () => { goTo(index - 1); startAuto(); });
  next.addEventListener("click", () => { goTo(index + 1); startAuto(); });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); startAuto(); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); startAuto(); }
  });
  stage.addEventListener("pointerdown", stopAuto);
  stage.addEventListener("pointerup", startAuto);
  stage.addEventListener("pointercancel", startAuto);

  new ResizeObserver(() => render(-index * W())).observe(stage);
  onLang(() => {
    track.querySelectorAll("[data-rev-src]").forEach((el) => (el.textContent = t("revSource")));
    counter.textContent = `${index + 1} / ${n}`;
  });
  setIndex(0);
  render(0);
  startAuto();
}
