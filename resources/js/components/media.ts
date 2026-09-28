const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Slideshows advance only while on screen, and stay on their first image
   for anyone who asked for less motion. Videos likewise hold still. */
const visible = new WeakSet<Element>();
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
    if (entry.target instanceof HTMLVideoElement && !reduced) {
      if (entry.isIntersecting) entry.target.play().catch(() => {});
      else entry.target.pause();
    }
  }
});

// Videos in the endless strip are played by experiments.ts.
for (const video of document.querySelectorAll<HTMLVideoElement>(".media_inner > video:not(.experiments_list video)")) {
  if (reduced) {
    video.removeAttribute("autoplay");
    video.pause();
  } else observer.observe(video);
}

for (const show of document.querySelectorAll<HTMLElement>("[data-slideshow]")) {
  const slides = [...show.children] as HTMLElement[];
  if (reduced || slides.length < 2) continue;
  observer.observe(show);
  const interval = Number(show.dataset.interval) || 4000;
  // A transition longer than the image stands would never settle.
  show.style.setProperty("--_duration", `${Math.min(1200, interval * 0.8)}ms`);
  let current = 0;
  setInterval(() => {
    if (!visible.has(show) || document.hidden) return;
    const leaving = slides[current];
    current = (current + 1) % slides.length;
    const next = slides[current];
    // Parks every waiting slide on the right without a transition, so a slide
    // always enters from the same side and none crosses the frame backwards.
    for (const slide of slides) {
      slide.style.transition = "none";
      slide.classList.remove("is-leaving");
    }
    show.getBoundingClientRect();
    for (const slide of slides) slide.style.transition = "";
    leaving.classList.replace("is-active", "is-leaving");
    next.classList.add("is-active");
  }, interval);
}

/* object-fit: cover scales an image up whenever its box is taller than the
   image, but the browser picks from srcset by the box's width alone, so it
   loads a file far too small. Tell it the width actually drawn. */
const sizer = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) {
    const img = target as HTMLImageElement;
    const ratio = Number(img.getAttribute("width")) / Number(img.getAttribute("height"));
    if (!ratio || !contentRect.width) continue;
    img.sizes = `${Math.ceil(Math.max(contentRect.width, contentRect.height * ratio))}px`;
  }
});
for (const img of document.querySelectorAll(".media_inner img[srcset]")) sizer.observe(img);
