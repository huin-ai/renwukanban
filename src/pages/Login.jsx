import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { login as loginApi } from "../api/authedApi.js";
import { request } from "../api/client.js";
import { useAuthStore } from "../store/authStore.js";
import { useTitle } from "../hooks/useTitle.js";

const schema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(6, "密码至少 6 位")
});

export default function Login() {
  useTitle("登录");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: "admin", password: "123456" }
  });

  async function onSubmit(values) {
    try {
      const res = await request(() => loginApi(values));
      setSession(res);
      toast.success("登录成功");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e.message || "登录失败");
    }
  }

  return (
    <div className="center">
      <div className="card" style={{ width: 460 }}>
        <h2 style={{ marginTop: 0 }}>欢迎回来</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          演示账号：admin / editor / viewer（密码统一：123456）
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="stack" style={{ marginTop: 12 }}>
          <div>
            <label className="label">用户名</label>
            <input className="input" {...register("username")} />
            {errors.username && <div className="error">{String(errors.username.message)}</div>}
          </div>

          <div>
            <label className="label">密码</label>
            <input className="input" type="password" {...register("password")} />
            {errors.password && <div className="error">{String(errors.password.message)}</div>}
          </div>

          <button className="btn" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </button>

          <div className="muted" style={{ fontSize: 12 }}>
          </div>
        </form>
      </div>
    </div>
  );
}