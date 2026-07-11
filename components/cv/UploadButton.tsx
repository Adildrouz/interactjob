"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { openaiClient } from "@/services/openai-client";
import { performanceOptimizer } from "@/services/performance-optimizer";
import { trackToolEvent } from "@/lib/trackToolEvent";
import { useFunnelAbandonment } from "@/hooks/useFunnelAbandonment";

const DocumentGenerator = dynamic(() => import("./DocumentGenerator"), { ssr: false });
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

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = '.pdf,.doc,.docx,.txt';

  const startedRef = useRef(false);

  useFunnelAbandonment(
    "cv_builder",
    "form_abandoned",
    () => (currentStep === "generation" ? null : { last_step: currentStep })
  );

  const extractTextFromFile = useCallback(async (file: File) => {
    setExtracting(true);
    setExtractError(null);
    setUploadedFile(file);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/cv/extract-text', { method: 'POST', body: form });
      const data = await res.json() as { success: boolean; text?: string; error?: string };
      if (!data.success || !data.text) throw new Error(data.error ?? 'Extraction échouée');
      setCvText(data.text);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractTextFromFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractTextFromFile(file);
  }, [extractTextFromFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const analyzeProfile = async () => {
    if (cvText.length < 50) {
      alert("Veuillez écrire votre parcours professionnel (au moins 50 caractères)");
      return;
    }

    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("cv_builder", "builder_started");
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
      trackToolEvent("cv_builder", "form_step_completed", { metadata: { step: "suggestions" } });

    } catch (error) {
      console.error("Erreur analyse:", error);

      try {
        console.log('⚠️ Fallback vers système classique...');
        const suggestions = await openaiClient.suggestJobs(cvText);
        setSuggestions(suggestions);

        const reconversionJobs = await openaiClient.suggestReconversionJobs(cvText, 'Maroc');
        setReconversionSuggestions(reconversionJobs);

        setCurrentStep("suggestions");
        trackToolEvent("cv_builder", "form_step_completed", { metadata: { step: "suggestions", fallback: true } });
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
    trackToolEvent("cv_builder", "form_step_completed", { metadata: { step: "validation" } });
  };

  const handleValidationComplete = (data: CVData) => {
    setValidatedData(data);
    setCurrentStep("payment");
    trackToolEvent("cv_builder", "form_step_completed", { metadata: { step: "payment" } });
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
        <div className="w-full max-w-2xl mx-auto">

          {/* Zone drag & drop principale */}
          {!uploadedFile && !showTextFallback && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                  : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Icône */}
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">
                  Déposez votre CV ici
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ou <span className="text-blue-600 font-medium">cliquez pour choisir un fichier</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, Word (.docx) ou texte — max 25 Mo
                </p>
              </div>

              {/* Formats acceptés */}
              <div className="flex items-center gap-2 mt-2">
                {['PDF', 'DOCX', 'DOC', 'TXT'].map((fmt) => (
                  <span key={fmt} className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extraction en cours */}
          {extracting && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-gray-700 font-medium">Lecture du fichier en cours…</p>
              <p className="text-sm text-gray-400">Extraction du texte de votre CV</p>
            </div>
          )}

          {/* Erreur d'extraction */}
          {extractError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
              <p className="text-red-700 font-semibold text-sm">⚠️ {extractError}</p>
              <button
                onClick={() => { setExtractError(null); fileInputRef.current?.click(); }}
                className="mt-2 text-sm text-red-600 underline"
              >
                Réessayer avec un autre fichier
              </button>
            </div>
          )}

          {/* Fichier uploadé + texte extrait */}
          {uploadedFile && cvText && !extracting && (
            <div className="space-y-4">
              {/* Fichier sélectionné */}
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800 truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-green-600">{cvText.length} caractères extraits</p>
                </div>
                <button
                  onClick={() => { setUploadedFile(null); setCvText(''); setExtractError(null); }}
                  className="text-green-500 hover:text-green-700 transition-colors flex-shrink-0"
                  title="Changer de fichier"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Bouton analyser */}
              <button
                onClick={analyzeProfile}
                disabled={suggesting}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg shadow-md shadow-blue-200"
              >
                {suggesting ? "🔍 Analyse en cours…" : "🚀 Analyser mon CV"}
              </button>

              {analysisTime && (
                <div className="text-center">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    ⚡ Dernière analyse : {(analysisTime / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Séparateur + option texte libre */}
          {!extracting && !uploadedFile && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {!showTextFallback ? (
                <button
                  onClick={() => setShowTextFallback(true)}
                  className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  ✏️ Saisir mon parcours manuellement
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    autoFocus
                    placeholder={`Exemple :
Mohamed Alami, 28 ans, Casablanca
Email: m.alami@gmail.com — Tél: 06.12.34.56.78

Expériences :
- Commercial chez ABC Maroc (2021-2024) : vente B2B, prospection
- Stage marketing chez XYZ (2020) : réseaux sociaux

Formation :
- Licence Commerce International, ENCG Casablanca (2021)
- Bac Sciences Économiques (2018)

Compétences : négociation, anglais, Excel, CRM Salesforce`}
                    className="w-full h-52 p-4 border border-gray-300 rounded-xl resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="text-xs text-gray-400 text-right">{cvText.length}/50 caractères minimum</div>
                  {cvText.length > 50 && (
                    <button
                      onClick={analyzeProfile}
                      disabled={suggesting}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg shadow-md shadow-blue-200"
                    >
                      {suggesting ? "🔍 Analyse en cours…" : "🚀 Analyser mon profil"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Garanties */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">🔒 Données supprimées après génération</span>
            <span className="flex items-center gap-1.5">⚡ Résultat en 3 minutes</span>
            <span className="flex items-center gap-1.5">🤖 Propulsé par IA</span>
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
            onPaymentSuccess={() => {
              setCurrentStep("generation");
              trackToolEvent("cv_builder", "form_step_completed", { metadata: { step: "generation" } });
            }}
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
