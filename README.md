# Traffic Flow Bot

Monitor traffic flow data using HERE Maps API with React frontend and Express backend.

## Setup

1. **Install fnm and use correct Node version:**
   ```bash
   fnm use
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Environment setup:**
   ```bash
   # Copy environment files
   cp frontend/env.example frontend/.env.local
   cp backend/env.example backend/.env
   
   # Edit with your actual keys
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

## Structure

- `frontend/` - React + Vite app (port 5173)
- `backend/` - Express API server (port 3001)
- `shared/` - Shared utilities and types

## Environment Variables

### Frontend (.env.local)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_HERE_API_KEY` - Your HERE Maps API key

### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service key
- `HERE_API_KEY` - Your HERE Maps API key 