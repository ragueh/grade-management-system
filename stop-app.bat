@echo off
echo ========================================
echo Grade Management System - Stopping App
echo ========================================
echo.

echo Stopping Docker containers...
docker compose down

echo.
echo ========================================
echo Application stopped!
echo ========================================
echo.
echo Note: You may need to manually close the backend and frontend terminal windows.
echo.
pause
