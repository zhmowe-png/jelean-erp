import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("请填写邮箱和密码");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess("注册成功！请前往邮箱确认（如已禁用邮箱确认则可直接登录）");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-[400px] bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">JeLan 佳蓝纸品</h1>
          <p className="text-sm text-gray-500 mt-1">创建管理员账号</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
              {success}
            </div>
            <Link
              to="/login"
              className="text-blue-600 hover:underline text-sm"
            >
              前往登录
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">邮箱</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jelean.com"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">密码</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-1">确认密码</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading ? "注册中..." : "注 册"}
            </button>

            <p className="text-center text-sm text-gray-500">
              已有账号？
              <Link to="/login" className="text-blue-600 hover:underline ml-1">
                返回登录
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
