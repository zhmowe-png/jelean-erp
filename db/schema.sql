-- ============================================
-- JeLan 佳蓝纸品 ERP - 数据库表结构
-- 用途：仅建表，不包含任何数据操作
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 客户表
CREATE TABLE IF NOT EXISTS customers (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  contact     TEXT,
  phone       TEXT,
  address     TEXT,
  billing_day INT DEFAULT 25,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 送货单表
CREATE TABLE IF NOT EXISTS delivery_notes (
  id              BIGSERIAL PRIMARY KEY,
  customer_id     BIGINT REFERENCES customers(id),
  delivery_number TEXT NOT NULL UNIQUE,
  delivery_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  receiver        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 送货单明细表
CREATE TABLE IF NOT EXISTS delivery_items (
  id              BIGSERIAL PRIMARY KEY,
  delivery_id     BIGINT REFERENCES delivery_notes(id) ON DELETE CASCADE,
  seq             INT NOT NULL DEFAULT 1,
  order_number    TEXT,
  material_code   TEXT,
  product_name    TEXT NOT NULL,
  quantity        INT NOT NULL DEFAULT 0,
  unit_price      NUMERIC(12,4) DEFAULT 0,
  amount          NUMERIC(12,2) DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_delivery_notes_customer ON delivery_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON delivery_notes(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_number ON delivery_notes(delivery_number);
CREATE INDEX IF NOT EXISTS idx_delivery_items_delivery ON delivery_items(delivery_id);

-- ============================================
-- RLS 策略（可选 - 启用后仅认证用户可访问）
-- 单用户版本默认不启用 RLS
-- 如需多用户安全访问，执行以下语句：
-- ============================================

-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "认证用户可读写" ON customers FOR ALL TO authenticated USING (true);
-- CREATE POLICY "认证用户可读写" ON delivery_notes FOR ALL TO authenticated USING (true);
-- CREATE POLICY "认证用户可读写" ON delivery_items FOR ALL TO authenticated USING (true);
