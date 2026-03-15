import React from "react";

export default function Loading({ label = "加载中..." }) {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: 120 }} />
      <div className="skeleton" style={{ height: 12, width: 260, marginTop: 10 }} />
      <div className="skeleton" style={{ height: 12, width: 220, marginTop: 8 }} />
      <div className="muted" style={{ marginTop: 12 }}>{label}</div>
    </div>
  );
}