import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Customer } from "../types";

interface LineItem {
  key: number;
  seq: number;
  order_number: string;
  material_code: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  amount: number;
  notes: string;
}

function createItem(seq: number): LineItem {
  return {
    key: Date.now() + Math.random(),
    seq,
    order_number: "",
    material_code: "",
    product_name: "",
    quantity: "",
    unit_price: "",
    amount: 0,
    notes: "",
  };
}

function calcAmount(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unit_price) || 0;
  return Math.round(qty * price * 100) / 100;
}

async function generateDeliveryNumber(): Promise<string> {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${yy}${mm}`;

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextYY = nextMonth.getFullYear().toString().slice(2);
  const nextMM = String(nextMonth.getMonth() + 1).padStart(2, "0");
  const nextPrefix = `${nextYY}${nextMM}`;

  const { data, error } = await supabase
    .from("delivery_notes")
    .select("delivery_number")
    .gte("delivery_number", prefix)
    .lt("delivery_number", nextPrefix)
    .order("delivery_number", { ascending: false })
    .limit(1);

  if (error) throw new Error("获取送货单编号失败: " + error.message);

  let seq = 1;
  if (data && data.length > 0) {
    const lastSeq = parseInt(data[0].delivery_number.slice(4), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export function DeliveryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [receiver, setReceiver] = useState("");
  const [existingNumber, setExistingNumber] = useState("");
  const [items, setItems] = useState<LineItem[]>([createItem(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error: apiErr } = await supabase
          .from("customers")
          .select("id,name")
          .order("name");
        if (apiErr) throw new Error(apiErr.message);
        if (!cancelled) setCustomers((data || []) as Customer[]);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "加载客户列表失败");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Load existing data in edit mode
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const [nRes, iRes] = await Promise.all([
          supabase.from("delivery_notes").select("*").eq("id", id).single(),
          supabase.from("delivery_items").select("*").eq("delivery_id", id).order("seq"),
        ]);

        if (nRes.error) throw new Error(nRes.error.message);
        if (iRes.error) throw new Error(iRes.error.message);

        if (!cancelled && nRes.data) {
          const n = nRes.data as Record<string, unknown>;
          setCustomerId(String(n.customer_id || ""));
          setDeliveryDate((n.delivery_date as string)?.slice(0, 10) || "");
          setReceiver((n.receiver as string) || "");
          setExistingNumber((n.delivery_number as string) || "");

          const existingItems = (iRes.data || []) as Array<Record<string, unknown>>;
          if (existingItems.length > 0) {
            setItems(
              existingItems.map((it, i) => ({
                key: Date.now() + i,
                seq: (it.seq as number) || i + 1,
                order_number: (it.order_number as string) || "",
                material_code: (it.material_code as string) || "",
                product_name: (it.product_name as string) || "",
                quantity: String(it.quantity || ""),
                unit_price: String(it.unit_price || ""),
                amount: Number(it.amount) || 0,
                notes: (it.notes as string) || "",
              }))
            );
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "加载送货单失败");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  function updateItem(key: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const updated = { ...it, [field]: value };
        if (field === "quantity" || field === "unit_price") {
          updated.amount = calcAmount(updated);
        }
        return updated;
      })
    );
  }

  function addRow() {
    setItems((prev) => [...prev, createItem(prev.length + 1)]);
  }

  function removeRow(key: number) {
    setItems((prev) => {
      const next = prev.filter((it) => it.key !== key);
      return next.map((it, i) => ({ ...it, seq: i + 1 }));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("请选择客户");
      return;
    }
    const filled = items.filter((it) => it.product_name.trim());
    if (filled.length === 0) {
      setError("请至少填写一条送货明细");
      return;
    }
    for (const it of filled) {
      if (!it.quantity || parseFloat(it.quantity) <= 0) {
        setError(`第${it.seq}行数量不合法`);
        return;
      }
    }

    setSaving(true);
    try {
      const dn = isEdit ? existingNumber : await generateDeliveryNumber();
      const noteData = {
        customer_id: Number(customerId),
        delivery_number: dn,
        delivery_date: deliveryDate,
        receiver,
      };

      let noteId: number;

      if (isEdit) {
        const { error: updateErr } = await supabase
          .from("delivery_notes")
          .update(noteData)
          .eq("id", id);
        if (updateErr) throw new Error("更新送货单失败: " + updateErr.message);

        // Replace items: delete old, insert new
        await supabase.from("delivery_items").delete().eq("delivery_id", id);
        noteId = Number(id);
      } else {
        const { data: note, error: noteErr } = await supabase
          .from("delivery_notes")
          .insert(noteData)
          .select("id")
          .single();
        if (noteErr) throw new Error("创建送货单失败: " + noteErr.message);
        noteId = note.id;
      }

      const rows = filled.map((it) => ({
        delivery_id: noteId,
        seq: it.seq,
        order_number: it.order_number || null,
        material_code: it.material_code || null,
        product_name: it.product_name,
        quantity: parseFloat(it.quantity),
        unit_price: parseFloat(it.unit_price) || 0,
        amount: it.amount,
        notes: it.notes || null,
      }));

      const { error: itemsErr } = await supabase.from("delivery_items").insert(rows);

      if (itemsErr) {
        if (!isEdit) {
          await supabase.from("delivery_notes").delete().eq("id", noteId);
        }
        throw new Error("保存明细失败: " + itemsErr.message);
      }

      navigate(`/delivery-notes/${noteId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400";
  const totalAmount = items.reduce((s, it) => s + it.amount, 0);

  if (loadingData) return <div className="p-8 text-gray-500">加载送货单数据...</div>;
  if (loadError) return <div className="p-8 text-red-500">加载失败：{loadError}</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">
        {isEdit ? "编辑送货单" : "新建送货单"}
      </h1>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border p-5 mb-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">
                客户 <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">请选择</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">送货日期</label>
              <input
                type="date"
                className={inputCls}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">送货单号</label>
              <input
                className={inputCls}
                value={isEdit ? existingNumber : "系统自动生成"}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">收货单位及经手人</label>
              <input
                className={inputCls}
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="签收后再填"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-center w-12">序号</th>
                <th className="px-3 py-2 text-left">订单号</th>
                <th className="px-3 py-2 text-left">料号</th>
                <th className="px-3 py-2 text-left">
                  品名 <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-2 text-right w-24">
                  数量 <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-2 text-right w-28">单价</th>
                <th className="px-3 py-2 text-right w-28">金额</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.key} className="border-t">
                  <td className="px-3 py-1.5 text-center text-gray-400">{it.seq}</td>
                  <td className="px-3 py-1.5">
                    <input
                      className={inputCls}
                      value={it.order_number}
                      onChange={(e) => updateItem(it.key, "order_number", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      className={inputCls}
                      value={it.material_code}
                      onChange={(e) => updateItem(it.key, "material_code", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      className={inputCls}
                      value={it.product_name}
                      onChange={(e) => updateItem(it.key, "product_name", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      step="1"
                      className={`${inputCls} text-right`}
                      value={it.quantity}
                      onChange={(e) => updateItem(it.key, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      step="0.0001"
                      className={`${inputCls} text-right`}
                      value={it.unit_price}
                      onChange={(e) => updateItem(it.key, "unit_price", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {it.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(it.key)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        &times;
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-2 border-t bg-gray-50 flex justify-between items-center">
            <button
              type="button"
              onClick={addRow}
              className="text-sm text-blue-600 hover:underline"
            >
              + 添加行
            </button>
            <div className="text-sm">
              合计：
              <span className="font-bold text-lg">
                ¥
                {totalAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : isEdit ? "保存修改" : "保存送货单"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border rounded text-sm hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
