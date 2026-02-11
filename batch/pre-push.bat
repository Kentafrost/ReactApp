@echo off
echo Running pre-push checks...

set SCRIPT_DIR=%~dp0

:: Check React frontend build
echo Checking React frontend...
cd /d "%SCRIPT_DIR%frontend"
call npm run build
if errorlevel 1 (
    echo ❌ React: Frontend build failed. Push aborted.
    exit /b 1
)
echo ✅ React: Frontend build succeeded.

:: Check FastAPI backend syntax
echo Checking FastAPI backend...
cd /d "%SCRIPT_DIR%backend\routes"

:: Check Python syntax for main.py
python -m py_compile main.py
if errorlevel 1 (
    echo ❌ FastAPI: Syntax error in main.py. Push aborted.
    exit /b 1
)
echo ✅ FastAPI: main.py syntax check passed.

:: Check if FastAPI app can be imported (dry run)
copy "%SCRIPT_DIR%test_import.py" .\test_import.py
python test_import.py
del test_import.py
if errorlevel 1 (
    echo ❌ FastAPI: App import failed. Push aborted.
    exit /b 1
)
echo ✅ FastAPI: App import check passed.

echo 🎉 All checks passed. Proceeding with push.
exit /b 0