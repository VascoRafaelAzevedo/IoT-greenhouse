# 🔄 Complete Reset Guide

This guide explains how to completely reset the IoT Greenhouse project, removing all containers, images, volumes, and starting from a clean slate.

## 🛑 Full Reset (Nuclear Option)

Use this when you want to start completely fresh.

### Step 1: Stop and Remove All Containers

```bash
# Stop all running containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# OR for production setup
docker compose down
```

### Step 2: Remove Volumes (Deletes ALL Data)

⚠️ **WARNING**: This will delete all database data, MQTT logs, and any persisted data.

```bash
# Remove all volumes defined in docker-compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# OR manually remove specific volumes
docker volume rm gardenaway_postgres-data
docker volume rm gardenaway_mosquitto-data
docker volume rm gardenaway_mosquitto-log
```

### Step 3: Remove Images

```bash
# Remove project-specific images
docker rmi gardenaway-frontend:local
docker rmi gardenaway-backend:local
docker rmi gardenaway-consumer:local

# OR remove all unused images
docker image prune -a
```

### Step 4: Clean Build Cache

```bash
# Remove all build cache
docker builder prune -a

# Remove all unused data (containers, networks, images, build cache)
docker system prune -a --volumes
```

## 🚀 Start Fresh

After the reset, rebuild and start everything:

```bash
# Development mode (uses greenhouse_test database)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Production mode (uses greenhouse database with seed data)
docker compose up -d --build
```

## 📋 Quick Reset Commands

### Complete Reset (One Command)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v && \
docker rmi gardenaway-frontend:local gardenaway-backend:local gardenaway-consumer:local 2>/dev/null; \
docker builder prune -af && \
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## 🔐 Reset User Authentication

If you need to clear your browser's stored authentication:

### Clear Browser Storage
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → `http://localhost:3000`
4. Delete `authToken` or clear all storage
5. Refresh the page

### Or Use Console
```javascript
localStorage.clear()
location.reload()
```

## 🧪 Test User Credentials (Development)

After reset, use these credentials to login:

- **Email**: `vasco@example.com`
- **Password**: `password123`

This user owns 2 greenhouses in the test database.

## 📊 Verify Everything is Running

```bash
# Check running containers
docker ps

# Check container logs
docker logs gardenaway-backend
docker logs gardenaway-frontend
docker logs gardenaway-consumer
docker logs gardenaway-postgres
docker logs gardenaway-mosquitto

# Test backend API
curl http://localhost:4000/

# Access frontend
# Open browser: http://localhost:3000
```

## ⚠️ Common Issues After Reset

### Issue: "Port already in use"
```bash
# Find what's using the port (example: port 4000)
lsof -i :4000
# Kill the process
kill -9 <PID>
```

### Issue: "Database initialization failed"
```bash
# Remove postgres volume and restart
docker compose down -v
docker volume rm gardenaway_postgres-data
docker compose up -d
```

### Issue: "Image build fails"
```bash
# Clear all build cache
docker builder prune -af
# Try building again
docker compose build --no-cache
```

## 📝 Notes

- **Development mode** (`docker-compose.dev.yml`) uses `greenhouse_test` database
- **Production mode** uses `greenhouse` database with seed data
- Database initialization scripts are in `database/init/` directory
- Volumes persist data between container restarts unless explicitly removed with `-v` flag
