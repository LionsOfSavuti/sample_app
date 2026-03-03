# Academic Scheduler Bootstrap (Docker E2E)

This setup recreates the project locally with:
- React + Vite frontend
- Node/Express API
- PostgreSQL database
- Apache serving frontend and proxying `/api`

## Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine + Compose (Linux)

## 1) Clone and open
```bash
git clone -b codex/create-local-setup-guide-for-system https://github.com/LionsOfSavuti/sample_app.git
cd sample_app/academic-scheduler
```

## 2) Start Docker Desktop (Windows/macOS)
Make sure Docker Desktop is open and the engine is running before any `docker` command.

Quick check:
```bash
docker version
docker info
```

## 3) Start full stack
```bash
docker compose up -d --build
```

Services:
- Web (Apache): `http://localhost:8080`
- API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

## 4) Run migrations + seed default admin
```bash
./scripts/migrate-and-seed.sh
```

Default admin:
- username: `admin`
- password: `admin123`

If login fails for `admin/admin123`, re-apply the seed to reset the admin password:

```bash
./scripts/migrate-and-seed.sh
```

This seed now force-updates the `admin` user password on every run.

## 5) Verify database objects
```bash
docker exec -it academic_scheduler_db psql -U scheduler_admin -d academic_scheduler -c "\dt"
```

## 6) Stop stack
```bash
docker compose down
```

## 7) Reset everything (including DB data)
```bash
docker compose down -v
```

## Windows notes
If using PowerShell and script execution is blocked, run migrations/seeds manually:

```powershell
Get-ChildItem .\supabase\migrations\*.sql | Sort-Object Name | ForEach-Object {
  Get-Content $_.FullName | docker exec -i academic_scheduler_db psql -v ON_ERROR_STOP=1 -U scheduler_admin -d academic_scheduler
}
Get-ChildItem .\supabase\seeds\*.sql | Sort-Object Name | ForEach-Object {
  Get-Content $_.FullName | docker exec -i academic_scheduler_db psql -v ON_ERROR_STOP=1 -U scheduler_admin -d academic_scheduler
}
```

## Existing non-Docker workflow
If you still want local Node/Postgres tools directly, see:
- `doc/ACADEMIC_SCHEDULING_LOCAL_SETUP.md`


## Troubleshooting (Windows)
If you see errors like:
- `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`
- `failed to connect to the docker API`

Run:
```powershell
# 1) Start Docker Desktop manually from Start menu
# 2) Confirm daemon is up
docker version
docker info

# 3) (optional) switch to Linux containers mode in Docker Desktop UI
# 4) retry
docker compose up -d --build
./scripts/migrate-and-seed.sh
```

If `docker info` still fails, restart Docker Desktop and reboot Windows.


## Included application features (implemented)

- Role-based access guard (`admin`, `staff`, `faculty`) with protected API routes.
- Password change flow with current-password validation and confirm-password UI.
- Admin invitation management (create/list/resend/accept) with expiring tokens.
- Dashboard overview statistics (faculty/courses/students/scheduled classes).
- JWT login using seeded admin user.
- Academic year creation/listing.
- Program creation/listing (by academic year).
- Term creation/listing (by program).
- Calendar generation endpoint with blocked days / no-class period checks and credit-based class limits (0.5=>10, otherwise 20).

## Run after pulling latest code
```bash
cd sample_app/academic-scheduler
docker compose up -d --build
./scripts/migrate-and-seed.sh
```

## CSV upload formats

### Students CSV
Accepted headers (any one alias for each field):
- Roll Number / student_id
- Student Name / name
- Email / email
- section (optional)

Example:
```csv
Roll Number,Student Name,Email
PGP2301001,Alice Johnson,alice@iimr.ac.in
PGP2301002,Bob Smith,bob@iimr.ac.in
PGP2301003,Carol Davis,carol@iimr.ac.in
```

### Courses CSV
Expected first 10 columns:
1. Term
2. Programme
3. Area
4. Course Name
5. Course Code
6. Section
7. Credits
8. Professor
9. Max Seats
10. Confirmed Seats

Enrollment columns should follow after the first 10 columns (typically `1..75`) and may contain:
- `Name(RollNumber)` (example: `Alice(PGP001)`)
- `RollNumber` only (example: `EMBA001`)

During upload:
- Faculty is auto-created if missing.
- Course and section are upserted.
- Enrollment rows are created for conflict detection.
- UI shows a success/failure message with inserted/skipped counts.
