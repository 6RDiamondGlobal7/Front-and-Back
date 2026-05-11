@echo off
echo ===================================================
echo Starting 6R Diamond Recruitment System (Local Dev)
echo ===================================================
echo.
echo The servers will open in three separate command windows.
echo Please wait for "npm install" to finish in each window.
echo.

echo [1/3] Launching Back-end (API)...
start "Back-end API" cmd /k "cd Back-end && npm install && npm start"

echo [2/3] Launching Front-end-Applicant...
start "Applicant Portal" cmd /k "cd Front-end-Applicant && npm install && npm run dev"

echo [3/3] Launching Front-end-HR...
start "HR Portal" cmd /k "cd Front-end-HR && npm install && npm run dev"

echo.
echo ===================================================
echo Localhost Links:
echo - Applicant Portal : http://localhost:3000
echo - HR Portal        : http://localhost:5173
echo - Back-end API     : http://localhost:5000
echo ===================================================
echo.
pause
