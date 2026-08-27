// src/components/ScenarioScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScenarioScreen from './ScenarioScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';

const scenario = {
  s: 'A project is falling behind schedule.',
  opts: [
    { t: 'Fix the plan.', d: 'F' },
    { t: 'Check how the team feels.', d: 'B' },
    { t: 'Recommit everyone to the goal.', d: 'W' },
  ],
};

const bilingualScenario = {
  s: { en: 'A project is falling behind schedule.', ar: 'مشروع بدأ يتأخر عن الجدول الزمني.' },
  opts: [
    { t: { en: 'Fix the plan.', ar: 'أصلح الخطة.' }, d: 'F' },
    { t: { en: 'Check how the team feels.', ar: 'أتحقق من شعور الفريق.' }, d: 'B' },
    { t: { en: 'Recommit everyone to the goal.', ar: 'أُعيد التزام الجميع بالهدف.' }, d: 'W' },
  ],
};

describe('ScenarioScreen', () => {
  it('renders the situation text and all three options', () => {
    render(<ScenarioScreen scenario={scenario} index={0} total={15} answer={{ most: null, least: null }} onChoose={() => {}} />);
    expect(screen.getByText('A project is falling behind schedule.')).toBeInTheDocument();
    expect(screen.getByText('Fix the plan.')).toBeInTheDocument();
    expect(screen.getByText('Situation 1/15', { exact: false })).toBeInTheDocument();
  });

  it('calls onChoose with the right kind and index when a chip is clicked', () => {
    const onChoose = vi.fn();
    render(<ScenarioScreen scenario={scenario} index={0} total={15} answer={{ most: null, least: null }} onChoose={onChoose} />);
    screen.getAllByText('Most like me')[0].click();
    expect(onChoose).toHaveBeenCalledWith('most', 0);
  });

  it('marks the selected chip as on', () => {
    render(<ScenarioScreen scenario={scenario} index={0} total={15} answer={{ most: 1, least: null }} onChoose={() => {}} />);
    const chips = screen.getAllByText('Most like me');
    expect(chips[1].closest('.chip')).toHaveClass('on-most');
  });

  it('renders the localized situation and chip labels in Arabic', () => {
    render(
      <LanguageProvider initialLang="ar">
        <ScenarioScreen scenario={bilingualScenario} index={0} total={15} answer={{ most: null, least: null }} onChoose={() => {}} />
      </LanguageProvider>
    );
    expect(screen.getByText('مشروع بدأ يتأخر عن الجدول الزمني.')).toBeInTheDocument();
    expect(screen.getAllByText('الأقرب إليّ').length).toBeGreaterThan(0);
  });
});
