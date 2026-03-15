import React from "react";

export default function TaskEditModal({ open, task, onClose, onSave, saving }) {
  const [title, setTitle] = React.useState("");

  React.useEffect(() => {
    if (open && task) setTitle(task.title || "");
  }, [open, task]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    onSave?.({ title: title.trim() });
  }

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        className="card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: 520, maxWidth: "92vw" }}
      >
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>编辑任务</h3>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Task ID：{task?.id}
            </div>
          </div>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <form onSubmit={submit} className="stack" style={{ marginTop: 14 }}>
          <div>
            <label className="label">标题</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              autoFocus
            />
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              建议：标题尽量动词开头，便于拆解执行
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
            <button className="btn btn--ghost" type="button" onClick={onClose}>
              取消
            </button>
            <button className="btn" disabled={saving || !title.trim()} type="submit">
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}