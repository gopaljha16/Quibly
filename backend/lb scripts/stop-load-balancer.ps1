# Stop Load Balancer Setup
Write-Host "Stopping all services..." -ForegroundColor Yellow

# Navigate to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ All services stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Failed to stop services." -ForegroundColor Red
    exit 1
}
