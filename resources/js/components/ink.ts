/* Points an .ink element at its two baked sprites (resources/ink/bake.sh):
   data-ink is the path without -light.webp / -dark.webp. Absolute: a url()
   in a custom property resolves against the stylesheet. */
export const setInk = (el: HTMLElement, base: string) => {
  for (const theme of ["light", "dark"]) el.style.setProperty(`--ink-${theme}`, `url("${new URL(`${base}-${theme}.webp`, location.href)}")`);
};

for (const el of document.querySelectorAll<HTMLElement>("[data-ink]")) setInk(el, el.dataset.ink!);
