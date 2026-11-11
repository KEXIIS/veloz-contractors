// The apple-design toolkit: Motion springs plus Apple's projection and
// rubber-band formulas (from the Designing Fluid Interfaces sample code).
import { animate } from "motion";

/**
 * Spring a single value, interruptible. Returns controls with .stop().
 * damping 1 = critically damped (default). <1 adds bounce - only use it
 * when the gesture actually carried momentum.
 */
export function springTo(from, to, { velocity = 0, damping = 1, response = 0.45, onUpdate, onComplete } = {}) {
  return animate(from, to, {
    type: "spring",
    duration: response * 1.25,
    bounce: Math.max(0, 1 - damping),
    velocity,
    onUpdate,
    onComplete,
  });
}

/** Where a flick would come to rest. decelerationRate 0.998 = scroll-like. */
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Soft boundary: the further past the edge, the less it follows. */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Tracks the last ~100ms of pointer samples → release velocity (units/s). */
export function createVelocityTracker() {
  let history = [];
  return {
    add(value, time) {
      history.push({ v: value, t: time });
      if (history.length > 24) history.shift();
    },
    get(releasedAt) {
      const now = history[history.length - 1];
      if (!now) return 0;
      // a pause before release is a placement, not a throw
      if (releasedAt !== undefined && releasedAt - now.t > 60) return 0;
      let first = now;
      for (let i = history.length - 1; i >= 0; i--) {
        if (now.t - history[i].t > 100) break;
        first = history[i];
      }
      const dt = (now.t - first.t) / 1000;
      return dt > 0 ? (now.v - first.v) / dt : 0;
    },
    reset() { history = []; },
  };
}
