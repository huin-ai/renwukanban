import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { addTask, deleteTask, getProject, getTasks, updateTaskMeta, updateTaskStatus } from "../api/authedApi.js";
import { request } from "../api/client.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import KanbanBoard from "../components/KanbanBoard.jsx";
import TaskEditModal from "../components/TaskEditModal.jsx";
import { useTitle } from "../hooks/useTitle.js";
import { useAuthStore } from "../store/authStore.js";
import { hasPermission } from "../auth/permissions.js";

export default function ProjectDetail() {
  const { projectId } = useParams();
  useTitle("项目详情");

  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const canWrite = hasPermission(user, "task.write");
  const canDelete = hasPermission(user, "task.delete");

  const [editing, setEditing] = React.useState(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const projectQ = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => request(() => getProject({ projectId }))
  });

  const tasksQ = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => request(() => getTasks({ projectId }))
  });

  const addMut = useMutation({
    mutationFn: (title) => request(() => addTask({ projectId, title })),
    onSuccess: () => {
      toast.success("任务已添加");
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  });

  const delMut = useMutation({
    mutationFn: (taskId) => request(() => deleteTask({ projectId, taskId })),
    onSuccess: () => {
      toast.success("任务已删除");
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  });

  // ✅ 拖拽移动：乐观更新 + 回滚
  const moveMut = useMutation({
    mutationFn: ({ taskId, status, beforeId }) =>
      request(() => updateTaskStatus({ projectId, taskId, status, beforeId })),

    onMutate: async ({ taskId, status, beforeId }) => {
      await qc.cancelQueries({ queryKey: ["tasks", projectId] });
      const prev = qc.getQueryData(["tasks", projectId]) || [];

      const next = [...prev];
      const fromIdx = next.findIndex((t) => t.id === taskId);
      if (fromIdx === -1) return { prev };

      const moving = { ...next[fromIdx], status };
      next.splice(fromIdx, 1);

      let insertAt = next.length;

      if (beforeId) {
        const overIdx = next.findIndex((t) => t.id === beforeId);
        if (overIdx !== -1) insertAt = overIdx;
      } else {
        const lastSameReverseIdx = [...next].reverse().findIndex((t) => t.status === status);
        if (lastSameReverseIdx === -1) insertAt = next.length;
        else {
          const lastSameIdx = next.length - 1 - lastSameReverseIdx;
          insertAt = lastSameIdx + 1;
        }
      }

      next.splice(insertAt, 0, moving);
      qc.setQueryData(["tasks", projectId], next);

      return { prev };
    },

    onError: (err, _vars, ctx) => {
      qc.setQueryData(["tasks", projectId], ctx?.prev || []);
      toast.error(err?.message || "移动失败，已回滚");
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  });

  // ✅ 编辑标题：乐观更新 + 回滚
  const editMut = useMutation({
    mutationFn: ({ taskId, title }) => request(() => updateTaskMeta({ projectId, taskId, title })),

    onMutate: async ({ taskId, title }) => {
      await qc.cancelQueries({ queryKey: ["tasks", projectId] });
      const prev = qc.getQueryData(["tasks", projectId]) || [];

      qc.setQueryData(["tasks", projectId], (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, title } : t))
      );

      return { prev };
    },

    onError: (err, _vars, ctx) => {
      qc.setQueryData(["tasks", projectId], ctx?.prev || []);
      toast.error(err?.message || "保存失败，已回滚");
    },

    onSuccess: () => toast.success("已保存"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] })
  });

  if (projectQ.isLoading || tasksQ.isLoading) return <Loading label="正在加载项目..." />;
  if (projectQ.error)
    return <ErrorState title="加载失败" message={projectQ.error.message} actionText="重试" onAction={projectQ.refetch} />;
  if (tasksQ.error)
    return <ErrorState title="加载失败" message={tasksQ.error.message} actionText="重试" onAction={tasksQ.refetch} />;

  const project = projectQ.data;
  const tasks = tasksQ.data || [];

  function onAdd() {
    if (!canWrite) return toast.error("你没有权限新增/编辑任务");
    const title = window.prompt("输入任务标题：");
    if (!title) return;
    addMut.mutate(title);
  }

  function onMove({ taskId, toStatus, beforeId }) {
    if (!canWrite) return;
    moveMut.mutate({ taskId, status: toStatus, beforeId });
  }

  function onEditTask(task) {
    if (!canWrite) return toast.error("你没有权限编辑任务");
    setEditing(task);
    setEditOpen(true);
  }

  function onDeleteTask(task) {
    if (!canDelete) return toast.error("你没有权限删除任务");
    const ok = window.confirm(`确认删除任务：\n${task.title}`);
    if (!ok) return;
    delMut.mutate(task.id);
  }

  async function onCopyLink(task) {
    // 不强依赖你的路由是否支持 taskId，链接至少能定位到项目页并带参数
    const url = `${window.location.origin}/projects/${projectId}?task=${encodeURIComponent(task.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
      // 兼容性兜底
      window.prompt("复制下面链接：", url);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ marginTop: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {project.name}
            </h2>
            <div className="muted">任务卡右上角 ⋯：编辑 / 删除 / 复制链接（并支持乐观更新回滚）</div>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <button className="btn" onClick={onAdd} disabled={!canWrite || addMut.isPending}>
              {addMut.isPending ? "添加中..." : "添加任务"}
            </button>
            <button className="btn btn--ghost" onClick={() => tasksQ.refetch()} disabled={tasksQ.isFetching}>
              {tasksQ.isFetching ? "刷新中..." : "刷新"}
            </button>
          </div>
        </div>

        {!canWrite ? <div className="muted" style={{ marginTop: 10 }}>只读角色：不能拖拽/编辑。</div> : null}
      </div>

      <div className="card">
        <KanbanBoard
          tasks={tasks}
          canDrag={canWrite}
          canDelete={canDelete}
          onMove={onMove}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onCopyLink={onCopyLink}
        />
      </div>

      <TaskEditModal
        open={editOpen}
        task={editing}
        saving={editMut.isPending}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSave={({ title }) => {
          if (!editing) return;
          editMut.mutate({ taskId: editing.id, title });
          setEditOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}