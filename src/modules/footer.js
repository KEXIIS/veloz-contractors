// Footer: hours table with today highlighted and a live Open/Closed badge
// computed in Miami time (America/New_York), whatever clock the visitor has.
import { config } from "../config.js";
import { t, onLang, getLang } from "./i18n.js";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WD = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };

function miamiNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: config.business.timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return { day: WD[get("weekday")], mins: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMins = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function fmt(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const am = h < 12;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

export function renderOpenBadge() {
  document.querySelectorAll("[data-open-badge]").forEach((badge) => {
    const text = badge.querySelector("[data-open-text]");
    if (text) fillBadge(badge, text);
  });
}

function fillBadge(badge, text) {
  const now = miamiNow();
  const today = config.business.hours[now.day];
  const open = today && now.mins >= toMins(today.open) && now.mins < toMins(today.close);

  badge.classList.toggle("is-closed", !open);
  if (open) {
    text.textContent = `${t("openNow")} · ${t("closesAt", { time: fmt(today.close) })}`;
    return;
  }
  for (let i = 0; i < 8; i++) {
    const idx = (DAYS.indexOf(now.day) + i) % 7;
    const h = config.business.hours[DAYS[idx]];
    if (!h) continue;
    if (i === 0 && now.mins >= toMins(h.open)) continue;
    const dayName = t("day" + DAYS[idx][0].toUpperCase() + DAYS[idx].slice(1));
    text.textContent = `${t("closedNow")} · ${t("opensAt", { day: i === 0 ? "" : dayName, time: fmt(h.open) })}`
      .replace(/\s+/g, " ");
    return;
  }
  text.textContent = t("closedNow");
}

export function initFooter() {
  onLang(() => {
    const tbody = document.querySelector("[data-hours]");
    if (tbody) {
      const today = miamiNow().day;
      const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      tbody.innerHTML = order
        .map((d) => {
          const h = config.business.hours[d];
          const label = t("day" + d[0].toUpperCase() + d.slice(1));
          const val = h ? `${fmt(h.open)}–${fmt(h.close)}` : t("closed");
          return `<tr${d === today ? ' class="today"' : ""}><td>${label}</td><td>${val}</td></tr>`;
        })
        .join("");
    }
    renderOpenBadge();
  });

  // placeholder: only show the email once a real one exists in config
  const { email } = config.business;
  const mail = document.querySelector("[data-mail]");
  if (mail && email) {
    mail.hidden = false;
    mail.href = `mailto:${email}`;
    mail.textContent = email;
  }

  setInterval(renderOpenBadge, 60_000);
}
