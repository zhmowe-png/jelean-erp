import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { DeliveryNote } from "../types";

export function DeliveryList() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryNote | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error: apiErr } = await supabase
          .from("delivery_notes")
          .select("id,delivery_number,delivery_date,receiver,customers(name)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (apiErr) throw new Error(apiErr.message);
        if (!cancelled) {
          setNotes(
            (data || []).map((d) => ({
              ...d,
              customer: { name: ((d as Record<string, unknown>).customers as { name?: string } | null)?.name || "" },
            } as unknown as DeliveryNote))
          );
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error: apiErr } = await supabase
        .from("delivery_notes")
        .delete()
        .eq("id", deleteTarget.id);
      if (apiErr) throw new Error(apiErr.message);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;
  if (error) return <div className="p-8 text-red-500">加载失败：{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">送货单</h1>
        <Link
          to="/delivery-notes/new"
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + 新建送货单
        </Link>
      </div>

      <div className="bg-white rounded-lg border">
        {notes.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">
            暂无送货单，点击上方按钮新建
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-2.5 text-left">送货单号</th>
                <th className="px-5 py-2.5 text-left">客户</th>
                <th className="px-5 py-2.5 text-left">送货日期</th>
                <th className="px-5 py-2.5 text-left">签收人</th>
                <th className="px-5 py-2.5 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono">{n.delivery_number}</td>
                  <td className="px-5 py-2">{n.customer?.name || "-"}</td>
                  <td className="px-5 py-2">{n.delivery_date}</td>
                  <td className="px-5 py-2">{n.receiver || "-"}</td>
                  <td className="px-5 py-2">
                    <Link
                      to={`/delivery-notes/${n.id}`}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      查看
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(n)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除送货单"
        message={`确定要删除送货单「${deleteTarget?.delivery_number}」吗？所有明细数据将被永久删除，此操作不可恢复。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
