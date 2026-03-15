const LS_KEY = "taskflow_db_v3";
const DB_VERSION = 4;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// ---------- Errors ----------
function authError(message = "未登录或登录已过期") {
  const e = new Error(message);
  e.status = 401;
  e.code = "UNAUTHORIZED";
  return e;
}

function forbiddenError(message = "没有权限执行该操作") {
  const e = new Error(message);
  e.status = 403;
  e.code = "FORBIDDEN";
  return e;
}

// ---------- RBAC (数据侧) ----------
// viewer：只读
// editor/admin：可写
function canWrite(role) {
  return role === "admin" || role === "editor";
}
function canDelete(role) {
  return role === "admin";
}

// 统一生成 seed（方便迁移时复用）
function makeSeed() {
  return {
    version: DB_VERSION,
    users: [
      { id: "u_1", username: "admin", password: "123456", name: "Admin", role: "admin" },
      { id: "u_2", username: "editor", password: "123456", name: "Editor", role: "editor" },
      { id: "u_3", username: "viewer", password: "123456", name: "Viewer", role: "viewer" }
    ],

    sessions: {},

    // ✅ 新增 visibility：public | internal
    projects: [
      {
        id: "p_1",
        name: "官网改版项目",
        visibility: "public",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4
      },
      {
        id: "p_2",
        name: "营销活动落地页",
        visibility: "public",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2
      },
      {
        id: "p_3",
        name: "后台权限重构（内部）",
        visibility: "internal",
        createdAt: Date.now() - 1000 * 60 * 60 * 12
      }
    ],

    tasks: {
      p_1: [
        { id: "t_1", title: "确认需求与信息架构", status: "DONE" },
        { id: "t_2", title: "完成首页视觉稿", status: "TODO" },
        { id: "t_3", title: "拆分复用组件", status: "DOING" }
      ],
      p_2: [
        { id: "t_4", title: "组件拆分与复用", status: "TODO" },
        { id: "t_5", title: "接入埋点方案", status: "DOING" }
      ],
      p_3: [{ id: "t_6", title: "实现 RBAC：数据级权限过滤", status: "TODO" }]
    }
  };
}

function writeDB(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

// ---- Migration helpers ----
function normalizeTasks(tasksByProject) {
  const out = tasksByProject || {};
  for (const pid of Object.keys(out)) {
    out[pid] = (out[pid] || []).map((t) => {
      if (typeof t.done === "boolean" && !t.status) {
        return { ...t, status: t.done ? "DONE" : "TODO" };
      }
      if (!t.status) {
        return { ...t, status: "TODO" };
      }
      return t;
    });
  }
  return out;
}

function normalizeProjects(projects) {
  const list = Array.isArray(projects) ? projects : [];
  return list.map((p) => ({
    visibility: "public",
    ...p,
    visibility: p?.visibility === "internal" ? "internal" : "public"
  }));
}

function migrateDB(db) {
  let changed = false;
  let v = Number(db?.version || 1);

  if (v < 2) {
    if (!db.tasks && db.tasksByProject) {
      db.tasks = db.tasksByProject;
      delete db.tasksByProject;
      changed = true;
    }
    if (!db.sessions) {
      db.sessions = {};
      changed = true;
    }
    db.version = 2;
    v = 2;
    changed = true;
  }

  if (v < 3) {
    db.tasks = normalizeTasks(db.tasks);
    db.version = 3;
    v = 3;
    changed = true;
  }

  // v3 -> v4：项目新增 visibility
  if (v < 4) {
    db.projects = normalizeProjects(db.projects);
    db.version = 4;
    v = 4;
    changed = true;
  }

  const seed = makeSeed();
  if (!Array.isArray(db.users)) {
    db.users = seed.users;
    changed = true;
  }
  if (!Array.isArray(db.projects)) {
    db.projects = seed.projects;
    changed = true;
  } else {
    const before = JSON.stringify(db.projects);
    db.projects = normalizeProjects(db.projects);
    if (JSON.stringify(db.projects) !== before) changed = true;
  }

  if (!db.sessions || typeof db.sessions !== "object") {
    db.sessions = {};
    changed = true;
  }
  if (!db.tasks || typeof db.tasks !== "object") {
    db.tasks = {};
    changed = true;
  }

  const beforeTasks = JSON.stringify(db.tasks || {});
  db.tasks = normalizeTasks(db.tasks);
  if (JSON.stringify(db.tasks || {}) !== beforeTasks) changed = true;

  if (typeof db.version !== "number") {
    db.version = DB_VERSION;
    changed = true;
  }

  return { db, changed };
}

function readDB() {
  const raw = localStorage.getItem(LS_KEY);

  if (!raw) {
    const seed = makeSeed();
    writeDB(seed);
    return seed;
  }

  let db;
  try {
    db = JSON.parse(raw);
  } catch {
    const seed = makeSeed();
    writeDB(seed);
    return seed;
  }

  const res = migrateDB(db);
  if (res.changed) writeDB(res.db);
  return res.db;
}

function requireSession(token) {
  if (!token) throw authError("请先登录");
  const db = readDB();
  const sess = db.sessions[token];
  if (!sess) throw authError("登录已失效，请重新登录");
  if (Date.now() >= sess.expiresAt) throw authError("登录已过期，请重新登录");

  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) throw authError("用户不存在，请重新登录");

  return { db, sess, user };
}

function ensureProjectVisibleToUser(project, user) {
  if (!project) return;
  if (user?.role === "viewer" && project.visibility === "internal") {
    // 安全做法：对外表现为“不存在”
    throw new Error("项目不存在");
  }
}

// ---------- Auth ----------
export async function login({ username, password }) {
  await sleep(350);
  const db = readDB();
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (!user) throw new Error("账号或密码错误");

  const token = "atk_" + uid(user.id);
  const refreshToken = "rtk_" + uid(user.id);

  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  db.sessions[token] = { userId: user.id, expiresAt, refreshToken };
  writeDB(db);

  return {
    token,
    refreshToken,
    expiresAt,
    user: { id: user.id, name: user.name, username: user.username, role: user.role }
  };
}

export async function refreshSession({ refreshToken }) {
  await sleep(260);
  const db = readDB();

  const found = Object.entries(db.sessions).find(([, s]) => s.refreshToken === refreshToken);
  if (!found) throw authError("刷新凭证无效，请重新登录");

  const [, sess] = found;
  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) throw authError("用户不存在，请重新登录");

  const newToken = "atk_" + uid(user.id);
  const newRefreshToken = "rtk_" + uid(user.id);
  const newExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  db.sessions[newToken] = { userId: user.id, expiresAt: newExpiresAt, refreshToken: newRefreshToken };
  writeDB(db);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt,
    user: { id: user.id, name: user.name, username: user.username, role: user.role }
  };
}

export async function logoutSession({ token }) {
  await sleep(120);
  const db = readDB();
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    writeDB(db);
  }
  return { ok: true };
}

// ---------- Admin ----------
export async function resetDB({ token }) {
  await sleep(160);
  const { user } = requireSession(token);
  if (user.role !== "admin") throw forbiddenError("仅管理员可重置演示数据");

  const seed = makeSeed();
  writeDB(seed);
  return { ok: true };
}

// ---------- Projects ----------
export async function getProjects({ token, q = "", sort = "createdAt_desc", page = 1, pageSize = 6 }) {
  await sleep(280);
  const { db, user } = requireSession(token);

  let list = [...db.projects];

  // ✅ 数据级权限：viewer 看不到 internal 项目
  if (user.role === "viewer") {
    list = list.filter((p) => p.visibility !== "internal");
  }

  const keyword = q.trim();
  if (keyword) list = list.filter((p) => p.name.includes(keyword));

  if (sort === "createdAt_asc") list.sort((a, b) => a.createdAt - b.createdAt);
  if (sort === "createdAt_desc") list.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "zh"));
  if (sort === "name_desc") list.sort((a, b) => b.name.localeCompare(a.name, "zh"));

  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return { items, total, page, pageSize };
}

export async function createProject({ token, name }) {
  await sleep(260);
  const { db, user } = requireSession(token);
  if (!canWrite(user.role)) throw forbiddenError("你没有权限创建项目");

  const n = (name || "").trim();
  if (!n) throw new Error("项目名称不能为空");

  const p = { id: uid("p"), name: n, visibility: "public", createdAt: Date.now() };
  db.projects.unshift(p);
  db.tasks[p.id] = [];
  writeDB(db);
  return p;
}

export async function deleteProject({ token, projectId }) {
  await sleep(240);
  const { db, user } = requireSession(token);
  if (!canDelete(user.role)) throw forbiddenError("你没有权限删除项目");

  db.projects = db.projects.filter((p) => p.id !== projectId);
  delete db.tasks[projectId];
  writeDB(db);
  return { ok: true };
}

export async function getProject({ token, projectId }) {
  await sleep(220);
  const { db, user } = requireSession(token);

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  return p;
}

// ---------- Tasks ----------
export async function getTasks({ token, projectId }) {
  await sleep(260);
  const { db, user } = requireSession(token);

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  return db.tasks[projectId] || [];
}

export async function addTask({ token, projectId, title }) {
  await sleep(260);
  const { db, user } = requireSession(token);
  if (!canWrite(user.role)) throw forbiddenError("你没有权限新增任务");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const t = (title || "").trim();
  if (!t) throw new Error("任务标题不能为空");

  const task = { id: uid("t"), title: t, status: "TODO" };
  db.tasks[projectId] = [task, ...(db.tasks[projectId] || [])];
  writeDB(db);
  return task;
}

export async function deleteTask({ token, projectId, taskId }) {
  await sleep(220);
  const { db, user } = requireSession(token);
  if (!canDelete(user.role)) throw forbiddenError("你没有权限删除任务");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  db.tasks[projectId] = (db.tasks[projectId] || []).filter((t) => t.id !== taskId);
  writeDB(db);
  return { ok: true };
}

export async function updateTaskMeta({ token, projectId, taskId, title }) {
  await sleep(220);
  const { db, user } = requireSession(token);
  if (!canWrite(user.role)) throw forbiddenError("你没有权限编辑任务");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const list = db.tasks[projectId] || [];
  const idx = list.findIndex((t) => t.id === taskId);
  if (idx < 0) throw new Error("任务不存在");

  const t = (title || "").trim();
  if (!t) throw new Error("标题不能为空");

  list[idx] = { ...list[idx], title: t };
  db.tasks[projectId] = list;
  writeDB(db);

  return list[idx];
}

export async function updateTaskStatus({ token, projectId, taskId, status, beforeId = null }) {
  await sleep(220);
  const { db, user } = requireSession(token);
  if (!canWrite(user.role)) throw forbiddenError("你没有权限拖拽/移动任务");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const list = db.tasks[projectId] || [];
  const fromIdx = list.findIndex((t) => t.id === taskId);
  if (fromIdx < 0) throw new Error("任务不存在");

  const moving = { ...list[fromIdx], status };
  list.splice(fromIdx, 1);

  let insertAt = list.length;

  if (beforeId) {
    const overIdx = list.findIndex((t) => t.id === beforeId);
    if (overIdx !== -1) insertAt = overIdx;
  } else {
    const lastSameReverseIdx = [...list].reverse().findIndex((t) => t.status === status);
    if (lastSameReverseIdx === -1) insertAt = list.length;
    else {
      const lastSameIdx = list.length - 1 - lastSameReverseIdx;
      insertAt = lastSameIdx + 1;
    }
  }

  list.splice(insertAt, 0, moving);
  db.tasks[projectId] = list;
  writeDB(db);

  return moving;
}

// ===== Task Detail / Comments =====
function ensureTaskShape(t) {
  return {
    description: "",
    priority: "P2",
    labels: [],
    dueAt: null,
    createdAt: t?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    comments: [],
    ...t
  };
}

function normalizeProjectTasks(list) {
  return (list || []).map((t) => ensureTaskShape(t));
}

export async function getTaskDetail({ token, projectId, taskId }) {
  await sleep(180);
  const { db, user } = requireSession(token);

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const list = normalizeProjectTasks(db.tasks[projectId] || []);
  const t = list.find((x) => x.id === taskId);
  if (!t) throw new Error("任务不存在");

  db.tasks[projectId] = list;
  writeDB(db);

  return t;
}

export async function updateTaskDetail({ token, projectId, taskId, patch }) {
  await sleep(220);
  const { db, user } = requireSession(token);
  if (!canWrite(user.role)) throw forbiddenError("你没有权限编辑任务详情");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const list = normalizeProjectTasks(db.tasks[projectId] || []);
  const idx = list.findIndex((x) => x.id === taskId);
  if (idx < 0) throw new Error("任务不存在");

  const cur = list[idx];
  const next = {
    ...cur,
    ...patch,
    title: typeof patch?.title === "string" ? patch.title.trim() : cur.title,
    description: typeof patch?.description === "string" ? patch.description : cur.description,
    priority: patch?.priority ?? cur.priority,
    labels: Array.isArray(patch?.labels) ? patch.labels : cur.labels,
    dueAt: patch?.dueAt === "" ? null : patch?.dueAt ?? cur.dueAt,
    updatedAt: Date.now()
  };

  if (!next.title) throw new Error("标题不能为空");

  list[idx] = next;
  db.tasks[projectId] = list;
  writeDB(db);

  return next;
}

export async function addTaskComment({ token, projectId, taskId, content, author }) {
  await sleep(200);
  const { db, user } = requireSession(token);
  if (!canWrite(user.role)) throw forbiddenError("你没有权限发表评论");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const list = normalizeProjectTasks(db.tasks[projectId] || []);
  const idx = list.findIndex((x) => x.id === taskId);
  if (idx < 0) throw new Error("任务不存在");

  const text = (content || "").trim();
  if (!text) throw new Error("评论不能为空");

  const c = {
    id: uid("c"),
    content: text,
    author: author || "Unknown",
    createdAt: Date.now()
  };

  const cur = ensureTaskShape(list[idx]);
  const next = {
    ...cur,
    comments: [c, ...(cur.comments || [])],
    updatedAt: Date.now()
  };

  list[idx] = next;
  db.tasks[projectId] = list;
  writeDB(db);

  return c;
}

export async function deleteTaskComment({ token, projectId, taskId, commentId }) {
  await sleep(180);
  const { db, user } = requireSession(token);
  if (!canDelete(user.role)) throw forbiddenError("你没有权限删除评论");

  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new Error("项目不存在");
  ensureProjectVisibleToUser(p, user);

  const list = normalizeProjectTasks(db.tasks[projectId] || []);
  const idx = list.findIndex((x) => x.id === taskId);
  if (idx < 0) throw new Error("任务不存在");

  const cur = ensureTaskShape(list[idx]);
  const next = {
    ...cur,
    comments: (cur.comments || []).filter((c) => c.id !== commentId),
    updatedAt: Date.now()
  };

  list[idx] = next;
  db.tasks[projectId] = list;
  writeDB(db);

  return { ok: true };
}