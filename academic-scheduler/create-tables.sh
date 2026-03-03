#!/usr/bin/env bash
set -euo pipefail

DB_USER="${DB_USER:-scheduler_admin}"
DB_NAME="${DB_NAME:-academic_scheduler}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-supabase/migrations}"

if ! compgen -G "$MIGRATIONS_DIR/*.sql" > /dev/null; then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 1
fi

for file in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "Running migration: $file"
  psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -f "$file"
done

echo "All migrations completed!"
