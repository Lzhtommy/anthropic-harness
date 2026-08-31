import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Price from './Price.jsx';

describe('Price', () => {
  it('保留两位小数并带货币符号', () => {
    render(<Price value={59.5} />);
    expect(screen.getByText('$59.50')).toBeTruthy();
  });

  it('非法值退化为 $0.00', () => {
    render(<Price value="oops" />);
    expect(screen.getByText('$0.00')).toBeTruthy();
  });
});
