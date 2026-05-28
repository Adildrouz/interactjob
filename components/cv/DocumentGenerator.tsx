"use client"

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
// PayPal supprimé — InteractJob CV est 100% gratuit
import { openaiClient } from "@/services/openai-client";
import { EuropassService } from "@/modules/europass/services/europass.service";
import WYSIWYGEditor from "./WYSIWYGEditor";
import CVRenderer from "./CVRenderer";

// Composant pour le rendu stylisé des documents
const DocumentRenderer = ({ content, type, job }: { content: string, type: string, job: string }) => {
  const isReconversionReport = type === 'reconversion_report';
  const isCv = type === 'cv';
  const isLetter = type === 'letter';
  const isEmail = type === 'email';
  const isEuropass = type === 'europass';

  if (isReconversionReport) {
    // Rendu spécial pour les rapports de reconversion
    return (
      <div className="p-6 space-y-6">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            📊 Rapport de Reconversion Professionnelle
          </h2>
          <p className="text-lg text-purple-600 font-semibold">
            Transition vers : {job}
          </p>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {content.split('\n').map((line, index) => {
            // Détection des titres (commencent par des chiffres ou des **)
            if (line.match(/^\d+\.\s*\*\*.*\*\*/) || line.match(/^\*\*.*\*\*$/)) {
              return (
                <h3 key={index} className="text-lg font-bold text-gray-800 mt-6 mb-3 border-l-4 border-blue-500 pl-3">
                  {line.replace(/\*\*/g, '')}
                </h3>
              );
            }
            // Détection des sous-titres (commencent par des tirets ou puces)
            else if (line.match(/^\s*[-•]\s/)) {
              return (
                <li key={index} className="text-gray-700 mb-2 ml-4">
                  {line.replace(/^\s*[-•]\s/, '')}
                </li>
              );
            }
            // Paragraphes normaux
            else if (line.trim()) {
              return (
                <p key={index} className="text-gray-700 mb-3 leading-relaxed">
                  {line}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  if (isCv) {
    // Rendu amélioré pour CV
    return (
      <div className="p-6 bg-white">
        <div className="space-y-4">
          {content.split('\n\n').map((section, index) => {
            if (section.trim()) {
              // Détection des sections principales (MAJUSCULES ou titres en gras)
              if (section.match(/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞSS\s]+$/) || 
                  section.includes('PROFIL') || section.includes('EXPÉRIENCE') || 
                  section.includes('COMPÉTENCES') || section.includes('FORMATION')) {
                return (
                  <div key={index} className="border-b border-gray-200 pb-2 mb-4">
                    <h3 className="text-lg font-bold text-blue-800 uppercase tracking-wide">
                      {section.trim()}
                    </h3>
                  </div>
                );
              }
              
              return (
                <div key={index} className="mb-4">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {section.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className={`mb-1 ${
                        line.startsWith('•') || line.startsWith('-') ? 'ml-4' : ''
                      }`}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  if (isLetter) {
    // Rendu amélioré pour lettre de motivation
    return (
      <div className="p-6 bg-white max-w-2xl mx-auto">
        <div className="space-y-4 text-gray-700 leading-relaxed">
          {content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-justify">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (isEmail) {
    // Rendu amélioré pour email
    const lines = content.split('\n');
    const objectLine = lines.find(line => line.startsWith('Objet:'));
    const emailContent = lines.filter(line => !line.startsWith('Objet:')).join('\n');

    return (
      <div className="p-6 bg-white">
        {objectLine && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500">
            <div className="font-semibold text-blue-800">{objectLine}</div>
          </div>
        )}
        <div className="space-y-3 text-gray-700 leading-relaxed">
          {emailContent.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-3">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (isEuropass) {
    // Rendu formaté pour Europass (similaire au CV mais avec style Europass)
    return (
      <div className="p-6 bg-white">
        <div className="europass-document w-full max-w-4xl mx-auto">
          <div className="space-y-4">
            {content.split('\n\n').map((section, index) => {
              if (section.trim()) {
                // Détection du titre principal Europass
                if (section.includes('🇪🇺') && section.includes('Curriculum vitae Europass')) {
                  return (
                    <div key={index} className="text-center border-b-4 border-blue-600 pb-4 mb-8">
                      <h1 className="text-3xl font-bold text-blue-800 mb-2">
                        {section.trim()}
                      </h1>
                    </div>
                  );
                }
                
                // Détection des sections principales Europass (en gras)
                if (section.match(/^\*\*[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞSS\s]+\*\*$/) || 
                    section.includes('INFORMATIONS PERSONNELLES') || 
                    section.includes('EMPLOI RECHERCHÉ') ||
                    section.includes('EXPÉRIENCE PROFESSIONNELLE') || 
                    section.includes('ÉDUCATION ET FORMATION') ||
                    section.includes('COMPÉTENCES PERSONNELLES') ||
                    section.includes('INFORMATIONS COMPLÉMENTAIRES')) {
                  return (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 mb-6">
                      <h2 className="text-xl font-bold text-blue-800">
                        {section.replace(/\*\*/g, '').trim()}
                      </h2>
                    </div>
                  );
                }
                
                return (
                  <div key={index} className="mb-4">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed europass-content">
                      {section.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex} className={`mb-1 ${
                          line.startsWith('•') || line.startsWith('-') ? 'ml-4' : ''
                        } ${
                          line.includes('**') ? 'font-semibold' : ''
                        }`}>
                          {line.replace(/\*\*/g, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}
            
            {/* Footer Europass */}
            {content.includes('© Union européenne') && (
              <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
                © Union européenne | Généré par CVBoost
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Rendu par défaut
  return (
    <div className="p-6">
      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
        {content}
      </pre>
    </div>
  );
};

interface Job {
  title: string;
  sector?: string;
  explanation?: string;
  requiredTraining?: string[];
  estimatedDuration?: number;
  isReconversion?: boolean;
}

interface CVData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
  };
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    isCurrentJob: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
}

interface DocumentGeneratorProps {
  cvText: string;
  selectedJob: Job;
  selectedJobs?: Job[]; // Nouvelle prop pour la sélection multiple
  validatedData: CVData;
  language?: string;
  jobOffer?: string;
  userLocation?: string; // Localisation utilisateur
}

interface GeneratedDocument {
  content: string;
  type: string;
  language: string;
  job: string;
}

interface DocumentType {
  id: string;
  label: string;
  icon: string;
  description: string;
  forReconversion: boolean;
}

export default function DocumentGenerator({ 
  cvText, 
  selectedJob, 
  selectedJobs = [],
  validatedData,
  language = "fr",
  jobOffer = "",
  userLocation = "Maroc"
}: DocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [paidDocuments, setPaidDocuments] = useState<string[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<{[key: string]: GeneratedDocument}>({});
  const [currentViewDoc, setCurrentViewDoc] = useState<string>("");
  const [editableContent, setEditableContent] = useState<{[key: string]: string}>({});
  const router = useRouter();

  // Détection du mode multi-métiers
  const isMultiJobMode = selectedJobs.length > 1;
  const totalJobs = isMultiJobMode ? selectedJobs.length : 1;

  // Types de documents disponibles selon le contexte
  const getAllDocumentTypes = () => {
    if (selectedLanguage === 'en') {
      return [
        { id: "cv", label: "Optimized CV", icon: "📄", description: "Modern ATS-friendly CV adapted to your target job", forReconversion: false },
        { id: "letter", label: "Cover Letter", icon: "📝", description: "Personalized letter highlighting your strengths", forReconversion: false },
        { id: "email", label: "Application Email", icon: "📧", description: "Professional ready-to-send email", forReconversion: false },
        { id: "europass", label: "🇪🇺 Europass CV", icon: "🇪🇺", description: "Official European format (CEDEFOP) recognized by VDAB/FOREM/Actiris", forReconversion: false },
        { id: "reconversion_report", label: "Career Transition Report", icon: "📊", description: "Complete analysis with personalized training plan", forReconversion: true }
      ];
    } else if (selectedLanguage === 'nl') {
      return [
        { id: "cv", label: "Geoptimaliseerd CV", icon: "📄", description: "Modern ATS-vriendelijk CV aangepast aan uw doelbaan", forReconversion: false },
        { id: "letter", label: "Motivatiebrief", icon: "📝", description: "Gepersonaliseerde brief die uw sterke punten benadrukt", forReconversion: false },
        { id: "email", label: "Sollicitatie Email", icon: "📧", description: "Professionele klaar-om-te-verzenden email", forReconversion: false },
        { id: "europass", label: "🇪🇺 Europass CV", icon: "🇪🇺", description: "Officieel Europees formaat (CEDEFOP) erkend door VDAB/FOREM/Actiris", forReconversion: false },
        { id: "reconversion_report", label: "Carrière Transitie Rapport", icon: "📊", description: "Volledige analyse met gepersonaliseerd trainingsplan", forReconversion: true }
      ];
    } else {
      return [
        { id: "cv", label: "CV Optimisé", icon: "📄", description: "CV moderne et ATS-friendly adapté au métier choisi", forReconversion: false },
        { id: "letter", label: "Lettre de Motivation", icon: "📝", description: "Lettre personnalisée mettant en avant vos atouts", forReconversion: false },
        { id: "email", label: "Email de Candidature", icon: "📧", description: "Email professionnel d'accompagnement prêt à envoyer", forReconversion: false },
        { id: "europass", label: "🇪🇺 CV Europass", icon: "🇪🇺", description: "Format européen officiel (CEDEFOP) reconnu VDAB/FOREM/Actiris", forReconversion: false },
        { id: "reconversion_report", label: "Rapport de Reconversion", icon: "📊", description: "Analyse complète avec plan de formation personnalisé", forReconversion: true }
      ];
    }
  };

  // Fonction pour obtenir les documents disponibles selon les métiers sélectionnés
  const getAvailableDocuments = () => {
    const allDocTypes = getAllDocumentTypes();
    const jobsToCheck = isMultiJobMode ? selectedJobs : [selectedJob];
    
    // Vérifier s'il y a des jobs de reconversion
    const hasReconversionJobs = jobsToCheck.some(job => job.isReconversion);
    const hasStandardJobs = jobsToCheck.some(job => !job.isReconversion);
    
    if (hasReconversionJobs && hasStandardJobs) {
      // Mélange de reconversion et standard : proposer tous les types
      return allDocTypes;
    } else if (hasReconversionJobs) {
      // Que des reconversions : seulement le rapport
      return allDocTypes.filter(doc => doc.forReconversion);
    } else {
      // Que des jobs standards : CV, lettre, email
      return allDocTypes.filter(doc => !doc.forReconversion);
    }
  };

  const documentTypes = getAvailableDocuments();

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "nl", label: "Nederlands", flag: "🇳🇱" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "es", label: "Español", flag: "🇪🇸" }
  ];

  // Traductions de l'interface
  const translations = {
    fr: {
      title: "Génération de Documents",
      selectedJob: "Métier sélectionné:",
      howItWorks: "Comment ça marche :",
      step1NotPaid: "1) Sélectionnez vos documents → 2) Payez → 3) Générez et téléchargez",
      step2Paid: "Vos documents sont payés ! Cliquez sur 'Générer' puis naviguez entre eux.",
      documentLanguage: "Langue des documents",
      step1Title: "1. Sélectionnez vos documents",
      selectDocuments: "Sélectionnez les documents que vous souhaitez générer",
      multiJobMode: "Mode Multi-Métiers Activé",
      multiJobDesc: "Documents générés pour chaque métier sélectionné",
      totalCombinations: "combinaisons au total",
      document: "document",
      documents: "documents",
      selected: "sélectionné",
      selectedPlural: "sélectionnés",
      economy: "Économie de",
      perfect2Docs: "💰 Parfait ! 2 documents pour 4€ (économie de 2€)",
      excellent3Docs: "🎉 Excellent choix ! Pack complet pour 5€ (économie de 1€ supplémentaire)",
      promoCode: "Code promo",
      verify: "Vérifier",
      promoValid: "✅ Code promo valide ! Documents 100% GRATUITS",
      unlockFree: "Débloquer Gratuitement",
      payWith: "Payer",
      withPayPal: "avec PayPal",
      step2Title: "2. Génération de vos documents",
      paymentConfirmed: "Paiement confirmé !",
      unlocked: "débloqué",
      unlockedPlural: "débloqués",
      generate: "Générer mes",
      generating: "Génération en cours...",
      step3Title: "3. Vos documents générés",
      download: "📥 Télécharger",
      copy: "📋 Copier",
      copied: "Contenu copié dans le presse-papiers !",
      paypalPayment: "Paiement PayPal",
      cancel: "Annuler",
      professionalDocs: "Documents professionnels"
    },
    en: {
      title: "Document Generation",
      selectedJob: "Selected job:",
      howItWorks: "How it works:",
      step1NotPaid: "1) Select your documents → 2) Pay → 3) Generate and download",
      step2Paid: "Your documents are paid! Click 'Generate' then navigate between them.",
      documentLanguage: "Document language",
      step1Title: "1. Select your documents",
      selectDocuments: "Select the documents you want to generate",
      multiJobMode: "Multi-Career Mode Activated",
      multiJobDesc: "Documents generated for each selected career",
      totalCombinations: "combinations total",
      document: "document",
      documents: "documents",
      selected: "selected",
      selectedPlural: "selected",
      economy: "Save",
      perfect2Docs: "💰 Perfect! 2 documents for 4€ (save 2€)",
      excellent3Docs: "🎉 Excellent choice! Complete pack for 5€ (save 1€ extra)",
      promoCode: "Promo code",
      verify: "Verify",
      promoValid: "✅ Valid promo code! Documents 100% FREE",
      unlockFree: "Unlock for Free",
      payWith: "Pay",
      withPayPal: "with PayPal",
      step2Title: "2. Generate your documents",
      paymentConfirmed: "Payment confirmed!",
      unlocked: "unlocked",
      unlockedPlural: "unlocked",
      generate: "Generate my",
      generating: "Generating...",
      step3Title: "3. Your generated documents",
      download: "📥 Download",
      copy: "📋 Copy",
      copied: "Content copied to clipboard!",
      paypalPayment: "PayPal Payment",
      cancel: "Cancel",
      professionalDocs: "Professional documents"
    },
    de: {
      title: "Dokumentenerstellung",
      selectedJob: "Ausgewählter Beruf:",
      howItWorks: "So funktioniert es:",
      step1NotPaid: "1) Dokumente auswählen → 2) Bezahlen → 3) Generieren und herunterladen",
      step2Paid: "Ihre Dokumente sind bezahlt! Klicken Sie auf 'Generieren' und navigieren Sie zwischen ihnen.",
      documentLanguage: "Sprache der Dokumente",
      step1Title: "1. Wählen Sie Ihre Dokumente",
      selectDocuments: "Wählen Sie die Dokumente aus, die Sie generieren möchten",
      multiJobMode: "Multi-Berufe-Modus aktiviert",
      multiJobDesc: "Dokumente für jeden ausgewählten Beruf generiert",
      totalCombinations: "Kombinationen insgesamt",
      document: "Dokument",
      documents: "Dokumente",
      selected: "ausgewählt",
      selectedPlural: "ausgewählt",
      economy: "Ersparnis von",
      perfect2Docs: "💰 Perfekt! 2 Dokumente für 4€ (Ersparnis von 2€)",
      excellent3Docs: "🎉 Ausgezeichnete Wahl! Komplettpaket für 5€ (zusätzliche Ersparnis von 1€)",
      promoCode: "Promocode",
      verify: "Überprüfen",
      promoValid: "✅ Gültiger Promocode! Dokumente 100% KOSTENLOS",
      unlockFree: "Kostenlos freischalten",
      payWith: "Bezahlen",
      withPayPal: "mit PayPal",
      step2Title: "2. Generierung Ihrer Dokumente",
      paymentConfirmed: "Zahlung bestätigt!",
      unlocked: "freigeschaltet",
      unlockedPlural: "freigeschaltet",
      generate: "Meine generieren",
      generating: "Generierung läuft...",
      step3Title: "3. Ihre generierten Dokumente",
      download: "📥 Herunterladen",
      copy: "📋 Kopieren",
      copied: "Inhalt in die Zwischenablage kopiert!",
      paypalPayment: "PayPal Zahlung",
      cancel: "Abbrechen",
      professionalDocs: "Professionelle Dokumente"
    },
    it: {
      title: "Generazione Documenti",
      selectedJob: "Lavoro selezionato:",
      howItWorks: "Come funziona:",
      step1NotPaid: "1) Seleziona i tuoi documenti → 2) Paga → 3) Genera e scarica",
      step2Paid: "I tuoi documenti sono pagati! Clicca su 'Genera' poi naviga tra di essi.",
      documentLanguage: "Lingua dei documenti",
      step1Title: "1. Seleziona i tuoi documenti",
      selectDocuments: "Seleziona i documenti che vuoi generare",
      multiJobMode: "Modalità Multi-Professioni Attivata",
      multiJobDesc: "Documenti generati per ogni professione selezionata",
      totalCombinations: "combinazioni totali",
      document: "documento",
      documents: "documenti",
      selected: "selezionato",
      selectedPlural: "selezionati",
      economy: "Risparmio di",
      perfect2Docs: "💰 Perfetto! 2 documenti per 4€ (risparmio di 2€)",
      excellent3Docs: "🎉 Scelta eccellente! Pacchetto completo per 5€ (risparmio aggiuntivo di 1€)",
      promoCode: "Codice promo",
      verify: "Verifica",
      promoValid: "✅ Codice promo valido! Documenti 100% GRATUITI",
      unlockFree: "Sblocca Gratuitamente",
      payWith: "Paga",
      withPayPal: "con PayPal",
      step2Title: "2. Generazione dei tuoi documenti",
      paymentConfirmed: "Pagamento confermato!",
      unlocked: "sbloccato",
      unlockedPlural: "sbloccati",
      generate: "Genera i miei",
      generating: "Generazione in corso...",
      step3Title: "3. I tuoi documenti generati",
      download: "📥 Scarica",
      copy: "📋 Copia",
      copied: "Contenuto copiato negli appunti!",
      paypalPayment: "Pagamento PayPal",
      cancel: "Annulla",
      professionalDocs: "Documenti professionali"
    },
    es: {
      title: "Generación de Documentos",
      selectedJob: "Trabajo seleccionado:",
      howItWorks: "Cómo funciona:",
      step1NotPaid: "1) Selecciona tus documentos → 2) Paga → 3) Genera y descarga",
      step2Paid: "¡Tus documentos están pagados! Haz clic en 'Generar' luego navega entre ellos.",
      documentLanguage: "Idioma de los documentos",
      step1Title: "1. Selecciona tus documentos",
      selectDocuments: "Selecciona los documentos que quieres generar",
      multiJobMode: "Modo Multi-Profesiones Activado",
      multiJobDesc: "Documentos generados para cada profesión seleccionada",
      totalCombinations: "combinaciones en total",
      document: "documento",
      documents: "documentos",
      selected: "seleccionado",
      selectedPlural: "seleccionados",
      economy: "Ahorro de",
      perfect2Docs: "💰 ¡Perfecto! 2 documentos por 4€ (ahorro de 2€)",
      excellent3Docs: "🎉 ¡Excelente elección! Paquete completo por 5€ (ahorro adicional de 1€)",
      promoCode: "Código promo",
      verify: "Verificar",
      promoValid: "✅ ¡Código promo válido! Documentos 100% GRATIS",
      unlockFree: "Desbloquear Gratis",
      payWith: "Pagar",
      withPayPal: "con PayPal",
      step2Title: "2. Generación de tus documentos",
      paymentConfirmed: "¡Pago confirmado!",
      unlocked: "desbloqueado",
      unlockedPlural: "desbloqueados",
      generate: "Generar mis",
      generating: "Generando...",
      step3Title: "3. Tus documentos generados",
      download: "📥 Descargar",
      copy: "📋 Copiar",
      copied: "¡Contenido copiado al portapapeles!",
      paypalPayment: "Pago PayPal",
      cancel: "Cancelar",
      professionalDocs: "Documentos profesionales"
    },
    nl: {
      title: "Document Generatie",
      selectedJob: "Geselecteerd beroep:",
      howItWorks: "Hoe het werkt:",
      step1NotPaid: "1) Selecteer uw documenten → 2) Betaal → 3) Genereer en download",
      step2Paid: "Uw documenten zijn betaald! Klik op 'Genereren' en navigeer tussen hen.",
      documentLanguage: "Document taal",
      step1Title: "1. Selecteer uw documenten",
      selectDocuments: "Selecteer de documenten die u wilt genereren",
      multiJobMode: "Multi-Beroep Modus Geactiveerd",
      multiJobDesc: "Documenten gegenereerd voor elk geselecteerd beroep",
      totalCombinations: "combinaties totaal",
      document: "document",
      documents: "documenten",
      selected: "geselecteerd",
      selectedPlural: "geselecteerd",
      economy: "Besparing van",
      perfect2Docs: "💰 Perfect! 2 documenten voor 4€ (besparing 2€)",
      excellent3Docs: "🎉 Uitstekende keuze! Compleet pakket voor 5€ (extra 1€ besparing)",
      promoCode: "Promocode",
      verify: "Verifiëren",
      promoValid: "✅ Geldige promocode! Documenten 100% GRATIS",
      unlockFree: "Gratis Ontgrendelen",
      payWith: "Betaal",
      withPayPal: "met PayPal",
      step2Title: "2. Genereer uw documenten",
      paymentConfirmed: "Betaling bevestigd!",
      unlocked: "ontgrendeld",
      unlockedPlural: "ontgrendeld",
      generate: "Genereer mijn",
      generating: "Genereren...",
      step3Title: "3. Uw gegenereerde documenten",
      download: "📥 Download",
      copy: "📋 Kopiëren",
      copied: "Inhoud gekopieerd naar klembord!",
      paypalPayment: "PayPal Betaling",
      cancel: "Annuleren",
      professionalDocs: "Professionele documenten"
    }
  };

  const t = translations[selectedLanguage as keyof typeof translations] || translations.fr;

  const generateDocuments = async () => {
    if (!validatedData || !selectedJob || paidDocuments.length === 0) return;

    setIsGenerating(true);

    try {
      try { (window as any).ev && (window as any).ev('generate_cv', { docs: paidDocuments.length, jobs: totalJobs }); } catch {}
      const newGeneratedDocs = { ...generatedDocuments };
      const jobsToProcess = isMultiJobMode ? selectedJobs : [selectedJob];
      
      // Générer toutes les combinaisons métier × document
      for (const job of jobsToProcess) {
        for (const docType of paidDocuments) {
          const docKey = isMultiJobMode ? `${docType}_${job.title}` : docType;
          
          if (!generatedDocuments[docKey]) {
            console.log(`Génération de ${docType} pour ${job.title}...`);
            
            // Validation : s'assurer que le type de document correspond au type de job
            if (job.isReconversion && docType !== 'reconversion_report') {
              console.warn(`⚠️ Document ${docType} ignoré pour job de reconversion ${job.title}`);
              continue;
            }
            if (!job.isReconversion && docType === 'reconversion_report') {
              console.warn(`⚠️ Rapport de reconversion ignoré pour job standard ${job.title}`);
              continue;
            }
            
            let content: string;
            
            if (docType === 'europass') {
              // Génération Europass avec OpenAI (service spécialisé était défaillant)
              content = await openaiClient.generateDocument(
                docType, 
                validatedData, 
                job, 
                selectedLanguage,
                jobOffer || undefined,
                userLocation
              );
            } else {
              // Génération standard avec OpenAI
              content = await openaiClient.generateDocument(
                docType, 
                validatedData, 
                job, 
                selectedLanguage,
                jobOffer || undefined,
                userLocation
              );
            }

            newGeneratedDocs[docKey] = {
              content: content,
              type: docType,
              language: selectedLanguage,
              job: job.title
            };
          }
        }
      }
      
      setGeneratedDocuments(newGeneratedDocs);
      
      // Afficher le premier document généré
      const firstDocKey = Object.keys(newGeneratedDocs)[0];
      if (firstDocKey && !currentViewDoc) {
        setCurrentViewDoc(firstDocKey);
      }
      
    } catch (error) {
      console.error("Erreur génération:", error);
      const errorGenMessages = {
        fr: "Erreur lors de la génération. Veuillez réessayer.",
        en: "Generation error. Please try again.",
        nl: "Generatiefout. Probeer opnieuw."
      };
      alert(errorGenMessages[selectedLanguage as keyof typeof errorGenMessages] || errorGenMessages.fr);
    } finally {
      setIsGenerating(false);
      // Pas de redirection post-génération
    }
  };

  // 100% Gratuit — pas de paiement requis
  const handleFreeGenerate = () => {
    if (selectedDocuments.length === 0) return;
    setPaidDocuments([...selectedDocuments]);
  };

  const downloadDocument = async (docType: string) => {
    const doc = generatedDocuments[docType];
    if (!doc) return;
    
    // Téléchargement simple selon le type
    if (doc.type === 'cv' || doc.type === 'europass') {
      // Pour les CV, on utilise maintenant CVRenderer qui gère l'impression/PDF
      return; // Le téléchargement se fait via CVRenderer
    }
    
    // Pour lettres et emails, téléchargement HTML formaté
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${selectedLanguage}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${doc.type === 'letter' ? 'Lettre de Motivation' : 'Email de Candidature'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
          .document { background: white; padding: 30px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          p { margin-bottom: 15px; text-align: justify; }
        </style>
      </head>
      <body>
        <div class="document">
          <h1>${doc.type === 'letter' ? 'Lettre de Motivation' : 'Email de Candidature'}</h1>
          <div style="white-space: pre-wrap;">${doc.content}</div>
        </div>
        <script>
          function printDocument() { window.print(); }
        </script>
        <button onclick="printDocument()" style="position: fixed; top: 20px; right: 20px; background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimer/PDF</button>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.type}_${selectedLanguage}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Suggestions d'offres (Indeed / LinkedIn) sans API: liens de recherche contextuels
  const renderJobOffers = () => {
    const q = encodeURIComponent(`${selectedJob?.title || ''} ${userLocation || ''}`.trim());
    const city = encodeURIComponent(userLocation || 'Maroc');
    const indeedUrl = `https://be.indeed.com/jobs?q=${q}&l=${city}`;
    const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${city}`;
    return (
      <div className="mt-8 bg-white border rounded-lg p-4">
        <h4 className="text-lg font-bold text-gray-800 mb-3">Offres d'emploi correspondantes</h4>
        <p className="text-sm text-gray-600 mb-3">Ces liens ouvrent une recherche en direct filtrée sur votre métier et votre localisation.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={indeedUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">🔎 Voir sur Indeed</a>
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">🔎 Voir sur LinkedIn</a>
        </div>
      </div>
    );
  };



  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t.title}
          </h2>
          {isMultiJobMode ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-600 font-semibold">🎯 {t.multiJobMode}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  {selectedJobs.length} métiers
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{t.multiJobDesc}</p>
              <div className="flex flex-wrap gap-2">
                {selectedJobs.map((job, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {job.title}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              {t.selectedJob} <span className="font-semibold text-blue-600">{selectedJob.title}</span>
            </p>
          )}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>📋 {t.howItWorks}</strong> 
              {paidDocuments.length === 0 
                ? t.step1NotPaid
                : t.step2Paid
              }
            </p>
          </div>
        </div>

        {/* Sélecteur de langue */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.documentLanguage}
          </label>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`px-4 py-2 rounded-md border flex items-center gap-2 transition-colors ${
                  selectedLanguage === lang.code
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ÉTAPE 1: Sélection des documents (si pas encore payé) */}
        {paidDocuments.length === 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {t.step1Title}
            </h3>
            <div className="space-y-3">
              {documentTypes.map((doc) => (
                <label
                  key={doc.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedDocuments.includes(doc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes((doc as DocumentType).id)}
                                          onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments([...selectedDocuments, (doc as DocumentType).id]);
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== (doc as DocumentType).id));
                        }
                      }}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{(doc as DocumentType).label}</div>
                    <div className="text-sm text-gray-600">{(doc as DocumentType).description}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold text-blue-600">2€</div>
                    <div className="text-xs text-gray-500">vs ~75€ manuel</div>
                    <div className="text-xs text-green-600 font-semibold">ROI: 3650%</div>
                  </div>
                </label>
              ))}
            </div>

            {/* ROI Banner */}
            {selectedDocuments.length > 0 && (
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800 mb-2">
                    ⏱️ {language === 'fr' ? 'Votre temps vaut plus que 2€' : 
                        language === 'nl' ? 'Uw tijd is meer waard dan €2' : 
                        language === 'en' ? 'Your time is worth more than €2' :
                        language === 'de' ? 'Ihre Zeit ist mehr wert als 2€' :
                        language === 'it' ? 'Il tuo tempo vale più di 2€' :
                        'Su tiempo vale más que 2€'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-red-600">
                      ❌ {language === 'fr' ? '5-10h manuel = ~75€ coût' : 
                          language === 'nl' ? '5-10u handmatig = ~€75 kosten' : 
                          language === 'en' ? '5-10h manual = ~€75 cost' :
                          language === 'de' ? '5-10h manuell = ~75€ Kosten' :
                          language === 'it' ? '5-10h manuale = ~75€ costo' :
                          '5-10h manual = ~75€ coste'}
                    </div>
                    <div className="text-green-600">
                      ✅ {language === 'fr' ? '3min IA = 2€ seulement' : 
                          language === 'nl' ? '3min AI = slechts €2' : 
                          language === 'en' ? '3min AI = only €2' :
                          language === 'de' ? '3min KI = nur 2€' :
                          language === 'it' ? '3min IA = solo 2€' :
                          '3min IA = solo 2€'}
                    </div>
                  </div>
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    🚀 {language === 'fr' ? 'Économie instantanée: 98% temps + 70% plus d\'entretiens' : 
                        language === 'nl' ? 'Onmiddellijke besparing: 98% tijd + 70% meer interviews' : 
                        language === 'en' ? 'Instant savings: 98% time + 70% more interviews' :
                        language === 'de' ? 'Sofortige Einsparung: 98% Zeit + 70% mehr Interviews' :
                        language === 'it' ? 'Risparmio immediato: 98% tempo + 70% più colloqui' :
                        'Ahorro inmediato: 98% tiempo + 70% más entrevistas'}
                  </p>
                </div>
              </div>
            )}

            {/* Bandeau 100% Gratuit */}
            {selectedDocuments.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      {selectedDocuments.length} {selectedDocuments.length > 1 ? t.documents : t.document} {selectedDocuments.length > 1 ? t.selectedPlural : t.selected}
                      {isMultiJobMode && (
                        <div className="text-sm text-purple-600 font-medium mt-1">
                          × {selectedJobs.length} métiers = {selectedDocuments.length * totalJobs} {t.totalCombinations}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-emerald-700 font-medium mt-1">
                      🎁 100% Gratuit — Offert par InteractJob
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">GRATUIT</div>
                </div>
              </div>
            )}

            {/* Info simple pour CV */}
            {selectedDocuments.length > 0 && selectedDocuments.some(doc => doc === 'cv' || doc === 'europass') && (
              <div className="mt-6">
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📄</span>
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        {language === 'fr' ? 'CV Professionnel Intégré' : 
                         language === 'en' ? 'Professional CV Integrated' : 
                         'Professionele CV Geïntegreerd'}
                      </h4>
                      <p className="text-sm text-blue-700">
                        {language === 'fr' ? 'Template moderne avec impression/PDF intégrée' : 
                         language === 'en' ? 'Modern template with integrated print/PDF' : 
                         'Modern sjabloon met geïntegreerde print/PDF'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton génération gratuite */}
            {selectedDocuments.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleFreeGenerate}
                  className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-lg"
                >
                  🚀 {language === 'fr' ? 'Générer mes documents — Gratuit' :
                      language === 'en' ? 'Generate my documents — Free' :
                      language === 'ar' ? 'توليد وثائقي — مجاني' :
                      'Générer mes documents — Gratuit'}
                </button>
              </div>
            )}

                         {selectedDocuments.length === 0 && (
               <p className="text-sm text-gray-500 text-center mt-4">
                 {t.selectDocuments}
               </p>
             )}
          </div>
        )}

        {/* ÉTAPE 2: Génération (si payé mais pas encore généré) */}
        {paidDocuments.length > 0 && Object.keys(generatedDocuments).length === 0 && (
                     <div className="mb-6">
             <h3 className="text-lg font-semibold text-gray-700 mb-4">
               {t.step2Title}
             </h3>
             <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
               <div className="text-4xl mb-4">🚀</div>
               <h4 className="text-xl font-bold text-gray-800 mb-2">
                 {language === 'fr' ? 'Prêt à générer !' : language === 'en' ? 'Ready to generate!' : 'جاهز للتوليد!'}
               </h4>
               <p className="text-gray-600 mb-4">
                 {isMultiJobMode ? (
                   <>
                     {paidDocuments.length * totalJobs} {paidDocuments.length * totalJobs > 1 ? t.documents : t.document} {paidDocuments.length * totalJobs > 1 ? t.unlockedPlural : t.unlocked}
                     <span className="block text-sm text-purple-600 mt-1">
                       {paidDocuments.length} types × {totalJobs} métiers
                     </span>
                   </>
                 ) : (
                   <>
                     {paidDocuments.length} {paidDocuments.length > 1 ? t.documents : t.document} {paidDocuments.length > 1 ? t.unlockedPlural : t.unlocked}
                   </>
                 )}
               </p>
               <button
                 onClick={generateDocuments}
                 disabled={isGenerating}
                 className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
               >
                 {isGenerating ? (
                   <div className="flex items-center">
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                     {t.generating}
                   </div>
                 ) : (
                   isMultiJobMode 
                     ? `${t.generate} ${paidDocuments.length * totalJobs} ${paidDocuments.length * totalJobs > 1 ? t.documents : t.document}`
                     : `${t.generate} ${paidDocuments.length} ${paidDocuments.length > 1 ? t.documents : t.document}`
                 )}
               </button>
             </div>
           </div>
        )}

        {/* ÉTAPE 3: Navigation et téléchargement (si généré) */}
        {Object.keys(generatedDocuments).length > 0 && (
                     <div className="mb-6">
             <h3 className="text-lg font-semibold text-gray-700 mb-4">
               {t.step3Title}
             </h3>
            
            {/* Navigation entre documents */}
            {isMultiJobMode ? (
              // Mode multi-métiers : Navigation par métier puis document
              <div className="space-y-4 mb-4">
                {(selectedJobs.length > 0 ? selectedJobs : [selectedJob]).map((job, jobIndex) => (
                  <div key={jobIndex} className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">🎯</span>
                      {job.title}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {paidDocuments.map((docType) => {
                        const docKey = `${docType}_${job.title}`;
                        return (
                          <button
                            key={docKey}
                            onClick={() => setCurrentViewDoc(docKey)}
                            className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                              currentViewDoc === docKey
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {documentTypes.find((d: DocumentType) => d.id === docType)?.icon} {documentTypes.find((d: DocumentType) => d.id === docType)?.label}
                            {generatedDocuments[docKey] && <span className="ml-1 text-green-500">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Mode simple : Navigation classique
              <div className="flex gap-2 mb-4">
                {paidDocuments.map((docType) => (
                  <button
                    key={docType}
                    onClick={() => setCurrentViewDoc(docType)}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      currentViewDoc === docType
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {documentTypes.find((d: DocumentType) => d.id === docType)?.icon} {documentTypes.find((d: DocumentType) => d.id === docType)?.label}
                    {generatedDocuments[docType] && <span className="ml-1 text-green-500">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Affichage du document sélectionné */}
            {currentViewDoc && generatedDocuments[currentViewDoc] && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">
                      {isMultiJobMode ? (
                        <>
                          {generatedDocuments[currentViewDoc].type === 'reconversion_report' 
                            ? documentTypes.find((d: DocumentType) => d.id === 'reconversion_report')?.label
                            : documentTypes.find((d: DocumentType) => d.id === currentViewDoc.split('_')[0])?.label
                          }
                          <span className="ml-2 text-sm text-purple-600 font-medium">
                            pour {generatedDocuments[currentViewDoc].job}
                          </span>
                        </>
                      ) : (
                        generatedDocuments[currentViewDoc].type === 'reconversion_report'
                          ? documentTypes.find((d: DocumentType) => d.id === 'reconversion_report')?.label
                          : documentTypes.find((d: DocumentType) => d.id === currentViewDoc)?.label
                      )}
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {languages.find(l => l.code === selectedLanguage)?.label}
                    </span>
                    {isMultiJobMode && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {generatedDocuments[currentViewDoc].job}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg">
                  {generatedDocuments[currentViewDoc] && (
                    <>
                      {(generatedDocuments[currentViewDoc].type === 'cv' || generatedDocuments[currentViewDoc].type === 'europass') ? (
                        <CVRenderer
                          content={editableContent[currentViewDoc] || generatedDocuments[currentViewDoc].content}
                          cvData={validatedData}
                          language={selectedLanguage}
                          jobTitle={isMultiJobMode ? generatedDocuments[currentViewDoc].job : selectedJob.title}
                          userLocation={userLocation}
                        />
                      ) : (
                        <WYSIWYGEditor
                          content={editableContent[currentViewDoc] || generatedDocuments[currentViewDoc].content}
                          onChange={(content) => {
                            setEditableContent({
                              ...editableContent,
                              [currentViewDoc]: content
                            });
                            // Mettre à jour le document généré avec le contenu modifié
                            setGeneratedDocuments({
                              ...generatedDocuments,
                              [currentViewDoc]: {
                                ...generatedDocuments[currentViewDoc],
                                content: content
                              }
                            });
                          }}
                          language={selectedLanguage}
                          documentType={generatedDocuments[currentViewDoc].type as any}
                        />
                      )}
                    </>
                  )}
                </div>

                                 {/* Boutons d'action */}
                 {!['cv', 'europass'].includes(generatedDocuments[currentViewDoc]?.type) && (
                   <div className="mt-4 flex justify-center gap-3">
                     <button
                       onClick={() => downloadDocument(currentViewDoc)}
                       className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                     >
                       📄 {t.download}
                     </button>
                     
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(generatedDocuments[currentViewDoc].content);
                         alert(t.copied);
                       }}
                       className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                     >
                       {t.copy}
                     </button>
                   </div>
                 )}

                {/* Offres d'emploi contextuelles */}
                {renderJobOffers()}
              </div>
            )}
          </div>
        )}

        {/* Paiement supprimé — InteractJob CV est 100% gratuit */}


      </div>
    </>
  );
} 