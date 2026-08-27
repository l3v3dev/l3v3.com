@echo off
setlocal
cd /d "%~dp0"
node build.mjs
if errorlevel 1 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)
echo.
echo Build completed successfully.
endlocal
