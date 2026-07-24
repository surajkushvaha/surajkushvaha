# CONTEXT

Running summary of the portfolio's current state. Keep this current, not historical
(history lives in DECISIONS.md).

> **The site is now two things.** `/` is the document portfolio described in the
> rest of this file. `/world` is a walkable 3D world added 2026-07-23. They share
> content and tokens but deliberately differ on colour: a page wants one accent,
> a world wants landmarks. See "The world" at the bottom.

## Where things stand (2026-07-23)

**Done**
- Dark default, ember accent replacing the AI-purple `#7c3aed`, Archivo replacing
  Space Grotesk + Inter. Contrast verified, worst pair 5.89:1.
- Hero stripped of the status pill and the stat row.
- `/world`: five zones, procedural walking, Cuty the companion, Jessica's real
  VRM in the gallery, per-zone coloured lighting.
- `api/ask.ts`: Ollama Cloud behind a serverless function, key server-side.

**Not done, pick these up first**
1. **The redesign is hero-only.** About, Experience, Contact, Header and Footer
   still have the old layout wearing new colours. Body copy across sections is
   set at 13-15px against a 17px base; there are 14 distinct font sizes and no
   type scale.
2. **`/world` has never been verified in a real browser.** It typechecks and
   builds and rendered correctly through several passes, but the last few changes
   (single zone light, Preload removed, three dedupe, Jessica mounted) were made
   after the automation hung. Open it and look before trusting it.
3. **`jessica.vrm` is 16 MB.** Proximity-gated so it only loads near the gallery,
   but it wants optimising before this ships.
4. **The AI is not wired to any UI.** `api/ask.ts` exists and is untested against
   the live Ollama endpoint; nothing in the world calls it yet.
5. Arms-out idle bug and the `favicon.ico` 404 are still open (below).

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

**Corrected 2026-07-23.** What actually ships is `assets/robot.glb` (180 KB), a
custom 8-bone rig (`Root, Torso, Head, Arm_L/R, Leg_L/R, Eye_L/R`) with six clips:
`Dance, Idle, Jump, No, Wave, Yes`. **There is no `walk` or `run` clip.** The
paragraph below described the old Mixamo Xbot, which was replaced and never
written up. The world route works around this with procedural locomotion.

<details><summary>Superseded: the original Xbot description</summary>

`assets/figure.glb` — Mixamo "Xbot", a rigged 67-bone humanoid with 7 captured clips
(`idle`, `agree`, `headShake`, `walk`, `run`, `sad_pose`, `sneak_pose`), taken from the
three.js examples repository.

It works precisely **because it ships untextured** — it takes a single monochrome
`MeshStandardMaterial` and reads as a material study, not a game character.

Optimised with `@gltf-transform/cli` (prune + quantize): **2.93 MB → 1.37 MB**. The unused
clips were kept on purpose — `agree` (a nod) and `headShake` are worth spending later.

Lighting is `RoomEnvironment` (procedural, built into three.js) rather than a downloaded HDRI:
same soft studio reflections, zero extra megabytes.

</details>

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

## Shipped

Live at **https://surajkushvaha.github.io/surajkushvaha/** — `.github/workflows/static.yml` builds
and deploys to Pages on every push to `main`, so a merge to main *is* the deploy.

## Known bugs — pick these up first

1. **The robot's arms stick straight out sideways at idle.** They should hang. This is visible on
   the live site. The confusing part: decoding the `Idle` clip shows its keyframes are *identical
   to the bind pose* (`1.000, 0.000, -0.000, 0.000`), so the arms should hang on their own.
   Something poses them at runtime. Leading suspect is the arm bones' rest quaternion (a 180°
   rotation about X) interacting with how the look-at is composed on top in `Figure.tsx`.
2. **Mobile is broken / not responsive.** It is still a narrowed desktop — no layout of its own.
   The brief calls this out explicitly: *"Mobile should not feel like a reduced desktop."*
3. **`favicon.ico` 404s in production.**
4. **The `Wave` clip also raises the right arm**, which has no keys in that clip — likely the same
   root cause as (1).

## Open questions

- The Lottie scroll-indicator may now be redundant next to the robot.
- Mobile has not had its own layout pass — it is still a narrowed desktop, which the brief
  explicitly calls wrong.
- Boredom (`Dance` after 22s) is currently the only unprompted behaviour. Worth more?

---

# The world (`/world`)

A walkable 3D portfolio on React Three Fiber, lazy-loaded as its own chunk so
nobody landing on `/` pays for it.

## The conceit

**The world is built by the projects it is showing you.** ProjectArch extrudes 2D
plans into 3D buildings, so its exhibit is an extruded building. Jessica is the
actual 16 MB VRM from the Jessica project standing on a plinth, not a picture of
one. Neural Coppelia is a scatter of motion samples blending into a shape. The
medium is the evidence.

## Layout

Orthogonal, and the geography means something.

```
                    Signal Tower (0,-104)   cyan   the exit
                             |
              Experience Boulevard (0,-64)  amber  four monoliths, tallest = newest
                             |
   Workshop (-58,-30) ---- (0,-30) ---- Gallery (58,-30)
        orange                              violet
                             |
                      The Grid (0,0)        blue   spawn
```

## Why locomotion is procedural

`robot.glb` has no walk clip, but that is the smaller reason. A fixed-speed
baked clip in a free-movement world always slides its feet against the ground.
Driving the leg swing from actual velocity means the gait is correct at every
speed for nothing, and mechanical motion suits a robot anyway.

The baked clips are deliberately **not** mounted: they animate the same arm and
leg bones the procedural gait writes to, so running both means two systems
fighting over one skeleton. Blending them properly is its own feature.

## The fourth wall

Stop moving and the camera drifts in and settles slightly off-axis, and the
robot finds the camera and turns to look at you. The delay before it does
(~1.1s) is the entire effect: snapping to face the lens the instant you release
the key reads as a bug, not as attention. Its neck has a limit, so past ~66
degrees it just looks away rather than spinning its head.

## Rules the world enforces on itself

- **One point light per zone.** Every material compiles against the full light
  count, so a second light per zone doubles uniform cost on every shader and
  stalls the first frame. The kerbs are emissive, not lit, which buys the ground
  glow for free.
- **The world pins its own palette.** `.world` redeclares `--fg`, `--accent`,
  `--figure` etc. because it is always night; inheriting the document's tokens
  painted dark text and a graphite robot onto dark ground whenever the site was
  in light mode.
- **`three` is deduped in `vite.config.ts`.** `@pixiv/three-vrm` resolves its own
  copy otherwise, which means two class registries and every `instanceof
  THREE.Mesh` against a VRM object silently returning false.

## The accessible half

`/` is the fallback, not a second thing to maintain: same content, real headings,
real links, crawlable. The world's entry gate links to it explicitly. A walkable
world cannot be screen-read, and that constraint is why the document site was
kept rather than replaced.
