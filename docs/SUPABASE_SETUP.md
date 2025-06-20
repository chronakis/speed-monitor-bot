# Supabase Setup Guide

This guide will help you set up Supabase for the Traffic Flow Bot application.

## Prerequisites

1. [Supabase Account](https://supabase.com) - Sign up for free
2. Node.js 18+ installed locally

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `traffic-flow-bot`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

## Step 2: Configure Database Schema

1. Go to your project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the entire contents of `shared/database.sql`
5. Click **"Run"** to execute the schema
6. Verify tables were created in **Table Editor**

## Step 3: Configure Authentication

1. Go to **Authentication** → **Configuration** in your Supabase dashboard
2. Under **General** tab:
   - Site URL: Set to your production domain (e.g., `https://yourapp.com`)
   - For development, add `http://localhost:5173` to **Redirect URLs**
   - Session timeout: Keep default (3600 seconds) or adjust as needed
3. Under **Email** tab (if using email auth):
   - ✅ Enable email confirmations
   - ✅ Enable secure email change
   - Configure SMTP settings or use Supabase's built-in email service
4. Under **Providers** tab, configure authentication methods:
   - **Email**: Usually enabled by default
   - **Google**: Click to enable and configure OAuth
   - **GitHub**: Click to enable and configure OAuth
   - **Other providers**: Enable as needed
5. Under **Email Templates** tab, customize if desired:
   - Welcome email
   - Password reset email
   - Email confirmation

### OAuth Provider Setup (Optional but Recommended)

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set **Application type** to "Web application"
6. Add **Authorized redirect URIs**:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for local development)
7. In Supabase **Authentication** → **Configuration** → **Providers** → **Google**:
   - Enable the provider
   - Paste your **Client ID** and **Client Secret**
   - Save configuration

#### GitHub OAuth Setup  
1. Go to GitHub **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in application details:
   - **Application name**: Traffic Flow Bot
   - **Homepage URL**: Your production URL or `http://localhost:5173`
   - **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
4. In Supabase **Authentication** → **Configuration** → **Providers** → **GitHub**:
   - Enable the provider
   - Paste your **Client ID** and **Client Secret**
   - Save configuration

## Step 4: Get API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values (you'll need these for environment variables):
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (safe to use in frontend)
   - **service_role secret** key (⚠️ NEVER expose this in frontend!)

## Step 5: Generate Security Keys

Before creating your environment files, you need to generate some security keys:

### Generate Encryption Key
The `ENCRYPTION_KEY` is used to encrypt user API keys before storing them in the database. Generate a 32-character random string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Secret (Optional)
Supabase provides its own JWT secret for authentication. You only need to generate your own `JWT_SECRET` if you plan to create additional JWTs in your backend for other purposes (like API tokens, temporary access tokens, etc.).

**If you need your own JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

⚠️ **Important**: Save the `ENCRYPTION_KEY` securely! You'll need the same key to decrypt user API keys later.

## Step 6: Environment Configuration

Create your environment files with the values from Step 4 and the generated keys:

### Backend Environment (`backend/.env`)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
# JWT_SECRET=your-jwt-secret-here  # Optional: only if you need custom JWTs

# HERE API Configuration  
HERE_API_KEY=your-here-maps-api-key
HERE_API_DAILY_LIMIT=1000
HERE_API_HOURLY_LIMIT=100
HERE_API_PER_USER_DAILY_LIMIT=50

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Frontend Environment (`frontend/.env`)
```bash
# Supabase Configuration (only anon key!)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

## Step 7: Security Configuration

### Row Level Security (RLS)
The schema automatically enables RLS on all tables. Key policies:
- Users can only access their own data
- API usage tracking allows service-level inserts
- System config requires admin email access

### API Key Encryption
User API keys are stored encrypted. The backend will:
- Encrypt keys before storing using `ENCRYPTION_KEY`
- Decrypt only when making API calls
- Never expose decrypted keys to frontend

### Rate Limiting
Built-in limits are configured in `system_config` table:
- Daily limit for built-in HERE API key: 1000 calls
- Hourly limit: 100 calls  
- Per-user daily limit: 50 calls

## Step 8: Test Connection

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

3. The response should include Supabase connection status.

## Database Tables Overview

| Table | Purpose |
|-------|---------|
| `user_preferences` | User settings, API key choice, units, etc. |
| `user_api_keys` | Encrypted storage of user's HERE API keys |
| `api_usage` | Raw log of every API call made |
| `daily_usage_summary` | Aggregated daily stats for dashboard |
| `system_config` | Global app configuration and limits |

## Useful Queries

### Check user preferences
```sql
SELECT * FROM user_preferences WHERE user_id = 'user-uuid-here';
```

### View today's API usage
```sql
SELECT * FROM api_usage WHERE date_key = CURRENT_DATE;
```

### Get usage summary for a user
```sql
SELECT * FROM user_dashboard_stats WHERE user_id = 'user-uuid-here';
```

### Update system limits
```sql
UPDATE system_config 
SET config_value = '2000' 
WHERE config_key = 'builtin_api_daily_limit';
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure you're using the correct JWT tokens
2. **Connection Errors**: Verify SUPABASE_URL and keys are correct
3. **Permission Denied**: Check that RLS policies allow the operation
4. **Migration Errors**: Run schema in chunks if you get timeout errors

### Reset Database (Development Only)
```sql
-- Drop all custom tables (be careful!)
DROP TABLE IF EXISTS daily_usage_summary CASCADE;
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS user_api_keys CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- Then re-run the schema from shared/database.sql
```

## Production Considerations

1. **Backup Strategy**: Enable point-in-time recovery
2. **Monitoring**: Set up log alerts for high API usage
3. **Scaling**: Consider read replicas for heavy usage
4. **Security**: Rotate encryption keys periodically
5. **Compliance**: Review data retention policies

## Next Steps

After Supabase is configured:
1. Test authentication flow in frontend
2. Implement backend API routes with Supabase integration
3. Set up HERE API proxy with usage tracking
4. Configure automated daily usage aggregation 