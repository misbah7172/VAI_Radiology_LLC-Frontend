# 🩺 VAI Radiology LLC — Frontend (Next.js)

> React/Next.js frontend for the 404 Project Not Found application.

## Tech Stack

| Technology | Version |
|------------|---------|
| Node.js | 20+ |
| Next.js | 16.x (App Router) |
| TypeScript | 5.x |
| Zustand | 5.x |
| @dnd-kit | 6.x |
| Axios | 1.x |
| Date-fns | 3.x |

## Setup Instructions

### 1. Clone & navigate
```bash
git clone <your-frontend-repo-url>
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and set your backend URL
```

### 4. Start dev server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Demo Credentials

| Field | Value |
|-------|-------|
| Email | demo@vai.com |
| Password | demo1234 |

## Pages & Key Features

| Route | Description |
|-------|-------------|
| `/login` | Email + password authentication |
| `/tasks` | Kanban board with drag-and-drop, tag search with grid views, custom task calendar pop-up, Start/Due datetime pickers and Kaggle timelines. |
| `/annotate` | Image/Video upload and frame-precise YOLO polygon annotation tool with sidebar preview crops. |

### Key Improvements:
- **Task Search by Tag**: A search bar allows querying tags. Matching cards are rendered in a responsive grid, and clicking them navigates the user to the day of the task, temporarily highlighting the selected card with an animated glowing purple border.
- **Task Calendar Modal**: Highlights days of the month containing tasks, displaying the number of scheduled items. Users can paginate through months/years or click days to jump the Kanban board to that date.
- **Kaggle Progress Timelines**: Replaced simple due dates with a horizontal progress track showing elapsed time from the start date/time to the due date/time, styled dynamically.
- **Sidebar Crop Thumbnails**: Displays cropped YOLO-style preview thumbnails of the annotated region (bounding boxes) in the right sidebar. If the annotation is on a video, it extracts the exact frame at `frame_time` using offscreen rendering.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## Deployment (Vercel)

1. Push to GitHub
2. Connect the repo on [vercel.com](https://vercel.com)
3. Add `NEXT_PUBLIC_API_URL` environment variable pointing to your Render backend URL
4. Deploy!

## Difficulties & How I Overcame Them

1. **Mobile Backdrop Blur & Sidebar Clipping**:
   Applying `backdrop-filter: blur(4px)` to the mobile sidebar backdrop blurred the mobile drawer itself. This happened because the drawer lay within a layout container that established a z-index stacking context of `10`. Moving the mobile drawer container to the outer root level (outside the wrapper) allowed it to overlay cleanly at `zIndex: 50` on top of the backdrop.

2. **Real-time Bounding Box Cropping in the Sidebar**:
   Extracting the annotated region of an image or a specific video frame dynamically on the client side required custom canvas operations. We designed an `AnnotationThumbnail` component that computes bounding boxes from polygons, sets up an anonymous cross-origin canvas context, and uses offscreen `<video>` elements to seek to `frame_time` and paint only the cropped area.

3. **High-Performance Video/Annotation Synchronization**:
   Since the standard HTML5 `onTimeUpdate` event only fires 3-4 times per second, playing a video caused annotations to lag or get bypassed inside narrow matching windows. We implemented a 60 FPS requestAnimationFrame loop inside `AnnotationCanvas` to sync `currentVideoTime` in real time, making annotations vanish or appear instantaneously on single frames.
