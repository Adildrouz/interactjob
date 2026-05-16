'use client';

import { EuropassCV } from '../types/europass.types';

interface EuropassTemplateProps {
  data: EuropassCV;
}

export function EuropassTemplate({ data }: EuropassTemplateProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center border-b-4 border-blue-900 mb-6 pb-4">
        <div className="bg-blue-900 text-white px-4 py-2 rounded text-sm font-bold inline-block mb-2">
          🇪🇺 EUROPASS
        </div>
        <h1 className="text-2xl font-bold text-blue-900">Curriculum vitae</h1>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-bold text-blue-900 border-b border-gray-300 pb-2 mb-4">
          INFORMATIONS PERSONNELLES
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Nom:</strong> {data.personalInfo.lastName} {data.personalInfo.firstName}</p>
            <p><strong>Email:</strong> {data.personalInfo.email}</p>
            <p><strong>Téléphone:</strong> {data.personalInfo.telephone}</p>
          </div>
        </div>
      </section>

      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-900 border-b border-gray-300 pb-2 mb-4">
            EXPÉRIENCE PROFESSIONNELLE
          </h2>
          {data.experience.map((exp, index) => (
            <div key={index} className="mb-4 border-l-4 border-blue-200 pl-4">
              <h3 className="font-semibold">{exp.position}</h3>
              <p className="text-sm text-gray-600">{exp.employer} - {exp.location}</p>
              <p className="text-sm">{exp.startDate} - {exp.endDate || 'À ce jour'}</p>
              {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {data.languageSkills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-900 border-b border-gray-300 pb-2 mb-4">
            COMPÉTENCES LINGUISTIQUES
          </h2>
          {data.languageSkills.map((lang, index) => (
            <div key={index} className="mb-3">
              <h3 className="font-semibold">{lang.language}</h3>
              <div className="text-sm grid grid-cols-5 gap-2">
                <span>Écoute: {lang.listening}</span>
                <span>Lecture: {lang.reading}</span>
                <span>Interaction: {lang.spokenInteraction}</span>
                <span>Expression: {lang.spokenProduction}</span>
                <span>Écriture: {lang.writing}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <footer className="border-t border-gray-300 pt-4 mt-6 text-center text-xs text-gray-500">
        <p>© Union européenne | Généré par CVBoost - {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}
