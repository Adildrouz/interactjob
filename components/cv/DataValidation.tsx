"use client"

import { useState, useEffect } from "react";
import { openaiClient } from "@/services/openai-client";

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrentJob: boolean;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface Language {
  language: string;
  level: string;
}

interface CVData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  languages: Language[];
}

interface DataValidationProps {
  cvText: string;
  selectedJob: any;
  onValidationComplete: (validatedData: CVData) => void;
}

export default function DataValidation({ cvText, selectedJob, onValidationComplete }: DataValidationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    parseCVData();
  }, [cvText]);

  const parseCVData = async () => {
    try {
      // Utiliser le service client OpenAI pour parser le CV
      const parsedData = await openaiClient.parseCV(cvText);
      setCvData(parsedData);
    } catch (error) {
      console.error("Erreur:", error);
      setErrors(["Erreur lors de l'analyse des données du CV"]);

      // Fallback avec données vides pour permettre la saisie manuelle
      setCvData({
        personalInfo: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          location: ""
        },
        experiences: [{
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          description: "",
          isCurrentJob: false
        }],
        education: [],
        skills: [],
        languages: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      personalInfo: {
        ...cvData.personalInfo,
        [field]: value
      }
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    if (!cvData) return;
    const updatedExperiences = [...cvData.experiences];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value
    };
    setCvData({
      ...cvData,
      experiences: updatedExperiences
    });
  };

  const addExperience = () => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      experiences: [
        ...cvData.experiences,
        {
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          description: "",
          isCurrentJob: false
        }
      ]
    });
  };

  const removeExperience = (index: number) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      experiences: cvData.experiences.filter((_, i) => i !== index)
    });
  };

  const updateSkills = (skills: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      skills: skills.split(",").map(s => s.trim()).filter(s => s.length > 0)
    });
  };

  const validateAndContinue = () => {
    if (!cvData) return;

    const newErrors: string[] = [];

    if (!cvData.personalInfo.firstName) newErrors.push("Prénom requis");
    if (!cvData.personalInfo.lastName) newErrors.push("Nom requis");
    if (!cvData.personalInfo.email) newErrors.push("Email requis");

    if (cvData.experiences.length === 0) {
      newErrors.push("Au moins une expérience requise");
    } else {
      cvData.experiences.forEach((exp, index) => {
        if (!exp.company) newErrors.push(`Entreprise requise pour l'expérience ${index + 1}`);
        if (!exp.position) newErrors.push(`Poste requis pour l'expérience ${index + 1}`);
      });
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      onValidationComplete(cvData);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyse de votre CV</h3>
          <p className="text-gray-600">Extraction et structuration des données en cours...</p>
        </div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-2">Erreur d'analyse</h3>
          <p>Impossible d'analyser les données de votre CV</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Vérification des données extraites
        </h2>
        <p className="text-gray-600">
          Vérifiez et corrigez les informations extraites de votre CV
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-800 mb-2">Corrections nécessaires:</h4>
          <ul className="list-disc list-inside text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Informations personnelles */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">👤</span>
          Informations personnelles
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              value={cvData.personalInfo.firstName}
              onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={cvData.personalInfo.lastName}
              onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={cvData.personalInfo.email}
              onChange={(e) => updatePersonalInfo("email", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="text"
              value={cvData.personalInfo.phone}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Expériences */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="mr-2">💼</span>
            Expériences professionnelles
          </h3>
          <button
            onClick={addExperience}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            + Ajouter
          </button>
        </div>

        {cvData.experiences.map((exp, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium text-gray-800">Expérience {index + 1}</h4>
              {cvData.experiences.length > 1 && (
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, "company", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateExperience(index, "position", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="text"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                  placeholder="Ex: 01/2020"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="text"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                  placeholder="Ex: 12/2023 ou Actuel"
                  disabled={exp.isCurrentJob}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exp.isCurrentJob}
                  onChange={(e) => updateExperience(index, "isCurrentJob", e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Poste actuel</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Compétences */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🛠️</span>
          Compétences
        </h3>
        <textarea
          value={cvData.skills.join(", ")}
          onChange={(e) => updateSkills(e.target.value)}
          placeholder="Séparez les compétences par des virgules"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Compétences détectées: {cvData.skills.length}
        </p>
      </div>

      {/* Bouton de validation */}
      <div className="flex justify-end">
        <button
          onClick={validateAndContinue}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continuer vers la génération
        </button>
      </div>
    </div>
  );
}
