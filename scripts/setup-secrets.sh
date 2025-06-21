#!/bin/bash

# 🔐 Secure Environment Setup Script
# This script helps set up local development environment with secure secrets

set -e

echo "🔐 Setting up secure local development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/local.env.example" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if local.env already exists
if [ -f "backend/local.env" ]; then
    echo -e "${YELLOW}⚠️  backend/local.env already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting without changes."
        exit 0
    fi
fi

# Copy template
echo "📋 Copying environment template..."
cp backend/local.env.example backend/local.env

# Generate secure secrets
echo "🔑 Generating secure secrets..."

# Generate JWT secret (64 bytes, base64 encoded)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Generate encryption key (32 bytes, hex encoded)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Update the local.env file with generated secrets
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - escape special characters in the secrets
    sed -i '' "s|JWT_SECRET=your-jwt-secret-here|JWT_SECRET=$JWT_SECRET|" backend/local.env
    sed -i '' "s|ENCRYPTION_KEY=your-32-character-encryption-key|ENCRYPTION_KEY=$ENCRYPTION_KEY|" backend/local.env
else
    # Linux - escape special characters in the secrets
    sed -i "s|JWT_SECRET=your-jwt-secret-here|JWT_SECRET=$JWT_SECRET|" backend/local.env
    sed -i "s|ENCRYPTION_KEY=your-32-character-encryption-key|ENCRYPTION_KEY=$ENCRYPTION_KEY|" backend/local.env
fi

echo -e "${GREEN}✅ Generated secure JWT_SECRET and ENCRYPTION_KEY${NC}"

# Prompt for Supabase credentials
echo ""
echo "🔗 Supabase Configuration Required"
echo "Please get these values from your Supabase Dashboard > Settings > API:"
echo ""

read -p "Enter your Supabase URL (https://your-project.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_KEY
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

# Update Supabase configuration
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SUPABASE_URL=https://your-project.supabase.co|SUPABASE_URL=$SUPABASE_URL|" backend/local.env
    sed -i '' "s/SUPABASE_SERVICE_KEY=your-service-role-key-here/SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY/" backend/local.env
    sed -i '' "s/SUPABASE_ANON_KEY=your-anon-key-here/SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY/" backend/local.env
else
    # Linux
    sed -i "s|SUPABASE_URL=https://your-project.supabase.co|SUPABASE_URL=$SUPABASE_URL|" backend/local.env
    sed -i "s/SUPABASE_SERVICE_KEY=your-service-role-key-here/SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY/" backend/local.env
    sed -i "s/SUPABASE_ANON_KEY=your-anon-key-here/SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY/" backend/local.env
fi

echo -e "${GREEN}✅ Updated Supabase configuration${NC}"

# Set proper permissions
chmod 600 backend/local.env

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Verify your configuration: cat backend/local.env"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm start"
echo ""
echo -e "${RED}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
echo "• NEVER commit backend/local.env to Git"
echo "• Keep your secrets secure and rotate them regularly"
echo "• Use different secrets for different environments"
echo "• Read docs/SECURITY_SECRETS.md for more information"
echo ""
echo -e "${GREEN}✅ Your secrets are now secure!${NC}" 