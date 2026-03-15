import * as api from "./fakeApi.js";
import { useAuthStore } from "../store/authStore.js";

// ✅ 页面只调用这里：自动从 store 注入 token
function mustToken() {
  const token = useAuthStore.getState().token;
  if (!token) {
    const e = new Error("请先登录");
    e.status = 401;
    e.code = "UNAUTHORIZED";
    throw e;
  }
  return token;
}

// Auth
export const login = api.login;
export const refreshSession = api.refreshSession;
export const logoutSession = api.logoutSession;

// Admin
export function resetDB() {
  return api.resetDB({ token: mustToken() });
}

// Business
export function getProjects(params) {
  return api.getProjects({ token: mustToken(), ...params });
}

export function createProject(params) {
  return api.createProject({ token: mustToken(), ...params });
}

export function deleteProject(params) {
  return api.deleteProject({ token: mustToken(), ...params });
}

export function getProject(params) {
  return api.getProject({ token: mustToken(), ...params });
}

export function getTasks(params) {
  return api.getTasks({ token: mustToken(), ...params });
}

export function addTask(params) {
  return api.addTask({ token: mustToken(), ...params });
}

export function deleteTask(params) {
  return api.deleteTask({ token: mustToken(), ...params });
}

export function updateTaskStatus(params) {
  return api.updateTaskStatus({ token: mustToken(), ...params });
}

export function updateTaskMeta(params) {
  return api.updateTaskMeta({ token: mustToken(), ...params });
}

export function getTaskDetail(params) {
  return api.getTaskDetail({ token: mustToken(), ...params });
}

export function updateTaskDetail(params) {
  return api.updateTaskDetail({ token: mustToken(), ...params });
}

export function addTaskComment(params) {
  return api.addTaskComment({ token: mustToken(), ...params });
}

export function deleteTaskComment(params) {
  return api.deleteTaskComment({ token: mustToken(), ...params });
}