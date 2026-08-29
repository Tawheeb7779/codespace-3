import { describe, it, expect } from 'vitest';
import { SHADER_PRESETS, GlslCompiler } from './ShaderEditorPanel';
import { usePreferenceStore } from '../../store/usePreferenceStore';

describe('ShaderEditorPanel & GlslCompiler', () => {
  it('defines valid GLSL shader presets', () => {
    expect(SHADER_PRESETS.length).toBeGreaterThan(0);
    const hologram = SHADER_PRESETS.find(p => p.id === 'hologram');
    expect(hologram).toBeDefined();
    expect(hologram?.vertexShader).toContain('varying vec2 vUv;');
    expect(hologram?.fragmentShader).toContain('gl_FragColor');
  });

  it('validates GLSL fragment shader syntax without crashing', () => {
    const validGlsl = `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;
    const res = GlslCompiler.validateFragmentShader(validGlsl);
    expect(res).toBeDefined();
    expect(typeof res.valid).toBe('boolean');
  });

  it('updates custom GLSL shaders in usePreferenceStore', () => {
    const store = usePreferenceStore.getState();
    store.setCustomShaders('vertex_test', 'fragment_test');

    const updated = usePreferenceStore.getState();
    expect(updated.customVertexShader).toBe('vertex_test');
    expect(updated.customFragmentShader).toBe('fragment_test');
  });
});
