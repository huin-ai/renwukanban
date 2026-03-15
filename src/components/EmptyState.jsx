import React from "react";

export default function EmptyState({ title = "暂无数据", hint = "可以尝试更换关键词或调整筛选条件。" }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted">{hint}</p>
    </div>
  );
}