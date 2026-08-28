import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionLiveScreen from './SessionLiveScreen.jsx';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { DIM } from '../data/dimensions.js';

function renderScreen(props) {
  return render(
    <LanguageProvider>
      <SessionLiveScreen
        session={null}
        summary={null}
        imbalance={null}
        dim={DIM}
        createStatus="idle"
        createError={null}
        ended={false}
        onCreateSession={() => {}}
        onRefresh={() => {}}
        onEndSession={() => {}}
        onPrintCards={() => {}}
        onStartNewSession={() => {}}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('SessionLiveScreen', () => {
  it('shows the create-session form when there is no session yet', () => {
    renderScreen({});
    expect(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28')).toBeInTheDocument();
  });

  it('calls onCreateSession with the entered name', () => {
    const onCreateSession = vi.fn();
    renderScreen({ onCreateSession });
    fireEvent.change(screen.getByPlaceholderText('e.g. Leadership Workshop — Aug 28'), { target: { value: 'Workshop A' } });
    fireEvent.click(screen.getByText('Start session'));
    expect(onCreateSession).toHaveBeenCalledWith('Workshop A');
  });

  it('shows the join code and waiting message before the gate is reached', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 1, distribution: null, roleBreakdown: null },
    });
    expect(screen.getByDisplayValue('ZZ99ZZ')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 responses needed before the group pattern appears.')).toBeInTheDocument();
  });

  it('shows the live dashboard and a matched discussion card once revealed', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 50, B: 32, W: 18, C: 60 }, roleBreakdown: { rep: 5 } },
      imbalance: { high: 'F', low: 'W' },
    });
    expect(screen.getByText('Live results')).toBeInTheDocument();
    expect(screen.getByText('Discussion cards')).toBeInTheDocument();
    expect(screen.getByText('This room delivers. Where have you personally held back from a hard call recently?')).toBeInTheDocument();
  });

  it('shows the balanced discussion cards when there is no imbalance', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      imbalance: null,
    });
    expect(screen.getByText('No single pattern dominates this room — where is that a strength, and where might it blur ownership?')).toBeInTheDocument();
  });

  it('calls onEndSession when the end-session button is clicked', () => {
    const onEndSession = vi.fn();
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 1, distribution: null, roleBreakdown: null },
      onEndSession,
    });
    fireEvent.click(screen.getByText('End session'));
    expect(onEndSession).toHaveBeenCalled();
  });

  it('shows the ended note and no end-session button once the session has ended', () => {
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      ended: true,
    });
    expect(screen.getByText('This session has ended — the code no longer works.')).toBeInTheDocument();
    expect(screen.queryByText('End session')).not.toBeInTheDocument();
  });

  it('shows a start-new-session button once ended, and calls onStartNewSession when clicked', () => {
    const onStartNewSession = vi.fn();
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      ended: true,
      onStartNewSession,
    });
    fireEvent.click(screen.getByText('Start another session'));
    expect(onStartNewSession).toHaveBeenCalled();
  });

  it('calls onPrintCards when the print button is clicked', () => {
    const onPrintCards = vi.fn();
    renderScreen({
      session: { id: 's1', name: 'Workshop A', joinCode: 'ZZ99ZZ' },
      summary: { count: 5, distribution: { F: 34, B: 33, W: 33, C: 60 }, roleBreakdown: { rep: 5 } },
      onPrintCards,
    });
    fireEvent.click(screen.getByText('Print discussion cards'));
    expect(onPrintCards).toHaveBeenCalled();
  });
});
