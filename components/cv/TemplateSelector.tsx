"use client"

import React, { useState } from 'react';

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  suitable: string;
  filename: string;
  color: string;
  icon: string;
  preview?: string;
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: CVTemplate) => void;
  selectedTemplate?: CVTemplate;
  language?: string;
}

export default function TemplateSelector({ onTemplateSelect, selectedTemplate, language = "fr" }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const translations = {
    fr: {
      title: "Choisissez votre modèle CV",
      subtitle: "Sélectionnez le design qui correspond à votre profil professionnel",
      categories: {
        all: "Tous les Modèles (25)",
        Premium: "Premium (4)",
        Sectoriel: "Sectoriels (9)",
        Métier: "Métiers (7)",
        Design: "Design (5)"
      },
      features: "Caractéristiques",
      suitable: "Adapté pour",
      select: "Sélectionner",
      selected: "Sélectionné"
    },
    en: {
      title: "Choose your CV template",
      subtitle: "Select the design that matches your professional profile",
      categories: {
        all: "All Templates (25)",
        Premium: "Premium (4)",
        Sectoriel: "Sectoral (9)",
        Métier: "Profession (7)",
        Design: "Design (5)"
      },
      features: "Features",
      suitable: "Suitable for",
      select: "Select",
      selected: "Selected"
    },
    nl: {
      title: "Kies uw CV sjabloon",
      subtitle: "Selecteer het ontwerp dat past bij uw professionele profiel",
      categories: {
        all: "Alle Sjablonen (25)",
        Premium: "Premium (4)",
        Sectoriel: "Sectoraal (9)",
        Métier: "Beroep (7)",
        Design: "Design (5)"
      },
      features: "Kenmerken",
      suitable: "Geschikt voor",
      select: "Selecteren",
      selected: "Geselecteerd"
    }
  };

  const t = translations[language as keyof typeof translations] || translations.fr;

  const cvTemplates: CVTemplate[] = [
    // Premium
    { id: "moderne", category: "Premium", name: "CV Moderne Professional", description: "Design épuré et contemporain avec animations subtiles", features: ["Layout minimaliste", "Barres de progression", "Couleurs modernes"], suitable: "Direction, Management, Conseil", filename: "modele-moderne.html", color: "indigo", icon: "✨" },
    { id: "creatif", category: "Premium", name: "CV Créatif Design", description: "Template coloré avec animations pour métiers créatifs", features: ["Couleurs vibrantes", "Animations CSS", "Layout créatif"], suitable: "Design, Marketing, Communication", filename: "modele-creatif.html", color: "purple", icon: "🎨" },
    { id: "classique", category: "Premium", name: "CV Classique Corporate", description: "Format traditionnel sobre pour secteurs conservateurs", features: ["Structure chronologique", "Police Times New Roman", "Mise en page sobre"], suitable: "Finance, Droit, Administration", filename: "modele-classique.html", color: "gray", icon: "🏛️" },
    { id: "europass", category: "Premium", name: "CV Europass Officiel", description: "Format Europass conforme aux standards européens", features: ["Format officiel UE", "Grille de compétences", "Standards européens"], suitable: "Mobilité européenne, Institutions, International", filename: "modele-europass.html", color: "blue", icon: "🇪🇺" },
    // Sectoriels
    { id: "tech", category: "Sectoriel", name: "CV Tech & IT", description: "Optimisé pour les métiers de la technologie", features: ["Stack technique", "Projets Github", "Certifications IT"], suitable: "Développement, DevOps, Data Science", filename: "modele-tech.html", color: "green", icon: "💻" },
    { id: "medical", category: "Sectoriel", name: "CV Médical & Santé", description: "Spécialisé pour les professions médicales", features: ["Diplômes médicaux", "Spécialisations", "Expériences cliniques"], suitable: "Médecins, Infirmiers, Pharmaciens", filename: "modele-medical.html", color: "red", icon: "⚕️" },
    { id: "finance", category: "Sectoriel", name: "CV Finance & Banque", description: "Format pour secteur financier", features: ["Certifications financières", "Résultats quantifiés", "Conformité réglementaire"], suitable: "Banque, Assurance, Audit", filename: "modele-finance.html", color: "emerald", icon: "💰" },
    { id: "enseignant", category: "Sectoriel", name: "CV Enseignement", description: "Dédié aux métiers de l'éducation", features: ["Diplômes pédagogiques", "Méthodes d'enseignement", "Publications"], suitable: "Professeurs, Formateurs, Chercheurs", filename: "modele-enseignant.html", color: "amber", icon: "🎓" },
    { id: "juridique", category: "Sectoriel", name: "CV Juridique & Droit", description: "Adapté aux professions juridiques", features: ["Domaines de spécialisation", "Barreaux", "Affaires traitées"], suitable: "Avocats, Juristes, Notaires", filename: "modele-juridique.html", color: "slate", icon: "⚖️" },
    { id: "marketing", category: "Sectoriel", name: "CV Marketing & Com", description: "Pour les métiers du marketing", features: ["Campagnes réalisées", "ROI & métriques", "Créativité"], suitable: "Marketing, Communication, Digital", filename: "modele-marketing.html", color: "pink", icon: "📢" },
    { id: "rh", category: "Sectoriel", name: "CV Ressources Humaines", description: "Spécialisé RH et recrutement", features: ["Gestion talents", "Formation", "Relations sociales"], suitable: "RH, Recrutement, Formation", filename: "modele-rh.html", color: "violet", icon: "👥" },
    { id: "ventes", category: "Sectoriel", name: "CV Ventes & Commercial", description: "Axé performance commerciale", features: ["Objectifs atteints", "Chiffre d'affaires", "Portefeuille clients"], suitable: "Commercial, Business Development", filename: "modele-ventes.html", color: "orange", icon: "🎯" },
    { id: "consulting", category: "Sectoriel", name: "CV Consulting & Stratégie", description: "Pour consultants et stratèges", features: ["Missions réalisées", "Méthodologies", "Secteurs d'expertise"], suitable: "Conseil, Stratégie, Audit", filename: "modele-consulting.html", color: "cyan", icon: "🧩" },
    // Métiers
    { id: "cadre", category: "Métier", name: "CV Cadre & Direction", description: "Pour postes de direction", features: ["Leadership", "Transformations", "P&L"], suitable: "Direction, Management senior", filename: "modele-cadre.html", color: "stone", icon: "👔" },
    { id: "chef-projet", category: "Métier", name: "CV Chef de Projet", description: "Gestion de projets complexes", features: ["Méthodologies agiles", "Budget & planning", "Équipes"], suitable: "Project Management, PMO", filename: "modele-chef-projet.html", color: "teal", icon: "📊" },
    { id: "commercial", category: "Métier", name: "CV Commercial Terrain", description: "Vente directe et terrain", features: ["Prospection", "Négociation", "Fidélisation"], suitable: "Commercial, Key Account", filename: "modele-commercial.html", color: "lime", icon: "🤝" },
    { id: "communication", category: "Métier", name: "CV Communication", description: "Communication corporate", features: ["Relations presse", "Événementiel", "Digital"], suitable: "Communication, Relations publiques", filename: "modele-communication.html", color: "fuchsia", icon: "📱" },
    { id: "startup", category: "Métier", name: "CV Startup & Innovation", description: "Écosystème startup et innovation", features: ["Growth hacking", "Lean startup", "Innovation"], suitable: "Startup, Scale-up, Innovation", filename: "modele-startup.html", color: "emerald", icon: "🚀" },
    { id: "academique", category: "Métier", name: "CV Académique & Recherche", description: "Recherche et enseignement supérieur", features: ["Publications", "Conférences", "Recherche"], suitable: "Chercheurs, Universitaires", filename: "modele-academique.html", color: "indigo", icon: "🔬" },
    { id: "international", category: "Métier", name: "CV International", description: "Carrières internationales", features: ["Mobilité", "Langues", "Cultures"], suitable: "Expatriation, Multinationales", filename: "modele-international.html", color: "blue", icon: "🌍" },
    // Design
    { id: "professionnel", category: "Design", name: "CV Professionnel", description: "Polyvalent et professionnel", features: ["Couleurs sobres", "Structure claire", "ATS friendly"], suitable: "Tous secteurs professionnels", filename: "modele-professionnel.html", color: "blue", icon: "📄" },
    { id: "elegant", category: "Design", name: "CV Élégant", description: "Raffinement et sophistication", features: ["Dégradés subtils", "Polices élégantes", "Mise en page soignée"], suitable: "Luxury, Premium, Prestige", filename: "modele-elegant.html", color: "purple", icon: "💎" },
    { id: "premium", category: "Design", name: "CV Premium", description: "Haut de gamme et distinctif", features: ["Design premium", "Animations CSS", "Détails raffinés"], suitable: "Postes senior, Direction", filename: "modele-premium.html", color: "amber", icon: "⭐" },
    { id: "moderne-couleur", category: "Design", name: "CV Moderne Couleur", description: "Couleurs vives et modernes", features: ["Palette moderne", "Contrastes", "Dynamisme"], suitable: "Créatif, Marketing, Digital", filename: "modele-moderne-couleur.html", color: "cyan", icon: "🌈" },
    { id: "minimaliste", category: "Design", name: "CV Minimaliste", description: "Simplicité et efficacité", features: ["Design épuré", "Focus contenu", "Lisibilité"], suitable: "Tous secteurs, ATS friendly", filename: "modele-minimaliste.html", color: "gray", icon: "◽" }
  ];

  const categories = ["all", "Premium", "Sectoriel", "Métier", "Design"] as const;

  const filteredTemplates = selectedCategory === 'all'
    ? cvTemplates
    : cvTemplates.filter(template => template.category === selectedCategory);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      indigo: "bg-indigo-500 border-indigo-200 text-indigo-700",
      purple: "bg-purple-500 border-purple-200 text-purple-700",
      gray: "bg-gray-500 border-gray-200 text-gray-700",
      blue: "bg-blue-500 border-blue-200 text-blue-700",
      green: "bg-green-500 border-green-200 text-green-700",
      red: "bg-red-500 border-red-200 text-red-700",
      emerald: "bg-emerald-500 border-emerald-200 text-emerald-700",
      amber: "bg-amber-500 border-amber-200 text-amber-700",
      slate: "bg-slate-500 border-slate-200 text-slate-700",
      pink: "bg-pink-500 border-pink-200 text-pink-700",
      violet: "bg-violet-500 border-violet-200 text-violet-700",
      orange: "bg-orange-500 border-orange-200 text-orange-700",
      cyan: "bg-cyan-500 border-cyan-200 text-cyan-700",
      stone: "bg-stone-500 border-stone-200 text-stone-700",
      teal: "bg-teal-500 border-teal-200 text-teal-700",
      lime: "bg-lime-500 border-lime-200 text-lime-700",
      fuchsia: "bg-fuchsia-500 border-fuchsia-200 text-fuchsia-700"
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {t.title}
        </h2>
        <p className="text-gray-600">
          {t.subtitle}
        </p>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedCategory === category
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t.categories[category]}
          </button>
        ))}
      </div>

      {/* Grid des modèles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all cursor-pointer hover:shadow-lg ${
              selectedTemplate?.id === template.id
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            {/* Preview */}
            <div className={`h-32 flex items-center justify-center text-white text-4xl ${getColorClasses(template.color).split(' ')[0]}`}>
              {template.icon}
            </div>

            {/* Contenu */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {template.description}
              </p>

              {/* Features */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">
                  {t.features}:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {template.features.slice(0, 2).map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suitable for */}
              <div className="mb-4">
                <span className={`text-xs px-2 py-1 rounded ${getColorClasses(template.color).split(' ')[1]} ${getColorClasses(template.color).split(' ')[2]}`}>
                  {template.suitable.split(',')[0]}
                </span>
              </div>

              {/* Bouton */}
              <button
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {selectedTemplate?.id === template.id ? t.selected : t.select}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{selectedTemplate.icon}</span>
            <div>
              <h4 className="font-semibold text-blue-900">
                Modèle sélectionné: {selectedTemplate.name}
              </h4>
              <p className="text-sm text-blue-700">
                {selectedTemplate.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
