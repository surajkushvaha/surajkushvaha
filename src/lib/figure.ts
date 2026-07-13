/**
 * The page's line to the robot in the hero.
 *
 * Components ask for a reaction; they know nothing about three.js, the rig, or
 * whether a robot is even mounted. If it is not (mobile, reduced motion), the
 * event simply falls on the floor.
 */
export type Gesture = 'Wave' | 'Yes' | 'No' | 'Jump' | 'Dance'

/** Expressions are a squash and a tilt of the eye bones — see `Figure.tsx`. */
export type Face = 'neutral' | 'happy' | 'curious' | 'surprised' | 'suspicious'

export function figureGesture(name: Gesture) {
  window.dispatchEvent(new CustomEvent('figure:gesture', { detail: name }))
}

export function figureFace(name: Face) {
  window.dispatchEvent(new CustomEvent('figure:face', { detail: name }))
}
