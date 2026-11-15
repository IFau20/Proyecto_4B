# Configure the registered Google OAuth Web application locally.
# No secrets are printed or sent to GitHub. backend/.env is ignored by git.
param(
    [string]$ClientId
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root "backend\.env"
$existing = @()
if (Test-Path $destination) {
    $existing = @(Get-Content $destination)
    if ($existing -match '^\s*GOOGLE_CLIENT_ID\s*=\s*["'']?[A-Za-z0-9_-]+\.apps\.googleusercontent\.com') {
        throw "A Google SSO configuration already exists in backend/.env. Edit that file to update it."
    }
}
Write-Host "Register a Web OAuth client in Google Auth Platform first."
Write-Host "Callback: http://localhost:8000/api/auth/callback"
if (-not $ClientId) { $ClientId = Read-Host "Google OAuth client ID" }
if ($ClientId -notmatch '^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$') {
    throw "Use the Web client ID ending in .apps.googleusercontent.com."
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
        "AUTH_PROVIDER=google",
        "GOOGLE_CLIENT_ID=$ClientId",
        "GOOGLE_CLIENT_SECRET=$encodedSecret",
        "APP_PUBLIC_ORIGIN=http://localhost:5173",
        "AUTH_REDIRECT_URI=http://localhost:8000/api/auth/callback"
    )
    $preserved = @($existing | Where-Object { $_ -notmatch '^\s*(AUTH_PROVIDER|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|APP_PUBLIC_ORIGIN|AUTH_REDIRECT_URI)\s*=' })
    [IO.File]::WriteAllLines($destination, @($preserved) + @($lines), (New-Object Text.UTF8Encoding($false)))
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    $plain = $null
    $encodedSecret = $null
}
Write-Host "Local configuration saved. Restart PC Tracker, then use Continuar con Google."
Write-Host "To check configuration: cd backend; deno task auth:status"
