# PowerShell script to generate self-signed SSL certificate for development
# Usage: .\generate-cert.ps1

$certsDir = Join-Path $PSScriptRoot "certs"

# Create certs directory if it doesn't exist
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
    Write-Host "✅ Created certs directory" -ForegroundColor Green
}

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if (-not $opensslPath) {
    Write-Host "❌ OpenSSL not found. Please install OpenSSL:" -ForegroundColor Red
    Write-Host "   1. Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "   2. Or install via Chocolatey: choco install openssl" -ForegroundColor Yellow
    Write-Host "   3. Or use mkcert (recommended for development): choco install mkcert" -ForegroundColor Yellow
    exit 1
}

$certPath = Join-Path $certsDir "cert.pem"
$keyPath = Join-Path $certsDir "key.pem"

Write-Host "🔐 Generating self-signed certificate..." -ForegroundColor Cyan
Write-Host "   Certificate: $certPath" -ForegroundColor Gray
Write-Host "   Private Key: $keyPath" -ForegroundColor Gray

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -nodes `
    -keyout $keyPath `
    -out $certPath `
    -days 365 `
    -subj "/C=US/ST=State/L=City/O=EPRI/CN=localhost"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Certificate generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Add to your .env file:" -ForegroundColor Yellow
    Write-Host "      ENABLE_HTTPS=true" -ForegroundColor White
    Write-Host "   2. Restart your server" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Note: Browsers will show a security warning for self-signed certificates." -ForegroundColor Yellow
    Write-Host "   This is normal for development. Click 'Advanced' → 'Proceed to localhost'" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to generate certificate" -ForegroundColor Red
    exit 1
}

