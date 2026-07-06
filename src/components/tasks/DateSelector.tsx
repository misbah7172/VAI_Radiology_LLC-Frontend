'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { useTaskStore } from '@/stores/taskStore';

export default function DateSelector() {
  const { selectedDate, setSelectedDate } = useTaskStore();
  const [showPicker, setShowPicker] = useState(false);

  const goToPrev = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNext = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <div className="flex items-center gap-2">
      {/* Prev */}
      <button
        id="date-prev-btn"
        onClick={goToPrev}
        aria-label="Previous day"
        className="p-2 rounded-xl transition-all duration-200"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Date display */}
      <div className="relative">
        <button
          id="date-display-btn"
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            minWidth: '180px',
          }}
        >
          <Calendar className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
          <span>
            {isToday(selectedDate) ? 'Today — ' : ''}
            {format(selectedDate, 'MMM d, yyyy')}
          </span>
        </button>

        {/* Date picker dropdown */}
        {showPicker && (
          <div
            className="absolute top-full mt-2 right-0 z-50 p-4 rounded-2xl shadow-2xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              minWidth: '260px',
            }}
          >
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, day));
                setShowPicker(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                colorScheme: 'dark',
              }}
            />
          </div>
        )}
      </div>

      {/* Next */}
      <button
        id="date-next-btn"
        onClick={goToNext}
        aria-label="Next day"
        className="p-2 rounded-xl transition-all duration-200"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Today shortcut */}
      {!isToday(selectedDate) && (
        <button
          id="goto-today-btn"
          onClick={goToToday}
          className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: 'var(--accent-light)',
          }}
        >
          Today
        </button>
      )}
    </div>
  );
}
