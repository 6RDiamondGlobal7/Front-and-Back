@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%Front-end-HR"
set "APPLICANT_DIR=%ROOT_DIR%Front-end-Applicant"
set "BACKEND_ENV=%ROOT_DIR%Back-end\.env"
set "UNPACKED_DIR=%FRONTEND_DIR%\release\win-unpacked"
set "APP_EXE=6R Diamond HR Management System.exe"

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Could not find Front-end-HR\package.json
  echo Expected path: "%FRONTEND_DIR%"
  pause
  exit /b 1
)

if not exist "%APPLICANT_DIR%\package.json" (
  echo [ERROR] Could not find Front-end-Applicant\package.json
  echo Expected path: "%APPLICANT_DIR%"
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

if /I "%NPM_CONFIG_OFFLINE%"=="true" (
  echo [INFO] Detected NPM_CONFIG_OFFLINE=true, switching to online install for this build session...
)
set "NPM_CONFIG_OFFLINE="
set "npm_config_offline="

if not exist "%BACKEND_ENV%" (
  echo [ERROR] Missing Back-end\.env required for production backend startup.
  echo Create "%BACKEND_ENV%" with at least:
  echo   SUPABASE_URL=your_supabase_url
  echo   SUPABASE_ANON_KEY=your_supabase_anon_key
  pause
  popd
  exit /b 1
)

findstr /R "^SUPABASE_URL=." "%BACKEND_ENV%" >nul
if errorlevel 1 (
  echo [ERROR] SUPABASE_URL is missing or empty in "%BACKEND_ENV%".
  pause
  popd
  exit /b 1
)

findstr /R "^SUPABASE_ANON_KEY=." "%BACKEND_ENV%" >nul
if errorlevel 1 (
  echo [ERROR] SUPABASE_ANON_KEY is missing or empty in "%BACKEND_ENV%".
  pause
  popd
  exit /b 1
)

if exist "%UNPACKED_DIR%\%APP_EXE%" (
  echo [INFO] Preparing clean release folder...
  taskkill /F /T /IM "%APP_EXE%" >nul 2>&1

  set "CLEAN_OK=0"
  for /L %%I in (1,1,5) do (
    rmdir /S /Q "%UNPACKED_DIR%" >nul 2>&1
    if not exist "%UNPACKED_DIR%" (
      set "CLEAN_OK=1"
      goto :clean_done
    )

    echo [WARNING] win-unpacked is locked. Retry %%I/5...
    timeout /T 2 /NOBREAK >nul
    taskkill /F /T /IM "%APP_EXE%" >nul 2>&1
  )

  :clean_done
  if not "%CLEAN_OK%"=="1" (
    echo [ERROR] Could not clean "%UNPACKED_DIR%".
    echo Close "%APP_EXE%", close Explorer windows in release\, then retry.
    popd
    pause
    exit /b 1
  )
)

echo [INFO] Installing Front-end-Applicant dependencies...
pushd "%APPLICANT_DIR%"
if errorlevel 1 (
  echo [ERROR] Failed to enter "%APPLICANT_DIR%"
  popd
  pause
  exit /b 1
)

call npm.cmd install
if errorlevel 1 (
  echo [WARNING] Front-end-Applicant install failed. Retrying with --legacy-peer-deps...
  call npm.cmd install --legacy-peer-deps
)
if errorlevel 1 (
  set "BUILD_EXIT=%ERRORLEVEL%"
  popd
  popd
  echo.
  echo [ERROR] Front-end-Applicant dependency install failed with exit code %BUILD_EXIT%.
  pause
  exit /b %BUILD_EXIT%
)

echo [INFO] Building Front-end-Applicant...
call npm.cmd run build
if errorlevel 1 (
  set "BUILD_EXIT=%ERRORLEVEL%"
  popd
  popd
  echo.
  echo [ERROR] Front-end-Applicant build failed with exit code %BUILD_EXIT%.
  pause
  exit /b %BUILD_EXIT%
)

popd

echo [INFO] Installing Front-end-HR dependencies ^(including devDependencies^)...
set "SKIP_BACKEND_POSTINSTALL=1"
set "skip_backend_postinstall=1"
call npm.cmd install --include=dev
if errorlevel 1 (
  echo [WARNING] Front-end-HR install failed. Retrying with --legacy-peer-deps...
  call npm.cmd install --include=dev --legacy-peer-deps
)
set "SKIP_BACKEND_POSTINSTALL="
set "skip_backend_postinstall="
if errorlevel 1 (
  set "BUILD_EXIT=%ERRORLEVEL%"
  popd
  echo.
  echo [ERROR] Dependency install failed with exit code %BUILD_EXIT%.
  pause
  exit /b %BUILD_EXIT%
)

echo [INFO] Preparing Back-end production dependencies...
if exist "%ROOT_DIR%Back-end\node_modules\back-end" (
  rmdir /S /Q "%ROOT_DIR%Back-end\node_modules\back-end" >nul 2>&1
)
if exist "%ROOT_DIR%Back-end\node_modules\front-end-hr" (
  rmdir /S /Q "%ROOT_DIR%Back-end\node_modules\front-end-hr" >nul 2>&1
)

call npm.cmd --prefix "%ROOT_DIR%Back-end" install --omit=dev
if errorlevel 1 (
  set "BUILD_EXIT=%ERRORLEVEL%"
  popd
  echo.
  echo [ERROR] Back-end production dependency install failed with exit code %BUILD_EXIT%.
  pause
  exit /b %BUILD_EXIT%
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

if exist "%UNPACKED_DIR%" (
  echo [INFO] Removing internal win-unpacked output to avoid confusion...
  rmdir /S /Q "%UNPACKED_DIR%" >nul 2>&1
  if exist "%UNPACKED_DIR%" (
    echo [WARNING] Could not remove "%UNPACKED_DIR%". You can ignore that folder and use only the installer .exe.
  )
)

for %%F in ("%FRONTEND_DIR%\release\* Setup *.exe") do (
  if exist "%%~fF" (
    echo [INFO] Removing legacy setup-named artifact: %%~nxF
    del /F /Q "%%~fF" >nul 2>&1
  )
)

for %%F in ("%FRONTEND_DIR%\release\* Setup *.exe.blockmap") do (
  if exist "%%~fF" (
    del /F /Q "%%~fF" >nul 2>&1
  )
)

echo.
echo [SUCCESS] Build completed.
echo Installer location:
echo %FRONTEND_DIR%\release
pause
exit /b 0
