'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';
import { ClipboardList } from 'lucide-react';

interface ColumnProps {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  isOver: boolean;
}

export default function Column({ id, label, color, tasks, isOver }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col flex-1 min-w-[280px] max-w-[360px] rounded-2xl transition-all duration-300"
      style={{
        background: isOver ? 'rgba(124,58,237,0.05)' : 'var(--bg-secondary)',
        border: isOver ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
        minHeight: '400px',
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
          />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {label}
          </h2>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: `${color}18`,
            color: color,
            border: `1px solid ${color}33`,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '12px' }} />

      {/* Task list */}
      <div className="flex-1 px-3 pb-4 overflow-y-auto space-y-2.5">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-xl"
            style={{
              border: '1px dashed var(--border)',
              background: 'transparent',
            }}
          >
            <ClipboardList className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No tasks here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
