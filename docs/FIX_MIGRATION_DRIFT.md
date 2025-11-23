# Fix Migration Drift Issue

You have migration drift - the database schema doesn't match your migration history.

## Option 1: Reset Database (Recommended for Development)

If you're in development and don't have important data to keep:

```bash
cd backend
npm run prisma:migrate reset
```

This will:
- Drop the database
- Recreate it
- Apply all migrations
- Run the seed script

**⚠️ WARNING: This will DELETE ALL DATA in the database!**

## Option 2: Resolve Drift Without Losing Data

If you need to keep your data:

1. **Mark the migration as resolved:**
   ```bash
   cd backend
   npx prisma migrate resolve --applied 20251029145746_remove_regular_role
   ```

2. **Then create a new migration for any remaining changes:**
   ```bash
   npx prisma migrate dev --name fix_user_role_type
   ```

## Option 3: Check Current Database State

To see what the actual database state is:

```bash
cd backend
npx prisma db pull
```

This will show you the current database schema and help identify the exact differences.

## After Fixing:

1. **Regenerate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Restart your backend server:**
   ```bash
   npm run dev:api
   ```

## Why This Happened:

The migration file `20251029145746_remove_regular_role/migration.sql` was modified after it was already applied to the database. Prisma detected this drift and is asking you to resolve it.

