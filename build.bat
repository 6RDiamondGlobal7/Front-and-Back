@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%Front-end-HR"

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Could not find Front-end-HR\package.json
  echo Expected path: "%FRONTEND_DIR%"
  pause
  exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found in PATH.
  echo Install Node.js and try again.
  pause
  exit /b 1
)

net session >nul 2>&1
if errorlevel 1 (
  echo [WARNING] Not running as Administrator.
  echo If electron-builder fails with symlink privilege errors,
  echo run this file as Administrator or enable Windows Developer Mode.
  echo.
)

pushd "%FRONTEND_DIR%"
if errorlevel 1 (
  echo [ERROR] Failed to enter "%FRONTEND_DIR%"
  pause
  exit /b 1
)

echo [INFO] Running production build...
call npm.cmd run electron:build
set "BUILD_EXIT=%ERRORLEVEL%"

popd

if not "%BUILD_EXIT%"=="0" (
  echo.
  echo [ERROR] Build failed with exit code %BUILD_EXIT%.
  pause
  exit /b %BUILD_EXIT%
)

echo.
echo [SUCCESS] Build completed.
echo Installer location:
echo %FRONTEND_DIR%\release
pause
exit /b 0
