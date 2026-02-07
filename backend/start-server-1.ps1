# Start Backend Server 1 on port 5001
Write-Host "Starting Backend Server 1 (PORT 5001)..." -ForegroundColor Green

# Copy server 1 config
Copy-Item .env.server1 .env -Force

# Start the server
npm run dev:only
