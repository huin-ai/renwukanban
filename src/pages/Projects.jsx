import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createProject, deleteProject, getProjects } from "../api/authedApi.js";
import { request } from "../api/client.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchBar from "../components/SearchBar.jsx";
import SortSelect from "../components/SortSelect.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useTitle } from "../hooks/useTitle.js";
import toast from "react-hot-toast";
import Can from "../components/Can.jsx";
import { useAuthStore } from "../store/authStore.js";
import { hasPermission } from "../auth/permissions.js";

export default function Projects() {
  useTitle("项目");

  const user = useAuthStore((s) => s.user);

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);

  const [sort, setSort] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  React.useEffect(() => setPage(1), [debouncedQ, sort]);

  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["projects", { q: debouncedQ, sort, page, pageSize }],
    [debouncedQ, sort, page, pageSize]
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => request(() => getProjects({ q: debouncedQ, sort, page, pageSize })),
    keepPreviousData: true
  });

  const createMut = useMutation({
    mutationFn: (name) => request(() => createProject({ name })),
    onSuccess: () => {
      toast.success("项目已创建");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: (projectId) => request(() => deleteProject({ projectId })),
    onSuccess: () => {
      toast.success("项目已删除");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  if (isLoading) return <Loading label="正在加载项目..." />;
  if (error) return <ErrorState title="加载失败" message={error.message} actionText="重试" onAction={refetch} />;

  const items = data.items;

  const canDelete = hasPermission(user, "project.delete");

  async function onCreate() {
    const name = window.prompt("输入项目名称：");
    if (!name) return;
    createMut.mutate(name);
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2>项目</h2>
            <div className="muted" style={{ marginTop: 6 }}>
              支持搜索 / 排序 / 分页（并接入：RBAC + 统一鉴权 + 无感刷新）
            </div>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <Can permission="project.create">
              <button className="btn" onClick={onCreate} disabled={createMut.isPending}>
                {createMut.isPending ? "创建中..." : "新建项目"}
              </button>
            </Can>
            <button className="btn btn--ghost" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "刷新中..." : "刷新"}
            </button>
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="搜索项目名称..." />
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="暂无项目" message="尝试换个关键词搜索，或创建一个新项目。" />
      ) : (
        <div className="grid3">
          {items.map((p) => (
            <div className="card" key={p.id}>
              <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="row" style={{ gap: 8 }}>
                  <Link to={`/projects/${p.id}`} className="btn btn--ghost">
                    进入
                  </Link>
                  {canDelete && (
                    <button
                      className="btn btn--danger"
                      onClick={() => deleteMut.mutate(p.id)}
                      disabled={deleteMut.isPending}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <Pagination total={data.total} page={page} pageSize={pageSize} onChange={setPage} />
      </div>
    </div>
  );
}