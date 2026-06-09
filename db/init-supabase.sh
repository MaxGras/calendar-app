#!/bin/bash

# Initialize Supabase and create migration
# This script:
# 1. Checks if Supabase is initialized
# 2. Creates a migration from schema.sql
# 3. Pushes it to your remote Supabase project

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Supabase CLI Migration Setup                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install it:"
  echo "   brew install supabase/tap/supabase"
  exit 1
fi

echo "✅ Supabase CLI is installed"
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found!"
  exit 1
fi

source .env.local

# Extract project ID from URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "📍 Project ID: $PROJECT_ID"
echo ""

# Check if supabase is already initialized
if [ ! -d "supabase" ]; then
  echo "📦 Initializing Supabase project locally..."
  supabase init
  echo ""
fi

# Link to remote project (if not already linked)
if [ ! -f "supabase/.branches.json" ]; then
  echo "🔗 Linking to remote Supabase project..."
  supabase link --project-ref "$PROJECT_ID"
  echo ""
fi

# Create migration from schema.sql
echo "📝 Creating migration from schema.sql..."
MIGRATION_NAME=$(date +%Y%m%d_%H%M%S)_init_schema
supabase migration new "$MIGRATION_NAME"

# Get the migration file path
MIGRATION_FILE="supabase/migrations/${MIGRATION_NAME}.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  # Create it manually if it wasn't created
  mkdir -p "supabase/migrations"
  touch "$MIGRATION_FILE"
fi

echo "📄 Copying schema.sql to migration file..."
cp "db/schema.sql" "$MIGRATION_FILE"

echo "✅ Migration created: $MIGRATION_FILE"
echo ""

# Ask user if they want to push
echo "🚀 Ready to push migration to Supabase?"
echo ""
echo "Command:"
echo "  supabase db push"
echo ""
echo "Or to push with confirmation:"
echo "  supabase db push --dry-run"
echo ""
echo "Do you want to push now? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
  echo ""
  echo "⏳ Pushing migration to Supabase..."
  supabase db push

  if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              ✅ Migration Complete!                    ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your database schema has been applied to Supabase!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Login to http://localhost:3000"
    echo "3. Email: admin@example.com"
    echo "4. Password: admin123456"
  else
    echo ""
    echo "❌ Push failed. Check your connection and try again:"
    echo "   supabase db push"
  fi
else
  echo ""
  echo "Skipping push. Run this when ready:"
  echo "  supabase db push"
fi
