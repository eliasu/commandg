import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clipReveal, reduced } from "./motion.ts";

gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger);

/* Endless strip: the items are cloned until one set can wrap around
   without a gap. Its offset is the scroll drift plus the drag, wrapped to
   one set's width. Runs before media.ts, so the clones' slideshows start
   like the originals. A copy sliding in must already show a picture, so
   images load eagerly and every video plays while the strip is on screen
   (media.ts would only start it once it is in view: a black frame). */
for (const viewport of document.querySelectorAll<HTMLElement>(".experiments_viewport")) {
  const list = viewport.querySelector<HTMLElement>(".experiments_list")!;
  const originals = [...list.children] as HTMLElement[];
  if (!originals.length) continue;
  for (const img of list.querySelectorAll("img")) img.loading = "eager";
  // Slideshow videos are played one at a time by media.ts.
  const strip = "video:not(.media_slide video)";
  for (const video of list.querySelectorAll<HTMLVideoElement>(strip)) video.preload = "auto";

  const setWidth = () => {
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    return originals.reduce((sum, item) => sum + item.offsetWidth + gap, 0);
  };
  const copies = Math.ceil(viewport.clientWidth / setWidth()) + 1;
  for (let i = 0; i < copies; i++) {
    for (const item of originals) {
      const clone = item.cloneNode(true) as HTMLElement;
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      list.append(clone);
      // motion.ts ran first: the clone copied the original's unrevealed
      // inline styles but not its timeline, so it gets its own.
      for (const media of clone.querySelectorAll(".motion-clip")) {
        gsap.set([media, media.firstElementChild], { clearProps: "clipPath,scale" });
        if (!reduced) clipReveal(media);
      }
    }
  }

  let width = setWidth();
  let drift = 0;
  const proxy = document.createElement("div");
  const render = () => gsap.set(list, { x: gsap.utils.wrap(-width, 0, drift + Number(gsap.getProperty(proxy, "x"))) });

  Draggable.create(proxy, {
    trigger: viewport,
    type: "x",
    inertia: !reduced,
    dragClickables: true,
    onDrag: render,
    onThrowUpdate: render,
  });

  if (!reduced) {
    ScrollTrigger.create({
      trigger: viewport,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        drift = -self.progress * width * 0.4;
        render();
      },
    });
  }

  const videos = list.querySelectorAll<HTMLVideoElement>(strip);
  if (reduced) for (const video of videos) video.removeAttribute("autoplay"), video.pause();
  else
    new IntersectionObserver(([entry]) => {
      for (const video of videos) entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }).observe(viewport);

  addEventListener("resize", () => {
    width = setWidth();
    render();
  });
  render();
}
