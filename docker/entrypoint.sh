#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "$SEED" = "true" ]; then
  echo "Seeding database..."
  npm run db:seed || true
fi

echo "Starting app..."
npm run start

