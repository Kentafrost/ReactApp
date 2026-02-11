#!/usr/bin/env pwsh
Write-Host "Running pre-push checks..." -ForegroundColor Cyan

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    # Check React frontend build
    Write-Host "Checking React frontend..." -ForegroundColor Yellow
    Push-Location "$ScriptDir/frontend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ React: Frontend build failed. Push aborted." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✅ React: Frontend build succeeded." -ForegroundColor Green
    Pop-Location

    # Check FastAPI backend syntax
    Write-Host "Checking FastAPI backend..." -ForegroundColor Yellow
    Push-Location "$ScriptDir/backend/routes"

    # Check Python syntax for main.py
    python -m py_compile main.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ FastAPI: Syntax error in main.py. Push aborted." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✅ FastAPI: main.py syntax check passed." -ForegroundColor Green

    # Check if FastAPI app can be imported (dry run)
    Copy-Item "$ScriptDir/test_import.py" -Destination "./test_import.py"
    python test_import.py
    Remove-Item "test_import.py" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ FastAPI: App import failed. Push aborted." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✅ FastAPI: App import check passed." -ForegroundColor Green
    Pop-Location

    Write-Host "🎉 All checks passed. Proceeding with push." -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "❌ An error occurred: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Ensure we're back to the original location
    Pop-Location -ErrorAction SilentlyContinue
}