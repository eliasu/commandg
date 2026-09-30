import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "./motion.ts";

/* The hand beside the contact text (home-contact.css) waves every few
   seconds, swinging about the forearm, at 8 fps like the hero heads. */
const hand = document.querySelector<HTMLElement>(".home-contact_hand");

if (hand && !reduced) {
  gsap.registerPlugin(ScrollTrigger);
  // A wave: the frame and the swing (degrees) for each step; then about
  // three seconds still.
  const wave: [number, number][] = [
    [1, -4], [2, -9], [1, 0], [0, 8], [1, 0], [2, -9], [1, 0], [0, 8], [1, 3], [0, 0],
  ];
  const cycle = wave.length + 24;
  let frame = 0;
  let last = -1;

  gsap.ticker.add((time) => {
    if (time - last < 0.125 || !ScrollTrigger.isInViewport(hand)) return;
    last = time;
    const [still, swing] = wave[frame++ % cycle] ?? [0, 0];
    hand.style.setProperty("--frame", String(still));
    hand.style.rotate = `${swing + (Math.random() - 0.5) * 1.5}deg`;
  });
}


