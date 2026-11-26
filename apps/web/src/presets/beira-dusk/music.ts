/**
 * Quiet evening music made in the browser, so the preset ships no audio files: a low
 * drone on the tonic and fifth that breathes slowly, and an occasional bell from a
 * pentatonic scale. Starts only from a user gesture (browsers require it anyway).
 */
const TONIC = 146.83; // D3
const BELL_SCALE = [0, 2, 4, 7, 9, 12, 14].map((step) => TONIC * 2 * 2 ** (step / 12));

export type Music = { stop: () => void };

export function startMusic(): Music {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
  master.connect(ctx.destination);

  // Soft echo so bells hang in the air.
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  delay.connect(feedback).connect(delay);
  delay.connect(master);

  const drones = [TONIC / 2, TONIC * 0.75, TONIC].map((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = 0.05 - i * 0.012;
    // Slow swell, out of phase per voice.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06 + i * 0.023;
    const depth = ctx.createGain();
    depth.gain.value = 0.02;
    lfo.connect(depth).connect(gain.gain);
    osc.connect(gain).connect(master);
    osc.start();
    lfo.start();
    return [osc, lfo];
  });

  const bell = () => {
    const now = ctx.currentTime;
    const freq = BELL_SCALE[Math.floor(Math.random() * BELL_SCALE.length)]!;
    for (const [ratio, level] of [
      [1, 0.09],
      [2.76, 0.025],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(level, now + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      osc.connect(env);
      env.connect(master);
      env.connect(delay);
      osc.start(now);
      osc.stop(now + 3.6);
    }
  };

  let timer = 0;
  const schedule = () => {
    bell();
    timer = window.setTimeout(schedule, 2600 + Math.random() * 3800);
  };
  timer = window.setTimeout(schedule, 1200);

  return {
    stop() {
      clearTimeout(timer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      window.setTimeout(() => {
        for (const [osc, lfo] of drones) {
          osc!.stop();
          lfo!.stop();
        }
        void ctx.close();
      }, 900);
    },
  };
}
