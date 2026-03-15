import React from "react";

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
      <span className="muted">
        第 {page} / {totalPages} 页 · 共 {total} 条
      </span>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn--ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          上一页
        </button>
        <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          下一页
        </button>
      </div>
    </div>
  );
}