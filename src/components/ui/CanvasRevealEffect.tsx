import React, { Component, ReactNode, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cn } from '../../lib/utils';

/**
 * Same technique as Spatial3DWorkspace's WebGLBoundary: a decorative background must
 * never blank the page it sits behind, so a shader failure here just renders nothing.
 */
export class ShaderBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn('CanvasRevealEffect WebGL error:', error);
  }

  render(): ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * GLSL dot-matrix reveal shader, ported for reuse as a subtle animated backdrop.
 * Color is caller-supplied (no baked-in brand color) so this stays reusable outside
 * CodeSpace 3D's red identity.
 */

interface CanvasRevealEffectProps {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
  maxFps?: number;
}

export const CanvasRevealEffect: React.FC<CanvasRevealEffectProps> = ({
  animationSpeed = 3,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[255, 255, 255]],
  containerClassName,
  dotSize = 3,
  showGradient = true,
  reverse = false,
  maxFps = 60,
}) => {
  return (
    <div className={cn('h-full relative w-full', containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors}
          dotSize={dotSize}
          opacities={opacities}
          reverse={reverse}
          animationSpeed={animationSpeed}
          maxFps={maxFps}
          center={['x', 'y']}
        />
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  reverse?: boolean;
  animationSpeed?: number;
  maxFps?: number;
  center?: ('x' | 'y')[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  reverse = false,
  animationSpeed = 3,
  maxFps = 60,
  center = ['x', 'y'],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: 'uniform3fv',
      },
      u_opacities: { value: opacities, type: 'uniform1fv' },
      u_total_size: { value: totalSize, type: 'uniform1f' },
      u_dot_size: { value: dotSize, type: 'uniform1f' },
      u_reverse: { value: reverse ? 1 : 0, type: 'uniform1i' },
      // Real uniform driving the animation speed - the ported source hardcoded this.
      u_animation_speed: { value: animationSpeed, type: 'uniform1f' },
    };
  }, [colors, opacities, totalSize, dotSize, reverse, animationSpeed]);

  const source = `
    precision mediump float;
    in vec2 fragCoord;

    uniform float u_time;
    uniform float u_opacities[10];
    uniform vec3 u_colors[6];
    uniform float u_total_size;
    uniform float u_dot_size;
    uniform vec2 u_resolution;
    uniform int u_reverse;
    uniform float u_animation_speed;

    out vec4 fragColor;

    float PHI = 1.61803398874989484820459;
    float random(vec2 xy) {
      return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
    }

    void main() {
      vec2 st = fragCoord.xy;
      ${center.includes('x') ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));' : ''}
      ${center.includes('y') ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));' : ''}

      float opacity = step(0.0, st.x);
      opacity *= step(0.0, st.y);

      vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

      float frequency = 5.0;
      float show_offset = random(st2);
      float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
      opacity *= u_opacities[int(rand * 10.0)];
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

      vec3 color = u_colors[int(show_offset * 6.0)];

      vec2 center_grid = u_resolution / 2.0 / u_total_size;
      float dist_from_center = distance(center_grid, st2);

      float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
      float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
      float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

      float current_timing_offset;
      if (u_reverse == 1) {
        current_timing_offset = timing_offset_outro;
        opacity *= 1.0 - step(current_timing_offset, u_time * u_animation_speed);
        opacity *= clamp((step(current_timing_offset + 0.1, u_time * u_animation_speed)) * 1.25, 1.0, 1.25);
      } else {
        current_timing_offset = timing_offset_intro;
        opacity *= step(current_timing_offset, u_time * u_animation_speed);
        opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * u_animation_speed)) * 1.25, 1.0, 1.25);
      }

      fragColor = vec4(color, opacity);
      fragColor.rgb *= fragColor.a;
    }
  `;

  return <Shader source={source} uniforms={uniforms} maxFps={maxFps} />;
};

type UniformValue = number | number[] | number[][];
interface UniformDef {
  value: UniformValue;
  type: string;
}
type Uniforms = Record<string, UniformDef>;

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
  </Canvas>
);

const ShaderMaterial: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  const lastFrameTimeRef = useRef(0);
  const frameInterval = 1 / maxFps;

  // Real frame throttle - the ported source tracked lastFrameTime but never read it.
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    if (timestamp - lastFrameTimeRef.current < frameInterval) return;
    lastFrameTimeRef.current = timestamp;

    const material = ref.current.material as THREE.ShaderMaterial;
    const timeUniform = material.uniforms.u_time;
    if (timeUniform) timeUniform.value = timestamp;
  });

  const getUniforms = (): Record<string, { value: unknown }> => {
    const prepared: Record<string, { value: unknown }> = {};
    for (const name in uniforms) {
      const uniform = uniforms[name];
      switch (uniform.type) {
        case 'uniform1f':
        case 'uniform1i':
        case 'uniform1fv':
          prepared[name] = { value: uniform.value };
          break;
        case 'uniform3f':
          prepared[name] = { value: new THREE.Vector3().fromArray(uniform.value as number[]) };
          break;
        case 'uniform3fv':
          prepared[name] = {
            value: (uniform.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)),
          };
          break;
        case 'uniform2f':
          prepared[name] = { value: new THREE.Vector2().fromArray(uniform.value as number[]) };
          break;
        default:
          console.error(`Invalid uniform type for '${name}'.`);
          break;
      }
    }
    prepared.u_time = { value: 0 };
    prepared.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return prepared;
  };

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          in vec2 coordinates;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            float x = position.x;
            float y = position.y;
            gl_Position = vec4(x, y, 0.0, 1.0);
            fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: source,
        uniforms: getUniforms(),
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size.width, size.height, source]
  );

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
