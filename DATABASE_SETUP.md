# Database Setup Instructions

## Prerequisites
- PostgreSQL installed (version 12 or higher)
- PostgreSQL service running

## Option 1: Automated Setup (Recommended)

### If PostgreSQL is in your PATH:
Simply run the setup script from the project root:
```bash
setup-database.bat
```

### If PostgreSQL is NOT in your PATH:
1. Navigate to your PostgreSQL bin directory:
   ```bash
   cd "C:\Program Files\PostgreSQL\[VERSION]\bin"
   ```
   Replace `[VERSION]` with your PostgreSQL version (e.g., 15, 16)

2. Run the setup script from there:
   ```bash
   "C:\Users\ALI_PC_TEST\grade management system\setup-database.bat"
   ```

## Option 2: Manual Setup

### Step 1: Open PostgreSQL Command Line (psql)

**Method A - Using pgAdmin:**
1. Open pgAdmin 4
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → Create → Database
4. Name: `grade_management_db`
5. Owner: `postgres`
6. Click Save

**Method B - Using Command Line:**
1. Open Command Prompt or PowerShell
2. Navigate to PostgreSQL bin directory:
   ```bash
   cd "C:\Program Files\PostgreSQL\[VERSION]\bin"
   ```
3. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```
4. When prompted, enter your PostgreSQL password

### Step 2: Create the Database
```sql
DROP DATABASE IF EXISTS grade_management_db;
CREATE DATABASE grade_management_db;
```

### Step 3: Connect to the New Database
```sql
\c grade_management_db
```

### Step 4: Run the Schema File

**In psql:**
```bash
\i 'C:/Users/ALI_PC_TEST/grade management system/database/schema.sql'
```

**Or from command line:**
```bash
psql -U postgres -d grade_management_db -f "C:\Users\ALI_PC_TEST\grade management system\database\schema.sql"
```

### Step 5: Run the Seeds File

**In psql:**
```bash
\i 'C:/Users/ALI_PC_TEST/grade management system/database/seeds.sql'
```

**Or from command line:**
```bash
psql -U postgres -d grade_management_db -f "C:\Users\ALI_PC_TEST\grade management system\database\seeds.sql"
```

### Step 6: Verify the Setup

```sql
-- Check tables
\dt

-- Check if demo data exists
SELECT * FROM users;
SELECT * FROM teachers;
SELECT * FROM students;
SELECT * FROM parents;
```

You should see:
- 11 tables created
- Several demo users (teachers, students, parents)
- Sample classes, assessments, and marks

## Option 3: Using pgAdmin GUI

1. Open pgAdmin 4
2. Connect to your PostgreSQL server
3. Create database `grade_management_db`
4. Right-click on the database → Query Tool
5. Open and execute `database/schema.sql`
6. Open and execute `database/seeds.sql`

## Configuration

The backend is configured to connect with these settings (from `.env` file):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grade_management_db
DB_USER=postgres
DB_PASSWORD=postgres
```

**⚠️ Important:** Update the `DB_PASSWORD` in `.env` to match your PostgreSQL password!

## Demo Accounts

After running the seeds, you'll have these demo accounts:

**Teacher:**
- Email: `teacher1@school.com`
- Password: `Teacher123!`

**Student:**
- Email: `student1@school.com`
- Password: `Student123!`

**Parent:**
- Email: `parent1@email.com`
- Password: `Parent123!`

## Troubleshooting

### "psql: command not found"
- PostgreSQL bin directory is not in your PATH
- Solution: Navigate to the bin directory manually or add it to PATH

### "password authentication failed"
- Your PostgreSQL password doesn't match
- Solution: Update `DB_PASSWORD` in the `.env` file

### "database already exists"
- The database was created in a previous attempt
- Solution: Drop it first with `DROP DATABASE grade_management_db;`

### Permission denied
- You're not running as postgres user or admin
- Solution: Use `-U postgres` flag or run as administrator

## Verification

After setup, restart your backend server:
```bash
cd backend
npm start
```

You should see:
```
✓ Connected to PostgreSQL database
🚀 Server running on port 5000
```

Then test the API:
```bash
curl http://localhost:5000/health
```

You should get a successful response indicating database connection is working.
