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
