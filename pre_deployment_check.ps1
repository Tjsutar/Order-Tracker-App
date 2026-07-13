$ErrorActionPreference = "SilentlyContinue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Order Tracker - Advanced Pre-Deployment Server Check" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. System Info
Write-Host "[1/7] System Information" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
Write-Host "  OS: $($os.Caption) $($os.OSArchitecture)"

$comp = Get-CimInstance Win32_OperatingSystem
$TotalRAM = [math]::Round($comp.TotalVisibleMemorySize / 1MB, 2)
Write-Host "  Total RAM: ${TotalRAM} GB"

$cpu = Get-CimInstance Win32_Processor
Write-Host "  CPU Cores: $($cpu.NumberOfLogicalProcessors) logical processors"

$disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
$FreeSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
Write-Host "  Free C: Drive Space: ${FreeSpace} GB"
Write-Host ""

# 2. Node.js Ecosystem
Write-Host "[2/7] Checking Node.js Ecosystem..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] Node.js is installed: $(node -v)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Node.js is NOT installed." -ForegroundColor Red
}

if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] PM2 is installed globally: $(pm2 -v)" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] PM2 is NOT installed globally. Run: npm install -g pm2" -ForegroundColor Red
}
Write-Host ""

# 3. Git & CI/CD
Write-Host "[3/7] Checking Git (Required for GitHub Runner)..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVer = git --version
    Write-Host "  [OK] Git is installed: $gitVer" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Git is NOT installed. Must be installed for CI/CD." -ForegroundColor Red
}
Write-Host ""

# 4. PostgreSQL
Write-Host "[4/7] Checking PostgreSQL Database..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "  [OK] PostgreSQL Service found: $($pgService.Name) ($($pgService.Status))" -ForegroundColor Green
} else {
    $portCheck = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if ($portCheck.TcpTestSucceeded) {
        Write-Host "  [OK] Port 5432 is active (Likely PostgreSQL)." -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] PostgreSQL service not found locally." -ForegroundColor Yellow
    }
}
Write-Host ""

# 5. IIS (Reverse Proxy) Check
Write-Host "[5/7] Checking IIS (Internet Information Services)..." -ForegroundColor Yellow
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
if ($iisFeature -and $iisFeature.Installed) {
    Write-Host "  [OK] IIS is installed." -ForegroundColor Green
    
    $arrFeature = Get-WebConfiguration -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  [OK] Application Request Routing (ARR) / URL Rewrite module seems active." -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] URL Rewrite / ARR module may not be installed. Needed for Reverse Proxy." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARNING] IIS is NOT installed. You will need a Reverse Proxy like IIS or Nginx to serve on Port 80/443." -ForegroundColor Yellow
}
Write-Host ""

# 6. Checking Open Ports (Listening Status)
Write-Host "[6/7] Checking Listening Ports..." -ForegroundColor Yellow

function Check-Port {
    param($port, $serviceName)
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "  [ACTIVE] Port $port is actively listening ($serviceName)." -ForegroundColor Green
    } else {
        Write-Host "  [INACTIVE] Port $port is not currently in use ($serviceName)." -ForegroundColor Gray
    }
}

Check-Port 80 "HTTP (IIS/Nginx)"
Check-Port 443 "HTTPS (IIS/Nginx)"
Check-Port 3000 "Node.js/PM2 Default"
Write-Host ""

# 7. Firewall Rules (Windows Firewall)
Write-Host "[7/7] Checking Windows Firewall Rules..." -ForegroundColor Yellow
function Check-FirewallRule {
    param($port)
    $rule = Get-NetFirewallRule | Where-Object { $_.Enabled -eq "True" -and $_.Direction -eq "Inbound" } | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq $port }
    if ($rule) {
        Write-Host "  [OK] Found Inbound Firewall Rule allowing Port $port." -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] No active Windows Firewall inbound rule found for Port $port." -ForegroundColor Yellow
    }
}

Check-FirewallRule 80
Check-FirewallRule 443
Write-Host ""

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Pre-Deployment Check Complete!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
