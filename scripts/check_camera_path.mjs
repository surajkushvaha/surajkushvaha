/**
 * Assert the landing's camera flight never flies into the island.
 *
 * There is no way to eyeball this without opening a browser, and getting it
 * wrong is not subtle: the camera ends up inside a rock and the hero shot is a
 * grey wall. So the path is checked arithmetically instead.
 *
 * Keep the numbers below in sync with PATH in src/site/StageScene.tsx and
 * ISLAND in src/world/scene.ts.
 *
 *   node scripts/check_camera_path.mjs
 */

const ISLAND = { cx: 0, cz: -6, r: 33 }
const ROBOT_AT = [-23.6, 0, -9.2]
const ROBOT_H = 9.5

const PATH = [
  { a: -Math.PI * 0.62, r: 100, h: 31, t: [ISLAND.cx + 2, -4, ISLAND.cz] },
  { a: -Math.PI * 0.5, r: 62, h: 18, t: [ISLAND.cx, 3, ISLAND.cz] },
  { a: -Math.PI * 0.4, r: 42, h: 11, t: [ROBOT_AT[0] * 0.5, 6, ROBOT_AT[2] * 0.5] },
]

/** tallest thing standing on the rim, plus its offset: rim rocks reach ~6.6 */
const RIM_TOP = 6.6
/** the grass disc's own radius; nothing may pass inside this below RIM_TOP */
const SOLID_R = ISLAND.r + 1.5
const FOV_Y = 40
const ASPECT = 16 / 9

const lerp = (a, b, t) => a + (b - a) * t
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

function sample(p01) {
  const p = ease(p01)
  const seg = p * (PATH.length - 1)
  const i = Math.min(Math.floor(seg), PATH.length - 2)
  const f = seg - i
  const A = PATH[i]
  const B = PATH[i + 1]
  const a = lerp(A.a, B.a, f)
  const r = lerp(A.r, B.r, f)
  const h = lerp(A.h, B.h, f)
  return {
    pos: [ISLAND.cx + Math.cos(a) * r, h, ISLAND.cz + Math.sin(a) * r],
    target: [lerp(A.t[0], B.t[0], f), lerp(A.t[1], B.t[1], f), lerp(A.t[2], B.t[2], f)],
    r,
    h,
  }
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const len = (v) => Math.hypot(...v)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

let failures = 0
const fail = (m) => {
  console.error('  FAIL ' + m)
  failures++
}

// ---- 1. the camera never enters the island's solid volume
for (let i = 0; i <= 100; i++) {
  const p = i / 100
  const s = sample(p)
  const flat = Math.hypot(s.pos[0] - ISLAND.cx, s.pos[2] - ISLAND.cz)
  if (flat < SOLID_R && s.pos[1] < RIM_TOP) {
    fail(`p=${p.toFixed(2)} camera inside island: flat=${flat.toFixed(1)} (<${SOLID_R}) at h=${s.pos[1].toFixed(1)} (<${RIM_TOP})`)
    break
  }
}
console.log('1. camera stays clear of the island volume')

// ---- 2. the camera only ever moves closer, never jitters back out
let prev = Infinity
for (let i = 0; i <= 100; i++) {
  const s = sample(i / 100)
  if (s.r > prev + 0.01) {
    fail(`radius increases at p=${(i / 100).toFixed(2)}: ${s.r.toFixed(1)} > ${prev.toFixed(1)}`)
    break
  }
  prev = s.r
}
console.log('2. the fly-in is monotonic (never reverses)')

// ---- 3. the robot is inside the frustum at the end of the path
{
  const s = sample(1)
  const fwd = sub(s.target, s.pos)
  const toRobot = sub([ROBOT_AT[0], ROBOT_AT[1] + ROBOT_H / 2, ROBOT_AT[2]], s.pos)
  const ang = (Math.acos(dot(fwd, toRobot) / (len(fwd) * len(toRobot))) * 180) / Math.PI
  const halfH = FOV_Y / 2
  const halfW = (Math.atan(Math.tan((FOV_Y / 2) * (Math.PI / 180)) * ASPECT) * 180) / Math.PI
  if (ang > Math.min(halfH, halfW)) {
    fail(`robot ${ang.toFixed(1)}deg off axis at p=1, outside the ${halfH.toFixed(1)}deg vertical half-fov`)
  } else {
    console.log(`3. robot framed at p=1 (${ang.toFixed(1)}deg off axis, half-fov ${halfH}deg v / ${halfW.toFixed(1)}deg h)`)
  }
}

// ---- 4. the robot stands on the island, not off its edge
{
  const flat = Math.hypot(ROBOT_AT[0] - ISLAND.cx, ROBOT_AT[2] - ISLAND.cz)
  if (flat > ISLAND.r - 4) fail(`robot ${flat.toFixed(1)} from centre, too close to the ${ISLAND.r} rim`)
  else console.log(`4. robot on solid ground (${flat.toFixed(1)} from centre, rim ${ISLAND.r})`)
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
