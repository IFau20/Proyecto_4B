# Configure the registered Microsoft Entra Web application locally.
# No secrets are printed or sent to GitHub. backend/.env is ignored by git.
param(
    [string]$TenantId,
    [string]$ClientId
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root "backend\.env"
$existing = @()
if (Test-Path $destination) {
    $existing = @(Get-Content $destination)
    if ($existing -match '^\s*MICROSOFT_CLIENT_ID\s*=\s*["'']?[0-9a-fA-F]{8}-') {
        throw "An SSO configuration already exists in backend/.env. Edit that file to update it."
    }
}
Write-Host "Register a Web application in Microsoft Entra first."
Write-Host "Callback: http://localhost:8000/api/auth/callback"
if (-not $TenantId) { $TenantId = Read-Host "Directory (tenant) ID" }
if (-not $ClientId) { $ClientId = Read-Host "Application (client) ID" }
foreach ($value in @($TenantId, $ClientId)) {
    $parsed = [Guid]::Empty
    if (-not [Guid]::TryParse($value, [ref]$parsed) -or $parsed -eq [Guid]::Empty) {
        throw "Tenant and client IDs must be valid non-empty GUIDs."
    }
}
$secret = Read-Host "Client secret VALUE (hidden)" -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    if ([string]::IsNullOrWhiteSpace($plain) -or $plain.Contains("`n") -or $plain.Contains("`r")) {
        throw "A non-empty, single-line client secret is required."
    }
    $encodedSecret = ConvertTo-Json -InputObject $plain -Compress
    $lines = @(
        "MICROSOFT_TENANT_ID=$TenantId",
        "MICROSOFT_CLIENT_ID=$ClientId",
        "MICROSOFT_CLIENT_SECRET=$encodedSecret",
        "APP_PUBLIC_ORIGIN=http://localhost:5173",
        "AUTH_REDIRECT_URI=http://localhost:8000/api/auth/callback"
    )
    $preserved = @($existing | Where-Object { $_ -notmatch '^\s*(MICROSOFT_TENANT_ID|MICROSOFT_CLIENT_ID|MICROSOFT_CLIENT_SECRET|APP_PUBLIC_ORIGIN|AUTH_REDIRECT_URI)\s*=' })
    [IO.File]::WriteAllLines($destination, @($preserved) + @($lines), (New-Object Text.UTF8Encoding($false)))
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    $plain = $null
    $encodedSecret = $null
}
Write-Host "Local configuration saved. Restart PC Tracker, then use Iniciar sesion."
Write-Host "To check configuration: cd backend; deno task auth:status"
