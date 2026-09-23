@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  node "%~dp0launch.mjs"
) else (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "%~dp0launch.mjs"
  ) else (
    echo Please install Node.js 20 or newer, then open this file again.
    pause
    exit /b 1
  )
)
if errorlevel 1 pause
