'use client';

import { useState } from 'react';
import EuropassGenerator from './EuropassGenerator';

interface EuropassToggleProps {
  cvData?: any;
  className?: string;
}

export default function EuropassToggle({ cvData, className = '' }: EuropassToggleProps) {
  const [isEuropassOpen, setIsEuropassOpen] = useState(false);

  if (isEuropassOpen) {
    return (
      <EuropassGenerator
        initialData={cvData}
        onClose={() => setIsEuropassOpen(false)}
      />
    );
  }

  return (
    <div className={`europass-toggle ${className}`}>
      <button
        onClick={() => setIsEuropassOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl"
      >
        <span className="text-2xl">🇪🇺</span>
        <div className="text-left">
          <div className="font-bold">Europass</div>
          <div className="text-xs opacity-90">Format européen</div>
        </div>
      </button>

      <div className="mt-2 text-xs text-gray-600 max-w-xs">
        Convertir au format CV européen officiel (reconnu VDAB/FOREM/Actiris)
      </div>
    </div>
  );
}
