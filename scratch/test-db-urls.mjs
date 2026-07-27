import { neon } from '@neondatabase/serverless';

const url1 = 'postgresql://neondb_owner:npg_r6Wh1RzeQCgq@ep-delicate-moon-as3ewz8i-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const url2 = 'postgresql://neondb_owner:npg_r6Wh1RzeQCgq@ep-weathered-fire-asz4c1ga-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function test() {
  console.log('Testing url1 (delicate moon)...');
  try {
    const sql1 = neon(url1);
    const r1 = await sql1`SELECT 1 as res`;
    console.log('url1 success:', r1);
  } catch(e) { console.log('url1 failed:', e.message); }

  console.log('Testing url2 (weathered fire)...');
  try {
    const sql2 = neon(url2);
    const r2 = await sql2`SELECT 1 as res`;
    console.log('url2 success:', r2);
  } catch(e) { console.log('url2 failed:', e.message); }
}

test();
