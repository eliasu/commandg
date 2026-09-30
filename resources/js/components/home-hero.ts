import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { intro, reduced } from "./motion.ts";
import { setInk } from "./ink.ts";

/* The mouths either side of the heading hold a dialog: the left says a line
   of the list in .home-hero_dialog, the right replies, then the next pair.
   Each turn brings the next face from the speaker's data-faces. All of it
   steps at 8 fps for a stop-motion look: mouth frames, a jitter, the words scribbled on, the slide in. */
const mouths = document.querySelector<HTMLElement>(".home-hero_mouths");

if (mouths) {
  const sides = [...mouths.querySelectorAll<HTMLElement>(".home-hero_mouth")].map((el) => ({
    el,
    faces: el.dataset.faces!.split(","),
    face: el.querySelector<HTMLElement>(".home-hero_face")!,
    bubble: el.querySelector<HTMLElement>(".home-hero_bubble")!,
    says: el.querySelector<HTMLElement>(".home-hero_says")!,
    words: [] as HTMLElement[],
    x: 0,
  }));
  const dialog = [...mouths.querySelectorAll<HTMLElement>(".home-hero_dialog li")].map((li) => [li.dataset.say!, li.dataset.reply!]);
  for (const side of sides) setInk(side.face, side.faces[0]);

  if (!reduced) {
    gsap.registerPlugin(ScrollTrigger);
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
    // Then the pair comes down again, last word first, over this many.
    const clear = 3;
    const jitter = (amount: number) => ((Math.random() - 0.5) * amount).toFixed(2);
    let turn = 0;
    let t = 0;
    // Scrolled out all the way, the heads stop.
    let gone = false;

    const step = () => {
      if (gone || !ScrollTrigger.isInViewport(mouths)) return;
      const who = turn % 2;
      const speaker = sides[who];
      const pair = Math.floor(turn / 2);
      const tilt = tilts[who][pair % 3];
      // A new face while it's still out at the edge; a new pair wipes both.
      if (t === 0) {
        const text = dialog[pair % dialog.length][who];
        setInk(speaker.face, speaker.faces[pair % speaker.faces.length]);
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
      const clearing = who === 1 ? t - talk - quiet[1] + 1 : 0;
      if (clearing > 0) {
        for (const side of sides) {
          const kept = Math.ceil((1 - clearing / clear) * side.words.length);
          side.words.forEach((word, i) => (word.style.visibility = i < kept ? "visible" : "hidden"));
        }
      }
      speaker.bubble.style.visibility = "visible";
      speaker.bubble.style.rotate = `${tilt + Number(jitter(1))}deg`;
      if (hold && turn === 1 && t === talk) intro.play();
      if (++t >= talk + quiet[who] + (who === 1 ? clear : 0)) {
        t = 0;
        turn++;
      }
    };
    // Scrolled one screen down, the heads are gone; on phones half a screen.
    gsap.fromTo(mouths, { "--out": 0 }, {
      "--out": 1,
      ease: "none",
      scrollTrigger: {
        start: 0,
        // The heads move down as far as the page goes up (--leave): held in place.
        end: () => {
          const leave = innerHeight * (matchMedia("(min-width: 48rem)").matches ? 1 : 0.5);
          mouths.style.setProperty("--leave", `${leave}px`);
          return leave;
        },
        scrub: true,
        onUpdate: ({ progress }) => {
          gone = progress === 1;
        },
      },
    });
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
    // The dialog (and with it the heading) starts once both first faces are
    // decoded, at most 3s in; the other faces download behind it, but only
    // decode when shown: decoded, a sprite takes about 14 MB.
    const theme = document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
    const load = (face: string) => Object.assign(new Image(), { src: `${face}-${theme}.webp` });
    const firsts = Promise.all(sides.map((side) => load(side.faces[0]).decode().catch(() => {})));
    Promise.race([firsts, new Promise((done) => setTimeout(done, 3000))]).then(() => {
      for (const side of sides) side.faces.slice(1).forEach(load);
      // On GSAP's clock, so the handover to the intro stays in step.
      let last = -1;
      gsap.ticker.add((time) => {
        if (time - last < 0.125) return;
        last = time;
        step();
      });
    });
  }
}
