'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { useTaskStore } from '@/stores/taskStore';

export default function DateSelector() {
  const { selectedDate, setSelectedDate } = useTaskStore();
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const goToPrev = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNext = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());
  const todayActive = isToday(selectedDate);

  const arrowBtnStyle = (id: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: hovered === id ? 'rgba(255,255,255,0.06)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: hovered === id ? '#e4e4f0' : '#8888a8',
    transition: 'all 0.15s ease',
    padding: 0,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

      {/* Nav arrows + Today group */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        padding: '4px',
      }}>
        <button
          id="date-prev-btn"
          onClick={goToPrev}
          aria-label="Previous day"
          style={arrowBtnStyle('prev')}
          onMouseEnter={() => setHovered('prev')}
          onMouseLeave={() => setHovered(null)}
        >
          <ChevronLeft style={{ width: '15px', height: '15px' }} />
        </button>

        <button
          id="goto-today-btn"
          onClick={goToToday}
          disabled={todayActive}
          style={{
            padding: '3px 10px',
            borderRadius: '5px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: todayActive ? 'default' : 'pointer',
            color: todayActive ? '#3d3d55' : hovered === 'today' ? '#e4e4f0' : '#a0a0b8',
            background: hovered === 'today' && !todayActive ? 'rgba(255,255,255,0.06)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={() => setHovered('today')}
          onMouseLeave={() => setHovered(null)}
        >
          Today
        </button>

        <button
          id="date-next-btn"
          onClick={goToNext}
          aria-label="Next day"
          style={arrowBtnStyle('next')}
          onMouseEnter={() => setHovered('next')}
          onMouseLeave={() => setHovered(null)}
        >
          <ChevronRight style={{ width: '15px', height: '15px' }} />
        </button>
      </div>

      {/* Date display trigger */}
      <div style={{ position: 'relative' }}>
        <button
          id="date-display-btn"
          onClick={() => setShowPicker(!showPicker)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: hovered === 'date' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
            color: '#c4c4d8',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            minWidth: '140px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={() => setHovered('date')}
          onMouseLeave={() => setHovered(null)}
        >
          <Calendar style={{ width: '13px', height: '13px', color: '#7c6fcd' }} />
          <span>{format(selectedDate, 'MMM d, yyyy')}</span>
        </button>

        {/* Date picker dropdown */}
        {showPicker && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowPicker(false)} />
            <div
              className="animate-fade-in-up"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 50,
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#181822',
                border: '1px solid #232332',
                boxShadow: '0 16px 40px -8px rgba(0,0,0,0.7)',
                minWidth: '220px',
              }}
            >
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                  }
                  setShowPicker(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #232332',
                  backgroundColor: '#111116',
                  color: '#f4f4f7',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  colorScheme: 'dark',
                } as React.CSSProperties}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
