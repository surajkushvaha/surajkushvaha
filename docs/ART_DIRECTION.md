# Art direction, from Suraj's references

All eight studied in the browser. An earlier version of this file was written
after looking at only three and claimed otherwise; this replaces it.

| Reference | What it actually is |
|---|---|
| **hatom.com** | Near-white. A designed *loading sequence* ("LOADING 5 PHASES", a % counter, "HEADPHONES RECOMMENDED"), then a huge black wordmark centred over a barely-there pencil-line 3D landscape. "CLICK TO ENTER". Extreme restraint. |
| **igloo.inc** | Cold monochrome. A photoreal igloo on an arctic plain, full bleed. Copy is tiny mono pinned to the four corners; no nav bar at all. Technical crosshair annotations (36 / 40 / 42) drawn on the igloo make it read as an instrument. Sound toggle. "Scroll down to discover." |
| **growon.kr** | Steel-blue **radial vignette** background. One photoreal desk scene floating with no floor, just contact shadows. Light-weight type centred *above* it. Circular icon buttons in the corners. Its own subtitle states the thesis: *"Building websites anchored by one memorable signature scene."* |
| **hauntedhouse.webflow.io** | **A floating island as the hero.** Deep indigo atmosphere with fog. Island centre-right, dramatic **emissive** light (glowing windows, lanterns). Title left in two faces, paragraph, two pill CTAs. The closest reference to what Suraj already has. |
| **messenger.abeto.co** | Flat saturated teal. A floating 3D island, with enormous display type sitting *inside* the scene and occluded by it. One CTA: "BEGIN". |
| **david-hckh.com** | Warm cream. A stylized clay 3D scene (him at a desk) taking ~60% of the viewport, name huge in dark type beside it. Pill nav centre-top, saturated orange pill CTA, sound toggle, scroll cue. A personal portfolio, so the most directly comparable. |
| **vev.design article** | The technique list: micro-interactions, parallax, 3D visuals, audio+video, horizontal scrolling. Best practices below. |
| **"talking tom"** | Poke the face, the belly or the feet and each gives a *different* reaction — one of them is tapping on the camera. Immediate, fluid, sound-matched. Variety is what makes it worth repeating. |

## What every single one of them does, and this site does not

1. **One memorable signature scene.** growon writes it out loud. Not a decoration in a gutter.
2. **Full-bleed 3D in the first screen.** No 1240px reading container.
3. **Chrome is a few small floating things.** Tracked caps or mono, in the corners. None of them has a conventional header bar with five links, a search field and a theme toggle.
4. **Sound is first-class.** hatom recommends headphones before you enter; igloo, growon and david all ship a toggle.
5. **An entry moment.** "CLICK TO ENTER" / "Scroll down to discover" / "BEGIN". The `/world` gate is already exactly this and it is currently wasted on a hidden route.
6. **Atmosphere, never flat.** A radial vignette (growon), fog (igloo, haunted), or emissive glow (haunted). Suraj's island is flat daylight, which is why it reads as a diagram rather than a place.
7. **The character reacts to you** with immediate, *specific* feedback (talking tom).

## From the vev best-practice list, verbatim-ish

- **"Avoid a menu with multiple pages. Ideally, an immersive website should be contained within a single page."** — this rules out the current `/`, `/work`, `/world` split and the five-item nav.
- "Don't put too many things into motion on a single screen."
- "Have a focus: build around communicating a single story."
- "The UI should be straightforward, every action obvious."

Horizontal scroll is called out specifically for a *timeline* — which is exactly what the Experience section is.

## Noomo Beat, and what "AI, not a chatbot" means

Noomo Beat generates music from a short quiz (genre, mood, tempo, colour) and the
3D scene then reacts to that audio in real time. The AI changes **the world**, not
a message list. That is the model to copy: no text box anywhere.

## The direction

Suraj already owns the expensive part and has approved it: the floating pine
island, the robot with its gait and look-at, the cool light palette. Haunted
House and abeto prove the floating island *is* a hero-worthy signature scene.

So:

1. **`/` becomes the scene.** Island full-bleed, robot standing on it. The
   existing gate becomes the entry moment.
2. **One page.** `/work` and `/world` fold in; scroll moves the camera and the
   places come to you. No five-item nav.
3. **Add the atmosphere the island is missing** — a radial vignette behind it,
   fog, and *emissive* accents (the lit-window trick from Haunted House; here it
   would be the waypoint gems and lamps) so it stops being flat daylight.
4. **Type at display scale, composed with the geometry**, allowed to be occluded.
5. **Poke the robot → a specific reaction per part.** Head, chest, feet each get
   their own, and one of them is it tapping the camera. This is both the
   "talking tom" note and the "unique expressions, not random" instruction, and
   it finally delivers the fourth-wall break from the very first request.
6. **Sound**: an ambient bed plus short interaction blips, off by default, with a
   toggle in the corner.
7. **AI changes the scene, never a chat box.** Grounded in the CV that
   `api/ask.ts` already carries.

## The one open decision

The references split on palette and I should not average them:

- **Cool + light** (abeto / growon / hatom family) — matches the island already
  built and Suraj's stated "cool and calm, easy on the eyes".
- **Deep atmospheric + emissive** (Haunted House) — more dramatic, more
  "premium game", and it is the reference closest to his actual asset. Would mean
  re-lighting the island toward dusk so the glow reads.

Both are defensible. Needs one word from him before the lighting is rebuilt.
