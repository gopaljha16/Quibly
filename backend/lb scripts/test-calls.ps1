# Test script for DM calls across load-balanced servers
# This script helps diagnose call issues in a multi-server setup

Write-Host "=== DM Call Load Balancer Test ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LB_URL = "http://localhost:80"
$BACKEND_URLS = @(
    "http://localhost:5001",
    "http://localhost:5002",
    "http://localhost:5003"
)

# Test 1: Check if all backend servers are running
Write-Host "Test 1: Checking backend servers..." -ForegroundColor Yellow
foreach ($url in $BACKEND_URLS) {
    try {
        $response = Invoke-RestMethod -Uri "$url/health" -Method Get -TimeoutSec 5
        $status = if ($response.status -eq "healthy") { "✅" } else { "⚠️" }
        Write-Host "  $status $url - Status: $($response.status), Connections: $($response.socketConnections), Redis: $($response.services.redis)" -ForegroundColor $(if ($response.status -eq "healthy") { "Green" } else { "Yellow" })
    } catch {
        Write-Host "  ❌ $url - NOT RESPONDING" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Check load balancer health
Write-Host "Test 2: Checking load balancer..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$LB_URL/health" -Method Get -TimeoutSec 5
    Write-Host "  ✅ Load balancer is routing to: Server $($response.serverId)" -ForegroundColor Green
    Write-Host "     Status: $($response.status), Redis: $($response.services.redis)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Load balancer not responding" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check Redis adapter
Write-Host "Test 3: Checking Redis adapter on all servers..." -ForegroundColor Yellow
$redisOk = $true
foreach ($url in $BACKEND_URLS) {
    try {
        $response = Invoke-RestMethod -Uri "$url/health" -Method Get -TimeoutSec 5
        if ($response.services.redis -eq $true) {
            Write-Host "  ✅ $url - Redis connected" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $url - Redis NOT connected (calls won't work across servers!)" -ForegroundColor Red
            $redisOk = $false
        }
    } catch {
        Write-Host "  ❌ $url - Cannot check Redis status" -ForegroundColor Red
        $redisOk = $false
    }
}

if ($redisOk) {
    Write-Host "  ✅ All servers have Redis adapter enabled - cross-server calls should work!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Not all servers have Redis - calls may fail!" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check connection distribution (requires development mode)
Write-Host "Test 4: Checking connection distribution..." -ForegroundColor Yellow
Write-Host "  (This requires NODE_ENV=development on backend servers)" -ForegroundColor Gray
$totalConnections = 0
foreach ($url in $BACKEND_URLS) {
    try {
        $response = Invoke-RestMethod -Uri "$url/debug/connections" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        $count = $response.connectionCount
        $totalConnections += $count
        Write-Host "  Server $($response.serverId): $count connections" -ForegroundColor Cyan
        
        if ($count -gt 0) {
            foreach ($user in $response.connectedUsers) {
                Write-Host "    - User: $($user.userId), Socket: $($user.socketId)" -ForegroundColor Gray
                Write-Host "      Rooms: $($user.rooms -join ', ')" -ForegroundColor DarkGray
            }
        }
    } catch {
        Write-Host "  $url - Debug endpoint not available (set NODE_ENV=development)" -ForegroundColor DarkGray
    }
}
if ($totalConnections -gt 0) {
    Write-Host "  Total connections across all servers: $totalConnections" -ForegroundColor Cyan
}
Write-Host ""

# Test 5: Verify nginx sticky sessions
Write-Host "Test 5: Testing sticky sessions (ip_hash)..." -ForegroundColor Yellow
Write-Host "  Making 5 requests to load balancer..." -ForegroundColor Gray
$servers = @()
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$LB_URL/health" -Method Get -TimeoutSec 5
        $servers += $response.serverId
        Write-Host "  Request $i -> Server: $($response.serverId)" -ForegroundColor Gray
    } catch {
        Write-Host "  Request $i -> FAILED" -ForegroundColor Red
    }
}

$uniqueServers = $servers | Select-Object -Unique
if ($uniqueServers.Count -eq 1) {
    Write-Host "  ✅ Sticky sessions working! All requests went to same server: $($uniqueServers[0])" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Sticky sessions may not be working. Requests went to $($uniqueServers.Count) different servers:" -ForegroundColor Yellow
    $uniqueServers | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
}
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "For DM calls to work across servers, you need:" -ForegroundColor White
Write-Host "  1. ✅ All backend servers running" -ForegroundColor Gray
Write-Host "  2. ✅ Redis connected on all servers (for Redis adapter)" -ForegroundColor Gray
Write-Host "  3. ✅ Sticky sessions enabled in nginx (ip_hash)" -ForegroundColor Gray
Write-Host "  4. ✅ Users joining their socket rooms (user:userId)" -ForegroundColor Gray
Write-Host ""
Write-Host "If calls still don't work:" -ForegroundColor Yellow
Write-Host "  - Check backend logs for 'call:initiate' and 'call:incoming' events" -ForegroundColor Gray
Write-Host "  - Verify both users are connected (check /debug/connections)" -ForegroundColor Gray
Write-Host "  - Check Redis adapter logs for room join/leave events" -ForegroundColor Gray
Write-Host "  - Ensure LiveKit credentials are configured" -ForegroundColor Gray
Write-Host ""
