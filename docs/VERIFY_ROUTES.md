# Verify Routes Are Working

To verify the admin department routes are working:

1. **Restart the backend server:**
   ```bash
   cd backend
   npm run dev:api
   ```

2. **Test the routes with authentication:**
   
   First, login to get a token:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@epri.edu","password":"admin123"}'
   ```
   
   Then test the admin routes (replace YOUR_TOKEN with the token from login):
   ```bash
   curl http://localhost:5000/api/admin/departments \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   curl http://localhost:5000/api/admin/department-sections \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check the server console** - you should see the routes being hit without 404 errors.

## Routes Added:

- `GET /api/admin/departments` - List all departments
- `GET /api/admin/departments/:id` - Get single department
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id` - Update department
- `DELETE /api/admin/departments/:id` - Delete department

- `GET /api/admin/department-sections` - List all sections
- `GET /api/admin/department-sections/:id` - Get single section
- `POST /api/admin/department-sections` - Create section
- `PUT /api/admin/department-sections/:id` - Update section
- `DELETE /api/admin/department-sections/:id` - Delete section

All admin routes require:
- Authentication token in Authorization header: `Bearer <token>`
- User must have ADMIN role

