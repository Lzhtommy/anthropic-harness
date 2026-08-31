import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';

// GET /api/products?keyword=
export const getProducts = asyncHandler(async (req, res) => {
  const products = Product.find({ keyword: req.query.keyword });
  res.json({ products });
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// POST /api/products（需登录 + 管理员）
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description } = req.body ?? {};
  if (!name || typeof price !== 'number' || price < 0) {
    res.status(400);
    throw new Error('name and non-negative numeric price are required');
  }
  const product = Product.create({ name, price, description: description ?? '' });
  res.status(201).json(product);
});
