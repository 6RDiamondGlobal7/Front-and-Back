@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "APP_EXE=6R Diamond HR Management System.exe"
set "NPM_COMMON_FLAGS=--no-audit --no-fund"

call :resolvePaths || goto :fail
call :assertPrereqs || goto :fail
call :warnAdmin
call :checkBackendEnv || goto :fail
call :cleanUnpacked || goto :fail

call :installWithRecovery "%APPLICANT_DIR%" "Front-end-Applicant" "install" || goto :fail
call :buildApplicant || goto :fail

set "SKIP_BACKEND_POSTINSTALL=1"
set "skip_backend_postinstall=1"
call :installWithRecovery "%HR_DIR%" "Front-end-HR" "install --include=dev" || goto :fail
set "SKIP_BACKEND_POSTINSTALL="
set "skip_backend_postinstall="

call :installBackendProd || goto :fail
call :runElectronBuild || goto :fail
call :postCleanup

echo.
echo [SUCCESS] Build completed.
echo Installer location:
echo %HR_DIR%\release
pause
exit /b 0

:resolvePaths
set "HR_DIR=%ROOT_DIR%\Front-end-HR"
set "APPLICANT_DIR=%ROOT_DIR%\Front-end-Applicant"
set "BACKEND_DIR=%ROOT_DIR%\Back-end"

if not exist "%HR_DIR%\package.json" call :detectHrDir
if not exist "%APPLICANT_DIR%\package.json" call :detectApplicantDir
if not exist "%BACKEND_DIR%\package.json" call :detectBackendDir

if not exist "%HR_DIR%\package.json" (
  echo [ERROR] Could not find the HR frontend folder with package.json.
  echo [ERROR] Checked default path: "%ROOT_DIR%\Front-end-HR"
  exit /b 1
)

if not exist "%APPLICANT_DIR%\package.json" (
  echo [ERROR] Could not find the Applicant frontend folder with package.json.
  echo [ERROR] Checked default path: "%ROOT_DIR%\Front-end-Applicant"
  exit /b 1
)

if not exist "%BACKEND_DIR%\package.json" (
  echo [ERROR] Could not find the Back-end folder with package.json.
  echo [ERROR] Checked default path: "%ROOT_DIR%\Back-end"
  exit /b 1
)

set "BACKEND_ENV=%BACKEND_DIR%\.env"
set "UNPACKED_DIR=%HR_DIR%\release\win-unpacked"

echo [INFO] Root Dir:      %ROOT_DIR%
echo [INFO] HR Dir:        %HR_DIR%
echo [INFO] Applicant Dir: %APPLICANT_DIR%
echo [INFO] Back-end Dir:  %BACKEND_DIR%
echo.
exit /b 0

:detectHrDir
for /D %%D in ("%ROOT_DIR%\*") do (
  if exist "%%~fD\package.json" (
    findstr /I /C:"\"electron:build\"" "%%~fD\package.json" >nul 2>&1
    if not errorlevel 1 (
      set "HR_DIR=%%~fD"
      exit /b 0
    )
  )
)
exit /b 1

:detectApplicantDir
for /D %%D in ("%ROOT_DIR%\*") do (
  if exist "%%~fD\package.json" (
    findstr /I /C:"\"name\": \"application-portal\"" "%%~fD\package.json" >nul 2>&1
    if not errorlevel 1 (
      set "APPLICANT_DIR=%%~fD"
      exit /b 0
    )
  )
)

for /D %%D in ("%ROOT_DIR%\*Applicant*") do (
  if exist "%%~fD\package.json" (
    set "APPLICANT_DIR=%%~fD"
    exit /b 0
  )
)
exit /b 1

:detectBackendDir
for /D %%D in ("%ROOT_DIR%\*") do (
  if exist "%%~fD\package.json" if exist "%%~fD\server.js" (
    set "BACKEND_DIR=%%~fD"
    exit /b 0
  )
)
exit /b 1

:assertPrereqs
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] node was not found in PATH.
  echo Install Node.js LTS and re-run this script.
  exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found in PATH.
  echo Install Node.js LTS and re-run this script.
  exit /b 1
)

if /I "%NPM_CONFIG_OFFLINE%"=="true" (
  echo [INFO] Detected NPM_CONFIG_OFFLINE=true. Switching to online mode for this build session.
)
set "NPM_CONFIG_OFFLINE="
set "npm_config_offline="
set "npm_config_registry=https://registry.npmjs.org/"
exit /b 0

:warnAdmin
net session >nul 2>&1
if errorlevel 1 (
  echo [WARNING] Not running as Administrator.
  echo [WARNING] If electron-builder fails with symlink privilege errors,
  echo [WARNING] run this file as Administrator or enable Windows Developer Mode.
  echo.
)
exit /b 0

:checkBackendEnv
if not exist "%BACKEND_ENV%" (
  echo [ERROR] Missing Back-end .env required for production backend startup.
  echo Create "%BACKEND_ENV%" with at least:
  echo   SUPABASE_URL=your_supabase_url
  echo   SUPABASE_ANON_KEY=your_supabase_anon_key
  exit /b 1
)

findstr /R "^SUPABASE_URL=." "%BACKEND_ENV%" >nul
if errorlevel 1 (
  echo [ERROR] SUPABASE_URL is missing or empty in "%BACKEND_ENV%".
  exit /b 1
)

findstr /R "^SUPABASE_ANON_KEY=." "%BACKEND_ENV%" >nul
if errorlevel 1 (
  echo [ERROR] SUPABASE_ANON_KEY is missing or empty in "%BACKEND_ENV%".
  exit /b 1
)
exit /b 0

:cleanUnpacked
if not exist "%UNPACKED_DIR%" exit /b 0

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
  echo Close "%APP_EXE%" and any open release folder window, then retry.
  exit /b 1
)
exit /b 0

:installWithRecovery
setlocal
set "TARGET_DIR=%~1"
set "TARGET_NAME=%~2"
set "INSTALL_ARGS=%~3"

echo [INFO] Installing %TARGET_NAME% dependencies...
pushd "%TARGET_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Failed to enter "%TARGET_DIR%"
  endlocal & exit /b 1
)

call :runInstall "%INSTALL_ARGS%"
if not errorlevel 1 goto :install_ok

echo [WARNING] %TARGET_NAME% install failed. Retrying with --legacy-peer-deps...
call :runInstall "%INSTALL_ARGS% --legacy-peer-deps"
if not errorlevel 1 goto :install_ok

echo [WARNING] Applying npm network/cache fixes for %TARGET_NAME%...
set "NPM_CONFIG_FETCH_RETRIES=5"
set "NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000"
set "NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000"
set "NPM_CONFIG_PREFER_ONLINE=true"
call npm.cmd cache verify >nul 2>&1
call :runInstall "%INSTALL_ARGS% --legacy-peer-deps"
if not errorlevel 1 goto :install_ok

if exist "node_modules" (
  echo [WARNING] Retrying %TARGET_NAME% with a clean node_modules folder...
  rmdir /S /Q "node_modules" >nul 2>&1
)
call :runInstall "%INSTALL_ARGS% --legacy-peer-deps"
if not errorlevel 1 goto :install_ok

if exist "package-lock.json" (
  echo [WARNING] Falling back to npm ci for %TARGET_NAME%...
  call npm.cmd ci --legacy-peer-deps %NPM_COMMON_FLAGS%
  if not errorlevel 1 goto :install_ok
)

set "INSTALL_EXIT=%ERRORLEVEL%"
popd
endlocal & exit /b %INSTALL_EXIT%

:install_ok
popd
endlocal & exit /b 0

:runInstall
call npm.cmd %~1 %NPM_COMMON_FLAGS%
exit /b %ERRORLEVEL%

:buildApplicant
echo [INFO] Building Front-end-Applicant...
pushd "%APPLICANT_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Failed to enter "%APPLICANT_DIR%"
  exit /b 1
)
call npm.cmd run build
set "BUILD_EXIT=%ERRORLEVEL%"
popd
if not "%BUILD_EXIT%"=="0" (
  echo [ERROR] Front-end-Applicant build failed with exit code %BUILD_EXIT%.
  exit /b %BUILD_EXIT%
)
exit /b 0

:installBackendProd
echo [INFO] Preparing Back-end production dependencies...
if exist "%BACKEND_DIR%\node_modules\back-end" (
  rmdir /S /Q "%BACKEND_DIR%\node_modules\back-end" >nul 2>&1
)
if exist "%BACKEND_DIR%\node_modules\front-end-hr" (
  rmdir /S /Q "%BACKEND_DIR%\node_modules\front-end-hr" >nul 2>&1
)

call :installWithRecovery "%BACKEND_DIR%" "Back-end (production)" "install --omit=dev --ignore-scripts"
exit /b %ERRORLEVEL%

:runElectronBuild
echo [INFO] Running production build...
pushd "%HR_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Failed to enter "%HR_DIR%"
  exit /b 1
)
call npm.cmd run electron:build
set "BUILD_EXIT=%ERRORLEVEL%"
popd
if not "%BUILD_EXIT%"=="0" (
  echo [ERROR] Production build failed with exit code %BUILD_EXIT%.
  exit /b %BUILD_EXIT%
)
exit /b 0

:postCleanup
if exist "%UNPACKED_DIR%" (
  echo [INFO] Removing internal win-unpacked output to avoid confusion...
  rmdir /S /Q "%UNPACKED_DIR%" >nul 2>&1
  if exist "%UNPACKED_DIR%" (
    echo [WARNING] Could not remove "%UNPACKED_DIR%". You can ignore that folder and use only the installer .exe.
  )
)

for %%F in ("%HR_DIR%\release\* Setup *.exe") do (
  if exist "%%~fF" (
    echo [INFO] Removing legacy setup-named artifact: %%~nxF
    del /F /Q "%%~fF" >nul 2>&1
  )
)

for %%F in ("%HR_DIR%\release\* Setup *.exe.blockmap") do (
  if exist "%%~fF" (
    del /F /Q "%%~fF" >nul 2>&1
  )
)
exit /b 0

:fail
set "BUILD_EXIT=%ERRORLEVEL%"
if "%BUILD_EXIT%"=="0" set "BUILD_EXIT=1"
echo.
echo [ERROR] Build failed with exit code %BUILD_EXIT%.
pause
exit /b %BUILD_EXIT%
