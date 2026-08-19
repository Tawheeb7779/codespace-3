export interface ProjectAsset {
  id: string;
  name: string;
  type: '3d-model' | 'texture' | 'audio' | 'image';
  size: string;
  url: string;
  updatedAt: string;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
}

export interface PackageDependency {
  name: string;
  version: string;
  isDev?: boolean;
  hasVulnerability?: boolean;
  vulnerabilitySeverity?: 'low' | 'moderate' | 'high' | 'critical';
}
