import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar.jsx';

describe('Navbar', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<Navbar visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables the next button when canGoNext is false', () => {
    render(<Navbar visible canGoBack canGoNext={false} nextLabel="Next" onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('calls onNext when the next button is clicked and enabled', () => {
    const onNext = vi.fn();
    render(<Navbar visible canGoBack canGoNext nextLabel="Next" onBack={() => {}} onNext={onNext} />);
    screen.getByText('Next').click();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('hides the back button when canGoBack is false', () => {
    render(<Navbar visible canGoBack={false} canGoNext nextLabel="Next" onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Back')).toHaveStyle({ visibility: 'hidden' });
  });
});
