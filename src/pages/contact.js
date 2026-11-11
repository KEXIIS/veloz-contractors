import { boot } from "../common.js";
import { t, onLang } from "../modules/i18n.js";
import { initForm } from "../modules/form.js";

boot();
initForm();

const follow = document.querySelector("[data-follow]");
if (follow) onLang(() => (follow.textContent = t("ctFollow")));
