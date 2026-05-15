-- ============================================
-- JeLan 佳蓝纸品 ERP - 数据库重置脚本
-- 用途：仅在开发环境清空并重建数据
-- ⚠️  警告：此脚本会删除所有数据！
-- ⚠️  生产环境禁止执行此脚本！
-- ============================================

-- 安全检查：确认这不是生产数据库
-- 如果 Supabase 项目 URL 包含生产域名，请立即停止执行
-- 在执行前，请确认：
--   1. 你连接的是开发环境的 Supabase 项目
--   2. 当前数据库不包含生产数据
--   3. 你清楚知道此操作将不可逆地删除所有数据

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '⚠️  警告：即将清空所有数据！';
  RAISE NOTICE '此操作不可逆！';
  RAISE NOTICE '如果你确定要执行，请继续...';
  RAISE NOTICE '============================================';
END $$;

-- 清空数据（按外键依赖顺序）
DELETE FROM delivery_items;
DELETE FROM delivery_notes;
DELETE FROM customers;

-- 重置序列
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE delivery_notes_id_seq RESTART WITH 1;
ALTER SEQUENCE delivery_items_id_seq RESTART WITH 1;

DO $$
BEGIN
  RAISE NOTICE '所有数据已清空，序列已重置。';
END $$;
