# Backend - Discord Clone

## 🚀 Quick Start with Load Balancer

### Using Docker (Recommended)
```powershell
cd backend
.\lb-manager.ps1
```
Select option 1 to start all services with Nginx load balancer.

**Or manually:**
```powershell
docker-compose up -d --build
```

This starts:
- 3 Backend servers (ports 5001, 5002, 5003)
- Nginx load balancer (port 5000)
- PostgreSQL, Redis, Kafka

See [QUICK_START.md](QUICK_START.md) for more details.

### Local Development (Without Docker)
```powershell
# Start infrastructure
docker-compose up -d postgres redis kafka

# Start backend servers
.\start-server-1.ps1  # Terminal 1
.\start-server-2.ps1  # Terminal 2
.\start-server-3.ps1  # Terminal 3
```

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - Quick reference guide
- [LOAD_BALANCER_GUIDE.md](LOAD_BALANCER_GUIDE.md) - Complete load balancer guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [DOCKER_SETUP.md](../DOCKER_SETUP.md) - Docker setup details

## 🗄️ Database Commands

### Migration
```bash
npx prisma migrate dev
# Or with name
npx prisma migrate dev --name "your_migration_name"
```

### Generate Prisma Client
```bash
npx prisma generate
```

### View Database
```bash
npx prisma studio
```

### Deploy Migrations
```bash
npx prisma migrate deploy
```

## 🔧 Load Balancer Management

### Check Health
```powershell
.\check-health.ps1
```

### Test Load Distribution
```powershell
.\test-lb.ps1
```

### Monitor Services
```powershell
.\monitor.ps1
```

### View Logs
```powershell
docker-compose logs -f
```

## 🔍 See Which Server Handles Requests

Every API response includes these headers:
- **X-Server-ID**: Server identifier (dev-server-1, dev-server-2, dev-server-3)
- **X-Upstream-Server**: Backend address (backend-1:5001, etc.)

### Check in Browser
1. Open DevTools (F12)
2. Network tab
3. Make any request
4. Check Response Headers

### Check with curl
```powershell
curl -I http://localhost:5000/api/health
```

### Run Test Script
```powershell
.\test-lb.ps1
```

**Note:** With IP hash, your browser always connects to the same server (sticky sessions). This is correct for WebSocket connections!

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| Load Balancer | http://localhost:5000 |
| Kafka UI | http://localhost:8080 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |