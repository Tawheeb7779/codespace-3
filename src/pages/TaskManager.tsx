import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore, TaskItem } from '../stores/useAppStore';

export const TaskManager: React.FC = () => {
  const { tasks, addTask, updateTaskStatus, deleteTask } = useAppStore();
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      status: 'todo',
      priority: 'medium',
      assignee: 'Tawheeb',
      category: 'Workspace'
    };

    addTask(newTask);
    setNewTitle('');
  };

  const columns: { id: TaskItem['status']; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-slate-500/30 text-slate-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/30 text-blue-400' },
    { id: 'review', title: 'In Review', color: 'border-amber-500/30 text-amber-400' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500/30 text-emerald-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>Workspace Task Manager</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Kanban board tracking spatial development sprint tasks
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex items-center space-x-2 font-mono text-xs">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add new task..."
            className="bg-[#171c26] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 w-48 sm:w-64"
          />
          <button
            type="submit"
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3 flex flex-col h-[500px]">
              <div className={`flex items-center justify-between border-b pb-2 font-mono text-xs font-bold ${col.color}`}>
                <span>{col.title}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">{colTasks.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-[#0e131d]/90 border border-white/10 rounded-lg space-y-2 font-sans text-xs hover:border-blue-500/30 transition-all">
                    <div className="font-semibold text-slate-100">{task.title}</div>
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="bg-white/5 px-2 py-0.5 rounded">{task.category}</span>
                      <span className="text-blue-400">{task.assignee}</span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[10px]">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskItem['status'])}
                        className="bg-[#171c26] text-slate-300 border border-white/10 rounded px-1.5 py-0.5 focus:outline-none"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
