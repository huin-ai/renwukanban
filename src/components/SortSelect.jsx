import React from "react";

export default function SortSelect({ value, onChange }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="createdAt_desc">创建时间：新 → 旧</option>
      <option value="createdAt_asc">创建时间：旧 → 新</option>
    </select>
  );
}