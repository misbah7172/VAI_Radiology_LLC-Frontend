'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Search, X, Calendar } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { tasksApi } from '@/lib/tasks';
import type { Task } from '@/types';
import { parseISO } from 'date-fns';
import DateSelector from './DateSelector';
import Board from './Board';
import TaskModal from './TaskModal';
import SearchResultsGrid from './SearchResultsGrid';
import CalendarModal from './CalendarModal';

export default function TasksPageClient() {
  const { fetchTasks, setSelectedDate } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Auto-clear highlight after 3s
  useEffect(() => {
    if (highlightedTaskId === null) return;
    const t = setTimeout(() => setHighlightedTaskId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightedTaskId]);

  // Debounced search
  const runSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }
    setIsSearchMode(true);
    setIsSearching(true);
    try {
      const res = await tasksApi.searchByTag(q);
      setSearchResults(res.results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 350);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
    setHighlightedTaskId(null);
    inputRef.current?.focus();
  };

  // Navigate to the task's date, close search, and highlight
  const handleNavigate = (task: Task) => {
    const date = parseISO(String(task.due_date));
    setSelectedDate(date);     // updates store + re-fetches tasks for that date
    setHighlightedTaskId(task.id);
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

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
          <p style={{ fontSize: '14px', color: '#63637e', marginTop: '5px' }}>
            Manage your daily workspace tasks
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Tag Search Bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: searchFocused ? '#a78bfa' : '#5a5a7a',
              transition: 'color 0.15s ease',
            }}>
              <Search style={{ width: '14px', height: '14px' }} />
            </div>
            <input
              ref={inputRef}
              id="tag-search-input"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search by tag…"
              style={{
                padding: '8px 34px 8px 34px',
                borderRadius: '8px',
                border: `1px solid ${searchFocused || isSearchMode ? 'rgba(124,58,237,0.5)' : '#232332'}`,
                backgroundColor: searchFocused || isSearchMode ? 'rgba(124,58,237,0.06)' : '#181822',
                color: '#f4f4f7',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                width: '200px',
                boxShadow: searchFocused || isSearchMode ? '0 0 0 2px rgba(124,58,237,0.12)' : 'none',
                transition: 'all 0.18s ease',
              }}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5a5a7a',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <X style={{ width: '13px', height: '13px' }} />
              </button>
            )}
          </div>

          {/* Calendar Toggle Button */}
          <button
            id="toggle-calendar-btn"
            onClick={() => setShowCalendar(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #232332',
              backgroundColor: '#181822',
              color: '#8888a8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Open Task Calendar"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.45)';
              e.currentTarget.style.color = '#a78bfa';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(124,58,237,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#232332';
              e.currentTarget.style.color = '#8888a8';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Calendar style={{ width: '15px', height: '15px' }} />
          </button>

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

      {/* Board or Search Results */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isSearchMode ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SearchResultsGrid
              results={searchResults}
              query={searchQuery}
              isLoading={isSearching}
              onNavigate={handleNavigate}
            />
          </div>
        ) : (
          <Board highlightedTaskId={highlightedTaskId} />
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <TaskModal
          mode="create"
          onClose={() => setShowModal(false)}
        />
      )}

      {showCalendar && (
        <CalendarModal
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}
