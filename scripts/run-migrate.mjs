/**
 * Migration runner for Neon (serverless Postgres).
 * Reads DATABASE_URL from .env.local and executes scripts/migrate.sql.
 *
 * Usage: node scripts/run-migrate.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local manually ─────────────────────────────────────────────────
const envPath = join(__dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf8');

for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('🔗  Connecting to Neon...');

// ── Import neon HTTP client ───────────────────────────────────────────────────
const { neon } = await import('@neondatabase/serverless');
const sql = neon(DATABASE_URL);

// ── Read migration SQL ────────────────────────────────────────────────────────
const migrationPath = join(__dirname, 'migrate.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

// ── Execute each statement individually ──────────────────────────────────────
// Split on semicolons, but ignore semicolons inside $$ ... $$ blocks
const statements = migrationSQL
  .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`📄  Found ${statements.length} statement(s) to execute.\n`);

let succeeded = 0;
let skipped = 0;

for (const stmt of statements) {
  // Show first line as label
  const label = stmt.split('\n').find((l) => l.trim())?.trim() ?? stmt.slice(0, 60);

  try {
    await sql.query(stmt);
    console.log(`  ✅  ${label}`);
    succeeded++;
  } catch (err) {
    const msg = err?.message ?? String(err);
    // "already exists" errors are safe to skip
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log(`  ⚠️   Skipped (already exists): ${label}`);
      skipped++;
    } else {
      console.error(`  ❌  Failed: ${label}`);
      console.error(`      Error: ${msg}`);
      process.exit(1);
    }
  }
}

console.log(`\n✅  Migration complete — ${succeeded} executed, ${skipped} skipped.\n`);
