import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InsightsSkeleton from './InsightsSkeleton';

describe('InsightsSkeleton', () => {
  it('mirrors the four stat cells, four KPI cells, and six sector rows', () => {
    const { container } = render(<InsightsSkeleton />);

    expect(screen.getByLabelText(/loading insights/i)).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      container.querySelectorAll('[data-skeleton-variant="stat"]'),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-skeleton-variant="kpi"]'),
    ).toHaveLength(4);
    expect(container.querySelectorAll('[data-skeleton-sector]')).toHaveLength(6);
  });
});
