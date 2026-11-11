// One underline per link group. It appears under the hovered link, glides to
// the next link when the pointer moves on, and fades out when the pointer
// leaves the group. Keyboard focus (focus-visible) drives it too.
export function initSlideUnderline(container, { selector = "a" } = {}) {
  if (!container) return;

  const line = document.createElement("span");
  line.className = "slide-line";
  line.setAttribute("aria-hidden", "true");
  container.append(line);

  let shown = false;

  function show(a) {
    const range = document.createRange();
    range.selectNodeContents(a);
    const text = range.getBoundingClientRect();
    if (!text.width) return;
    const box = container.getBoundingClientRect();

    if (!shown) line.classList.add("is-placing"); // first appearance: no glide from a stale spot
    line.style.setProperty("--x", `${text.left - box.left}px`);
    line.style.setProperty("--y", `${text.bottom - box.top + 2}px`);
    line.style.setProperty("--w", `${text.width}px`);
    if (!shown) {
      void line.offsetWidth;
      line.classList.remove("is-placing");
    }
    line.classList.add("is-on");
    shown = true;
  }

  function hide() {
    line.classList.remove("is-on");
    shown = false;
  }

  container.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse" || e.target === container) return; // gaps keep the line where it is
    const a = e.target.closest(selector);
    a && container.contains(a) ? show(a) : hide();
  });
  container.addEventListener("pointerleave", hide);

  container.addEventListener("focusin", (e) => {
    const a = e.target.closest(selector);
    if (a && e.target.matches(":focus-visible")) show(a);
  });
  container.addEventListener("focusout", (e) => {
    if (!container.contains(e.relatedTarget)) hide();
  });

  addEventListener("resize", hide);
}
