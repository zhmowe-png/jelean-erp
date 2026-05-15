import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || supabaseUrl === "https://your-project.supabase.co") {
  throw new Error(
    "缺少 VITE_SUPABASE_URL 环境变量。请复制 .env.example 为 .env 并填入你的 Supabase 项目 URL。"
  );
}

if (!supabaseKey || supabaseKey.startsWith("your-")) {
  throw new Error(
    "缺少 VITE_SUPABASE_ANON_KEY 环境变量。请复制 .env.example 为 .env 并填入你的 Supabase anon key。"
  );
}

/**
 * Supabase 客户端 — 使用 anon key（前端公开密钥）。
 *
 * 安全说明：
 * - anon key 可安全暴露在前端，权限由 RLS 策略控制
 * - service_role key 拥有数据库完全访问权限，严禁在前端使用
 * - 当前项目为单用户版本，RLS 已禁用
 * - 如需多用户版本，请启用 RLS 并在 Dashboard 配置策略
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
