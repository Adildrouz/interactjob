"use client";

import React, { useState } from "react";
import { openaiClient } from "@/services/openai-client";
import { performanceOptimizer } from "@/services/performance-optimizer";
import DocumentGenerator from "./DocumentGenerator";
import DataValidation from "./DataValidation";
import LoadingModal from "./LoadingModal";
import CVPaymentGate from "./CVPaymentGate";

interface Job {
  title: string;
  sector?: string;
  explanation?: string;
  compatibilityScore?: number;
  strengths?: string[];
  improvementAreas?: string[];
  requiredTraining?: string[];
  estimatedDuration?: number;
  salaryRange?: string;
  demandRegions?: string[];
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

type WorkflowStep = "upload" | "suggestions" | "validation" | "payment" | "generation";

export default function UploadButton() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload");
  const [cvText, setCvText] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [suggestions, setSuggestions] = useState<Job[]>([]);
  const [reconversionSuggestions, setReconversionSuggestions] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
  const [validatedData, setValidatedData] = useState<CVData | null>(null);
  const [customJobOffer, setCustomJobOffer] = useState('');
  const [isAnalyzingOffer, setIsAnalyzingOffer] = useState(false);
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);

  const analyzeProfile = async () => {
    if (cvText.length < 50) {
      alert("Veuillez écrire votre parcours professionnel (au moins 50 caractères)");
      return;
    }

    setSuggesting(true);
    setShowLoadingModal(true);
    const startTime = Date.now();

    try {
      console.log('🚀 Utilisation du système optimisé...');

      const result = await performanceOptimizer.analyzeCV(cvText);
      setSuggestions(result.suggestions);
      setReconversionSuggestions(result.reconversionSuggestions);

      const endTime = Date.now();
      setAnalysisTime(endTime - startTime);
      setCurrentStep("suggestions");

    } catch (error) {
      console.error("Erreur analyse:", error);

      try {
        console.log('⚠️ Fallback vers système classique...');
        const suggestions = await openaiClient.suggestJobs(cvText);
        setSuggestions(suggestions);

        const reconversionJobs = await openaiClient.suggestReconversionJobs(cvText, 'Maroc');
        setReconversionSuggestions(reconversionJobs);

        setCurrentStep("suggestions");
      } catch (fallbackError) {
        console.error("Erreur fallback:", fallbackError);
        alert("Erreur lors de l'analyse. Veuillez réessayer.");
      }
    } finally {
      setSuggesting(false);
      setShowLoadingModal(false);
    }
  };

  const selectJob = (job: Job) => {
    setSelectedJob(job);
    setCurrentStep("validation");
  };

  const handleValidationComplete = (data: CVData) => {
    setValidatedData(data);
    setCurrentStep("payment");
  };

  const restart = () => {
    setCurrentStep("upload");
    setCvText("");
    setSuggestions([]);
    setSelectedJob(null);
    setSelectedJobs([]);
    setValidatedData(null);
    setSuggesting(false);
    setCustomJobOffer("");
    setIsAnalyzingOffer(false);
  };

  // Étape 1: Upload
  if (currentStep === "upload") {
    return (
      <>
        <div className="w-full">
          <div className="p-0 w-full">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">✍️ Racontez votre histoire.</h1>
              <p className="text-gray-600 text-lg">
                En quelques lignes, notre IA transforme votre parcours en un CV et une lettre qui donnent envie de vous rencontrer.
              </p>
            </div>

            <div className="space-y-4 max-w-6xl mx-auto">
              <div>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder={`Exemple :
Jean Dupont, 30 ans, Paris
Email: jean@email.com, Tel: 06.12.34.56.78

Expériences:
- Commercial chez ABC Company (2020-2024): vente B2B, prospection
- Stage marketing chez XYZ (2019): réseaux sociaux

Formation:
- Master Commerce International (2020)
- Bac ES (2018)

Compétences: négociation, anglais, Excel, CRM

Ou collez directement votre CV...`}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />

                <div className="mt-4 text-xs text-gray-500 text-center">
                  {cvText.length}/50 caractères minimum
                </div>

                {cvText.length > 50 && (
                  <div className="mt-4">
                    <button
                      onClick={analyzeProfile}
                      disabled={suggesting}
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                    >
                      {suggesting ? "🔍 Analyse en cours..." : "🚀 Analyser mon profil"}
                    </button>

                    {analysisTime && (
                      <div className="mt-2 text-center">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ⚡ Dernière analyse: {(analysisTime / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center space-y-2">
              <p className="text-base text-gray-800 font-medium">💡 Vous parlez. Elle comprend.</p>
              <p className="text-sm text-gray-600">
                Elle analyse vos forces, trouve le métier qui vous correspond, et crée vos documents en quelques secondes.
              </p>
              <div className="pt-2">
                <p className="text-base text-gray-800 font-medium">🔒 Votre histoire reste la vôtre.</p>
                <p className="text-sm text-gray-500">Vos données sont protégées et disparaissent une fois votre CV prêt.</p>
              </div>
            </div>
          </div>
        </div>

        <LoadingModal
          isOpen={showLoadingModal}
          message="🤖 IA en cours d'analyse de votre CV"
          details={[
            "🔍 Lecture et extraction des données...",
            "🧠 Analyse des compétences et expériences...",
            "💼 Recherche des métiers compatibles...",
            "🎯 Génération des suggestions personnalisées...",
            "✨ Finalisation et optimisation..."
          ]}
        />
      </>
    );
  }

  // Étape 2: Suggestions
  if (currentStep === "suggestions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🎯 Métiers recommandés pour votre profil
            </h1>
            <button
              onClick={restart}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Recommencer
            </button>
          </div>

          {/* Suggestions métiers directs */}
          {suggestions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                💼 Métiers Compatible avec votre Profil Actuel
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((job, index) => (
                  <div
                    key={`direct-${index}`}
                    className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-green-500"
                    onClick={() => selectJob(job)}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-green-600 mr-2">✅</span>
                      <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                    </div>
                    {job.compatibilityScore && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Compatibilité</span>
                          <span className="font-semibold">{job.compatibilityScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              job.compatibilityScore >= 80 ? 'bg-green-500' :
                              job.compatibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${job.compatibilityScore}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {job.explanation && (
                      <p className="text-gray-600 text-sm mb-4">{job.explanation}</p>
                    )}

                    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Choisir ce métier →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions reconversion */}
          {reconversionSuggestions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                🔄 Opportunités de Reconversion Professionnelle
              </h2>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm text-center">
                  💡 Ces métiers nécessitent une formation complémentaire mais sont accessibles avec votre profil
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reconversionSuggestions.map((job, index) => (
                  <div
                    key={`reconversion-${index}`}
                    className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-purple-500"
                    onClick={() => selectJob({...job, isReconversion: true})}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-purple-600 mr-2">🎯</span>
                      <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                    </div>
                    <div className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full mb-3 inline-block">
                      Reconversion
                    </div>
                    {job.compatibilityScore && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Potentiel</span>
                          <span className="font-semibold">{job.compatibilityScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full bg-purple-500"
                            style={{ width: `${job.compatibilityScore}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {job.explanation && (
                      <p className="text-gray-600 text-sm mb-4">{job.explanation}</p>
                    )}

                    <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      Explorer cette reconversion →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Étape 3: Validation
  if (currentStep === "validation" && selectedJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              ✅ Validation pour : {selectedJob.title}
            </h1>
            <button
              onClick={() => setCurrentStep("suggestions")}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Changer de métier
            </button>
          </div>

          <DataValidation
            cvText={cvText}
            selectedJob={selectedJob}
            onValidationComplete={handleValidationComplete}
          />
        </div>
      </div>
    );
  }

  // Étape 4: Paiement
  if (currentStep === "payment" && selectedJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-10">
          <CVPaymentGate
            jobTitle={selectedJob.title}
            onPaymentSuccess={() => setCurrentStep("generation")}
            onBack={() => setCurrentStep("validation")}
          />
        </div>
      </div>
    );
  }

  // Étape 5: Génération
  if (currentStep === "generation" && selectedJob && validatedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              📄 Génération de documents
            </h1>
            <button
              onClick={() => setCurrentStep("validation")}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Modifier les données
            </button>
          </div>

          <DocumentGenerator
            cvText={cvText}
            validatedData={validatedData}
            selectedJob={selectedJob}
            selectedJobs={selectedJobs}
            jobOffer={customJobOffer}
          />
        </div>
      </div>
    );
  }

  return null;
}
