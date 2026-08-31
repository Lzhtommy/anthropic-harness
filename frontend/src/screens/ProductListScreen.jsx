import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '../api/products.js';
import Price from '../components/Price.jsx';

export default function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProducts()
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <main>
      <h1>Products</h1>
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
