'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useTaskStore } from '@/stores/taskStore';
import type { Task, TaskStatus } from '@/types';
import Column from './Column';
import TaskCard from './TaskCard';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export default function Board() {
  const { tasks, isLoading, reorderTasks, getTasksByStatus } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeStatus, setActiveStatus] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === Number(event.active.id));
    if (task) {
      setActiveTask(task);
      setActiveStatus(task.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;
    const overIdStr = String(over.id);
    if (COLUMNS.some((c) => c.id === overIdStr)) {
      setActiveStatus(overIdStr as TaskStatus);
    } else {
      const overTask = tasks.find((t) => t.id === Number(overIdStr));
      if (overTask) setActiveStatus(overTask.status);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !activeStatus) return;
    const activeId = Number(active.id);
    const overId = over ? Number(over.id) : null;
    await reorderTasks(activeId, overId, activeStatus);
    setActiveStatus(null);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: '16px', height: '100%', padding: '20px 32px' }}>
        {COLUMNS.map((col) => (
          <div key={col.id} style={{ flex: 1 }}>
            <div style={{
              height: '20px', width: '120px', marginBottom: '16px',
              backgroundColor: '#181822', borderRadius: '6px',
            }} />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: '96px', marginBottom: '10px',
                backgroundColor: '#181822', borderRadius: '10px',
              }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        display: 'flex',
        gap: '14px',
        height: '100%',
        padding: '20px 32px',
        overflowX: 'auto',
        userSelect: 'none',
      }}>
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={getTasksByStatus(col.id)}
            isOver={activeStatus === col.id && activeTask !== null}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{ transform: 'rotate(2deg)', opacity: 0.95 }}>
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
