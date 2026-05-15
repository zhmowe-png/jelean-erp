import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const NOW = new Date();
const Y = NOW.getFullYear();
const M = String(NOW.getMonth() + 1).padStart(2, "0");
const END_DAY = String(new Date(Y, NOW.getMonth() + 1, 0).getDate()).padStart(2, "0");

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ count: number; total: number; recent: Array<{ id: number; delivery_number: string; delivery_date: string; customer_name: string }> }>({ count: 0, total: 0, recent: [] });

  useEffect(() => {
    const start = `${Y}-${M}-01`;
    const end = `${Y}-${M}-${END_DAY}`;

    let cancelled = false;
    async function load() {
      try {
        const results = await Promise.all([
          supabase
            .from("delivery_notes")
            .select("id,delivery_number,delivery_date,customers(name)", {
              count: "exact",
            })
            .gte("delivery_date", start)
            .lte("delivery_date", end)
            .order("delivery_date", { ascending: false }),
          supabase
            .from("delivery_notes")
            .select("id")
            .gte("delivery_date", start)
            .lte("delivery_date", end),
          supabase
            .from("delivery_notes")
            .select("id,delivery_number,delivery_date,customers(name)")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const [dnRes, monthIdsRes, recentRes] = results;

        if (dnRes.error) throw new Error(dnRes.error.message);
        if (monthIdsRes.error) throw new Error(monthIdsRes.error.message);
        if (recentRes.error) throw new Error(recentRes.error.message);

        // Fetch total amount for this month
        let total = 0;
        const monthIds = (monthIdsRes.data || []).map((n: { id: number }) => n.id);
        if (monthIds.length > 0) {
          const { data: items, error: itemsErr } = await supabase
            .from("delivery_items")
            .select("amount")
            .in("delivery_id", monthIds);
          if (itemsErr) throw new Error(itemsErr.message);
          total = (items || []).reduce(
            (s: number, i: { amount: number }) => s + (Number(i.amount) || 0),
            0
          );
        }

        if (!cancelled) {
          setStats({
            count: dnRes.count || 0,
            total,
            recent: (recentRes.data || []).map((d) => {
              const c = (d as Record<string, unknown>).customers as { name?: string } | undefined;
              return {
                id: d.id as number,
                delivery_number: d.delivery_number as string,
                delivery_date: d.delivery_date as string,
                customer_name: c?.name || "",
              };
            }),
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;
  if (error) return <div className="p-8 text-red-500">加载失败：{error}</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">首页看板 — {M}月</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-5">
          <div className="text-3xl font-bold text-blue-600">{stats.count}</div>
          <div className="text-sm text-gray-500 mt-1">本月送货单</div>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <div className="text-3xl font-bold text-green-600">
            ¥{stats.total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-500 mt-1">本月送货金额</div>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <Link
            to="/delivery-notes/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            + 新建送货单
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="px-5 py-3 border-b font-semibold text-sm">最近送货单</div>
        {stats.recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">暂无数据</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-2 text-left">送货单号</th>
                <th className="px-5 py-2 text-left">客户</th>
                <th className="px-5 py-2 text-left">送货日期</th>
                <th className="px-5 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono">{d.delivery_number}</td>
                  <td className="px-5 py-2">{d.customer_name}</td>
                  <td className="px-5 py-2">{d.delivery_date}</td>
                  <td className="px-5 py-2">
                    <Link
                      to={`/delivery-notes/${d.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
