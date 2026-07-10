'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  addMonths, subMonths, setMonth, setYear, parseISO
} from 'date-fns';
import { tasksApi } from '@/lib/tasks';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';

interface CalendarModalProps {
  onClose: () => void;
}

export default function CalendarModal({ onClose }: CalendarModalProps) {
  const { setSelectedDate } = useTaskStore();
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Years range: -10 to +10 from current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch tasks for the visible month
  useEffect(() => {
    let active = true;
    const fetchMonthTasks = async () => {
      setLoading(true);
      try {
        const monthStr = format(currentMonthDate, 'yyyy-MM');
        const res = await tasksApi.listByMonth(monthStr);
        if (active) {
          setTasks(res.results);
        }
      } catch (err) {
        console.error('Failed to load month tasks:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMonthTasks();
    return () => {
      active = false;
    };
  }, [currentMonthDate]);

  // Map dates to task counts
  const taskCountMap = tasks.reduce((acc: Record<string, number>, t) => {
    try {
      const dateStr = format(parseISO(String(t.due_date)), 'yyyy-MM-dd');
      acc[dateStr] = (acc[dateStr] || 0) + 1;
    } catch (e) {
      // fallback if date parsing fails
    }
    return acc;
  }, {});

  // Generate calendar grid days
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handlePrevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));
  const handleNextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));

  const handleMonthSelect = (mIndex: number) => {
    setCurrentMonthDate(setMonth(currentMonthDate, mIndex));
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonthDate(setYear(currentMonthDate, year));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal Card */}
      <div style={{
        position: 'relative',
        zIndex: 101,
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#181822',
        border: '1px solid #232332',
        borderRadius: '16px',
        boxShadow: '0 24px 64px -12px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
        animation: 'fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #1a1a26',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f7', margin: 0 }}>
              Task Calendar
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#63637e',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#c4c4d8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#63637e';
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Date Selectors & Month Pagination */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          gap: '12px',
          backgroundColor: '#111116',
          borderBottom: '1px solid #1a1a26',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Month Dropdown */}
            <select
              value={currentMonthDate.getMonth()}
              onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #232332',
                backgroundColor: '#181822',
                color: '#f4f4f7',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={currentMonthDate.getFullYear()}
              onChange={(e) => handleYearSelect(parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #232332',
                backgroundColor: '#181822',
                color: '#f4f4f7',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Left/Right Month Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handlePrevMonth}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #232332',
                backgroundColor: '#181822',
                color: '#8888a8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3d3d55';
                e.currentTarget.style.color = '#f4f4f7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#232332';
                e.currentTarget.style.color = '#8888a8';
              }}
            >
              <ChevronLeft style={{ width: '15px', height: '15px' }} />
            </button>
            <button
              onClick={handleNextMonth}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #232332',
                backgroundColor: '#181822',
                color: '#8888a8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3d3d55';
                e.currentTarget.style.color = '#f4f4f7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#232332';
                e.currentTarget.style.color = '#8888a8';
              }}
            >
              <ChevronRight style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Days of the week header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            textAlign: 'center',
            marginBottom: '10px',
          }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#4a4a6a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {d}
              </span>
            ))}
          </div>

          {/* Grid Container */}
          <div style={{ position: 'relative', minHeight: '220px' }}>
            {loading ? (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(24,24,34,0.4)',
                borderRadius: '8px',
                zIndex: 2,
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #7c3aed',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            ) : null}

            {/* Grid days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
            }}>
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = taskCountMap[dateStr] || 0;
                const isCurrent = isSameMonth(day, currentMonthDate);
                const isTodayDate = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      borderRadius: '8px',
                      border: count > 0 ? '1px solid rgba(124,58,237,0.45)' : '1px solid transparent',
                      backgroundColor: count > 0
                        ? 'rgba(124,58,237,0.1)'
                        : isTodayDate
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                      color: !isCurrent
                        ? '#3d3d55'
                        : count > 0
                        ? '#a78bfa'
                        : '#f4f4f7',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: count > 0 ? '0 2px 10px -4px rgba(124,58,237,0.3)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = count > 0 ? 'rgba(124,58,237,0.16)' : 'rgba(255,255,255,0.06)';
                      if (count > 0) {
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = count > 0
                        ? 'rgba(124,58,237,0.1)'
                        : isTodayDate
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent';
                      e.currentTarget.style.borderColor = count > 0 ? 'rgba(124,58,237,0.45)' : 'transparent';
                    }}
                  >
                    {/* Day number */}
                    <span style={{
                      fontSize: '13px',
                      fontWeight: count > 0 || isTodayDate ? 700 : 400,
                    }}>
                      {format(day, 'd')}
                    </span>

                    {/* Today indicator */}
                    {isTodayDate && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        backgroundColor: '#a78bfa',
                      }} />
                    )}

                    {/* Task count badge */}
                    {count > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '15px',
                        height: '15px',
                        padding: '0 3px',
                        borderRadius: '50%',
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 700,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                        border: '1.5px solid #181822',
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
