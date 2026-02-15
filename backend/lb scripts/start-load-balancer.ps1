# Start Load Balancer Setup with Docker Compose
Write-Host "Starting Discord Clone with Nginx Load Balancer..." -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "`nBuilding and starting services..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Services started successfully!" -ForegroundColor Green
    Write-Host "`nService URLs:" -ForegroundColor Cyan
    Write-Host "  - Application (Frontend + API): http://localhost" -ForegroundColor White
    Write-Host "  - Kafka UI: http://localhost:8080" -ForegroundColor White
    Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
    Write-Host "  - Redis: localhost:6379" -ForegroundColor White
    
    Write-Host "`nURL Routing:" -ForegroundColor Cyan
    Write-Host "  - http://localhost/ → Frontend (Next.js)" -ForegroundColor White
    Write-Host "  - http://localhost/api/* → Backend Servers (Load Balanced)" -ForegroundColor White
    Write-Host "  - http://localhost/socket.io/* → Backend WebSocket" -ForegroundColor White
    
    Write-Host "`nBackend Servers (internal):" -ForegroundColor Cyan
    Write-Host "  - Backend 1: backend-1:5001" -ForegroundColor White
    Write-Host "  - Backend 2: backend-2:5002" -ForegroundColor White
    Write-Host "  - Backend 3: backend-3:5003" -ForegroundColor White
    
    Write-Host "`nUseful Commands:" -ForegroundColor Cyan
    Write-Host "  - View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "  - Stop services: docker-compose down" -ForegroundColor White
    Write-Host "  - Restart Nginx: docker-compose restart nginx" -ForegroundColor White
    Write-Host "  - Check status: docker-compose ps" -ForegroundColor White
} else {
    Write-Host "`n✗ Failed to start services. Check the logs above." -ForegroundColor Red
    exit 1
}
