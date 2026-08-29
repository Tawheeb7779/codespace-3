/**
 * A node in the virtual project filesystem.
 *
 * `id` is always the node's absolute path, so renames and moves cannot leave a
 * stale identifier behind.
 */
export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isFolder?: boolean;
  parentId?: string | null;
  children?: string[];
  isUnsaved?: boolean;
  hasError?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  template?: 'react-three' | 'react-vite' | 'ts-vite' | 'nextjs' | 'vanilla' | 'node';
  githubRepo?: string;
  branch?: string;
  isGitHubConnected?: boolean;
  files: Record<string, ProjectFile>;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  render3DQuality: 'high' | 'medium' | 'low';
  enable3DWorkspace: boolean;
  fontSize: number;
  wordWrap: boolean;
  aiProvider: 'none' | 'openai' | 'anthropic';
}
