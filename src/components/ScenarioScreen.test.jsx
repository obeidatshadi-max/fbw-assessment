// src/components/ScenarioScreen.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScenarioScreen from './ScenarioScreen.jsx';

const scenario = {
  s: 'A project is falling behind schedule.',
  opts: [
    { t: 'Fix the plan.', d: 'F' },
    { t: 'Check how the team feels.', d: 'B' },
    { t: 'Recommit everyone to the goal.', d: 'W' },
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
});
