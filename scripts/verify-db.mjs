import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
  if (!process.env[k]) process.env[k] = v;
}

const { neon } = await import('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

console.log('=== DATABASE VERIFICATION ===\n');

const categories = await sql`SELECT id, name, slug FROM categories ORDER BY id`;
console.log(`📁 Categories (${categories.length}):`);
categories.forEach(c => console.log(`  - [${c.id}] ${c.name} (${c.slug})`));

const products = await sql`
  SELECT p.id, p.name, p.price, p.stock, c.name as category 
  FROM products p 
  LEFT JOIN categories c ON p.category_id = c.id 
  ORDER BY p.id
`;
console.log(`\n🛍️ Products (${products.length}):`);
products.forEach(p => console.log(`  - [#${p.id}] ${p.name} | Category: ${p.category} | Price: ${p.price} DZD | Stock: ${p.stock}`));

const imagesCount = await sql`SELECT COUNT(*) as count FROM product_images`;
console.log(`\n🖼️ Total Product Images: ${imagesCount[0].count}`);

const sampleImages = await sql`
  SELECT pi.id, p.name as product_name, pi.url, pi.is_primary 
  FROM product_images pi 
  JOIN products p ON pi.product_id = p.id 
  LIMIT 5
`;
console.log(`\nSample Product Images:`);
sampleImages.forEach(img => console.log(`  - [Img #${img.id}] Product: ${img.product_name} | Primary: ${img.is_primary} | URL: ${img.url.slice(0, 60)}...`));
