// Project card markup, shared by the home teaser, the projects grid and
// "More projects" on a project page.
import { t, pick } from "./i18n.js";

const CAT_KEY = {
  kitchens: "catKitchens",
  bathrooms: "catBathrooms",
  wholehome: "catWholehome",
  builtins: "catBuiltins",
  floors: "catFloors",
  repairs: "catRepairs",
};

export const catLabel = (cat) => t(CAT_KEY[cat] || "catAll");

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function cardHTML(p, { eager = false } = {}) {
  const title = pick(p.title);
  return `
  <li class="card" data-cat="${p.category}">
    <a class="card-link" href="/projects/project.html?id=${encodeURIComponent(p.id)}">
      <figure class="card-img">
        <img src="${p.cover}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
             width="1400" height="933" alt="${esc(title)} — placeholder photo" />
      </figure>
      <span class="card-meta">
        <span class="card-title">${esc(title)}</span>
        <span class="card-sub">${esc(catLabel(p.category))} · ${esc(t("pdAreaValue"))}</span>
      </span>
    </a>
  </li>`;
}
