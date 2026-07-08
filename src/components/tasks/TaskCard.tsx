'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Tag, Clock } from 'lucide-react';
import type { Task } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import TaskModal from './TaskModal';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#6ee7b7' },
  medium: { label: 'Medium', color: '#fcd34d' },
  high:   { label: 'High',   color: '#f87171' },
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export default function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const { deleteTask } = useTaskStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editHovered, setEditHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transition,
          opacity: isSortableDragging ? 0.4 : 1,
          position: 'relative',
          padding: '12px 12px 12px 24px',
          backgroundColor: '#181822',
          border: `1px solid ${isHovered || isDragging ? '#2e2e42' : '#232332'}`,
          borderRadius: '10px',
          boxShadow: isHovered || isDragging
            ? '0 8px 24px -8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset'
            : '0 2px 8px -2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03) inset',
          transform: isDragging
            ? `${CSS.Transform.toString(transform)} scale(1.02) rotate(1deg)`
            : CSS.Transform.toString(transform) || undefined,
          cursor: 'default',
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            left: '4px',
            top: 0,
            bottom: 0,
            width: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            cursor: 'grab',
            color: '#4a4a6a',
            transition: 'opacity 0.15s ease',
          }}
        >
          <GripVertical style={{ width: '12px', height: '12px' }} />
        </div>

        {/* Title row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: '#e8e8f0',
            margin: 0,
            lineHeight: 1.4,
            flex: 1,
            wordBreak: 'break-word',
          }}>
            {task.title}
          </h3>

          {/* Action buttons — show on hover */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
            flexShrink: 0,
          }}>
            <button
              id={`edit-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
              onMouseEnter={() => setEditHovered(true)}
              onMouseLeave={() => setEditHovered(false)}
              title="Edit task"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: editHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: editHovered ? '#c4c4d8' : '#63637e',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Pencil style={{ width: '11px', height: '11px' }} />
            </button>
            <button
              id={`delete-task-${task.id}`}
              onClick={handleDelete}
              disabled={isDeleting}
              onMouseEnter={() => setDeleteHovered(true)}
              onMouseLeave={() => setDeleteHovered(false)}
              title="Delete task"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: deleteHovered ? 'rgba(239,68,68,0.1)' : 'transparent',
                color: deleteHovered ? '#f87171' : '#63637e',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 style={{ width: '11px', height: '11px' }} />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p style={{
            fontSize: '12px',
            color: '#5a5a7a',
            lineHeight: 1.5,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {task.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '5px',
                  fontSize: '10px',
                  fontWeight: 500,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: '#5a5a7a',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <Tag style={{ width: '9px', height: '9px', color: '#4a4a6a' }} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
        }}>
          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: priorityConf.color,
              display: 'inline-block',
              boxShadow: `0 0 4px ${priorityConf.color}60`,
            }} />
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#5a5a7a',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {priorityConf.label}
            </span>
          </div>

          {/* Due date */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: '#4a4a6a',
          }}>
            <Clock style={{ width: '11px', height: '11px' }} />
            {format(parseISO(task.due_date), 'MMM d')}
          </span>
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
