$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Building and Deploying Order Tracker..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Install dependencies (just in case they changed)
Write-Host "`n[1/3] Installing dependencies..." -ForegroundColor Yellow
npm install

# 2. Build the production Next.js bundle
Write-Host "`n[2/3] Building Next.js production bundle..." -ForegroundColor Yellow
npm run build

# 3. Start or Restart PM2
Write-Host "`n[3/3] Starting/Restarting application with PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js
pm2 save

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " To view logs in real-time, run: pm2 logs order-tracker" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
