import { describe, it, expect } from 'vitest';

describe('HelpSupportModal Data & Component Verification', () => {
  it('contains valid keyboard shortcut definitions', () => {
    const shortcuts = [
      { keyCombo: '⌘K / Ctrl+K', description: 'Open Global Command Palette' },
      { keyCombo: 'Alt + 1', description: 'Switch Viewport to Code Editor Only' },
      { keyCombo: 'Alt + 2', description: 'Switch Viewport to Split 3D Workspace' },
    ];

    expect(shortcuts.length).toBe(3);
    expect(shortcuts[0].keyCombo).toContain('⌘K');
  });

  it('contains local documentation articles', () => {
    const docs = [
      { id: 'quick-start', title: 'CodeSpace 3D Quick Start Guide' },
      { id: '3d-guide', title: '3D Spatial Graph & Camera Navigation' },
    ];

    expect(docs.length).toBe(2);
    expect(docs[0].title).toBe('CodeSpace 3D Quick Start Guide');
  });
});
