import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock 掉 Model，不走真实 JSON 存储
const mockFind = vi.fn();
const mockFindById = vi.fn();
const mockCreate = vi.fn();
vi.mock('../../models/productModel.js', () => ({
  default: {
    find: (...args) => mockFind(...args),
    findById: (...args) => mockFindById(...args),
    create: (...args) => mockCreate(...args),
  },
}));

const { getProducts, getProductById, createProduct } = await import(
  '../../controllers/productController.js'
);

function mockRes() {
  return {
    statusCode: 200,
    status: vi.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(),
  };
}

beforeEach(() => {
  mockFind.mockReset();
  mockFindById.mockReset();
  mockCreate.mockReset();
});

describe('getProducts', () => {
  it('返回商品列表', async () => {
    mockFind.mockReturnValue([{ id: 1, name: 'A' }]);
    const res = mockRes();
    await getProducts({ query: {} }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ products: [{ id: 1, name: 'A' }] });
  });

  it('keyword 透传给 Model 过滤', async () => {
    mockFind.mockReturnValue([]);
    await getProducts({ query: { keyword: 'phone' } }, mockRes(), vi.fn());
    expect(mockFind).toHaveBeenCalledWith({ keyword: 'phone' });
  });
});

describe('getProductById', () => {
  it('不存在的商品走 404 错误路径', async () => {
    mockFindById.mockReturnValue(null);
    const res = mockRes();
    const next = vi.fn();
    await getProductById({ params: { id: '999' } }, res, next);
    expect(res.statusCode).toBe(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('createProduct', () => {
  it('缺 name 或 price 非法时返回 400', async () => {
    const res = mockRes();
    const next = vi.fn();
    await createProduct({ body: { name: 'X', price: -5 } }, res, next);
    expect(res.statusCode).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('合法输入创建成功返回 201', async () => {
    mockCreate.mockReturnValue({ id: 9, name: 'X', price: 1 });
    const res = mockRes();
    await createProduct({ body: { name: 'X', price: 1 } }, res, vi.fn());
    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith({ id: 9, name: 'X', price: 1 });
  });
});
