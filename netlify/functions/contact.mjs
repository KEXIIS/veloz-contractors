// Contact form -> email. Needs two env vars in Netlify (Site settings > Environment variables):
//   RESEND_API_KEY   API key from resend.com
//   CONTACT_TO       where the leads go (comma-separate for several addresses)
// Optional: CONTACT_FROM, e.g. "Veloz Website <leads@yourdomain.com>" (domain verified in Resend).

const TYPES = {
  kitchens: "Kitchen",
  bathrooms: "Bathroom",
  fullhome: "Full remodel",
  builtins: "Closet / built-ins",
  tile: "Tile / flooring",
  emergency: "Emergency repair",
  other: "Something else",
};
const WHEN = { asap: "As soon as possible", "13": "In the next 1-3 months", "36": "In 3-6 months", planning: "Just planning for now" };
const HEARD = { ig: "Instagram", google: "Google", friend: "A friend or neighbor", job: "Saw one of our jobs", other: "Other" };

const MAX_FILES = 6;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clean = (v, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function miamiNow() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date());
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.CONTACT_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || !to.length) return json(500, { error: "Email is not configured" });

  let form;
  try { form = await req.formData(); } catch { return json(400, { error: "Bad request" }); }

  if (clean(form.get("website"))) return json(200, { ok: true }); // honeypot: bots fill it, people never see it

  const name = clean(form.get("name"), 120);
  const phone = clean(form.get("phone"), 40);
  const email = clean(form.get("email"), 160);
  const typeKey = clean(form.get("type"), 40);
  const message = clean(form.get("description"));
  if (!name || phone.replace(/\D/g, "").length < 7 || !typeKey) return json(400, { error: "Missing fields" });

  const project = TYPES[typeKey] || typeKey;
  const when = WHEN[clean(form.get("when"), 20)] || "";
  const where = clean(form.get("where"), 160);
  const heard = HEARD[clean(form.get("heard"), 20)] || "";
  const submitted = miamiNow();

  const files = form.getAll("photos").filter((f) => f && typeof f === "object" && f.size > 0 && f.type.startsWith("image/"));
  if (files.length > MAX_FILES || files.some((f) => f.size > MAX_FILE_BYTES)) return json(413, { error: "Photos too large" });
  const attachments = [];
  for (const f of files) {
    attachments.push({
      filename: (f.name || "photo.jpg").replace(/[^\w.\- ]/g, "_"),
      content: Buffer.from(await f.arrayBuffer()).toString("base64"),
    });
  }

  const photoLine = attachments.length ? `attached (${attachments.length})` : "none";
  const telHref = "tel:+1" + phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

  const extras = [
    email && ["Email", email],
    when && ["Start", when],
    where && ["Area", where],
    heard && ["Found us via", heard],
  ].filter(Boolean);

  const text = [
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Project: ${project}`,
    `Message: ${message || "-"}`,
    `Photo: ${photoLine}`,
    ...extras.map(([k, v]) => `${k}: ${v}`),
    "",
    `Submitted: ${submitted} (Miami)`,
  ].join("\n");

  const row = (k, v) => `<tr><td style="padding:4px 14px 4px 0;color:#666;vertical-align:top;white-space:nowrap">${k}:</td><td style="padding:4px 0">${v}</td></tr>`;
  const html = `<div style="font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#141414">
<table style="border-collapse:collapse">
${row("Name", `<strong>${esc(name)}</strong>`)}
${row("Phone", `<a href="${esc(telHref)}" style="color:#2C5F2D;font-weight:600">${esc(phone)}</a> <span style="color:#888">(tap to call)</span>`)}
${row("Project", esc(project))}
${row("Message", esc(message || "-").replace(/\n/g, "<br>"))}
${row("Photo", esc(photoLine))}
${extras.map(([k, v]) => row(esc(k), k === "Email" ? `<a href="mailto:${esc(v)}">${esc(v)}</a>` : esc(v))).join("\n")}
</table>
<p style="margin:18px 0 0;color:#666">Submitted: ${esc(submitted)} (Miami)</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Veloz Website <onboarding@resend.dev>",
      to,
      subject: `New request: ${project} - ${name}`,
      text,
      html,
      ...(email && /^\S+@\S+\.\S+$/.test(email) ? { reply_to: email } : {}),
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  if (!res.ok) {
    console.error("resend failed", res.status, await res.text());
    return json(502, { error: "Could not send" });
  }
  return json(200, { ok: true });
};
