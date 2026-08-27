import { describe, it, expect } from 'vitest';
import { noopAuthAdapter } from './authAdapter.js';

describe('noopAuthAdapter team methods', () => {
  it('createTeam fails safely when not configured', async () => {
    const result = await noopAuthAdapter.createTeam({ name: 'X', userId: 'u1' });
    expect(result.success).toBe(false);
  });

  it('validateTeamCode is invalid when not configured', async () => {
    const result = await noopAuthAdapter.validateTeamCode({ code: 'ABC123' });
    expect(result.valid).toBe(false);
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
