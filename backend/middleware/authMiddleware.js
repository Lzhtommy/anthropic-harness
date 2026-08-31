import asyncHandler from './asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import User from '../models/userModel.js';

// 需登录路由挂 protect；管理员路由额外挂 admin（code-standards / verify.sh A7）。
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  const user = payload ? User.findById(payload.id) : null;
  if (!user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  req.user = user;
  next();
});

export function admin(req, res, next) {
  if (req.user?.isAdmin) return next();
  res.status(403);
  throw new Error('Not authorized as admin');
}
