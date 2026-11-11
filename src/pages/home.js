import { boot, reducedMotion } from "../common.js";
import { config } from "../config.js";
import { onLang } from "../modules/i18n.js";
import { cardHTML } from "../modules/cards.js";
import { fitWordmark } from "../modules/fit-text.js";
import { initSketch } from "../modules/sketch.js";
import { initSlider } from "../modules/slider.js";
import { initServices } from "../modules/services.js";
import { initReviews } from "../modules/reviews.js";

boot();
fitWordmark();
initServices({ reducedMotion });
initReviews({ reducedMotion });
initSlider({ reducedMotion });

// "Recent work": first three sample projects
const feat = document.querySelector("[data-feat-grid]");
if (feat) onLang(() => (feat.innerHTML = config.projects.slice(0, 3).map((p) => cardHTML(p)).join("")));

initSketch({ reducedMotion }); // last: pins after everything above has its final height
