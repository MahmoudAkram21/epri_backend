import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Get the database URL and ensure SSL parameters are included for Render databases
let databaseUrl = process.env.DATABASE_URL || '';

// // Add SSL parameters if not already present (required for Render databases)
// if (databaseUrl && !databaseUrl.includes('sslmode') && !databaseUrl.includes('ssl=')) {
//   const separator = databaseUrl.includes('?') ? '&' : '?';
//   databaseUrl = `${databaseUrl}${separator}sslmode=require`;
// }

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});

