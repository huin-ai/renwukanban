import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { refreshSession } from "../api/authedApi.js";
import Loading from "../components/Loading.jsx";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isExpired = useAuthStore((s) => s.isExpired);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  const location = useLocation();
  const [booting, setBooting] = React.useState(false);

  // ✅ 有 token 但过期：尝试无感刷新一次
  React.useEffect(() => {
    let alive = true;

    async function run() {
      if (!token) return;
      if (!isExpired()) return;

      if (!refreshToken) {
        logout();
        return;
      }

      try {
        setBooting(true);
        const res = await refreshSession({ refreshToken });
        if (!alive) return;
        setSession(res);
      } catch (e) {
        if (!alive) return;
        logout();
        toast.error(e?.message || "登录已过期，请重新登录");
      } finally {
        if (alive) setBooting(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [token, refreshToken, isExpired, setSession, logout]);

  if (booting) return <Loading label="正在恢复会话..." />;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 如果 token 已过期且刷新失败，effect 会 logout()，此处会触发跳转
  if (token && isExpired() && !booting) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}