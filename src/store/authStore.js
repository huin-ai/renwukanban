import { create } from "zustand";
import { persist } from "zustand/middleware";

// 统一存储 key（你原来是 taskflow_auth_v2，这里升级到 v3）
const STORAGE_KEY = "taskflow_auth_v3";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      expiresAt: 0, // ms timestamp
      user: null, // { id, name, username, role }

      // ✅ 设置会话（登录/刷新都用它）
      setSession: ({ token, refreshToken, expiresAt, user }) =>
        set({
          token,
          refreshToken,
          expiresAt,
          user
        }),

      // ✅ 退出：清空全部
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          expiresAt: 0,
          user: null
        }),

      // ✅ 是否已过期
      isExpired: () => {
        const { token, expiresAt } = get();
        if (!token) return true;
        // 给 3 秒“网络/渲染缓冲”
        return !expiresAt || Date.now() >= expiresAt - 3000;
      }
    }),
    { name: STORAGE_KEY }
  )
);