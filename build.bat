@echo off
setlocal

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo ===============================================
echo  6R Diamond Recruitment System Build
echo ===============================================
echo [INFO] This build checks:
echo [INFO] - Front-end-Applicant production build
echo [INFO] - Back-end dependencies and syntax
echo [INFO] - Front-end-HR Electron installer build
echo [INFO] Local .env files are required but remain ignored by Git.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  echo Install Node.js LTS, then re-run this script.
  pause
  exit /b 1
)

echo [INFO] Launching build.runner.cjs ...
pushd "%ROOT_DIR%"
call node build.runner.cjs
set "BUILD_EXIT=%ERRORLEVEL%"
popd

if not "%BUILD_EXIT%"=="0" (
  echo.
  echo [ERROR] Build failed with exit code %BUILD_EXIT%.
  pause
  exit /b %BUILD_EXIT%
)

pause
exit /b 0
