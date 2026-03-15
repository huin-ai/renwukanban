import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/authedApi.js";
import { request } from "../api/client.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { useTitle } from "../hooks/useTitle.js";

export default function Dashboard() {
  useTitle("仪表盘");
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard_projects"],
    queryFn: () =>
      request(() =>
        getProjects({ q: "", sort: "createdAt_desc", page: 1, pageSize: 3 }),
      ),
  });

  if (isLoading) return <Loading label="正在加载数据..." />;
  if (error)
    return (
      <ErrorState
        title="加载失败"
        message={error.message}
        actionText="重试"
        onAction={refetch}
      />
    );

  const items = data?.items || [];

  function goProject(id) {
    navigate(`/projects/${id}`);
  }

  return (
    <div className="card">
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>仪表盘</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            最近项目（点击卡片直接进入项目详情）
          </p>
        </div>

        <button
          className="btn btn--ghost"
          onClick={() => navigate("/projects")}
        >
          查看全部项目
        </button>
      </div>

      <div className="grid3" style={{ marginTop: 12 }}>
        {items.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => goProject(p.id)}
            className="card"
            style={{
              textAlign: "left",
              boxShadow: "none",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: "#ffffff",
                fontSize: 18,
              }}
            >
              {p.name}
            </div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              创建时间：{new Date(p.createdAt).toLocaleString()}
            </div>
            <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              点击进入 →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
