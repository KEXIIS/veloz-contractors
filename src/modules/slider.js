// Before/after slider, built to the apple-design checklist:
// pointer-down response, 1:1 tracking with the grab offset respected,
// rubber-banding past the edges, velocity handoff on release, momentum
// projection to the snap points (0 / 50 / 100), fully interruptible,
// keyboard operable.
import { t, onLang } from "./i18n.js";
import { springTo, project, rubberband, createVelocityTracker } from "./physics.js";

const SNAPS = [0, 0.5, 1];

export function initSlider({ reducedMotion = false } = {}) {
  const fig = document.querySelector("[data-ba]");
  if (!fig) return;
  const before = fig.querySelector("[data-ba-before]");
  const divider = fig.querySelector("[data-ba-divider]");
  const handle = fig.querySelector("[data-ba-handle]");
  const tagBefore = fig.querySelector("[data-ba-tag-before]");
  const tagAfter = fig.querySelector("[data-ba-tag-after]");

  let p = 0.5; // divider position, 0..1 (left of it = before)
  let anim = null;
  const W = () => fig.clientWidth;

  function render(value) {
    p = value;
    const shown = Math.min(1, Math.max(0, p));
    before.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
    divider.style.left = handle.style.left = `${p * 100}%`;
    tagBefore.style.opacity = p < 0.12 ? 0 : 1;
    tagAfter.style.opacity = p > 0.88 ? 0 : 1;
    handle.setAttribute("aria-valuenow", Math.round(shown * 100));
    handle.setAttribute("aria-valuetext", `${Math.round(shown * 100)}%, ${t("baBefore")}`);
  }

  function settleTo(target, velocity = 0) {
    anim?.stop();
    if (reducedMotion) return render(target);
    // bounce only when the gesture carried momentum
    const damping = Math.abs(velocity) > 1.2 ? 0.82 : 1;
    anim = springTo(p, target, { velocity, damping, response: 0.5, onUpdate: render });
  }

  // ---- pointer ----
  const tracker = createVelocityTracker();
  let drag = null;

  fig.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    try { fig.setPointerCapture(e.pointerId); } catch {}
    anim?.stop(); // grab it mid-flight: motion starts from the on-screen value
    fig.classList.add("is-grabbing");

    const rect = fig.getBoundingClientRect();
    const pointerP = (e.clientX - rect.left) / rect.width;
    const nearHandle = Math.abs(pointerP - p) * rect.width < 44;
    drag = {
      id: e.pointerId,
      rect,
      // grabbed the handle: keep the offset from where the finger landed.
      // pressed elsewhere: chase the finger with a quick spring, no jump cut.
      offset: nearHandle ? p - pointerP : 0,
      chasing: !nearHandle,
    };
    tracker.reset();
    tracker.add(p, e.timeStamp);
    if (drag.chasing) {
      anim = springTo(p, clampSoft(pointerP), { response: 0.3, onUpdate: render });
    }
  });

  fig.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const raw = (e.clientX - drag.rect.left) / drag.rect.width + drag.offset;
    if (drag.chasing) {
      // once the divider has caught the finger, switch to 1:1
      if (Math.abs(raw - p) < 0.02) drag.chasing = false;
      else {
        anim?.stop();
        anim = springTo(p, clampSoft(raw), { response: 0.25, onUpdate: render });
        tracker.add(raw, e.timeStamp);
        return;
      }
    }
    anim?.stop();
    render(clampSoft(raw)); // 1:1 with the finger
    tracker.add(raw, e.timeStamp);
  });

  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    fig.classList.remove("is-grabbing");
    const v = tracker.get(e.timeStamp); // normalized units/s
    // project where the flick is going, snap to the nearest point FROM THERE
    const projected = p + project(v * W()) / W();
    const target = SNAPS.reduce((b, s) =>
      Math.abs(s - projected) < Math.abs(b - projected) ? s : b
    );
    settleTo(target, v);
  }
  fig.addEventListener("pointerup", release);
  fig.addEventListener("pointercancel", release);
  fig.addEventListener("dragstart", (e) => e.preventDefault());

  // soft edges while dragging
  function clampSoft(raw) {
    if (raw > 1) return 1 + rubberband((raw - 1) * W(), W()) / W();
    if (raw < 0) return rubberband(raw * W(), W()) / W();
    return raw;
  }

  // ---- keyboard ----
  handle.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -0.05, ArrowRight: 0.05, PageDown: -0.2, PageUp: 0.2 }[e.key];
    let target;
    if (step !== undefined) target = Math.min(1, Math.max(0, (anim ? p : p) + step));
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = 1;
    else return;
    e.preventDefault();
    anim?.stop();
    if (reducedMotion) render(target);
    else anim = springTo(p, target, { response: 0.35, onUpdate: render });
  });

  onLang(() => render(p));
  render(0.5);
}
