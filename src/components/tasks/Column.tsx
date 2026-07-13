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
  highlightedTaskId?: number | null;
}

export default function Column({ id, label, color, tasks, isOver, highlightedTaskId }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="task-board-column-card"
      style={{
        backgroundColor: isOver ? '#16162a' : '#111116',
        border: `1px solid ${isOver ? '#7c3aed40' : '#1a1a26'}`,
        boxShadow: isOver
          ? '0 0 0 1px rgba(124,58,237,0.2), 0 4px 20px -4px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px -4px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Column header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid #1a1a26',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}60`,
          }} />
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: '#f4f4f7',
            margin: 0,
          }}>
            {label}
          </h2>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          color: '#63637e',
          border: '1px solid rgba(255,255,255,0.03)',
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div style={{
        flex: 1,
        padding: '10px 10px 14px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isHighlighted={task.id === highlightedTaskId}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 16px',
            borderRadius: '10px',
            border: '1px dashed rgba(255,255,255,0.05)',
            backgroundColor: 'rgba(255,255,255,0.01)',
            marginTop: '4px',
          }}>
            <ClipboardList style={{ width: '20px', height: '20px', color: '#3d3d55', marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#4a4a6a', textAlign: 'center', margin: 0 }}>
              No tasks yet
            </p>
            <p style={{ fontSize: '11px', color: '#3d3d55', textAlign: 'center', marginTop: '3px' }}>
              Add a task to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
