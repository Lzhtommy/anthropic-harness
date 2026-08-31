import { apiGet } from './client.js';

export function listProducts() {
  return apiGet('/api/products');
}

export function getProduct(id) {
  return apiGet(`/api/products/${id}`);
}
