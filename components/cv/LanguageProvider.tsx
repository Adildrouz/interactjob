'use client';

import React from 'react';

// FICHIER DÉSACTIVÉ - Plus de support multilingue
// L'application fonctionne uniquement en français

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Hook simplifié pour éviter les erreurs - Version défensive
export function useLanguage() {
  return {
    currentLanguage: 'fr' as const,
    setLanguage: () => {},
    t: (key: string) => key,
    language: 'fr',
    languages: ['fr'],
    isLoading: false
  };
}

// Export par défaut
export default LanguageProvider;

// Export pour compatibilité
export const LanguageContext = React.createContext({
  currentLanguage: 'fr' as const,
  setLanguage: () => {},
  t: (key: string) => key
});
