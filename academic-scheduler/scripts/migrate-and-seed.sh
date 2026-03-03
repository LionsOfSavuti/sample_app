#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-academic_scheduler_db}"
DB_USER="${DB_USER:-scheduler_admin}"
DB_NAME="${DB_NAME:-academic_scheduler}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI not found. Install Docker Desktop and ensure 'docker' is in PATH."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop, wait until it shows 'Engine running', then retry."
  exit 1
fi

for file in $(ls -1 supabase/migrations/*.sql | sort); do
  echo "Applying migration: $file"
  docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$file"
done

for file in $(ls -1 supabase/seeds/*.sql | sort); do
  echo "Applying seed: $file"
  docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$file"
done

echo "Migrations and seeds applied successfully."
