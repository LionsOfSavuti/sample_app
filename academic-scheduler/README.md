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

## 2) Start full stack
```bash
docker compose up -d --build
```

Services:
- Web (Apache): `http://localhost:8080`
- API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

## 3) Run migrations + seed default admin
```bash
./scripts/migrate-and-seed.sh
```

Default admin:
- username: `admin`
- password: `admin123`

## 4) Verify database objects
```bash
docker exec -it academic_scheduler_db psql -U scheduler_admin -d academic_scheduler -c "\dt"
```

## 5) Stop stack
```bash
docker compose down
```

## 6) Reset everything (including DB data)
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
