import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header.jsx';

describe('Header', () => {
  it('shows the step label', () => {
    render(<Header stepLabel="Situation 3 of 15" done={2} total={24} final={false} />);
    expect(screen.getByText('Situation 3 of 15')).toBeInTheDocument();
  });

  it('renders the brand name', () => {
    render(<Header stepLabel="" done={0} total={24} final={false} />);
    expect(screen.getByText('Function · Being · Will')).toBeInTheDocument();
  });
});
