$ErrorActionPreference = "SilentlyContinue"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Order Tracker - Windows Server Readiness Check" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Memory (RAM)
Write-Host "[1/5] Checking Memory (RAM)..." -ForegroundColor Yellow
$comp = Get-CimInstance Win32_OperatingSystem
$TotalRAM = [math]::Round($comp.TotalVisibleMemorySize / 1MB, 2)
$FreeRAM = [math]::Round($comp.FreePhysicalMemory / 1MB, 2)

Write-Host "  Total RAM: ${TotalRAM} GB"
Write-Host "  Free RAM:  ${FreeRAM} GB"

if ($TotalRAM -lt 4) {
    Write-Host "  [WARNING] Server has less than 4GB of RAM. Running PostgreSQL and Node.js together might be tight." -ForegroundColor Red
} else {
    Write-Host "  [OK] RAM is sufficient." -ForegroundColor Green
}
Write-Host ""

# 2. Check CPU
Write-Host "[2/5] Checking CPU..." -ForegroundColor Yellow
$cpu = Get-CimInstance Win32_Processor
Write-Host "  CPU: $($cpu.Name)"
Write-Host "  Logical Cores: $($cpu.NumberOfLogicalProcessors)"
if ($cpu.NumberOfLogicalProcessors -lt 2) {
    Write-Host "  [WARNING] Only 1 CPU core detected. 2+ cores are highly recommended for web servers." -ForegroundColor Red
} else {
    Write-Host "  [OK] CPU is sufficient." -ForegroundColor Green
}
Write-Host ""

# 3. Check Disk Space
Write-Host "[3/5] Checking Disk Space (C: Drive)..." -ForegroundColor Yellow
$disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
if ($disk) {
    $FreeSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
    $TotalSpace = [math]::Round($disk.Size / 1GB, 2)
    Write-Host "  Total Space: ${TotalSpace} GB"
    Write-Host "  Free Space:  ${FreeSpace} GB"

    if ($FreeSpace -lt 10) {
        Write-Host "  [WARNING] Less than 10GB free space on C: drive. (Watch out if storing lots of PDFs locally)" -ForegroundColor Red
    } else {
        Write-Host "  [OK] Disk space is sufficient." -ForegroundColor Green
    }
} else {
    Write-Host "  [WARNING] Could not check C: drive." -ForegroundColor Yellow
}
Write-Host ""

# 4. Check Node.js & NPM
Write-Host "[4/5] Checking Node.js Dependencies..." -ForegroundColor Yellow
$nodeVer = node -v
if ($?) {
    Write-Host "  [OK] Node.js is installed: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Node.js is NOT installed or not in System PATH." -ForegroundColor Red
}

$npmVer = npm -v
if ($?) {
    Write-Host "  [OK] NPM is installed: v$npmVer" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] NPM is NOT installed or not in System PATH." -ForegroundColor Red
}
Write-Host ""

# 5. Check PostgreSQL
Write-Host "[5/5] Checking PostgreSQL Database..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "  [OK] PostgreSQL Service found: $($pgService.Name) ($($pgService.Status))" -ForegroundColor Green
} else {
    $portCheck = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if ($portCheck.TcpTestSucceeded) {
        Write-Host "  [OK] Something is listening on port 5432 (likely PostgreSQL)." -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] PostgreSQL service not found and port 5432 is closed." -ForegroundColor Yellow
        Write-Host "            (This is fine if you are using an external hosted database URL in your .env file)" -ForegroundColor Gray
    }
}
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Check Complete!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
