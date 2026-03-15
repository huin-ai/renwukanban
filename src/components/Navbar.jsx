import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { logoutSession } from "../api/authedApi.js";
import { request } from "../api/client.js";

const roleText = { admin: "管理员", editor: "编辑者", viewer: "访客" };

function Icon({ name }) {
  // 不引第三方图标库：用简单 SVG
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "dashboard")
    return (
      <svg {...common}>
        <path {...stroke} d="M4 13h7V4H4v9zM13 20h7V11h-7v9zM13 9h7V4h-7v5zM4 20h7v-5H4v5z" />
      </svg>
    );
  if (name === "projects")
    return (
      <svg {...common}>
        <path {...stroke} d="M4 6h16M4 12h10M4 18h16" />
      </svg>
    );
  return (
    <svg {...common}>
      <path {...stroke} d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
      <path {...stroke} d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.2-2-3.5-2.3.7a8 8 0 0 0-1.7-1l-.3-2.4h-4l-.3 2.4a8 8 0 0 0-1.7 1L6.5 8.3 4.5 11.8l2 1.2a7.97 7.97 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.7a8 8 0 0 0 1.7 1l.3 2.4h4l.3-2.4a8 8 0 0 0 1.7-1l2.3.7 2-3.5-2-1.2z" />
    </svg>
  );
}

export default function Navbar({ variant = "sidebar" }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

 async function onLogout() {
  try {
    const token = useAuthStore.getState().token;
    await request(() => logoutSession({ token }));
  } catch {
    // 忽略退出接口失败
  } finally {
    logout();
    navigate("/login", { replace: true });
  }
}

  if (variant === "topbar") {
    return (
      <div className="topbar__inner">
        <div className="topbar__search">
          <input className="input input--top" placeholder="搜索：项目 / 任务（演示）" disabled />
        </div>

        <div className="topbar__user">
          <span className="pill">角色：{roleText[user?.role] || "访客"}</span>
          <span className="muted">你好，{user?.name || "用户"}</span>
          <button className="btn btn--ghost" onClick={onLogout}>
            退出
          </button>
        </div>
      </div>
    );
  }

  return (
    <nav className="menu">
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "menu__item active" : "menu__item")}>
        <span className="menu__icon"><Icon name="dashboard" /></span>
        <span>仪表盘</span>
      </NavLink>

      <NavLink to="/projects" className={({ isActive }) => (isActive ? "menu__item active" : "menu__item")}>
        <span className="menu__icon"><Icon name="projects" /></span>
        <span>项目</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => (isActive ? "menu__item active" : "menu__item")}>
        <span className="menu__icon"><Icon name="settings" /></span>
        <span>设置</span>
      </NavLink>
    </nav>
  );
}