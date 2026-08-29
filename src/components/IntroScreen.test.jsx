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

describe('IntroScreen join code', () => {
  function makeAdapter(overrides = {}) {
    return { validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'team', id: 'team-1' }), ...overrides };
  }

  it('starts with a null code when nothing is entered', () => {
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={makeAdapter()} />);
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('validates a team code and passes {kind: "team", id} to onStart', async () => {
    const authAdapter = makeAdapter();
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.click(screen.getByText('Have a code?'));
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'ab12cd' } });
    await waitFor(() => expect(authAdapter.validateCode).toHaveBeenCalledWith({ code: 'AB12CD' }));
    await screen.findByText('Joined — your result will count toward this team.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, { kind: 'team', id: 'team-1' });
  });

  it('validates a session code and passes {kind: "session", id} to onStart, with session-specific copy', async () => {
    const authAdapter = makeAdapter({ validateCode: vi.fn().mockResolvedValue({ valid: true, kind: 'session', id: 'sess-1' }) });
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.click(screen.getByText('Have a code?'));
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'zz99zz' } });
    await screen.findByText('Joined — your result will count toward this live session.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, { kind: 'session', id: 'sess-1' });
  });

  it('shows an error for an invalid code and passes null', async () => {
    const authAdapter = makeAdapter({ validateCode: vi.fn().mockResolvedValue({ valid: false }) });
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.click(screen.getByText('Have a code?'));
    fireEvent.change(screen.getByPlaceholderText('e.g. A1B2C3'), { target: { value: 'zzzzzz' } });
    await screen.findByText('That code was not found. Check it and try again, or leave it blank.');
    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, null);
  });

  it('discards a stale validation response when a newer code was entered before it resolved', async () => {
    let resolveFirst, resolveSecond;
    const validateCode = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const authAdapter = { validateCode };
    const onStart = vi.fn();
    render(<IntroScreen onStart={onStart} authAdapter={authAdapter} />);
    fireEvent.click(screen.getByText('Have a code?'));

    const input = screen.getByPlaceholderText('e.g. A1B2C3');
    fireEvent.change(input, { target: { value: 'aaaaaa' } });
    await waitFor(() => expect(validateCode).toHaveBeenCalledWith({ code: 'AAAAAA' }));

    fireEvent.change(input, { target: { value: 'bbbbbb' } });
    await waitFor(() => expect(validateCode).toHaveBeenCalledWith({ code: 'BBBBBB' }));

    resolveSecond({ valid: true, kind: 'team', id: 'team-b' });
    await screen.findByText('Joined — your result will count toward this team.');

    resolveFirst({ valid: true, kind: 'team', id: 'team-a' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    fireEvent.click(screen.getByText('Start the reflection'));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_ROLE, { kind: 'team', id: 'team-b' });
  });
});
