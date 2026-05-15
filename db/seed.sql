-- ============================================
-- JeLan 佳蓝纸品 ERP - 测试种子数据
-- 用途：仅供开发 / 测试环境使用
-- 警告：请勿在生产环境执行此文件
-- ============================================

-- 测试客户
INSERT INTO customers (name, contact, phone, address, billing_day) VALUES
  ('佳蓝纸品测试客户A', '张先生', '13800001111', '东莞市XX镇XX路1号', 25),
  ('佳蓝纸品测试客户B', '李小姐', '13800002222', '东莞市XX镇XX路2号', 30);

-- 测试送货单
INSERT INTO delivery_notes (customer_id, delivery_number, delivery_date, receiver) VALUES
  (1, '2605001', CURRENT_DATE, '王五');

-- 测试送货明细
INSERT INTO delivery_items (delivery_id, seq, order_number, material_code, product_name, quantity, unit_price, amount) VALUES
  (1, 1, 'PO2026001', 'MAT-001', '瓦楞纸板 A型', 100, 2.5000, 250.00),
  (1, 2, 'PO2026001', 'MAT-002', '瓦楞纸板 B型', 200, 1.8000, 360.00);
