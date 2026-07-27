# Agent Prompt — Oulla Collection API Routes

## Your Goal
Implement all API routes for the Oulla Collection e-commerce web app. All files already exist as placeholders at `app/api/`. Your job is to fill them in with real logic. Do NOT create new files unless explicitly mentioned.

---

## Project Context

**Oulla Collection** is a mobile-first e-commerce web app for a women's fashion boutique. Key business rules:
- Cash on delivery only (no payment gateway)
- Delivery via Z Vit Express (not integrated yet — skip for now)
- No customer authentication — store is fully public
- Admin panel is protected via JWT using `jose`
- Single admin user (hardcoded credentials in `.env`)
- Images are stored on Cloudinary
- Database is Neon (serverless PostgreSQL) via `@neondatabase/serverless`

---

## Environment Variables

```
DATABASE_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ADMIN_PASSWORD=      # admin password
ADMIN_USERNAME=      # admin username
JWT_SECRET=          # secret used to sign/verify JWT tokens
```

---

## Database Schema (reference)

```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  stock        INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  "order"    INTEGER DEFAULT 0
);

CREATE TABLE orders (
  id                  SERIAL PRIMARY KEY,
  customer_name       VARCHAR(255) NOT NULL,
  customer_phone      VARCHAR(20) NOT NULL,
  customer_instagram  VARCHAR(100),
  customer_address    TEXT NOT NULL,
  wilaya              VARCHAR(100) NOT NULL,
  total_price         DECIMAL(10,2) NOT NULL,
  status              order_status DEFAULT 'pending',
  zvit_tracking_id    VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity   INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);
```

---

## TypeScript Interfaces (reference from `types/index.ts`)

```ts
export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  stock: number;
  is_available: boolean;
  created_at: string;
  images?: ProductImage[];
  category?: Category;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_instagram: string | null;
  customer_address: string;
  wilaya: string;
  total_price: number;
  status: OrderStatus;
  zvit_tracking_id: string | null;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}
```

---

## Auth Logic

### How admin login works
- Admin credentials are stored in `.env` as `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- On login, compare submitted credentials against env vars
- If match, sign a JWT using `jose` with `JWT_SECRET` and return it as an **httpOnly cookie** named `admin_token`
- The JWT payload should include `{ username }` and expire in **7 days**

### How route protection works
- `middleware.ts` already handles protecting `/dashboard/*` routes
- Inside admin API routes, create a helper `lib/auth.ts → verifyAdmin(request)` that:
  - Reads the `admin_token` cookie from the request
  - Verifies it using `jose` and `JWT_SECRET`
  - Returns the payload if valid, throws a 401 if not
- All admin-only API routes must call `verifyAdmin()` at the top

### Admin-only routes
These routes require `verifyAdmin()`:
- `POST /api/products`
- `PUT /api/products/[id]`
- `DELETE /api/products/[id]`
- `POST /api/categories`
- `PUT /api/categories/[id]`
- `DELETE /api/categories/[id]`
- `PUT /api/orders/[id]` (status updates)
- `GET /api/orders` (order list)
- `GET /api/orders/[id]` (order detail)
- `POST /api/upload`
- `POST /api/auth/login`... actually this one is public obviously

### Auth routes to create
Create these two new files (they don't exist yet):
- `app/api/auth/login/route.ts` — handles admin login, sets cookie
- `app/api/auth/logout/route.ts` — clears the `admin_token` cookie

---

## API Routes Specification

### `app/api/products/route.ts`

**GET /api/products** — Public
- Returns paginated list of products with their primary image and category
- Query params:
  - `page` (default: 1)
  - `limit` (default: 12)
  - `category` (optional, category slug to filter by)
- If no `page` or `limit` params are passed, return ALL products (no pagination)
- Each product in the response includes its `images` array and `category` object
- Returns both available and unavailable products (frontend handles display)
- Response shape:
```json
{
  "data": [...],
  "total": 40,
  "page": 1,
  "limit": 12,
  "totalPages": 4
}
```
- If no pagination params: `{ "data": [...] }` (no pagination metadata)

**POST /api/products** — Admin only
- Creates a new product
- Body:
```json
{
  "name": "string",
  "description": "string | null",
  "price": "number",
  "category_id": "number | null",
  "stock": "number",
  "is_available": "boolean",
  "images": [
    { "url": "string", "is_primary": "boolean", "order": "number" }
  ]
}
```
- Validate: `name` and `price` are required
- Insert product first, then insert images into `product_images`
- Return the created product with images

---

### `app/api/products/[id]/route.ts`

**GET /api/products/[id]** — Public
- Returns a single product by ID
- Include full `images` array and `category` object
- Return 404 if not found

**PUT /api/products/[id]** — Admin only
- Updates product fields (any subset of: `name`, `description`, `price`, `category_id`, `stock`, `is_available`)
- For images: accept an `images` array — delete all existing images for this product and re-insert the new ones
- Return the updated product with images

**DELETE /api/products/[id]** — Admin only
- Delete all Cloudinary images for this product first (use `cloudinary.uploader.destroy()`)
- To get the Cloudinary `public_id` from the URL, extract it from the Cloudinary URL (format: `https://res.cloudinary.com/<cloud>/image/upload/<public_id>.<ext>`)
- Then delete the product from the DB (cascade will handle `product_images` and nullify `order_items`)
- Return `{ success: true }`

---

### `app/api/categories/route.ts`

**GET /api/categories** — Public
- Returns all categories (no pagination needed)
- Response: `{ "data": [...] }`

**POST /api/categories** — Admin only
- Body: `{ "name": "string", "slug": "string" }`
- Validate: both fields required, slug must be unique
- Return created category

---

### `app/api/categories/[id]/route.ts`

**PUT /api/categories/[id]** — Admin only
- Body: `{ "name": "string", "slug": "string" }`
- Return updated category
- Return 404 if not found

**DELETE /api/categories/[id]** — Admin only
- Deletes the category
- Products in this category will have `category_id` set to NULL (already handled by `ON DELETE SET NULL` in schema)
- Return `{ success: true }`

---

### `app/api/orders/route.ts`

**GET /api/orders** — Admin only
- Returns paginated list of orders
- Query params:
  - `page` (default: 1)
  - `limit` (default: 20)
  - `status` (optional, filter by order_status enum value)
  - `date_from` (optional, ISO date string)
  - `date_to` (optional, ISO date string)
- Each order includes its `items` array
- Order by `created_at DESC`
- Response shape:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

**POST /api/orders** — Public (customers place orders)
- Body:
```json
{
  "customer_name": "string",
  "customer_phone": "string",
  "customer_instagram": "string | null",
  "customer_address": "string",
  "wilaya": "string",
  "notes": "string | null",
  "items": [
    { "product_id": "number", "quantity": "number" }
  ]
}
```
- Validate:
  - `customer_name`, `customer_phone`, `customer_address`, `wilaya` are required
  - `items` must be a non-empty array
  - For each item: check the product exists and `is_available = true`
  - If any product is unavailable or not found, return 400 with a clear error message
- For each item, fetch the current `price` from the DB and use it as `unit_price` (do NOT trust prices from the request body)
- Calculate `total_price` server-side as sum of `(unit_price * quantity)` for all items
- Insert into `orders`, then insert all `order_items`
- Do NOT modify stock at this point (stock decreases only when status changes to `shipped`)
- Return the created order with items

---

### `app/api/orders/[id]/route.ts`

**GET /api/orders/[id]** — Admin only
- Returns a single order by ID with its `items` array
- Return 404 if not found

**PUT /api/orders/[id]** — Admin only
- Updates order status only
- Body: `{ "status": "confirmed" | "shipped" | "delivered" | "cancelled" }`
- Validate: status must be a valid `order_status` enum value
- **Special logic for `shipped`:**
  - When status changes to `shipped`, decrease stock for each item in the order:
    ```sql
    UPDATE products SET stock = stock - quantity WHERE id = product_id
    ```
  - If any product's stock would go below 0, still allow it (stock can go negative as a signal to restock) but log a warning
- **Special logic for `cancelled`:**
  - If previous status was `shipped`, restore stock for each item
  - If previous status was anything else, no stock changes needed
- Return the updated order

---

### `app/api/upload/route.ts`

**POST /api/upload** — Admin only
- Accepts a `multipart/form-data` request with a `file` field
- Upload the file to Cloudinary using `cloudinary.uploader.upload()`
- Upload to a folder named `oulla-collection` on Cloudinary
- Return:
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "oulla-collection/..."
}
```

---

### `app/api/auth/login/route.ts` — NEW FILE

**POST /api/auth/login** — Public
- Body: `{ "username": "string", "password": "string" }`
- Compare against `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars
- If match: sign a JWT with `jose`, set it as an httpOnly cookie named `admin_token` with 7 day expiry
- If no match: return 401 `{ "error": "Invalid credentials" }`
- Return `{ "success": true }` on success

---

### `app/api/auth/logout/route.ts` — NEW FILE

**POST /api/auth/logout** — Public
- Clears the `admin_token` cookie by setting it with `maxAge: 0`
- Return `{ "success": true }`

---

## lib/auth.ts

Implement the following exports:

```ts
// Signs a JWT with the given payload, expires in 7 days
export async function signToken(payload: object): Promise<string>

// Verifies the admin_token cookie in a request, returns payload or throws
export async function verifyAdmin(request: Request): Promise<JWTPayload>
```

Use `jose`'s `SignJWT` and `jwtVerify`. The secret should be encoded with `new TextEncoder().encode(process.env.JWT_SECRET)`.

---

## lib/db.ts

```ts
import { neon } from '@neondatabase/serverless';

// Only create the connection if DATABASE_URL is set
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export default sql;
```

All API routes should check if `sql` is null and return a 500 with `{ "error": "Database not configured" }` if it is.

---

## lib/cloudinary.ts

```ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

---

## Error Handling Rules

All routes must follow this pattern:
- Wrap everything in a `try/catch`
- Return appropriate HTTP status codes:
  - `200` for successful GET/PUT
  - `201` for successful POST (creation)
  - `400` for validation errors
  - `401` for unauthorized
  - `404` for not found
  - `500` for unexpected server errors
- Error response shape: `{ "error": "message" }`

---

## Important Rules

1. Do NOT modify any files outside of `app/api/`, `lib/auth.ts`, `lib/db.ts`, and `lib/cloudinary.ts`
2. Do NOT run migrations or touch `.env` files
3. Use `@neondatabase/serverless`'s tagged template literal `sql` for all queries (e.g. `` sql`SELECT * FROM products` ``)
4. Do NOT use an ORM
5. Keep all business logic inside the route handlers — no separate service layer needed at this scale
6. Use Next.js `NextRequest` and `NextResponse` for all route handlers
7. Add `export const runtime = 'edge'` to routes that don't need Node.js APIs (avoid it on upload route since it uses `formData`)
8. The `migrate.sql` already has the `order_status` enum — make sure the TypeScript types match it exactly