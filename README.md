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

3. **🔐 Secure environment setup:**
   ```bash
   # Use the secure setup script (RECOMMENDED)
   ./scripts/setup-secrets.sh
   ```
   
   **OR manually:**
   ```bash
   # Copy environment files
   cp frontend/env.example frontend/.env.local
   cp backend/local.env.example backend/local.env
   
   # Edit with your actual secrets (NEVER commit local.env!)
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

### Backend (local.env) - 🔐 NEVER COMMIT!
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service key
- `JWT_SECRET` - Generated JWT signing secret
- `ENCRYPTION_KEY` - Generated encryption key

## 🚨 Security Notice

**CRITICAL:** Never commit secrets to Git!
- `backend/local.env` contains sensitive secrets and is gitignored
- Use `./scripts/setup-secrets.sh` for secure setup
- Read [Security Guide](docs/SECURITY_SECRETS.md) for best practices
- Rotate secrets regularly 