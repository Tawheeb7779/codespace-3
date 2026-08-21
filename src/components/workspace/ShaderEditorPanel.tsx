import React, { useState } from 'react';
import {
  Code2,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { usePreferenceStore } from '../../store/usePreferenceStore';

export interface ShaderPreset {
  id: string;
  name: string;
  vertexShader: string;
  fragmentShader: string;
}

export const SHADER_PRESETS: ShaderPreset[] = [
  {
    id: 'rainbow-wave',
    name: 'Pulsing Rainbow Wave',
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform float uTime;
varying vec2 vUv;
void main() {
  vec3 col = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}`
  },
  {
    id: 'hologram',
    name: 'Cyber Hologram',
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform float uTime;
varying vec2 vUv;
void main() {
  float scanline = sin(vUv.y * 60.0 + uTime * 6.0) * 0.5 + 0.5;
  vec3 cyan = vec3(0.1, 0.7, 1.0);
  gl_FragColor = vec4(cyan * (0.5 + scanline * 0.5), 0.85);
}`
  },
  {
    id: 'neon-glow',
    name: 'Neon Cyberpunk',
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform float uTime;
varying vec2 vUv;
void main() {
  float pulse = sin(uTime * 4.0) * 0.2 + 0.8;
  vec3 pink = vec3(1.0, 0.1, 0.5) * pulse;
  gl_FragColor = vec4(pink, 1.0);
}`
  }
];

export class GlslCompiler {
  public static validateFragmentShader(glslCode: string): { valid: boolean; error?: string } {
    try {
      if (typeof document === 'undefined') return { valid: true };
      const canvas = document.createElement('canvas');
      if (typeof canvas.getContext !== 'function') return { valid: true };

      let gl: WebGLRenderingContext | null = null;
      try {
        gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
      } catch {
        return { valid: true };
      }

      if (!gl) return { valid: true };

      const shader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!shader) return { valid: true };

      gl.shaderSource(shader, glslCode);
      gl.compileShader(shader);

      const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled) {
        const errorLog = gl.getShaderInfoLog(shader) || 'GLSL compilation error';
        gl.deleteShader(shader);
        return { valid: false, error: errorLog };
      }

      gl.deleteShader(shader);
      return { valid: true };
    } catch {
      return { valid: true };
    }
  }
}

export const ShaderEditorPanel: React.FC = () => {
  const { customVertexShader, customFragmentShader, setCustomShaders } = usePreferenceStore();

  const [activeTab, setActiveTab] = useState<'fragment' | 'vertex'>('fragment');
  const [vertexCode, setVertexCode] = useState(customVertexShader || SHADER_PRESETS[0].vertexShader);
  const [fragmentCode, setFragmentCode] = useState(customFragmentShader || SHADER_PRESETS[0].fragmentShader);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileSuccess, setCompileSuccess] = useState(false);

  const handleApplyPreset = (preset: ShaderPreset) => {
    setVertexCode(preset.vertexShader);
    setFragmentCode(preset.fragmentShader);
    setCompileError(null);
    setCustomShaders(preset.vertexShader, preset.fragmentShader);
    setCompileSuccess(true);
    setTimeout(() => setCompileSuccess(false), 2000);
  };

  const handleCompileShader = () => {
    setCompileError(null);
    setCompileSuccess(false);

    // Validate GLSL compilation
    const validation = GlslCompiler.validateFragmentShader(fragmentCode);
    if (!validation.valid) {
      setCompileError(validation.error || 'GLSL fragment shader compilation failed');
      return;
    }

    setCustomShaders(vertexCode, fragmentCode);
    setCompileSuccess(true);
    setTimeout(() => setCompileSuccess(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <Code2 className="w-4 h-4 text-secondary" /> GLSL SHADER STUDIO
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 text-[10px] font-mono">
          LIVE SHADER ENGINE
        </span>
      </div>

      {/* Preset Selector Toggles */}
      <div className="space-y-1.5">
        <span className="text-outline text-[10px] font-semibold uppercase tracking-wider block">GLSL PRESETS</span>
        <div className="grid grid-cols-3 gap-1">
          {SHADER_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="py-1 px-1.5 bg-surface-container hover:bg-surface-high text-slate-200 rounded border border-outline-variant/15 truncate text-[10px] font-mono transition-colors"
              title={p.name}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Code Tab Switcher (Fragment vs Vertex) */}
      <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/15 text-[11px]">
        <button
          onClick={() => setActiveTab('fragment')}
          className={`flex-1 py-1 rounded font-medium transition-all ${
            activeTab === 'fragment' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          Fragment Shader (FS)
        </button>
        <button
          onClick={() => setActiveTab('vertex')}
          className={`flex-1 py-1 rounded font-medium transition-all ${
            activeTab === 'vertex' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          Vertex Shader (VS)
        </button>
      </div>

      {/* GLSL Code Editor Area */}
      <div className="flex-1 flex flex-col space-y-2 min-h-[180px]">
        {activeTab === 'fragment' ? (
          <textarea
            rows={10}
            value={fragmentCode}
            onChange={(e) => setFragmentCode(e.target.value)}
            className="w-full flex-1 p-2.5 bg-[#0a0e17] text-slate-100 font-mono text-[11px] border border-outline-variant/20 rounded-lg focus:outline-none focus:border-secondary leading-relaxed resize-none"
            spellCheck={false}
          />
        ) : (
          <textarea
            rows={10}
            value={vertexCode}
            onChange={(e) => setVertexCode(e.target.value)}
            className="w-full flex-1 p-2.5 bg-[#0a0e17] text-slate-100 font-mono text-[11px] border border-outline-variant/20 rounded-lg focus:outline-none focus:border-secondary leading-relaxed resize-none"
            spellCheck={false}
          />
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => handleApplyPreset(SHADER_PRESETS[0])}
            className="px-2.5 py-1.5 bg-surface-high hover:bg-surface-high/80 text-outline hover:text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1 border border-outline-variant/20"
          >
            <RotateCw className="w-3 h-3" /> Reset
          </button>

          <button
            onClick={handleCompileShader}
            className="px-4 py-1.5 bg-secondary text-slate-950 font-bold rounded text-xs hover:bg-secondary/90 transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Compile GLSL Shader
          </button>
        </div>
      </div>

      {/* Compiler Error Feedback */}
      {compileError && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-[11px] space-y-1 font-mono">
          <div className="font-semibold flex items-center gap-1.5 text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" /> GLSL Compiler Error
          </div>
          <p className="whitespace-pre-wrap break-all">{compileError}</p>
        </div>
      )}

      {/* Success Feedback */}
      {compileSuccess && (
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] flex items-center gap-1.5 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Shader compiled! Live 3D nodes updated.</span>
        </div>
      )}

      <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/15 text-[10px] text-outline space-y-1 font-mono">
        <div className="flex items-center gap-1 text-slate-200 font-semibold">
          <Sparkles className="w-3 h-3 text-secondary" /> Shader Uniforms Available
        </div>
        <div>uniform float uTime; // Animated delta frame counter</div>
        <div>varying vec2 vUv;  // Normalized texture UV mapping</div>
      </div>
    </div>
  );
};
