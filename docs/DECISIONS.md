# DECISIONS

Append-only. One entry per meaningful decision.

---

## [2026-07-13] Kill the exploded compute module

**Context:** The hero's signature piece was a machined "compute module" that came apart into an
annotated exploded view on scroll, with labels naming Suraj's stack (Kafka, Rust, Elasticsearch).
It was built with throwaway `BoxGeometry` plates specifically so the *motion* could be judged
before any Blender time was spent on the real asset.

**Decision:** Killed at the go/no-go gate. Suraj scrolled it and rejected it as gimmicky.

**Why it failed (the useful part):** the metaphor was a **pun** — stack of plates = tech stack.
It illustrated the résumé rather than demonstrating anything, and decorative metaphors read as
gimmicks no matter how well they are rendered. No amount of Blender polish would have saved it.

**What the staging bought:** the concept died having cost six boxes and zero asset work. This is
the plan working, not failing.

**Rejected alternatives at this point:** tuning the explode (separation, damping, camera) —
rejected because the defect was conceptual, not parametric.

**Files touched:** deleted `src/components/Scene.tsx`; prior docs discarded at Suraj's request
(recoverable in `git stash`).

---

## [2026-07-13] The Figure — a body, not an object

**Context:** Needed a replacement signature piece. Constraints: immersive from load (Suraj had
already rejected a flat type-led hero), must mean something about *him* specifically, must not
scroll-jack (he is a WCAG specialist), one canvas, monochrome.

**Decision:** The hero holds a **human figure** that breathes on a real motion-capture idle and
**turns to look at the cursor**, late, with the delay of a person noticing movement in a room.

**Why:** reading his real projects, one through-line dominates and it is not "full-stack SaaS
engineer". Jessica (VRM avatar + expression state machine), Neural Coppelia (2,000+ mocap clips,
vector search, LLM-blended animation layers) and MotionCaptureXPro (a Three.js animation engine)
are all the same obsession: **he makes machines move like people.** The figure is not an
illustration of that sentence — it is an instance of it. The interaction *is* the thesis.

**Rejected:**
- *Latent Space* — a drifting field of motion embeddings, cursor as query, nearest neighbours
  illuminating. Honest to Neural Coppelia, but a field of points is one bad decision away from
  "particles", the most generic 3D there is.
- *The Perception Layer* — the hero re-rendered through WCAG modes (contrast, focus order, the
  screen-reader tree). Genuinely unprecedented, but conceptual, preachy, and cold.

**Files touched:** `src/components/Figure.tsx`, `src/App.tsx`.

---

## [2026-07-13] Use a real rigged asset instead of hand-rolled geometry

**Context:** The Figure was first built from scratch: a 22-joint skeleton in `src/three/skeleton.ts`
with procedural forward kinematics and layered sine oscillators for breath/weight/attention.
Two abstractions rode it — a joint-and-bone "constellation" and a ~15k-point volumetric cloud.

**Decision:** Threw both out. Downloaded a **real rigged humanoid with real motion capture**
(Mixamo "Xbot" from the three.js examples repo) and rendered it as a lit, sculpted, untextured
body.

**Why:** Suraj's call, and he was right. The hand-built versions looked amateur — the
constellation was a stick figure (the single most generic form in 3D), and the cloud, while
better, was still an approximation of a body made of capsules. Building the geometry by hand was
craft spent in the wrong place: there are excellent free assets, and refusing to use them
produced a worse result. **The correct laziness is to buy the body and spend the craft on the
behaviour.**

**What survived the rewrite:** the *idea* — layered motion with attention composed on top. It is
now expressed against a real 67-bone rig: the mixer plays the captured idle, then the attention
rotation is multiplied into the animated bone quaternions (Spine1 → Spine2 → Neck → Head, rising
weights). Multiplying rather than assigning is what keeps it breathing *while* it watches you.

**Rejected:**
- *Hand-authoring the model in Blender* — reproducible and git-reviewable, but weeks of work to
  land below the quality of a free asset that already exists.
- *Downloading a Poly Haven HDRI* — real studio lighting, but `RoomEnvironment` (procedural,
  already in three.js) gives equivalent soft reflections for zero extra megabytes.
- *Shipping the raw 2.93 MB GLB* — optimised to **1.37 MB** with `@gltf-transform/cli`
  (prune + quantize). The 6 unused clips were **kept deliberately**: `agree` (a nod) and
  `headShake` are worth spending later.

**Files touched:** `src/components/Figure.tsx` (rewritten), `assets/figure.glb` (new),
deleted `src/three/skeleton.ts`.

---

## [2026-07-13] Delete the line-art divider; rebuild all four sections

**Context:** Suraj scrolled the site (I had not — I judged the hero alone and reported on it,
which was the actual failure here) and called out the divider illustration and the total absence
of micro-interactions.

**Decision:**
- **Deleted `LineArt.tsx`.** It drew a squiggle, a wireframe cube and a `< >` bracket. It
  illustrated nothing and the brief bans decoration outright. Not replaced with a downloaded
  Lottie — the section did not need better art, it needed to not exist.
- **Rebuilt About, Experience, Projects, Contact**, each with exactly one interaction.
- **Gave the figure a channel to the page** (`src/lib/figure.ts`): components dispatch
  `figure:gesture` and it reacts, without knowing anything about three.js.

**The reasoning that matters — Projects:** twelve bordered cards in a grid gives every project
identical weight and asks you to read all of them at once. An index gives you the names at a
glance and the detail only where you look. Hovering a row resolves it and recedes the others:
**attention is the mechanic.** Built in pure CSS so it works on keyboard focus and ships no JS.

**Rejected:**
- *Skill chips that filter the project list on hover.* Real, data-driven — but About sits far
  above Projects, so you would never see the effect. An interaction whose result is off-screen is
  not an interaction.
- *A downloaded Lottie to replace the divider.* Swapping bad decoration for better decoration.
- *`opacity` for the row dimming.* The reveal animation writes an inline `opacity`, which wins
  over a stylesheet rule. Dimming uses `filter: opacity()` instead.

**Files touched:** deleted `src/components/LineArt.tsx`; rewrote `About.tsx`, `Projects.tsx`,
`Contact.tsx`; reworked experience/about/projects/contact CSS in `global.css`; new
`src/lib/figure.ts`; `Figure.tsx` gained the gesture channel; `App.tsx`, `Hero.tsx`.

## [2026-07-23] The portfolio becomes a walkable world at /world

**Context:** Suraj asked for the robot to stop being a hero ornament and become
something you explore a world with, breaking the fourth wall, with AI via Ollama
Cloud. Four scroll-based traversal models were proposed and all four rejected:
he wanted a literal 3D game world with WASD movement, zones and a companion,
not a scroll metaphor.

**Decision:** A second route, `/world`, built on React Three Fiber. The existing
document site at `/` stays exactly as it is and becomes the accessible,
crawlable version rather than a thing to maintain twice. Both read the same
content. The gate links to `/` for anyone who would rather read.

Five zones (Grid, Experience Boulevard, Workshop, Gallery, Signal Tower) laid
out orthogonally so the geography carries meaning: the timeline runs north as
one road because chronology has direction; the gallery is a wide field because
those projects are parallel.

**Rejected:**
- *R3F v9* - needs React 19, project is on 18. Took the v8 line rather than
  forcing a React major upgrade for one route.
- *RPG skill tree for the skills zone* (in Suraj's own spec) - a stat sheet
  reads junior and undercuts the seniority the rest of the site argues for.
  Replaced with a workshop bench: "ships daily / reaches for often / specialist
  ground / research shelf".
- *Baked walk clips* - `robot.glb` has none (see below), and a fixed-speed clip
  in a free-movement world always slides its feet. Locomotion is procedural,
  driven by actual velocity, so gait is correct at every speed for free.
- *Unity locomotion FBX found on D:* - Unity Companion License, not appropriate
  to ship on a personal site.
- *One accent colour, as the document site uses* - correct for a page, wrong for
  a world. Each zone now burns its own colour so the world is navigable by eye
  from across the dark. This is the one rule the two halves deliberately differ on.

**Two bugs found in the process:**
1. `docs/CONTEXT.md` claimed `robot.glb` ships `walk`/`run`. It does not: the
   clips are `Dance, Idle, Jump, No, Wave, Yes`. The doc was describing the old
   Mixamo Xbot asset, not what shipped.
2. `useReveal` matched `.about-col` as both the section head and a batch item,
   so two competing GSAP tweens left the About heading stuck at `opacity: 0`.
   It was invisible on the live site.

**Files touched:** `src/world/*` (new), `src/styles/world.css` (new),
`api/ask.ts` (new), `src/App.tsx`, `vite.config.ts`, `.gitignore`,
`.env.example` (new), `assets/jessica.vrm` (new).

---

## [2026-07-23] Ollama Cloud runs server-side, and does not write Cuty's lines

**Context:** Suraj added `OLLAMA_API_KEY` to `.env` and asked for AI in the
companion.

**Decision:** A Vercel edge function at `api/ask.ts` holds the key. Deliberately
not `VITE_`-prefixed, since anything with that prefix is inlined into the client
bundle and would be public.

The scripted lines stay scripted. Zone greetings and fourth-wall beats are
written, not generated: they are deterministic signals already in the DOM, and a
written line is instant, free and funnier. The model is reserved for the thing
that cannot be scripted, a recruiter asking something specific and getting an
answer grounded in the CV embedded in the function.

**Rejected:** *local Ollama at localhost:11434* - only works on Suraj's own
machine, so every visitor would get a companion that silently fails to connect.

**Security note:** `.env` was NOT gitignored when the key was added. The repo is
public. Verified the key was never committed (`git log --all -- .env` empty,
file untracked) and added `.env` to `.gitignore`. No rotation needed.

**Files touched:** `api/ask.ts`, `.env.example`, `.gitignore`.

---

## [2026-07-23] Dark by default, and the accent stops being AI purple

**Context:** A redesign pass using the design-taste skill, before the world work.

**Decision:** Dark is now the default theme, which is what `docs/CONTEXT.md`
described all along but the site never did. `#7c3aed` replaced with an
ember/tungsten `#f1a156`: that exact violet is the single most recognisable
LLM-design tell. Fonts moved off Space Grotesk + Inter, both reflex AI defaults,
onto Archivo. All six text/background pairs verified against WCAG with a script
rather than asserted; worst pair is 5.89:1.

Deleted from the hero: the "Open to new opportunities" pill (eyebrow + decorative
status dot) and the "3+ years / 12+ projects" stat row (the SaaS hero-metric
template, and "3+ years" argues you are junior in the first screen).

**A three.js bug this surfaced:** `--accent` was authored in `oklch()`, which
`THREE.Color` cannot parse. It warned and silently left the rim light white,
which is why the figure looked flat. The two tokens WebGL reads are now shipped
as resolved hex.

**Still outstanding:** this pass covered the hero and the token system only.
About, Experience, Contact, Header and Footer have not had a layout pass.

**Files touched:** `src/styles/global.css`, `src/components/Hero.tsx`,
`src/components/Figure.tsx`, `src/hooks/useTheme.ts`, `index.html`.

## [2026-07-24] ProjectArch exhibit: twin shafts, not a terraced ziggurat
**Context:** The Gallery's ProjectArch exhibit was three plain `boxGeometry`
cubes. It is the one object in the world that has to look like the output of
the project it represents (ProjectArch extrudes 2D floor plans into 3D
buildings), so it should be the showpiece and it was the weakest thing there.

**Decision:** Modelled `projectarch.glb` in `scripts/build_world.py`: two
shafts of unequal height split by an open atrium, joined near the top by a
sky bridge, with cantilevered floor plates that overhang into the slot from
both sides. Blueprint markup is three teal lines in R3F at the podium, bridge
and high roof.

Built in Blender rather than as R3F primitives because `boxGeometry` cannot
bevel, and the chamfer that catches a sliver of light on every edge is the
whole difference between architecture and programmer placeholder in this
world. The existing `cube`/`bevel`/`join` helpers already did the work.

**Rejected:**
- *A four-level terrace stepping back on all sides with a hole down the
  middle* — built it, rendered it, threw it away. Failed twice over: a void
  inside a closed box is invisible from the ground because the rear wall sits
  right behind it, so the concept was inert; and stepping back on four sides
  is a ziggurat, which `block_step` in the kit already is, so the showpiece
  read as scenery. The atrium has to be a slot you see SKY through.
- *Matching plate heights on both shafts* — the eye joined each pair across
  the gap into one line and it read as a shelving unit sawn down the middle.
  Offset them.
- *A painted line on every cantilevered plate* — six accent lines up a white
  model stops being an accent and becomes the paint scheme. Three marks at
  the levels that mean something read as annotation.

**Verification:** rendered in isolation under the site's light rig via
`scripts/preview.py` + a scratch single-prop render, then checked in-world at
walking distance. 105 KB, 84 faces.

**Files touched:** `scripts/build_world.py`, `scripts/preview.py`,
`src/world/Terrain.tsx`.

## [2026-07-24] World redesign: floating pine island, not an open maquette plain
**Context:** Suraj rejected the entire 3D world except the robot ("sab bakwas
except the robot"), specifically the warm/brown tones and the empty boxy feel.
He asked for a cool, light, calm palette and, when offered options, chose a
"small dense diorama" over the open world.

**Decision:** Replaced the open plain of white Blender-maquette boxes with a
single small **floating island** (`scene.ts` + rewritten `Terrain.tsx`):
- Real **Quaternius CC0** assets (`assets/nature/`, via poly.pizza), one pack
  for style unity: pines, trees, autumn tree, bushes, flowers, mushrooms, rocks.
- Cool palette: periwinkle sky, sage grass, slate rock. The rocks ship a warm
  brown texture, so every rock is retinted cool via `Prop`'s `colour` (which now
  also drops the baked map so the tint reads pure).
- Layout + colliders share one deterministic source (`scene.ts`): what you see
  is what you collide with. Player can't walk through trunks/rocks, can't walk
  off the island edge.
- Per-zone landmarks (ascending pines = career, rock knot = workshop, hero pine
  + high beacon gem = tower), drifting clouds under the rim, subtle worn-grass
  trails, a gentler idle camera.
- Robot recoloured to white body / black face / white eyes (Suraj's request);
  its mechanics are untouched. Depth-of-field removed (read as a smeared lens).

Verified live via Chrome DevTools screenshots at multiple zones.

**Rejected:**
- *Keeping the white maquette buildings on the island* - two art styles (flat
  white card vs textured stylized nature) fighting; dropped, `build_world.py` and
  `assets/props/` remain in the repo but unused.
- *Depth of field* - blurred what the eye wanted sharp at this camera distance.
- *Stone-tile paths* - too much clutter on a dense island; used faint grass
  ribbons instead.

**Files touched:** `src/world/scene.ts` (new), `Terrain.tsx`, `World.tsx`,
`Robot.tsx`, `Prop.tsx`, `zones.ts`, `styles/world.css`, `assets/nature/` (new).

## [2026-07-24] World performance, and a type scale for the site
**Context:** Suraj reported the world hanging, asked for WebGPU, found no way
back from /world to the site, and asked for the main page to be redesigned.

**Decision:**
- *Hang:* profiled rather than guessed. Steady state was already 141 FPS; the
  problem was payload. `jessica.vrm` is 16.6MB and was loading **at spawn**,
  because her proximity gate was `d < 34` on an island of radius 33 - the gate
  never gated anything. Gate tightened to 15 and the file is now warmed on
  `requestIdleCallback` after the world is interactive, so it blocks neither
  startup nor arrival. Pine textures resized 2048->256 (4.4MB -> 780KB).
  Startup-blocking payload: **21.9MB -> 2.21MB**.
- *Exit:* added a persistent "Back to the site" control to the world HUD. A
  plain anchor, not a router link, so the WebGL context is torn down.
- *Type scale:* the site had 25 distinct font sizes, twelve between 10.5px and
  17px. Replaced with a nine-step scale as tokens; 58 declarations remapped,
  nothing left off-scale, nothing below 12px.
- *Figure bug:* the robot's perch was a hard-coded world `x = 3.0`, which at
  fov 30/z 9.2 lands at ~1497px on a 1900px viewport while the 1240px
  container's right edge is at 1570px - it stood inside the reading column and
  covered project body text. The perch is now derived from the container edge,
  with a corner fallback when there is no usable gutter.

**Rejected:**
- *WebGPU.* Needs R3F v9 -> React 19, drei v10, a postprocessing rewrite, and
  would likely break three-vrm's MToon shaders. It is a rendering-API change
  and the bottleneck was a 16.6MB download, so it would have fixed nothing that
  was actually wrong. Instancing (~170 draw calls -> ~13) is the real lever if
  more headroom is ever needed.
- *Compressing jessica.vrm with gltf-transform.* It produced 202KB but stripped
  VRMC_vrm, VRMC_springBone and VRMC_materials_mtoon, which would leave a file
  three-vrm cannot read as a VRM. Needs a VRM-aware tool. Original backed up to
  `art/original-assets/`.

**Files touched:** `src/world/Jessica.tsx`, `World.tsx`, `styles/world.css`,
`styles/global.css`, `components/Figure.tsx`, `assets/nature/pine-*.glb`.

## [2026-07-24] Landing rebuilt from scratch against Suraj's references
**Context:** Suraj called the redesign "shit", then sent eight references
(igloo.inc, hatom.com, growon.kr, hauntedhouse.webflow.io, messenger.abeto.co,
david-hckh.com, a vev.design technique article, the Noomo Beat shot, and
"talking tom interaction") and said to treat it as building from scratch. Full
analysis in `docs/ART_DIRECTION.md`.

**Decision:** `/` now opens on a full-viewport signature scene - the floating
island that already existed behind the `/world` link - with the robot standing on
it, and the document sections follow underneath.

- **Full-bleed 3D, no reading container.** growon states the principle in its own
  subtitle: "websites anchored by one memorable signature scene".
- **Scroll drives the camera, not the page.** The stage is 2.8 viewports tall with
  the canvas pinned inside it, flying the camera along three keyframes from a wide
  establishing shot down to the robot, with three text beats.
- **Chrome cut to four small things** (wordmark, sound toggle, scroll cue, poke
  hint). The vev best practice - "avoid a menu with multiple pages" - killed the
  five-item nav I had built an hour earlier.
- **Atmosphere:** growon's radial vignette in CSS, thicker fog, clouds passing far
  below.
- **Poke reactions per body part** (talking tom): head, chest and legs each have
  their own line and animation, and every third poke breaks the fourth wall -
  which was Suraj's very first request and had never shipped. Nothing uses
  Math.random.
- **Sound synthesised in WebAudio** - three detuned oscillators through a lowpass
  with a slow LFO, plus a poke blip. No audio file: a non-obvious loop would be
  larger than the rest of the page.
- **AI speaks through the robot, never a text box.** `RobotVoice` says one short
  line per section, generated and grounded in the CV, with a written fallback
  shown first so the page is complete with the model unavailable.

**Bugs found and fixed on the way:**
- The clouds were faceted low-poly icosahedra sitting between an outside camera
  and the island, reading unmistakably as floating white rocks. Pushed far below
  and out, smoothed, made translucent.
- The robot was invisible twice. Cause: I derived screen-right by eye. The actual
  basis is `cross(up, normalize(camera - target))`, which on this arc is
  **negative x**; both guesses put it behind the island or behind the headline.
  Position is now computed, exported as `ROBOT_AT`, and shared with the camera path.
- Poking was dead. Two causes, both silent: the hit boxes were authored at the
  GLB's native ~1.5-unit scale while the normalising scale lives inside the clone
  (so they were a knee-high cluster on a 9.5-unit robot), and they were
  `visible={false}`, which three's raycaster skips entirely. Boxes are now derived
  from `HEIGHT` and use a transparent material.
- `--accent` had drifted back to `#7c3aed`, the generic AI-violet, while its own
  comment still described the ember. Measured 2.93:1 on the dark background,
  under even the 3:1 floor for large text. Restored to `#f1a156` (7.93:1).
- **`api/ask.ts` returned an empty answer for most questions.** gpt-oss is a
  reasoning model and draws `thinking` and `content` from the same `num_predict`
  budget; at 220 the reasoning consumed all of it (measured: 956 characters of
  thinking, zero of answer). Fixed with `think: 'low'`, which also runs faster
  (1.6s against 2.5s). `think: false` is ignored by this model.

**Verification without the browser.** Suraj asked me not to use the MCP browser
bridge, so: `scripts/check_camera_path.mjs` asserts the flight never enters the
island's solid volume, never reverses, and still frames the robot; the AI prompts
were exercised with curl against the running endpoint and their answer lengths
checked against the caption cap; typecheck and build gate the rest.

**Rejected:** the deep-indigo emissive palette from Haunted House, despite it
being the closest reference to the asset. Suraj has said "cool and calm, light,
easy on the eyes" consistently and rejected warm, brown and neon; that is the one
durable aesthetic instruction in the whole conversation.

**Files:** `src/site/Stage.tsx`, `StageScene.tsx`, `StageRobot.tsx`,
`RobotVoice.tsx`, `useAmbient.ts`, `src/styles/stage.css`, `voice.css`,
`components/Home.tsx`, `world/Terrain.tsx`, `api/ask.ts`,
`scripts/check_camera_path.mjs`, `docs/ART_DIRECTION.md`.
