// Module Europass - Export des composants
export { default as EuropassGenerator } from './components/EuropassGenerator';
export { default as EuropassToggle } from './components/EuropassToggle';
export { EuropassTemplate } from './components/EuropassTemplate';
export { EuropassService } from './services/europass.service';
export * from './types/europass.types';

// Configuration du module
export const EUROPASS_MODULE_CONFIG = {
  name: 'Europass Generator',
  version: '1.0.0',
  description: 'Module de génération de CV au format européen Europass officiel',
  enabled: true,
  features: {
    aiConversion: true,
    multipleFormats: true,
    standardCompliant: true,
    belgianMarket: true
  }
};

// Utilitaire pour vérifier si le module est activé
export const isEuropassEnabled = () => EUROPASS_MODULE_CONFIG.enabled;

// Guide d'intégration rapide
export const INTEGRATION_EXAMPLE = `
// Dans votre composant principal :
import { EuropassToggle } from '@/modules/europass';

// Utilisation simple :
<EuropassToggle cvData={votreDataCV} />

// Ou intégration conditionnelle :
{isEuropassEnabled() && <EuropassToggle cvData={cvData} />}
`;
