// Field condition for the `media` fieldset: slideshow settings show from two files on.
Statamic.booting(() => {
  Statamic.$conditions.add("multiple", ({ target }) => Array.isArray(target) && target.length > 1);
});
