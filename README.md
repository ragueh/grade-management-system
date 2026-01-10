# Grade Management System

A comprehensive web-based grade management system for teachers, students, and parents with mobile-first design and real-time progress tracking.

## Features

- **0-20 Marking Scale** with teacher comments
- **Role-Based Access**: Admin, Teacher, Student, Parent
- **Mobile-First Design**: Optimized for phones, enhanced for desktop
- **Parent Access Control**: Students control parent visibility
- **Real-Time Calculations**: Transparent weighted grade calculations
- **Early Warning System**: Alerts for at-risk students
- **Audit Trail**: Complete change history for all marks
- **Bulk Upload**: CSV import for efficient mark entry
- **PWA Support**: Works offline with local caching

## Tech Stack

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- bcrypt password hashing

### Frontend
- Vue.js 3 (Composition API)
- Tailwind CSS
- Progressive Web App (PWA)
- Responsive design (mobile-first)

## Project Structure

```
grade-management-system/
├── backend/              # Express.js API server
│   ├── config/          # Database and app configuration
│   ├── models/          # Database models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth and validation middleware
│   ├── utils/           # Helper functions
│   └── validators/      # Input validation
├── frontend/            # Vue.js 3 application
│   ├── src/
│   │   ├── components/  # Reusable Vue components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── stores/      # State management (Pinia)
│   │   └── styles/      # Tailwind CSS
│   └── public/          # Static assets
├── database/            # SQL schemas and seeds
└── docs/                # Documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grade-management-system
   ```

2. **Set up the database**
   ```bash
   # Create database
   psql -U postgres -c "CREATE DATABASE grade_management_db;"

   # Run schema
   psql -U postgres -d grade_management_db -f database/schema.sql
   ```

3. **Configure environment variables**
   ```bash
   # Copy example env file
   cp .env.example .env

   # Edit .env with your database credentials and secrets
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

5. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application runs on http://localhost:3000

## User Roles

### Admin
- Approve teacher registrations
- Manage system settings
- View audit logs

### Teacher
- Create and manage classes
- Define assessment types and weights
- Enter marks with comments (0-20 scale)
- View student progress and analytics
- Bulk upload marks via CSV

### Student
- View marks and teacher comments
- Track progress over time
- Grant/revoke parent access
- Receive alerts for low performance

### Parent
- View child's grades (with permission)
- Monitor progress and trends
- Receive alerts for at-risk students

## Grading Scale (0-20)

- **18-20 (90-100%)**: A - Excellent
- **16-18 (80-90%)**: B - Very Good
- **14-16 (70-80%)**: C - Good
- **12-14 (60-70%)**: D - Satisfactory
- **0-12 (<60%)**: F - Needs Improvement

## Security Features

- JWT-based authentication
- bcrypt password hashing
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Audit logging

## API Documentation

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for detailed API endpoints.

## Database Schema

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete database structure.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and development process.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please contact the development team.
