import type { Config } from 'drizzle-kit';
import Bun from 'bun';

const tursoDbUrl = process.env.TURSO_DATABASE_URL;
const tursoDbToken = process.env.TURSO_AUTH_TOKEN;

export default {
  schema: './src/db/schema.ts',
  driver: 'turso',
  dialect: 'sqlite',
  dbCredentials: {
    url: tursoDbUrl || '',
    authToken: tursoDbToken || '',
  },
  out: './drizzle',
  verbose: true,
  strict: true,
} satisfies Config;
