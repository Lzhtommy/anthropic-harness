// API 层薄封装：组件内禁止裸 fetch（verify.sh C4/C6），一切请求经由本模块。
export async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
