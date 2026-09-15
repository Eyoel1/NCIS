import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useTranslation } from '../context/LanguageContext';
import { LanguageToggle } from '../components/common/LanguageToggle';

// Test consumer to verify translation string updates
const TranslationConsumer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <span data-testid="translated-title">{t('nav.brand')}</span>
      <span data-testid="translated-role">{t('roles.CUSTOMS_AUTHORITY')}</span>
      <LanguageToggle />
    </div>
  );
};

describe('LanguageToggle Component & LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders language toggle buttons with EN and Amharic options', () => {
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>
    );

    const toggle = screen.getByTestId('language-toggle');
    expect(toggle).toBeInTheDocument();

    const enBtn = screen.getByTestId('lang-en-btn');
    const amBtn = screen.getByTestId('lang-am-btn');

    expect(enBtn).toHaveTextContent('EN');
    expect(amBtn).toHaveTextContent('አማ');
  });

  it('defaults to English and allows switching to Amharic and back', () => {
    render(
      <LanguageProvider>
        <TranslationConsumer />
      </LanguageProvider>
    );

    const enBtn = screen.getByTestId('lang-en-btn');
    const amBtn = screen.getByTestId('lang-am-btn');
    const title = screen.getByTestId('translated-title');
    const role = screen.getByTestId('translated-role');

    // Initially English
    expect(enBtn).toHaveAttribute('aria-pressed', 'true');
    expect(amBtn).toHaveAttribute('aria-pressed', 'false');
    expect(title).toHaveTextContent('NCIS Portal');
    expect(role).toHaveTextContent('Customs Authority (ECC)');

    // Switch to Amharic
    fireEvent.click(amBtn);

    expect(amBtn).toHaveAttribute('aria-pressed', 'true');
    expect(enBtn).toHaveAttribute('aria-pressed', 'false');
    expect(title).toHaveTextContent('ብሔራዊ የተሽከርካሪ ማስመጣት መድረክ');
    expect(role).toHaveTextContent('የጉምሩክ ባለስልጣን (ኢጉኮ)');

    // Switch back to English
    fireEvent.click(enBtn);

    expect(enBtn).toHaveAttribute('aria-pressed', 'true');
    expect(amBtn).toHaveAttribute('aria-pressed', 'false');
    expect(title).toHaveTextContent('NCIS Portal');
    expect(role).toHaveTextContent('Customs Authority (ECC)');
  });
});
