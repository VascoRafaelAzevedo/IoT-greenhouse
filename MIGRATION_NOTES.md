# Migration Notes - Python Flask → Node.js/React Stack

## 🔧 Pending Fixes

### Database Schema Issues

| File | Line(s) | Action | Priority |
|------|---------|--------|----------|
| `frontend/backend/routes/greenhouseDbRoutes.js` | 30-32 | Remove `target_hum_air_min` from INSERT query | 🔴 **CRITICAL** |
| `frontend/backend/routes/greenhouseDbRoutes.js` | 118 | Remove `'target_hum_air_min'` from fields array | 🔴 **CRITICAL** |
| `docs/DATABASE.md` | 194 | Update test DB description (remove `target_hum_air_min` reference) | 🟡 Medium |

**Context:** The `setpoint` and `plants` tables only have `target_hum_air_max` (no `target_hum_air_min`). The backend Node.js code still references the old field.

### Backend Configuration Issues

| File | Issue | Fix | Priority |
|------|-------|-----|----------|
| `frontend/backend/.env` | Wrong DATABASE_URL credentials | Change to `postgresql://postgres:change_me_strong_pass@localhost:5432/greenhouse` | 🟡 Medium |
| `frontend/backend/server.js` | PostgreSQL routes not registered | Import and register `greenhouseDbRoutes` and `plantsDbRoutes` | 🟡 Medium |

**Note:** Currently using `USE_MOCK_DB=true` for frontend testing (working correctly).

---

## ✅ Completed Steps

- [x] **Phase 1.2** - Database schema analysis
  - Confirmed `plant_name` column added to `setpoint` table
  - Verified schema consistency (production & test both use only `target_hum_air_max`)
  - Identified backend code that needs updating

- [x] **Phase 1.3** - Test frontend locally ✅
  - Frontend running on Vite dev server
  - Using mock data successfully
  - .env files configured correctly

- [x] **Phase 1.4** - Test backend locally ✅
  - Backend server running on http://localhost:4000
  - Mock data routes working (`/plants`, `/greenhouses`, `/settings`)
  - PostgreSQL connection tested and verified (15 plants loaded)
  - Identified configuration issues (DATABASE_URL, missing route registration)

- [x] **Phase 2** - Database schema verification ✅
  - Production DB schema: Correct (setpoint & plants with plant_name, only target_hum_air_max)
  - Test DB schema: Correct and identical to production
  - Schema files (01-schema.sql): Match actual database structure
  - Seed data (02-seed-data.sql): Correct (plant_name populated, no target_hum_air_min)
  - Data counts verified: 15 plants in both DBs, 4 test greenhouses/setpoints in test DB
  - **No changes needed** ✅

- [x] **Phase 2.5** - Reorganize folder structure ✅ **COMPLETE**
  - Backed up old Python Flask API: `api/` → `api.flask_backup/`
  - Moved Node.js backend: `frontend/backend/` → `api/`
  - Moved React frontend: `frontend/frontend/` → `frontend/`
  - Backed up old structure: `frontend/` → `frontend.old_structure/`
  - Copied `data/` folder with JSON files to project root
  - Verified `.env` files copied correctly in both folders
  - **Backend tested and working** ✅
    - Running on http://localhost:4000
    - GET / → "🌿 GardenAway API running!"
    - GET /plants → 2 plants (mock data)
    - GET /greenhouses → 3 greenhouses (mock data)
  - **Frontend tested and working** ✅
    - Running on http://localhost:5173
    - Dashboard loads correctly with mock data
  - **New structure 100% functional!** ✅

- [x] **Phase 3** - Web server architecture & data volume strategy ✅
  - Chose Nginx for frontend (lightweight, efficient for static files)
  - Decided on bind mount for `data/` folder (read-only in container)
  - Architecture: Client → Nginx (port 80) → Backend (port 4000) → PostgreSQL

- [x] **Phase 4** - Create Dockerfiles ✅
  - Created `api/Dockerfile` (Node.js 20 Alpine, non-root user, dumb-init)
  - Created `frontend/Dockerfile` (Multi-stage: build with Node, serve with Nginx)
  - Created `frontend/nginx.conf` (Proxy /api to backend, serve React SPA)
  - Created `.dockerignore` files for both api/ and frontend/
  - Updated `docker-compose.yml`:
    - Renamed `api` service to `backend`
    - Added `data/` volume mount (read-only)
    - Updated environment variables for new structure
    - Frontend depends on backend (not old api service)

---

## 📋 Next Steps

- [ ] **Phase 5** - Test Docker containers
  - Build and run with docker compose
  - Verify backend connects to PostgreSQL
  - Verify frontend serves and proxies to backend
  - Test full stack integration
  
- [ ] **Phase 6** - Update CI/CD pipeline (.github/workflows/ci.yml)
- [ ] **Phase 4** - Create Dockerfiles
- [ ] **Phase 5** - Update docker-compose.yml
- [ ] **Phase 6** - Update CI/CD pipeline
- [ ] **Phase 7** - Testing strategy
- [ ] **Phase 8** - Cleanup old Python API

---

## 📝 Notes

- Frontend team built the API in Node.js/Express (in `frontend/backend/`)
- Frontend is React + Vite (in `frontend/frontend/`)
- Need to containerize both separately
- Old Python Flask API (`api/`) will be deleted after migration
