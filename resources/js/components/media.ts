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

/* Copies of one item (the endless strip's clones, `data-copy`) stay in
   step: a video coming into view takes over the time of the copy last
   played, so the swap at the strip's seam doesn't show. */
const twins = new WeakMap<HTMLVideoElement, { lead?: HTMLVideoElement }>();
const groups = new Map<string, { lead?: HTMLVideoElement }>();
for (const item of document.querySelectorAll<HTMLElement>("[data-copy]"))
  item.querySelectorAll("video").forEach((video, i) => {
    const key = `${item.dataset.copy}:${i}`;
    if (!groups.has(key)) groups.set(key, {});
    twins.set(video, groups.get(key)!);
  });

const play = (video: HTMLVideoElement) => {
  const group = twins.get(video);
  if (group) {
    const lead = group.lead;
    if (lead && lead !== video && Math.abs(lead.currentTime - video.currentTime) > 0.1) video.currentTime = lead.currentTime;
    group.lead = video;
  }
  video.play().catch(() => {});
};

for (const video of document.querySelectorAll<HTMLVideoElement>(".media_inner > video")) {
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
   after the interval like an image. Copies of one item run as one
   slideshow, on screen while any of them is. */
const shows = new Map<unknown, HTMLElement[]>();
for (const show of document.querySelectorAll<HTMLElement>("[data-slideshow]")) {
  const key = show.closest<HTMLElement>("[data-copy]")?.dataset.copy ?? show;
  shows.set(key, [...(shows.get(key) ?? []), show]);
}
for (const copies of shows.values()) {
  const [show] = copies;
  const decks = copies.map((copy) => [...copy.children] as HTMLElement[]);
  const count = decks[0].length;
  if (reduced || count < 2) continue;
  const interval = Math.max(100, Number(show.dataset.interval) || 4000);
  const toEnd = "videoEnd" in show.dataset;
  const videoOf = (slide: HTMLElement) => slide.querySelector("video");
  // A transition longer than the image stands would never settle.
  for (const copy of copies) copy.style.setProperty("--_duration", `${Math.min(1200, interval * 0.8)}ms`);
  let current = 0;
  let timer = 0;

  const schedule = () => {
    clearTimeout(timer);
    copies.forEach((copy, i) => {
      const video = videoOf(decks[i][current]);
      if (video && visible.has(copy)) play(video);
    });
    if (!(videoOf(decks[0][current]) && toEnd)) timer = setTimeout(tick, interval);
  };

  const advance = () => {
    const next = (current + 1) % count;
    for (const slides of decks) {
      const leaving = slides[current];
      videoOf(leaving)?.pause();
      const video = videoOf(slides[next]);
      if (video) video.currentTime = 0;
      // Parks every waiting slide on its entry side without a transition, so a
      // slide always enters from the same side and none crosses the frame backwards.
      for (const slide of slides) {
        slide.style.transition = "none";
        slide.classList.remove("is-leaving");
      }
      leaving.getBoundingClientRect();
      for (const slide of slides) slide.style.transition = "";
      leaving.classList.replace("is-active", "is-leaving");
      slides[next].classList.add("is-active");
    }
    current = next;
    schedule();
  };

  // Off screen or in a hidden tab, the slide waits and checks again.
  const tick = () =>
    copies.some((copy) => visible.has(copy)) && !document.hidden ? advance() : (timer = setTimeout(tick, interval));

  copies.forEach((copy, i) => {
    decks[i].forEach((slide, index) => {
      const video = videoOf(slide);
      if (!video) return;
      video.loop = !toEnd;
      // A file that fails to load mustn't hold the slideshow.
      for (const type of ["ended", "error"]) video.addEventListener(type, () => index === current && advance());
    });
    onVisible.set(copy, (isVisible) => {
      const video = videoOf(decks[i][current]);
      if (video) isVisible ? play(video) : video.pause();
    });
    observer.observe(copy);
  });
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
