import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindById = vi.fn();
vi.mock('../../models/userModel.js', () => ({
  default: { findById: (...args) => mockFindById(...args) },
}));

const { protect, admin } = await import('../../middleware/authMiddleware.js');
const { issueToken } = await import('../../utils/token.js');

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

beforeEach(() => mockFindById.mockReset());

describe('protect', () => {
  it('无 token 走 401 错误路径', async () => {
    const res = mockRes();
    const next = vi.fn();
    await protect({ headers: {} }, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('伪造 token 被拒绝', async () => {
    const res = mockRes();
    const next = vi.fn();
    await protect({ headers: { authorization: 'Bearer abc.def' } }, res, next);
    expect(res.statusCode).toBe(401);
  });

  it('合法 token 放行并挂载 req.user', async () => {
    const user = { id: 1, name: 'Admin', isAdmin: true };
    mockFindById.mockReturnValue(user);
    const token = issueToken(user);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = vi.fn();
    await protect(req, mockRes(), next);
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('admin', () => {
  it('非管理员抛 403', () => {
    const res = mockRes();
    expect(() => admin({ user: { isAdmin: false } }, res, vi.fn())).toThrow();
    expect(res.statusCode).toBe(403);
  });

  it('管理员放行', () => {
    const next = vi.fn();
    admin({ user: { isAdmin: true } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
