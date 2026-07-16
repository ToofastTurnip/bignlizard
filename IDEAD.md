# Making Big n Lizard Feel More Alive

Ideas for more motion, easter eggs, and personality, organized roughly by effort.
Everything below should respect `prefers-reduced-motion` the way the torches
already do (see `css/styles.css` around line 396). Animate freely, but make
sure the reduced-motion query turns it off or reduces it to a static state.

---

## Quick wins (an hour or two each, mostly CSS)

- **Blinking crest.** The lizard crest (`.brand-crest` / `.hero-crest`) has an
  eye dot (`circle cx="36" cy="21" r="1.4"`). Give it a rare, slow blink:
  scale-Y to 0.1 for ~120ms every 6-10s. Barely noticeable consciously, but it
  reads as "this thing is alive" the moment someone catches it.
- **Ambient light breathing.** Right now only the flames flicker. Tie a very
  subtle brightness/warmth pulse on `.hero-vignette` to the same rhythm as
  `ember-light`, so the whole scene feels lit by the torches instead of the
  torches just being decoration sitting on top of a static background.
- **Paper rustle before lift.** `.news-item:hover` currently jumps straight to
  `rotate(0) translateY(-4px)`. Add a tiny 1-2 degree wobble keyframe at
  `:hover` start so the note looks like it physically shifts before settling.
  Paper should feel like paper, not a div.
- **Sign creak.** `.board-sign` (the hanging corkboard title) is static. Add a
  barely-perceptible rotation oscillation (+/- 0.3deg, ~8s ease-in-out) like
  it's hanging on its bolts. Combined with the existing `.board-sign-bolt`
  dots, it'll read as a physical sign swaying in a draft.
- **Cursor embers in the hero.** A handful of small particles (reuse the
  existing `.ember` styling/keyframes) that drift up lazily near the cursor
  while it's inside `.hero`. Cap it at 3-4 concurrent particles so it stays
  ambient, not distracting.
- **Idle flame gutter.** After 45-60s with no scroll or mouse movement, have
  the flames dip and flare once like a draft just blew through the tavern
  door, then resume normal flicker. A `setTimeout` reset on `scroll` and
  `mousemove` in `main.js`, toggling one animation class.

## Medium effort (some JS, still no build step needed)

- **Parallax hero.** On scroll, move `.hero-bg` slower than `.hero-content`,
  and `.torch` slower still than the title block. Even 10-15px of drift
  differential sells depth. The header shadow scroll listener in `main.js`
  already gives a pattern to follow.
- **Corkboard arrow quiver.** `.board-arrow` is static once painted. When
  `#news` scrolls into view (the reveal/`IntersectionObserver` code already
  fires there), give the arrow a quick decaying wobble, like it just thunked
  into the wood. One keyframe, triggered once.
- **Dice-roll micro-interaction on game icons.** `.game-icon` SVGs
  (gem/book/moon) could do a quick playful spin or bounce on hover. Optional
  flourish, but ties into "board game" identity better than a plain lift.
- **Little d20 widget.** A small clickable twenty-sided die (SVG, maybe
  tucked near the footer or About section) that does a quick roll animation
  and shows a random number on click. No functional purpose, just charm, and
  it fits a tabletop studio.
- **Tab-away title change.** `document.title` swaps to something like "Come
  back, the ale's getting warm..." via `visibilitychange`, and reverts on
  return. Cheap, and a lot of people notice these.

## Easter eggs

- **Konami code (up up down down left right left right B A).** Trigger
  something disproportionate for the effort: the screen briefly shakes like a
  tavern brawl broke out, or a tiny dragon silhouette flies across the hero
  breathing a trail of the existing ember/flame gradients.
- **Logo mashing.** Click the header crest 5+ times fast and the lizard
  "breathes fire" (a quick flame-gradient overlay bursts from its mouth), or
  the whole header rattles for a second. Rewards curious clickers without
  being discoverable by accident.
- **Peel back "Hugh wuz here."** Right now it's a static decorative note.
  Make it clickable: the first click reveals it's pinned over another, older
  scrap of graffiti underneath (more tavern lore or a joke), a second click
  reveals one more. A tiny stack of jokes rewarding persistence.
- **Knot in the wood.** Somewhere in `.board-bg`'s grain, one "knot" is
  actually a real, very subtly-indicated clickable spot, leading to a joke
  page (blooper reel of scrapped game names, a fake "banned from Gen Con"
  story, whatever fits the lore).
- **Console message for the nosy.** Anyone who opens devtools gets a bit of
  ASCII art plus an in-character line ("Oi, get yer nose outta the kegs.
  Unless you're hiring, then: hello@bignlizard.com"). Cheap, low-risk, and
  developers and press love finding these.
- **Type "lizard" anywhere on the page.** A `keydown` buffer listening for
  the word, triggering a small celebratory flourish (confetti of tiny dice or
  embers, or the crest does its fire-breath bit). No UI hint needed. That's
  the point of an easter egg.

## Sound (careful, opt-in only)

- **Ambient tavern loop toggle.** A small, clearly-optional icon (off by
  default, remembers choice via localStorage) for a quiet fire-crackle plus
  distant lute loop. Never autoplay.
- **Tankard clink on primary buttons.** A very short, quiet click sound on
  `.btn-primary`. Genuinely optional, and only wire it up if sound is
  something the client wants to own. It's the easiest thing to get wrong:
  too loud, wrong vibe, annoying on repeat clicks.

## Copy and personality touches

- **404 page in-world.** "Ye Wandered Off the Map": a torch-lit dead end, a
  joke about a bard who doesn't know the way back, link home.
- **Footer scrawl credit.** A tiny `font-scrawl` line under the copyright,
  something like "no lizards were harmed; several tankards were." Costs
  nothing, adds voice exactly where people already expect a wink (the footer
  fine print).
- **Alternate tagline on refresh.** Keep the primary hero tagline as-is, but
  stash 2-3 alternate flavor lines and swap in one at random per page load
  (deterministic per session so it doesn't flicker on soft nav). Rewards
  repeat visitors without changing the site's identity.

---

### Suggested first pass

If you want a small, high-impact starting set rather than everything at once:
blinking crest, sign creak, and paper rustle (quick wins, all CSS) first, then
parallax hero and tab-away title (medium, JS), then a Konami code or
logo-mashing egg (the easter egg most likely to get shared or screenshotted).
