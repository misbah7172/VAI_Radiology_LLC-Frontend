'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import DateSelector from './DateSelector';
import Board from './Board';
import TaskModal from './TaskModal';

export default function TasksPageClient() {
  const { fetchTasks, selectedDate } = useTaskStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Task Board
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage your tasks for the day
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateSelector />
          <button
            id="add-task-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <Board />
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          mode="create"
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
