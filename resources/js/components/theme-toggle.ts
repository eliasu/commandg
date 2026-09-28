for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
  const root = document.documentElement;
  button.setAttribute("aria-pressed", String(root.classList.contains("theme-dark")));

  button.addEventListener("click", () => {
    const dark = root.classList.toggle("theme-dark");
    button.setAttribute("aria-pressed", String(dark));
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  });
}
