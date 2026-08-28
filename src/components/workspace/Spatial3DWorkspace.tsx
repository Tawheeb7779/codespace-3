import React, { useRef, useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';
import { Box, Layers, RefreshCw, Eye, Sliders } from 'lucide-react';

/** Above this node count, labels only appear on hover or selection. */
const MAX_ALWAYS_ON_LABELS = 40;

/** Hard cap on rendered nodes so a large imported repository cannot stall WebGL. */
const MAX_RENDERED_NODES = 300;

interface Node3DData {
  id: string;
  name: string;
  isFolder: boolean;
  position: [number, number, number];
  color: string;
  parentId: string | null;
}

interface NodeMeshProps {
  node: Node3DData;
  isActive: boolean;
  onSelect: (id: string) => void;
  onFocus: (position: [number, number, number]) => void;
  isLowQuality: boolean;
  shaderPreset: 'standard' | 'hologram' | 'neon';
  /** Labels are hidden on large graphs; hover and selection still show them. */
  showLabel: boolean;
}

const NodeMesh: React.FC<NodeMeshProps> = ({
  node,
  isActive,
  onSelect,
  onFocus,
  isLowQuality,
  shaderPreset,
  showLabel,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const lastTapRef = useRef<number>(0);

  useFrame((_state, delta) => {
    if (meshRef.current && !isLowQuality) {
      meshRef.current.rotation.y += delta * (isActive ? 0.8 : 0.2);
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      onFocus(node.position);
    } else {
      onSelect(node.id);
    }
    lastTapRef.current = now;
  };

  const getMaterialColor = () => {
    if (hovered) return '#6366f1';
    if (isActive) return '#4d8eff';
    if (shaderPreset === 'hologram') return '#38bdf8';
    if (shaderPreset === 'neon') return '#f43f5e';
    return node.color;
  };

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={isActive ? 1.3 : hovered ? 1.15 : 1}
      >
        {node.isFolder ? (
          <octahedronGeometry args={[0.5, 0]} />
        ) : (
          <boxGeometry args={[0.6, 0.6, 0.6]} />
        )}
        <meshStandardMaterial
          color={getMaterialColor()}
          wireframe={node.isFolder || shaderPreset === 'hologram'}
          emissive={isActive ? '#004395' : shaderPreset === 'neon' ? '#881337' : '#000000'}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/*
        Labels are DOM overlays rather than drei's <Text>. Troika, which backs
        <Text>, fetches font data from a CDN at runtime - that request is blocked
        by the Cross-Origin-Embedder-Policy the workspace needs for WebContainer,
        so the labels would silently fail to appear.
      */}
      {(showLabel || hovered || isActive) && (
        <Html position={[0, 0.75, 0]} center pointerEvents="none" zIndexRange={[10, 0]}>
          <div
            className={`px-1 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none ${
              isActive ? 'text-[#adc6ff] font-semibold' : 'text-white/90'
            }`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {node.name}
          </div>
        </Html>
      )}

      {hovered && (
        <Html position={[0, 1.15, 0]} center pointerEvents="none" zIndexRange={[20, 10]}>
          <div className="bg-slate-900/90 backdrop-blur border border-primary/40 px-2.5 py-1 rounded shadow-xl text-[10px] text-white font-mono whitespace-nowrap">
            {node.isFolder ? 'Folder' : 'File'} - double tap to focus
          </div>
        </Html>
      )}
    </group>
  );
};

interface ConnectionLinesProps {
  connections: { start: [number, number, number]; end: [number, number, number] }[];
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ connections }) => {
  const lineGeometry = useMemo(() => {
    const points: number[] = [];
    connections.forEach((conn) => {
      points.push(...conn.start, ...conn.end);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [connections]);

  // Buffer geometries are not garbage collected by three.js; release the old one
  // whenever the tree changes and on unmount.
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#424754" opacity={0.5} transparent />
    </lineSegments>
  );
};

interface CameraControllerProps {
  targetFocus: [number, number, number] | null;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  prefersReducedMotion: boolean;
}

const CameraController: React.FC<CameraControllerProps> = ({ targetFocus, controlsRef, prefersReducedMotion }) => {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredCamPos = useRef(new THREE.Vector3(0, 2, 7));
  const isAnimating = useRef(false);

  useEffect(() => {
    if (targetFocus) {
      const [tx, ty, tz] = targetFocus;
      desiredTarget.current.set(tx, ty, tz);
      desiredCamPos.current.set(tx, ty + 1.2, tz + 3.5);
      isAnimating.current = true;

      if (prefersReducedMotion) {
        camera.position.copy(desiredCamPos.current);
        if (controlsRef.current) {
          controlsRef.current.target.copy(desiredTarget.current);
          controlsRef.current.update();
        }
        isAnimating.current = false;
      }
    }
  }, [targetFocus, camera, controlsRef, prefersReducedMotion]);

  useFrame((_state, delta) => {
    if (!isAnimating.current || prefersReducedMotion) return;

    const speed = Math.min(delta * 4, 0.2);
    camera.position.lerp(desiredCamPos.current, speed);

    if (controlsRef.current) {
      currentTarget.current.copy(controlsRef.current.target);
      currentTarget.current.lerp(desiredTarget.current, speed);
      controlsRef.current.target.copy(currentTarget.current);
      controlsRef.current.update();
    }

    if (camera.position.distanceTo(desiredCamPos.current) < 0.05) {
      isAnimating.current = false;
    }
  });

  return null;
};

class WebGLBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('WebGL Spatial 3D error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-low text-xs p-6 space-y-3">
          <Box className="w-10 h-10 text-primary opacity-60" />
          <h3 className="font-semibold text-slate-200">WebGL Acceleration Unavailable</h3>
          <p className="text-outline text-center max-w-sm">
            Your browser or device GPU context is restricted. The 2D Code Editor and Live Preview remain fully operational.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-primary-container text-white rounded font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry 3D Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Spatial3DWorkspace: React.FC = () => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const openFile = useProjectStore((s) => s.openFile);
  const render3DQuality = usePreferenceStore((s) => s.render3DQuality);

  const [searchFilter, setSearchFilter] = useState('');
  const [targetFocus, setTargetFocus] = useState<[number, number, number] | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [shaderPreset, setShaderPreset] = useState<'standard' | 'hologram' | 'neon'>('standard');
  const [arStatusMsg, setArStatusMsg] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleRequestArMode = async () => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      try {
        const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
        if (supported) {
          setArStatusMsg('WebXR AR mode supported. Ready for pass-through device session.');
        } else {
          setArStatusMsg('WebXR AR mode is not supported on this device/display.');
        }
      } catch {
        setArStatusMsg('WebXR AR capability query error.');
      }
    } else {
      setArStatusMsg('WebXR API unavailable in current browser environment.');
    }
    setTimeout(() => setArStatusMsg(null), 4000);
  };

  /**
   * Layout depends only on the shape of the tree. Keying the memo on the project
   * object rebuilt every node on each keystroke, because editing a file produces
   * a new project reference.
   */
  const treeSignature = useMemo(() => {
    if (!currentProject) return '';
    return Object.values(currentProject.files)
      .map((f) => `${f.id}:${f.isFolder ? 'd' : 'f'}:${f.parentId ?? ''}`)
      .sort()
      .join('|');
  }, [currentProject]);

  const { nodes, connections } = useMemo(() => {
    if (!currentProject) return { nodes: [] as Node3DData[], connections: [] };

    const fileList = Object.values(currentProject.files).filter((f) => f.id !== '/');
    const generatedNodes: Node3DData[] = [];
    const generatedConnections: { start: [number, number, number]; end: [number, number, number] }[] = [];

    const total = fileList.length;
    fileList.forEach((file, index) => {
      const phi = Math.acos(-1 + (2 * index) / Math.max(1, total));
      const theta = Math.sqrt(total * Math.PI) * phi;
      const radius = file.isFolder ? 2.2 : 3.8;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const ext = file.name.split('.').pop();
      let color = '#a4c9ff';
      if (file.isFolder) color = '#ffb786';
      else if (ext === 'tsx' || ext === 'ts') color = '#4d8eff';
      else if (ext === 'json') color = '#ffb786';

      generatedNodes.push({
        id: file.id,
        name: file.name,
        isFolder: file.isFolder || false,
        position: [x, y, z],
        color,
        parentId: file.parentId || null,
      });
    });

    generatedNodes.forEach((node) => {
      if (node.parentId) {
        const parentNode = generatedNodes.find((n) => n.id === node.parentId);
        if (parentNode) {
          generatedConnections.push({
            start: parentNode.position,
            end: node.position,
          });
        }
      }
    });

    return { nodes: generatedNodes, connections: generatedConnections };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeSignature]);

  const filteredNodes = useMemo(
    () =>
      nodes
        .filter((n) => n.name.toLowerCase().includes(searchFilter.toLowerCase()))
        .slice(0, MAX_RENDERED_NODES),
    [nodes, searchFilter]
  );

  const hiddenNodeCount = Math.max(0, nodes.length - filteredNodes.length);

  return (
    <WebGLBoundary>
      <div className="w-full h-full relative bg-[#0e131d] overflow-hidden select-none">
        {/* Controls Overlay */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2 items-center">
          <div className="bg-surface-low/80 backdrop-blur-md p-1.5 rounded-lg border border-outline-variant/20 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search 3D nodes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-surface-container text-xs text-white px-2.5 py-1 rounded border border-outline-variant/20 focus:outline-none focus:border-primary w-36"
            />
            <span
              className="text-[10px] text-outline font-mono flex items-center gap-1"
              title={hiddenNodeCount > 0 ? `${hiddenNodeCount} more node(s) not shown` : undefined}
            >
              <Layers className="w-3 h-3 text-primary" /> {filteredNodes.length}
              {hiddenNodeCount > 0 && <span className="text-amber-400">+{hiddenNodeCount}</span>}
            </span>
          </div>

          {/* Shader Customizer Toggles */}
          <div className="bg-surface-low/80 backdrop-blur-md p-1.5 rounded-lg border border-outline-variant/20 flex items-center gap-1 text-[10px] font-mono text-outline">
            <Sliders className="w-3 h-3 text-secondary" />
            <button
              onClick={() => setShaderPreset('standard')}
              className={`px-2 py-0.5 rounded ${shaderPreset === 'standard' ? 'bg-primary-container text-white' : 'hover:text-white'}`}
            >
              Standard
            </button>
            <button
              onClick={() => setShaderPreset('hologram')}
              className={`px-2 py-0.5 rounded ${shaderPreset === 'hologram' ? 'bg-primary-container text-white' : 'hover:text-white'}`}
            >
              Hologram
            </button>
            <button
              onClick={() => setShaderPreset('neon')}
              className={`px-2 py-0.5 rounded ${shaderPreset === 'neon' ? 'bg-primary-container text-white' : 'hover:text-white'}`}
            >
              Neon
            </button>
          </div>

          {/* AR Mode Trigger */}
          <button
            onClick={handleRequestArMode}
            className="bg-surface-low/80 backdrop-blur-md p-2 rounded-lg border border-outline-variant/20 hover:border-primary/50 text-xs text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 font-mono"
            title="Request WebXR AR Pass-through Mode"
          >
            <Eye className="w-3.5 h-3.5 text-tertiary" /> WebXR AR
          </button>
        </div>

        {arStatusMsg && (
          <div className="absolute top-14 left-3 z-30 bg-surface-container/90 backdrop-blur border border-tertiary/40 text-tertiary px-3 py-1.5 rounded text-[10px] font-mono shadow-xl">
            {arStatusMsg}
          </div>
        )}

        {/* 3D Canvas */}
        <Canvas camera={{ position: [0, 2, 7], fov: 55 }}>
          <ambientLight intensity={render3DQuality === 'low' ? 0.8 : 0.4} />
          {render3DQuality !== 'low' && <pointLight position={[10, 10, 10]} intensity={1} />}

          <ConnectionLines connections={connections} />

          {filteredNodes.map((node) => (
            <NodeMesh
              key={node.id}
              node={node}
              isActive={node.id === activeFileId}
              onSelect={openFile}
              onFocus={setTargetFocus}
              isLowQuality={render3DQuality === 'low'}
              shaderPreset={shaderPreset}
              showLabel={filteredNodes.length <= MAX_ALWAYS_ON_LABELS}
            />
          ))}

          <CameraController
            targetFocus={targetFocus}
            controlsRef={controlsRef}
            prefersReducedMotion={prefersReducedMotion}
          />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={25}
            maxPolarAngle={Math.PI - 0.05}
            minPolarAngle={0.05}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }}
          />
        </Canvas>
      </div>
    </WebGLBoundary>
  );
};
