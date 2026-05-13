import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { DeliveryNote, DeliveryItem } from "../types";
import { Printable } from "../components/Printable";

export function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from("delivery_notes")
        .select("*,customers(id,name,address)")
        .eq("id", id)
        .single(),
      supabase
        .from("delivery_items")
        .select("*")
        .eq("delivery_id", id)
        .order("seq"),
    ]).then(([nRes, iRes]) => {
      if (nRes.data) setNote(nRes.data as any);
      setItems(iRes.data || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;
  if (!note) return <div className="p-8 text-red-500">送货单不存在</div>;

  const customer = (note as any).customers || {};
  const total = items.reduce((s, it) => s + Number(it.amount), 0);

  return (
    <div>
      <div className="no-print flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
          ← 返回
        </button>
        <h1 className="text-xl font-bold">送货单详情</h1>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
          打印
        </button>
      </div>

      <Printable>
        {/* Company Header (visible in print only) */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-center">东莞市佳蓝纸品有限公司</h1>
          <p className="text-center text-sm text-gray-600 mt-1">JeLan</p>
          <h2 className="text-lg font-bold text-center mt-3">送  货  单</h2>
        </div>

        <div className="bg-white rounded-lg border p-6 print:border-0 print:p-0">
          {/* Header Info */}
          <div className="print:block hidden mb-3">
            <div className="flex justify-between text-sm">
              <span>客户：{customer.name || ""}</span>
              <span>送货单号：{note.delivery_number}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>地址：{customer.address || ""}</span>
              <span>送货日期：{note.delivery_date}</span>
            </div>
          </div>

          {/* Header (screen) */}
          <div className="print:hidden grid grid-cols-2 gap-3 mb-4 text-sm">
            <div>
              <span className="text-gray-500">客户：</span>
              <Link to={`/customers/${note.customer_id}`} className="text-blue-600 hover:underline font-medium">
                {customer.name}
              </Link>
            </div>
            <div>
              <span className="text-gray-500">送货单号：</span>
              <span className="font-mono font-bold">{note.delivery_number}</span>
            </div>
            <div>
              <span className="text-gray-500">地址：</span>{customer.address || "-"}
            </div>
            <div>
              <span className="text-gray-500">送货日期：</span>{note.delivery_date}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm border">
            <thead className="bg-gray-100 print:bg-gray-200">
              <tr>
                <th className="px-3 py-2 border text-center w-12">序号</th>
                <th className="px-3 py-2 border text-left">订单号</th>
                <th className="px-3 py-2 border text-left">料号</th>
                <th className="px-3 py-2 border text-left">品名</th>
                <th className="px-3 py-2 border text-right w-20">数量</th>
                <th className="px-3 py-2 border text-right w-24">单价</th>
                <th className="px-3 py-2 border text-right w-28">金额</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="print:border-b">
                  <td className="px-3 py-1.5 border text-center">{it.seq}</td>
                  <td className="px-3 py-1.5 border">{it.order_number || ""}</td>
                  <td className="px-3 py-1.5 border">{it.material_code || ""}</td>
                  <td className="px-3 py-1.5 border">{it.product_name}</td>
                  <td className="px-3 py-1.5 border text-right">{it.quantity}</td>
                  <td className="px-3 py-1.5 border text-right">{Number(it.unit_price).toFixed(4)}</td>
                  <td className="px-3 py-1.5 border text-right font-mono">{Number(it.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {/* Empty rows for print (fill to ~10 rows) */}
              {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="hidden print:table-row">
                  <td className="px-3 py-1.5 border text-center">&nbsp;</td>
                  <td className="px-3 py-1.5 border"></td>
                  <td className="px-3 py-1.5 border"></td>
                  <td className="px-3 py-1.5 border"></td>
                  <td className="px-3 py-1.5 border"></td>
                  <td className="px-3 py-1.5 border"></td>
                  <td className="px-3 py-1.5 border"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="text-right mt-2 text-sm font-bold">
            合计：¥{total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </div>

          {/* Signatures (print only) */}
          <div className="hidden print:flex justify-between mt-10 text-sm">
            <div>收货单位及经手人：{note.receiver || "____________"}</div>
            <div>送货单位及经手人：____________</div>
          </div>

          {/* Receiver (screen) */}
          <div className="print:hidden mt-3 text-sm">
            <span className="text-gray-500">收货单位及经手人：</span>{note.receiver || "（未填写）"}
          </div>
        </div>
      </Printable>
    </div>
  );
}
