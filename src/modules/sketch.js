// The signature section: a pinned, scrubbed (and therefore reversible)
// timeline - the kitchen draws itself in thin strokes, then the finished
// photo rises through the sketch. GSAP ScrollTrigger is used only here.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initSketch({ reducedMotion = false } = {}) {
  const stage = document.querySelector("[data-sketch-stage]");
  const svg = document.querySelector("[data-sketch-svg]");
  const photo = document.querySelector("[data-sketch-photo]");
  const chipPlan = document.querySelector("[data-chip-plan]");
  const chipBuilt = document.querySelector("[data-chip-built]");
  if (!stage || !svg || !photo) return;

  if (reducedMotion) return; // CSS fallback: photo shown, sketch ghosted over it

  gsap.registerPlugin(ScrollTrigger);

  const strokes = gsap.utils.toArray(".sk", svg);

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".sketch",
      start: "top top",
      end: "+=212.5%",
      pin: stage,
      scrub: 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // 1) the plan draws itself
  tl.to(strokes, { strokeDashoffset: 0, duration: 0.42, stagger: { each: 0.008 } }, 0);
  // 2) the build rises through it
  tl.to(photo, { clipPath: "inset(0% 0 0 0)", duration: 0.42 }, 0.52);
  tl.to(svg, { opacity: 0.22, duration: 0.3 }, 0.58);
  // 3) the chips trade places
  tl.to(chipPlan, { opacity: 0.35, duration: 0.06 }, 0.86);
  tl.to(chipBuilt, { opacity: 1, duration: 0.06 }, 0.86);

  return { refresh: () => ScrollTrigger.refresh() };
}
