import type { Metadata } from 'next';
import TasksPageClient from '@/components/tasks/TasksPageClient';

export const metadata: Metadata = {
  title: 'Tasks — VAI Radiology',
  description: 'Manage your daily tasks with a Kanban board',
};

export default function TasksPage() {
  return <TasksPageClient />;
}
