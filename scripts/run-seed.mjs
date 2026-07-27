import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

async function run() {
  console.log('🌱 Starting seed...');
  if (!process.env.DATABASE_URL) {
    console.error('❌ No DATABASE_URL found in environment or .env.local');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const seedPath = join(__dirname, 'seed.sql');
  const rawQuery = readFileSync(seedPath, 'utf8');

  // Split SQL file by semicolons to execute statement-by-statement
  const statements = rawQuery
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📄 Executing ${statements.length} seed statements...`);

  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(` -> Executing statement ${i + 1}/${statements.length}...`);
      await sql.query(stmt);
    }
    console.log('✅ Seed complete!');
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

run();
