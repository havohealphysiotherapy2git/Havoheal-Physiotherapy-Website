import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma configuration.
 *
 * Replaces the deprecated `package.json#prisma` block. The seed command is
 * declared here so `prisma db seed` and `prisma migrate reset` both work.
 *
 * When a Prisma config file is present, the CLI stops loading `.env` itself, so
 * DATABASE_URL is loaded explicitly here — otherwise `prisma migrate` would not
 * find it. Missing file is fine: CI and hosting platforms inject real
 * environment variables instead.
 */
try {
  process.loadEnvFile(path.join(process.cwd(), '.env'));
} catch {
  // No .env — variables are expected to come from the environment.
}
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
