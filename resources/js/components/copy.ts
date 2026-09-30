for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  const text = button.dataset.copy ?? "";
  const hint = button.querySelector("[data-copy-hint]");

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // The Clipboard API needs HTTPS; execCommand still copies over plain HTTP.
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) return;
    }
    if (!hint) return;
    hint.textContent = "Kopiert";
    setTimeout(() => (hint.textContent = "Kopieren"), 1800);
  });
}
