# EPRI Backend Quick Start Guide

## 🚀 Quick Setup

### 1. Environment Setup
Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/egyptian_petroleum_research"

# JWT Secret (Generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Server Configuration
PORT=3002
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### 2. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database (optional)
npx prisma db seed
```

### 3. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:3002`

## 🔐 Authentication Endpoints

### Register User
```bash
POST http://localhost:3002/api/auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "STUDENT"
}
```

### Login User
```bash
POST http://localhost:3002/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Profile (Protected)
```bash
GET http://localhost:3002/api/auth/profile
Authorization: Bearer <your-jwt-token>
```

### Verify Token
```bash
GET http://localhost:3002/api/auth/verify
Authorization: Bearer <your-jwt-token>
```

## 🎯 Frontend Integration

The frontend is now connected to the backend:

1. **API Client**: `lib/api.ts` - Handles all backend communication
2. **User Context**: `contexts/user-context.tsx` - Updated to use backend API
3. **Login Page**: `app/login/page.tsx` - Connected to backend authentication
4. **Register Page**: `app/register/page.tsx` - Connected to backend registration

## 🔧 Available Scripts

- `npm run dev` - Start development server with authentication
- `npm run dev:clean` - Start clean server (no auth)
- `npm run dev:simple` - Start minimal server

## 📊 Health Check

Visit `http://localhost:3002/api/health` to verify the server is running.

## 🎉 Ready to Use!

Your authentication system is now fully functional:
- ✅ User registration
- ✅ User login
- ✅ JWT token management
- ✅ Protected routes
- ✅ Frontend integration
