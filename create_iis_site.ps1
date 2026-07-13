Import-Module WebAdministration

$siteName = "OrderTracker"
$port = 8080
$physicalPath = "C:\Order-Tracker-App"

Write-Host "Checking for existing site..." -ForegroundColor Yellow
if (Get-Website | Where-Object { $_.Name -eq $siteName }) {
    Write-Host "Site '$siteName' already exists. Removing it to recreate cleanly..." -ForegroundColor Yellow
    Remove-Website -Name $siteName
}

Write-Host "Creating new IIS Website '$siteName' on Port $port..." -ForegroundColor Cyan
New-Website -Name $siteName -Port $port -PhysicalPath $physicalPath -ApplicationPool "DefaultAppPool"

Write-Host "Starting the website..." -ForegroundColor Cyan
Start-Website -Name $siteName

Write-Host "=============================================" -ForegroundColor Green
Write-Host " Done! IIS is now forced to listen on port 8080" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
