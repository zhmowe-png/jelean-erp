import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { exportDeliveryNote } from "../lib/export";
import type { DeliveryItem } from "../types";

export function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const [nRes, iRes] = await Promise.all([
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
        ]);

        if (nRes.error) throw new Error(nRes.error.message);
        if (iRes.error) throw new Error(iRes.error.message);

        if (!cancelled) {
          setNote(nRes.data as unknown as Record<string, unknown>);
          setItems(iRes.data || []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;
  if (error) return <div className="p-8 text-red-500">加载失败：{error}</div>;
  if (!note) return <div className="p-8 text-red-500">送货单不存在</div>;

  const customer = (note.customers as Record<string, string>) || {};
  const deliveryNumber = note.delivery_number as string;
  const deliveryDate = note.delivery_date as string;
  const receiver = note.receiver as string | null;
  const total = items.reduce((s, it) => s + Number(it.amount), 0);

  const handleExport = () => {
    exportDeliveryNote(items, customer.name || "未知客户", deliveryNumber);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">
          ← 返回
        </button>
        <h1 className="text-xl font-bold">送货单详情</h1>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          导出 Excel
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          打印
        </button>
      </div>

      {/* Delivery Note — screen + print */}
      <div className="delivery-note bg-white rounded-lg border p-8 print:border-0 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold tracking-wider">
            东莞市佳蓝纸品有限公司
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">JeLan Paper Products Co., Ltd.</p>
          <h1 className="text-2xl font-bold mt-4 tracking-[0.5em]">
            送 货 单
          </h1>
        </div>

        {/* Info Line */}
        <div className="flex justify-between text-sm mb-4 border-b border-dashed pb-3 print:border-black">
          <div className="flex gap-6">
            <span>
              <span className="text-gray-500 print:text-gray-700">客户：</span>
              <span className="font-semibold">{customer.name || ""}</span>
            </span>
            <span>
              <span className="text-gray-500 print:text-gray-700">地址：</span>
              {customer.address || ""}
            </span>
          </div>
          <div className="flex gap-6">
            <span>
              <span className="text-gray-500 print:text-gray-700">单号：</span>
              <span className="font-mono font-bold">{deliveryNumber}</span>
            </span>
            <span>
              <span className="text-gray-500 print:text-gray-700">日期：</span>
              {deliveryDate}
            </span>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-y-2 border-black print:border-black">
              <th className="py-2 px-2 text-center w-10">序号</th>
              <th className="py-2 px-2 text-left">订单号</th>
              <th className="py-2 px-2 text-left">料号</th>
              <th className="py-2 px-2 text-left">品名</th>
              <th className="py-2 px-2 text-right w-16">数量</th>
              <th className="py-2 px-2 text-right w-20">单价(元)</th>
              <th className="py-2 px-2 text-right w-24">金额(元)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-gray-300 print:border-black">
                <td className="py-1.5 px-2 text-center">{it.seq}</td>
                <td className="py-1.5 px-2">{it.order_number || ""}</td>
                <td className="py-1.5 px-2 font-mono text-xs">{it.material_code || ""}</td>
                <td className="py-1.5 px-2">{it.product_name}</td>
                <td className="py-1.5 px-2 text-right">{it.quantity}</td>
                <td className="py-1.5 px-2 text-right font-mono text-xs">
                  {Number(it.unit_price).toFixed(4)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono">
                  {Number(it.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {/* Pad to 8 rows for print */}
            {items.length < 8 &&
              Array.from({ length: 8 - items.length }).map((_, i) => (
                <tr key={`pad-${i}`} className="border-b border-gray-300 print:border-black">
                  <td className="py-1.5 px-2">&nbsp;</td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"></td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="text-right mt-2 text-base font-bold border-t-2 border-black pt-2 print:border-black">
          合&nbsp;&nbsp;计：¥&nbsp;
          {total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-10 text-sm print:mt-12">
          <div>
            收货单位及经手人：{receiver || "_______________"}
          </div>
          <div>
            送货单位及经手人：_______________
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-6 print:text-gray-500">
          东莞市佳蓝纸品有限公司 | 地址：东莞市 | 电话：_______________
        </div>
      </div>
    </div>
  );
}
