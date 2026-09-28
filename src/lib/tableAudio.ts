/**
 * Procedural Web Audio effects for table companion tools (0 external files, 0 latency)
 */
class TableAudio {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // Realistic wooden / acrylic dice clack
  playDiceRoll() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const bounces = [0, 0.08, 0.18, 0.32, 0.5]

    bounces.forEach((delay, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      // Resonant wooden box frequencies
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320 - idx * 25 + Math.random() * 40, now + delay)
      osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.05)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(800, now + delay)

      const volume = (0.25 / (idx + 1)) * 0.8
      gain.gain.setValueAtTime(volume, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + delay)
      osc.stop(now + delay + 0.06)
    })
  }

  // Turn timer bell / ding
  playTurnBell() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.05) // D6

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.8)
  }

  // Urgent ticking / warning when 5s left
  playUrgentTick() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(880, now) // A5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.07)
  }

  // Countdown initial lock-in thud/pulse
  playCountdownStart() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, now) // Low pitch
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.1)
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }

  // Countdown second passing tick
  playCountdownTick() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, now)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.06)
  }
}

export const tableAudio = new TableAudio()
