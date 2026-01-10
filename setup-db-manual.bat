@echo off
echo ========================================
echo Database Setup - Finding PostgreSQL
echo ========================================
echo.

REM Try common PostgreSQL versions
set PSQL_PATH=

for %%v in (17 16 15 14 13 12) do (
    if exist "C:\Program Files\PostgreSQL\%%v\bin\psql.exe" (
        set PSQL_PATH=C:\Program Files\PostgreSQL\%%v\bin
        echo Found PostgreSQL %%v
        goto :found
    )
)

echo ERROR: Could not find PostgreSQL installation!
echo Please check your installation directory.
pause
exit /b 1

:found
echo Using PostgreSQL at: %PSQL_PATH%
echo.

echo [1/3] Creating database...
"%PSQL_PATH%\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS grade_management_db;"
"%PSQL_PATH%\psql.exe" -U postgres -c "CREATE DATABASE grade_management_db;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)
echo Database created!
echo.

echo [2/3] Running schema...
"%PSQL_PATH%\psql.exe" -U postgres -d grade_management_db -f "%~dp0database\schema.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to run schema!
    pause
    exit /b 1
)
echo Schema created!
echo.

echo [3/3] Loading demo data...
"%PSQL_PATH%\psql.exe" -U postgres -d grade_management_db -f "%~dp0database\seeds.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database!
    pause
    exit /b 1
)
echo Demo data loaded!
echo.

echo ========================================
echo SUCCESS! Database is ready!
echo ========================================
echo.
echo Demo Accounts:
echo - Teacher: teacher1@school.com / Teacher123!
echo - Student: student1@school.com / Student123!
echo - Parent: parent1@email.com / Parent123!
echo.
pause
