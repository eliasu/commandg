import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "./motion.ts";

/* The last words of the two hero lines trade places and back, in a loop
   ("was du willst" ↔ "was du brauchst"), while the hero is in view: letter
   by letter the old word rolls out of its mask, the new one follows (top line
   down, bottom line up, so the two meet). Runs on the .motion-word spans
   motion.ts splits the heading into. */
const heading = document.querySelector(".home-hero_heading .heading");

/* Splits el's text into letter spans. Separate spans lose the kerning, so
   each is shifted back to where it sat in the whole word. */
const split = (el: HTMLElement) => {
  const text = el.textContent!;
  el.textContent = text;
  const range = document.createRange();
  const lefts = text.split("").map((_, i) => {
    range.setStart(el.firstChild!, i);
    range.setEnd(el.firstChild!, i + 1);
    return range.getBoundingClientRect().left;
  });
  const spans = text.split("").map((char) => Object.assign(document.createElement("span"), { className: "home-hero_char", textContent: char }));
  el.replaceChildren(...spans);
  spans.forEach((span, i) => gsap.set(span, { x: lefts[i] - span.getBoundingClientRect().left }));
  return spans;
};

const roll = (word: HTMLElement, text: string, delay: number, dir: 1 | -1) => {
  const old = word.firstElementChild as HTMLElement;
  split(old);
  const next = Object.assign(document.createElement("span"), { className: "home-hero_next", textContent: text });
  word.append(next);
  const width = next.offsetWidth;
  split(next);
  const ease = "expo.inOut";
  // Top line from its last letter, bottom line from its first.
  const stagger = { each: 0.025, from: dir < 0 ? "end" : "start" } as const;
  gsap.timeline({
    delay,
    onComplete() {
      old.remove();
      next.className = "";
      next.textContent = text;
      gsap.set(word, { clearProps: "width" });
    },
  })
    .fromTo(word, { width: word.offsetWidth }, { width, duration: 1, ease }, 0)
    .to(old.children, { yPercent: -110 * dir, duration: 0.8, stagger, ease }, 0)
    .from(next.children, { yPercent: 110 * dir, duration: 0.8, stagger, ease }, 0.12);
};

if (heading && !reduced) {
  gsap.registerPlugin(ScrollTrigger);
  // Screen readers keep the resting sentence while the words move.
  heading.setAttribute("aria-label", heading.textContent!.replace(/\s+/g, " ").trim());

  const swap = () => {
    const words = heading.querySelectorAll<HTMLElement>(".motion-word");
    const a = heading.querySelector<HTMLElement>(".motion-first .motion-word:last-child");
    const b = words[words.length - 1];
    if (!a || !b || a === b) return;
    if (ScrollTrigger.isInViewport(heading)) {
      const [textA, textB] = [a.textContent!, b.textContent!];
      roll(a, textB, 0, -1);
      roll(b, textA, 0.15, 1);
    }
    gsap.delayedCall(3.2, swap);
  };
  // After the intro has set the heading.
  gsap.delayedCall(3, swap);
}
