# Academic Scheduler Bootstrap

This folder contains ready-to-run starter files so you can pull from git and execute setup quickly.

## Quick start

```bash
cd academic-scheduler
cp .env.example .env
npm install
npm run api
```

In another terminal:

```bash
cd academic-scheduler
npm run dev
```

## Database prep

```bash
psql -U postgres
CREATE DATABASE academic_scheduler;
CREATE USER scheduler_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE academic_scheduler TO scheduler_admin;
\q
```

Then run migrations:

```bash
cd academic-scheduler
./create-tables.sh
```

Add your SQL migrations to `supabase/migrations/` first.

If you get `permission denied for schema public`, grant schema rights once as postgres:

```bash
psql -U postgres -d academic_scheduler -c "GRANT USAGE, CREATE ON SCHEMA public TO scheduler_admin;"
psql -U postgres -d academic_scheduler -c "ALTER SCHEMA public OWNER TO scheduler_admin;"
```

Then re-run:

```bash
./create-tables.sh
```

## Notes

- This is a scaffold and includes minimal `src/App.tsx` and `src/main.tsx`.
- Copy your full feature source files into `src/` as needed.
