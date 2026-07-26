import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useIsMobile, usePrefersReducedMotion } from '../hooks/useMediaFlags'

/**
 * The signature piece: a small robot who is *watching you use the site*.
 *
 * It idles, it tracks your cursor, it waves when you go to contact, it gives
 * you a thumbs-up when you take the email, it shakes its head when you turn the
 * lights on, and if you leave it alone long enough it gets bored and dances.
 *
 * The previous body was an anatomically-correct mocap human. It was *technically*
 * animating — the idle breath measurably changed the render — but you could not
 * see it, and an animation nobody perceives is not an animation. Character beats
 * fidelity: this robot has a face, and a face reads across a room.
 *
 * Behaviour is layered, which is the same structure Neural Coppelia uses to
 * blend motion: the clip drives the body, and the look-at is composed *on top*
 * of whatever pose the clip produced, so it keeps watching you mid-wave.
 */

type Gesture = 'Wave' | 'Yes' | 'No' | 'Jump' | 'Dance'

/** Bones the look-at writes into. The body leads a little, the head does the rest. */
const LOOK_CHAIN: [string, number][] = [
  ['Torso', 0.22],
  ['Head', 0.75],
]

/** Bored long enough and it entertains itself. */
const BOREDOM_MS = 22000

export default function Figure() {
  const mount = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  useLayoutEffect(() => {
    const host = mount.current
    if (!host) return

    let disposed = false
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture
    // RoomEnvironment at full strength is a lit studio, which flattens the
    // figure into a product shot. Held right down, it survives only as the
    // faint bounce an unlit room actually has.
    scene.environmentIntensity = 0.35

    const camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    )
    // framed so it stands in the right-hand column with room to breathe above it
    camera.position.set(0, 1.15, 9.2)
    camera.lookAt(0, 1.05, 0)

    // One room, one light: a dim key so the form is readable, and a hard rim
    // carrying the accent so the edge is the brightest thing on the figure.
    // Ambient is kept near zero on purpose - fill light is what made this read
    // as a toy on a white page instead of something standing in the dark.
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    // high and only slightly to one side, so the shadow pools under the feet
    // instead of being thrown sideways as a slab
    key.position.set(-1.6, 7, 2.4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    // the shadow camera is cropped tight to the figure: a smaller frustum over
    // the same map is what buys a soft edge rather than a stair-stepped one
    key.shadow.camera.top = 3.2
    key.shadow.camera.bottom = -0.6
    key.shadow.camera.left = -2
    key.shadow.camera.right = 2
    key.shadow.radius = 5
    key.shadow.bias = -0.0015

    // Pulled round toward the camera. Directly behind, the rim lands on edges
    // the camera cannot see and the accent is spent on nothing; grazing from
    // the side is what puts a lit edge on a visible silhouette.
    const rim = new THREE.DirectionalLight(0xffffff, 5.5)
    rim.position.set(5, 1.8, -0.6)
    scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.18))

    // It was floating. A figure with no contact shadow is a sticker, and the
    // shadow is most of what sells "standing in a room".
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.42 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const root = new THREE.Group()
    // The asset already faces the camera. It is only angled a few degrees toward
    // the headline — square-on reads as a product shot, three-quarters reads as
    // someone standing there.
    root.rotation.y = -0.22
    scene.add(root)

    // The accent is spent on the rim light and nowhere else in the scene, and
    // the body tracks --figure so it inverts with the page. Both tokens are
    // authored as hex precisely because THREE.Color cannot read oklch().
    // filled in once the GLB has loaded; the body repaints on every theme flip
    const bodyMats: THREE.MeshStandardMaterial[] = []

    const applyTheme = () => {
      const css = getComputedStyle(document.documentElement)
      rim.color.set(css.getPropertyValue('--accent').trim())
      const figure = css.getPropertyValue('--figure').trim()
      for (const mat of bodyMats) mat.color.set(figure)
    }
    applyTheme()

    let wasDark: boolean | null = null
    const onThemeChange = () => {
      applyTheme()
      const dark = document.documentElement.classList.contains('dark')
      // turn the lights on and it disagrees with you. only on a real flip —
      // the class attribute churns for other reasons (Lenis writes to it too).
      if (wasDark !== null && dark !== wasDark) gesture(dark ? 'Yes' : 'No')
      wasDark = dark
    }
    onThemeChange()
    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // --- attention ----------------------------------------------------------
    // A slack critically-damped spring. The beat of lag is the whole difference
    // between "a model that follows the mouse" and "someone who noticed you".

    const att = { yaw: 0, pitch: 0 }
    const target = { yaw: 0, pitch: 0 }
    const vel = { yaw: 0, pitch: 0 }
    let lastSeen = performance.now()
    let bored = false

    const onPointer = (e: PointerEvent) => {
      target.yaw = ((e.clientX / window.innerWidth) * 2 - 1) * 0.8
      target.pitch = ((e.clientY / window.innerHeight) * 2 - 1) * 0.4
      lastSeen = performance.now()
      bored = false
    }
    if (!isMobile && !reducedMotion) {
      window.addEventListener('pointermove', onPointer, { passive: true })
    }

    let scrollLean = 0
    let lastScroll = window.scrollY
    const onScroll = () => {
      const v = window.scrollY - lastScroll
      lastScroll = window.scrollY
      scrollLean = THREE.MathUtils.clamp(scrollLean + v * 0.0007, -0.2, 0.2)
      lastSeen = performance.now()
      bored = false
    }
    if (!reducedMotion) window.addEventListener('scroll', onScroll, { passive: true })

    const hero = document.querySelector<HTMLElement>('.hero')
    const contact = document.querySelector<HTMLElement>('#contact')

    /**
     * What the robot does in each section.
     *
     * Every expression here is chosen for what that part of the page MEANS, and
     * each one is used exactly once. It replaces a `MOODS[poked % MOODS.length]`
     * cycle, which handed out faces in a fixed rotation with no relationship to
     * what was on screen - the robot was emoting at nothing.
     *
     * `once: true` means the gesture fires on arrival only. A companion that
     * waves every time you scroll past is a toy; one that greets you once and
     * then just watches is a character.
     */
    const SECTION_ACT: {
      id: string
      face: Face
      gesture?: Gesture
      once?: boolean
    }[] = [
      // it has just noticed someone arrived, and says hello. Once.
      { id: 'hero', face: 'curious', gesture: 'Wave', once: true },
      // you are reading about him now, so it stops performing and listens
      { id: 'about', face: 'neutral' },
      // the career section: it agrees with the climb
      { id: 'experience', face: 'happy', gesture: 'Yes', once: true },
      // the work is the thing it is proudest of showing you
      { id: 'projects', face: 'surprised' },
      // writing: quiet, attentive, head slightly tilted
      { id: 'blog', face: 'curious' },
      // the exit. it comes back to full size and waves you off.
      { id: 'contact', face: 'happy', gesture: 'Wave', once: true },
    ]
    const fired = new Set<string>()
    let currentSection = ''

    /**
     * Three stations. It rides the whole page with you rather than living in the
     * hero: it stands full-size in the hero, retreats to a small perch in the
     * bottom-right while you actually read, then comes back for the close.
     *
     * The perch is deliberately small and low. A full-size robot following you
     * down a page of text stops being a companion and becomes an obstruction.
     */
    const HERO = { x: 1.5, y: -0.15, s: 1 }
    const PERCH = { x: 3.0, y: -1.5, s: 0.4 }
    const CLOSE = { x: 2.0, y: -0.15, s: 0.85 }

    /**
     * Park the perch in the page's outer gutter, not at a guessed world x.
     *
     * The perch used to be a hard-coded x = 3.0. With a 30deg fov at z 9.2 the
     * visible width at the figure's plane is 2*9.2*tan(15deg)*aspect, so on a
     * 1900px viewport x = 3.0 lands at ~1497px - and the 1240px container's
     * right edge is at 1570px. The robot was standing *inside* the reading
     * column and covering body text in the projects grid.
     *
     * So the station is derived from where the text actually ends. If the
     * gutter is too narrow to hold it (small laptops, where the container
     * fills the window) it drops to the bottom-right corner instead, the same
     * out-of-the-column station mobile uses, rather than sitting on the words.
     */
    const CONTENT_MAX = 1240 // .container max-width
    const perchStation = () => {
      const w = window.innerWidth
      const visibleW = 2 * 9.2 * Math.tan((30 * Math.PI) / 360) * (w / window.innerHeight)
      const toWorld = (screenX: number) => (screenX / w) * visibleW - visibleW / 2
      const contentRight = (w + Math.min(CONTENT_MAX, w - 64)) / 2
      const wanted = contentRight + 72 // clear of the text, plus breathing room
      if (wanted > w - 52) {
        // no usable gutter: tuck into the corner, below the reading column
        return { x: toWorld(w - 92), y: -1.72, s: 0.34 }
      }
      return { x: toWorld(wanted), y: -1.5, s: 0.4 }
    }

    const syncPerch = () => {
      const p = perchStation()
      PERCH.x = p.x
      PERCH.y = p.y
      PERCH.s = p.s
    }
    syncPerch()

    /**
     * Mobile is not the desktop layout made narrow.
     *
     * A phone has no room for a figure *beside* the text, so the desktop staging
     * collapses to one station: a small companion tucked into the bottom-right
     * corner, out of the reading column entirely. It is present the whole way
     * down and never covers a single word.
     *
     * The old code parked it at x=0 on mobile — dead centre, directly on top of
     * the headline, the lead and both buttons.
     */
    const M_PERCH = { x: 0.92, y: -1.72, s: 0.36 }

    const place = isMobile
      ? { x: M_PERCH.x, y: M_PERCH.y, s: M_PERCH.s }
      : { x: HERO.x, y: HERO.y, s: HERO.s }

    const onResize = () => {
      // the gutter moves with the viewport, so the perch has to be recomputed
      syncPerch()
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // --- rig ----------------------------------------------------------------

    let mixer: THREE.AnimationMixer | null = null
    let idle: THREE.AnimationAction | null = null
    let busy: THREE.AnimationAction | null = null
    let busyUntil = 0
    let clips: THREE.AnimationClip[] = []
    let eyes: THREE.MeshStandardMaterial | null = null

    /**
     * The face.
     *
     * The eyes are skinned to their own bones, so an expression is just a squash
     * and a tilt of two bones — no morph targets needed. Squashed flat and
     * slanted *outward* reads as a smile (the eye becomes a crescent, exactly how
     * a smiling emoji works). Slanted *inward* reads as a scowl. Tall and wide
     * reads as surprise. It is three numbers, and it is a whole face.
     */
    const FACES = {
      //         open  tilt   glow
      neutral: { o: 1.0, t: 0.0, g: 1.0 },
      happy: { o: 0.32, t: 0.34, g: 1.35 }, // squinting crescents
      curious: { o: 1.18, t: -0.1, g: 1.25 }, // wide, head-tilted interest
      surprised: { o: 1.45, t: 0.0, g: 1.6 },
      suspicious: { o: 0.55, t: -0.3, g: 0.8 }, // narrowed, slanted in
    } as const
    type Face = keyof typeof FACES

    let faceTarget: Face = 'neutral'
    const face = { o: 1, t: 0, g: 1 } // current, always lerped toward the target
    let blink = 1 // 1 = open, 0 = shut
    let nextBlink = performance.now() + 2000
    let blinkUntil = 0
    let eyeL: THREE.Object3D | null = null
    let eyeR: THREE.Object3D | null = null

    const setFace = (name: Face) => {
      faceTarget = name
    }
    const chain: {
      bone: THREE.Object3D
      weight: number
      rest: THREE.Quaternion
    }[] = []
    const q = new THREE.Quaternion()
    const parentInv = new THREE.Quaternion()
    const axis = new THREE.Vector3()
    const WORLD_Y = new THREE.Vector3(0, 1, 0)
    const WORLD_X = new THREE.Vector3(1, 0, 0)
    const WORLD_Z = new THREE.Vector3(0, 0, 1)

    /**
     * Turn a bone around a *world* axis.
     *
     * Rotating a bone's local Euler assumes its local axes line up with the
     * world's. On this rig they do not — doing that tips the head backwards
     * instead of turning it. So the world axis is pulled into the bone's parent
     * space first, and the rotation happens around that.
     */
    const turn = (bone: THREE.Object3D, worldAxis: THREE.Vector3, angle: number) => {
      if (!bone.parent) return
      bone.parent.getWorldQuaternion(parentInv).invert()
      axis.copy(worldAxis).applyQuaternion(parentInv).normalize()
      bone.quaternion.multiply(q.setFromAxisAngle(axis, angle))
    }

    /** Play a clip once, then hand the body back to the idle. */
    /** Hand the body back to the idle. */
    const release = () => {
      if (!busy || !idle) return
      idle.reset().play()
      busy.crossFadeTo(idle, 0.3, false)
      busy = null
    }

    const gesture = (name: Gesture) => {
      if (!mixer || !idle || reducedMotion) return

      // A gesture you asked for outranks the robot amusing itself. Without this
      // it starts dancing out of boredom and then ignores you until it finishes.
      if (busy) {
        if (busy.getClip().name !== 'Dance' || name === 'Dance') return
        release()
      }

      const clip = THREE.AnimationClip.findByName(clips, name)
      if (!clip) return

      const action = mixer.clipAction(clip)
      action.reset().setLoop(THREE.LoopOnce, 1).play()
      action.clampWhenFinished = true
      idle.crossFadeTo(action, 0.25, false)
      busy = action

      // A dead-man's switch. `finished` is the normal path back to idle, but if
      // it is ever missed — an interrupted cross-fade, a backgrounded tab — the
      // robot stays wedged in `busy` and silently ignores every interaction for
      // the rest of the session. This guarantees it always wakes back up.
      busyUntil = performance.now() + clip.duration * 1000 + 400
    }

    const onGesture = (ev: Event) => {
      const detail = (ev as CustomEvent<string>).detail
      gesture(detail as Gesture)
    }
    window.addEventListener('figure:gesture', onGesture)

    const onFace = (ev: Event) => setFace((ev as CustomEvent<Face>).detail)
    window.addEventListener('figure:face', onFace)

    // --- poke it ------------------------------------------------------------
    // The canvas is `pointer-events: none` so you can always click straight
    // through the robot to the page beneath. So instead of a canvas click
    // handler, we listen on the window and raycast: if the click actually landed
    // on the robot, it reacts — and the page still gets the click either way.

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const MOODS: Face[] = ['happy', 'surprised', 'curious', 'suspicious']
    let poked = 0

    const onClick = (e: MouseEvent) => {
      if (reducedMotion || isMobile) return
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.intersectObject(root, true).length) return

      // poke it and it cycles through moods, with a matching gesture. it never
      // repeats the same reaction twice in a row — that is what makes it feel
      // like a reaction rather than a trigger.
      const mood = MOODS[poked % MOODS.length]
      poked++
      setFace(mood)
      gesture(mood === 'suspicious' ? 'No' : mood === 'happy' ? 'Jump' : 'Yes')

      // it settles back to its normal face after a moment
      window.setTimeout(() => setFace('neutral'), 2600)
    }
    window.addEventListener('click', onClick)

    new GLTFLoader().load(`${import.meta.env.BASE_URL}robot.glb`, (loaded) => {
      if (disposed) return

      clips = loaded.animations

      // Fit it to the frame from its own bounds rather than a magic number:
      // stand it on y=0 and make it TARGET_H units tall, whatever the asset is.
      const TARGET_H = 2.1
      const box = new THREE.Box3().setFromObject(loaded.scene)
      const size = box.getSize(new THREE.Vector3())
      const s = TARGET_H / size.y
      loaded.scene.scale.setScalar(s)
      loaded.scene.position.y = -box.min.y * s
      root.add(loaded.scene)

      // `getObjectByName` would hand back the *mesh* called Head, not the bone —
      // the robot has both, sharing a name. Bones only.
      loaded.scene.traverse((o) => {
        if ((o as THREE.Bone).isBone) {
          const hit = LOOK_CHAIN.find(([n]) => n === o.name)
          if (hit) chain.push({ bone: o, weight: hit[1], rest: o.quaternion.clone() })
          if (o.name === 'Eye_L') eyeL = o
          if (o.name === 'Eye_R') eyeR = o
        }
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        m.castShadow = true

        // Repaint into the site's palette. The asset ships canary yellow, which
        // is charming and completely wrong next to monochrome editorial type.
        // Its body becomes the page's foreground colour; its joints stay dark.
        // The eyes carry all of the personality: lit eyes are the only signal
        // that something is *home*. This is the one place the accent is spent.
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat.name === 'Eye') {
          mat.emissiveIntensity = 1.6
          eyes = mat
        } else if (!bodyMats.includes(mat)) {
          // The body was never actually repainted despite the comment above
          // claiming it was, so it rendered at the asset's near-white and clipped.
          // Held at --figure with some roughness, the rim finally has somewhere
          // to land and the form reads as sculpted rather than as a decal.
          mat.roughness = 0.58
          mat.metalness = 0
          bodyMats.push(mat)
        }
      })
      applyTheme()

      mixer = new THREE.AnimationMixer(loaded.scene)
      const idleClip = THREE.AnimationClip.findByName(clips, 'Idle')
      if (idleClip) {
        idle = mixer.clipAction(idleClip)
        idle.play()
      }

      mixer.addEventListener('finished', release)

      if (reducedMotion) {
        mixer.update(0)
        renderer.render(scene, camera)
      }
    })

    const vis = (el: HTMLElement | null) => {
      if (!el) return 0
      const r = el.getBoundingClientRect()
      const covered = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)
      return THREE.MathUtils.clamp(covered / window.innerHeight, 0, 1)
    }

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now

      // pick the station: hero → perch → close. it is never absent.
      const inHero = vis(hero)
      const inContact = vis(contact)
      // on a phone there is only ever one station: the corner. it must never
      // wander into the reading column.
      const to = isMobile
        ? M_PERCH
        : inHero > 0.35
          ? HERO
          : inContact > 0.35
            ? CLOSE
            : PERCH

      // ---- react to whichever section is actually being read
      // Cheapest correct test: the section covering the most of the viewport.
      // Doing this in the existing rAF rather than with a second observer keeps
      // the reaction in step with the movement above.
      if (!reducedMotion) {
        let bestId = ''
        let bestCover = 0.25 // ignore sections only just peeking in
        for (const act of SECTION_ACT) {
          const el =
            act.id === 'hero' ? hero : document.getElementById(act.id)
          const cover = vis(el)
          if (cover > bestCover) {
            bestCover = cover
            bestId = act.id
          }
        }
        if (bestId && bestId !== currentSection) {
          currentSection = bestId
          const act = SECTION_ACT.find((a) => a.id === bestId)!
          setFace(act.face)
          if (act.gesture && !(act.once && fired.has(act.id))) {
            fired.add(act.id)
            gesture(act.gesture)
          }
        }
      }

      // one slow lerp does the travelling. it never teleports between stations,
      // so scrolling past the hero reads as the robot *walking off to the side*.
      const ease = Math.min(1, dt * 2.4)
      place.x += (to.x - place.x) * ease
      place.y += (to.y - place.y) * ease
      place.s += (to.s - place.s) * ease

      root.position.set(place.x, place.y, 0)
      root.scale.setScalar(place.s)

      // the dead-man's switch: never let a missed `finished` wedge it forever
      if (busy && now > busyUntil) release()

      // --- boredom: left alone, it finds something to do
      if (!reducedMotion && !bored && now - lastSeen > BOREDOM_MS) {
        bored = true
        gesture('Dance')
      }

      // idle attention: it looks around rather than staring dead ahead
      if (now - lastSeen > 2600) {
        const t = now / 1000
        target.yaw = Math.sin(t * 0.23) * 0.45
        target.pitch = Math.sin(t * 0.17 + 1.3) * 0.1
      }

      const k = 9
      const c = 2 * Math.sqrt(k) // critically damped: lags, never overshoots
      for (const axis of ['yaw', 'pitch'] as const) {
        vel[axis] += ((target[axis] - att[axis]) * k - vel[axis] * c) * dt
        att[axis] += vel[axis] * dt
      }
      scrollLean += (0 - scrollLean) * Math.min(1, dt * 2.5)

      // Reset the look chain to rest BEFORE the mixer runs.
      //
      // Without this the look-at accumulates: it multiplies a rotation into each
      // bone every frame, and the mixer only overwrites the bones its clip
      // actually keys. Any bone the clip does not touch keeps compounding, and
      // the robot slowly screws itself around to face the wall. Resetting first
      // means the clip re-authors what it animates, and the rest start clean.
      for (const { bone, rest } of chain) bone.quaternion.copy(rest)

      // the clip drives the body first...
      mixer?.update(dt)

      // ...then the look-at is composed on top of whatever pose it produced, so
      // it keeps watching you even mid-wave. multiplying, never assigning —
      // assigning would flatten the clip and leave a mannequin staring at you.
      // world matrices must be current before we can read a parent's rotation.
      root.updateMatrixWorld(true)
      for (const { bone, weight } of chain) {
        turn(bone, WORLD_Y, att.yaw * weight)
        turn(bone, WORLD_X, att.pitch * weight)
        turn(bone, WORLD_Z, -scrollLean * weight)
      }

      const engaged = now - lastSeen < 2600 ? 1 : 0

      // --- the face -----------------------------------------------------------

      // Blink. Irregular on purpose: a blink on a fixed timer reads as a machine
      // ticking, and the whole job of this robot is to not read as a machine.
      if (now > nextBlink) {
        blinkUntil = now + 110
        nextBlink = now + 2200 + Math.random() * 4200
      }
      const wantBlink = now < blinkUntil ? 0.06 : 1
      blink += (wantBlink - blink) * Math.min(1, dt * 26) // fast: a slow blink is a droop

      const want = FACES[faceTarget]
      const k2 = Math.min(1, dt * 9) // expressions land quickly. hesitation reads as lag.
      face.o += (want.o - face.o) * k2
      face.t += (want.t - face.t) * k2
      face.g += (want.g - face.g) * k2

      // squash the eye bones to open/close the eyes, and tilt them to slant.
      // the tilt mirrors, so both eyes slant *toward the nose* or away from it —
      // slanting them the same way would just look like the head is crooked.
      if (eyeL && eyeR) {
        const open = Math.max(0.04, face.o * blink)
        eyeL.scale.set(1, open, 1)
        eyeR.scale.set(1, open, 1)
        eyeL.rotation.z = face.t
        eyeR.rotation.z = -face.t
      }

      // the eyes brighten when it is watching you and dim when it loses you —
      // it is the smallest possible signal that something is home
      if (eyes) {
        const wantGlow = (1.6 + engaged * 1.4) * face.g
        eyes.emissiveIntensity += (wantGlow - eyes.emissiveIntensity) * Math.min(1, dt * 3)
      }

      renderer.render(scene, camera)
    }
    if (!reducedMotion) raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('figure:gesture', onGesture)
      window.removeEventListener('figure:face', onFace)
      window.removeEventListener('click', onClick)
      mixer?.stopAllAction()
      root.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) {
          m.geometry.dispose()
          const mats = Array.isArray(m.material) ? m.material : [m.material]
          mats.forEach((mat) => mat.dispose())
        }
      })
      envRT.texture.dispose()
      pmrem.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [reducedMotion, isMobile])

  return <div className="scene" ref={mount} aria-hidden="true" />
}
