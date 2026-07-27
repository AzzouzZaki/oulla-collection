-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  stock        INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  colors       TEXT[] DEFAULT '{}',
  sizes        TEXT[] DEFAULT '{}',
  fabric       VARCHAR(100),
  created_at   TIMESTAMP DEFAULT NOW()
);


-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  "order"    INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  customer_name       VARCHAR(255) NOT NULL,
  customer_phone      VARCHAR(20) NOT NULL,
  customer_instagram  VARCHAR(100),
  customer_address    TEXT NOT NULL,
  wilaya              VARCHAR(100) NOT NULL,
  total_price         DECIMAL(10,2) NOT NULL,
  status              VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  zvit_tracking_id    VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity   INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

