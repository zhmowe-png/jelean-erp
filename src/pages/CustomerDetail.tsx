import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Customer, DeliveryNote } from "../types";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase
        .from("delivery_notes")
        .select("id,delivery_number,delivery_date,receiver")
        .eq("customer_id", id)
        .order("delivery_date", { ascending: false })
        .limit(50),
    ]).then(([cRes, dRes]) => {
      if (cRes.data) setCustomer(cRes.data as Customer);
      setNotes((dRes.data || []) as DeliveryNote[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;
  if (!customer) return <div className="p-8 text-red-500">客户不存在</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-3 inline-block">
        ← 返回
      </button>
      <h1 className="text-xl font-bold mb-4">{customer.name}</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-sm space-y-1">
          <div><span className="text-gray-500">联系人：</span>{customer.contact || "-"}</div>
          <div><span className="text-gray-500">电话：</span>{customer.phone || "-"}</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-sm space-y-1">
          <div><span className="text-gray-500">地址：</span>{customer.address || "-"}</div>
          <div><span className="text-gray-500">对账日：</span>每月 {customer.billing_day} 号</div>
        </div>
      </div>

      <h2 className="font-semibold mb-3 text-sm">送货记录（最近50条）</h2>
      <div className="bg-white rounded-lg border">
        {notes.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">暂无送货记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-2 text-left">送货单号</th>
                <th className="px-5 py-2 text-left">送货日期</th>
                <th className="px-5 py-2 text-left">签收人</th>
                <th className="px-5 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-2 font-mono">{n.delivery_number}</td>
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
