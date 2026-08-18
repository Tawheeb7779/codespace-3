import React, { useEffect, useRef } from 'react';

interface SpatialBackgroundProps {
  reducedMotion?: boolean;
}

export const SpatialBackground: React.FC<SpatialBackgroundProps> = ({ reducedMotion = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_reduced;

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;

        float d = distance(uv, mouse);
        float strength = 0.05 / (d + 0.15);

        if (u_reduced < 0.5) {
          uv += (uv - mouse) * strength * 0.05 * sin(u_time * 0.4);
        }

        vec3 color1 = vec3(0.05, 0.08, 0.14); // #0e131d surface
        vec3 color2 = vec3(0.23, 0.51, 0.96); // #3b82f6 accent
        vec3 color3 = vec3(0.11, 0.15, 0.23); // surface container

        float timeVal = u_reduced > 0.5 ? 1.0 : u_time;
        float noise = sin(uv.x * 8.0 + timeVal * 0.5) * cos(uv.y * 8.0 - timeVal * 0.3);
        noise += sin(uv.y * 4.0 + timeVal * 0.2) * cos(uv.x * 3.0 - timeVal * 0.4);

        vec3 finalColor = mix(color1, color3, noise * 0.3 + 0.5);
        finalColor = mix(finalColor, color2, strength * 0.25);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uReducedLoc = gl.getUniformLocation(program, 'u_reduced');

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = mouseX;
      let clientY = mouseY;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      mouseX = clientX;
      mouseY = height - clientY;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      gl.viewport(0, 0, width, height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      gl.viewport(0, 0, canvas.width, canvas.height);

      if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsed);
      if (uResLoc) gl.uniform2f(uResLoc, canvas.width, canvas.height);
      if (uMouseLoc) gl.uniform2f(uMouseLoc, mouseX, mouseY);
      if (uReducedLoc) gl.uniform1f(uReducedLoc, reducedMotion ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0e131d]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0e131d]/60 to-[#0e131d] pointer-events-none" />
    </div>
  );
};
