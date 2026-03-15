import React from "react";
import { useAuthStore } from "../store/authStore.js";
import { hasPermission } from "../auth/permissions.js";

export default function Can({ permission, children, fallback = null }) {
  const user = useAuthStore((s) => s.user);
  const ok = hasPermission(user, permission);
  return ok ? children : fallback;
}