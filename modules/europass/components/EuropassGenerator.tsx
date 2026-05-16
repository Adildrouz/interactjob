'use client';

import { useState } from 'react';
import { EuropassCV, EuropassSection } from '../types/europass.types';
import { EuropassService } from '../services/europass.service';
import { EuropassTemplate } from './EuropassTemplate';

interface EuropassGeneratorProps {
  initialData?: any;
  onClose?: () => void;
}

export default function EuropassGenerator({ initialData, onClose }: EuropassGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<'input' | 'preview' | 'export'>('input');
  const [europassData, setEuropassData] = useState<EuropassCV | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'json' | 'xml'>('html');

  const convertToEuropass = async () => {
    if (!initialData) return;

    setIsConverting(true);
    try {
      const converted = await EuropassService.convertCVToEuropass(initialData);
      setEuropassData(converted);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Erreur conversion Europass:', error);
      alert('Erreur lors de la conversion vers le format Europass');
    } finally {
      setIsConverting(false);
    }
  };

  const exportEuropass = async () => {
    if (!europassData) return;

    try {
      const exported = await EuropassService.exportEuropass(europassData, exportFormat);

      // Téléchargement automatique
      const blob = new Blob([exported.content], { type: exported.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exported.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCurrentStep('export');
    } catch (error) {
      console.error('Erreur export Europass:', error);
      alert('Erreur lors de l\'export Europass');
    }
  };

  const restartProcess = () => {
    setCurrentStep('input');
    setEuropassData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                🇪🇺 <span className="ml-3">Générateur Europass</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Convertissez votre CV au format officiel européen Europass
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'input' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'input' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2">Conversion</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div className={`flex items-center ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2">Aperçu</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div className={`flex items-center ${currentStep === 'export' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'export' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2">Export</span>
            </div>
          </div>
        </div>

        {/* Step 1: Input/Conversion */}
        {currentStep === 'input' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Conversion vers Europass
            </h2>

            {initialData ? (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">CV détecté</h3>
                  <p className="text-blue-700 text-sm">
                    Votre CV va être converti au format Europass officiel avec les standards européens
                    pour les compétences linguistiques (A1-C2) et numériques.
                  </p>
                </div>

                <button
                  onClick={convertToEuropass}
                  disabled={isConverting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isConverting ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⚡</span>
                      Conversion en cours...
                    </span>
                  ) : (
                    'Convertir vers Europass'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun CV détecté
                </h3>
                <p className="text-gray-600">
                  Veuillez d'abord analyser un CV dans l'application principale
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {currentStep === 'preview' && europassData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Aperçu Europass
                </h2>
                <div className="flex space-x-3">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="html">HTML (Recommandé)</option>
                    <option value="json">JSON (Machine)</option>
                    <option value="xml">XML (Officiel EU)</option>
                  </select>
                  <button
                    onClick={exportEuropass}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    📥 Télécharger
                  </button>
                  <button
                    onClick={restartProcess}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    🔄 Recommencer
                  </button>
                </div>
              </div>
            </div>

            {/* Template Europass */}
            <EuropassTemplate data={europassData} />
          </div>
        )}

        {/* Step 3: Export Success */}
        {currentStep === 'export' && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Export Europass réussi !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre CV Europass a été téléchargé avec succès.
              Il est maintenant conforme aux standards européens.
            </p>
            <div className="space-x-4">
              <button
                onClick={restartProcess}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Créer un autre Europass
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Retour à l'application
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
