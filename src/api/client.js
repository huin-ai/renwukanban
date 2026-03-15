// 统一包装：把错误变成 Error(message) 抛出，让 Query/Mutation 能统一 toast
export async function request(promiseFn) {
  try {
    const res = await promiseFn();
    return res;
  } catch (e) {
    const msg = e?.message || "Request failed";
    throw new Error(msg);
  }
}