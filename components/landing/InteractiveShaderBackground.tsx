'use client';

import React, { useRef, useEffect, useState } from 'react';

interface InteractiveShaderBackgroundProps {
  className?: string;
  speed?: number;
  interactive?: boolean;
}

export function InteractiveShaderBackground({
  className = '',
  speed = 1.0,
  interactive = true,
}: InteractiveShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: false });
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setWebglSupported(false);
      return;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Vertex shader: Full-screen quad
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader: 3-stop flowing organic gradient matching Figma Moving gradient
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;

      // Noise functions for liquid flow
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        float aspect = uResolution.x / uResolution.y;
        vec2 uv = vUv;
        uv.x *= aspect;

        // Interactive mouse influence
        vec2 m = uMouse;
        m.x *= aspect;
        float dToMouse = distance(uv, m);
        float mouseWarp = exp(-dToMouse * 3.2) * 0.25;

        float t = uTime * 0.35;
        vec2 q = vec2(
          snoise(uv * 1.8 + vec2(t * 0.4, t * 0.3)) + (uv.x - m.x) * mouseWarp,
          snoise(uv * 1.8 + vec2(-t * 0.3, t * 0.4)) + (uv.y - m.y) * mouseWarp
        );

        vec2 r = vec2(
          snoise(uv * 2.2 + 2.0 * q + vec2(t * 0.25, -t * 0.2)),
          snoise(uv * 2.2 + 2.0 * q + vec2(-t * 0.2, t * 0.25))
        );

        float f = 0.5 + 0.5 * snoise(uv * 1.5 + 3.0 * r);

        // Exact Figma Color stops
        // 1: #F6F2E5 (cream: 0.966, 0.951, 0.897)
        // 2: #829CFA (periwinkle blue: 0.509, 0.611, 0.981)
        // 3: #BAFF99 (mint lime: 0.727, 1.000, 0.601)
        vec3 c1 = vec3(0.966, 0.951, 0.897);
        vec3 c2 = vec3(0.509, 0.611, 0.981);
        vec3 c3 = vec3(0.727, 1.000, 0.601);

        vec3 color;
        if (f < 0.5) {
          color = mix(c1, c2, smoothstep(0.0, 0.55, f));
        } else {
          color = mix(c2, c3, smoothstep(0.45, 1.0, f));
        }

        // Soft ambient blend
        color = mix(color, c1, 0.15 * (1.0 - smoothstep(0.0, 0.8, length(vUv - 0.5))));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    // Quad buffer
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uResLoc = gl.getUniformLocation(program, 'uResolution');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');

    let animId: number;
    let startTime = performance.now();

    const resize = () => {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      const displayWidth = Math.floor(width * dpr);
      const displayHeight = Math.floor(height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    const render = (time: number) => {
      if (!gl || !canvas) return;
      resize();

      // Smooth mouse interpolation
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.08;
      m.y += (m.targetY - m.y) * 0.08;

      const elapsed = ((time - startTime) / 1000) * speed;
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform2f(uMouseLoc, m.x, 1.0 - m.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(posBuffer);
      }
    };
  }, [speed]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
      mouseRef.current.active = true;
    }
  };

  const handlePointerLeave = () => {
    mouseRef.current.targetX = 0.5;
    mouseRef.current.targetY = 0.5;
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`absolute inset-0 overflow-hidden pointer-events-auto ${className}`}
      aria-hidden="true"
    >
      {/* CSS Mesh Gradient Backdrop & Fallback */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, #F6F2E5 0%, transparent 60%),
            radial-gradient(circle at 80% 40%, #829CFA 0%, transparent 65%),
            radial-gradient(circle at 50% 85%, #BAFF99 0%, transparent 70%),
            #E4CECE
          `,
        }}
      />

      {/* WebGL Animated Interactive Canvas */}
      {webglSupported && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
    </div>
  );
}
