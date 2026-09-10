@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules\esbuild\package.json (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

"C:\Program Files\nodejs\node.exe" build.mjs
if errorlevel 1 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)
echo.
echo Build completed successfully.
endlocal
