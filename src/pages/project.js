// Project detail, rendered from config by ?id=…
import { highlightedQuote } from "../modules/review-text.js";
import { boot, reducedMotion } from "../common.js";
import { config } from "../config.js";
import { onLang, pick, setSeo } from "../modules/i18n.js";
import { cardHTML, catLabel } from "../modules/cards.js";
import { initSlider } from "../modules/slider.js";

boot();

const id = new URLSearchParams(location.search).get("id");
const project = config.projects.find((p) => p.id === id);
const $ = (s) => document.querySelector(s);

if (!project) {
  $("[data-pd]").hidden = true;
  $("[data-pd-missing]").hidden = false;
} else {
  const review = config.reviews.find((r) => r.id === project.review);

  // before/after only when a before photo exists
  if (project.before) {
    $("[data-pd-ba]").hidden = false;
    $("[data-ba-after-img]").src = project.cover;
    $("[data-ba-before]").src = project.before;
    initSlider({ reducedMotion });
  }

  if (review) {
    $("[data-pd-review]").hidden = false;
    $("[data-pd-quote]").innerHTML = `“${highlightedQuote(review)}”`;
    $("[data-pd-author]").textContent = review.author;
  }

  onLang(() => {
    const title = pick(project.title);
    const scope = pick(project.scope);
    setSeo("project", { title, scope });
    $("[data-pd-title]").textContent = title;
    $("[data-pd-type]").textContent = catLabel(project.category);
    $("[data-pd-scope]").textContent = scope;
    $("[data-pd-story]").textContent = pick(project.story);

    const cover = $("[data-pd-cover]");
    cover.src = project.cover;
    cover.alt = `${title} — placeholder photo`;
    if (project.before) {
      $("[data-ba-after-img]").alt = `${title}, after — placeholder photo`;
      $("[data-ba-before]").alt = `${title}, before — placeholder photo`;
    }

    // numbered gallery, ARC-style
    $("[data-pd-gallery]").innerHTML = project.gallery
      .map(
        (src, i) => `
      <li class="pd-shot">
        <img src="${src}" loading="lazy" decoding="async" width="1400" height="933" alt="${title}, photo ${i + 1} — placeholder" />
        <span class="pd-shot-n">${String(i + 1).padStart(2, "0")}</span>
      </li>`
      )
      .join("");
  });
}

// "More projects": three others, same category first
const more = $("[data-feat-grid]");
if (more) {
  const others = config.projects
    .filter((p) => p.id !== id)
    .sort((a, b) => (b.category === project?.category) - (a.category === project?.category))
    .slice(0, 3);
  onLang(() => (more.innerHTML = others.map((p) => cardHTML(p)).join("")));
}
