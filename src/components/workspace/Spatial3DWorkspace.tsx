import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';

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
  isLowQuality: boolean;
}

const NodeMesh: React.FC<NodeMeshProps> = ({ node, isActive, onSelect, isLowQuality }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_state, delta) => {
    if (meshRef.current && !isLowQuality) {
      meshRef.current.rotation.y += delta * (isActive ? 0.8 : 0.2);
    }
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
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
        <Html position={[0, 1.1, 0]} center>
          <div className="bg-slate-900/90 backdrop-blur border border-primary/40 px-2.5 py-1 rounded shadow-xl text-[10px] text-white font-mono whitespace-nowrap pointer-events-none">
            {node.isFolder ? 'Folder Node' : 'Source File'} • Click to Open
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

export const Spatial3DWorkspace: React.FC = () => {
  const { projects, activeProjectId, activeFileId, openFile } = useProjectStore();
  const { render3DQuality } = usePreferenceStore();

  const [searchFilter, setSearchFilter] = useState('');

  const currentProject = projects.find((p) => p.id === activeProjectId);

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
    <div className="w-full h-full relative bg-[#0e131d] overflow-hidden select-none">
      {/* Search overlay inside 3D canvas */}
      <div className="absolute top-3 left-3 z-20 bg-surface-low/80 backdrop-blur-md p-2 rounded-lg border border-outline-variant/20 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search 3D nodes..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="bg-surface-container text-xs text-white px-2.5 py-1 rounded border border-outline-variant/20 focus:outline-none focus:border-primary w-40"
        />
        <span className="text-[10px] text-outline font-mono">
          {filteredNodes.length} Nodes
        </span>
      </div>

      <Canvas camera={{ position: [0, 2, 7], fov: 55 }}>
        <ambientLight intensity={render3DQuality === 'low' ? 0.8 : 0.4} />
        {render3DQuality !== 'low' && <pointLight position={[10, 10, 10]} intensity={1} />}

        {/* Render Connection Edges */}
        <ConnectionLines connections={connections} />

        {/* Render Interactive 3D Nodes */}
        {filteredNodes.map((node) => (
          <NodeMesh
            key={node.id}
            node={node}
            isActive={node.id === activeFileId}
            onSelect={(id) => openFile(id)}
            isLowQuality={render3DQuality === 'low'}
          />
        ))}

        <OrbitControls enablePan enableZoom rotateSpeed={0.6} />
      </Canvas>
    </div>
  );
};
