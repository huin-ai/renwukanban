import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  addTask,
  deleteTask,
  getProject,
  getTasks,
  updateTaskStatus,
  updateTaskMeta,
  getTaskDetail,
  updateTaskDetail,
  addTaskComment,
  deleteTaskComment
} from "../api/authedApi.js";
import { request } from "../api/client.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import KanbanBoard from "../components/KanbanBoard.jsx";
import TaskEditModal from "../components/TaskEditModal.jsx";
import TaskDrawer from "../components/TaskDrawer.jsx";
import { useTitle } from "../hooks/useTitle.js";
import { useAuthStore } from "../store/authStore.js";
import { hasPermission } from "../auth/permissions.js";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [sp, setSp] = useSearchParams();
  useTitle("项目详情");

  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const canWrite = hasPermission(user, "task.write");
  const canDelete = hasPermission(user, "task.delete");

  // 旧弹窗（编辑标题）
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeTaskId, setActiveTaskId] = React.useState(sp.get("task") || null);

  React.useEffect(() => {
    const t = sp.get("task");
    if (t) {
      setActiveTaskId(t);
      setDrawerOpen(true);
    }
  }, [sp]);

  const projectQ = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => request(() => getProject({ projectId }))
  });

  const tasksQ = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => request(() => getTasks({ projectId }))
  });

  const taskDetailQ = useQuery({
    queryKey: ["taskDetail", projectId, activeTaskId],
    enabled: !!activeTaskId && drawerOpen,
    queryFn: () => request(() => getTaskDetail({ projectId, taskId: activeTaskId }))
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
    onSuccess: (_res, taskId) => {
      toast.success("任务已删除");
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      if (activeTaskId === taskId) closeDrawer();
    }
  });

  // 拖拽移动：乐观更新 + 回滚
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

    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] })
  });

  // 编辑标题 Modal：保持你现有逻辑
  const editTitleMut = useMutation({
    mutationFn: ({ taskId, title }) => request(() => updateTaskMeta({ projectId, taskId, title })),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      qc.invalidateQueries({ queryKey: ["taskDetail", projectId, activeTaskId] });
    }
  });

  // Drawer 保存详情：乐观更新 + 回滚
  const saveDetailMut = useMutation({
    mutationFn: (patch) => request(() => updateTaskDetail({ projectId, taskId: activeTaskId, patch })),

    onMutate: async (patch) => {
      const key = ["taskDetail", projectId, activeTaskId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      qc.setQueryData(key, (old) => (old ? { ...old, ...patch, updatedAt: Date.now() } : old));

      if (patch?.title) {
        qc.setQueryData(["tasks", projectId], (old = []) =>
          old.map((t) => (t.id === activeTaskId ? { ...t, title: patch.title } : t))
        );
      }

      return { prev };
    },

    onError: (err, _patch, ctx) => {
      const key = ["taskDetail", projectId, activeTaskId];
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(err?.message || "保存失败，已回滚");
    },

    onSuccess: () => toast.success("已保存"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["taskDetail", projectId, activeTaskId] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  });

  const addCommentMut = useMutation({
    mutationFn: (content) =>
      request(() =>
        addTaskComment({
          projectId,
          taskId: activeTaskId,
          content,
          author: user?.name || user?.username || "User"
        })
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["taskDetail", projectId, activeTaskId] });
      toast.success("评论已发送");
    }
  });

  const delCommentMut = useMutation({
    mutationFn: (commentId) =>
      request(() => deleteTaskComment({ projectId, taskId: activeTaskId, commentId })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["taskDetail", projectId, activeTaskId] });
      toast.success("评论已删除");
    }
  });

  if (projectQ.isLoading || tasksQ.isLoading) return <Loading label="正在加载项目..." />;
  if (projectQ.error)
    return <ErrorState title="加载失败" message={projectQ.error.message} actionText="重试" onAction={projectQ.refetch} />;
  if (tasksQ.error)
    return <ErrorState title="加载失败" message={tasksQ.error.message} actionText="重试" onAction={tasksQ.refetch} />;

  const project = projectQ.data;
  const tasks = tasksQ.data || [];
  const detail = taskDetailQ.data;

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

  function openDrawer(taskId) {
    setActiveTaskId(taskId);
    setDrawerOpen(true);
    sp.set("task", taskId);
    setSp(sp, { replace: true });
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setActiveTaskId(null);
    sp.delete("task");
    setSp(sp, { replace: true });
  }

  function onOpenTask(task) {
    openDrawer(task.id);
  }

  function onEditTask(task) {
    if (!canWrite) return toast.error("你没有权限编辑任务");
    setEditingTask(task);
    setEditOpen(true);
  }

  function onDeleteTask(task) {
    if (!canDelete) return toast.error("你没有权限删除任务");
    const ok = window.confirm(`确认删除任务：\n${task.title}`);
    if (!ok) return;
    delMut.mutate(task.id);
  }

  async function onCopyLink(task) {
    const url = `${window.location.origin}/projects/${projectId}?task=${encodeURIComponent(task.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
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
            <div className="muted">点击任务卡打开右侧抽屉：描述/优先级/截止/标签/评论（支持深链）</div>
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
          onOpen={onOpenTask}
        />
      </div>

      {/* 旧的编辑标题弹窗，保留也行 */}
      <TaskEditModal
        open={editOpen}
        task={editingTask}
        saving={editTitleMut.isPending}
        onClose={() => {
          setEditOpen(false);
          setEditingTask(null);
        }}
        onSave={({ title }) => {
          if (!editingTask) return;
          editTitleMut.mutate({ taskId: editingTask.id, title });
          setEditOpen(false);
          setEditingTask(null);
        }}
      />

      <TaskDrawer
        open={drawerOpen}
        task={detail}
        canEdit={canWrite}
        canDeleteComment={canDelete}
        saving={saveDetailMut.isPending}
        commenting={addCommentMut.isPending}
        onClose={closeDrawer}
        onSavePatch={(patch) => {
          if (!activeTaskId) return;
          if (!canWrite) return toast.error("你没有权限编辑任务");
          saveDetailMut.mutate(patch);
        }}
        onAddComment={(text) => {
          if (!activeTaskId) return;
          addCommentMut.mutate(text);
        }}
        onDeleteComment={(c) => {
          if (!activeTaskId) return;
          if (!canDelete) return toast.error("你没有权限删除评论");
          const ok = window.confirm("确认删除该评论？");
          if (!ok) return;
          delCommentMut.mutate(c.id);
        }}
      />
    </div>
  );
}