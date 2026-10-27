import { ROTATION, type RotationConfig } from './rotation-config';

export const TAU = Math.PI * 2;

export const wrapPi = (a: number) => (((a + Math.PI) % TAU) + TAU) % TAU - Math.PI;

/**
 * Critically damped spring (Unity-style SmoothDamp). vel is mutated.
 */
export function smoothDamp(
  current: number,
  target: number,
  vel: { v: number },
  smoothTime: number,
  dt: number
): number {
  const st = Math.max(0.0001, smoothTime);
  const omega = 2 / st;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (vel.v + omega * change) * dt;
  vel.v = (vel.v - omega * temp) * exp;
  return target + (change + temp) * exp;
}

/**
 * Velocity from recent pointer samples: [{ x, t }]. t is performance.now() in ms.
 */
export function estimateReleaseVelocity(
  samples: Array<{ x: number; t: number }>,
  nowMs: number,
  cfg: Pick<
    RotationConfig,
    'staleRelease' | 'velocityWindow' | 'radPerPx' | 'flingGain' | 'maxSpeed'
  > = ROTATION
): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (nowMs - last.t > cfg.staleRelease * 1000) return 0;
  const cutoff = last.t - cfg.velocityWindow * 1000;
  let first = samples[0];
  for (const s of samples) {
    if (s.t >= cutoff) {
      first = s;
      break;
    }
  }
  const dt = (last.t - first.t) / 1000;
  if (dt < 0.004) return 0;
  const v = ((last.x - first.x) * cfg.radPerPx / dt) * cfg.flingGain;
  return Math.max(-cfg.maxSpeed, Math.min(cfg.maxSpeed, v));
}

/**
 * Hermite smoothstep interpolation between edge0 and edge1.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
