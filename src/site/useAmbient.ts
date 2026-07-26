import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Ambient sound, synthesised rather than streamed.
 *
 * Two of the three references that ship audio (hatom, igloo, growon) use it as
 * atmosphere rather than as music, and hatom asks for headphones before you
 * enter. So this is a slow pad, not a track.
 *
 * It is generated with WebAudio and there is no audio file anywhere: a loop long
 * enough not to be obvious would be a megabyte or two, which is more than the
 * entire rest of this page, and a short one announces its own seam every few
 * seconds. Three detuned oscillators through a lowpass, with the gain drifting
 * on a slow LFO, cost nothing and never repeat.
 *
 * Off by default and only ever started from the toggle, which is both a courtesy
 * and a requirement: browsers refuse to start an AudioContext without a user
 * gesture, so autoplay would fail silently anyway.
 */

type Ambient = {
  on: boolean
  toggle: () => void
  /** short interaction sound; `up` shifts the pitch for a brighter blip */
  blip: (up?: number) => void
}

export function useAmbient(): Ambient {
  const [on, setOn] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const padRef = useRef<{ gain: GainNode; stop: () => void } | null>(null)

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctxRef.current = new Ctor()
    }
    return ctxRef.current
  }, [])

  const startPad = useCallback((ctx: AudioContext) => {
    const out = ctx.createGain()
    out.gain.value = 0
    out.connect(ctx.destination)

    // gentle lowpass so nothing in the pad is bright enough to nag
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 620
    filter.Q.value = 0.6
    filter.connect(out)

    // an open fifth plus an octave: consonant, so it never resolves and never
    // demands attention. Slight detune keeps it from sounding synthetic.
    const oscs = [110, 164.81, 220].map((f, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      o.detune.value = (i - 1) * 6
      const g = ctx.createGain()
      g.gain.value = i === 2 ? 0.16 : 0.3
      o.connect(g).connect(filter)
      o.start()
      return o
    })

    // a slow swell, so the bed breathes instead of sitting flat
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.045
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.022
    lfo.connect(lfoGain).connect(out.gain)
    lfo.start()

    // fade in rather than snap on
    out.gain.setValueAtTime(0, ctx.currentTime)
    out.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.2)

    return {
      gain: out,
      stop: () => {
        const t = ctx.currentTime
        out.gain.cancelScheduledValues(t)
        out.gain.setValueAtTime(out.gain.value, t)
        out.gain.linearRampToValueAtTime(0, t + 0.5)
        window.setTimeout(() => {
          oscs.forEach((o) => o.stop())
          lfo.stop()
          out.disconnect()
        }, 700)
      },
    }
  }, [])

  const toggle = useCallback(() => {
    const ctx = ensureCtx()
    if (!ctx) return
    setOn((was) => {
      if (was) {
        padRef.current?.stop()
        padRef.current = null
        return false
      }
      void ctx.resume()
      padRef.current = startPad(ctx)
      return true
    })
  }, [ensureCtx, startPad])

  /**
   * The poke sound. Deliberately still plays when the pad is off: this is
   * feedback for something the visitor just did, which the vev article lists as
   * its own technique, and it is a single short blip rather than a soundtrack.
   * It stays silent until the context exists, so nothing sounds before the
   * visitor has interacted with the page at all.
   */
  const blip = useCallback(
    (up = 0) => {
      const ctx = ctxRef.current
      if (!ctx) return
      const t = ctx.currentTime
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.setValueAtTime(420 + up * 90, t)
      o.frequency.exponentialRampToValueAtTime(700 + up * 120, t + 0.08)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.26)
    },
    [],
  )

  // never leave an oscillator running behind a route change
  useEffect(
    () => () => {
      padRef.current?.stop()
      void ctxRef.current?.close()
    },
    [],
  )

  return { on, toggle, blip }
}
