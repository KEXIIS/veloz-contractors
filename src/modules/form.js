// Contact form: inline validation (checked when a field is left, cleared live
// once fixed), selects + "how did you find us" chips per language, photo
// picker, warm "we'll stay in touch" success state that can be reopened.
// Submits to Netlify Forms (emailed from the Netlify dashboard); in `npm run
// dev` there is no Netlify, so it runs in demo mode.
import { t, onLang } from "./i18n.js";

const RULES = {
  name: (f) => (f.value.trim() ? "" : "fErrName"),
  phone: (f) => (f.value.replace(/\D/g, "").length >= 7 ? "" : "fErrPhone"),
  type: (f) => (f.value ? "" : "fErrType"),
};

const TYPES = ["Kitchens", "Bathrooms", "Fullhome", "Builtins", "Tile", "Emergency"];
const WHEN = ["Asap", "13", "36", "Planning"];
const HEARD = ["Ig", "Google", "Friend", "Job", "Other"];

// the email is read in English whatever language the visitor used
const LABELS = {
  type: { kitchens: "Kitchen", bathrooms: "Bathroom", fullhome: "Full remodel", builtins: "Closet / built-ins", tile: "Tile / flooring", emergency: "Emergency repair", other: "Something else" },
  when: { asap: "As soon as possible", "13": "In the next 1-3 months", "36": "In 3-6 months", planning: "Just planning for now" },
  heard: { ig: "Instagram", google: "Google", friend: "A friend or neighbor", job: "Saw one of our jobs", other: "Other" },
};
const MAX_PHOTOS = 3;

async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function initForm() {
  const form = document.querySelector("[data-qform]");
  if (!form) return;

  const submitBtn = form.querySelector("[data-submit]");
  const success = form.querySelector("[data-success]");
  const successText = form.querySelector("[data-success-text]");
  const editBtn = form.querySelector("[data-edit]");
  const typeSel = form.querySelector("[data-type-select]");
  const whenSel = form.querySelector("[data-when-select]");
  const chips = form.querySelector("[data-heard-chips]");
  const photos = form.querySelector("#qf-photos");
  const photosList = form.querySelector("[data-photos-list]");
  const rows = () => form.querySelectorAll(".f-row, .f-pair, .f-submit");
  let sentName = null;
  const shown = new Set();

  const errEl = (name) => form.querySelector(`[data-err="${name}"]`);
  function setError(name, key) {
    const el = errEl(name);
    const field = form.elements[name];
    const msg = key ? t(key) : "";
    if (el) {
      el.textContent = msg;
      el.hidden = !msg;
      el.id = `qerr-${name}`;
    }
    if (field?.setAttribute) {
      if (msg) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", `qerr-${name}`);
        shown.add(name);
      } else {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
        shown.delete(name);
      }
    }
  }
  function check(name) {
    const key = RULES[name](form.elements[name]);
    setError(name, key);
    return !key;
  }

  // language-dependent options
  onLang(() => {
    const prevType = typeSel.value;
    typeSel.innerHTML =
      `<option value="" disabled ${prevType ? "" : "selected"} hidden></option>` +
      TYPES.map((k) => `<option value="${k.toLowerCase()}">${t("fType" + k)}</option>`).join("") +
      `<option value="other">${t("fTypeOther")}</option>`;
    if (prevType) typeSel.value = prevType;

    if (whenSel) {
      const prevWhen = whenSel.value;
      whenSel.innerHTML = WHEN.map((k) => `<option value="${k.toLowerCase()}">${t("fWhen" + k)}</option>`).join("");
      if (prevWhen) whenSel.value = prevWhen;
    }

    if (chips) {
      const prevHeard = chips.querySelector("input:checked")?.value;
      chips.innerHTML = HEARD.map(
        (k) => `
        <label class="f-chip">
          <input type="radio" name="heard" value="${k.toLowerCase()}" ${prevHeard === k.toLowerCase() ? "checked" : ""}>
          <span>${t("fHeard" + k)}</span>
        </label>`
      ).join("");
    }

    if (sentName && !success.hidden) successText.textContent = t("fSuccess", { name: sentName });
    [...shown].forEach(check);
    if (!photos.files.length) photosList.textContent = t("fPhotosNone");
  });

  photos.addEventListener("change", () => {
    const names = [...photos.files].map((f) => f.name);
    photosList.textContent = names.length ? names.join(", ") : t("fPhotosNone");
  });

  Object.keys(RULES).forEach((name) => {
    const field = form.elements[name];
    field.addEventListener("blur", () => { if (field.value.trim() || shown.has(name)) check(name); });
    const live = () => shown.has(name) && check(name);
    field.addEventListener("input", live);
    field.addEventListener("change", live);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("global", "");
    const bad = Object.keys(RULES).filter((n) => !check(n));
    if (bad.length) { form.elements[bad[0]].focus(); return; }

    // reCAPTCHA (production only; Netlify injects window.grecaptcha + the widget)
    let captchaToken = "";
    if (!import.meta.env.DEV && window.grecaptcha) {
      captchaToken = window.grecaptcha.getResponse();
      if (!captchaToken) { setError("global", "fErrCaptcha"); return; }
    }

    const data = new FormData(form);
    submitBtn.disabled = true;
    const label = submitBtn.querySelector("span");
    label.textContent = t("fSending");

    try {
      if (!import.meta.env.DEV) {
        for (const k of ["type", "when", "heard"]) {
          const v = data.get(k);
          if (v) data.set(k, LABELS[k][v] || v);
        }
        if (captchaToken) data.set("g-recaptcha-response", captchaToken);
        // phone photos are huge; shrink them (Netlify takes one file per field)
        const shrunk = await Promise.all([...photos.files].slice(0, MAX_PHOTOS).map(shrink));
        data.delete("photos");
        shrunk.forEach((file, i) => data.set("photo" + (i + 1), file, file.name));
        const res = await fetch(form.getAttribute("action"), { method: "POST", body: data });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        window.grecaptcha?.reset?.();
      } else {
        await new Promise((r) => setTimeout(r, 900));
        console.info("[contact] demo mode (dev only). Data:",
          Object.fromEntries([...data.entries()].map(([k, v]) => [k, v instanceof File ? v.name : v])));
      }
      sentName = data.get("name").trim().split(/\s+/)[0];
      rows().forEach((el) => (el.hidden = true));
      successText.textContent = t("fSuccess", { name: sentName });
      success.hidden = false;
      success.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      success.setAttribute("tabindex", "-1");
      success.focus({ preventScroll: true });
    } catch (err) {
      console.error("[contact]", err);
      setError("global", "fErrSend");
    } finally {
      submitBtn.disabled = false;
      label.textContent = t("fSubmit");
    }
  });

  editBtn?.addEventListener("click", () => {
    success.hidden = true;
    sentName = null;
    rows().forEach((el) => (el.hidden = false));
    form.elements.name.focus();
  });
}
