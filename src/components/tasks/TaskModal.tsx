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

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function TaskModal({ mode, task, onClose }: TaskModalProps) {
  const { createTask, updateTask, selectedDate } = useTaskStore();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date ?? format(selectedDate, 'yyyy-MM-dd'));
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [closeHovered, setCloseHovered] = useState(false);
  const [addTagHovered, setAddTagHovered] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
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

  const inputStyle = (field: string, hasError = false): React.CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: '#f4f4f7',
    backgroundColor: '#111116',
    border: `1px solid ${hasError ? '#ef4444' : focusedField === field ? '#7c6fcd' : '#232332'}`,
    borderRadius: '8px',
    outline: 'none',
    boxShadow: focusedField === field && !hasError ? '0 0 0 2px rgba(124,58,237,0.12)' : 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#63637e',
    marginBottom: '6px',
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
      }}
      className="animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#181822',
          border: '1px solid #232332',
          borderRadius: '16px',
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #1e1e2e',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f7', margin: 0 }}>
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </h2>
          <button
            id="close-task-modal"
            onClick={onClose}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: closeHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: closeHovered ? '#c4c4d8' : '#63637e',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Review radiology report"
              style={inputStyle('title', !!error)}
            />
            {error && <p style={{ marginTop: '4px', fontSize: '11px', color: '#ef4444' }}>{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              id="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Add details about this task..."
              rows={3}
              style={{ ...inputStyle('desc'), resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Status + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                id="task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                onFocus={() => setFocusedField('status')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('status')}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value} style={{ background: '#111116' }}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                onFocus={() => setFocusedField('priority')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('priority')}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} style={{ background: '#111116' }}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={labelStyle}>Due Date</label>
            <input
              id="task-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onFocus={() => setFocusedField('date')}
              onBlur={() => setFocusedField(null)}
              style={{ ...inputStyle('date'), colorScheme: 'dark' } as React.CSSProperties}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                id="task-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                onFocus={() => setFocusedField('tag')}
                onBlur={() => setFocusedField(null)}
                placeholder="Type tag and press Enter"
                style={{ ...inputStyle('tag'), flex: 1 }}
              />
              <button
                type="button"
                onClick={addTag}
                onMouseEnter={() => setAddTagHovered(true)}
                onMouseLeave={() => setAddTagHovered(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '38px', height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #232332',
                  backgroundColor: addTagHovered ? '#232332' : '#181822',
                  color: addTagHovered ? '#c4c4d8' : '#63637e',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    title="Click to remove"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: '#111116',
                      color: '#8888a8',
                      border: '1px solid #232332',
                      cursor: 'pointer',
                    }}
                  >
                    <Tag style={{ width: '10px', height: '10px', color: '#5a5a7a' }} />
                    {tag}
                    <X style={{ width: '10px', height: '10px', opacity: 0.5 }} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: '1px solid #232332',
                backgroundColor: '#111116',
                color: '#a0a0b2',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>
            <button
              id="submit-task-btn"
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 4px 14px -4px rgba(124,58,237,0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              {isSubmitting ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : null}
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
