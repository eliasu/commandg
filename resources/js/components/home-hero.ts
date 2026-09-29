import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { intro, reduced } from "./motion.ts";

/* The mouths either side of the heading hold a dialog: the left says a line
   of the list in .home-hero_dialog, the right replies, then the next pair.
   Each turn brings the next face from the speaker's data-faces. All of it
   steps at 8 fps for a stop-motion look: mouth frames, a jitter, the grain of
   the #home-hero-ink filter, the words scribbled on, the slide in. */
const mouths = document.querySelector(".home-hero_mouths");

if (mouths) {
  const sides = [...mouths.querySelectorAll<HTMLElement>(".home-hero_mouth")].map((el) => ({
    el,
    // Absolute: a url() in a custom property resolves against the stylesheet.
    faces: el.dataset.faces!.split(",").map((face) => new URL(face, location.href).href),
    face: el.querySelector<HTMLElement>(".home-hero_face")!,
    bubble: el.querySelector<HTMLElement>(".home-hero_bubble")!,
    says: el.querySelector<HTMLElement>(".home-hero_says")!,
    words: [] as HTMLElement[],
    x: 0,
  }));
  const dialog = [...mouths.querySelectorAll<HTMLElement>(".home-hero_dialog li")].map((li) => [li.dataset.say!, li.dataset.reply!]);
  for (const side of sides) side.face.style.setProperty("--sprite", `url("${side.faces[0]}")`);

  if (!reduced) {
    gsap.registerPlugin(ScrollTrigger);
    const grain = mouths.querySelector("feTurbulence")!;
    const lines = document.querySelectorAll(".home-hero_line");
    // Three tilts per side, one per pair.
    const tilts = [
      [-3, 2, -1.5],
      [2.5, -2.5, 1],
    ];
    // Each line is said in a second; the question stays up a moment before
    // the reply, the pair long enough to read.
    const talk = 8;
    const quiet = [8, 16];
    const jitter = (amount: number) => ((Math.random() - 0.5) * amount).toFixed(2);
    let turn = 0;
    let t = 0;
    let frame = 0;

    const step = () => {
      if (!ScrollTrigger.isInViewport(mouths)) return;
      const who = turn % 2;
      const speaker = sides[who];
      const pair = Math.floor(turn / 2);
      const tilt = tilts[who][pair % 3];
      // A new face while it's still out at the edge; a new pair wipes both.
      if (t === 0) {
        const text = dialog[pair % dialog.length][who];
        speaker.face.style.setProperty("--sprite", `url("${speaker.faces[pair % speaker.faces.length]}")`);
        speaker.words = text.split(" ").map((word) => Object.assign(document.createElement("span"), { textContent: word }));
        speaker.says.replaceChildren(...speaker.words.flatMap((word) => [word, " "]));
        if (who === 0) sides[1].bubble.style.visibility = "hidden";
        // The heading's sentence for this side comes forward.
        // Opening with the dialog, the heading comes in with it: a sentence
        // with each of the first two lines.
        if (hold && turn < lines.length) gsap.to(lines[turn].querySelectorAll(".motion-word > span"), { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.04, ease: "expo.out" });
        if (lines.length === 2) lines.forEach((line, i) => gsap.to(line, { opacity: i === who ? 1 : 0.25, scale: i === who ? 1.04 : 1, duration: 0.6, ease: "power2.out" }));
      }
      for (const side of sides) {
        const talking = side === speaker && t < talk;
        // In for the whole turn.
        side.x += (Number(side === speaker) - side.x) * 0.4;
        side.el.style.setProperty("--in", side.x.toFixed(3));
        side.face.style.setProperty("--frame", talking ? String(1 + Math.floor(Math.random() * 2)) : "0");
        side.face.style.rotate = `${jitter(1.2)}deg`;
        side.face.style.translate = `${jitter(0.3)}rem ${jitter(0.3)}rem`;
      }
      // Word by word while talking.
      const shown = Math.ceil(((t + 1) / talk) * speaker.words.length);
      speaker.words.forEach((word, i) => (word.style.visibility = i < shown ? "visible" : "hidden"));
      speaker.bubble.style.visibility = "visible";
      speaker.bubble.style.rotate = `${tilt + Number(jitter(1))}deg`;
      grain.setAttribute("seed", String(frame++ % 8));
      if (hold && turn === 1 && t === talk) intro.play();
      if (++t >= talk + quiet[who]) {
        t = 0;
        turn++;
      }
    };
    // Scrolled one screen down, the heads are gone.
    gsap.fromTo(mouths, { "--out": 0 }, { "--out": 1, ease: "none", scrollTrigger: { start: 0, end: () => innerHeight, scrub: true } });
    // The page opens with one exchange; the intro waits for it. Not when
    // the mouths are out of sight (narrow screen, restored mid-page).
    const hold = ScrollTrigger.isInViewport(mouths);
    if (hold) {
      intro.pause();
      // The nav doesn't wait: it comes in after a second, with the heads.
      // The heading rises with the dialog (step), not with the intro; its
      // words stay down where the intro put them.
      for (const tween of gsap.getTweensOf([".nav_wrap", ".home-hero_heading .motion-word > span"])) {
        intro.remove(tween);
        tween.kill();
      }
      gsap.to(".nav_wrap", { opacity: 1, y: 0, duration: 1, delay: 1 });
    }
    // On GSAP's clock, so the handover to the intro stays in step.
    let last = -1;
    gsap.ticker.add((time) => {
      if (time - last < 0.125) return;
      last = time;
      step();
    });
  }
}
