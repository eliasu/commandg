import gsap from "gsap";
import { reduced } from "./motion.ts";

/* A dot that trails the pointer: a ring over anything clickable, a larger
   dot over media, "Website ↗" over linked media, "Ziehen" over [data-cursor="drag"]. Mouse and
   trackpad only. */
if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const cursor = document.createElement("div");
  cursor.className = "cursor_wrap";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<span class="cursor_shape"><span class="cursor_label"><span class="cursor_text"></span></span></span>';
  const text = cursor.querySelector<HTMLElement>(".cursor_text")!;
  document.body.append(cursor);

  const x = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
  const y = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });

  addEventListener(
    "pointermove",
    (event) => {
      if (!cursor.classList.contains("is-visible")) gsap.set(cursor, { x: event.clientX, y: event.clientY });
      x(event.clientX);
      y(event.clientY);
      cursor.classList.add("is-visible");
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));

  addEventListener("pointerover", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest("a, button, summary, label, [role='button']");
    const media = target?.closest(".media_wrap");
    const state = target?.closest("input, textarea, select")
      ? "hidden"
      : target?.closest("[data-cursor='drag']")
        ? "drag"
        : media && link
          ? "view"
          : link
            ? "link"
            : media
              ? "media"
              : "";
    cursor.dataset.state = state;
    if (state === "view" || state === "drag") text.textContent = state === "drag" ? "← Ziehen →" : "Website ↗";
  });
}
