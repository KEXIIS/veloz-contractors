# Veloz Contractors — website demo

Multi-page site for Veloz Contractors (home remodeling, Hialeah FL).
Vite + vanilla JS, Motion for springs, GSAP ScrollTrigger only for the
sketch-to-kitchen section on the home page. EN/ES on every page.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in /dist
```

## Pages

| URL | What's on it |
| --- | --- |
| `/` | Hero (VELOZ wordmark over a photo), facts strip, sketch → finished kitchen, before/after slider, services, recent work, process teaser, reviews |
| `/projects/` | All projects with category filters (`?cat=kitchens` links straight to a filter) |
| `/projects/project.html?id=…` | One project: facts, photo, story, before/after (if there's a before photo), numbered gallery, matching Google review |
| `/process/` | How a job runs: 5 numbered steps with photos and real review quotes, emergency block |
| `/contact/` | Message form ("we'll stay in touch" tone), phone, Instagram DM, address, live open/closed badge |

Shared nav, footer and the mobile bottom bar live in `/partials` and are
stitched into every page at build time (`<!--@include nav-->` etc.).

## Swapping in real photos

All photos are **placeholders** from Unsplash, in `public/img/`. Replace a
file with a real Veloz photo **using the same filename** and nothing else
needs to change.

| File | Used for |
| --- | --- |
| `kitchen-hero.jpg` (1500px wide) + `kitchen-hero-900.jpg` (900px, phones) | Home hero — use a dark, warm kitchen shot; keep both sizes |
| `kitchen-before-1.jpg` / `kitchen-after-1.jpg` | Home before/after slider + "Two-tone kitchen" project — **must be the same room from the same angle** |
| `kitchen-after-2…4.jpg`, `bath-after-1…4.jpg`, `bath-before-1.jpg`, `closet-after-*.jpg`, `living-after-*.jpg`, `floor-after-*.jpg`, `coffee-bar-1.jpg`, `tile-work-1.jpg`, `repair-work-1.jpg`, `home-after-1.jpg` | Projects, services, process |

Their Instagram (@velozcontractors) is full of exactly the right material:
finished kitchens, LED-mirror bathrooms, closets, coffee stations, media
walls, plus before/after pairs. Ask the owner for the original files rather
than screenshotting Instagram (better quality, and it's their call to share).

Keep photos around 1400px wide and under ~300 KB (JPG, quality ~70) so the
site stays fast on phones.

## Swapping in real projects

`src/config.js` → `projects`. The 9 entries there are **samples** built from
the kinds of work on their Instagram. For each real job:

- `id` — URL-safe name, e.g. `"miami-lakes-kitchen"`
- `category` — one of `kitchens`, `bathrooms`, `wholehome`, `builtins`, `floors`, `repairs`
- `cover`, `gallery` — photo paths in `/img`
- `before` — optional; adds the drag-to-compare slider on the project page
- `review` — optional; id of a review in `reviews` that matches the job
- `title`, `scope`, `story` — each in `{ en, es }`

The first three projects in the list appear as "Recent work" on the home page.

## Placeholders to fill in (all in `src/config.js`)

- `business.email` — **TODO**, hidden on the site until filled in
- `contactEndpoint` — set to the Netlify function (see "Contact form email"
  below). In `npm run dev` the form runs in demo mode (success message,
  data logged to the console).
- `rating.url` — currently a Google Maps search for the business; swap for
  the exact Google reviews link when you have it.
- If the 4.8 / 105 reviews numbers change, update them in `config.js` **and**
  in the JSON-LD blocks in `index.html` and `contact/index.html`.

Everything else (name, address, phone, hours, Instagram, slogan "You dream
it, we build it.") is real, from their Google listing and Instagram bio.

## Text and languages

Every visible string is in `src/config.js` → `i18n.en` / `i18n.es`. Add a
key to **both**. Review quotes stay in their original English on purpose.

## Deploy

**Netlify:** build command `npm run build`, publish directory `dist`.
**Vercel:** framework preset "Vite", output `dist`.
Both serve `/projects/`, `/process/`, `/contact/` as folders automatically.

## Contact form email

The form is a Netlify Form (`name="contact"`). Netlify detects it on deploy
and stores every submission, photos included (up to 3, shrunk in the browser).

1. Deploy from the repo so Netlify builds the site.
2. Netlify → Forms → Form notifications → Add notification → Email, and enter
   the address that should receive requests.
3. Submissions also appear under Forms → contact. Spam is filtered by the
   honeypot field and Netlify's built-in filter.
