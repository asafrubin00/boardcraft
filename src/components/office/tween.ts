/** Minimal tween runner for the office scene — no dependencies. */

export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  outBack: (t: number) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

interface Tween {
  t: number;
  dur: number;
  delay: number;
  easing: (t: number) => number;
  update: (k: number) => void;
  resolve: () => void;
}

export class Tweens {
  private list: Tween[] = [];

  /** Runs `update(k)` with k eased 0→1 over `dur` seconds; resolves when done. */
  run(dur: number, update: (k: number) => void, easing: (t: number) => number = ease.inOut, delay = 0): Promise<void> {
    return new Promise((resolve) => {
      if (dur <= 0) { update(1); resolve(); return; }
      this.list.push({ t: 0, dur, delay, easing, update, resolve });
    });
  }

  wait(sec: number): Promise<void> {
    return this.run(sec, () => {}, ease.linear);
  }

  tick(dt: number) {
    if (this.list.length === 0) return;
    const done: Tween[] = [];
    // Iterate over a copy: an update/resolve may queue further tweens
    for (const tw of [...this.list]) {
      if (tw.delay > 0) { tw.delay -= dt; continue; }
      tw.t = Math.min(tw.t + dt / tw.dur, 1);
      tw.update(tw.easing(tw.t));
      if (tw.t >= 1) done.push(tw);
    }
    if (done.length) {
      this.list = this.list.filter((tw) => !done.includes(tw));
      done.forEach((tw) => tw.resolve());
    }
  }

  clear() { this.list = []; }
}
