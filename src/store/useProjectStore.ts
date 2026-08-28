import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project, ProjectFile } from '../types';
import { WorkspaceTask, ChatMessage, ProjectAsset } from '../types/stitch';
import { RuntimeFilesystemBridge } from '../runtime/RuntimeFilesystemBridge';
import { useAuthStore } from './useAuthStore';
import { createTemplateFiles } from './projectTemplates';
import {
  ROOT_ID,
  baseName,
  detectLanguage,
  isPathInside,
  isValidFileName,
  joinPath,
  normalizePath,
  parentPath,
  rewritePathPrefix,
} from '../lib/paths';

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface ExtendedProject extends Project {
  userId?: string;
  visibility?: 'public' | 'private';
}

export interface FileOperationResult {
  ok: boolean;
  /** Path of the created/renamed/moved node when the operation succeeded. */
  id?: string;
  error?: string;
}

const OK = (id?: string): FileOperationResult => ({ ok: true, id });
const FAIL = (error: string): FileOperationResult => ({ ok: false, error });

/** Milliseconds of editor inactivity before a file is auto-saved to the runtime. */
export const AUTOSAVE_DELAY_MS = 900;

function createDemoProject(): ExtendedProject {
  return {
    id: 'demo-3d-app',
    name: '3D Spatial App',
    description: 'Interactive Three.js and React Three Fiber spatial project with 3D nodes',
    updatedAt: new Date().toISOString(),
    template: 'react-three',
    branch: 'main',
    files: createTemplateFiles('react-three'),
    userId: 'guest-local',
    visibility: 'public',
  };
}

/** Every descendant of `id`, plus `id` itself. */
function collectSubtree(files: Record<string, ProjectFile>, id: string): string[] {
  const node = files[id];
  if (!node) return [];
  const out = [id];
  for (const childId of node.children || []) {
    out.push(...collectSubtree(files, childId));
  }
  return out;
}

function detachFromParent(files: Record<string, ProjectFile>, id: string): void {
  const node = files[id];
  if (!node || !node.parentId) return;
  const parent = files[node.parentId];
  if (!parent) return;
  files[parent.id] = { ...parent, children: (parent.children || []).filter((c) => c !== id) };
}

function attachToParent(files: Record<string, ProjectFile>, parentId: string, id: string): void {
  const parent = files[parentId];
  if (!parent) return;
  const children = parent.children || [];
  if (children.includes(id)) return;
  files[parentId] = { ...parent, children: [...children, id] };
}

/**
 * Re-keys a subtree after a rename or move so no stale path is left behind.
 * Returns the new file map; the caller supplies the new root path of the subtree.
 */
function relocateSubtree(
  files: Record<string, ProjectFile>,
  fromId: string,
  toId: string
): Record<string, ProjectFile> {
  const subtree = collectSubtree(files, fromId);
  const next: Record<string, ProjectFile> = { ...files };

  detachFromParent(next, fromId);

  for (const oldId of subtree) {
    const node = next[oldId];
    delete next[oldId];
    const newId = rewritePathPrefix(oldId, fromId, toId);
    next[newId] = {
      ...node,
      id: newId,
      path: newId,
      name: baseName(newId),
      parentId: newId === toId ? parentPath(toId) : rewritePathPrefix(node.parentId || ROOT_ID, fromId, toId),
      children: node.children?.map((c) => rewritePathPrefix(c, fromId, toId)),
    };
  }

  attachToParent(next, parentPath(toId), toId);
  return next;
}

/** Sorted child ids: folders first, then files, each alphabetically. */
function sortChildren(files: Record<string, ProjectFile>, children: string[]): string[] {
  return [...children].sort((a, b) => {
    const fa = files[a];
    const fb = files[b];
    if (!fa || !fb) return 0;
    if (!!fa.isFolder !== !!fb.isFolder) return fa.isFolder ? -1 : 1;
    return fa.name.localeCompare(fb.name);
  });
}

interface ProjectState {
  projects: ExtendedProject[];
  activeProjectId: string | null;
  activeFileId: string | null;
  openTabIds: string[];
  gitBranch: string;
  gitStatus: { staged: string[]; unstaged: string[]; committed: boolean };
  githubRepo: string | null;
  githubConnected: boolean;

  // RBAC user role for the active project
  currentUserRole: UserRole;

  // Per-project feature state
  projectTasks: Record<string, WorkspaceTask[]>;
  projectChats: Record<string, ChatMessage[]>;
  projectAssets: Record<string, ProjectAsset[]>;

  // Project actions
  setActiveProject: (id: string) => void;
  createProject: (name: string, description: string, template?: Project['template']) => ExtendedProject;
  /** Creates a project from an existing file map (e.g. a GitHub import). */
  importProject: (
    name: string,
    description: string,
    files: Record<string, ProjectFile>,
    meta?: { githubRepo?: string; branch?: string }
  ) => ExtendedProject;
  deleteProject: (id: string) => void;

  // Tab actions
  openFile: (fileId: string) => void;
  closeTab: (fileId: string) => void;

  // File actions
  updateFileContent: (fileId: string, content: string) => void;
  saveFile: (fileId: string) => void;
  saveAllFiles: () => void;
  createFile: (name: string, parentId?: string | null, isFolder?: boolean) => FileOperationResult;
  deleteFile: (fileId: string) => FileOperationResult;
  renameFile: (fileId: string, newName: string) => FileOperationResult;
  moveFile: (fileId: string, newParentId: string) => FileOperationResult;
  getFileByPath: (path: string) => ProjectFile | null;
  getActiveProject: () => ExtendedProject | null;

  // Integrations / git
  setGithubRepo: (repo: string | null) => void;
  setGithubConnected: (connected: boolean) => void;
  setUserRole: (role: UserRole) => void;
  stageFile: (filePath: string) => void;
  unstageFile: (filePath: string) => void;
  commitChanges: (message: string) => void;

  // Feature state
  setTasksForProject: (projectId: string, tasks: WorkspaceTask[]) => void;
  setChatForProject: (projectId: string, messages: ChatMessage[]) => void;
  setAssetsForProject: (projectId: string, assets: ProjectAsset[]) => void;
}

/** Pending autosave timers, keyed by `${projectId}::${fileId}`. */
const autosaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleAutosave(projectId: string, fileId: string, save: () => void): void {
  const key = `${projectId}::${fileId}`;
  const existing = autosaveTimers.get(key);
  if (existing) clearTimeout(existing);
  autosaveTimers.set(
    key,
    setTimeout(() => {
      autosaveTimers.delete(key);
      save();
    }, AUTOSAVE_DELAY_MS)
  );
}

/**
 * localStorage wrapper that coalesces writes.
 *
 * The unthrottled default writes the entire project tree on every keystroke,
 * which is the single largest source of editor input lag.
 */
function createThrottledStorage(delayMs = 400): Storage {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    timer = null;
    for (const [key, value] of pending) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        // Quota exceeded or storage disabled - keep the session usable in memory.
        console.warn('[CodeSpace] Unable to persist workspace state:', e);
      }
    }
    pending.clear();
  };

  return {
    getItem: (key: string) => {
      const queued = pending.get(key);
      if (queued !== undefined) return queued;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      pending.set(key, value);
      if (timer === null) timer = setTimeout(flush, delayMs);
    },
    removeItem: (key: string) => {
      pending.delete(key);
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  } as unknown as Storage;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      /** Applies `mutate` to the active project's file map and returns the new projects array. */
      const withActiveProject = (
        mutate: (files: Record<string, ProjectFile>, project: ExtendedProject) => Record<string, ProjectFile>
      ): ExtendedProject[] | null => {
        const { projects, activeProjectId } = get();
        const project = projects.find((p) => p.id === activeProjectId);
        if (!project) return null;
        const files = mutate({ ...project.files }, project);
        return projects.map((p) =>
          p.id === project.id ? { ...p, files, updatedAt: new Date().toISOString() } : p
        );
      };

      return {
        projects: [createDemoProject()],
        activeProjectId: 'demo-3d-app',
        activeFileId: '/src/App.tsx',
        openTabIds: ['/src/App.tsx', '/README.md'],
        gitBranch: 'main',
        gitStatus: { staged: [], unstaged: [], committed: false },
        githubRepo: null,
        githubConnected: false,
        currentUserRole: 'owner',

        projectTasks: {},
        projectChats: {},
        projectAssets: {},

        getActiveProject: () => {
          const { projects, activeProjectId } = get();
          return projects.find((p) => p.id === activeProjectId) || null;
        },

        getFileByPath: (path) => {
          const project = get().getActiveProject();
          if (!project) return null;
          return project.files[normalizePath(path)] || null;
        },

        setActiveProject: (id) => {
          const state = get();
          const project = state.projects.find((p) => p.id === id);
          if (!project) return;

          // Switching to the project that is already active must not reset tabs.
          if (state.activeProjectId === id && state.openTabIds.length > 0) {
            RuntimeFilesystemBridge.initializeProject(id, project.files);
            return;
          }

          const firstFile = Object.values(project.files).find((f) => !f.isFolder);
          set({
            activeProjectId: id,
            activeFileId: firstFile ? firstFile.id : null,
            openTabIds: firstFile ? [firstFile.id] : [],
            gitBranch: project.branch || 'main',
            gitStatus: { staged: [], unstaged: [], committed: false },
          });
          RuntimeFilesystemBridge.initializeProject(id, project.files);
        },

        createProject: (name, description, template = 'react-three') => {
          const currentUser = useAuthStore.getState().user;
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
          const id = `${slug}-${Date.now().toString(36)}`;
          const files = createTemplateFiles(template);
          const firstFile = Object.values(files).find((f) => !f.isFolder && f.name !== 'package.json');

          const newProject: ExtendedProject = {
            id,
            name,
            description,
            updatedAt: new Date().toISOString(),
            template,
            branch: 'main',
            files,
            userId: currentUser?.id || 'guest-local',
            visibility: 'private',
          };

          set((state) => ({
            projects: [newProject, ...state.projects],
            activeProjectId: id,
            activeFileId: firstFile ? firstFile.id : null,
            openTabIds: firstFile ? [firstFile.id] : [],
            gitBranch: 'main',
            gitStatus: { staged: [], unstaged: [], committed: false },
          }));

          RuntimeFilesystemBridge.initializeProject(id, files);
          return newProject;
        },

        importProject: (name, description, files, meta = {}) => {
          const currentUser = useAuthStore.getState().user;
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
          const id = `${slug}-${Date.now().toString(36)}`;

          const preferredEntry =
            Object.values(files).find((f) => !f.isFolder && /^\/(README|readme)\./.test(f.path)) ||
            Object.values(files).find((f) => !f.isFolder);

          const newProject: ExtendedProject = {
            id,
            name,
            description,
            updatedAt: new Date().toISOString(),
            branch: meta.branch || 'main',
            githubRepo: meta.githubRepo,
            isGitHubConnected: Boolean(meta.githubRepo),
            files,
            userId: currentUser?.id || 'guest-local',
            visibility: 'private',
          };

          set((state) => ({
            projects: [newProject, ...state.projects],
            activeProjectId: id,
            activeFileId: preferredEntry ? preferredEntry.id : null,
            openTabIds: preferredEntry ? [preferredEntry.id] : [],
            gitBranch: newProject.branch as string,
            gitStatus: { staged: [], unstaged: [], committed: false },
            githubRepo: meta.githubRepo ?? state.githubRepo,
          }));

          RuntimeFilesystemBridge.initializeProject(id, files);
          return newProject;
        },

        deleteProject: (id) => {
          if (get().currentUserRole === 'viewer') return;
          set((state) => {
            const remaining = state.projects.filter((p) => p.id !== id);
            const wasActive = state.activeProjectId === id;
            const nextActive = wasActive ? remaining[0]?.id || null : state.activeProjectId;
            const nextProject = remaining.find((p) => p.id === nextActive);
            const firstFile = nextProject
              ? Object.values(nextProject.files).find((f) => !f.isFolder)
              : undefined;

            const { [id]: _tasks, ...projectTasks } = state.projectTasks;
            const { [id]: _chats, ...projectChats } = state.projectChats;
            const { [id]: _assets, ...projectAssets } = state.projectAssets;

            return {
              projects: remaining,
              activeProjectId: nextActive,
              activeFileId: wasActive ? firstFile?.id || null : state.activeFileId,
              openTabIds: wasActive ? (firstFile ? [firstFile.id] : []) : state.openTabIds,
              projectTasks,
              projectChats,
              projectAssets,
            };
          });
        },

        openFile: (fileId) => {
          const project = get().getActiveProject();
          const file = project?.files[fileId];
          if (!file || file.isFolder) return;
          set((state) => ({
            activeFileId: fileId,
            openTabIds: state.openTabIds.includes(fileId)
              ? state.openTabIds
              : [...state.openTabIds, fileId],
          }));
        },

        closeTab: (fileId) => {
          set((state) => {
            const index = state.openTabIds.indexOf(fileId);
            const newTabs = state.openTabIds.filter((id) => id !== fileId);
            if (state.activeFileId !== fileId) return { openTabIds: newTabs };
            const neighbour = newTabs[Math.min(index, newTabs.length - 1)] || null;
            return { openTabIds: newTabs, activeFileId: neighbour };
          });
        },

        updateFileContent: (fileId, content) => {
          if (get().currentUserRole === 'viewer') return;
          const { activeProjectId } = get();
          if (!activeProjectId) return;

          const projects = withActiveProject((files) => {
            const file = files[fileId];
            if (!file || file.isFolder) return files;
            if (file.content === content) return files;
            files[fileId] = { ...file, content, isUnsaved: true };
            return files;
          });
          if (!projects) return;

          set((state) => ({
            projects,
            gitStatus: {
              ...state.gitStatus,
              unstaged: state.gitStatus.unstaged.includes(fileId)
                ? state.gitStatus.unstaged
                : [...state.gitStatus.unstaged, fileId],
              committed: false,
            },
          }));

          scheduleAutosave(activeProjectId, fileId, () => get().saveFile(fileId));
        },

        saveFile: (fileId) => {
          const { activeProjectId } = get();
          if (!activeProjectId) return;

          let saved: ProjectFile | null = null;
          const projects = withActiveProject((files) => {
            const file = files[fileId];
            if (!file || file.isFolder) return files;
            saved = { ...file, isUnsaved: false };
            files[fileId] = saved;
            return files;
          });

          if (!projects || !saved) return;
          set({ projects });
          RuntimeFilesystemBridge.writeFile(activeProjectId, saved);
        },

        saveAllFiles: () => {
          const { activeProjectId } = get();
          const project = get().getActiveProject();
          if (!project || !activeProjectId) return;

          const dirty = Object.values(project.files).filter((f) => !f.isFolder && f.isUnsaved);
          if (dirty.length === 0) return;

          const projects = withActiveProject((files) => {
            for (const file of dirty) {
              files[file.id] = { ...files[file.id], isUnsaved: false };
            }
            return files;
          });
          if (!projects) return;

          set({ projects });
          for (const file of dirty) {
            RuntimeFilesystemBridge.writeFile(activeProjectId, { ...file, isUnsaved: false });
          }
        },

        createFile: (name, parentId = ROOT_ID, isFolder = false) => {
          if (get().currentUserRole === 'viewer') return FAIL('Viewers cannot modify files.');

          const trimmed = name.trim();
          if (!isValidFileName(trimmed)) {
            return FAIL('Invalid name. Names cannot be empty or contain "/".');
          }

          const project = get().getActiveProject();
          if (!project) return FAIL('No active project.');

          const parentKey = parentId ? normalizePath(parentId) : ROOT_ID;
          const parent = project.files[parentKey];
          if (!parent || !parent.isFolder) return FAIL(`Parent folder "${parentKey}" does not exist.`);

          const id = joinPath(parent.path, trimmed);
          if (project.files[id]) return FAIL(`"${trimmed}" already exists in ${parent.path}.`);

          const newFile: ProjectFile = {
            id,
            name: trimmed,
            path: id,
            content: '',
            language: isFolder ? '' : detectLanguage(trimmed),
            isFolder,
            parentId: parent.id,
            children: isFolder ? [] : undefined,
          };

          const projects = withActiveProject((files) => {
            files[id] = newFile;
            attachToParent(files, parent.id, id);
            files[parent.id] = {
              ...files[parent.id],
              children: sortChildren(files, files[parent.id].children || []),
            };
            return files;
          });
          if (!projects) return FAIL('No active project.');

          set((state) => ({
            projects,
            activeFileId: isFolder ? state.activeFileId : id,
            openTabIds:
              isFolder || state.openTabIds.includes(id) ? state.openTabIds : [...state.openTabIds, id],
          }));

          RuntimeFilesystemBridge.createNode(project.id, newFile);
          return OK(id);
        },

        deleteFile: (fileId) => {
          if (get().currentUserRole === 'viewer') return FAIL('Viewers cannot modify files.');

          const project = get().getActiveProject();
          if (!project) return FAIL('No active project.');

          const target = project.files[fileId];
          if (!target) return FAIL(`"${fileId}" does not exist.`);
          if (fileId === ROOT_ID) return FAIL('The project root cannot be deleted.');

          const removed = collectSubtree(project.files, fileId);

          const projects = withActiveProject((files) => {
            detachFromParent(files, fileId);
            for (const id of removed) delete files[id];
            return files;
          });
          if (!projects) return FAIL('No active project.');

          set((state) => {
            const newTabs = state.openTabIds.filter((id) => !removed.includes(id));
            const activeRemoved = state.activeFileId !== null && removed.includes(state.activeFileId);
            return {
              projects,
              openTabIds: newTabs,
              activeFileId: activeRemoved ? newTabs[newTabs.length - 1] || null : state.activeFileId,
              gitStatus: {
                ...state.gitStatus,
                staged: state.gitStatus.staged.filter((p) => !removed.includes(p)),
                unstaged: state.gitStatus.unstaged.filter((p) => !removed.includes(p)),
              },
            };
          });

          RuntimeFilesystemBridge.deleteNode(project.id, target.path);
          return OK(fileId);
        },

        renameFile: (fileId, newName) => {
          if (get().currentUserRole === 'viewer') return FAIL('Viewers cannot modify files.');

          const trimmed = newName.trim();
          if (!isValidFileName(trimmed)) {
            return FAIL('Invalid name. Names cannot be empty or contain "/".');
          }

          const project = get().getActiveProject();
          if (!project) return FAIL('No active project.');

          const target = project.files[fileId];
          if (!target) return FAIL(`"${fileId}" does not exist.`);
          if (fileId === ROOT_ID) return FAIL('The project root cannot be renamed.');
          if (target.name === trimmed) return OK(fileId);

          const newId = joinPath(parentPath(target.path), trimmed);
          if (project.files[newId]) return FAIL(`"${trimmed}" already exists in ${parentPath(target.path)}.`);

          const moved = collectSubtree(project.files, fileId);
          const projects = withActiveProject((files) => {
            const next = relocateSubtree(files, fileId, newId);
            if (!target.isFolder) {
              next[newId] = { ...next[newId], language: detectLanguage(trimmed) };
            }
            const parentId = parentPath(newId);
            next[parentId] = { ...next[parentId], children: sortChildren(next, next[parentId].children || []) };
            return next;
          });
          if (!projects) return FAIL('No active project.');

          const remap = (id: string): string => rewritePathPrefix(id, fileId, newId);

          set((state) => ({
            projects,
            openTabIds: state.openTabIds.map(remap),
            activeFileId: state.activeFileId ? remap(state.activeFileId) : null,
            gitStatus: {
              ...state.gitStatus,
              staged: state.gitStatus.staged.map(remap),
              unstaged: state.gitStatus.unstaged.map(remap),
            },
          }));

          const updated = get().getActiveProject();
          RuntimeFilesystemBridge.renameNode(
            project.id,
            target.path,
            newId,
            moved.map(remap).map((id) => updated?.files[id]).filter(Boolean) as ProjectFile[]
          );
          return OK(newId);
        },

        moveFile: (fileId, newParentId) => {
          if (get().currentUserRole === 'viewer') return FAIL('Viewers cannot modify files.');

          const project = get().getActiveProject();
          if (!project) return FAIL('No active project.');

          const target = project.files[fileId];
          const destination = project.files[normalizePath(newParentId)];
          if (!target) return FAIL(`"${fileId}" does not exist.`);
          if (fileId === ROOT_ID) return FAIL('The project root cannot be moved.');
          if (!destination || !destination.isFolder) return FAIL('Destination must be an existing folder.');
          if (isPathInside(destination.path, target.path)) {
            return FAIL('A folder cannot be moved inside itself.');
          }

          const newId = joinPath(destination.path, target.name);
          if (newId === fileId) return OK(fileId);
          if (project.files[newId]) return FAIL(`"${target.name}" already exists in ${destination.path}.`);

          const moved = collectSubtree(project.files, fileId);
          const projects = withActiveProject((files) => {
            const next = relocateSubtree(files, fileId, newId);
            next[destination.id] = {
              ...next[destination.id],
              children: sortChildren(next, next[destination.id].children || []),
            };
            return next;
          });
          if (!projects) return FAIL('No active project.');

          const remap = (id: string): string => rewritePathPrefix(id, fileId, newId);

          set((state) => ({
            projects,
            openTabIds: state.openTabIds.map(remap),
            activeFileId: state.activeFileId ? remap(state.activeFileId) : null,
            gitStatus: {
              ...state.gitStatus,
              staged: state.gitStatus.staged.map(remap),
              unstaged: state.gitStatus.unstaged.map(remap),
            },
          }));

          const updated = get().getActiveProject();
          RuntimeFilesystemBridge.renameNode(
            project.id,
            target.path,
            newId,
            moved.map(remap).map((id) => updated?.files[id]).filter(Boolean) as ProjectFile[]
          );
          return OK(newId);
        },

        setGithubRepo: (repo) => set({ githubRepo: repo }),
        setGithubConnected: (connected) => set({ githubConnected: connected }),
        setUserRole: (currentUserRole) => set({ currentUserRole }),

        stageFile: (filePath) =>
          set((state) => ({
            gitStatus: {
              ...state.gitStatus,
              unstaged: state.gitStatus.unstaged.filter((p) => p !== filePath),
              staged: Array.from(new Set([...state.gitStatus.staged, filePath])),
            },
          })),

        unstageFile: (filePath) =>
          set((state) => ({
            gitStatus: {
              ...state.gitStatus,
              staged: state.gitStatus.staged.filter((p) => p !== filePath),
              unstaged: Array.from(new Set([...state.gitStatus.unstaged, filePath])),
            },
          })),

        commitChanges: (_message) =>
          set((state) => ({
            gitStatus: { staged: [], unstaged: state.gitStatus.unstaged, committed: true },
          })),

        setTasksForProject: (projectId, tasks) =>
          set((state) => ({ projectTasks: { ...state.projectTasks, [projectId]: tasks } })),

        setChatForProject: (projectId, messages) =>
          set((state) => ({ projectChats: { ...state.projectChats, [projectId]: messages } })),

        setAssetsForProject: (projectId, assets) =>
          set((state) => ({ projectAssets: { ...state.projectAssets, [projectId]: assets } })),
      };
    },
    {
      name: 'codespace-3d-projects',
      version: 2,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? (undefined as unknown as Storage) : createThrottledStorage()
      ),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeFileId: state.activeFileId,
        openTabIds: state.openTabIds,
        gitBranch: state.gitBranch,
        githubRepo: state.githubRepo,
        currentUserRole: state.currentUserRole,
        projectTasks: state.projectTasks,
        projectChats: state.projectChats,
        projectAssets: state.projectAssets,
      }),
      /**
       * v1 keyed files by bare file name, which collided across folders and left
       * stale paths behind after a rename. v2 keys every node by its absolute path.
       */
      migrate: (persisted, version) => {
        if (version >= 2 || !persisted || typeof persisted !== 'object') return persisted;
        const state = persisted as Record<string, unknown>;
        const projects = Array.isArray(state.projects) ? state.projects : [];
        const idMaps: Record<string, Record<string, string>> = {};

        const migratedProjects = projects.map((raw) => {
          const project = raw as ExtendedProject & { rootFileIds?: string[] };
          const oldFiles = (project.files || {}) as Record<string, ProjectFile>;
          const idMap: Record<string, string> = {};

          for (const [oldId, file] of Object.entries(oldFiles)) {
            idMap[oldId] = oldId === 'root' ? ROOT_ID : normalizePath(file.path || `/${file.name}`);
          }
          idMaps[project.id] = idMap;

          const files: Record<string, ProjectFile> = {};
          for (const [oldId, file] of Object.entries(oldFiles)) {
            const newId = idMap[oldId];
            files[newId] = {
              ...file,
              id: newId,
              path: newId,
              name: newId === ROOT_ID ? ROOT_ID : baseName(newId),
              parentId: newId === ROOT_ID ? null : parentPath(newId),
              children: file.isFolder
                ? (file.children || []).map((c) => idMap[c]).filter(Boolean)
                : undefined,
            };
          }

          if (!files[ROOT_ID]) {
            files[ROOT_ID] = {
              id: ROOT_ID,
              name: ROOT_ID,
              path: ROOT_ID,
              content: '',
              language: '',
              isFolder: true,
              parentId: null,
              children: [],
            };
          }

          // Rebuild parent links so orphaned nodes stay reachable.
          for (const file of Object.values(files)) {
            if (file.id === ROOT_ID) continue;
            const parent = files[file.parentId || ROOT_ID] || files[ROOT_ID];
            const children = parent.children || [];
            if (!children.includes(file.id)) parent.children = [...children, file.id];
          }
          for (const file of Object.values(files)) {
            if (file.isFolder) file.children = sortChildren(files, file.children || []);
          }

          const { rootFileIds: _dropped, ...rest } = project;
          return { ...rest, files } as ExtendedProject;
        });

        const activeMap = idMaps[state.activeProjectId as string] || {};
        const mapId = (id: unknown): string | null =>
          typeof id === 'string' ? activeMap[id] || null : null;

        return {
          ...state,
          projects: migratedProjects,
          activeFileId: mapId(state.activeFileId),
          openTabIds: Array.isArray(state.openTabIds)
            ? (state.openTabIds.map(mapId).filter(Boolean) as string[])
            : [],
        };
      },
      onRehydrateStorage: () => (state) => {
        // Push the restored workspace into the runtime FS once the app is live.
        if (!state) return;
        const project = state.projects.find((p) => p.id === state.activeProjectId);
        if (project) RuntimeFilesystemBridge.initializeProject(project.id, project.files);
      },
    }
  )
);
