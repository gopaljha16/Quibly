# Health Check Script for Load Balanced Setup
Write-Host "Checking service health..." -ForegroundColor Cyan

# Navigate to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "`n=== Docker Services Status ===" -ForegroundColor Yellow
docker-compose ps

Write-Host "`n=== Testing Load Balancer ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Nginx Load Balancer: OK (Port 80)" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Nginx Load Balancer: FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing Frontend ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend: FAILED" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing Backend Servers ===" -ForegroundColor Yellow

# Check each backend through the load balancer
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 2
        Write-Host "Request $i : Status $($response.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "Request $i : FAILED" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

Write-Host "`n=== Database Connection ===" -ForegroundColor Yellow
try {
    $pgTest = docker exec discord_build-postgres-1 pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL: OK (Port 5433)" -ForegroundColor Green
    } else {
        Write-Host "✗ PostgreSQL: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ PostgreSQL: Container not found" -ForegroundColor Red
}

Write-Host "`n=== Redis Connection ===" -ForegroundColor Yellow
try {
    $redisTest = docker exec redis redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✓ Redis: OK (Port 6379)" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Redis: Container not found" -ForegroundColor Red
}

Write-Host "`n=== Kafka Connection ===" -ForegroundColor Yellow
try {
    $kafkaTest = docker exec discord_build-kafka-1 kafka-broker-api-versions --bootstrap-server localhost:9092 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Kafka: OK (Port 9092)" -ForegroundColor Green
    } else {
        Write-Host "✗ Kafka: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Kafka: Container not found" -ForegroundColor Red
}

Write-Host "`n=== Service URLs ===" -ForegroundColor Yellow
Write-Host "  - Application: http://localhost" -ForegroundColor White
Write-Host "  - API: http://localhost/api/*" -ForegroundColor White
Write-Host "  - Kafka UI: http://localhost:8080" -ForegroundColor White
Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
Write-Host "  - Redis: localhost:6379" -ForegroundColor White

Write-Host "`nHealth check complete!" -ForegroundColor Cyan
