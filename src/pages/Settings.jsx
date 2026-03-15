import React from "react";
import toast from "react-hot-toast";
import Guard from "../components/Guard.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useTitle } from "../hooks/useTitle.js";
import { resetDB } from "../api/authedApi.js";
import { request } from "../api/client.js";

export default function Settings() {
  useTitle("设置");
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const roleText = {
    admin: "管理员",
    editor: "编辑者",
    viewer: "访客"
  };

  async function onResetDemo() {
    const ok = window.confirm(
      "确认重置演示数据？\n\n这会清空本地 localStorage 中的项目/任务数据，并将数据恢复为初始 seed。"
    );
    if (!ok) return;

    try {
      await request(() => resetDB());
      toast.success("演示数据已重置，请重新登录");
      logout();
      window.location.href = "/login";
    } catch (e) {
      toast.error(e?.message || "重置失败");
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>设置</h2>
        <p className="muted">个人资料与权限信息</p>

        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="muted">用户信息</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{user?.name}</div>
            <div className="muted" style={{ marginTop: 6 }}>账号：{user?.username}</div>
            <div style={{ marginTop: 10 }}>
              <span className="pill">角色：{roleText[user?.role] || "访客"}</span>
            </div>
          </div>

          <div className="card" style={{ boxShadow: "none" }}>
            <div className="muted">偏好设置</div>
            <div style={{ marginTop: 6 }}>主题 / 语言 等可在后续扩展。</div>
            <div className="muted" style={{ marginTop: 6 }}>当前为演示面板。</div>
          </div>
        </div>
      </div>

      <Guard allow={["admin"]}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>管理员面板</h3>
          <p className="muted">仅管理员可见（用于面试展示 RBAC + 数据级权限）</p>

          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn--ghost" disabled>
              用户管理（开发中）
            </button>
            <button className="btn btn--ghost" disabled>
              操作审计（开发中）
            </button>

            <div style={{ flex: 1 }} />

            <button className="btn" onClick={onResetDemo}>
              重置演示数据
            </button>
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            Tip：重置后你可以用 admin/editor/viewer 账号快速演示不同角色看到的“数据差异”。
          </div>
        </div>
      </Guard>
    </div>
  );
}