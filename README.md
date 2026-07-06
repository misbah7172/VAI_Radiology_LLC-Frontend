# 🩺 VAI Radiology LLC — Frontend (Next.js)

> React/Next.js frontend for the 404 Project Not Found application.

## Tech Stack

| Technology | Version |
|------------|---------|
| Node.js | 20+ |
| Next.js | 16.x (App Router) |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Zustand | 5.x |
| @dnd-kit | 6.x |
| Axios | 1.x |

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

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email + password authentication |
| `/tasks` | Kanban board with drag-and-drop and date filtering |
| `/annotate` | Image upload and polygon annotation tool |

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

*(To be filled after development)*
