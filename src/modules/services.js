// Services - editorial numbered rows; each opens with a critically damped
// spring on height to show a photo and two lines. One open at a time.
import { config } from "../config.js";
import { t, onLang, getLang } from "./i18n.js";
import { springTo } from "./physics.js";

const KEY = { kitchens: "Kitchens", bathrooms: "Bathrooms", fullhome: "Fullhome", tile: "Tile", emergency: "Emergency" };

export function initServices({ reducedMotion = false } = {}) {
  const list = document.querySelector("[data-svc-list]");
  if (!list) return;

  const anims = new Map();

  function renderRows() {
    list.innerHTML = config.services
      .map((s, i) => {
        const k = KEY[s.id];
        return `
      <li class="svc-row" data-row="${s.id}">
        <button type="button" class="svc-btn" aria-expanded="false" aria-controls="svc-p-${s.id}">
          <span class="svc-no">0${i + 1}</span>
          <span class="svc-name">${t("svc" + k + "Name")}</span>
          <span class="svc-x" aria-hidden="true"></span>
        </button>
        <div class="svc-panel" id="svc-p-${s.id}">
          <div class="svc-inner">
            <figure class="svc-photo">
              <img src="${s.photo}" loading="lazy" decoding="async" width="1200" height="750"
                   alt="${t("svc" + k + "Name")}, placeholder photo, swap for a Veloz project" />
            </figure>
            <div class="svc-lines">
              <p>${t("svc" + k + "Line1")}</p>
              <p>${t("svc" + k + "Line2")}</p>
            </div>
          </div>
        </div>
      </li>`;
      })
      .join("");

    list.querySelectorAll(".svc-row").forEach((row) => {
      const btn = row.querySelector(".svc-btn");
      btn.addEventListener("click", () => toggle(row));
    });
  }

  function animateHeight(row, panel, to) {
    anims.get(row)?.stop();
    if (reducedMotion) {
      panel.style.height = to === "auto" ? "auto" : "0px";
      return;
    }
    const from = panel.getBoundingClientRect().height; // live on-screen value
    const target = to === "auto" ? row.querySelector(".svc-inner").getBoundingClientRect().height : 0;
    const a = springTo(from, target, {
      response: 0.5,
      onUpdate: (h) => (panel.style.height = h + "px"),
      onComplete: () => { if (to === "auto") panel.style.height = "auto"; },
    });
    anims.set(row, a);
  }

  function toggle(row) {
    const open = row.classList.contains("is-open");
    // close any other open row
    list.querySelectorAll(".svc-row.is-open").forEach((other) => {
      if (other !== row) {
        other.classList.remove("is-open");
        other.querySelector(".svc-btn").setAttribute("aria-expanded", "false");
        animateHeight(other, other.querySelector(".svc-panel"), 0);
      }
    });
    row.classList.toggle("is-open", !open);
    row.querySelector(".svc-btn").setAttribute("aria-expanded", String(!open));
    animateHeight(row, row.querySelector(".svc-panel"), open ? 0 : "auto");
  }

  onLang(() => renderRows());
}
