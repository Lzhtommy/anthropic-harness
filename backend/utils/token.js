// 最小 token 方案：HMAC 签名的 base64 载荷（免 jsonwebtoken 依赖）。
import crypto from 'crypto';
import config from '../config.js';

function sign(payloadB64) {
  return crypto.createHmac('sha256', config.secret).update(payloadB64).digest('hex');
}

export function issueToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, isAdmin: Boolean(user.isAdmin) })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
