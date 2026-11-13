@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
if not exist "server\node_modules\express" (
  call npm run setup
  if errorlevel 1 (
    echo.
    echo Setup failed. Send the file sudd-log.txt from this folder.
    pause
    exit /b 1
  )
)
if not exist "client\node_modules\vite" (
  call npm run setup
  if errorlevel 1 (
    echo.
    echo Setup failed. Send the file sudd-log.txt from this folder.
    pause
    exit /b 1
  )
)
call npm run dev
echo.
echo If something went wrong, send the file sudd-log.txt from this folder.
pause
