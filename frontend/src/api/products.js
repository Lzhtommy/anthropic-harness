import { apiGet } from './client.js';

// { keyword?, sort? }：空/未定义参数不拼入；无参调用等价于 GET /api/products（兼容既有行为）
export function listProducts({ keyword, sort } = {}) {
  const query = new URLSearchParams();
  if (keyword) query.set('keyword', keyword);
  if (sort) query.set('sort', sort);
  const qs = query.toString();
  return apiGet(qs ? `/api/products?${qs}` : '/api/products');
}

export function getProduct(id) {
  return apiGet(`/api/products/${id}`);
}
