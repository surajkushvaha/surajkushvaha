# Redesign plan — main site, robot, and AI

Written 2026-07-24, before any code. Nothing here is built yet.

This exists because the last few sessions drifted: the `/world` route got all the
attention while the **first** request — "the robot should travel the full website
and interact with it, breaking the fourth wall" — was never actually built, and
"redesign the full site" was answered with a type-scale cleanup rather than a
redesign. This plan is the three outstanding asks, made concrete.

---

## The idea that ties it together

The site is a **page the robot lives on**, not a page with a robot decoration.

Right now the robot is parked in the right-hand gutter and does nothing. Under
this plan every section has a job for it, and the AI's role is to give it
something to *say* — not to give the visitor a text box.

---

## Part 1 — Main site structure

### The problem, stated plainly

Every section is currently the same shape: heading top-left, content below,
full-width container. Nothing varies, so nothing has emphasis, and long prose
sections (About) read as a wall. This is what "koi proper structure nahi" means
in practice.

### Section by section

| Section | Now | Proposed |
|---|---|---|
| **Hero** | Headline + robot + 2 buttons | Keep. Robot gains a wake-up beat. |
| **About** | 3 columns: heading / 4 prose paragraphs / 5 stacked skill lists | One large thesis line, then a two-column split: a short "what I do" and a compact skills index grouped by *depth* (ships daily / reaches for / research), not by category. Cuts the prose roughly in half. |
| **Experience** | Roles listed, large empty left gutter | A real timeline: years run down the gutter so it earns its space; the accent line draws as you scroll (already built); each role is a step, not a bullet list. |
| **Projects** | 1 big card + 3 identical cards | Stop using identical cards. A numbered index (01–04); each row expands on hover to show detail. The featured one gets a real visual, not a bordered box. |
| **Writing** | Card grid (just wired up) | A dense list: date · title · read time. Reads like an index, not a blog template. |
| **Contact** | Large type + email | Keep the type. Robot arrives here for the closing beat. |

**Design constraints**: the existing token system stays (verified contrast, one
accent, oklch). The nine-step type scale stays. No new colours, no cards with
border+shadow, no eyebrow labels over every heading.

---

## Part 2 — The robot travels the site

Today: three stations (hero / gutter perch / contact), and it only slides
between them. It never *does* anything.

Proposed: one station per section, each with a behaviour that matches the
content.

| Section | Where it stands | What it does |
|---|---|---|
| Hero | Right of the headline, full size | Powers up, notices you, small wave |
| About | Sits on the section edge, small | Settles in while you read |
| Experience | Rides **down the timeline** as you scroll | Moves with the accent line — it climbs the career with you |
| Projects | Beside the list | Turns toward whichever project row you hover |
| Writing | Gutter, small | Reading pose |
| Contact | Walks to centre, full size | Gestures at the email, then looks at camera |

**Fourth wall**: stop scrolling and it turns and looks directly at you — the
same behaviour already working in `/world`, ported to the page. It is the one
moment the site admits you are there.

**Cost/risk**: the existing `Figure.tsx` already has a station system, a gait,
and a look-at. This is mostly new stations plus scroll-linked positioning, not
new machinery. Medium effort, low risk.

---

## Part 3 — AI, done as an experience and not a chatbot

### What I got wrong

I built "press T → type a question → get an answer" in the world. That is a
chatbot with a game skin. It gets deleted.

### What replaces it

The AI drives **what the robot says**, and the visitor never types anything.

- As you reach a section, the robot speaks a short line about it in a small
  bubble beside itself.
- Those lines are **generated** from the CV facts (the `api/ask.ts` grounding
  already written), so they are specific and different each visit, rather than
  five hard-coded strings.
- Hovering a project can prompt a line about *that* project.
- Nothing is generated on the critical path: the page renders fully without the
  model, lines arrive after and are purely additive. If the API is down or the
  key is missing, the robot falls back to written lines and nothing looks broken.

That is the honest reading of "immersive AI, not a chatbot": the model animates
a character that is already part of the page, instead of adding a support
widget to the corner.

**Guardrails**: answers stay grounded in the CV (already enforced server-side),
the key stays server-side (already true), one request per section at most, and
generated text is capped short so it cannot blow out the layout.

---

## Order of work

1. **Delete the chatbot** in `/world` (my mistake, smallest and first).
2. **Site structure** — the section-by-section table above. This has to come
   first because the robot's stations are defined against the finished layout;
   doing it after would mean positioning everything twice.
3. **Robot stations + scroll behaviour.**
4. **AI lines** wired into the robot, with written fallbacks.

Steps 2 and 3 are the bulk. Step 4 is small once 3 exists.

---

## Explicitly not in this plan

- **WebGPU.** Attempted and reverted. It needs a raw-GLSL sky rewritten in TSL,
  a fix for three's quantized-skinned-mesh vertex format bug (`unorm32x4`), and
  an MRT setup that every material in the scene cooperates with. The libraries
  are all on latest (React 19, R3F 9, drei 10, postprocessing 3) and that part
  stuck; only the renderer swap was rolled back. Measured framerate was already
  141 FPS, so this buys nothing today.
- **`/world` content visuals** (Experience/About/Projects as 3D objects). Real
  and still outstanding, but it is a separate piece of work from the main site
  and would only stretch this further.
