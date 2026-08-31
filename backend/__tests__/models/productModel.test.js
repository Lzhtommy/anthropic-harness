import { describe, it, expect, vi, beforeEach } from 'vitest';

// 只 mock 存储层（外部依赖 = 文件系统），排序/过滤逻辑真实执行——
// 兑现 readiness-review ⚠3：排序语义必须在 Model 层有不经 mock 的直接断言。
const mockRead = vi.fn();
vi.mock('../../db/store.js', () => ({
  default: {
    read: (...args) => mockRead(...args),
    write: vi.fn(),
    reset: vi.fn(),
    nextId: vi.fn(),
  },
}));

const Product = (await import('../../models/productModel.js')).default;

// 与种子数据同构的测试夹具（价格与上架时间均不同、可比较）
function fixtures() {
  return [
    { id: 1, name: 'Airpods Wireless Bluetooth Headphones', price: 89.99, createdAt: '2026-01-05T08:00:00.000Z' },
    { id: 2, name: 'iPhone 15 Pro 256GB', price: 999.99, createdAt: '2026-02-14T08:00:00.000Z' },
    { id: 3, name: 'Mechanical Keyboard 87 Keys', price: 59.5, createdAt: '2026-03-20T08:00:00.000Z' },
    { id: 4, name: '4K Ultra HD Monitor 27inch', price: 329.0, createdAt: '2026-04-02T08:00:00.000Z' },
    { id: 5, name: 'USB-C Hub 8-in-1', price: 24.99, createdAt: '2026-05-11T08:00:00.000Z' },
  ];
}

beforeEach(() => {
  mockRead.mockReset();
  mockRead.mockImplementation(() => fixtures());
});

describe('Product.find — sort 排序（PRD-R-005）', () => {
  it('sort=price_asc 按价格升序，首件为全场最低价（PRD-S-010）', () => {
    const rows = Product.find({ sort: 'price_asc' });
    expect(rows.map((p) => p.price)).toEqual([24.99, 59.5, 89.99, 329.0, 999.99]);
    expect(rows[0].name).toBe('USB-C Hub 8-in-1');
  });

  it('sort=price_desc 按价格降序，首件为全场最高价（PRD-S-011）', () => {
    const rows = Product.find({ sort: 'price_desc' });
    expect(rows.map((p) => p.price)).toEqual([999.99, 329.0, 89.99, 59.5, 24.99]);
    expect(rows[0].name).toBe('iPhone 15 Pro 256GB');
  });

  it('sort=newest 按上架时间从新到旧，首件为最近上架（PRD-S-012）', () => {
    const rows = Product.find({ sort: 'newest' });
    expect(rows.map((p) => p.id)).toEqual([5, 4, 3, 2, 1]);
    expect(rows[0].name).toBe('USB-C Hub 8-in-1');
  });

  it('缺省 sort 保持 store 原始顺序（PRD-S-013）', () => {
    const rows = Product.find({});
    expect(rows.map((p) => p.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('不合法 sort 值一律忽略：原序返回、不抛错（PRD-S-016）', () => {
    for (const bad of ['hacked', 'PRICE_ASC', '', null, undefined, 42, '__proto__', 'constructor']) {
      const rows = Product.find({ sort: bad });
      expect(rows.map((p) => p.id)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('keyword 先过滤、sort 后排序，排序不改变过滤范围（PRD-S-014）', () => {
    const data = fixtures();
    data.push({ id: 6, name: 'iPhone SE', price: 429.0, createdAt: '2026-04-20T08:00:00.000Z' });
    mockRead.mockImplementation(() => data.map((p) => ({ ...p })));
    const rows = Product.find({ keyword: 'iphone', sort: 'price_asc' });
    expect(rows).toHaveLength(2);
    expect(rows.map((p) => p.name)).toEqual(['iPhone SE', 'iPhone 15 Pro 256GB']);
  });

  it('排序使用数组副本，不污染 store 返回的原数组（PRD-S-013 默认顺序保障）', () => {
    const shared = fixtures();
    mockRead.mockImplementation(() => shared);
    Product.find({ sort: 'price_desc' });
    expect(shared.map((p) => p.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('createdAt 解析为 NaN 的脏数据在 newest 下排在末尾且不抛错', () => {
    const data = fixtures();
    data[0] = { ...data[0], createdAt: 'not-a-date' };
    mockRead.mockImplementation(() => data);
    const rows = Product.find({ sort: 'newest' });
    expect(rows[rows.length - 1].id).toBe(1);
    expect(rows.slice(0, 4).map((p) => p.id)).toEqual([5, 4, 3, 2]);
  });
});

describe('Product.find — 既有行为回归', () => {
  it('无过滤条件返回全部商品', () => {
    expect(Product.find()).toHaveLength(5);
  });

  it('keyword 过滤大小写不敏感（PRD-R-002 回归）', () => {
    const rows = Product.find({ keyword: 'IPHONE' });
    expect(rows.map((p) => p.id)).toEqual([2]);
  });
});
