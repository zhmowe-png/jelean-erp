import { useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("请输入管理员密码");
      return;
    }
    setChecking(true);
    setError("");

    // Re-authenticate to verify admin identity
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email;
    if (!email) {
      setError("无法获取当前用户信息");
      setChecking(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("密码错误，操作已取消");
      setChecking(false);
    } else {
      onConfirm();
      setPassword("");
      setError("");
      setChecking(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-[400px] max-w-[95vw] shadow-xl">
        <div className="px-6 py-4 border-b font-semibold text-lg text-red-600">
          {title}
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">{message}</p>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              请输入管理员密码以确认操作
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理员密码"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
            />
          </div>
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-1.5 text-sm border rounded hover:bg-gray-50"
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            type="button"
            disabled={checking}
            onClick={handleConfirm}
            className="px-4 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {checking ? "验证中..." : "确认删除"}
          </button>
        </div>
      </div>
    </div>
  );
}
