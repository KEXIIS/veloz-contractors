// Marks the stretch of a review quote that carries the point, so a skim reads
// well. Quotes stay verbatim; only a <strong> wraps existing words.
const PHRASES = {
  sandra: ["amazing job on my kitchen", "Great communication"],
  dayamanti: ["Within just 2 hours"],
  katerina: ["quick to respond", "only took 24 hours"],
  steven: ["met my deadline before the date"],
  adam: ["Good quality and professional work", "keeping the client informed"],
  alexa: ["very professional and very trust worthy", "clean and neat"],
};

const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function highlightedQuote(review) {
  const hits = (PHRASES[review.id] || [])
    .map((phrase) => ({ start: review.quote.indexOf(phrase), phrase }))
    .filter(({ start }) => start >= 0)
    .sort((a, b) => a.start - b.start);
  if (!hits.length) return esc(review.quote);
  const from = hits[0].start;
  const last = hits[hits.length - 1];
  const to = last.start + last.phrase.length;
  return (
    esc(review.quote.slice(0, from)) +
    `<strong class="review-highlight">${esc(review.quote.slice(from, to))}</strong>` +
    esc(review.quote.slice(to))
  );
}
