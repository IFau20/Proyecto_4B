# PC Tracker - Windows PowerShell local demo launcher
# Run from the repo with: powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root "frontend\package.json"))) {
    throw "Cannot locate PC Tracker frontend. Run this script from the cloned repository."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\nodejs\node.exe") {
        $env:Path += ";C:\Program Files\nodejs"
    }
}
foreach ($command in @("node", "npm.cmd", "deno")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $command. Install Node.js LTS and Deno 2."
    }
}
$configuration = Join-Path $root "backend\.env"
if (-not (Test-Path $configuration)) {
    Copy-Item (Join-Path $root "backend\.env.example") $configuration
    Write-Host "Microsoft login is not configured. Run .\scripts\configure-sso.ps1 after registering the Entra app."
}
Write-Host "Installing PC Tracker frontend dependencies..."
Push-Location (Join-Path $root "frontend")
try { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw "npm ci failed" } }
finally { Pop-Location }
Write-Host "Launching Deno backend and Vite frontend..."
Start-Process powershell.exe -WorkingDirectory (Join-Path $root "backend") -ArgumentList @("-NoExit", "-Command", "deno task dev")
Start-Process powershell.exe -WorkingDirectory (Join-Path $root "frontend") -ArgumentList @("-NoExit", "-Command", "npm.cmd run dev")
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"
Write-Host "PC Tracker opened. Close both new PowerShell windows to stop the servers."
