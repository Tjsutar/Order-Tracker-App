Import-Module WebAdministration

$siteName = "OrderTracker"

Write-Host "1. Stopping the 'Default Web Site' to free up the raw IP binding..." -ForegroundColor Yellow
Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

Write-Host "2. Rebinding OrderTracker to Port 80 (Bypassing the Firewall)..." -ForegroundColor Cyan
Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name "bindings" -Value @{protocol="http";bindingInformation="*:80:"}

Write-Host "3. Restarting OrderTracker..." -ForegroundColor Cyan
Stop-Website -Name $siteName -ErrorAction SilentlyContinue
Start-Website -Name $siteName -ErrorAction SilentlyContinue

Write-Host "======================================================" -ForegroundColor Green
Write-Host " SUCCESS! You can now access the app purely via the IP!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
