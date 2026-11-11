// Scroll reveal: headings, cards, steps and footer columns rise into place the
// first time they enter the viewport. Skipped for reduced motion.
import { onLang } from "./i18n.js";

const TARGETS = ".band-head, .hero-under, .card, .pr-step, .pr-value, .foot-brand, .foot-col";

export function initReveal({ reducedMotion = false } = {}) {
  if (reducedMotion || !window.IntersectionObserver) return;
  const seen = new WeakSet();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        io.unobserve(target);
        if (target.matches(":focus-within")) return;
        target.animate(
          [
            { opacity: 0, transform: "translateY(28px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 875,
            delay: target.matches(".card") ? (Array.from(target.parentElement.children).indexOf(target) % 3) * 90 : 0,
            easing: "cubic-bezier(.16, 1, .3, 1)",
            fill: "backwards",
          }
        );
      });
    },
    { threshold: 0, rootMargin: "0px 0px -36px 0px" }
  );
  function scan() {
    document.querySelectorAll(TARGETS).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    });
  }
  onLang(() => requestAnimationFrame(scan)); // cards are rendered by other modules
  requestAnimationFrame(scan);
}
