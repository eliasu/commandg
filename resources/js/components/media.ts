const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Slideshows advance only while on screen, and stay on their first slide
   for anyone who asked for less motion. Videos likewise hold still. */
const visible = new WeakSet<Element>();
const onVisible = new WeakMap<Element, (isVisible: boolean) => void>();
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
    onVisible.get(entry.target)?.(entry.isIntersecting);
  }
});

const play = (video: HTMLVideoElement) => video.play().catch(() => {});

// Videos in the endless strip are played by experiments.ts.
for (const video of document.querySelectorAll<HTMLVideoElement>(".media_inner > video:not(.experiments_list video)")) {
  if (reduced) {
    video.removeAttribute("autoplay");
    video.pause();
  } else {
    onVisible.set(video, (isVisible) => (isVisible ? play(video) : video.pause()));
    observer.observe(video);
  }
}

/* Only the active slide's video loads and plays. With `data-video-end` a
   video slide stays until its video ends; otherwise it loops and leaves
   after the interval like an image. */
for (const show of document.querySelectorAll<HTMLElement>("[data-slideshow]")) {
  const slides = [...show.children] as HTMLElement[];
  if (reduced || slides.length < 2) continue;
  const interval = Math.max(100, Number(show.dataset.interval) || 4000);
  const toEnd = "videoEnd" in show.dataset;
  const videoOf = (slide: HTMLElement) => slide.querySelector("video");
  // A transition longer than the image stands would never settle.
  show.style.setProperty("--_duration", `${Math.min(1200, interval * 0.8)}ms`);
  let current = 0;
  let timer = 0;

  const schedule = () => {
    clearTimeout(timer);
    const video = videoOf(slides[current]);
    if (video && visible.has(show)) play(video);
    if (!(video && toEnd)) timer = setTimeout(tick, interval);
  };

  const advance = () => {
    const leaving = slides[current];
    videoOf(leaving)?.pause();
    current = (current + 1) % slides.length;
    const next = slides[current];
    const video = videoOf(next);
    if (video) video.currentTime = 0;
    // Parks every waiting slide on its entry side without a transition, so a
    // slide always enters from the same side and none crosses the frame backwards.
    for (const slide of slides) {
      slide.style.transition = "none";
      slide.classList.remove("is-leaving");
    }
    show.getBoundingClientRect();
    for (const slide of slides) slide.style.transition = "";
    leaving.classList.replace("is-active", "is-leaving");
    next.classList.add("is-active");
    schedule();
  };

  // Off screen or in a hidden tab, the slide waits and checks again.
  const tick = () => (visible.has(show) && !document.hidden ? advance() : (timer = setTimeout(tick, interval)));

  for (const slide of slides) {
    const video = videoOf(slide);
    if (!video) continue;
    video.loop = !toEnd;
    // A file that fails to load mustn't hold the slideshow.
    for (const type of ["ended", "error"]) video.addEventListener(type, () => slide === slides[current] && advance());
  }

  onVisible.set(show, (isVisible) => {
    const video = videoOf(slides[current]);
    if (video) isVisible ? play(video) : video.pause();
  });
  observer.observe(show);
  schedule();
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
