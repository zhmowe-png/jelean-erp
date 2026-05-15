import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { exportDeliveryNote } from "../lib/export";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { DeliveryItem } from "../types";

export function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

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

  const handleExport = async () => {
    await exportDeliveryNote(items, {
      companyName: "东莞市佳蓝纸品有限公司",
      companyEn: "JeLan Paper Products Co., Ltd.",
      customerName: customer.name || "",
      customerAddress: customer.address || "",
      deliveryNumber,
      deliveryDate,
      receiver: receiver || "",
    });
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      const { error: apiErr } = await supabase
        .from("delivery_notes")
        .delete()
        .eq("id", id);
      if (apiErr) throw new Error(apiErr.message);
      navigate("/delivery-notes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setShowDelete(false);
    }
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
        <Link
          to={`/delivery-notes/${id}/edit`}
          className="px-4 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
        >
          编辑
        </Link>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-1.5 text-red-600 border border-red-300 rounded text-sm hover:bg-red-50"
        >
          删除
        </button>
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
          <p className="text-sm text-gray-500 -mt-px">JeLan Paper Products Co., Ltd.</p>
          <h1 className="text-2xl font-bold mt-4 tracking-[0.5em]">
            送 货 单
          </h1>
        </div>

        {/* Info Line */}
        <div className="flex justify-between text-sm mb-4 pb-3">
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
        <table className="w-full table-fixed border-collapse text-base">
          <thead>
            <tr className="border-y border-black print:border-black">
              <th className="py-2 px-2 text-center">序号</th>
              <th className="py-2 px-2 text-center">订单号</th>
              <th className="py-2 px-2 text-center">料号</th>
              <th className="py-2 px-2 text-center">品名</th>
              <th className="py-2 px-2 text-center">数量</th>
              <th className="py-2 px-2 text-center">单价</th>
              <th className="py-2 px-2 text-center">金额</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td className="py-1.5 px-2 text-center">{it.seq}</td>
                <td className="py-1.5 px-2 text-center">{it.order_number || ""}</td>
                <td className="py-1.5 px-2 text-center">{it.material_code || ""}</td>
                <td className="py-1.5 px-2 text-center">{it.product_name}</td>
                <td className="py-1.5 px-2 text-center">{it.quantity}</td>
                <td className="py-1.5 px-2 text-center">
                  {Number(it.unit_price).toFixed(4)}
                </td>
                <td className="py-1.5 px-2 text-center">
                  {Number(it.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {/* Pad to 8 rows for print */}
            {items.length < 8 &&
              Array.from({ length: 8 - items.length }).map((_, i) => (
                <tr key={`pad-${i}`}>
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
      </div>

      <ConfirmDialog
        open={showDelete}
        title="删除送货单"
        message={`确定要删除送货单「${deliveryNumber}」吗？所有明细数据将被永久删除，此操作不可恢复。`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
