let context = null;
let master = null;
let noiseBuffer = null;
let enabled = true;
const lastPlayed = new Map();

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    master = context.createGain();
    master.gain.value = 0.22;
    master.connect(context.destination);

    const length = Math.floor(context.sampleRate * 0.55);
    noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < length; i += 1) {
      value = value * 0.82 + (Math.random() * 2 - 1) * 0.18;
      data[i] = value;
    }
  }
  return context;
}

function resume() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

function gate(name, minimumGap = 0) {
  if (!enabled) return false;
  const ctx = resume();
  if (!ctx) return false;
  const now = performance.now();
  if (minimumGap > 0 && now - (lastPlayed.get(name) || 0) < minimumGap) return false;
  lastPlayed.set(name, now);
  return true;
}

function tone({ frequency = 240, endFrequency = frequency, duration = 0.12, type = 'sine', gain = 0.2, delay = 0 }) {
  if (!context || !master) return;
  const now = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
  if (endFrequency !== frequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
  }
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function noise({ duration = 0.1, gain = 0.12, frequency = 1200, q = 0.7, type = 'bandpass', delay = 0 }) {
  if (!context || !master || !noiseBuffer) return;
  const now = context.currentTime + delay;
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, now);
  filter.Q.value = q;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  source.start(now);
  source.stop(now + duration + 0.02);
}

const library = {
  click() {
    if (!gate('click', 40)) return;
    tone({ frequency: 520, endFrequency: 760, duration: 0.07, type: 'triangle', gain: 0.1 });
  },
  tick() {
    if (!gate('tick', 50)) return;
    tone({ frequency: 320, endFrequency: 300, duration: 0.06, type: 'square', gain: 0.05 });
  },
  countdown() {
    if (!gate('countdown', 300)) return;
    tone({ frequency: 540, endFrequency: 580, duration: 0.12, type: 'square', gain: 0.08 });
  },
  go() {
    if (!gate('go', 300)) return;
    tone({ frequency: 600, endFrequency: 980, duration: 0.2, type: 'triangle', gain: 0.12 });
    tone({ frequency: 1200, duration: 0.18, type: 'sine', gain: 0.07, delay: 0.04 });
  },
  shoot(type) {
    if (!gate(`shoot-${type}`, 45)) return;
    if (type === 'sniper') {
      tone({ frequency: 1050, endFrequency: 340, duration: 0.13, type: 'sawtooth', gain: 0.11 });
      noise({ duration: 0.1, gain: 0.08, frequency: 2600, q: 0.9 });
      return;
    }
    if (type === 'shotgun') {
      noise({ duration: 0.17, gain: 0.18, frequency: 620, q: 0.6, type: 'lowpass' });
      tone({ frequency: 175, endFrequency: 70, duration: 0.16, type: 'square', gain: 0.1 });
      return;
    }
    if (type === 'orb') {
      tone({ frequency: 430, endFrequency: 690, duration: 0.13, type: 'sine', gain: 0.08 });
      tone({ frequency: 630, endFrequency: 900, duration: 0.1, type: 'triangle', gain: 0.04, delay: 0.02 });
      return;
    }
    tone({ frequency: 760, endFrequency: 420, duration: 0.08, type: 'triangle', gain: 0.07 });
    noise({ duration: 0.06, gain: 0.05, frequency: 3200, q: 1.2 });
  },
  hit() {
    if (!gate('hit', 32)) return;
    noise({ duration: 0.08, gain: 0.1, frequency: 900, q: 0.9, type: 'lowpass' });
    tone({ frequency: 200, endFrequency: 90, duration: 0.08, type: 'square', gain: 0.05 });
  },
  crateHit() {
    if (!gate('crate-hit', 55)) return;
    noise({ duration: 0.07, gain: 0.09, frequency: 680, q: 0.8, type: 'bandpass' });
    tone({ frequency: 230, endFrequency: 140, duration: 0.08, type: 'triangle', gain: 0.06 });
  },
  crateBreak() {
    if (!gate('crate-break', 140)) return;
    noise({ duration: 0.28, gain: 0.16, frequency: 420, q: 0.55, type: 'lowpass' });
    tone({ frequency: 160, endFrequency: 48, duration: 0.34, type: 'square', gain: 0.1 });
    [520, 780].forEach((frequency, index) => {
      tone({ frequency, duration: 0.12, type: 'triangle', gain: 0.05, delay: 0.05 + index * 0.05 });
    });
  },
  heal() {
    if (!gate('heal', 70)) return;
    tone({ frequency: 420, endFrequency: 660, duration: 0.18, type: 'sine', gain: 0.07 });
    tone({ frequency: 660, endFrequency: 880, duration: 0.15, type: 'sine', gain: 0.04, delay: 0.05 });
  },
  gem() {
    if (!gate('gem', 35)) return;
    tone({ frequency: 880, duration: 0.09, type: 'sine', gain: 0.09 });
    tone({ frequency: 1320, duration: 0.12, type: 'sine', gain: 0.06, delay: 0.05 });
  },
  super(type) {
    if (!gate('super', 250)) return;
    if (type === 'heal') {
      [420, 530, 660, 880].forEach((freq, index) => {
        tone({ frequency: freq, endFrequency: freq * 1.08, duration: 0.35, type: 'sine', gain: 0.08, delay: index * 0.07 });
      });
      return;
    }
    if (type === 'beam') {
      tone({ frequency: 1200, endFrequency: 180, duration: 0.4, type: 'sawtooth', gain: 0.14 });
      noise({ duration: 0.4, gain: 0.1, frequency: 3600, q: 0.8 });
      return;
    }
    if (type === 'dash') {
      noise({ duration: 0.22, gain: 0.13, frequency: 1800, q: 1.2 });
      tone({ frequency: 760, endFrequency: 250, duration: 0.22, type: 'triangle', gain: 0.09 });
      return;
    }
    noise({ duration: 0.42, gain: 0.2, frequency: 320, q: 0.5, type: 'lowpass' });
    tone({ frequency: 130, endFrequency: 42, duration: 0.45, type: 'square', gain: 0.16 });
  },
  death() {
    if (!gate('death', 110)) return;
    noise({ duration: 0.3, gain: 0.13, frequency: 520, q: 0.6, type: 'lowpass' });
    tone({ frequency: 250, endFrequency: 60, duration: 0.35, type: 'sawtooth', gain: 0.1 });
  },
  spawn() {
    if (!gate('spawn', 100)) return;
    tone({ frequency: 260, endFrequency: 720, duration: 0.3, type: 'triangle', gain: 0.08 });
  },
  overtime() {
    if (!gate('overtime', 800)) return;
    [660, 660, 880].forEach((freq, index) => {
      tone({ frequency: freq, duration: 0.12, type: 'square', gain: 0.1, delay: index * 0.15 });
    });
  },
  victory() {
    if (!gate('victory', 1000)) return;
    [523, 659, 784, 1047].forEach((freq, index) => {
      tone({ frequency: freq, duration: 0.32, type: index === 3 ? 'sine' : 'triangle', gain: 0.11, delay: index * 0.11 });
    });
  },
  defeat() {
    if (!gate('defeat', 1000)) return;
    [392, 330, 262, 196].forEach((freq, index) => {
      tone({ frequency: freq, duration: 0.3, type: 'triangle', gain: 0.08, delay: index * 0.13 });
    });
  },
  claim() {
    if (!gate('claim', 100)) return;
    [660, 880, 1100].forEach((freq, index) => {
      tone({ frequency: freq, duration: 0.16, type: 'sine', gain: 0.09, delay: index * 0.07 });
    });
  },
  error() {
    if (!gate('error', 100)) return;
    tone({ frequency: 160, endFrequency: 120, duration: 0.16, type: 'square', gain: 0.07 });
  },
};

export const audio = {
  unlock() {
    resume();
  },
  setEnabled(value) {
    enabled = Boolean(value);
    if (enabled) resume();
  },
  isEnabled() {
    return enabled;
  },
  play(name, parameter) {
    const sound = library[name];
    if (!sound) return;
    try {
      sound(parameter);
    } catch {
      // Audio must never interrupt the game.
    }
  },
  setVolume(value) {
    if (!master) return;
    master.gain.value = Math.max(0, Math.min(1, Number(value) || 0)) * 0.22;
  },
};
