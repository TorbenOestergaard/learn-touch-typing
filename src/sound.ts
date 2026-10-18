// A short, soft beep for wrong keys, made with Web Audio so no sound file is needed.

let ctx: AudioContext | null = null

export function errorBeep() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.13)
  } catch {
    // No audio available; typing works fine without it.
  }
}
