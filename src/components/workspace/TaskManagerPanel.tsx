import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { WorkspaceTask } from '../../types/stitch';

const INITIAL_TASKS: WorkspaceTask[] = [
  { id: '1', title: 'Implement 3D Node Mesh Orbiting', description: 'Refactor R3F rotation frame loops for high FPS', status: 'in_progress', priority: 'high', assignedTo: 'Jules' },
  { id: '2', title: 'WebContainer COOP/COEP Headers', description: 'Enable SharedArrayBuffer cross-origin isolation', status: 'completed', priority: 'high', assignedTo: 'DevOps' },
  { id: '3', title: 'Monaco Editor Theme Customization', description: 'Add JetBrains Mono and dark glassmorphic palette', status: 'completed', priority: 'medium', assignedTo: 'UX' },
  { id: '4', title: 'Optimize R3F Canvas Shadows', description: 'Provide quality degradation toggle for mobile GPUs', status: 'todo', priority: 'low', assignedTo: '3D Team' },
];

export const TaskManagerPanel: React.FC = () => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<WorkspaceTask['priority']>('medium');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: WorkspaceTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      status: 'todo',
      priority: newTaskPriority,
      assignedTo: 'Me',
    };

    setTasks([task, ...tasks]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowAddModal(false);
  };

  const handleToggleStatus = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const nextStatus: WorkspaceTask['status'] =
          t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'todo';
        return { ...t, status: nextStatus };
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const getPriorityBadge = (priority: WorkspaceTask['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 font-medium border border-red-500/30">High</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">Med</span>;
      case 'low':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/20 text-slate-300 font-medium border border-slate-500/30">Low</span>;
    }
  };

  const getStatusBadge = (status: WorkspaceTask['status']) => {
    switch (status) {
      case 'todo':
        return <span className="text-outline flex items-center gap-1"><AlertCircle className="w-3 h-3" /> To Do</span>;
      case 'in_progress':
        return <span className="text-tertiary flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'completed':
        return <span className="text-emerald-400 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Done</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-400" /> TASK BOARD
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-1 hover:bg-surface-high rounded text-outline hover:text-white transition-colors"
          title="Create Task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2 group cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => handleToggleStatus(task.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-medium text-xs text-slate-100 ${task.status === 'completed' ? 'line-through text-outline' : ''}`}>
                {task.title}
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                className="p-1 hover:text-red-400 text-outline rounded opacity-0 group-hover:opacity-100 transition-all"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {task.description && (
              <p className="text-[11px] text-outline line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10 text-[10px]">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Create Workspace Task
            </h3>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-[11px] text-outline mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add 3D lighting preset"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-outline mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task details..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-outline mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as WorkspaceTask['priority'])}
                  className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-outline hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-container hover:bg-primary-container/80 text-white rounded font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
