import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../api/products.js';
import Price from '../components/Price.jsx';

export default function ProductDetailScreen() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!product) return <p>Loading...</p>;

  return (
    <main>
      <Link to="/">← Back</Link>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>
        Price: <Price value={product.price} />
      </p>
    </main>
  );
}
