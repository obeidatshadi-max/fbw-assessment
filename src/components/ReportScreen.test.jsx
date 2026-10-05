import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportScreen from './ReportScreen.jsx';
import { buildReportData } from '../lib/scoring.js';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { SCENARIOS } from '../data/scenarios.js';
import { ORG_ITEMS } from '../data/orgItems.js';
import { DIM } from '../data/dimensions.js';

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

  it('renders a print-only masthead with the brand name and a generated date, since the sticky topbar is hidden when printing', () => {
    const { container } = render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    const masthead = container.querySelector('.print-header');
    expect(masthead).not.toBeNull();
    expect(masthead.textContent).toContain('Integral Leadership Dynamics™ · Function · Being · Will');
    expect(masthead.querySelector('.metaline').textContent.length).toBeGreaterThan(0);
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

  it('renders the 30/60/90 plan and manager debrief guide, with dominant/growth-edge interpolated', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText('Your 30/60/90-day plan')).toBeInTheDocument();
    expect(screen.getByText('Day 1–30')).toBeInTheDocument();
    expect(screen.getByText('Day 31–60')).toBeInTheDocument();
    expect(screen.getByText('Day 61–90')).toBeInTheDocument();
    expect(screen.getByText('Manager debrief guide')).toBeInTheDocument();
    const dominantLabel = dim[reportData.dominant].label;
    const developLabel = dim[reportData.developArea].label;
    expect(screen.getByText(`Does your ${dominantLabel} profile feel accurate to you? Give one recent example.`)).toBeInTheDocument();
    expect(screen.getByText(`What is one thing from today you want to check back on in 90 days?`)).toBeInTheDocument();
    expect(screen.getAllByText((_, el) => el.textContent.includes(developLabel) && el.tagName === 'LI').length).toBeGreaterThan(0);
    expect(screen.queryByText(/\{developArea\}/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\{dominant\}/)).not.toBeInTheDocument();
  });

  it('renders all three profile blocks', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    // Use mode-specific h4 headings to verify all three profile blocks exist
    // (avoids duplicate text issue with role labels appearing in rankLines too)
    expect(screen.getByText('Where it makes you strong')).toBeInTheDocument(); // 'full' profile
    expect(screen.getByText('How it supports you')).toBeInTheDocument(); // 'backup' profile
    expect(screen.getByText('Simple ways to grow here')).toBeInTheDocument(); // 'develop' profile
  });

  it('renders the whole-leader section keyed by the growth edge, and strength activation for the dominant style', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText('Reading the whole leader')).toBeInTheDocument();
    expect(screen.getByText('Your style in a crisis')).toBeInTheDocument();
    expect(screen.getByText('When you receive critical feedback')).toBeInTheDocument();
    expect(screen.getByText('When you lead change')).toBeInTheDocument();
    expect(screen.getByText('Put this strength to work')).toBeInTheDocument();
    expect(screen.queryByText(/\{dominant\}|\{backup\}/)).not.toBeInTheDocument();
  });

  it('renders the purpose statement as editable, unsaved fields', () => {
    render(<ReportScreen reportData={reportData} dim={dim} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText('Your leadership purpose statement')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('your purpose');
    fireEvent.change(input, { target: { value: 'people grow' } });
    expect(input.value).toBe('people grow');
  });

  it('shows a slide-35 archetype from 360 rater scores once raters have answered', () => {
    render(
      <ReportScreen
        reportData={reportData} dim={dim} authState={{ status: 'saved' }}
        raterLink={{ status: 'ready', id: 'abc', count: 3, scores: { F: 8, B: 5, W: 7.5, C: 6 } }}
        onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}}
        onCreateRaterLink={() => {}} onRefreshRaterSummary={() => {}}
      />
    );
    expect(screen.getByText('Your leadership archetype (as others see you)')).toBeInTheDocument();
    expect(screen.getByText('Forceful Driver')).toBeInTheDocument();
    expect(screen.getByText('Burnout, politics, conflict')).toBeInTheDocument();
  });

  it('shows no archetype before the 360 minimum is reached', () => {
    render(
      <ReportScreen
        reportData={reportData} dim={dim} authState={{ status: 'saved' }}
        raterLink={{ status: 'ready', id: 'abc', count: 1, scores: null }}
        onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}}
        onCreateRaterLink={() => {}} onRefreshRaterSummary={() => {}}
      />
    );
    expect(screen.queryByText('Your leadership archetype (as others see you)')).not.toBeInTheDocument();
  });

  it('renders a fully localized Arabic report using the real content banks', () => {
    const arReport = buildReportData(
      SCENARIOS.map(() => ({ most: 0, least: 1 })),
      ORG_ITEMS.map(() => 3),
      SCENARIOS, ORG_ITEMS, DIM, 'ar'
    );
    render(
      <LanguageProvider initialLang="ar">
        <ReportScreen reportData={arReport} dim={DIM} authState={{ status: 'anon' }} onRestart={() => {}} onPrint={() => {}} onSignIn={() => {}} />
      </LanguageProvider>
    );
    expect(screen.getByText('مصفوفة الوظيفة · الكينونة · الإرادة')).toBeInTheDocument();
    expect(screen.getByText('ابدأ من جديد')).toBeInTheDocument();
    expect(screen.getByText('يرجى قراءة هذا.')).toBeInTheDocument();
    expect(screen.getByText('قراءة القائد بالكامل')).toBeInTheDocument();
    expect(screen.getByText('بيان هدفك القيادي')).toBeInTheDocument();
  });
});
