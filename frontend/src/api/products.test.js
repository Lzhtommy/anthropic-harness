import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock 统一 fetch 封装（外部依赖 = 网络），只断言查询串构造契约（W-03）
const mockApiGet = vi.fn();
vi.mock('./client.js', () => ({
  apiGet: (...args) => mockApiGet(...args),
}));

const { listProducts } = await import('./products.js');

beforeEach(() => {
  mockApiGet.mockReset();
  mockApiGet.mockResolvedValue({ products: [] });
});

describe('listProducts 查询串构造', () => {
  it('无参调用等价于现状 GET /api/products（PRD-S-013 兼容性）', async () => {
    await listProducts();
    expect(mockApiGet).toHaveBeenCalledWith('/api/products');
  });

  it('空对象/空值参数不拼入查询串', async () => {
    await listProducts({ keyword: '', sort: undefined });
    expect(mockApiGet).toHaveBeenCalledWith('/api/products');
  });

  it('sort 单独拼入（PRD-S-010~012）', async () => {
    await listProducts({ sort: 'price_asc' });
    expect(mockApiGet).toHaveBeenCalledWith('/api/products?sort=price_asc');
  });

  it('keyword 与 sort 同时拼入（PRD-S-014）', async () => {
    await listProducts({ keyword: 'iphone', sort: 'price_desc' });
    const url = mockApiGet.mock.calls[0][0];
    expect(url.startsWith('/api/products?')).toBe(true);
    const qs = new URLSearchParams(url.split('?')[1]);
    expect(qs.get('keyword')).toBe('iphone');
    expect(qs.get('sort')).toBe('price_desc');
  });

  it('keyword 特殊字符经 URLSearchParams 编码', async () => {
    await listProducts({ keyword: 'a b&c' });
    const url = mockApiGet.mock.calls[0][0];
    const qs = new URLSearchParams(url.split('?')[1]);
    expect(qs.get('keyword')).toBe('a b&c');
  });
});
