import React, { useRef, useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';
import { Box, Layers, RefreshCw } from 'lucide-react';

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
}

const NodeMesh: React.FC<NodeMeshProps> = ({ node, isActive, onSelect, onFocus, isLowQuality }) => {
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
      // Double tap / Double click: Focus camera smoothly
      onFocus(node.position);
    } else {
      // Single tap / Single click: Select file and open in Monaco
      onSelect(node.id);
    }
    lastTapRef.current = now;
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
          color={hovered ? '#6366f1' : isActive ? '#4d8eff' : node.color}
          wireframe={node.isFolder}
          emissive={isActive ? '#004395' : '#000000'}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Floating 3D Label */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.25}
        color={isActive ? '#adc6ff' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {node.name}
      </Text>

      {/* Hover Info Tag */}
      {hovered && (
        <Html position={[0, 1.1, 0]} center pointerEvents="none">
          <div className="bg-slate-900/90 backdrop-blur border border-primary/40 px-2.5 py-1 rounded shadow-xl text-[10px] text-white font-mono whitespace-nowrap">
            {node.isFolder ? 'Folder Node' : 'Source File'} • Double Tap to Focus
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

      // Calculate smooth offset for camera focus
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

    // Smooth lerp camera position and target
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
  const { projects, activeProjectId, activeFileId, openFile } = useProjectStore();
  const { render3DQuality } = usePreferenceStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [targetFocus, setTargetFocus] = useState<[number, number, number] | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const { nodes, connections } = useMemo(() => {
    if (!currentProject) return { nodes: [], connections: [] };

    const fileList = Object.values(currentProject.files);
    const generatedNodes: Node3DData[] = [];
    const generatedConnections: { start: [number, number, number]; end: [number, number, number] }[] = [];

    const total = fileList.length;
    fileList.forEach((file, index) => {
      // Calculate 3D spatial layout using spherical/spiral node arrangement
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

    // Create edge connections between files and parent folders
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
  }, [currentProject]);

  const filteredNodes = nodes.filter((n) =>
    n.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <WebGLBoundary>
      <div className="w-full h-full relative bg-[#0e131d] overflow-hidden select-none">
        {/* Search & Navigation Overlay Overlay */}
        <div className="absolute top-3 left-3 z-20 bg-surface-low/80 backdrop-blur-md p-2 rounded-lg border border-outline-variant/20 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search 3D nodes..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-surface-container text-xs text-white px-2.5 py-1 rounded border border-outline-variant/20 focus:outline-none focus:border-primary w-40"
          />
          <span className="text-[10px] text-outline font-mono flex items-center gap-1">
            <Layers className="w-3 h-3 text-primary" /> {filteredNodes.length} Nodes
          </span>
        </div>

        {/* 3D Canvas */}
        <Canvas camera={{ position: [0, 2, 7], fov: 55 }}>
          <ambientLight intensity={render3DQuality === 'low' ? 0.8 : 0.4} />
          {render3DQuality !== 'low' && <pointLight position={[10, 10, 10]} intensity={1} />}

          {/* Connection Lines */}
          <ConnectionLines connections={connections} />

          {/* Interactive Nodes */}
          {filteredNodes.map((node) => (
            <NodeMesh
              key={node.id}
              node={node}
              isActive={node.id === activeFileId}
              onSelect={(id) => openFile(id)}
              onFocus={(pos) => setTargetFocus(pos)}
              isLowQuality={render3DQuality === 'low'}
            />
          ))}

          {/* Camera Controller & Smooth OrbitControls */}
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
