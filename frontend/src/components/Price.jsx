// 金额展示组件：非法值退化为 $0.00。
export default function Price({ value }) {
  const n = Number(value);
  const display = Number.isFinite(n) && n >= 0 ? n.toFixed(2) : '0.00';
  return <span className="price">${display}</span>;
}
