#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h db -U ${POSTGRES_USER:-infrauser} -d ${POSTGRES_DB:-infra_db}; do
  sleep 2
done

echo "Database is ready!"

# Run Prisma migrations
echo "Running Prisma migrations..."
cd /app && npx prisma migrate deploy

# Run seed script
echo "Seeding database..."
cd /app && npx prisma db seed

echo "Database initialization complete!"
