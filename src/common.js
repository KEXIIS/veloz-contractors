// Shared boot for every page: fonts, styles, AA-safe accent colors, EN/ES,
// pill nav, footer (hours + live Miami-time badge).
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./styles/main.css";
import "./styles/pages.css";

import { ensureContrast } from "./modules/color.js";
import { initI18n } from "./modules/i18n.js";
import { initNav } from "./modules/nav.js";
import { initFooter } from "./modules/footer.js";
import { initReveal } from "./modules/reveal.js";
import { initSlideUnderline } from "./modules/underline.js";

export const reducedMotion =
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  new URLSearchParams(location.search).has("nomotion");

export function boot() {
  if (reducedMotion) document.documentElement.classList.add("reduced-motion");

  // forest green accent, kept AA-safe wherever it carries or backs text
  const root = document.documentElement.style;
  const PAPER = "#EFEAE2", INK = "#141414", TERRA = "#2C5F2D";
  root.setProperty("--accent-fill", ensureContrast(TERRA, PAPER, INK));
  root.setProperty("--accent-on-paper", ensureContrast(TERRA, PAPER, INK));
  root.setProperty("--accent-on-ink", ensureContrast(TERRA, INK, PAPER));

  // iOS Safari applies :active on touch only when a touchstart listener exists
  document.addEventListener("touchstart", () => {}, { passive: true });

  initNav({ reducedMotion });
  initFooter();
  initReveal({ reducedMotion });
  initSlideUnderline(document.querySelector("[data-pill-links]"), { selector: "a:not(.pill-contact)" });
  document.querySelectorAll(".foot-col").forEach((col) => initSlideUnderline(col, { selector: "a:not(.btn)" }));
  initI18n(); // last: runs every onLang subscriber once with the initial language
}
