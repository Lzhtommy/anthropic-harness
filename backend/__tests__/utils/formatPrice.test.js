import { describe, it, expect } from 'vitest';
import { formatPrice } from '../../utils/formatPrice.js';

describe('formatPrice', () => {
  it('保留两位小数', () => {
    expect(formatPrice(89.9)).toBe('89.90');
    expect(formatPrice(24.999)).toBe('25.00');
  });

  it('非法输入退化为 0.00 不抛错', () => {
    expect(formatPrice('abc')).toBe('0.00');
    expect(formatPrice(-1)).toBe('0.00');
    expect(formatPrice(undefined)).toBe('0.00');
    expect(formatPrice(NaN)).toBe('0.00');
  });
});
