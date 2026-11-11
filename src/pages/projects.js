// Projects index: filter chips + card grid. Filtering cross-fades the cards
// that stay and lets the others drop out - no layout jump-cut.
import { boot, reducedMotion } from "../common.js";
import { config } from "../config.js";
import { t, onLang } from "../modules/i18n.js";
import { cardHTML, catLabel } from "../modules/cards.js";

boot();

const grid = document.querySelector("[data-proj-grid]");
const filters = document.querySelector("[data-filters]");
const count = document.querySelector("[data-proj-count]");

// start from ?cat=… so filtered views are linkable
let active = new URLSearchParams(location.search).get("cat") || "all";
const cats = config.projectCategories.filter((c) => config.projects.some((p) => p.category === c));
if (active !== "all" && !cats.includes(active)) active = "all";

function renderChips() {
  filters.innerHTML = ["all", ...cats]
    .map(
      (c) => `<button type="button" class="chip-btn" data-cat="${c}" aria-pressed="${c === active}">
        ${c === "all" ? t("catAll") : catLabel(c)}</button>`
    )
    .join("");
}

function renderGrid({ animate = false } = {}) {
  const list = config.projects.filter((p) => active === "all" || p.category === active);
  grid.innerHTML = list.map((p, i) => cardHTML(p, { eager: i < 2 })).join("");
  count.textContent = list.length === 1 ? t("projCountOne") : t("projCount", { n: list.length });
  if (animate && !reducedMotion) {
    grid.querySelectorAll(".card").forEach((card, i) =>
      card.animate(
        [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
        { duration: 380, delay: Math.min(i, 6) * 40, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
      )
    );
  }
}

filters.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn || btn.dataset.cat === active) return;
  active = btn.dataset.cat;
  filters.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === active)));
  const url = new URL(location.href);
  if (active === "all") url.searchParams.delete("cat");
  else url.searchParams.set("cat", active);
  history.replaceState(null, "", url);
  renderGrid({ animate: true });
});

onLang(() => {
  renderChips();
  renderGrid();
});
