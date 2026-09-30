const logo = document.querySelector<HTMLElement>(".nav_logo");
const current = logo?.querySelector<HTMLElement>(".nav_current");
const labels = [...document.querySelectorAll<HTMLElement>(".labeled_label, [data-nav-label]")];

if (logo && current && labels.length) {
  const nav = logo.closest<HTMLElement>(".nav_wrap") ?? logo;
  const brand = logo.querySelector<HTMLElement>(".nav_brand:not(.nav_current)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let index = -1;
  let queued = false;

  const update = () => {
    queued = false;
    const edge = nav.getBoundingClientRect().bottom;
    let next = -1;
    labels.forEach((label, i) => {
      // A data-nav-label section (Kontakt) may end the page before it reaches
      // the nav, so it counts from a quarter of the viewport down.
      const line = label.dataset.navLabel ? Math.max(edge, innerHeight * 0.25) : edge;
      if (label.getBoundingClientRect().top <= line) next = i;
    });
    if (next === index) return;

    const down = next > index;
    index = next;
    current.textContent = next < 0 ? "" : (labels[next].dataset.navLabel ?? labels[next].textContent?.trim() ?? "");
    logo.classList.toggle("is-section", next >= 0);

    const shown = next < 0 ? brand : current;
    if (shown && !reduce.matches) {
      shown.animate(
        [{ transform: `translateY(${down ? "" : "-"}60%)`, opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  };

  const queue = () => {
    if (!queued) requestAnimationFrame(update);
    queued = true;
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  update();
}
