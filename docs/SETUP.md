# EPRI Backend Setup Guide

This guide will help you set up the Egyptian Petroleum Research Institute backend API.

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn package manager

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   # Database
   DATABASE_URL="mysql://root:@localhost:3306/egyptian_petroleum_research"
   
   # JWT Secret (Generate a secure random string)
   JWT_SECRET="your-super-secure-jwt-secret-key-here"
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed the database with initial data
   npx prisma db seed
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /logout` - Logout user
- `GET /verify` - Verify JWT token

### Events (`/api/events`)
- `GET /` - Get all events with filters
- `GET /:id` - Get single event by ID
- `POST /` - Create new event (Admin/Instructor only)
- `PUT /:id` - Update event (Admin/Instructor only)
- `DELETE /:id` - Delete event (Admin only)
- `POST /:id/register` - Register for event
- `GET /user/registrations` - Get user's event registrations

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics (Admin/Instructor only)
- `GET /user` - Get user dashboard data
- `GET /users` - Get all users (Admin only)
- `PUT /users/:id/status` - Update user status (Admin only)
- `GET /events/analytics` - Get event analytics (Admin/Instructor only)
- `GET /event-data` - Get categories, speakers, addresses (Admin/Instructor only)
- `POST /categories` - Create category (Admin only)
- `POST /speakers` - Create speaker (Admin/Instructor only)

## Database Schema

The database includes the following main models:
- **User** - User accounts with roles (STUDENT, RESEARCHER, INSTRUCTOR, ADMIN)
- **Event** - Events, conferences, and workshops
- **Category** - Event categories
- **Speaker** - Event speakers and presenters
- **Address** - Event locations
- **EventOrder** - Event registrations
- **Ticket** - Digital tickets for events
- **Course** - Educational courses
- **Lesson** - Course lessons
- **CourseEnrollment** - Course enrollments
- **Review** - Reviews and ratings

## Authentication & Authorization

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### User Roles:
- **STUDENT** - Can view and register for events
- **RESEARCHER** - Can view and register for events
- **INSTRUCTOR** - Can create and manage events
- **ADMIN** - Full access to all features

## Development Tools

### Prisma Studio
View and edit your database data:
```bash
npx prisma studio
```

### Database Migrations
```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Reset database
npx prisma migrate reset
```

## Testing the API

You can test the API using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

### Example API Calls

**Register a new user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@epri.edu",
    "password": "admin123"
  }'
```

**Get events:**
```bash
curl http://localhost:3001/api/events
```

## Troubleshooting

### Common Issues:

1. **Database connection errors:**
   - Check your DATABASE_URL in `.env`
   - Ensure MySQL is running
   - Verify database exists

2. **JWT errors:**
   - Ensure JWT_SECRET is set in `.env`
   - Check token format in Authorization header

3. **CORS errors:**
   - Verify FRONTEND_URL in `.env` matches your frontend URL
   - Check CORS configuration in server.ts

4. **Prisma errors:**
   - Run `npx prisma generate` after schema changes
   - Run `npx prisma db push` to sync schema

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a production database (not SQLite)
3. Set secure JWT secrets
4. Configure proper CORS origins
5. Use a reverse proxy (nginx) for SSL termination
6. Set up monitoring and logging

## Support

For issues or questions, please check the documentation or contact the development team.
