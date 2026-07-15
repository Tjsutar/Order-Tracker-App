$ErrorActionPreference = "SilentlyContinue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " IIS Deep Diagnostic Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check if IIS Service (W3SVC) is running
Write-Host "`n[1] Checking core IIS Service..." -ForegroundColor Yellow
$iisService = Get-Service -Name W3SVC
if ($iisService) {
    Write-Host "  [OK] IIS (W3SVC) is installed and status is: $($iisService.Status)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] IIS (W3SVC) is not installed." -ForegroundColor Red
}

# 2. Check Registry for IIS Installation Details
Write-Host "`n[2] Checking IIS Registry Info..." -ForegroundColor Yellow
$inetStp = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\InetStp"
if ($inetStp) {
    Write-Host "  [OK] IIS Version: $($inetStp.MajorVersion).$($inetStp.MinorVersion)" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Could not read IIS version from Registry (Requires Admin)." -ForegroundColor Yellow
}

# 3. Check for URL Rewrite Module
Write-Host "`n[3] Checking for URL Rewrite Module..." -ForegroundColor Yellow
$urlRewrite = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\IIS\Extensions\URLRewrite"
if ($urlRewrite) {
    Write-Host "  [OK] URL Rewrite Module is installed!" -ForegroundColor Green
} else {
    # Backup check via uninstall registry
    $urlRewriteBackup = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object { $_.DisplayName -match "URL Rewrite" }
    if ($urlRewriteBackup) {
        Write-Host "  [OK] URL Rewrite Module is installed (Found in Programs)!" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] URL Rewrite Module not found. (Did you run this as Administrator?)" -ForegroundColor Yellow
    }
}

# 4. Check for Application Request Routing (ARR)
Write-Host "`n[4] Checking for Application Request Routing (ARR)..." -ForegroundColor Yellow
$arr = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\IIS\Extensions\ApplicationRequestRouting"
if ($arr) {
    Write-Host "  [OK] Application Request Routing (ARR) is installed!" -ForegroundColor Green
} else {
    # Backup check via uninstall registry
    $arrBackup = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object { $_.DisplayName -match "Application Request Routing" }
    if ($arrBackup) {
        Write-Host "  [OK] Application Request Routing (ARR) is installed (Found in Programs)!" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Application Request Routing (ARR) not found." -ForegroundColor Yellow
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " Check Complete!" -ForegroundColor Cyan
Write-Host " Reminder: Run PowerShell as 'Administrator' for best results." -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
