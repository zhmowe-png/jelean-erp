import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CustomerModal } from "../components/CustomerModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { Customer } from "../types";

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const { data, error: apiErr } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });
        if (apiErr) throw new Error(apiErr.message);
        if (!cancelled) setCustomers(data || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载客户失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.contact || "").includes(search) ||
          (c.phone || "").includes(search)
      )
    : customers;

  const openNew = () => {
    setEditing(null);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setSaveError(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error: apiErr } = await supabase
        .from("customers")
        .delete()
        .eq("id", deleteTarget.id);
      if (apiErr) throw new Error(apiErr.message);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async (data: Partial<Customer>) => {
    try {
      setSaveError(null);
      if (editing) {
        const { error: apiErr } = await supabase
          .from("customers")
          .update(data)
          .eq("id", editing.id)
          .select("*")
          .single();
        if (apiErr) throw new Error(apiErr.message);
        setCustomers((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
      } else {
        const { data: created, error: apiErr } = await supabase
          .from("customers")
          .insert(data)
          .select("*")
          .single();
        if (apiErr) throw new Error(apiErr.message);
        if (created) setCustomers((prev) => [created as Customer, ...prev]);
      }
      setModalOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存失败");
    }
  };

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;
  if (error) return <div className="p-8 text-red-500">加载失败：{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">客户管理</h1>
        <button
          onClick={openNew}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + 新增客户
        </button>
      </div>

      <div className="mb-4">
        <input
          className="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="搜索客户名称/联系人/电话..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-2.5 text-left">公司名称</th>
              <th className="px-5 py-2.5 text-left">联系人</th>
              <th className="px-5 py-2.5 text-left">电话</th>
              <th className="px-5 py-2.5 text-left">对账日</th>
              <th className="px-5 py-2.5 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-gray-400" colSpan={5}>
                  {search ? "无匹配结果" : "暂无客户，点击上方按钮新增"}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-2">
                    <Link
                      to={`/customers/${c.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-2">{c.contact || "-"}</td>
                  <td className="px-5 py-2">{c.phone || "-"}</td>
                  <td className="px-5 py-2">每月{c.billing_day}号</td>
                  <td className="px-5 py-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomerModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        customer={editing}
      />
      {saveError && (
        <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
          {saveError}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除客户"
        message={`确定要删除客户「${deleteTarget?.name}」吗？该客户的所有送货单将被永久删除，此操作不可恢复。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
