# Script to find exactly what process is locking a folder/file.
# We will use Microsoft's official Sysinternals 'handle64' tool.

param (
    [string]$TargetFolder = "ShortcutPOS" # You can change this to the full path if needed, e.g. "C:\inetpub\ShortcutPOS"
)

$handleTool = "$env:TEMP\handle64.exe"

# 1. Download handle64.exe directly from Microsoft's live Sysinternals server if we don't have it
if (-not (Test-Path $handleTool)) {
    Write-Host "Downloading Microsoft Sysinternals handle64.exe..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "https://live.sysinternals.com/handle64.exe" -OutFile $handleTool
}

# 2. Run the tool to search for the specific folder name
Write-Host "`nScanning system to find what program is holding '$TargetFolder'..." -ForegroundColor Yellow
Write-Host "(Note: You must run this script as Administrator to see all processes!)`n" -ForegroundColor Gray

& $handleTool -accepteula -nobanner $TargetFolder

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "If a program is listed above, you need to close it (or stop its service) before you can delete the folder." -ForegroundColor White
