// src/components/IntroScreen.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntroScreen from './IntroScreen.jsx';
import { DEFAULT_ROLE } from '../data/roles.js';

describe('IntroScreen', () => {
  it('renders the heading and the three dimensions', () => {
    render(<IntroScreen onStart={() => {}} />);
    expect(screen.getByText('Where do you lead from?')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('Being')).toBeInTheDocument();
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  it('calls onStart with the default role when the start button is clicked without changing role', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} />);
    screen.getByText('Start the reflection').click();
    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('calls onStart with the selected role, and shows a draft note for drafted roles', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} />);
    expect(screen.queryByText(/early draft for this role/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Your role'), { target: { value: 'product_manager' } });
    expect(screen.getByText(/early draft for this role/)).toBeInTheDocument();

    screen.getByText('Start the reflection').click();
    expect(onStart).toHaveBeenCalledWith('product_manager', null);
  });
});

describe('IntroScreen team code', () => {
  function makeAdapter(overrides = {}) {
    return { validateTeamCode: vi.fn().mockResolvedValue({ valid: true, teamId: 'team-1' }), ...overrides };
  }

  it('starts with a null teamId when no code is entered', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={makeAdapter()} />);
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('validates a 6-character code and passes the resolved teamId to onStart', async () => {
    const authAdapter = makeAdapter();
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(authAdapter.validateTeamCode).toHaveBeenCalledWith({ code: 'AB12CD' }));
    await screen.findByText('Joined — your result will count toward this team.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, 'team-1');
  });

  it('shows an error for an invalid code and does not pass a teamId', async () => {
    const authAdapter = makeAdapter({ validateTeamCode: vi.fn().mockResolvedValue({ valid: false }) });
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'zzzzzz' } });
    await screen.findByText('That code was not found. Check it and try again, or leave it blank.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('discards a stale validation response when a newer code was entered before it resolved', async () => {
    let resolveFirst, resolveSecond;
    const validateTeamCode = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const authAdapter = { validateTeamCode };
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);

    const input = screen.getByPlaceholderText('e.g. A1B2C3');
    fireEvent.change(input, { target: { value: 'aaaaaa' } });
    await waitFor(() => expect(validateTeamCode).toHaveBeenCalledWith({ code: 'AAAAAA' }));

    // User changes their mind before the first lookup resolves — a second, overlapping lookup fires.
    fireEvent.change(input, { target: { value: 'bbbbbb' } });
    await waitFor(() => expect(validateTeamCode).toHaveBeenCalledWith({ code: 'BBBBBB' }));

    // The second (later) call resolves before the first (stale) one — out-of-order resolution.
    resolveSecond({ valid: true, teamId: 'team-b' });
    await screen.findByText('Joined — your result will count toward this team.');

    resolveFirst({ valid: true, teamId: 'team-a' });
    // Flush any pending microtask continuations from the stale first call.
    await new Promise((resolve) => setTimeout(resolve, 0));

    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, 'team-b');
  });
});
