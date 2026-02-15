# Simple Load Balancer Test
Write-Host "Testing Load Balancer Distribution..." -ForegroundColor Cyan
Write-Host ""

# Check if nginx is running
$nginxRunning = docker ps --filter "name=nginx-lb" --format "{{.Names}}" 2>$null
if (-not $nginxRunning) {
    Write-Host "Error: Nginx is not running!" -ForegroundColor Red
    Write-Host "Start with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Making 10 requests to http://localhost:5000/api/health" -ForegroundColor Yellow
Write-Host ""

$serverCounts = @{}

for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
        
        $serverId = $response.Headers["X-Server-ID"]
        $upstream = $response.Headers["X-Upstream-Server"]
        
        if ($upstream) {
            if (-not $serverCounts.ContainsKey($upstream)) {
                $serverCounts[$upstream] = 0
            }
            $serverCounts[$upstream]++
            
            Write-Host "Request $i : " -NoNewline
            Write-Host "$upstream" -ForegroundColor Green -NoNewline
            Write-Host " (ID: $serverId)" -ForegroundColor Cyan
        } else {
            Write-Host "Request $i : No server info" -ForegroundColor Yellow
        }
        
        Start-Sleep -Milliseconds 100
    } catch {
        Write-Host "Request $i : FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Distribution Summary:" -ForegroundColor Yellow
foreach ($server in $serverCounts.Keys | Sort-Object) {
    $count = $serverCounts[$server]
    Write-Host "  $server : $count requests" -ForegroundColor White
}

Write-Host ""
Write-Host "Note: With IP hash, all requests from your IP go to the same server." -ForegroundColor Gray
Write-Host "This is correct behavior for sticky sessions!" -ForegroundColor Gray
