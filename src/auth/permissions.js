// 你项目已有三类角色：admin / editor / viewer
export const ROLE_TEXT = { admin: "管理员", editor: "编辑者", viewer: "访客" };

// ✅ 权限点：可扩展（简历可讲：按钮级权限）
export const PERMISSIONS = {
  "project.read": ["admin", "editor", "viewer"],
  "project.create": ["admin", "editor"],
  "project.delete": ["admin"],

  "task.read": ["admin", "editor", "viewer"],
  "task.write": ["admin", "editor"],
  "task.delete": ["admin"]
};

export function hasPermission(user, perm) {
  const role = user?.role || "viewer";
  const allow = PERMISSIONS[perm] || [];
  return allow.includes(role);
}