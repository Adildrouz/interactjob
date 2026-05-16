"use client"

import React, { useState } from 'react';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
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

interface ManualData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  languages: Language[];
}

interface ManualDataEntryProps {
  onDataComplete: (data: ManualData) => void;
  onBack: () => void;
}

export default function ManualDataEntry({ onDataComplete, onBack }: ManualDataEntryProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ManualData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    experiences: [
      { company: '', position: '', startDate: '', endDate: '', description: '' },
      { company: '', position: '', startDate: '', endDate: '', description: '' }
    ],
    education: [{ institution: '', degree: '', field: '', year: '' }],
    skills: ['', '', ''],
    languages: [{ language: '', level: 'Débutant' }]
  });

  const steps = [
    'Informations personnelles',
    'Expériences professionnelles',
    'Formation',
    'Compétences',
    'Langues'
  ];

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const addExperience = () => {
    setFormData(prev => ({ ...prev, experiences: [...prev.experiences, { company: '', position: '', startDate: '', endDate: '', description: '' }] }));
  };

  const removeExperience = (index: number) => {
    if (formData.experiences.length > 2) {
      setFormData(prev => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== index) }));
    }
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setFormData(prev => ({ ...prev, experiences: prev.experiences.map((exp, i) => i === index ? { ...exp, [field]: value } : exp) }));
  };

  const addEducation = () => {
    setFormData(prev => ({ ...prev, education: [...prev.education, { institution: '', degree: '', field: '', year: '' }] }));
  };

  const removeEducation = (index: number) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
    }
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setFormData(prev => ({ ...prev, education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu) }));
  };

  const addSkill = () => {
    setFormData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkill = (index: number) => {
    if (formData.skills.length > 3) {
      setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
    }
  };

  const updateSkill = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.map((skill, i) => i === index ? value : skill) }));
  };

  const addLanguage = () => {
    setFormData(prev => ({ ...prev, languages: [...prev.languages, { language: '', level: 'Débutant' }] }));
  };

  const removeLanguage = (index: number) => {
    if (formData.languages.length > 1) {
      setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
    }
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.map((lang, i) => i === index ? { ...lang, [field]: value } : lang) }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const cleanedData = {
        ...formData,
        skills: formData.skills.filter(skill => skill.trim() !== ''),
        experiences: formData.experiences.filter(exp => exp.company.trim() !== ''),
        education: formData.education.filter(edu => edu.institution.trim() !== ''),
        languages: formData.languages.filter(lang => lang.language.trim() !== '')
      };
      onDataComplete(cleanedData);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.personalInfo.name.trim() !== '' && formData.personalInfo.email.trim() !== '';
      case 1:
        const validExperiences = formData.experiences.filter(exp => exp.company.trim() !== '' && exp.position.trim() !== '');
        return validExperiences.length >= 2;
      case 2:
        return formData.education.some(edu => edu.institution.trim() !== '' && edu.degree.trim() !== '');
      case 3:
        const validSkills = formData.skills.filter(skill => skill.trim() !== '');
        return validSkills.length >= 3;
      case 4:
        return formData.languages.some(lang => lang.language.trim() !== '');
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input type="text" value={formData.personalInfo.name} onChange={(e) => handlePersonalInfoChange('name', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Votre nom complet" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.personalInfo.email} onChange={(e) => handlePersonalInfoChange('email', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="votre@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" value={formData.personalInfo.phone} onChange={(e) => handlePersonalInfoChange('phone', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+33 1 23 45 67 89" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={formData.personalInfo.address} onChange={(e) => handlePersonalInfoChange('address', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Votre adresse" />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Expériences professionnelles</h3>
              <div className="text-right">
                <button type="button" onClick={addExperience} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">+ Ajouter</button>
                <p className="text-xs text-gray-500 mt-1">Minimum 2 expériences requises</p>
              </div>
            </div>
            {formData.experiences.map((experience, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Expérience {index + 1}</h4>
                  {formData.experiences.length > 2 && (
                    <button type="button" onClick={() => removeExperience(index)} className="text-red-600 hover:text-red-700">Supprimer</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
                    <input type="text" value={experience.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nom de l'entreprise" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                    <input type="text" value={experience.position} onChange={(e) => updateExperience(index, 'position', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Intitulé du poste" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input type="text" value={experience.startDate} onChange={(e) => updateExperience(index, 'startDate', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="MM/YYYY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input type="text" value={experience.endDate} onChange={(e) => updateExperience(index, 'endDate', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="MM/YYYY ou Présent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description des missions</label>
                  <textarea value={experience.description} onChange={(e) => updateExperience(index, 'description', e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Décrivez vos principales missions et réalisations" />
                </div>
              </div>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Formation</h3>
              <button type="button" onClick={addEducation} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">+ Ajouter</button>
            </div>
            {formData.education.map((education, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Formation {index + 1}</h4>
                  {formData.education.length > 1 && (
                    <button type="button" onClick={() => removeEducation(index)} className="text-red-600 hover:text-red-700">Supprimer</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Établissement *</label>
                    <input type="text" value={education.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nom de l'établissement" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diplôme *</label>
                    <input type="text" value={education.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nom du diplôme" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domaine d'étude</label>
                    <input type="text" value={education.field} onChange={(e) => updateEducation(index, 'field', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Domaine d'étude" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année d'obtention</label>
                    <input type="text" value={education.year} onChange={(e) => updateEducation(index, 'year', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="YYYY" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Compétences</h3>
              <div className="text-right">
                <button type="button" onClick={addSkill} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">+ Ajouter</button>
                <p className="text-xs text-gray-500 mt-1">Minimum 3 compétences requises</p>
              </div>
            </div>
            <div className="space-y-3">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input type="text" value={skill} onChange={(e) => updateSkill(index, e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Saisissez une compétence" />
                  {formData.skills.length > 3 && (
                    <button type="button" onClick={() => removeSkill(index)} className="text-red-600 hover:text-red-700 p-2">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Langues</h3>
              <button type="button" onClick={addLanguage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">+ Ajouter</button>
            </div>
            <div className="space-y-4">
              {formData.languages.map((language, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input type="text" value={language.language} onChange={(e) => updateLanguage(index, 'language', e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Langue" />
                  <select value={language.level} onChange={(e) => updateLanguage(index, 'level', e.target.value)} className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Courant">Courant</option>
                    <option value="Natif">Natif</option>
                  </select>
                  {formData.languages.length > 1 && (
                    <button type="button" onClick={() => removeLanguage(index)} className="text-red-600 hover:text-red-700 p-2">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div key={index} className={`text-xs font-medium ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button onClick={prevStep} className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          {currentStep === 0 ? 'Retour' : 'Précédent'}
        </button>

        <button
          onClick={nextStep}
          disabled={!isStepValid()}
          className={`px-6 py-3 rounded-lg transition-colors ${isStepValid() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
        </button>
      </div>
    </div>
  );
}
