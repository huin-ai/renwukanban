import React from "react";

export default function SearchBar({ value, onChange, placeholder = "搜索..." }) {
  return (
    <input
      className="input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}