import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/* Hooks: .motion-words (words rise on load, a .motion-first part inside
   first; then .motion-fade (dims on scroll), on-screen .motion-up, the nav, on-screen media), .motion-scrub (words brighten
   while scrolling), .motion-up, .motion-clip (builds up with the scroll
   position and back down when scrolled back; media already on screen at load
   builds up once, on its own). Nothing moves for prefers-reduced-motion. */
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const clips = new WeakMap<Element, gsap.core.Timeline>();
// Media on screen at load joins it; created here so experiments.ts's clones can too.
export const intro = gsap.timeline({ delay: 0.05 });
// Both axes: media above the fold or beyond the strip's edge mustn't take a stagger slot.
const onScreen = (el: Element) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return top < innerHeight && bottom > 0 && left < innerWidth && right > 0;
};
let shown = 0;

/* Clip reveal decided by where the element sits at load: on screen it
   builds up once as part of the intro, below it follows the scroll. Hero
   media below it builds up once, at its own pace, when it comes into view. */
export function revealClip(el: Element) {
  const visible = onScreen(el);
  const triggered = !visible && !!el.closest(".home-hero_wrap");
  clipReveal(el, visible || triggered);
  const timeline = clips.get(el)!;
  // Restored mid-page, the hero isn't in view: nothing to wait for.
  if (visible) intro.add(timeline, scrollY > 0 ? shown++ * 0.12 : `media+=${shown++ * 0.12}`);
  if (triggered) {
    timeline.pause();
    ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => timeline.play() });
  }
}

export function clipReveal(el: Element, onScreen = false) {
  // Tied to the scroll, an expo curve packs the whole build into a sliver
  // of the scroll distance; a gentle curve spreads it over the range.
  const timeline = gsap.timeline(
    onScreen
      ? {}
      : { defaults: { ease: "power1.inOut" }, scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: 2.5 } },
  );
  timeline
    .fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ...(onScreen && { ease: "power4.inOut", duration: 1.3 }) })
    .fromTo(el.firstElementChild, { scale: 1.3 }, { scale: 1, duration: 1.6, ...(onScreen && { ease: "expo.out", duration: 1.8 }) }, 0);
  clips.set(el, timeline);
}

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out" });

  // The browser restores the scroll position on reload only after this runs,
  // so every "on screen?" check below would see the top of the page.
  history.scrollRestoration = "manual";
  const key = `scroll:${location.pathname}`;
  addEventListener("pagehide", () => sessionStorage.setItem(key, String(scrollY)));
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!location.hash && (navigation?.type === "reload" || navigation?.type === "back_forward")) {
    scrollTo({ top: Number(sessionStorage.getItem(key)) || 0, behavior: "instant" });
  }

  const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -80 } });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const splitWords = (root: Element) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const parts = (node.textContent ?? "").split(/(\s+)/);
      node.replaceWith(
        ...parts.map((part) => {
          if (!part.trim()) return part;
          const word = document.createElement("span");
          word.className = "motion-word";
          word.append(Object.assign(document.createElement("span"), { textContent: part }));
          return word;
        }),
      );
    }
    return root.querySelectorAll(".motion-word > span");
  };

  const reveal = (trigger: Element) => ({ trigger, start: "top 90%" });

  // Cinematic, but done in about two seconds: the heading tilts up out of
  // its mask, the text brightens word by word, then nav and media follow.
  const rise = { yPercent: 105, rotate: 4, transformOrigin: "0% 100%", duration: 1.1, ease: "expo.out" };
  for (const el of document.querySelectorAll(".motion-words")) {
    const words = [...splitWords(el)];
    const first = words.filter((word) => word.closest(".motion-first"));
    const rest = words.filter((word) => !first.includes(word));
    if (first.length) intro.from(first, { ...rise, stagger: 0.04 }, 0);
    intro.from(rest, { ...rise, stagger: 0.04 }, first.length ? 0.3 : 0);
  }
  intro.addLabel("chrome", Math.min(intro.duration(), 0.55));

  for (const el of document.querySelectorAll(".motion-scrub")) {
    gsap.fromTo(splitWords(el), { opacity: 0.15 }, {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: 0.6 },
    });
  }

  for (const el of document.querySelectorAll(".motion-up")) {
    if (onScreen(el)) intro.from(el, { opacity: 0, y: 16, duration: 1.1, ease: "power3.out" }, "chrome");
    else gsap.from(el, { opacity: 0, y: 20, duration: 1.2, scrollTrigger: reveal(el) });
  }
  // .motion-fade: the words fade in one after another like .motion-scrub,
  // but on load, and dim again in the same order as the text scrolls away.
  for (const el of document.querySelectorAll(".motion-fade")) {
    const words = splitWords(el);
    intro.fromTo(words, { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.035, ease: "power1.out" }, "chrome-=0.15");
    // On the outer word spans, so it never fights the load fade inside.
    gsap.fromTo(el.querySelectorAll(".motion-word"), { opacity: 1 }, {
      opacity: 0.15,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "clamp(top 60%)", end: "bottom 15%", scrub: 0.6 },
    });
  }
  intro.from(".nav_wrap", { opacity: 0, y: -12, duration: 1 }, "chrome+=0.2");
  intro.addLabel("media", "chrome+=0.35");

  for (const el of document.querySelectorAll<HTMLElement>(".motion-clip")) {
    if (el.offsetParent !== null) revealClip(el);
  }



  // Opening a <details> changes the page height.
  document.addEventListener("toggle", () => setTimeout(() => ScrollTrigger.refresh(), 400), true);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
