# Server Restart Required

The routes are correctly defined and compiled, but your **backend server needs to be restarted** to load the new routes.

## Quick Fix:

1. **Stop the current server** (press `Ctrl+C` in the terminal where it's running)

2. **Start it again:**
   ```bash
   cd backend
   npm run dev:api
   ```

   **OR if you're using a different script:**
   - `npm run dev` (uses server-auth.ts)
   - `npm run dev:api` (uses server.ts) ← **This is the one you need**
   - `npm start` (runs compiled version)

## Verify Routes Are Working:

After restarting, test the endpoint:
```bash
curl http://localhost:5000/api/department-sections
```

You should get a JSON response with sections, not a 404.

## Why This Happens:

- The routes are defined in `backend/src/server.ts` ✅
- The routes are compiled to `backend/dist/server.js` ✅  
- But the **running server instance** still has the old code in memory ❌

**Restarting loads the new code into memory.**

## All Routes That Should Work After Restart:

### Public Routes (no auth needed):
- `GET /api/department-sections` - List all sections
- `GET /api/departments` - List all departments

### Admin Routes (auth required):
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

