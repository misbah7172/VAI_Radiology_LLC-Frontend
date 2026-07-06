'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Tag, AlertCircle, Clock } from 'lucide-react';
import type { Task } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import TaskModal from './TaskModal';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  medium: { label: 'Medium', color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
  high: { label: 'High', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export default function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const { deleteTask } = useTaskStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const priorityConf = PRIORITY_CONFIG[task.priority];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isSortableDragging ? 0.4 : 1,
        }}
        className={`group relative p-4 task-card ${isDragging ? 'shadow-2xl rotate-1 scale-105' : ''}`}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity duration-200"
          style={{ color: 'var(--text-muted)' }}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="pl-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-sm font-medium leading-snug flex-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {task.title}
            </h3>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                id={`edit-task-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Edit task"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                id={`delete-task-${task.id}`}
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p
              className="text-xs mb-3 line-clamp-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    color: 'var(--accent-light)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: priority + due date */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: priorityConf.bg,
                color: priorityConf.color,
              }}
            >
              <AlertCircle className="w-3 h-3" />
              {priorityConf.label}
            </span>
            <span
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <Clock className="w-3 h-3" />
              {format(parseISO(task.due_date), 'MMM d')}
            </span>
          </div>
        </div>
      </div>

      {showEditModal && (
        <TaskModal
          mode="edit"
          task={task}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
