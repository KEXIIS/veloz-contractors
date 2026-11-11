// Pill nav. Marks the current page. On phones the links fold into a panel
// that grows out of the pill on a critically damped spring and folds back
// along the same path; it can be reversed mid-motion (Motion animates from
// the live on-screen value). Escape, a link tap or a tap outside closes it.
import { animate } from "motion";
import { t, onLang } from "./i18n.js";

export function initNav({ reducedMotion = false } = {}) {
  const pill = document.querySelector("[data-pill]");
  const links = document.querySelector("[data-pill-links]");
  const btn = document.querySelector("[data-menu]");
  const label = document.querySelector("[data-menu-label]");
  if (!pill || !links || !btn) return;

  // current page
  const page = document.body.dataset.page;
  links.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === page) a.setAttribute("aria-current", "page");
  });

  const mobile = matchMedia("(max-width: 47.99rem)");
  let open = false;
  let anim = null;

  function render() {
    btn.setAttribute("aria-expanded", String(open));
    pill.classList.toggle("is-open", open);
    if (label) label.textContent = t(open ? "menuClose" : "menuOpen");
    links.inert = mobile.matches && !open;
  }

  function setOpen(next, { focusButton = false } = {}) {
    if (!mobile.matches) return;
    open = next;
    render();
    anim?.stop();
    if (reducedMotion) {
      links.style.opacity = open ? 1 : 0;
      links.style.transform = "none";
      links.style.visibility = open ? "visible" : "hidden";
    } else {
      if (open) links.style.visibility = "visible";
      anim = animate(
        links,
        open
          ? { opacity: 1, transform: "translateY(0px) scale(1)" }
          : { opacity: 0, transform: "translateY(-10px) scale(0.96)" },
        { type: "spring", bounce: 0, duration: 0.525 }
      );
      anim.then?.(() => { if (!open) links.style.visibility = "hidden"; });
    }
    if (open) links.querySelector("a")?.focus({ preventScroll: true });
    else if (focusButton) btn.focus();
  }

  function reset() {
    open = false;
    anim?.stop();
    links.removeAttribute("style");
    render();
  }

  btn.addEventListener("click", () => setOpen(!open));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false, { focusButton: true });
  });
  document.addEventListener("pointerdown", (e) => {
    if (open && !pill.contains(e.target)) setOpen(false);
  });
  mobile.addEventListener("change", reset);

  // desktop: a soft highlight follows the pointer across the pill
  if (!reducedMotion && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let raf = null, px = 0, py = 0;
    pill.addEventListener("pointermove", (e) => {
      px = e.clientX; py = e.clientY;
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        const r = pill.getBoundingClientRect();
        pill.style.setProperty("--glass-x", `${((px - r.left) / r.width) * 100}%`);
        pill.style.setProperty("--glass-y", `${((py - r.top) / r.height) * 100}%`);
        raf = null;
      });
    }, { passive: true });
    pill.addEventListener("pointerleave", () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      pill.style.removeProperty("--glass-x");
      pill.style.removeProperty("--glass-y");
    });
  }

  // shrink slightly once the page is scrolled (hysteresis avoids flicker)
  let scrolled = false, ticking = false;
  const onScroll = () => {
    const next = scrollY > (scrolled ? 32 : 80);
    if (next !== scrolled) { scrolled = next; pill.classList.toggle("is-scrolled", scrolled); }
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("pageshow", onScroll);
  onScroll();
  onLang(render);
  reset();
}
