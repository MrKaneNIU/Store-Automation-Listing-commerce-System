import type { Migration } from '../migrate'

export const initialPhase2SchemaMigration: Migration = {
  id: '202605090001',
  name: 'initial_phase_2_schema',
  purpose:
    'Create the Phase 2 durable persistence baseline for OCR batches, drafts, products, SKUs, orders, customers, and staff users.',
  compensation:
    'Before production use, take a database backup. If this migration must be compensated in local or staging environments, drop dependent tables in reverse order after exporting data that must be preserved.',
  validation:
    'Validate that all Phase 2 tables exist, status check constraints reject unknown values, required foreign keys reject orphan records, and numeric quantity/stock/price constraints reject invalid values.',
  upSql: `
    CREATE TABLE IF NOT EXISTS ocr_batches (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('uploaded', 'recognized', 'confirmed')),
      image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_drafts (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES ocr_batches(id) ON DELETE CASCADE,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price > 0),
      spec TEXT NOT NULL,
      stock INTEGER NOT NULL CHECK (stock >= 0),
      confidence NUMERIC(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
      source_image_url TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'needs_completion', 'confirmed', 'deleted')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS product_drafts_batch_id_idx ON product_drafts(batch_id);
    CREATE INDEX IF NOT EXISTS product_drafts_status_idx ON product_drafts(status);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      product_code TEXT NOT NULL UNIQUE,
      product_name TEXT NOT NULL,
      main_image_url TEXT NOT NULL DEFAULT '',
      image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      status TEXT NOT NULL CHECK (status IN ('pending_images', 'ready_to_publish', 'published')),
      created_from_batch_id TEXT NOT NULL REFERENCES ocr_batches(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
    CREATE INDEX IF NOT EXISTS products_created_from_batch_id_idx ON products(created_from_batch_id);

    CREATE TABLE IF NOT EXISTS skus (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      product_code TEXT NOT NULL,
      spec TEXT NOT NULL,
      sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price > 0),
      stock INTEGER NOT NULL CHECK (stock >= 0),
      UNIQUE (product_code, spec),
      UNIQUE (product_id, spec)
    );

    CREATE INDEX IF NOT EXISTS skus_product_id_idx ON skus(product_id);

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      phone TEXT,
      auth_source TEXT NOT NULL CHECK (auth_source IN ('mock_wechat', 'wechat')),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE (phone)
    );

    CREATE TABLE IF NOT EXISTS staff_users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
      external_user_id TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE (external_user_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      customer_auth_source TEXT NOT NULL CHECK (customer_auth_source IN ('mock_wechat', 'wechat')),
      status TEXT NOT NULL CHECK (status IN ('pending_merchant_confirm', 'confirmed', 'canceled')),
      total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      sku_id TEXT NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      spec TEXT NOT NULL,
      sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price > 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0)
    );

    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS order_items_sku_id_idx ON order_items(sku_id);
  `,
}
