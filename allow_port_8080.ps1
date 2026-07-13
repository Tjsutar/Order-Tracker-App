Write-Host "Checking Windows Firewall Rules..." -ForegroundColor Yellow

# Remove any old broken rules
Remove-NetFirewallRule -DisplayName "Order Tracker App" -ErrorAction SilentlyContinue

Write-Host "Opening TCP Port 8080 for all Incoming Traffic..." -ForegroundColor Cyan

# Create a master allow rule for Port 8080
New-NetFirewallRule -DisplayName "Order Tracker App" `
                    -Direction Inbound `
                    -LocalPort 8080 `
                    -Protocol TCP `
                    -Action Allow `
                    -Profile Any `
                    -Description "Allows incoming traffic to the Order Tracker App"

Write-Host "===========================================================" -ForegroundColor Green
Write-Host " SUCCESS: Port 8080 is now forced open on the Windows Firewall!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
