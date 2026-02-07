# Load Balancer Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Load Balancer Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Nginx is running
Write-Host "[Test 1] Checking if Nginx is running on port 8000..." -ForegroundColor Yellow
$nginxRunning = netstat -an | Select-String ":8000.*LISTENING"
if ($nginxRunning) {
    Write-Host "✅ Nginx is running on port 8000" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx is NOT running on port 8000" -ForegroundColor Red
    Write-Host "   Run: nginx" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Check individual backend servers
Write-Host "[Test 2] Checking individual backend servers..." -ForegroundColor Yellow

$ports = @(5001, 5002, 5003)
$serverNames = @("Server 1", "Server 2", "Server 3")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $name = $serverNames[$i]
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -TimeoutSec 2
        if ($response.status -eq "healthy") {
            Write-Host "✅ $name (port $port) - Status: $($response.status) - ServerID: $($response.serverId)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $name (port $port) - Status: $($response.status)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $name (port $port) - NOT RUNNING" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Check load balancer distribution
Write-Host "[Test 3] Testing load balancer distribution (5 requests)..." -ForegroundColor Yellow

$serverHits = @{}
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2
        $serverId = $response.serverId
        
        if ($serverHits.ContainsKey($serverId)) {
            $serverHits[$serverId]++
        } else {
            $serverHits[$serverId] = 1
        }
        
        Write-Host "  Request $i → $serverId" -ForegroundColor Gray
    } catch {
        Write-Host "  Request $i → FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Distribution Summary:" -ForegroundColor Cyan
foreach ($server in $serverHits.Keys) {
    Write-Host "  $server : $($serverHits[$server]) requests" -ForegroundColor White
}
Write-Host ""

# Test 4: Check Redis connection
Write-Host "[Test 4] Checking Redis connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2
    if ($response.services.redis -eq $true) {
        Write-Host "✅ Redis is connected" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis is NOT connected" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not check Redis status" -ForegroundColor Red
}
Write-Host ""

# Test 5: Check Kafka connection
Write-Host "[Test 5] Checking Kafka connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2
    if ($response.services.kafka -eq $true) {
        Write-Host "✅ Kafka is connected" -ForegroundColor Green
    } else {
        Write-Host "❌ Kafka is NOT connected" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not check Kafka status" -ForegroundColor Red
}
Write-Host ""

# Test 6: Check batch writer leader
Write-Host "[Test 6] Checking batch writer leader election..." -ForegroundColor Yellow

$leaderCount = 0
$leaderServer = ""

foreach ($port in $ports) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -TimeoutSec 2
        if ($response.batchWriterLeader -eq $true) {
            $leaderCount++
            $leaderServer = $response.serverId
        }
    } catch {
        # Server not running
    }
}

if ($leaderCount -eq 1) {
    Write-Host "✅ Exactly ONE batch writer leader: $leaderServer" -ForegroundColor Green
} elseif ($leaderCount -eq 0) {
    Write-Host "⚠️  NO batch writer leader found" -ForegroundColor Yellow
} else {
    Write-Host "❌ MULTIPLE batch writer leaders found ($leaderCount)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Check Docker services
Write-Host "[Test 7] Checking Docker services..." -ForegroundColor Yellow

$dockerServices = @("postgres", "redis", "kafka", "zookeeper")
foreach ($service in $dockerServices) {
    $running = docker ps --filter "name=$service" --format "{{.Names}}" 2>$null
    if ($running) {
        Write-Host "✅ Docker service '$service' is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker service '$service' is NOT running" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests pass, your load balancer setup is working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "2. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "3. Login and test messaging" -ForegroundColor White
Write-Host "4. Check all 3 backend terminals for message logs" -ForegroundColor White
Write-Host ""
