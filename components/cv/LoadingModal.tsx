'use client';

import { useEffect, useState } from 'react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  details?: string[];
}

export default function LoadingModal({ isOpen, message = "Analyse en cours...", details = [] }: LoadingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  const defaultSteps = [
    "🔍 Lecture et analyse de votre CV...",
    "🧠 IA en cours d'analyse des compétences...",
    "💼 Recherche des métiers compatibles...",
    "🎯 Génération des suggestions personnalisées...",
    "✨ Finalisation de l'analyse..."
  ];

  const steps = details.length > 0 ? details : defaultSteps;

  useEffect(() => {
    if (!isOpen) return;

    // Animation des points
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    // Progression des étapes
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % steps.length;
        return next;
      });
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(stepInterval);
    };
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">

        {/* Animation de fond */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-30"></div>

        {/* Contenu principal */}
        <div className="relative z-10">

          {/* Spinner animé */}
          <div className="mx-auto mb-6 relative">
            <div className="w-20 h-20 mx-auto">
              {/* Cercle externe qui tourne */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              {/* Cercle interne qui pulse */}
              <div className="absolute inset-2 border-2 border-purple-200 rounded-full animate-pulse border-t-purple-500"></div>
              {/* Icône centrale */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl animate-bounce">🤖</div>
              </div>
            </div>
          </div>

          {/* Message principal */}
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {message}{dots}
          </h3>

          {/* Étape actuelle */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Étape actuelle :</p>
            <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
              <p className="text-blue-800 font-medium text-sm">
                {steps[currentStep]}
              </p>
            </div>
          </div>

          {/* Barre de progression animée */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                animation: 'shimmer 2s infinite'
              }}
            ></div>
          </div>

          {/* Message d'encouragement */}
          <p className="text-xs text-gray-500">
            ⏱️ L'analyse prend généralement 30-60 secondes
            <br />
            ✨ Votre CV est analysé par notre IA avancée
          </p>

        </div>

        {/* Styles CSS pour les animations */}
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .bg-gradient-to-r {
            background-size: 200% 100%;
          }
        `}</style>

      </div>
    </div>
  );
}
