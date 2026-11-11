// EN/ES — fills [data-i18n], [data-i18n-ph], [data-i18n-label]; modules
// subscribe with onLang to re-render what they own. The choice is remembered
// across pages.
import { config } from "../config.js";

const KEY = "veloz-lang";
let current = null;
const subs = [];

const baseSubs = () => ({
  phone: config.business.phoneDisplay,
  name: config.business.name,
  handle: config.business.instagramHandle,
});

export function t(key, extra = {}) {
  const dict = config.i18n[current] || config.i18n[config.defaultLanguage];
  const s = dict[key];
  if (s === undefined) {
    console.warn(`[i18n] missing key "${key}" for "${current}"`);
    return key;
  }
  const all = { ...baseSubs(), ...extra };
  return s.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
}

export const getLang = () => current;

/** Pick the right language from an {en, es} object. */
export const pick = (obj) => (obj ? obj[current] ?? obj[config.defaultLanguage] : "");

export function onLang(fn) {
  subs.push(fn);
  if (current) fn(current);
}

/** Title + meta description for the current page (project pages pass vars). */
export function setSeo(page, vars = {}) {
  const entry = config.seo[page]?.[current];
  if (!entry) return;
  const fill = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  document.title = fill(entry[0]);
  document.querySelector('meta[name="description"]')?.setAttribute("content", fill(entry[1]));
}

export function setLang(lang) {
  if (!config.languages.includes(lang)) lang = config.defaultLanguage;
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch {}

  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll("[data-i18n-label]").forEach((el) =>
    el.setAttribute("aria-label", t(el.dataset.i18nLabel))
  );

  const page = document.body.dataset.page || "home";
  if (!document.querySelector("[data-pd]")) setSeo(page);

  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
  );

  subs.forEach((fn) => fn(lang));
}

export function initI18n() {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  const nav = (navigator.language || "").slice(0, 2);
  const initial = config.languages.includes(saved)
    ? saved
    : config.languages.includes(nav)
      ? nav
      : config.defaultLanguage;

  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang))
  );
  setLang(initial);
}
