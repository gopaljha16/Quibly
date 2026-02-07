# Start Backend Server 2 on port 5002
Write-Host "Starting Backend Server 2 (PORT 5002)..." -ForegroundColor Yellow

# Copy server 2 config
Copy-Item .env.server2 .env -Force

# Start the server
npm run dev:only
