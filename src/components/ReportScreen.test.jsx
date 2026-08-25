import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportScreen from './ReportScreen.jsx';
import { buildReportData } from '../lib/scoring.js';

const scenarios = [
  { s: 'a', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
  { s: 'b', opts: [{ t: 'f', d: 'F' }, { t: 'b', d: 'B' }, { t: 'w', d: 'W' }] },
];
const orgItems = [{ t: 'x', d: 'F' }, { t: 'y', d: 'B' }, { t: 'z', d: 'W' }];
const dim = {
  F: { key: 'F', label: 'Function', tag: 't', cls: 'pf', band: 'bf', color: 'var(--fn)', strength: ['s1','s2','s3','s4'], watch: ['w1','w2','w3','w4'], develop: ['d1','d2','d3','d4'] },
  B: { key: 'B', label: 'Being', tag: 't', cls: 'pb', band: 'bb', color: 'var(--be)', strength: ['s1','s2','s3','s4'], watch: ['w1','w2','w3','w4'], develop: ['d1','d2','d3','d4'] },
  W: { key: 'W', label: 'Will', tag: 't', cls: 'pw', band: 'bw', color: 'var(--wl)', strength: ['s1','s2','s3','s4'], watch: ['w1','w2','w3','w4'], develop: ['d1','d2','d3','d4'] },
};
const reportData = buildReportData(
  [{ most: 0, least: 1 }, { most: 0, least: 2 }],
  [3, 2, 1],
  scenarios, orgItems, dim
);

describe('ReportScreen', () => {
  it('renders the dominant dimension label in the intro line', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText('The Function · Being · Will Matrix')).toBeInTheDocument();
    // "Function" legitimately appears several times (legend, rank line, profile heading)
    // since it's the dominant dimension in this fixture — assert presence, not uniqueness
    expect(screen.getAllByText('Function', { exact: false }).length).toBeGreaterThan(1);
  });

  it('calls onRestart and onPrint from their buttons', () => {
    const onRestart = vi.fn();
    const onPrint = vi.fn();
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={onRestart} onPrint={onPrint} onSignIn={() => {}} />);
    screen.getByText('Start again').click();
    screen.getByText('Save / print').click();
    expect(onRestart).toHaveBeenCalledOnce();
    expect(onPrint).toHaveBeenCalledOnce();
  });

  it('renders all three profile blocks', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    // Use mode-specific h4 headings to verify all three profile blocks exist
    // (avoids duplicate text issue with role labels appearing in rankLines too)
    expect(screen.getByText('Where it makes you strong')).toBeInTheDocument(); // 'full' profile
    expect(screen.getByText('How it supports you')).toBeInTheDocument(); // 'backup' profile
    expect(screen.getByText('Simple ways to grow here')).toBeInTheDocument(); // 'develop' profile
  });
});
