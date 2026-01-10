@echo off
echo ========================================
echo Grade Management System - Database Setup
echo ========================================
echo.

REM Check if PostgreSQL is accessible
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL 'psql' command not found!
    echo.
    echo Please ensure PostgreSQL is installed and added to your PATH.
    echo Or run this script from the PostgreSQL bin directory.
    echo.
    echo Default PostgreSQL bin location:
    echo C:\Program Files\PostgreSQL\[version]\bin
    echo.
    pause
    exit /b 1
)

echo [1/4] Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS grade_management_db;"
psql -U postgres -c "CREATE DATABASE grade_management_db;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)
echo Database created successfully!
echo.

echo [2/4] Running schema (creating tables, triggers, functions)...
psql -U postgres -d grade_management_db -f "database\schema.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to run schema!
    pause
    exit /b 1
)
echo Schema created successfully!
echo.

echo [3/4] Seeding database with demo data...
psql -U postgres -d grade_management_db -f "database\seeds.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database!
    pause
    exit /b 1
)
echo Demo data loaded successfully!
echo.

echo [4/4] Verifying database setup...
psql -U postgres -d grade_management_db -c "\dt"
echo.

echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database: grade_management_db
echo User: postgres
echo.
echo Demo Accounts:
echo - Teacher: teacher1@school.com / Teacher123!
echo - Student: student1@school.com / Student123!
echo - Parent: parent1@email.com / Parent123!
echo.
pause
