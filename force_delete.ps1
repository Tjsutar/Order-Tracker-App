$folderPath = "C:\ShortcutPOS"

Write-Host "Forcefully stopping locking processes..." -ForegroundColor Yellow

# Kill the specific processes we found earlier
Stop-Process -Id 4508 -Force -ErrorAction SilentlyContinue
Write-Host "Killed Notepad (PID 4508)" -ForegroundColor Green

# Note: If you run this script FROM the PowerShell window with PID 13100, 
# it will close your window immediately before deleting the folder!
Stop-Process -Id 13100 -Force -ErrorAction SilentlyContinue
Write-Host "Killed blocking PowerShell (PID 13100)" -ForegroundColor Green

# Give Windows a second to release the file handles
Start-Sleep -Seconds 2

if (Test-Path $folderPath) {
    Write-Host "Attempting to delete $folderPath..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $folderPath -Recurse -Force
        Write-Host "Successfully deleted $folderPath!" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to delete folder. It might still be locked by another program." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Folder $folderPath does not exist (already deleted)." -ForegroundColor Cyan
}
