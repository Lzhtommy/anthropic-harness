import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listProducts } from '../api/products.js';
import Price from '../components/Price.jsx';

// 排序选项白名单（PRD-R-005）；URL 是排序状态唯一来源（PRD-R-006）
const SORT_OPTIONS = [
  { value: '', label: '默认排序' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
  { value: 'newest', label: '最新上架' },
];
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

export default function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('keyword') ?? '';
  const rawSort = searchParams.get('sort') ?? '';
  // 非法 sort 值选择器回退默认项（PRD-S-016）；请求仍原样透传，由后端白名单降级
  const sortValue = SORT_VALUES.includes(rawSort) ? rawSort : '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = {};
    if (keyword) params.keyword = keyword;
    if (rawSort) params.sort = rawSort;
    listProducts(params)
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyword, rawSort]);

  function handleSortChange(e) {
    const next = new URLSearchParams(searchParams);
    if (e.target.value) {
      next.set('sort', e.target.value);
    } else {
      next.delete('sort'); // 选"默认排序"时移除 sort 键（PRD-S-013）
    }
    setSearchParams(next);
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <main>
      <h1>Products</h1>
      <label>
        排序：
        <select data-testid="sort-select" value={sortValue} onChange={handleSortChange}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <ul data-testid="product-list">
        {products.map((p) => (
          <li key={p.id}>
            <Link to={`/product/${p.id}`}>{p.name}</Link> — <Price value={p.price} />
          </li>
        ))}
      </ul>
    </main>
  );
}
