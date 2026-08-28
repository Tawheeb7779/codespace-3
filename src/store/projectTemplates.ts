import { ProjectFile, Project } from '../types';
import { detectLanguage, parentPath, ROOT_ID } from '../lib/paths';

interface TemplateEntry {
  path: string;
  content?: string;
  isFolder?: boolean;
}

/**
 * Builds a fully linked file map (folders created implicitly) from a flat list
 * of paths. Every file is keyed by its absolute path.
 */
export function buildFileMap(entries: TemplateEntry[]): Record<string, ProjectFile> {
  const files: Record<string, ProjectFile> = {
    [ROOT_ID]: {
      id: ROOT_ID,
      name: ROOT_ID,
      path: ROOT_ID,
      content: '',
      language: '',
      isFolder: true,
      parentId: null,
      children: [],
    },
  };

  const ensureFolder = (path: string): void => {
    if (path === ROOT_ID || files[path]) return;
    const parent = parentPath(path);
    ensureFolder(parent);
    files[path] = {
      id: path,
      name: path.slice(path.lastIndexOf('/') + 1),
      path,
      content: '',
      language: '',
      isFolder: true,
      parentId: parent,
      children: [],
    };
    files[parent].children = [...(files[parent].children || []), path];
  };

  for (const entry of entries) {
    const parent = parentPath(entry.path);
    ensureFolder(parent);

    if (entry.isFolder) {
      ensureFolder(entry.path);
      continue;
    }

    const name = entry.path.slice(entry.path.lastIndexOf('/') + 1);
    files[entry.path] = {
      id: entry.path,
      name,
      path: entry.path,
      content: entry.content ?? '',
      language: detectLanguage(name),
      isFolder: false,
      parentId: parent,
    };
    files[parent].children = [...(files[parent].children || []), entry.path];
  }

  return files;
}

const REACT_THREE_ENTRIES: TemplateEntry[] = [
  {
    path: '/package.json',
    content: `{
  "name": "codespace-3d-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview --host"
  },
  "dependencies": {
    "@react-three/drei": "^9.105.6",
    "@react-three/fiber": "^8.16.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.164.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.11"
  }
}
`,
  },
  {
    path: '/vite.config.js',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
});
`,
  },
  {
    path: '/index.html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeSpace 3D App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
  },
  {
    path: '/src/main.jsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  },
  {
    path: '/src/App.jsx',
    content: `import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Scene3D } from './components/Scene3D';
import { Header } from './components/Header';

export default function App() {
  const [activeNode, setActiveNode] = useState(null);

  return (
    <div className="app">
      <Header title="CodeSpace 3D Canvas" />
      <div className="canvas-wrap">
        <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Scene3D activeNode={activeNode} onSelectNode={setActiveNode} />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
`,
  },
  {
    path: '/src/components/Scene3D.jsx',
    content: `import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Scene3D({ activeNode, onSelectNode }) {
  const meshRef = useRef(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={() => onSelectNode('cube')}
      scale={activeNode === 'cube' ? 1.2 : 1}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={activeNode === 'cube' ? '#4d8eff' : '#a4c9ff'} wireframe />
    </mesh>
  );
}
`,
  },
  {
    path: '/src/components/Header.jsx',
    content: `import React from 'react';

export function Header({ title }) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <span>v1.0.0</span>
    </header>
  );
}
`,
  },
  {
    path: '/src/index.css',
    content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0e131d;
  color: #dee2f1;
}

.app { display: flex; flex-direction: column; height: 100vh; }
.canvas-wrap { flex: 1; position: relative; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #131926;
  border-bottom: 1px solid #252a35;
}
.header h1 { font-size: 1.05rem; margin: 0; color: #4d8eff; }
.header span { font-size: 0.75rem; color: #8a90a3; font-family: monospace; }
`,
  },
  {
    path: '/README.md',
    content: `# CodeSpace 3D Workspace

A React Three Fiber starter that runs inside the browser through WebContainer.

    npm install
    npm run dev
`,
  },
  { path: '/public', isFolder: true },
];

const VANILLA_ENTRIES: TemplateEntry[] = [
  {
    path: '/package.json',
    content: `{
  "name": "codespace-vanilla-app",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "npx --yes serve -l 3000 .",
    "start": "npx --yes serve -l 3000 ."
  }
}
`,
  },
  {
    path: '/index.html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla Workspace</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main>
      <h1>Hello from CodeSpace 3D</h1>
      <button id="counter" type="button">count is 0</button>
    </main>
    <script src="./main.js"></script>
  </body>
</html>
`,
  },
  {
    path: '/main.js',
    content: `let count = 0;
const button = document.getElementById('counter');
button.addEventListener('click', () => {
  count += 1;
  button.textContent = 'count is ' + count;
});
`,
  },
  {
    path: '/styles.css',
    content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #0e131d;
  color: #dee2f1;
}
button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #4d8eff;
  background: #131926;
  color: #dee2f1;
  cursor: pointer;
}
`,
  },
  {
    path: '/README.md',
    content: `# Vanilla Workspace

Static HTML, CSS and JavaScript. Open Live Preview to render \`index.html\`.
`,
  },
];

const NODE_ENTRIES: TemplateEntry[] = [
  {
    path: '/package.json',
    content: `{
  "name": "codespace-node-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  }
}
`,
  },
  {
    path: '/server.js',
    content: `import { createServer } from 'node:http';

const port = Number(process.env.PORT) || 3000;

createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>Node server running</h1><p>Requested: ' + req.url + '</p>');
}).listen(port, () => {
  console.log('Server listening on http://localhost:' + port);
});
`,
  },
  {
    path: '/README.md',
    content: `# Node Workspace

Run \`npm run dev\` in the terminal to start the HTTP server.
`,
  },
];

const TEMPLATES: Record<NonNullable<Project['template']>, TemplateEntry[]> = {
  'react-three': REACT_THREE_ENTRIES,
  nextjs: REACT_THREE_ENTRIES,
  vanilla: VANILLA_ENTRIES,
  node: NODE_ENTRIES,
};

/** Fresh, independent file map for a project template. */
export function createTemplateFiles(
  template: Project['template'] = 'react-three'
): Record<string, ProjectFile> {
  return buildFileMap(TEMPLATES[template] || REACT_THREE_ENTRIES);
}
