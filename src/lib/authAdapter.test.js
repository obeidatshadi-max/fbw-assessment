import { describe, it, expect } from 'vitest';
import { noopAuthAdapter } from './authAdapter.js';

describe('noopAuthAdapter team methods', () => {
  it('createTeam fails safely when not configured', async () => {
    const result = await noopAuthAdapter.createTeam({ name: 'X', userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('listTeams fails safely when not configured', async () => {
    const result = await noopAuthAdapter.listTeams({ userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('getTeamSummary fails safely when not configured', async () => {
    const result = await noopAuthAdapter.getTeamSummary({ teamId: 't1' });
    expect(result.success).toBe(false);
  });
});

describe('noopAuthAdapter facilitator password auth', () => {
  it('signInWithPassword fails safely when not configured', async () => {
    const result = await noopAuthAdapter.signInWithPassword({ email: 'm@x.com', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('signUpWithPassword fails safely when not configured', async () => {
    const result = await noopAuthAdapter.signUpWithPassword({ email: 'm@x.com', password: 'secret123' });
    expect(result.success).toBe(false);
  });
});

describe('noopAuthAdapter session methods', () => {
  it('createSession fails safely when not configured', async () => {
    const result = await noopAuthAdapter.createSession({ name: 'X', userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('endSession fails safely when not configured', async () => {
    const result = await noopAuthAdapter.endSession({ sessionId: 's1' });
    expect(result.success).toBe(false);
  });

  it('getSessionSummary fails safely when not configured', async () => {
    const result = await noopAuthAdapter.getSessionSummary({ sessionId: 's1' });
    expect(result.success).toBe(false);
  });

  it('validateCode is invalid when not configured', async () => {
    const result = await noopAuthAdapter.validateCode({ code: 'ABC123' });
    expect(result.valid).toBe(false);
  });
});
