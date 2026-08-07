/**
 * Test stub for the `server-only` package.
 *
 * `server-only` throws when imported outside a React Server Component. Unit
 * tests exercise server modules directly in Node, so it is aliased to this
 * empty module in vitest.config.ts. Application code keeps the real import, so
 * the build-time guard still protects the browser bundle.
 */
export {};
