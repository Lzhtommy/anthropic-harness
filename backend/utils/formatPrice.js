// 金额格式化纯函数：非法输入退化为 0.00（不抛错）。
export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '0.00';
  return n.toFixed(2);
}
