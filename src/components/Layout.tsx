import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV = [
  { to: "/", label: "首页" },
  { to: "/customers", label: "客户管理" },
  { to: "/delivery-notes", label: "送货单" },
  { to: "/billing", label: "月结对账" },
];

export function Layout() {
  const loc = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-52 bg-slate-800 text-white shrink-0 flex flex-col">
        <div className="px-5 py-4 text-lg font-bold tracking-wide border-b border-slate-700">
          JeLan 佳蓝
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((n) => {
            const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block px-5 py-2.5 text-sm ${active ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700/50"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700 px-5 py-3">
          <div className="text-xs text-slate-400 truncate mb-2">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white"
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
