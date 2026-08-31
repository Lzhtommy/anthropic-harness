import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import { issueToken } from '../utils/token.js';

// POST /api/users/login
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = User.findByEmail(email ?? '');
  if (!user || user.password !== password) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    token: issueToken(user),
  });
});

// GET /api/users/profile（需登录）
export const getUserProfile = asyncHandler(async (req, res) => {
  const { id, name, email, isAdmin } = req.user;
  res.json({ id, name, email, isAdmin: Boolean(isAdmin) });
});
