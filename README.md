# TaskFlow - React Kanban 项目管理系统

一个基于 **React + Vite** 构建的看板式任务管理系统，支持拖拽排序、权限控制、任务详情抽屉、评论系统等功能。
该项目模拟真实团队项目管理场景，重点实现复杂交互与权限体系。

---


# 技术栈

| 技术             | 说明            |
| -------------- | ------------- |
| React          | UI 框架         |
| Vite           | 前端构建工具        |
| React Router   | 路由管理          |
| TanStack Query | 服务端状态管理       |
| dnd-kit        | 拖拽系统          |
| Zustand        | 轻量状态管理        |
| localStorage   | Mock API 数据存储 |

---

# 核心功能

## 1 Kanban 拖拽看板

使用 **dnd-kit** 实现任务拖拽排序：

* 支持跨列拖拽
* 支持列内排序
* 支持键盘拖拽（可访问性）
* 拖拽实时更新 UI

拖拽流程：

```
DragStart
   ↓
DragOver
   ↓
DragEnd
   ↓
updateTaskStatus()
```

---

## 2 RBAC 权限系统

实现三种角色：

```
Admin
Editor
Viewer
```

权限矩阵：

| 操作   | Admin | Editor | Viewer |
| ---- | ----- | ------ | ------ |
| 查看项目 | ✓     | ✓      | ✓      |
| 创建项目 | ✓     | ✓      | ✗      |
| 拖拽任务 | ✓     | ✓      | ✗      |
| 删除任务 | ✓     | ✗      | ✗      |

权限控制分为三层：

1️⃣ **路由层**

```
<Guard allow={["admin"]}>
```

2️⃣ **组件层**

```
canDelete
canDrag
```

3️⃣ **数据层**

```
viewer 无法访问 internal 项目
```

---

## 3 乐观更新（Optimistic Update）

拖拽任务时 UI 立即更新：

```
UI update
   ↓
API request
   ↓
success → 保持
fail → 回滚
```

优势：

* 提升用户体验
* 减少等待时间
* 模拟真实后端行为

---

## 4 Task Drawer 任务详情

点击任务打开右侧 Drawer：

功能包括：

* 编辑任务标题
* 修改优先级
* 标签管理
* 截止日期
* 评论系统

技术实现：

```
React Portal
```

避免 z-index 与父组件 stacking context 冲突。

---

## 5 Mock API + 数据迁移

使用 **localStorage** 模拟后端 API。

数据库结构：

```
users
projects
tasks
sessions
```

支持 **migration**：

```
v1 → v2
v2 → v3
v3 → v4
```

保证数据结构升级时不会丢失数据。

---

# 项目结构

```
src
 ├─ api
 │   ├─ fakeApi.js
 │   ├─ authedApi.js
 │
 ├─ components
 │   ├─ KanbanBoard.jsx
 │   ├─ TaskDrawer.jsx
 │   ├─ Guard.jsx
 │
 ├─ pages
 │   ├─ Dashboard.jsx
 │   ├─ Projects.jsx
 │   ├─ Settings.jsx
 │
 ├─ store
 │   ├─ authStore.js
 │
 └─ App.jsx
```

---

# 本地运行

安装依赖：

```
npm install
```

启动项目：

```
npm run dev
```

访问：

```
http://localhost:5173
```

---

# Demo 账号

```
Admin
账号：admin
密码：123456
```

```
Editor
账号：editor
密码：123456
```

```
Viewer
账号：viewer
密码：123456
```

---

# 项目亮点

1️⃣ 拖拽看板复杂交互
2️⃣ RBAC 权限控制
3️⃣ 乐观更新与失败回滚
4️⃣ Portal Drawer UI
5️⃣ Mock API + Migration

---

# 未来优化

* 虚拟列表优化大数据量任务
* WebSocket 实现实时协作
* Undo / Redo 操作历史
* 操作审计日志

---

# 作者

React 学习项目，用于提升复杂交互与前端工程能力。
