import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Customer, DeliveryItem } from "../types";
import { Printable } from "../components/Printable";

interface BillingRow extends DeliveryItem {
  delivery_number: string;
  delivery_date: string;
}

export function Billing() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [yearMonth, setYearMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error: apiErr } = await supabase
          .from("customers")
          .select("id,name,billing_day")
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

  async function generate() {
    setError("");
    if (!customerId) {
      setError("请选择客户");
      return;
    }
    if (!yearMonth) {
      setError("请选择月份");
      return;
    }

    setLoading(true);
    try {
      const [y, m] = yearMonth.split("-");
      const start = `${y}-${m}-01`;
      const endDay = String(
        new Date(Number(y), Number(m), 0).getDate()
      ).padStart(2, "0");
      const end = `${y}-${m}-${endDay}`;

      const { data: notes, error: notesErr } = await supabase
        .from("delivery_notes")
        .select("id,delivery_number,delivery_date")
        .eq("customer_id", Number(customerId))
        .gte("delivery_date", start)
        .lte("delivery_date", end)
        .order("delivery_date");

      if (notesErr) throw new Error(notesErr.message);

      if (!notes || notes.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const noteIds = notes.map((n) => n.id);
      const { data: items, error: itemsErr } = await supabase
        .from("delivery_items")
        .select("*")
        .in("delivery_id", noteIds)
        .order("seq");

      if (itemsErr) throw new Error(itemsErr.message);

      const noteMap = new Map(notes.map((n) => [n.id, n]));
      const result: BillingRow[] = (items || []).map((it) => ({
        ...it as DeliveryItem,
        delivery_number:
          noteMap.get(it.delivery_id)?.delivery_number || "",
        delivery_date:
          noteMap.get(it.delivery_id)?.delivery_date || "",
      }));

      // Sort by delivery_date then delivery_number
      result.sort((a, b) => {
        if (a.delivery_date !== b.delivery_date)
          return a.delivery_date.localeCompare(b.delivery_date);
        return a.delivery_number.localeCompare(b.delivery_number);
      });

      setRows(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成对账单失败");
    } finally {
      setLoading(false);
    }
  }

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const selectedCustomer = customers.find(
    (c) => c.id === Number(customerId)
  );
  const [y, m] = yearMonth.split("-");

  // Group by delivery note maintaining sorted order
  const grouped: [string, BillingRow[]][] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!seen.has(row.delivery_number)) {
      seen.add(row.delivery_number);
      grouped.push([
        row.delivery_number,
        rows.filter((r) => r.delivery_number === row.delivery_number),
      ]);
    }
  }

  if (loadError)
    return <div className="p-8 text-red-500">加载失败：{loadError}</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">月结对账</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-0.5">
              客户 <span className="text-red-500">*</span>
            </label>
            <select
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">请选择</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（对账日：{c.billing_day}号）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-0.5">
              月份
            </label>
            <input
              type="month"
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "查询中..." : "生成对账单"}
          </button>
          {rows.length > 0 && (
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              打印
            </button>
          )}
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Results */}
      {rows.length === 0 && !loading && (
        <div className="bg-white rounded-lg border px-5 py-8 text-center text-gray-400">
          {customerId
            ? "该客户本月无送货记录"
            : "请选择客户和月份后点击「生成对账单」"}
        </div>
      )}

      {rows.length > 0 && (
        <Printable>
          <div className="bg-white rounded-lg border p-6 print:border-0 print:p-0">
            {/* Print header */}
            <div className="hidden print:block mb-4">
              <h1 className="text-xl font-bold text-center">
                {selectedCustomer?.name} — 对账单
              </h1>
              <p className="text-center text-sm mt-1">
                对账周期：{y}年{m}月
              </p>
            </div>

            {/* Screen header */}
            <div className="print:hidden mb-3 text-sm text-gray-600">
              客户：
              <span className="font-bold text-gray-900">
                {selectedCustomer?.name}
              </span>
              &nbsp;&nbsp;|&nbsp;&nbsp; 对账周期：{y}年{m}月
            </div>

            {grouped.map(([dn, grpItems]) => {
              const dnDate = grpItems[0]?.delivery_date || "";
              const subTotal = grpItems.reduce(
                (s, it) => s + Number(it.amount),
                0
              );
              return (
                <div key={dn} className="mb-4">
                  <div className="text-sm font-semibold mb-1 text-gray-700">
                    送货单：{dn} &nbsp; 日期：{dnDate}
                  </div>
                  <table className="w-full text-sm border mb-2">
                    <thead className="bg-gray-100 print:bg-gray-200">
                      <tr>
                        <th className="px-3 py-1.5 border text-left">
                          序号
                        </th>
                        <th className="px-3 py-1.5 border text-left">
                          订单号
                        </th>
                        <th className="px-3 py-1.5 border text-left">
                          料号
                        </th>
                        <th className="px-3 py-1.5 border text-left">
                          品名
                        </th>
                        <th className="px-3 py-1.5 border text-right w-20">
                          数量
                        </th>
                        <th className="px-3 py-1.5 border text-right w-24">
                          单价
                        </th>
                        <th className="px-3 py-1.5 border text-right w-28">
                          金额
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grpItems.map((it) => (
                        <tr key={it.id}>
                          <td className="px-3 py-1 border text-center">
                            {it.seq}
                          </td>
                          <td className="px-3 py-1 border">
                            {it.order_number || ""}
                          </td>
                          <td className="px-3 py-1 border">
                            {it.material_code || ""}
                          </td>
                          <td className="px-3 py-1 border">
                            {it.product_name}
                          </td>
                          <td className="px-3 py-1 border text-right">
                            {it.quantity}
                          </td>
                          <td className="px-3 py-1 border text-right">
                            {Number(it.unit_price).toFixed(4)}
                          </td>
                          <td className="px-3 py-1 border text-right font-mono">
                            {Number(it.amount).toLocaleString("zh-CN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-right text-sm">
                    小计：¥
                    {subTotal.toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              );
            })}

            {/* Grand Total */}
            <div className="border-t pt-2 text-right font-bold text-lg">
              合计：¥
              {total.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </Printable>
      )}
    </div>
  );
}
