# ?? VAI Radiology LLC — Frontend (Next.js)

> React / Next.js frontend for the **404 Project Not Found** full-stack submission.
> GitHub: https://github.com/misbah7172/VAI_Radiology_LLC

---

## Tech Stack

| Technology | Version |
|---|---|
| Node.js | **v24.14.1** (tested & recommended) |
| Next.js | 16.2.10 (App Router, Turbopack) |
| React | 19.2.4 |
| TypeScript | 5.x |
| Zustand | 5.x (global state) |
| @dnd-kit/core + sortable | 6.x / 10.x |
| Axios | 1.x |
| Date-fns | 4.x |
| Tailwind CSS | 4.x |
| lucide-react | 0.468 |
| react-hot-toast | 2.x |

---

## Setup Instructions

### 1. Clone & navigate
```bash
git clone https://github.com/misbah7172/VAI_Radiology_LLC.git
cd VAI_Radiology_LLC/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and set:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Start dev server
```bash
npm run dev
```

App will be available at http://localhost:3000.

### 5. Build for production
```bash
npm run build
npm run start
```

---

## Demo Credentials

| Field | Value |
|---|---|
| Email | demo@vai.com |
| Password | demo1234 |

---

## Pages and Feature Coverage

### /login — Login Page
- Email + password authentication with JWT
- Auto-redirect for already-authenticated users

### /tasks — Kanban Task Board
| Feature | Status |
|---|---|
| DateSelector reusable date-picker component | Done |
| Board DnD context wrapper | Done |
| Column To Do / In Progress / Done columns | Done |
| TaskCard — title, priority badge, due date, tags | Done |
| Drag-and-drop between columns (dnd-kit) | Done |
| Tasks filtered and fetched per selected date | Done |
| Add / Edit / Delete tasks via modal | Done |
| Tag-based search with animated result grid | Done |
| Calendar modal — highlights days with tasks | Done |
| Start to Due date progress timeline per card | Done |
| Responsive columns (CSS Grid, mobile-stack) | Done |
| All task data persisted to Django backend | Done |

### /annotate — Image Annotation Tool
| Feature | Status |
|---|---|
| Upload images (DICOM, NIfTI, PNG, JPG, ZIP) | Done |
| Unlimited file upload — batched 15 files/request | Done |
| Image carousel sidebar — scroll through images | Done |
| Draw polygons, freehand brush, rectangles, circles | Done |
| Eraser to remove drawn pixels | Done |
| Undo / Redo per image | Done |
| Save / load annotations from backend database | Done |
| Annotations persist across page refreshes | Done |
| MPR viewer — Axial / Coronal / Sagittal planes | Done |
| Annotation naming dialog (name + category) | Done |
| User-defined annotation color (24 presets + picker) | Done |
| Category-grouped annotations right sidebar | Done |
| Resizable MPR panel splitters | Done |

---

## Environment Variables

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend API base URL e.g. http://localhost:8000 |

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo at vercel.com
3. Add environment variable: NEXT_PUBLIC_API_URL pointing to your Render backend
4. Deploy — Vercel auto-detects Next.js

---

## Difficulties and How I Overcame Them

### 1. Mobile Backdrop Blur and Sidebar Clipping
Applying backdrop-filter blur to the mobile sidebar backdrop blurred the drawer itself because the drawer lived inside a layout container that established its own stacking context. Moving the mobile drawer to the outer root level fixed the overlay rendering.

### 2. Unlimited Image Upload Without Gateway Timeouts
Uploading hundreds of images at once caused server timeouts (413 / 504). Fix: implemented sequential batch uploading — files split into groups of 15, uploaded serially, with the newly-created image set ID carried forward so all batches land in the same set. Per-file limit raised to 500 MB.

### 3. setState-in-Effect React Lint Error in MPR Dialog
The annotation naming dialog populated state inside useEffect, triggering the react-hooks/set-state-in-effect ESLint error. Fix: extracted the dialog into a self-contained AnnotationNamingDialog component that initialises useState directly from props at mount time, keyed on shape.id so it re-mounts fresh for each annotation.

### 4. TypeScript Errors for Custom Annotation Shape Fields
Adding name and category to annotation shapes required as-any casts because they were missing from the base type, causing build failures. Fix: added name and category as optional fields on BaseAnnotationShape in mpr.ts.

### 5. Real-time Bounding Box Cropping in the Sidebar
Extracting annotated regions dynamically required custom canvas operations and cross-origin video frame seeking. Fix: designed an AnnotationThumbnail component with offscreen video elements seeking to frame_time.

### 6. High-Performance Video / Annotation Synchronisation
The HTML5 onTimeUpdate event only fires 3-4 times per second, causing annotation lag on video. Fix: implemented a 60 FPS requestAnimationFrame loop inside AnnotationCanvas.

### 7. Responsive Kanban Columns Dead Space on Wide Screens
Original columns used maxWidth 360px leaving a large empty area on wide screens; on mobile fixed minWidth caused horizontal overflow. Fix: replaced inline flex styles with a CSS Grid class — repeat(3, 1fr) on wide screens and single-column stacking on mobile.
