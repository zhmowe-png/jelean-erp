import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { DeliveryNote } from "../types";

export function DeliveryList() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("delivery_notes")
      .select("id,delivery_number,delivery_date,receiver,customers(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setNotes(
      (data || []).map((d: any) => ({
        ...d,
        customer: { name: d.customers?.name || "" },
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;

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
                    <Link to={`/delivery-notes/${n.id}`} className="text-blue-600 hover:underline">
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
