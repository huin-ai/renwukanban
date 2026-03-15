import React from "react";

export default function TaskList({ tasks, onToggle, onDelete, canToggle, canDelete }) {
  if (!tasks || tasks.length === 0) {
    return <div className="muted">暂无任务</div>;
  }

  return (
    <ul className="list">
      {tasks.map((t) => (
        <li key={t.id} className="list__item">
          <div className="row" style={{ gap: 10, flex: 1, minWidth: 0 }}>
            <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} disabled={!canToggle} />

            <span
              title={t.title}
              style={{
                textDecoration: t.done ? "line-through" : "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {t.title}
            </span>
          </div>

          <button className="btn btn--danger" onClick={() => onDelete(t.id)} disabled={!canDelete}>
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}