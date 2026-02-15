# Load Balancer Manager - Interactive Menu
param(
    [string]$Action
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

function Show-Menu {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║      DISCORD CLONE - LOAD BALANCER MANAGER                ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Start all services" -ForegroundColor White
    Write-Host "2. Stop all services" -ForegroundColor White
    Write-Host "3. Restart all services" -ForegroundColor White
    Write-Host "4. View logs (all)" -ForegroundColor White
    Write-Host "5. View logs (nginx only)" -ForegroundColor White
    Write-Host "6. View logs (backend servers)" -ForegroundColor White
    Write-Host "7. Check health status" -ForegroundColor White
    Write-Host "8. Monitor dashboard" -ForegroundColor White
    Write-Host "9. Test load balancer distribution" -ForegroundColor White
    Write-Host "10. Restart nginx" -ForegroundColor White
    Write-Host "11. Restart backend server" -ForegroundColor White
    Write-Host "12. Scale backend servers" -ForegroundColor White
    Write-Host "13. Clean up (remove volumes)" -ForegroundColor White
    Write-Host "0. Exit" -ForegroundColor White
    Write-Host ""
}

function Start-Services {
    Write-Host "Starting all services..." -ForegroundColor Yellow
    docker-compose up -d --build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services started successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to start services" -ForegroundColor Red
    }
    Pause
}

function Stop-Services {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    docker-compose down
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to stop services" -ForegroundColor Red
    }
    Pause
}

function Restart-Services {
    Write-Host "Restarting all services..." -ForegroundColor Yellow
    docker-compose restart
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services restarted successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to restart services" -ForegroundColor Red
    }
    Pause
}

function View-AllLogs {
    Write-Host "Viewing all logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose logs -f
}

function View-NginxLogs {
    Write-Host "Viewing nginx logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose logs -f nginx
}

function View-BackendLogs {
    Write-Host "Viewing backend logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose logs -f backend-1 backend-2 backend-3
}

function Check-Health {
    & "$scriptPath\check-health.ps1"
    Pause
}

function Start-Monitor {
    & "$scriptPath\monitor.ps1"
}

function Test-LoadBalancer {
    & "$scriptPath\test-lb.ps1"
    Pause
}

function Restart-Nginx {
    Write-Host "Restarting nginx..." -ForegroundColor Yellow
    docker-compose restart nginx
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Nginx restarted successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to restart nginx" -ForegroundColor Red
    }
    Pause
}

function Restart-Backend {
    Write-Host ""
    Write-Host "Which backend server to restart?" -ForegroundColor Cyan
    Write-Host "1. Backend-1" -ForegroundColor White
    Write-Host "2. Backend-2" -ForegroundColor White
    Write-Host "3. Backend-3" -ForegroundColor White
    Write-Host "4. All backends" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Enter choice"
    
    switch ($choice) {
        "1" { docker-compose restart backend-1 }
        "2" { docker-compose restart backend-2 }
        "3" { docker-compose restart backend-3 }
        "4" { docker-compose restart backend-1 backend-2 backend-3 }
        default { Write-Host "Invalid choice" -ForegroundColor Red }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend restarted successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to restart backend" -ForegroundColor Red
    }
    Pause
}

function Scale-Backends {
    Write-Host ""
    Write-Host "Current backend servers: 3" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To add more servers:" -ForegroundColor Yellow
    Write-Host "1. Create .env.server4 (copy from .env.server3)" -ForegroundColor White
    Write-Host "2. Update SERVER_ID and PORT in the new file" -ForegroundColor White
    Write-Host "3. Add backend-4 service to docker-compose.yaml" -ForegroundColor White
    Write-Host "4. Add backend-4:5004 to nginx.conf upstream block" -ForegroundColor White
    Write-Host "5. Run: docker-compose up -d --build" -ForegroundColor White
    Write-Host ""
    Write-Host "See DOCKER_SETUP.md for detailed instructions" -ForegroundColor Cyan
    Pause
}

function Clean-Up {
    Write-Host ""
    Write-Host "WARNING: This will remove all containers, networks, and volumes!" -ForegroundColor Red
    Write-Host "All database data will be lost!" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        Write-Host "Cleaning up..." -ForegroundColor Yellow
        docker-compose down -v
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Cleanup completed!" -ForegroundColor Green
        } else {
            Write-Host "✗ Cleanup failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Cleanup cancelled" -ForegroundColor Yellow
    }
    Pause
}

# Handle command-line action
if ($Action) {
    switch ($Action.ToLower()) {
        "start" { Start-Services; exit }
        "stop" { Stop-Services; exit }
        "restart" { Restart-Services; exit }
        "logs" { View-AllLogs; exit }
        "health" { Check-Health; exit }
        "monitor" { Start-Monitor; exit }
        default { 
            Write-Host "Unknown action: $Action" -ForegroundColor Red
            Write-Host "Available actions: start, stop, restart, logs, health, monitor" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Interactive menu
do {
    Show-Menu
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" { Start-Services }
        "2" { Stop-Services }
        "3" { Restart-Services }
        "4" { View-AllLogs }
        "5" { View-NginxLogs }
        "6" { View-BackendLogs }
        "7" { Check-Health }
        "8" { Start-Monitor }
        "9" { Test-LoadBalancer }
        "10" { Restart-Nginx }
        "11" { Restart-Backend }
        "12" { Scale-Backends }
        "13" { Clean-Up }
        "0" { 
            Write-Host "Goodbye!" -ForegroundColor Cyan
            exit 
        }
        default { 
            Write-Host "Invalid choice. Press any key to continue..." -ForegroundColor Red
            Pause
        }
    }
} while ($true)
