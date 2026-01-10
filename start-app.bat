@echo off
echo ========================================
echo Grade Management System - Starting App
echo ========================================
echo.

echo [1/3] Starting PostgreSQL database...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start database!
    echo Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo Database started successfully!
echo.

echo [2/3] Waiting for database to be ready...
timeout /t 10 /nobreak >nul
echo Database is ready!
echo.

echo [3/3] Starting servers...
echo Opening backend server in new window...
start "Grade Management - Backend" cmd /k "cd backend && npm run dev"

echo Waiting 5 seconds before starting frontend...
timeout /t 5 /nobreak >nul

echo Opening frontend server in new window...
start "Grade Management - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Application is starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Demo Accounts:
echo - Teacher: teacher1@school.com / Teacher123!
echo - Student: student1@school.com / Student123!
echo - Parent: parent1@email.com / Parent123!
echo.
echo Two new windows have opened for backend and frontend servers.
echo Keep those windows open while using the application.
echo.
echo To stop the application:
echo 1. Close both server windows
echo 2. Run: docker compose down
echo.
pause
