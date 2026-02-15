# Real-time Monitoring Dashboard
Write-Host "Starting monitoring dashboard..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to exit" -ForegroundColor Yellow
Write-Host ""

# Navigate to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

while ($true) {
    Clear-Host
    
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         DISCORD CLONE - LOAD BALANCER MONITOR             ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Last Updated: $timestamp" -ForegroundColor Gray
    Write-Host ""
    
    # Container Status
    Write-Host "=== Container Status ===" -ForegroundColor Yellow
    $containers = docker-compose ps --format json | ConvertFrom-Json
    
    foreach ($container in $containers) {
        $name = $container.Service
        $state = $container.State
        
        if ($state -eq "running") {
            Write-Host "  ✓ $name" -ForegroundColor Green -NoNewline
            Write-Host " - Running" -ForegroundColor Gray
        } else {
            Write-Host "  ✗ $name" -ForegroundColor Red -NoNewline
            Write-Host " - $state" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # Resource Usage
    Write-Host "=== Resource Usage ===" -ForegroundColor Yellow
    $stats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | Select-Object -Skip 1
    
    foreach ($line in $stats) {
        if ($line -match "backend|nginx|postgres|redis|kafka") {
            Write-Host "  $line" -ForegroundColor White
        }
    }
    
    Write-Host ""
    
    # Load Balancer Health
    Write-Host "=== Load Balancer Health ===" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 2
        Write-Host "  ✓ Nginx Load Balancer: " -ForegroundColor Green -NoNewline
        Write-Host "Healthy (Status: $($response.StatusCode))" -ForegroundColor Gray
    } catch {
        Write-Host "  ✗ Nginx Load Balancer: " -ForegroundColor Red -NoNewline
        Write-Host "Unhealthy" -ForegroundColor Red
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -TimeoutSec 2
        Write-Host "  ✓ Frontend: " -ForegroundColor Green -NoNewline
        Write-Host "Healthy (Status: $($response.StatusCode))" -ForegroundColor Gray
    } catch {
        Write-Host "  ✗ Frontend: " -ForegroundColor Red -NoNewline
        Write-Host "Unhealthy" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Recent Logs
    Write-Host "=== Recent Activity (Last 5 lines) ===" -ForegroundColor Yellow
    $logs = docker-compose logs --tail=5 --no-log-prefix 2>&1 | Select-Object -Last 5
    foreach ($log in $logs) {
        Write-Host "  $log" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Press Ctrl+C to exit..." -ForegroundColor DarkGray
    
    Start-Sleep -Seconds 5
}
