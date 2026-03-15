import React from "react";

function fmt(ts) {
  if (!ts) return "未设置";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function TaskDrawer({
  open,
  task,
  canEdit,
  canDeleteComment,
  onClose,
  onSavePatch,
  saving,
  onAddComment,
  commenting,
  onDeleteComment
}) {
  // ✅ 为了做“退出动画”，我们需要在 open=false 时先保留一小段时间再卸载
  const [mounted, setMounted] = React.useState(open);
  const [visible, setVisible] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // 下一帧再设为可见，确保 transition 生效
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      // 等动画结束再真正卸载
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ESC 关闭
  React.useEffect(() => {
    if (!mounted) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        handleRequestClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted]);

  const [draft, setDraft] = React.useState({
    title: "",
    description: "",
    priority: "P2",
    dueAt: ""
  });
  const [labelsText, setLabelsText] = React.useState("");
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    if (!open || !task) return;
    setDraft({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "P2",
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : ""
    });
    setLabelsText((task.labels || []).join(", "));
    setComment("");
  }, [open, task]);

  if (!mounted) return null;

  function save() {
    const labels = labelsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const dueAt = draft.dueAt ? new Date(draft.dueAt).getTime() : null;

    onSavePatch?.({
      title: draft.title.trim(),
      description: draft.description,
      priority: draft.priority,
      labels,
      dueAt
    });
  }

  // ✅ 触发关闭：先播放退出动画，再回调 onClose（由父组件真正把 open 置 false）
  function handleRequestClose() {
    // 如果父组件已经是 open=false，这里也没关系
    onClose?.();
  }

  const panelStyle = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.05)",
    boxShadow: "0 12px 30px rgba(0,0,0,.25)",
    padding: 14
  };

  const duration = 220;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: visible ? "auto" : "none" // 退出时避免误点
      }}
      onMouseDown={handleRequestClose}
    >
      {/* ✅ 遮罩：淡入淡出 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.62)",
          opacity: visible ? 1 : 0,
          transition: `opacity ${duration}ms ease`
        }}
      />

      {/* ✅ 抽屉：右侧滑入滑出 + 淡入淡出 */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: 560,
          maxWidth: "92vw",
          overflow: "auto",

          background: "rgba(18, 20, 28, 0.98)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",

          borderLeft: "1px solid rgba(255,255,255,.12)",
          boxShadow: "-20px 0 60px rgba(0,0,0,.55)",
          padding: 16,

          transform: visible ? "translateX(0)" : "translateX(24px)",
          opacity: visible ? 1 : 0,
          transition: `transform ${duration}ms ease, opacity ${duration}ms ease`
        }}
      >
        {/* Header */}
        <div
          style={{
            ...panelStyle,
            background: "rgba(255,255,255,.04)"
          }}
        >
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                任务详情
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  marginTop: 6,
                  wordBreak: "break-word",
                  color: "rgba(255,255,255,.95)"
                }}
              >
                {task?.title || "—"}
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                更新：{fmt(task?.updatedAt)} · 创建：{fmt(task?.createdAt)}
              </div>
            </div>

            <button className="btn btn--ghost" onClick={handleRequestClose} type="button">
              关闭
            </button>
          </div>
        </div>

        <div className="stack" style={{ marginTop: 14 }}>
          {/* 基础信息 */}
          <div style={panelStyle}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>基础信息</div>
              <button className="btn" disabled={!canEdit || saving} onClick={save} type="button">
                {saving ? "保存中..." : "保存"}
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <div className="label">标题</div>
              <input
                className="input"
                value={draft.title}
                disabled={!canEdit}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <div className="label">描述</div>
              <textarea
                className="input"
                style={{ minHeight: 110, resize: "vertical" }}
                value={draft.description}
                disabled={!canEdit}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="补充任务背景、验收标准、风险点……"
              />
            </div>

            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="label">优先级</div>
                <select
                  className="input"
                  value={draft.priority}
                  disabled={!canEdit}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                >
                  <option value="P0">P0（最高）</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3（最低）</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <div className="label">截止日期</div>
                <input
                  className="input"
                  type="date"
                  value={draft.dueAt}
                  disabled={!canEdit}
                  onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div className="label">标签（逗号分隔）</div>
              <input
                className="input"
                value={labelsText}
                disabled={!canEdit}
                onChange={(e) => setLabelsText(e.target.value)}
                placeholder="例如：前端, 埋点, 性能"
              />
            </div>
          </div>

          {/* 评论 */}
          <div style={panelStyle}>
            <div style={{ fontWeight: 900, color: "rgba(255,255,255,.92)" }}>评论</div>

            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <input
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="写下评论…"
              />
              <button
                className="btn"
                type="button"
                disabled={commenting || !comment.trim()}
                onClick={() => {
                  const text = comment.trim();
                  if (!text) return;
                  onAddComment?.(text);
                  setComment("");
                }}
              >
                {commenting ? "发送中..." : "发送"}
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {(task?.comments || []).length === 0 ? (
                <div className="muted">暂无评论</div>
              ) : (
                <div className="stack">
                  {(task.comments || []).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,.10)",
                        background: "rgba(0,0,0,.18)"
                      }}
                    >
                      <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {c.author} · {fmt(c.createdAt)}
                        </div>
                        <button
                          className="btn btn--ghost"
                          type="button"
                          disabled={!canDeleteComment}
                          onClick={() => onDeleteComment?.(c)}
                          title={!canDeleteComment ? "无权限删除评论" : "删除评论"}
                        >
                          删除
                        </button>
                      </div>
                      <div style={{ marginTop: 6, whiteSpace: "pre-wrap", color: "rgba(255,255,255,.92)" }}>
                        {c.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            动画：遮罩淡入淡出 + 抽屉 translateX 滑入滑出（{duration}ms）。支持 ESC / 点击遮罩关闭。
          </div>
        </div>
      </div>
    </div>
  );
}