# Making Big n Lizard Feel More Alive

Ideas for more motion, easter eggs, and personality, organized roughly by effort.
Everything below should respect `prefers-reduced-motion` the way the torches
already do (see `css/styles.css` around line 396, and the shared `stillPlease`
media query at the top of `js/main.js`). Animate freely, but make sure the
reduced-motion query turns it off or reduces it to a static state.

---

## Quick wins (an hour or two each, mostly CSS)

- **Paper rustle before lift.** `.news-item:hover` currently jumps straight to
  `rotate(0) translateY(-4px)`. Add a tiny 1-2 degree wobble keyframe at
  `:hover` start so the note looks like it physically shifts before settling.
  Paper should feel like paper, not a div.
- **Sign creak.** `.board-sign` (the hanging corkboard title) is static. Add a
  barely-perceptible rotation oscillation (+/- 0.3deg, ~8s ease-in-out) like
  it's hanging on its bolts. Combined with the existing `.board-sign-bolt`
  dots, it'll read as a physical sign swaying in a draft.
- **Idle flame gutter.** After 45-60s with no scroll or mouse movement, have
  the flames dip and flare once like a draft just blew through the tavern
  door, then resume normal flicker. A `setTimeout` reset on `scroll` and
  `mousemove` in `main.js`, toggling one animation class. (The WebGL flames in
  `hero-fx.js` would need a matching intensity dip.)
- **Pins drop in.** When the news board reveals, have each `.news-item` pin
  land a beat before its paper (small scale-down "thunk"), staggered.

## Medium effort (some JS, still no build step needed)

- **Flip the box.** Double-clicking a game box (a single click now lifts the
  lid) spins it 180deg to show a "back of the box" face with player count,
  playtime, and a one-line pitch, the way you'd pick a game up off a shop
  shelf.
- **Night sky in the window.** `.hero--night` currently just hides
  `.hero-window`. Instead show a dim moon and the rare shooting star (one
  every minute or two), so night visitors get their own scene.
- **Seasonal tavern.** Extend the time-of-day logic in `main.js` to dates:
  a carved pumpkin on the bar in October, a bit of holly and snow on the
  window ledge in December, a party streamer around the studio's anniversary.
  One class on `.hero`, decorations in CSS.
- **Tab-away favicon.** Pair the existing tab-away title with a favicon swap
  (e.g. the toaster with a sleepy "z") on `visibilitychange`, reverting on
  return.
- **"Copied to the barkeep" email.** Clicking "Get in Touch" or "Contact" also
  copies the address to the clipboard and shows a little scrawled toast
  ("Note passed to the barkeep"), for people without a mail client set up.
- **Napkin doodles.** On the Napkin Games page, hovering a napkin draws a
  small doodle in the margin stroke-by-stroke (SVG `stroke-dashoffset`), and
  the occasional napkin has a faint coffee/ale ring stain.

## Easter eggs

- **Knot in the wood.** Somewhere in `.board-bg`'s grain, one "knot" is
  actually a real, very subtly-indicated clickable spot, leading to a joke
  page (blooper reel of scrapped game names, a fake "banned from Gen Con"
  story, whatever fits the lore).
- **Secrets ledger.** Track which eggs a visitor has found (d20 crit, torch
  flare, wax seal, Hugh rumble, etc.) in `localStorage`, and once they've
  found a few, a tiny "Secrets found: 3 / 7" tally appears scratched into the
  footer. Turns scattered eggs into a hunt.
- **Natural 1.** The d20 already celebrates a 20. Give a 1 its own fumble:
  the die skitters off the edge and has to be "rolled back in", or a sad
  trombone-shaped puff of smoke.

## Sound (careful, opt-in only)

- **Ambient tavern loop toggle.** A small, clearly-optional icon (off by
  default, remembers choice via localStorage) for a quiet fire-crackle plus
  distant lute loop. Never autoplay.
- **Tankard clink on primary buttons.** A very short, quiet click sound on
  `.btn-primary`. Genuinely optional, and only wire it up if sound is
  something the client wants to own. It's the easiest thing to get wrong:
  too loud, wrong vibe, annoying on repeat clicks.
- **Dice clatter.** If the ambient toggle is on, the d20 throw plays a short
  wooden-table clatter. Same opt-in rule.

## Copy and personality touches

- **Footer scrawl credit.** A tiny `font-scrawl` line under the copyright.
  ("No lizards were harmed..." is already a wax-seal fortune, so pick a
  different one, e.g. "Brewed by candlelight. Mostly torchlight, actually.")
- **Alternate tagline on refresh.** Keep the primary hero tagline as-is, but
  stash 2-3 alternate flavor lines and swap in one at random per page load
  (deterministic per session so it doesn't flicker on soft nav). Rewards
  repeat visitors without changing the site's identity.
- **In-world alt text and empty states.** Wherever there's room for flavor
  (status badges, "Next Up" placeholder boxes), lean into tavern voice:
  "Still in the kettle", "Recipe classified".

---

### Suggested first pass

If you want a small, high-impact starting set rather than everything at once:
sign creak and paper rustle (quick wins, all CSS) first, then the
night-sky window and seasonal tavern (medium), then the Konami code or secrets ledger
(the easter eggs most likely to get shared or screenshotted).
