Import-Module WebAdministration

$siteName = "OrderTracker"
$appPoolName = "OrderTrackerPool"
$folderPath = "C:\Order-Tracker-App"

Write-Host "1. Creating dedicated App Pool '$appPoolName'..." -ForegroundColor Cyan
if (!(Test-Path "IIS:\AppPools\$appPoolName")) {
    New-WebAppPool -Name $appPoolName
}

# Set to No Managed Code (this is a Node app, so .NET just gets in the way)
Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue

Write-Host "2. Assigning Site to the new App Pool..." -ForegroundColor Cyan
Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name "applicationPool" -Value $appPoolName

Write-Host "3. Granting IIS permissions to read the folder..." -ForegroundColor Cyan
$acl = Get-Acl $folderPath
$permission = "BUILTIN\IIS_IUSRS","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl -Path $folderPath -AclObject $acl

Write-Host "4. Forcing Site and App Pool Restart..." -ForegroundColor Cyan
Stop-Website -Name $siteName -ErrorAction SilentlyContinue
Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
Start-Website -Name $siteName -ErrorAction SilentlyContinue

Write-Host "========================================" -ForegroundColor Green
Write-Host " Fixed! The 503 error should be gone." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
