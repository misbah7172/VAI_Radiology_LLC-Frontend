'use client';

import { useState } from 'react';
import { Tag, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Task } from '@/types';

const PRIORITY_CONFIG = {
  low:    { label: 'LOW',    color: '#6ee7b7' },
  medium: { label: 'MED',   color: '#fcd34d' },
  high:   { label: 'HIGH',  color: '#f87171' },
};

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       bg: 'rgba(99,99,126,0.15)',  color: '#8888a8' },
  in_progress: { label: 'In Progress', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  done:        { label: 'Done',        bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
};

interface SearchResultCardProps {
  task: Task;
  query: string;
  onNavigate: (task: Task) => void;
}

function highlightTag(tag: string, query: string) {
  const lower = tag.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <span>{tag}</span>;
  return (
    <span>
      {tag.slice(0, idx)}
      <mark style={{ backgroundColor: '#7c3aed33', color: '#a78bfa', borderRadius: '2px', padding: '0 1px' }}>
        {tag.slice(idx, idx + q.length)}
      </mark>
      {tag.slice(idx + q.length)}
    </span>
  );
}

function SearchResultCard({ task, query, onNavigate }: SearchResultCardProps) {
  const [hovered, setHovered] = useState(false);
  const pr = PRIORITY_CONFIG[task.priority];
  const st = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];

  return (
    <div
      onClick={() => onNavigate(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#181822',
        border: `1px solid ${hovered ? '#7c3aed66' : '#232332'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hovered ? '0 0 0 1px rgba(124,58,237,0.25), 0 8px 24px -6px rgba(0,0,0,0.4)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
      }}
    >
      {/* Priority stripe */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '12px',
        bottom: '12px',
        width: '3px',
        borderRadius: '0 2px 2px 0',
        backgroundColor: pr.color,
        boxShadow: `0 0 8px ${pr.color}60`,
      }} />

      {/* Title + navigate icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f7', margin: 0, flex: 1, lineHeight: 1.4 }}>
          {task.title}
        </p>
        <ChevronRight style={{
          width: '15px', height: '15px', color: hovered ? '#a78bfa' : '#3d3d55',
          transition: 'color 0.15s ease', flexShrink: 0, marginTop: '2px',
        }} />
      </div>

      {/* Description preview */}
      {task.description && (
        <p style={{
          fontSize: '12px', color: '#5a5a7a', margin: 0,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {task.tags.map((tag: string) => {
            const matches = tag.toLowerCase().includes(query.toLowerCase());
            return (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500,
                backgroundColor: matches ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${matches ? 'rgba(124,58,237,0.4)' : '#232332'}`,
                color: matches ? '#a78bfa' : '#8888a8',
              }}>
                <Tag style={{ width: '9px', height: '9px' }} />
                {highlightTag(tag, query)}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer: status + priority + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
          backgroundColor: st.bg, color: st.color,
        }}>{st.label}</span>
        <span style={{
          padding: '2px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: 700,
          color: pr.color, backgroundColor: `${pr.color}18`, letterSpacing: '0.04em',
        }}>● {pr.label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#5a5a7a', marginLeft: 'auto' }}>
          <Clock style={{ width: '10px', height: '10px' }} />
          {format(parseISO(String(task.due_date)), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}

// ── SearchResultsGrid ───────────────────────────────────────────────────────

interface SearchResultsGridProps {
  results: Task[];
  query: string;
  isLoading: boolean;
  onNavigate: (task: Task) => void;
}

export default function SearchResultsGrid({ results, query, isLoading, onNavigate }: SearchResultsGridProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '12px', color: '#5a5a7a' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px' }}>Searching…</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '10px' }}>
        <div style={{ fontSize: '32px' }}>🔍</div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#e4e4f0', margin: 0 }}>No tasks found</p>
        <p style={{ fontSize: '13px', color: '#5a5a7a', margin: 0 }}>
          No tasks match the tag <strong style={{ color: '#a78bfa' }}>"{query}"</strong>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 28px' }}>
      <p style={{ fontSize: '12px', color: '#5a5a7a', marginBottom: '16px', fontWeight: 500 }}>
        <span style={{ color: '#a78bfa', fontWeight: 700 }}>{results.length}</span> task{results.length !== 1 ? 's' : ''} matching tag{' '}
        <span style={{ color: '#f4f4f7', fontStyle: 'italic' }}>"{query}"</span> — click any card to jump to its date
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
      }}>
        {results.map((task) => (
          <SearchResultCard key={task.id} task={task} query={query} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
