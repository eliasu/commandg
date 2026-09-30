#!/usr/bin/env bash
# Bakes the ink look (grain, two tones, hard edge) into the sprites, so the
# browser draws plain images instead of running an SVG filter every frame.
# Each sprite comes out twice: dark ink on transparent (light theme), light ink (dark theme).
#   resources/ink/bake.sh resources/ink/face-1.webp public/images/hero-mouths
# Needs Google Chrome and ImageMagick.
set -euo pipefail

src=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
out=$2
name=$(basename "$1" .webp)
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Rendered at twice the source size: the grain is per CSS pixel, and the
# edges stay crisp at the size the page shows them. Larger costs memory:
# decoded, a sprite takes width x height x 4 bytes.
read -r w h < <(magick identify -format "%w %h\n" "$src")
w=$((w * 2))
h=$((h * 2))

# Raise intercept to lighten the dark parts, lower it to darken them.
intercept=-0.07
filter="<filter id=\"ink\" color-interpolation-filters=\"sRGB\">
    <feComponentTransfer in=\"SourceAlpha\" result=\"edge\"><feFuncA type=\"discrete\" tableValues=\"0 0 1\"/></feComponentTransfer>
    <feColorMatrix in=\"SourceGraphic\" type=\"saturate\" values=\"0\"/>
    <feComponentTransfer result=\"gray\"><feFuncR type=\"linear\" slope=\"1.3\" intercept=\"$intercept\"/><feFuncG type=\"linear\" slope=\"1.3\" intercept=\"$intercept\"/><feFuncB type=\"linear\" slope=\"1.3\" intercept=\"$intercept\"/></feComponentTransfer>
    <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"2\" seed=\"0\"/>
    <feColorMatrix type=\"matrix\" values=\"0.8 0 0 0 0.52  0.8 0 0 0 0.52  0.8 0 0 0 0.52  0 0 0 0 1\"/>
    <feBlend in=\"gray\" mode=\"multiply\"/>
    <feComponentTransfer><feFuncR type=\"discrete\" tableValues=\"0 0 1\"/><feFuncG type=\"discrete\" tableValues=\"0 0 1\"/><feFuncB type=\"discrete\" tableValues=\"0 0 1\"/></feComponentTransfer>
    <feComposite in2=\"edge\" operator=\"in\"/>
  </filter>"

cat > "$tmp/page.html" <<HTML
<!doctype html>
<style>
  html, body { margin: 0; background: transparent; }
  div { width: ${w}px; height: ${h}px; background: url("file://$src") 0 0 / 100% 100%; filter: url(#ink); }
</style>
<svg width="0" height="0" style="position: absolute">$filter</svg>
<div></div>
HTML

"$chrome" --headless --hide-scrollbars --force-device-scale-factor=1 \
  --default-background-color=00000000 --window-size="$w,$h" \
  --screenshot="$tmp/ink.png" "file://$tmp/page.html" 2>/dev/null

mkdir -p "$out"
# Black stays as ink, white drops out (light theme); the other way round
# for the dark theme. Colours: --dark-900 and --light-100.
magick "$tmp/ink.png" -channel A -fx "a * (r < 0.5)" +channel -fill "#121419" -colorize 100 \
  -define webp:lossless=true "$out/$name-light.webp"
magick "$tmp/ink.png" -channel A -fx "a * (r >= 0.5)" +channel -fill "#f5f2eb" -colorize 100 \
  -define webp:lossless=true "$out/$name-dark.webp"
