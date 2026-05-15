import { useState } from "react";
import type { Customer } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => Promise<void>;
  customer?: Customer | null;
}

function initForm(c: Customer | null | undefined) {
  return {
    name: c?.name ?? "",
    contact: c?.contact ?? "",
    phone: c?.phone ?? "",
    address: c?.address ?? "",
    billing_day: c?.billing_day ?? 25,
  };
}

export function CustomerModal({ open, onClose, onSave, customer }: Props) {
  const [form, setForm] = useState(() => initForm(customer));
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({ ...form, billing_day: Number(form.billing_day) });
    setSaving(false);
  };

  const inputCls =
    "w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-[480px] max-w-[95vw] shadow-xl">
        <div className="px-6 py-4 border-b font-semibold text-lg">
          {customer ? "编辑客户" : "新增客户"}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">
                公司名称 <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-0.5">联系人</label>
                <input
                  className={inputCls}
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-0.5">电话</label>
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">地址</label>
              <input
                className={inputCls}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-0.5">每月对账日</label>
              <select
                className={inputCls}
                value={form.billing_day}
                onChange={(e) => setForm({ ...form, billing_day: Number(e.target.value) })}
              >
                {[25, 30, 31, 5, 10, 15, 20, 28].map((d) => (
                  <option key={d} value={d}>
                    每月 {d} 号
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="px-6 py-3 border-t flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-1.5 text-sm border rounded hover:bg-gray-50"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
