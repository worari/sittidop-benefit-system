#!/bin/sh
set -e

echo "🚀 Checking database connection and applying Prisma migrations..."

# Apply database migrations/schema
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Running Prisma DB Push / Migration..."
  npx prisma db push --accept-data-loss --skip-generate || echo "⚠️ Prisma push skipped or pending DB readiness"
fi

echo "✨ Starting Next.js application server..."
exec "$@"
