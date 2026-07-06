'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Tag } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { format } from 'date-fns';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import toast from 'react-hot-toast';

interface TaskModalProps {
  mode: 'create' | 'edit';
  task?: Task;
  onClose: () => void;
}

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#6ee7b7' },
  { value: 'medium', label: 'Medium', color: '#fcd34d' },
  { value: 'high', label: 'High', color: '#f87171' },
];

export default function TaskModal({ mode, task, onClose }: TaskModalProps) {
  const { createTask, updateTask, selectedDate } = useTaskStore();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(
    task?.due_date ?? format(selectedDate, 'yyyy-MM-dd')
  );
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'create') {
        await createTask({ title: title.trim(), description, status, priority, due_date: dueDate, tags });
        toast.success('Task created!');
      } else if (task) {
        await updateTask(task.id, { title: title.trim(), description, status, priority, due_date: dueDate, tags });
        toast.success('Task updated!');
      }
      onClose();
    } catch {
      toast.error('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full max-w-lg animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'create' ? '✨ New Task' : '✏️ Edit Task'}
          </h2>
          <button
            id="close-task-modal"
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Title *
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {error && <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <textarea
              id="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Status
              </label>
              <select
                id="task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Due Date
            </label>
            <input
              id="task-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="task-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag…"
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-xl text-sm transition-colors"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer"
                    style={{
                      background: 'rgba(124,58,237,0.15)',
                      color: 'var(--accent-light)',
                      border: '1px solid rgba(124,58,237,0.3)',
                    }}
                    onClick={() => removeTag(tag)}
                    title="Click to remove"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <X className="w-3 h-3 opacity-60" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              id="submit-task-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                color: 'white',
              }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
