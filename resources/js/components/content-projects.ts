/* Hovering a project widens its card to the media's own format at the same
   height; the rest of the row, holes included, is compressed to make room.
   Cards move by `translate` and `width` only, their grid cells stay put. */
const active = matchMedia("(hover: hover) and (width >= 48rem) and (prefers-reduced-motion: no-preference)");

for (const list of document.querySelectorAll<HTMLElement>(".projects_list")) {
  const items = [...list.querySelectorAll<HTMLElement>(":scope > .projects_item")];
  const card = (item: HTMLElement) => item.querySelector<HTMLElement>(".projects_card")!;

  const reset = () => {
    for (const item of items) {
      card(item).style.removeProperty("--_x");
      card(item).style.removeProperty("--_w");
    }
  };

  const ratioOf = (item: HTMLElement) => {
    const img = item.querySelector("img");
    if (img) return Number(img.getAttribute("width")) / Number(img.getAttribute("height"));
    const video = item.querySelector("video");
    return video?.videoWidth ? video.videoWidth / video.videoHeight : 0;
  };

  const expand = (hovered: HTMLElement) => {
    if (!active.matches) return;
    const origin = list.getBoundingClientRect().left;
    const width = list.clientWidth;
    const row = items.filter((item) => item.offsetTop === hovered.offsetTop);
    const box = (item: HTMLElement) => {
      const rect = item.getBoundingClientRect();
      return { x: rect.left - origin, w: rect.width };
    };

    const { x: a, w } = box(hovered);
    const rest = width - w;
    const height = hovered.querySelector<HTMLElement>(".media_wrap")?.offsetHeight ?? 0;
    // ponytail: only widens; a portrait image in a wide cell keeps its cell, since shrinking under the cursor hands the hover to the neighbour.
    const target = Math.min(Math.max(w, height * ratioOf(hovered)), width - rest * 0.45);
    if (rest < 1 || target - w < 1) return reset();
    const s = (width - target) / rest;

    for (const item of items) {
      const { x, w: iw } = box(item);
      const inRow = row.includes(item);
      const nx = item === hovered ? a * s : x < a ? x * s : a * s + target + (x - a - w) * s;
      const nw = item === hovered ? target : iw * s;
      const style = card(item).style;
      if (!inRow) {
        style.removeProperty("--_x");
        style.removeProperty("--_w");
        continue;
      }
      style.setProperty("--_x", `${nx - x}px`);
      style.setProperty("--_w", `${nw}px`);
    }
  };

  for (const item of items) item.addEventListener("pointerenter", () => expand(item));
  list.addEventListener("pointerleave", reset);
  addEventListener("resize", reset);
}
