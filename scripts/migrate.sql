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

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color       VARCHAR(100) NOT NULL,
  size        VARCHAR(50) NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, color, size)
);

-- Add variant_id to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;

-- Migrate existing products to variants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM product_variants) THEN
    -- Distribute stock evenly among variants if possible. Otherwise default 0
    INSERT INTO product_variants (product_id, color, size, stock)
    SELECT 
      p.id as product_id,
      c.color as color,
      s.size as size,
      COALESCE(
        p.stock / NULLIF(
          (SELECT COUNT(*) FROM unnest(p.colors) c2 CROSS JOIN unnest(p.sizes) s2), 
        0), 
      0) as stock
    FROM products p
    CROSS JOIN unnest(p.colors) AS c(color)
    CROSS JOIN unnest(p.sizes) AS s(size)
    WHERE cardinality(p.colors) > 0 AND cardinality(p.sizes) > 0;
  END IF;
END $$;

-- Stock Trigger Function
CREATE OR REPLACE FUNCTION sync_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE products
    SET stock = (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET stock = (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = OLD.product_id)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_sync_product_stock ON product_variants;
CREATE TRIGGER trg_sync_product_stock
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW EXECUTE FUNCTION sync_product_stock();
