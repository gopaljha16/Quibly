# Start Backend Server 3 on port 5003
Write-Host "Starting Backend Server 3 (PORT 5003)..." -ForegroundColor Cyan

# Copy server 3 config
Copy-Item .env.server3 .env -Force

# Start the server
npm run dev:only
