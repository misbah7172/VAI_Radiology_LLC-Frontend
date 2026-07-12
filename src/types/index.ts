// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string; // ISO Datetime string
  due_date: string; // ISO Datetime string
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string; // ISO Datetime string
  due_date: string; // ISO Datetime string
  tags?: string[];
  position?: number;
}

export type TaskUpdate = Partial<TaskCreate>;

export interface ReorderPayload {
  tasks: Array<{
    id: number;
    status: TaskStatus;
    position: number;
  }>;
}

// ─── Annotations ─────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: number;
  image: number;
  label: string;
  color: string;
  polygon_data: Point[];
  frame_time?: number | null;
  created_at: string;
}

export interface AnnotationCreate {
  image: number;
  label?: string;
  color?: string;
  polygon_data: Point[];
  frame_time?: number | null;
}

export interface UploadedImage {
  id: number;
  filename: string;
  file: string;
  file_url: string;
  uploaded_at: string;
  image_set?: number;
  annotations: Annotation[];
}

export interface ImageSet {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any> | null;
  images: UploadedImage[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  detail?: string;
}
