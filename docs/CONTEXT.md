# CONTEXT

Running summary of the portfolio's current state. Keep this current, not historical
(history lives in DECISIONS.md).

## Vision

A portfolio that is **immersive from the first frame** and says one thing without a word of
copy: *this engineer builds things differently.*

The signature piece is **The Figure**: a sculpted, untextured human form standing in the dark,
breathing on a real motion-capture idle — who **notices your cursor and turns to look at you**,
late, the way a person catches movement in a room.

The interaction *is* the thesis. It does not illustrate the CV; it is a live instance of the
work. Three of Suraj's largest projects are the same obsession from different angles:

| Project | What it actually is |
|---|---|
| Jessica | AI VTuber, VRM avatar, mood/expression/gesture state machine |
| Neural Coppelia | 2,000+ mocap clips → semantic descriptions → vector search → LLM-blended body/hand/face layers |
| MotionCaptureXPro | modular Three.js animation engine (Animation/Camera/Light/Model managers) |

**He makes machines move like people.** The hero is that sentence, executed.

## Non-negotiable constraints

- **Native scroll is preserved.** Lenis smooths it; we never virtualize it. Suraj's own
  specialism is WCAG/a11y — a scroll-jacked site would contradict his résumé.
- **Content stays in the DOM.** Real text, real headings, real links. Verified: 7,429 chars.
- **One canvas.** A single fixed fullscreen canvas (`.scene`), DOM layered over it.
- **Palette discipline.** Monochrome. The accent (violet) appears in exactly one place in the
  scene: as a **rim light** raking the figure's edge. Never as a fill, never as decoration.
- **The figure is always the inverse of the page.** Pale and lit in dark mode, graphite in light
  mode — so it always reads as a silhouette against its background.
- **No `elastic` easing.** Bounce is the loudest gimmick tell. The attention spring is
  critically damped: it lags, it never overshoots.

## Architecture

Everything lives in [`src/components/Figure.tsx`](../src/components/Figure.tsx) — one file, one
job. The asset is `assets/figure.glb` (`publicDir` is `assets/`).

**Motion is layered, not baked.** Each frame:

1. the `AnimationMixer` plays the captured **idle** clip — this keeps the body alive
2. the **attention** rotation is then *multiplied into* the animated bone quaternions along the
   chain Spine1 → Spine2 → Neck → Head, with rising weights (0.12 → 0.55)

Multiplying rather than assigning is the whole trick: assignment would flatten the breathing
and leave a stiff mannequin staring at the mouse. Composing on top means it breathes *and*
watches you. This is the same layered-blend idea Neural Coppelia uses.

The attention spring is deliberately slack (k=8, critically damped). That beat of lag is the
entire difference between "a model that follows the cursor" and "someone who noticed you". It
also loses interest: stop moving for 2.6s and it returns to its own business.

## The asset

`assets/figure.glb` — Mixamo "Xbot", a rigged 67-bone humanoid with 7 captured clips
(`idle`, `agree`, `headShake`, `walk`, `run`, `sad_pose`, `sneak_pose`), taken from the
three.js examples repository.

It works precisely **because it ships untextured** — it takes a single monochrome
`MeshStandardMaterial` and reads as a material study, not a game character.

Optimised with `@gltf-transform/cli` (prune + quantize): **2.93 MB → 1.37 MB**. The unused
clips were kept on purpose — `agree` (a nod) and `headShake` are worth spending later.

Lighting is `RoomEnvironment` (procedural, built into three.js) rather than a downloaded HDRI:
same soft studio reflections, zero extra megabytes.

## Measured, not asserted (1440×900, dark)

| | |
|---|---|
| frame rate | **145 fps** (6.9 ms median, 7.1 ms worst) |
| canvases | 1 |
| GLB | 1.37 MB, 59 ms to load |
| DOM text | 7,429 chars |
| document height | 5,432 px (real, not virtualized) |

Attention verified by A/B screenshot: cursor hard-left vs hard-right visibly rotates the chest,
shoulders and head.

## Degradation

- `prefers-reduced-motion` — a single posed frame of the idle, no rAF loop. The figure is the
  *subject*, not an effect; removing it would remove content. What's removed is the motion.
- mobile — figure centred, idle runs, cursor tracking not attached.
- the render loop exits early once the hero scrolls off screen, so the GPU idles below the fold.

## The figure answers the page

Components make the figure react without knowing three.js exists:

```ts
figureGesture('agree') // src/lib/figure.ts → CustomEvent → Figure.tsx
```

A gesture cross-fades out of the idle, plays once, and eases back. It is **refused while
another gesture is running** — a figure that nods twice because you jiggled the mouse is a toy,
not a presence. If no figure is mounted (mobile, reduced motion) the event falls on the floor.

Wired so far:
- hovering **"Get in touch"** → it nods (`agree`)
- copying the **email** in Contact → it nods
- switching to **light mode** → it shakes its head. You turned the lights on; it flinches.
- **scroll velocity** → it leans, then settles back to plumb. Anyone standing on something that
  suddenly moves does this.
- **left alone** → it looks around, on slow incommensurable sines. A figure that snaps to
  dead-centre the instant you stop moving is a machine waiting for input.

**Staging.** The figure belongs to the hero *and to the close*, and to nothing in between — it
fades out below the hero and returns for Contact (which is why `#contact` is transparent and
every other section is opaque). Absence in the middle is what stops it becoming wallpaper. Below
1% visibility the render loop bails, so the GPU idles through the whole middle of the page.

## The cursor

Two marks, and the distance between them is the idea. The **dot** is exactly where you are —
never smoothed, because a pointer that lags is a broken pointer. The **ring** trails it and
swells over anything actionable, so the page acknowledges intent slightly *before* you commit.
Both use `mix-blend-mode: difference`, so they invert over the figure.

The native cursor is only hidden once the custom one is confirmed running (`body.has-cursor`,
set by the component). If the script never runs, you still have a pointer — a page you cannot
point at is not a clever page. Off entirely on touch and under reduced motion.

## Sections

Every section now carries one interaction, and no section carries two.

| Section | Was | Is |
|---|---|---|
| About | skill-chip cloud | editorial spread; skills as a typographic **index**, no pills |
| Experience | bullets crammed in the left half | full-width rows, role left / work right; the spine node fills as you read |
| Projects | 2-column grid of 12 bordered cards | an **index**: hovering a row resolves its detail and dims every other row |
| Contact | centred box with buttons | the email **is** the headline; click to copy, and the figure nods |

The Projects interaction is pure CSS (`:hover` / `:focus-within`, `grid-template-rows: 0fr→1fr`),
so it behaves identically on keyboard and costs no JavaScript. It dims with `filter`, not
`opacity`, because the reveal animation writes an inline `opacity` that would win over the rule.

**Deleted:** the `LineArt` divider — a squiggle, a wireframe cube and a `< >` bracket. It
decorated nothing. The brief bans exactly this.

## Open questions

- Does the figure earn a visible role *below* the hero, or does it belong to the hero alone?
  (It currently stops rendering once the hero scrolls away; the Contact nod happens off-screen.)
- The Lottie scroll-indicator may now be redundant next to the figure.
- Mobile has not had its own layout pass — it is still a narrowed desktop.
