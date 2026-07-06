'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import DateSelector from './DateSelector';
import Board from './Board';
import TaskModal from './TaskModal';

export default function TasksPageClient() {
  const { fetchTasks } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px',
        borderBottom: '1px solid #1a1a26',
        flexShrink: 0,
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#f4f4f7',
            margin: 0,
            lineHeight: 1.1,
          }}>
            Task Board
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#63637e',
            marginTop: '5px',
          }}>
            Manage your daily workspace tasks
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <DateSelector />
          <button
            id="add-task-btn"
            onClick={() => setShowModal(true)}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
              color: '#ffffff',
              background: btnHovered
                ? 'linear-gradient(135deg, #6d28d9, #4c1d95)'
                : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: btnHovered
                ? '0 6px 20px -4px rgba(124,58,237,0.55)'
                : '0 4px 14px -4px rgba(124,58,237,0.4)',
              cursor: 'pointer',
              transform: btnHovered ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'all 0.18s ease',
            }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
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
