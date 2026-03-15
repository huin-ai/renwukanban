import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="brand__title">TaskFlow</div>
            <div className="brand__sub">任务与项目管理</div>
          </div>
        </div>

        <Navbar variant="sidebar" />

        <div className="sidebar__footer">
          <div className="muted">v1.0 · Demo</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <Navbar variant="topbar" />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}