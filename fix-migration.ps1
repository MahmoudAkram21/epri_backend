# Fix Migration Drift Script
# Run this from the backend directory

Write-Host "Resolving migration drift..." -ForegroundColor Yellow

# Resolve the drift by marking the migration as applied
npx prisma migrate resolve --applied 20251029145746_remove_regular_role

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration drift resolved successfully!" -ForegroundColor Green
    Write-Host "Regenerating Prisma Client..." -ForegroundColor Yellow
    npm run prisma:generate
    Write-Host "Done! You can now run your server." -ForegroundColor Green
} else {
    Write-Host "Failed to resolve drift. You may need to reset the database." -ForegroundColor Red
    Write-Host "Run: npm run prisma:migrate reset" -ForegroundColor Yellow
}

