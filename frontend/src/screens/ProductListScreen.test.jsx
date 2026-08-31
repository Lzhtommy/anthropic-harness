import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

// mock API 层（外部依赖 = 网络），只测组件行为（W-05）
const mockListProducts = vi.fn();
vi.mock('../api/products.js', () => ({
  listProducts: (...args) => mockListProducts(...args),
  getProduct: vi.fn(),
}));

const { default: ProductListScreen } = await import('./ProductListScreen.jsx');

const PRODUCTS = [
  { id: 1, name: 'Airpods Wireless Bluetooth Headphones', price: 89.99 },
  { id: 5, name: 'USB-C Hub 8-in-1', price: 24.99 },
];

// 观察当前 URL（useSearchParams 的写回结果）
function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderAt(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ProductListScreen />
      <LocationSpy />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockListProducts.mockReset();
  mockListProducts.mockResolvedValue({ products: PRODUCTS });
});

// vite.config.js 设 globals:false，RTL auto-cleanup（依赖全局 afterEach）不生效，须显式清理
afterEach(() => {
  cleanup();
});

describe('ProductListScreen — 排序选择器', () => {
  it('选择"价格从低到高"后以 {sort:price_asc} 重新请求且 URL 更新（PRD-S-010/015）', async () => {
    renderAt('/');
    await screen.findByTestId('product-list');
    expect(mockListProducts).toHaveBeenLastCalledWith({});

    fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'price_asc' } });

    await waitFor(() => expect(mockListProducts).toHaveBeenLastCalledWith({ sort: 'price_asc' }));
    expect(screen.getByTestId('location-search').textContent).toBe('?sort=price_asc');
    const select = await screen.findByTestId('sort-select');
    expect(select.value).toBe('price_asc');
  });

  it('初始 URL 含合法 sort 时选择器同步选中并透传请求（PRD-S-015）', async () => {
    renderAt('/?sort=newest');
    await screen.findByTestId('product-list');
    expect(mockListProducts).toHaveBeenLastCalledWith({ sort: 'newest' });
    expect(screen.getByTestId('sort-select').value).toBe('newest');
  });

  it('初始 URL 含非法 sort 时选择器回退默认项且列表正常渲染（PRD-S-016）', async () => {
    renderAt('/?sort=hacked');
    await screen.findByTestId('product-list');
    // 非法值原样透传，由后端白名单降级（design 异常链路）
    expect(mockListProducts).toHaveBeenLastCalledWith({ sort: 'hacked' });
    expect(screen.getByTestId('sort-select').value).toBe('');
    expect(screen.getByText('USB-C Hub 8-in-1')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('初始 URL 含 keyword 时切换排序后 keyword 仍在请求参数与 URL 中（PRD-S-014）', async () => {
    renderAt('/?keyword=iphone');
    await screen.findByTestId('product-list');
    expect(mockListProducts).toHaveBeenLastCalledWith({ keyword: 'iphone' });

    fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'price_desc' } });

    await waitFor(() =>
      expect(mockListProducts).toHaveBeenLastCalledWith({ keyword: 'iphone', sort: 'price_desc' })
    );
    const qs = new URLSearchParams(screen.getByTestId('location-search').textContent);
    expect(qs.get('keyword')).toBe('iphone');
    expect(qs.get('sort')).toBe('price_desc');
  });

  it('切回"默认排序"时从 URL 移除 sort 键（PRD-S-013）', async () => {
    renderAt('/?sort=price_asc');
    await screen.findByTestId('product-list');

    fireEvent.change(screen.getByTestId('sort-select'), { target: { value: '' } });

    await waitFor(() => expect(mockListProducts).toHaveBeenLastCalledWith({}));
    expect(screen.getByTestId('location-search').textContent).toBe('');
  });

  it('API 失败仍渲染 role="alert"（PRD-S-002 回归）', async () => {
    mockListProducts.mockRejectedValue(new Error('boom'));
    renderAt('/');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('boom');
  });
});
