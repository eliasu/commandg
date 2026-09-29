# commandg

Statamic 6 (Antlers), styled with **Lumos for Astro**
(https://lumosframework.com/docs), ported to Antlers. Not Lumos for Webflow:
ignore any Webflow Lumos skill. No Tailwind.

## Lumos

- Upstream: `lumosframework/lumos-for-astro` @ `42d4897` (v0.0.4, 2026-09-23)
- Stages: foundation + components + CMS
- CMS mode: A code-only
- Client-facing language: CP labels (display, block and option names) in
  English; field instructions in German. Everything visitors see is German
  (site locale `de_DE`): ARIA labels, button defaults, form messages, the
  strings in `resources/js/components/*.ts`. Code, handles and comments stay
  English.
- Ported: every upstream component — section, content-wrapper, grid,
  button-wrapper, eyebrow, heading, paragraph, rich-text, button, icon, img,
  overlay, video, card, formatted-date, base-head, skip-link, nav, nav-link,
  footer, accordion, accordion-item, dropdown, marquee, modal, slider, tabs,
  tab-link, form, input, select, choice, fieldset, textarea, range
- Blocks: none (mode A)
- Extensions (site.css `@layer base`): text style `statement`
  (`.text-style-statement`, `--statement-*`), `--primary-semibold: 600`,
  `--letter-spacing-tighter: -0.05em`, `--ease-out`. Eyebrow variant `label`. Dark mode: `theme-dark` on `<html>` (system default, toggle in nav, `localStorage.theme`); a dark section inside it turns `--dark-800`. Changed in base.css: `--light-100/200/300` are cream (`#f5f2eb`, `#ebe7de`, `#dedad0`), `--dark-900/800/700` blue-tinted grey (`#121419`, `#1c1f26`, `#272b34`). Font: Schibsted Grotesk replaces Inter; Permanent Marker only for the hero's speech.
- Import: website from imported/D-portfolio.html, record in IMPORT.md

The three files in `resources/css/lumos/` started as verbatim copies. Tokens
are edited there. To upgrade, run a three-way merge against the commit above,
then update the hash. The `lumos-statamic` skill does this.

Adding a text style, spacing step, theme or breakpoint: use the
`lumos-extend-system` skill. Changed values go in
`resources/css/lumos/base.css`; additions go in `resources/css/site.css` inside
`@layer base { … }`, so the upstream files stay verbatim and an upgrade has
nothing to conflict with. Every extension is listed above, because that list is
what gets re-checked after an upgrade.

| Lumos (Astro)                  | Here                                            |
| ------------------------------ | ----------------------------------------------- |
| `src/styles/base.css` …        | `resources/css/lumos/…`                         |
| `src/styles/global.css`        | `resources/css/site.css`                        |
| `src/layouts/BaseLayout.astro` | `resources/views/layout.antlers.html`           |
| `src/components/*/X.astro`     | `resources/views/components/x.antlers.html`     |
| component `<style is:global>`  | `resources/css/components/x.css`                |
| component `<script>`           | `resources/js/components/x.ts` (verbatim TS, Vite transpiles) |
| `src/assets/icons/*.svg`, `src/assets/logo/*.svg` | `resources/svg/*.svg`      |
| `src/assets/fonts/*.woff2`     | `resources/fonts/*.woff2` (`@font-face` in `site.css`) |
| `src/consts.ts` (`SITE_*`)     | `site:name`, Globals → SEO                      |

The cascade order is `base, patterns, components, utilities`. The inline
`<style>@layer …;</style>` in `base-head` must stay, because the minifier drops
the order statement.

The page theme and nav overlap (BaseLayout's `theme`, `overlap`) are set in a
template's front matter: `theme: dark`, `overlap: true`.

## Writing partials

- Call as `{{ partial:components/x }}…{{ /partial:components/x }}`. Params are
  snake_case (`max_width`), declared in front matter with defaults and a `#`
  comment carrying upstream's prop wording.
- Read params only as `view:x`. A bare `{{ variant }}` picks up an entry field
  of the same name.
- Booleans arrive as strings: pass `centered="true"` or `:centered="field"`,
  read with `| to_bool`. `:x="true"` arrives as `null`. `render` isn't ported;
  use `:when` / `:unless` on the partial tag.
- `src` is reserved by the partial tag: Icon takes `name`, Img takes `image`.
- Locals start with `_` and still leak into the page context; never assign a
  name a field uses.
- No tag pairs inside params; build a string into a `_var` first. Tags can't
  run inside expressions. Parenthesise concatenation in ternaries.
- Loop grids/replicators with `scope` (`{{ items scope="item" }}`).
- Associative arrays (a field's `options`) loop with
  `{{ foreach :array="…" }}{{ key }}{{ value }}{{ /foreach }}`.
- Output nothing when a required param is missing or the slot is empty.
- `attrs` (Button) is output unescaped: templates only, never editor input.
- Icons: `{{ svg src="…" sanitize="false" }}`, or the sanitizer strips
  `vector-effect`.
- A tag pair that returns nothing (`nav`, `collection`…) still renders its
  body once, with `no_results` set and the page's own `title`/`url` in scope.
  Wrap the body in `{{ unless no_results }}`.
- A `_var` assigned in a template isn't visible inside another partial's slot;
  pass fields (in scope everywhere) or assign inside the slot.
- Deviations from upstream are marked `Statamic port:`.

## CMS

The client edits content, never design. Spacing, alignment, variants, heading
sizes and button styles are fixed in templates.

Mode A: pages are hand-built templates from partials.

- Blueprints so far: `page` (title + Bard, template `pages/page`, the default
  for new pages) and `home` (intro: eyebrow, heading, text, buttons; template
  `pages/home`).
- One blueprint per page type in `resources/blueprints/collections/pages/`,
  each with a hidden `template` field defaulting to its template, and the `seo`
  fieldset on an SEO tab.
- Repeated content (team, services, events) gets its own collection, looped in
  the template, not a list field.
- Site-wide text goes in globals. `seo` holds the fallback description and
  share image.
- Nav and footer links come from the `main` and `footer` navigations.
- Every field has instructions; headings, eyebrows and button labels have a
  `character_limit`; Bard is limited to h2/h3, bold, italic, link and lists.
  Buttons: label + link, at most two, the first primary, the second secondary.
  Image alt text is required in the asset blueprint.

## Building pages

- Compose from partials. Write raw markup only for what none of them cover.
- Most sections need no new partial: a `section`, a `content-wrapper` inside
  it, then `eyebrow`, `heading`, `paragraph` and `button-wrapper`. Prefer
  `content-wrapper` to a plain `div`: it ties text and flex alignment to one
  `--_alignment` variable, so `centered` moves the whole block together.
- Anything needing custom CSS or scripts becomes its own partial.

## Custom components

Only when custom CSS or scripts are needed. A partial copied into another page
should work with nothing else moved; its CSS lives in
`resources/css/components/x.css`, its JS in `resources/js/components/x.ts`.
Tokens and utilities in `resources/css/lumos/` are the global exception.

A component doesn't need a partial: used once, with markup that has no
conditions, a class plus its own CSS file is the whole component. The partial
follows on the second use.

- Build its insides from partials too: `heading` rather than an `h2` with a
  class, `button` rather than a styled link.
- Wrap the contents by default, not the section, leaving the section's params
  free to differ per page. Name it `content-` + type + variant
  (`content-blog-hero`, `content-cta-main`).
- Wrap the whole section only when the styles act on the section itself (a
  pinned full-height scroll, a background image): `section-hero-main`.
- A content partial takes content, not styling. If it passes a heading's `tag`
  through, set its `variant` too, since `variant` defaults to `tag`.
- Text identical on every page stays in the partial; text that differs is a
  param.

## New style checklist

- [ ] Isn't already available as a `variant` or a param. New CSS is the last
      resort.
- [ ] Uses utilities only to override one instance. Several utilities that must
      hold together make a variant.
- [ ] Doesn't repeat the same utility, param value or attribute on every
      instance. Fix the default instead: a token in
      `resources/css/lumos/base.css`, the param's default, or a new param.
- [ ] Ships with the partial that needs it, in its own
      `resources/css/components/x.css` (imported in `site.css` with
      `layer(components)`, no `@layer` wrapper in the file). A page carries no
      CSS — an unlayered `<style>` would beat every layer.
- [ ] Root class ends in `_wrap` (`.blog-gallery_wrap`), children prefixed with
      the family name (`.blog-gallery_title`). A variant is a bare class beside
      the root (`.tabs_wrap.side`).
- [ ] Skips `_wrap` when there are no children: `.heading`, `.text`,
      `.section`, `.container`, `.layout`. Nothing in `patterns.css` carries an
      underscore.
- [ ] Names children for their role, not mechanism: `_layout`, `_list`, not
      `_grid`, `_flex`.
- [ ] Carries a pattern class beside the custom one where one fits
      (`text-style-h3`, `theme-invert`).
- [ ] Takes colours from the theme variables (`--background`, `--text`,
      `--border`, `--button-*`), never a palette token or a literal colour.
- [ ] Styles emphasis inside a heading from the parent
      (`.heading-accent strong`), since rich text can't carry classes.
- [ ] No `px`: `rem` or a spacing token for lengths, `ch` for text max widths,
      `em` for anything tracking the font size.
- [ ] Media queries nested in the rule they change, one query per component
      (per variant only where variants wrap at different widths).
- [ ] Uses the breakpoints in `resources/css/components/grid.css` (30, 48,
      64rem), read from there. Any other breakpoint needs a reason.
- [ ] Doesn't lean on a nested partial's media queries: leave a `grid`'s column
      params unset and make it responsive from your own class.

## New component checklist

- [ ] Earns its existence: a new kind of card is a variant or a param, not a
      second card partial.
- [ ] Outputs nothing when a param it needs is missing or its slots are empty.
- [ ] Orders front matter params: content that changes per instance, `variant`,
      variant-only params (say which variant), occasional settings, `class`
      last.
- [ ] Describes each param with the wording other partials already use.
- [ ] Adds a snippet to `.vscode/lumos.code-snippets` when it will be used
      often.
- [ ] No comments beyond the param descriptions, the banners dividing a
      stylesheet, one line labelling each section of a page, and
      `Statamic port:` notes.
- [ ] Checked in the browser at every width it wraps at.

## Development

- `composer dev` (or `npm run dev` for Vite alone). Restart Vite after changing
  `vite.config.js`. `npm run build` before shipping — layer problems only show
  there.
- A new stylesheet needs its `@import … layer(components)` line in `site.css`,
  a new script an import in `site.js`, a new icon an SVG in `resources/svg/`.
