import React from "react";
import { useAuthStore } from "../store/authStore.js";
import ErrorState from "./ErrorState.jsx";

// admin > editor > viewer
const LEVEL = { viewer: 1, editor: 2, admin: 3 };
const roleText = { admin: "管理员", editor: "编辑者", viewer: "访客" };

export default function Guard({ allow = ["admin"], children }) {
  const role = useAuthStore((s) => s.user?.role || "viewer");
  const ok = allow.some((r) => LEVEL[role] >= LEVEL[r]);

  if (!ok) {
    return (
      <ErrorState
        title="无权限"
        message={`你的角色：${roleText[role] || "访客"}，无法访问该内容`}
      />
    );
  }
  return children;
}