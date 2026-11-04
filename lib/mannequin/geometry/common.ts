export const REFERENCE_SCALE = 1.75 / 660;

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function smoothstep(min: number, max: number, value: number): number {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

export const smoothMin = (a: number, b: number, k: number): number => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

export const smoothMax = (a: number, b: number, k: number): number => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
};

export function profile(points: number[][], x: number): number {
  let i = 0;
  while (i < points.length - 2 && x > points[i + 1][0]) i++;
  const a = points[i], b = points[i + 1];
  const t = clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
  const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 2)];
  const m0 = (b[1] - before[1]) / (b[0] - before[0]);
  const m1 = (after[1] - a[1]) / (after[0] - a[0]);
  return (2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*m0*(b[0]-a[0])+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*m1*(b[0]-a[0]);
}
