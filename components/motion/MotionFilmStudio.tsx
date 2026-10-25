'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Sparkles,
  Layers,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';
import { audioEngine } from './audioEngine';
import { OrigamiTailorFitLogo } from '@/components/Navbar';

const TOTAL_DURATION = 60.0; // 60 seconds

interface ActDefinition {
  id: number;
  title: string;
  subtitle: string;
  startTime: number;
  endTime: number;
}

const ACTS: ActDefinition[] = [
  { id: 1, title: 'The Hook', subtitle: 'Atelier Entrance & Sticker Reveal', startTime: 0, endTime: 9.5 },
  { id: 2, title: '3D Mannequin', subtitle: '60 FPS Inertia 360° Spin', startTime: 9.5, endTime: 21.5 },
  { id: 3, title: 'Tactile Blueprint', subtitle: '21-Point Contour Constellation', startTime: 21.5, endTime: 34.5 },
  { id: 4, title: 'Master-Detail', subtitle: 'Elena Rostova Live Workspace', startTime: 34.5, endTime: 45.5 },
  { id: 5, title: 'Velocity Montage', subtitle: 'Beat-Matched Micro Interactions', startTime: 45.5, endTime: 53.5 },
  { id: 6, title: 'Atelier Lockup', subtitle: 'Grand Convergence & Outro', startTime: 53.5, endTime: 60.0 },
];

export function MotionFilmStudio() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Sound triggers tracker to avoid double playing SFX
  const triggeredSoundsRef = useRef<Set<string>>(new Set());

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        audioEngine.startMusic(currentTime);
      } else {
        audioEngine.stopMusic();
      }
      return next;
    });
  }, [currentTime]);

  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION, time));
    setCurrentTime(clamped);
    triggeredSoundsRef.current.clear();
    if (isPlaying) {
      audioEngine.stopMusic();
      audioEngine.startMusic(clamped);
    }
  };

  const handleRestart = () => {
    handleSeek(0);
    if (!isPlaying) {
      setIsPlaying(true);
      audioEngine.startMusic(0);
    }
  };

  const handleJumpToAct = (act: ActDefinition) => {
    handleSeek(act.startTime);
  };

  // Main high-precision animation loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaSec = ((timestamp - lastTimeRef.current) / 1000) * playbackSpeed;
      lastTimeRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          audioEngine.stopMusic();
          return TOTAL_DURATION;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Synchronized Sound Design Triggers
  useEffect(() => {
    if (!isPlaying || isMuted) return;

    const playOnce = (key: string, fn: () => void) => {
      if (!triggeredSoundsRef.current.has(key)) {
        triggeredSoundsRef.current.add(key);
        fn();
      }
    };

    // Act 1: Sticker slap (1.8s), cursor click (5.2s), curtain split subdrop (7.0s)
    if (currentTime >= 1.8 && currentTime < 2.5) playOnce('s1_sticker', () => audioEngine.playClick(0.8));
    if (currentTime >= 5.2 && currentTime < 6.0) playOnce('s1_click', () => audioEngine.playClick(1.4));
    if (currentTime >= 7.0 && currentTime < 8.0) playOnce('s1_drop', () => audioEngine.playSubDrop());

    // Act 2: Mannequin 360 spin swoosh (12.5s)
    if (currentTime >= 12.5 && currentTime < 14.0) playOnce('s2_swoosh', () => audioEngine.playSwoosh());

    // Act 3: Leader line snap (24.0s), metric tick rolling (26.0s - 27.5s)
    if (currentTime >= 24.0 && currentTime < 25.0) playOnce('s3_snap', () => audioEngine.playClick(1.6));
    if (currentTime >= 26.0 && currentTime < 27.5) {
      if (Math.floor(currentTime * 10) % 2 === 0) audioEngine.playMetricTick();
    }

    // Act 4: Elena client click (38.0s)
    if (currentTime >= 38.0 && currentTime < 39.0) playOnce('s4_click', () => audioEngine.playClick(1.2));

    // Act 5: Velocity montage kicks (46.0s, 48.0s, 50.0s)
    if (currentTime >= 46.0 && currentTime < 47.0) playOnce('s5_k1', () => audioEngine.playClick(1.5));
    if (currentTime >= 48.0 && currentTime < 49.0) playOnce('s5_k2', () => audioEngine.playClick(1.8));

    // Act 6: Outro chime (56.0s)
    if (currentTime >= 56.0 && currentTime < 58.0) playOnce('s6_chime', () => audioEngine.playOutroChime());
  }, [currentTime, isPlaying, isMuted]);

  // Audio mute toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts (Space = Play/Pause, ArrowLeft = -5s, ArrowRight = +5s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(currentTime - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(currentTime + 5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, currentTime]);

  const currentAct = ACTS.find((a) => currentTime >= a.startTime && currentTime <= a.endTime) || ACTS[0];

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[1360px] mx-auto px-4 py-6 flex flex-col items-center select-none"
    >
      {/* Studio Top Control Header */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#E8DDD0] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
            <OrigamiTailorFitLogo className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-semibold tracking-tight text-[#141312] dark:text-white">
                TailorFit — 60s Motion Graphics Film
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#C9AB84]/20 text-[#8B6E45] font-semibold border border-[#C9AB84]/40">
                16:9 • 1080p
              </span>
            </div>
            <p className="text-[12px] text-[#7A7570] dark:text-[#9A9590]">
              Current Scene: <strong className="text-[#141312] dark:text-white">{currentAct.id}. {currentAct.title}</strong> — {currentAct.subtitle}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DDD0] dark:border-white/10 text-[12px] font-medium bg-white dark:bg-[#1E1C1A] text-[#141312] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[#8B6E45]" />}
            <span>{isMuted ? 'Unmute Audio' : 'Audio 124 BPM'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-[#E8DDD0] dark:border-white/10 bg-white dark:bg-[#1E1C1A] text-[#141312] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-sm"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 16:9 Cinema Viewport Container */}
      <div
        ref={videoStageRef}
        className="w-full relative aspect-video bg-[#141312] rounded-2xl overflow-hidden shadow-2xl border border-black/20"
        style={{ perspective: 1200 }}
      >
        {/* Render Active Scene Engine */}
        <SceneRenderer time={currentTime} />

        {/* Global Cinema Letterbox Overlay / Vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] z-40" />

        {/* Real-time Technical Overlay (Top-Left Timecode, Bottom-Right Branding) */}
        <div className="absolute top-4 left-6 z-50 flex items-center gap-3 text-white/70 font-mono text-[11px] pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>REC 1080P // 60 FPS</span>
          <span className="text-white/40">|</span>
          <span className="text-white font-bold">
            {formatTimecode(currentTime)} / 00:01:00:00
          </span>
        </div>

        <div className="absolute top-4 right-6 z-50 flex items-center gap-2 text-white/60 font-mono text-[11px] pointer-events-none">
          <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
            SCENE {currentAct.id} // {currentAct.title.toUpperCase()}
          </span>
        </div>

        {/* Play/Pause Watermark Overlay on Hover or Pause */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center cursor-pointer transition-opacity"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl pl-1"
            >
              <Play className="w-8 h-8 fill-black" />
            </motion.div>
            <p className="mt-4 text-white text-[15px] font-medium tracking-wide">
              Click to Play Motion Film (Space)
            </p>
            <p className="text-white/60 text-[12px] font-mono mt-1">
              Audio synthesized at 124 BPM • Exact 16:9 broadcast staging
            </p>
          </div>
        )}
      </div>

      {/* Playback Controls & Scrubber Timeline */}
      <div className="w-full mt-4 bg-white dark:bg-[#1A1918] rounded-xl p-4 border border-[#E8DDD0] dark:border-white/10 shadow-sm flex flex-col gap-3">
        {/* Scrubber Bar with Act Markers */}
        <div className="relative w-full h-8 flex flex-col justify-center">
          {/* Timeline Track */}
          <div className="relative w-full h-3 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = clickX / rect.width;
              handleSeek(ratio * TOTAL_DURATION);
            }}
          >
            {/* Act Color Segments */}
            {ACTS.map((act, index) => {
              const leftPercent = (act.startTime / TOTAL_DURATION) * 100;
              const widthPercent = ((act.endTime - act.startTime) / TOTAL_DURATION) * 100;
              return (
                <div
                  key={act.id}
                  className={`absolute top-0 bottom-0 border-r border-black/20 ${
                    index % 2 === 0 ? 'bg-[#C9AB84]/30' : 'bg-[#C9AB84]/15'
                  }`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                />
              );
            })}

            {/* Filled Progress */}
            <div
              className="h-full bg-gradient-to-r from-[#D8B17A] to-[#C9AB84] rounded-full transition-all duration-75"
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
          </div>

          {/* Interactive Thumb */}
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Lower Transport Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
          {/* Transport buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Film'}</span>
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-lg border border-[#E8DDD0] dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-[#141312] dark:text-white"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed pills */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/5 p-1 rounded-lg border border-neutral-200 dark:border-white/10">
              {[0.5, 1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-white dark:bg-white/20 text-black dark:text-white shadow-xs font-semibold'
                      : 'text-[#7A7570] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Time display */}
            <span className="font-mono text-[12px] text-[#7A7570] dark:text-[#9A9590] ml-2">
              <strong className="text-black dark:text-white">{formatMinutesSeconds(currentTime)}</strong> / 01:00
            </span>
          </div>

          {/* Act Jump Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {ACTS.map((act) => {
              const isActive = currentTime >= act.startTime && currentTime <= act.endTime;
              return (
                <button
                  key={act.id}
                  onClick={() => handleJumpToAct(act)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-[#C9AB84] text-black font-semibold border-[#C9AB84] shadow-xs'
                      : 'bg-transparent text-[#7A7570] hover:text-black dark:hover:text-white border-transparent hover:border-neutral-200'
                  }`}
                >
                  {act.id}. {act.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SCENE RENDERER ENGINE (ACTS 1 TO 6)
// ==========================================

function SceneRenderer({ time }: { time: number }) {
  // Act 1: 0.0s - 9.5s
  if (time < 9.5) {
    return <Act1HookScene time={time} />;
  }
  // Act 2: 9.5s - 21.5s
  if (time < 21.5) {
    return <Act2MannequinScene time={time - 9.5} />;
  }
  // Act 3: 21.5s - 34.5s
  if (time < 34.5) {
    return <Act3BlueprintScene time={time - 21.5} />;
  }
  // Act 4: 34.5s - 45.5s
  if (time < 45.5) {
    return <Act4ClientsScene time={time - 34.5} />;
  }
  // Act 5: 45.5s - 53.5s
  if (time < 53.5) {
    return <Act5VelocityScene time={time - 45.5} />;
  }
  // Act 6: 53.5s - 60.0s
  return <Act6OutroScene time={time - 53.5} />;
}

// ------------------------------------------
// ACT 1: THE ATELIER ENTRANCE & STICKER REVEAL
// ------------------------------------------
function Act1HookScene({ time }: { time: number }) {
  // Cursor coordinate interpolation
  const cursorX = time < 3 ? 15 : time < 5 ? 30 + (time - 3) * 20 : 70;
  const cursorY = time < 3 ? 20 : time < 5 ? 35 + (time - 3) * 12 : 59;
  const isClicking = time >= 5.0 && time < 5.6;
  const curtainProgress = Math.max(0, Math.min(1, (time - 6.5) / 2.5));

  // Kinetic text distortion
  const textScaleX = time >= 4.0 && time < 5.5 ? 1.25 : 1.0;
  const textSkewX = time >= 4.0 && time < 5.5 ? -6 : 0;

  return (
    <div className="relative w-full h-full bg-[#121110] overflow-hidden flex items-center justify-center">
      {/* Precision Blueprint Grid Lines */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #C9AB84 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating Adhesive Sticker Badge (Philipp Baikov Inspiration) */}
      <motion.div
        animate={{
          y: time < 1.5 ? -100 : 0,
          rotate: time < 1.5 ? -14 : -3,
          scale: time < 1.8 ? 0.8 : 1,
        }}
        transition={{ type: 'spring', damping: 14, stiffness: 120 }}
        className="absolute top-14 left-16 z-30 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8B17A] to-[#C9AB84] text-black font-semibold text-[13px] tracking-wide shadow-2xl flex items-center gap-2 border border-white/30"
        style={{
          boxShadow: '0 20px 40px -10px rgba(201, 171, 132, 0.4)',
        }}
      >
        <Sparkles className="w-4 h-4 fill-black" />
        <span>TAILORFIT v2.0 // Precision Atelier</span>
      </motion.div>

      {/* Main Kinetic Typography Hook */}
      <div className="relative z-20 text-center px-8 flex flex-col items-center">
        <motion.p
          animate={{ opacity: time > 0.5 ? 1 : 0, y: time > 0.5 ? 0 : 20 }}
          className="text-[#C9AB84] font-mono tracking-[0.25em] text-[13px] uppercase mb-3"
        >
          Haute Couture Meets Precision Geometry
        </motion.p>

        <h2
          className="text-[64px] font-black text-white tracking-tight uppercase leading-none transition-transform duration-200"
          style={{
            transform: `scaleX(${textScaleX}) skewX(${textSkewX}deg)`,
            fontFamily: 'serif',
          }}
        >
          BESPOKE TAILORING<span className="text-[#C9AB84]">.</span>
        </h2>

        <motion.div
          animate={{ opacity: time > 2 ? 1 : 0 }}
          className="mt-6 flex items-center gap-3 text-white/50 text-[13px] font-mono"
        >
          <span>[ 01 // 21-POINT SIZING ]</span>
          <span>•</span>
          <span>[ 02 // 360° GLIDE ]</span>
          <span>•</span>
          <span>[ 03 // LIVE DOSSIER ]</span>
        </motion.div>
      </div>

      {/* Split Curtain Transition Revealing Light Atelier */}
      {curtainProgress > 0 && (
        <div
          className="absolute inset-0 bg-[#FBF9F5] z-30 flex items-center justify-center transition-all duration-300"
          style={{
            clipPath: `circle(${curtainProgress * 150}% at 70% 59%)`,
          }}
        >
          <div className="text-center text-black">
            <h3 className="text-[44px] font-bold tracking-tight text-[#141312]">
              Welcome to the Digital Atelier
            </h3>
            <p className="text-[16px] text-[#7A7570] font-mono mt-2">
              Initializing 3D orthographic engine...
            </p>
          </div>
        </div>
      )}

      {/* Tactile Motion Cursor (Pinterest Ref 3) */}
      <motion.div
        animate={{
          left: `${cursorX}%`,
          top: `${cursorY}%`,
          scale: isClicking ? 0.82 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="absolute z-50 pointer-events-none -translate-x-2 -translate-y-2"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <path
            d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
            fill="#FFFFFF"
            stroke="#141312"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        {/* Cursor Click Shockwave Ring */}
        {isClicking && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-[#C9AB84]"
          />
        )}
      </motion.div>
    </div>
  );
}

// ------------------------------------------
// ACT 2: 3D STUDIO MANNEQUIN & 360° SPIN
// ------------------------------------------
function Act2MannequinScene({ time }: { time: number }) {
  // 360° angle calculation with momentum glide
  const spinAngle = time < 2 ? 0 : time < 8 ? ((time - 2) / 6) * 360 : 360;
  const currentAngleMod = Math.floor(spinAngle) % 360;

  // Resolve angle index (0 to 7)
  const angleIndex = Math.min(7, Math.floor((currentAngleMod / 360) * 8));
  const maleImages = [
    '/assets/mannequin-male-tpose-front.png',
    '/assets/mannequin-male-right.png',
    '/assets/mannequin-male-tpose-left.png',
    '/assets/mannequin-male-left.png',
    '/assets/mannequin-male-tpose-back.png',
    '/assets/mannequin-male-back.png',
    '/assets/mannequin-male-right.png',
    '/assets/mannequin-male-front.png',
  ];

  const currentImage = maleImages[angleIndex];

  return (
    <div className="relative w-full h-full bg-[#FBF9F5] overflow-hidden flex items-center justify-between px-16">
      {/* Subtle Studio Backdrop Shadow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,171,132,0.18)_0%,transparent_70%)] pointer-events-none" />

      {/* Left Spec Pillar */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[280px] flex flex-col gap-3 z-20"
      >
        <span className="text-[11px] font-mono text-[#8B6E45] font-semibold tracking-widest uppercase">
          Precision CAD Core
        </span>
        <h3 className="text-[32px] font-serif font-bold text-[#141312] leading-tight">
          Orthographic Mannequin Studio
        </h3>
        <p className="text-[13px] text-[#7A7570] leading-relaxed">
          Standardized in warm resin albedo <code className="text-[#8B6E45] bg-[#C9AB84]/20 px-1 py-0.5 rounded">#C9AB84</code>.
          Zero perspective distortion with 60 FPS inertia physics.
        </p>

        {/* 4 Anatomical Zone Badges */}
        <div className="flex flex-col gap-2 mt-3">
          {[
            { label: '01. Head & Neck', count: '4 Points' },
            { label: '02. Torso Matrix', count: '6 Points' },
            { label: '03. Upper Limb', count: '5 Points' },
            { label: '04. Lower Limb', count: '6 Points' },
          ].map((z, i) => (
            <motion.div
              key={z.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="px-3 py-2 rounded-lg bg-white border border-[#E8DDD0] shadow-xs flex items-center justify-between text-[12px]"
            >
              <span className="font-semibold text-[#141312]">{z.label}</span>
              <span className="font-mono text-[#8B6E45] text-[11px]">{z.count}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Center 3D Mannequin Stage with 360° Rotator */}
      <div className="relative flex-1 h-full flex flex-col items-center justify-center z-20">
        {/* Soft Floor Shadow */}
        <div className="absolute bottom-12 w-64 h-8 bg-black/15 rounded-full blur-md" />

        <div className="relative h-[80%] max-h-[460px] flex items-center justify-center">
          <img
            src={currentImage}
            alt="3D Mannequin"
            className="h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)] transition-opacity duration-75"
          />
        </div>

        {/* 360° Angle Dial Indicator */}
        <div className="mt-3 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 backdrop-blur-xs flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#8B6E45] animate-spin" />
          <span className="text-[12px] font-mono font-semibold text-[#141312]">
            ANGLE: {Math.round(spinAngle)}° // 60 FPS INERTIA
          </span>
        </div>
      </div>

      {/* Right Floating Specification Card */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[280px] p-5 rounded-2xl bg-white border border-[#E8DDD0] shadow-xl z-20 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <span className="text-[11px] font-mono uppercase text-[#7A7570]">Geometry Mesh</span>
          <span className="text-[11px] font-mono font-semibold text-emerald-600">● ACTIVE</span>
        </div>

        <div className="space-y-2 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#7A7570]">Base Albedo:</span>
            <span className="font-mono font-semibold text-[#8B6E45]">#C9AB84</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7570]">Cameras:</span>
            <span className="font-mono font-semibold text-[#141312]">3 Orthographic</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7570]">Pose Standard:</span>
            <span className="font-mono font-semibold text-[#141312]">Exact 90° T-Pose</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7570]">Spring Physics:</span>
            <span className="font-mono font-semibold text-emerald-600">Smooth Damping</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ------------------------------------------
// ACT 3: TACTILE BLUEPRINT & 21 CONTOURS
// ------------------------------------------
function Act3BlueprintScene({ time }: { time: number }) {
  const isZoomed = time >= 2.0;
  const isHovered = time >= 2.5;
  const isModalOpen = time >= 4.5 && time < 10.0;
  const numericVal = time < 5.0 ? '98.0' : time < 7.0 ? '100.5' : '102.5';

  return (
    <div className="relative w-full h-full bg-[#181716] overflow-hidden flex items-center justify-center">
      {/* Blueprint Grid Lines in Slate Gold */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #C9AB84 1px, transparent 1px), linear-gradient(to bottom, #C9AB84 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Main Mannequin Centerpiece */}
      <div className="relative h-[85%] flex items-center justify-center">
        <img
          src="/assets/mannequin-male-tpose-front.png"
          alt="Male Mannequin Blueprint"
          className="h-full object-contain filter drop-shadow-[0_0_30px_rgba(201,171,132,0.2)]"
        />

        {/* Chest Touchpoint Indicator */}
        <div className="absolute top-[34%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-7 h-7 rounded-full bg-[#C9AB84]/30 animate-ping" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#C9AB84] border-2 border-white shadow-lg" />

            {/* Dotted Leader Line (Hover Reveal) */}
            {isHovered && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 140, opacity: 1 }}
                className="absolute left-4 top-1/2 h-[1px] border-b-2 border-dashed border-[#C9AB84] origin-left"
              >
                {/* Floating Tag */}
                <div className="absolute left-full -top-4 ml-2 px-3 py-1.5 rounded-lg bg-black/90 border border-[#C9AB84] text-white font-mono text-[12px] whitespace-nowrap shadow-xl flex items-center gap-1.5">
                  <span className="text-[#C9AB84]">Bust / Chest:</span>
                  <span className="font-bold">{numericVal} cm</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 21-Point Contour Constellation Glow on Blueprint Apply */}
        {time >= 7.5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            {/* SVG Glowing Contour Arcs */}
            <svg className="w-full h-full" viewBox="0 0 500 800" fill="none">
              <path
                d="M170 200 C 210 180, 290 180, 330 200"
                stroke="#C9AB84"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M190 280 C 230 260, 270 260, 310 280"
                stroke="#C9AB84"
                strokeWidth="2"
              />
              <path
                d="M200 360 C 235 345, 265 345, 300 360"
                stroke="#C9AB84"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M210 520 C 235 500, 265 500, 290 520"
                stroke="#C9AB84"
                strokeWidth="2"
              />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Tap-to-Edit Size Modal with Rolling Counter */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="absolute right-20 top-24 z-40 w-80 p-6 rounded-2xl bg-[#22201E] border border-[#C9AB84]/40 shadow-2xl text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-[12px] font-mono text-[#C9AB84] uppercase tracking-wider">
                Precision Measurement
              </span>
              <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded">TORSO</span>
            </div>

            <p className="text-[18px] font-semibold tracking-tight">Bust / Chest Circumference</p>
            <p className="text-[12px] text-white/50 mt-0.5">Direct size calibration</p>

            {/* Rolling Numeric Dial Box */}
            <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-[32px] font-mono font-bold text-[#C9AB84]">
                {numericVal}
              </span>
              <span className="text-[14px] font-mono text-white/60">cm / metric</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated to ISO 8559
              </span>
              <span>LOCKED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Blueprint Card */}
      {time >= 7.0 && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute left-16 bottom-16 z-30 p-5 rounded-2xl bg-black/80 backdrop-blur-md border border-[#C9AB84]/50 shadow-2xl text-white w-72"
        >
          <div className="flex items-center gap-2 text-[#C9AB84] text-[12px] font-mono font-bold mb-1">
            <Layers className="w-4 h-4" />
            <span>GARMENT BLUEPRINT</span>
          </div>
          <h4 className="text-[18px] font-serif font-bold">Savile Row Two-Piece</h4>
          <p className="text-[12px] text-white/60 mt-1">
            21 standardized anatomical landmarks mapped automatically.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ------------------------------------------
// ACT 4: MASTER-DETAIL CLIENT FLOW (ELENA ROSTOVA)
// ------------------------------------------
function Act4ClientsScene({ time }: { time: number }) {
  const isElenaActive = time >= 2.0;

  return (
    <div className="relative w-full h-full bg-[#F5F2EB] overflow-hidden p-8 flex gap-6">
      {/* Left Client Dossier Directory */}
      <div className="w-[340px] h-full flex flex-col gap-3 z-20">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD0]">
          <div>
            <h3 className="text-[20px] font-bold text-[#141312] tracking-tight">Client Dossier</h3>
            <p className="text-[11px] font-mono text-[#7A7570]">Active Master-Detail Studio</p>
          </div>
          <span className="px-2 py-0.5 rounded bg-black text-white text-[11px] font-mono font-semibold">
            3 Haute Clients
          </span>
        </div>

        {/* Client Cards List */}
        <div className="flex flex-col gap-2.5 mt-1">
          {[
            { id: 'c1', name: 'Alexander Wright', orders: '2 Active Orders', phone: '+44 20 7946 0912' },
            { id: 'c2', name: 'Elena Rostova', orders: '3 Active Orders', phone: '+33 1 42 68 55 00' },
            { id: 'c3', name: 'Marcus Sterling', orders: '1 Active Order', phone: '+1 212 555 0198' },
          ].map((client) => {
            const isSelected = client.id === 'c2' && isElenaActive;
            return (
              <motion.div
                key={client.id}
                animate={{
                  scale: isSelected ? 1.02 : 1,
                  borderColor: isSelected ? '#C9AB84' : '#E8DDD0',
                  boxShadow: isSelected ? '0 10px 25px -5px rgba(201, 171, 132, 0.35)' : 'none',
                }}
                className={`p-4 rounded-xl bg-white border transition-all cursor-pointer ${
                  isSelected ? 'border-2 border-[#C9AB84]' : 'border-[#E8DDD0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[14px] text-[#141312]">{client.name}</span>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-[#C9AB84] text-black text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A7570] font-mono mt-1.5">
                  <span>{client.orders}</span>
                  <span>{client.phone}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right Active Workspace Detail (Elena Rostova) */}
      <motion.div
        animate={{ opacity: isElenaActive ? 1 : 0.4 }}
        className="flex-1 h-full rounded-2xl bg-white border border-[#E8DDD0] shadow-sm p-6 flex flex-col justify-between z-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#C9AB84] to-[#D8B17A] text-black font-bold text-[18px] flex items-center justify-center shadow-md">
              ER
            </div>
            <div>
              <h2 className="text-[24px] font-serif font-bold text-[#141312]">Elena Rostova</h2>
              <p className="text-[12px] font-mono text-[#7A7570]">
                Last Fitting: 24 Oct 2026 • VIP Haute Dossier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Synced to Atelier
            </span>
          </div>
        </div>

        {/* Center Grid: 3D Mannequin Preview + 4-Zone Measurement Table */}
        <div className="grid grid-cols-2 gap-6 my-auto">
          {/* Mannequin Mini Studio */}
          <div className="h-56 bg-[#FBF9F5] rounded-xl border border-[#E8DDD0] flex items-center justify-center relative overflow-hidden">
            <img
              src="/assets/mannequin-female-tpose-front.png"
              alt="Elena Mannequin"
              className="h-[90%] object-contain"
            />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px]">
              FEMALE SILHOUETTE
            </div>
          </div>

          {/* Measurements Cards */}
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#7A7570] block">BUST / CHEST</span>
              <strong className="text-[18px] font-mono font-bold text-[#141312]">92.0 cm</strong>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#7A7570] block">WAIST</span>
              <strong className="text-[18px] font-mono font-bold text-[#141312]">68.5 cm</strong>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#7A7570] block">INSEAM</span>
              <strong className="text-[18px] font-mono font-bold text-[#141312]">81.0 cm</strong>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-mono text-[#7A7570] block">SLEEVE</span>
              <strong className="text-[18px] font-mono font-bold text-[#141312]">60.5 cm</strong>
            </div>
          </div>
        </div>

        {/* Bottom Orders Bar */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[12px]">
          <span className="text-[#7A7570]">Active Garment: <strong>Silk Evening Gown #TF-894</strong></span>
          <span className="font-mono text-emerald-600 font-semibold">Fitting Ready: Friday, 3:00 PM</span>
        </div>
      </motion.div>
    </div>
  );
}

// ------------------------------------------
// ACT 5: RAPID VELOCITY MONTAGE
// ------------------------------------------
function Act5VelocityScene({ time }: { time: number }) {
  const beatIndex = Math.floor(time * 2) % 3; // 3 rapid cuts

  return (
    <div className="relative w-full h-full bg-[#141312] overflow-hidden flex items-center justify-center">
      {/* Dynamic Background Flash on Beat */}
      <motion.div
        key={beatIndex}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-[#C9AB84]"
      />

      {/* Beat 0: Fabric Swatches Velocity */}
      {beatIndex === 0 && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 z-20"
        >
          <span className="font-mono text-[#C9AB84] text-[13px] tracking-widest uppercase">
            01 // LUXURY TEXTILES & SWATCHES
          </span>
          <div className="flex gap-4">
            {['Super 180s Cashmere', 'Irish Pure Linen', 'Como Italian Silk'].map((f) => (
              <div
                key={f}
                className="w-48 h-36 rounded-2xl bg-neutral-900 border border-[#C9AB84]/60 p-4 flex flex-col justify-between shadow-2xl text-white"
              >
                <div className="w-8 h-8 rounded-full bg-[#C9AB84] text-black font-bold flex items-center justify-center text-[12px]">
                  ✦
                </div>
                <strong className="text-[16px]">{f}</strong>
                <span className="font-mono text-[10px] text-white/50">CALIBRATED DRAPE</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Beat 1: Status Lifecycle Velocity */}
      {beatIndex === 1 && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6 z-20"
        >
          <span className="font-mono text-[#C9AB84] text-[13px] tracking-widest uppercase">
            02 // ORDER WORKFLOW LIFECYCLE
          </span>
          <div className="flex items-center gap-3">
            {['IN MEASUREMENT', 'PATTERN CUTTING', 'FITTING READY', 'DELIVERED'].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="px-5 py-2.5 rounded-xl bg-white text-black font-mono font-bold text-[13px] shadow-2xl">
                  {s}
                </div>
                {idx < 3 && <ArrowRight className="w-5 h-5 text-[#C9AB84]" />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}

      {/* Beat 2: 3D Orbiting Perspective Planes */}
      {beatIndex === 2 && (
        <motion.div
          initial={{ rotateY: -20, scale: 0.9 }}
          animate={{ rotateY: 0, scale: 1 }}
          className="flex items-center gap-6 z-20"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="w-72 h-80 rounded-2xl bg-[#22201E] border border-[#C9AB84] p-5 text-white shadow-2xl">
            <h4 className="font-serif font-bold text-[20px]">Bespoke Tuxedo</h4>
            <p className="text-[12px] font-mono text-[#C9AB84] mt-1">21 Anatomical Points</p>
            <div className="mt-8 flex justify-center">
              <img src="/assets/mannequin-male-tpose-sheet.png" alt="Sheet" className="h-44 object-contain" />
            </div>
          </div>
          <div className="w-72 h-80 rounded-2xl bg-white text-black p-5 shadow-2xl">
            <h4 className="font-serif font-bold text-[20px]">Real-Time Sync</h4>
            <p className="text-[12px] font-mono text-[#7A7570] mt-1">Zero Latency Local Store</p>
            <div className="mt-8 space-y-2">
              <div className="h-4 bg-neutral-200 rounded-full w-full" />
              <div className="h-4 bg-[#C9AB84] rounded-full w-3/4" />
              <div className="h-4 bg-neutral-200 rounded-full w-5/6" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ------------------------------------------
// ACT 6: GRAND CONVERGENCE & OUTRO
// ------------------------------------------
function Act6OutroScene({ time }: { time: number }) {
  const isFinalClick = time >= 4.5;

  return (
    <div className="relative w-full h-full bg-[#121110] overflow-hidden flex flex-col items-center justify-center text-center p-8">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,171,132,0.25)_0%,transparent_70%)] pointer-events-none" />

      {/* Brand Origami Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-16 h-12 text-[#C9AB84] mb-4 drop-shadow-[0_8px_20px_rgba(201,171,132,0.4)]"
      >
        <OrigamiTailorFitLogo className="w-full h-full text-[#C9AB84]" />
      </motion.div>

      {/* Headline */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[52px] font-serif font-black text-white tracking-wide leading-tight uppercase"
      >
        TAILORFIT<span className="text-[#C9AB84]">.</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.4 }}
        className="text-[15px] font-mono tracking-[0.2em] text-[#C9AB84] uppercase mt-2"
      >
        Precision Tailoring Atelier • Built for Master Craftsmen
      </motion.p>

      {/* Final Action Button with Tactile Cursor */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: isFinalClick ? 0.95 : 1, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 relative"
      >
        <div className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D8B17A] to-[#C9AB84] text-black font-bold text-[14px] tracking-wide shadow-2xl flex items-center gap-2 cursor-pointer border border-white/40">
          <span>Launch Digital Atelier</span>
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Cursor click over the button */}
        {time >= 3.8 && (
          <motion.div
            initial={{ x: 60, y: 60, opacity: 0 }}
            animate={{ x: 20, y: 15, opacity: 1, scale: isFinalClick ? 0.8 : 1 }}
            className="absolute top-0 right-0 pointer-events-none"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="#FFFFFF"
                stroke="#141312"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Final Fade to Carbon Black */}
      {time >= 5.5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: (time - 5.5) / 1.0 }}
          className="absolute inset-0 bg-black z-50 pointer-events-none"
        />
      )}
    </div>
  );
}

// ------------------------------------------
// HELPER FORMATTERS
// ------------------------------------------
function formatMinutesSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const frames = Math.floor((sec % 1) * 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${frames
    .toString()
    .padStart(2, '0')}`;
}
