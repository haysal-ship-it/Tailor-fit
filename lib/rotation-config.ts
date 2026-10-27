export const ROTATION = {
  radPerPx: 0.0105,
  friction: 1.5,            // 1/s; natural turntable momentum decay (coasts smoothly)
  maxSpeed: 16,             // rad/s
  flingGain: 1.0,
  minFlingSpeed: 0.15,      // rad/s
  stopSpeed: 0.03,          // rad/s
  velocityWindow: 0.09,     // s
  staleRelease: 0.06,       // s
  smoothDrag: 0.02,         // s; immediate 1:1 finger tracking, zero lag
  smoothCoast: 0.05,        // s; smooth follow during coasting
  smoothSnap: 0.2,          // s
  smoothButton: 0.28,       // s; shortest-path turn for Front/Left/Back/Right buttons
  snap: { enabled: false, radiusDeg: 8, maxReleaseSpeed: 0.8 }, // disabled to prevent magnetic snap overriding user intent
  tapSlopPx: 6,
  tapMaxMs: 300,
  keyStepDeg: 5,
  keyStepShiftDeg: 15,
  wheelRadPerPx: 0.004,
  camera: { fovDeg: 22, figureFill: 0.92, lookAtY: 0.89 },
} as const;

export type RotationConfig = {
  radPerPx: number;
  friction: number;
  maxSpeed: number;
  flingGain: number;
  minFlingSpeed: number;
  stopSpeed: number;
  velocityWindow: number;
  staleRelease: number;
  smoothDrag: number;
  smoothCoast: number;
  smoothSnap: number;
  smoothButton: number;
  snap: { enabled: boolean; radiusDeg: number; maxReleaseSpeed: number };
  tapSlopPx: number;
  tapMaxMs: number;
  keyStepDeg: number;
  keyStepShiftDeg: number;
  wheelRadPerPx: number;
  camera: { fovDeg: number; figureFill: number; lookAtY: number };
};
