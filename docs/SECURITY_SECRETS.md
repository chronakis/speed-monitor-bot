# 🔐 Secrets Management Guide

## ⚠️ Critical Security Notice

**NEVER commit secrets to Git!** This includes:
- API keys
- Database passwords
- JWT secrets
- Encryption keys
- Service account credentials

## 🚨 Emergency: Secrets Already Committed

If secrets have been committed to Git:

1. **Immediately rotate/regenerate all exposed secrets**
2. **Remove secrets from Git history** (see instructions below)
3. **Set up proper secrets management** (this guide)

### Remove Secrets from Git History

```bash
# Remove specific file from Git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/local.env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to overwrite remote history
git push origin --force --all
git push origin --force --tags
```

## 🔧 Local Development Setup

### 1. Copy Environment Template
```bash
cd backend
cp local.env.example local.env
```

### 2. Fill in Real Values
Edit `backend/local.env` with your actual secrets:

```bash
# Get from Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...  # Service role key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...     # Anon public key

# Generate secure random strings
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### 3. Generate Secure Keys

```bash
# Generate JWT secret (64 bytes, base64 encoded)
openssl rand -base64 64

# Generate encryption key (32 bytes, hex encoded)
openssl rand -hex 32
```

## 🏗️ Production Deployment

### Environment Variables

For production, use your hosting platform's environment variable system:

#### Vercel
```bash
vercel env add SUPABASE_SERVICE_KEY
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
```

#### Heroku
```bash
heroku config:set SUPABASE_SERVICE_KEY="your-key"
heroku config:set JWT_SECRET="your-secret"
heroku config:set ENCRYPTION_KEY="your-key"
```

#### Docker
```bash
# Use docker-compose.yml with env_file
services:
  backend:
    env_file:
      - .env.production  # Not committed to Git
```

#### Railway/Render
Use the web dashboard to set environment variables.

## 🔍 Security Checklist

- [ ] All secrets are in environment variables
- [ ] No secrets in Git repository
- [ ] `.env` files are in `.gitignore`
- [ ] Secrets are rotated regularly
- [ ] Different secrets for dev/staging/production
- [ ] Secrets have appropriate permissions/scopes
- [ ] Backup of secrets stored securely (password manager)

## 🚫 What NOT to Do

❌ **DON'T** commit `.env` files
❌ **DON'T** put secrets in code comments
❌ **DON'T** share secrets in chat/email
❌ **DON'T** use the same secrets across environments
❌ **DON'T** store secrets in client-side code

## ✅ Best Practices

✅ **DO** use environment variables
✅ **DO** rotate secrets regularly
✅ **DO** use different secrets per environment
✅ **DO** store secrets in secure password managers
✅ **DO** audit secret access regularly
✅ **DO** use least-privilege principle

## 🔄 Secret Rotation Schedule

- **Development**: Every 3 months
- **Staging**: Every month
- **Production**: Every 2 weeks
- **After security incident**: Immediately

## 📞 Emergency Contacts

If secrets are compromised:

1. **Immediately rotate** all affected secrets
2. **Check logs** for unauthorized access
3. **Notify team** via secure channel
4. **Update documentation** with lessons learned

## 🛠️ Tools for Secret Management

### Local Development
- [direnv](https://direnv.net/) - Auto-load environment variables
- [dotenv](https://github.com/motdotla/dotenv) - Load .env files

### Production
- [HashiCorp Vault](https://www.vaultproject.io/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)
- [Google Secret Manager](https://cloud.google.com/secret-manager)

## 📚 Additional Resources

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [12-Factor App Config](https://12factor.net/config) 