'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Tag, Clock } from 'lucide-react';
import type { Task } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import TaskModal from './TaskModal';
import toast from 'react-hot-toast';
import { parseISO, formatDistanceToNow, isPast } from 'date-fns';

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#6ee7b7' },
  medium: { label: 'Medium', color: '#fcd34d' },
  high:   { label: 'High',   color: '#f87171' },
};

// ── Kaggle-style Progress Timeline ──────────────────────────────────────────

interface ProgressTimelineProps {
  startDate: string;   // ISO datetime — "Start" anchor
  dueDate: string;     // ISO datetime — "Close" anchor
}

function ProgressTimeline({ startDate, dueDate }: ProgressTimelineProps) {
  const start = parseISO(startDate);
  const end   = parseISO(dueDate);
  const now   = new Date();

  const total   = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct     = total <= 0 ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100));

  const isEnded   = isPast(end);
  const isStarted = isPast(start);

  const startLabel = isStarted
    ? formatDistanceToNow(start, { addSuffix: true })   // "10 days ago"
    : `in ${formatDistanceToNow(start)}`;

  const endLabel = isEnded
    ? formatDistanceToNow(end, { addSuffix: true })     // "3 days ago"
    : `${formatDistanceToNow(end)} to go`;              // "3 months to go"

  // Color: green if done, amber if >70%, purple otherwise
  const trackColor = isEnded
    ? '#10b981'
    : pct > 70 ? '#f59e0b' : '#7c3aed';

  return (
    <div style={{ marginTop: '10px', marginBottom: '4px' }}>
      {/* Labels row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '5px',
        gap: '8px',
      }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#d4d4e8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Start
          </div>
          <div style={{ fontSize: '10px', color: '#5a5a7a', marginTop: '1px', whiteSpace: 'nowrap' }}>
            {startLabel}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: isEnded ? '#10b981' : '#d4d4e8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {isEnded ? 'Closed' : 'Close'}
          </div>
          <div style={{ fontSize: '10px', color: isEnded ? '#10b98188' : '#5a5a7a', marginTop: '1px', whiteSpace: 'nowrap' }}>
            {endLabel}
          </div>
        </div>
      </div>

      {/* Track */}
      <div style={{
        position: 'relative',
        height: '4px',
        borderRadius: '99px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'visible',
      }}>
        {/* Filled portion */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pct}%`,
          borderRadius: '99px',
          background: `linear-gradient(90deg, rgba(124,58,237,0.4) 0%, ${trackColor} 100%)`,
          transition: 'width 0.4s ease',
        }} />

        {/* Start dot (white) */}
        <div style={{
          position: 'absolute',
          left: '-1px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: '1.5px solid rgba(255,255,255,0.3)',
          zIndex: 2,
        }} />

        {/* Current position dot (accent-colored) — skip if before start or after end */}
        {pct > 2 && pct < 98 && (
          <div style={{
            position: 'absolute',
            left: `calc(${pct}% - 5px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: trackColor,
            border: '2px solid #111116',
            boxShadow: `0 0 6px ${trackColor}80`,
            zIndex: 3,
          }} />
        )}

        {/* Close dot */}
        <div style={{
          position: 'absolute',
          right: '-1px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isEnded ? '#10b981' : '#48dbfb',
          border: '1.5px solid rgba(255,255,255,0.15)',
          zIndex: 2,
        }} />
      </div>
    </div>
  );
}

// ── TaskCard ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isHighlighted?: boolean;
}

export default function TaskCard({ task, isDragging = false, isHighlighted = false }: TaskCardProps) {
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
          backgroundColor: isHighlighted ? '#1c1630' : '#181822',
          border: isHighlighted
            ? '1px solid rgba(124,58,237,0.7)'
            : `1px solid ${isHovered || isDragging ? '#2e2e42' : '#232332'}`,
          borderRadius: '10px',
          boxShadow: isHighlighted
            ? '0 0 0 3px rgba(124,58,237,0.18), 0 8px 24px -8px rgba(124,58,237,0.35)'
            : isHovered || isDragging
            ? '0 8px 24px -8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset'
            : '0 2px 8px -2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03) inset',
          transform: isDragging
            ? `${CSS.Transform.toString(transform)} scale(1.02) rotate(1deg)`
            : CSS.Transform.toString(transform) || undefined,
          cursor: 'default',
          animation: isHighlighted ? 'pulse-border 1.8s ease 2' : 'none',
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

        {/* ── Kaggle-style Progress Timeline ── */}
        <ProgressTimeline startDate={task.start_date} dueDate={task.due_date} />

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          flexWrap: 'wrap',
          gap: '4px',
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

          {/* Timestamps */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#4a4a6a' }}>
              <Clock style={{ width: '9px', height: '9px' }} />
              Created {formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}
            </span>
            {task.updated_at !== task.created_at && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#3d3d55' }}>
                <Clock style={{ width: '9px', height: '9px' }} />
                Edited {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true })}
              </span>
            )}
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
