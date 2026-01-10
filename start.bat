@echo off
echo ========================================
echo Grade Management System - Starting
echo ========================================
echo.

echo Using SQLite database (No Docker needed!)
echo.

echo [1/2] Starting backend server...
start "Grade Management - Backend" cmd /k "cd backend && npm run dev"

echo Waiting 3 seconds before starting frontend...
timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend server...
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
echo Two new windows have opened for backend and frontend.
echo Keep those windows open while using the application.
echo.
echo To stop: Just close both server windows
echo.
pause
