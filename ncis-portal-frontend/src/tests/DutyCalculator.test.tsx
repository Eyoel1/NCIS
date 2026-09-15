import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../context/LanguageContext';
import { DutyCalculatorWidget } from '../components/customs/DutyCalculatorWidget';

describe('DutyCalculatorWidget Component', () => {
  it('accurately calculates Ethiopian cascading duties and taxes for standard passenger car', () => {
    render(
      <LanguageProvider>
        <DutyCalculatorWidget
          initialCif={2500000}
          initialCc={1800}
          initialFuel="PETROL"
        />
      </LanguageProvider>
    );

    // Initial CIF: 2,500,000 ETB
    // Duty 35% = 875,000 ETB
    expect(screen.getByTestId('result-duty')).toHaveTextContent('875,000 ETB');

    // Excise: 60% on (2,500,000 + 875,000 = 3,375,000) = 2,025,000 ETB
    expect(screen.getByTestId('result-excise')).toHaveTextContent('2,025,000 ETB');

    // VAT: 15% on (3,375,000 + 2,025,000 = 5,400,000) = 810,000 ETB
    expect(screen.getByTestId('result-vat')).toHaveTextContent('810,000 ETB');

    // Surtax: 10% on 5,400,000 = 540,000 ETB
    expect(screen.getByTestId('result-surtax')).toHaveTextContent('540,000 ETB');

    // Withholding: 3% on 2,500,000 = 75,000 ETB
    expect(screen.getByTestId('result-withholding')).toHaveTextContent('75,000 ETB');

    // Total: 875,000 + 2,025,000 + 810,000 + 540,000 + 75,000 = 4,325,000 ETB
    expect(screen.getByTestId('result-total')).toHaveTextContent('4,325,000 ETB');
  });

  it('applies 5% flat excise tax incentive for Electric Vehicles (EV)', () => {
    render(
      <LanguageProvider>
        <DutyCalculatorWidget
          initialCif={2000000}
          initialCc={0}
          initialFuel="ELECTRIC"
        />
      </LanguageProvider>
    );

    // Duty 35% on 2,000,000 = 700,000 ETB
    expect(screen.getByTestId('result-duty')).toHaveTextContent('700,000 ETB');

    // Excise 5% on (2,000,000 + 700,000 = 2,700,000) = 135,000 ETB
    expect(screen.getByTestId('result-excise')).toHaveTextContent('135,000 ETB');

    // VAT 15% on (2,700,000 + 135,000 = 2,835,000) = 425,250 ETB
    expect(screen.getByTestId('result-vat')).toHaveTextContent('425,250 ETB');

    // Surtax 10% on 2,835,000 = 283,500 ETB
    expect(screen.getByTestId('result-surtax')).toHaveTextContent('283,500 ETB');

    // Withholding 3% on 2,000,000 = 60,000 ETB
    expect(screen.getByTestId('result-withholding')).toHaveTextContent('60,000 ETB');

    // Total: 700,000 + 135,000 + 425,250 + 283,500 + 60,000 = 1,603,750 ETB
    expect(screen.getByTestId('result-total')).toHaveTextContent('1,603,750 ETB');
  });

  it('applies 10% duty rate for Commercial vehicles', () => {
    render(
      <LanguageProvider>
        <DutyCalculatorWidget
          initialCif={1000000}
          initialCc={2000}
          initialFuel="DIESEL"
        />
      </LanguageProvider>
    );

    // Select COMMERCIAL category
    const categorySelect = screen.getByTestId('select-category');
    fireEvent.change(categorySelect, { target: { value: 'COMMERCIAL' } });

    // Duty rate 10% on 1,000,000 = 100,000 ETB
    expect(screen.getByTestId('result-duty')).toHaveTextContent('100,000 ETB');
  });
});
