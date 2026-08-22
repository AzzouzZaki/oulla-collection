const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_r6Wh1RzeQCgq@ep-weathered-fire-asz4c1ga-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require');
async function check() {
  try {
    const res = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'product_variants'
    );`;
    console.log('product_variants exists:', res[0].exists);
  } catch (err) {
    console.error(err);
  }
}
check();
