import { chatCompletions } from './ai-chat';

// Service client IA — appels via proxy serveur (api.php), sans clés dans le frontend
export class OpenAIClientService {
  constructor() {}

  private convertToEuropeanLevel(level: string): string {
    const levelMap: { [key: string]: string } = {
      'Débutant': 'A1',
      'Élémentaire': 'A2',
      'Intermédiaire': 'B1',
      'Avancé': 'B2',
      'Expert': 'C1',
      'Natif': 'C2',
      'Bilingue': 'C2',
      'Courant': 'C1',
      'Professionnel': 'C1',
      'Scolaire': 'B1',
      'Notions': 'A1',
      'Basique': 'A1',
      'Bon': 'B2',
      'Très bon': 'C1',
      'Excellent': 'C2'
    };
    return levelMap[level] || 'B1';
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async suggestJobs(cvText: string, isCustomOffer: boolean = false, jobOffer: string = '', isReconversion: boolean = false, retryCount = 0): Promise<any[]> {
    try {
      // Ajouter un timestamp pour éviter le cache des réponses identiques
      const timestamp = Date.now();
      const cacheBreaker = `[Analyse-${timestamp}]`;
      
      const systemMessage = isCustomOffer 
        ? `Tu es un EXPERT SENIOR en analyse de CV et matching d'offres d'emploi avec 15+ années d'expérience en recrutement. Tu analyses la compatibilité entre un CV et une offre d'emploi spécifique avec une PRÉCISION CHIRURGICALE.

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Analyse FACTUELLE basée uniquement sur les données fournies
- Vocabulaire professionnel et terminologie RH précise
- Français impeccable (orthographe Larousse/Robert)
- DOUBLE VÉRIFICATION avant chaque réponse`
        : isReconversion
        ? `Tu es un EXPERT SENIOR en reconversion professionnelle spécialisé dans le marché marocain de l'emploi. 15+ années d'expérience en orientation et formation professionnelle.

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Données factuelles sur les métiers en tension en Maroc 2024-2025
- Formations et organismes marocains réels et vérifiés
- Français impeccable (orthographe Larousse/Robert)
- DOUBLE VÉRIFICATION avant chaque réponse`
        : `Tu es un CONSEILLER D'ORIENTATION PROFESSIONNEL SENIOR certifié avec 15+ années d'expérience. Tu analyses les CV avec une PRÉCISION CHIRURGICALE et proposes des métiers pertinents.

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Analyse FACTUELLE basée uniquement sur les données du CV
- Terminologie professionnelle précise et actuelle
- Français impeccable (orthographe Larousse/Robert)
- DOUBLE VÉRIFICATION avant chaque réponse`;

      const userMessage = isCustomOffer
        ? `${cacheBreaker} MISSION CRITIQUE : Analyse ce CV par rapport à cette offre d'emploi et fournis un score de compatibilité détaillé avec ZÉRO ERREUR.

CV À ANALYSER:
${cvText}

OFFRE D'EMPLOI CIBLÉE:
${jobOffer}

🎯 INSTRUCTIONS ULTRA-PRÉCISES :

1. ANALYSE le CV avec une précision de consultant senior
2. IDENTIFIE les correspondances exactes avec l'offre
3. CALCULE un score de compatibilité factuel (0-100)
4. FORMULE des phrases parfaites grammaticalement
5. VÉRIFIE deux fois l'orthographe et la syntaxe

FORMAT DE RÉPONSE OBLIGATOIRE (JSON EXACT) :
{
  "suggestions": [
    {
      "title": "Titre exact du poste (copié de l'offre)",
      "sector": "Secteur précis de l'offre",
      "explanation": "Analyse détaillée de compatibilité en 3-4 phrases parfaites, orthographe irréprochable, grammaire impeccable",
      "compatibilityScore": 85,
      "strengths": ["Point fort 1 formulé parfaitement", "Point fort 2 sans faute", "Point fort 3 grammaire parfaite"],
      "improvementAreas": ["Zone d'amélioration 1 formulée clairement", "Zone d'amélioration 2 sans erreur"]
    }
  ]
}`
        : `${cacheBreaker} MISSION CRITIQUE : Analyse ce CV et propose 10 métiers/postes très pertinents avec ZÉRO ERREUR linguistique.

CV À ANALYSER:
${cvText}

🎯 INSTRUCTIONS ULTRA-PRÉCISES :

1. ANALYSE le profil avec expertise de consultant senior
2. IDENTIFIE 10 métiers parfaitement adaptés au profil
3. CALCULE des scores de compatibilité factuels (basés sur expérience + compétences + formation)
4. FORMULE chaque explication en français impeccable
5. VÉRIFIE deux fois l'orthographe et la grammaire

CRITÈRES D'ANALYSE PROFESSIONNELLE :
- Cohérence entre formation et expériences
- Progression de carrière logique  
- Adéquation compétences techniques/métier
- Niveau de responsabilité approprié
- Secteurs d'activité pertinents

FORMAT DE RÉPONSE OBLIGATOIRE (JSON EXACT) :
{
  "suggestions": [
    {
      "title": "Nom précis du métier/poste",
      "sector": "Secteur d'activité spécifique", 
      "explanation": "Explication en 2-3 phrases parfaites : pourquoi ce métier correspond au profil (orthographe irréprochable)",
      "compatibilityScore": 85,
      "strengths": ["Point fort 1 grammaire parfaite", "Point fort 2 orthographe correcte", "Point fort 3 syntaxe impeccable"],
      "improvementAreas": ["Zone d'amélioration 1 formulée clairement", "Zone d'amélioration 2 sans faute"]
    }
  ]
}`;

      const response = await chatCompletions('openai', {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.3,
          max_tokens: 3000
      });

      if (!response.ok) {
        // Pour les erreurs 401/429, inclure le status pour le catch
        const error = new Error(`OpenAI API error: ${response.statusText}`) as any;
        error.status = response.status;
        console.log(`🚨 OpenAI Error detected - Status: ${response.status}, Text: ${response.statusText}`);
        throw error;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Pas de réponse de OpenAI');
      }

      // Nettoyer le JSON de potentiels backticks markdown
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedContent);

      return result.suggestions || [];
    } catch (error: any) {
      console.error('Erreur OpenAI:', error);
      console.log(`🔍 Debug - Error status: ${error.status}, Error message: ${error.message}`);
      
      // Si erreur 429 (quota épuisé) ou 401 (unauthorized) OpenAI, basculer vers DeepSeek
      if (error.status === 429 || error.status === 401) {
        console.log(`🔄 OpenAI ${error.status === 401 ? 'non autorisé' : 'quota épuisé'}, basculement vers DeepSeek...`);
        return this.suggestJobsWithDeepSeek(cvText, isCustomOffer, jobOffer);
      }
      
      console.log(`❌ Pas de fallback pour status: ${error.status}`);
      throw error; // Relancer l'erreur pour les autres cas
    }
  }

  // Fonction spécialisée pour les suggestions de reconversion avec formations
  async suggestReconversionJobs(cvText: string, userLocation: string = 'Maroc'): Promise<any[]> {
    try {
      const timestamp = Date.now();
      const cacheBreaker = `[Reconversion-${timestamp}]`;
      
      const systemMessage = `Tu es un EXPERT SENIOR en reconversion professionnelle avec 15+ années d'expérience, spécialisé dans le marché de l'emploi marocain. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

COMPÉTENCES EXPERTES:
- Analyse psycho-professionnelle approfondie
- Connaissance exhaustive des métiers en tension Maroc 2024-2025
- Expertise des organismes de formation marocains (ANAPEC, OFPPT, AREF, ISTA, IFMIA)
- Conseil en transitions de carrière
- Financement des formations (CPF, aides régionales)

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Données factuelles vérifiées et actualisées
- Français impeccable en toute circonstance
- Vérification systématique avant réponse`;

      // Données métiers en tension spécifiques au Maroc - VERSION MISE À JOUR 2024-2025
      const belgianJobMarketData = `
📊 MÉTIERS EN TENSION MAROC 2024-2025 (Sources : ANAPEC, OFPPT, HCP) :

🏨 TOURISME & HÔTELLERIE (Secteur prioritaire - Vision 2030) :
- Guide touristique spécialisé : 6.000-12.000 DH/mois, Formation ISITT 2 ans
- Manager hôtelier : 8.000-18.000 DH/mois, BTS Hôtellerie-Restauration
- Chef cuisinier (cuisine marocaine/internationale) : 7.000-15.000 DH/mois, OFPPT restauration
- Animateur touristique : 5.000-9.000 DH/mois, Formation ISITT 1 an
- Revenue Manager : 10.000-20.000 DH/mois, Formation management hôtelier

🏗️ BTP & INFRASTRUCTURES (Grand chantier Coupe du Monde 2030) :
- Ingénieur génie civil : 12.000-25.000 DH/mois, École d'ingénieurs 5 ans
- Chef de chantier BTP : 8.000-16.000 DH/mois, BTS construction + expérience
- Électricien industriel : 5.000-10.000 DH/mois, Formation OFPPT 18-24 mois
- Technicien topographe : 6.000-12.000 DH/mois, Formation OFPPT topographie
- Conducteur d'engins : 5.500-9.000 DH/mois, Formation OFPPT + permis

💻 IT & OFFSHORING (Croissance 15% annuelle) :
- Développeur Full-Stack : 8.000-20.000 DH/mois, Bootcamp 6-12 mois
- Ingénieur DevOps/Cloud : 12.000-25.000 DH/mois, Certifications AWS/Azure
- Data Scientist / IA : 15.000-30.000 DH/mois, Formation Data Science 12-18 mois
- Téléconseiller bilingue (FR/EN/ES) : 4.500-7.000 DH/mois, Formation call center
- Développeur mobile (iOS/Android) : 10.000-22.000 DH/mois, Formation mobile dev

🌾 AGRICULTURE & AGROALIMENTAIRE (Plan Maroc Vert) :
- Technicien agricole : 4.500-8.000 DH/mois, Formation OFPPT agriculture
- Ingénieur agronome : 10.000-18.000 DH/mois, IAV Hassan II / ENA
- Technicien qualité agroalimentaire : 6.000-11.000 DH/mois, BTS agroalimentaire

🏭 INDUSTRIE TEXTILE & AUTOMOBILE :
- Technicien qualité automobile : 7.000-13.000 DH/mois, Formation IFMIA
- Opérateur CNC / Usinage : 4.500-8.000 DH/mois, Formation OFPPT 12 mois
- Styliste-modéliste : 5.000-10.000 DH/mois, ESITH Casablanca

🎓 ORGANISMES DE FORMATION MAROC (Vérifiés 2024) :
- ANAPEC : Accompagnement insertion, bilan compétences, formations subventionnées
- OFPPT : 350+ établissements, formations courtes et longues (BTS, Technicien)
- ISTA : Institut Spécialisé de Technologie Appliquée (sous OFPPT)
- IFMIA : Formation métiers automobile (Renault, PSA, Stellantis)
- ISITT : Institut Supérieur International du Tourisme de Tanger
- IAV Hassan II : Formation supérieure agronomique
- ESITH : École Supérieure des Industries du Textile et de l'Habillement
`;

      const userMessage = `${cacheBreaker} MISSION CRITIQUE : Analyse ce CV et propose 10 métiers de RECONVERSION professionnelle accessibles au MAROC avec formations marocaines spécifiques. ZÉRO ERREUR LINGUISTIQUE TOLÉRÉE.

LOCALISATION UTILISATEUR : ${userLocation}

CV À ANALYSER :
${cvText}

${belgianJobMarketData}

🎯 INSTRUCTIONS ULTRA-PRÉCISES :

1. ANALYSE le profil actuel avec expertise psycho-professionnelle
2. IDENTIFIE les compétences transférables factuelles
3. PROPOSE 10 reconversions réalistes et documentées
4. FOURNIT formations marocains réelles et vérifiées
5. CALCULE scores de transition basés sur données objectives
6. VÉRIFIE orthographe, grammaire et syntaxe deux fois

CRITÈRES DE SÉLECTION PROFESSIONNELS :
- Métiers en tension avérée (données ANAPEC/OFPPT/AREF)
- Compétences transférables identifiables
- Formations accessibles et financées
- Débouchés réels sur le marché marocain
- Cohérence avec profil et motivations

POUR CHAQUE MÉTIER DE RECONVERSION :
- Titre exact du poste (français + arabe si applicable)
- Secteur d'activité précis
- Explication factuelle de la pertinence (2-3 phrases parfaites)
- Score de facilité de transition objectif (basé sur compétences transférables)
- Formations marocains spécifiques avec organismes réels
- Durée réaliste en mois
- Salaire approximatif vérifié (Maroc 2024, en DH/mois)
- Régions de forte demande documentées

FORMAT DE RÉPONSE OBLIGATOIRE (JSON EXACT) :
{
  "suggestions": [
    {
      "title": "Nom précis du métier de reconversion",
      "titleAR": "المسمى الوظيفي بالعربية (si pertinent pour Maroc)",
      "sector": "Secteur d'activité spécifique", 
      "explanation": "Explication factuelle en 2-3 phrases parfaites : pourquoi cette reconversion est pertinente pour ce profil (orthographe irréprochable, grammaire impeccable)",
      "compatibilityScore": 75,
      "requiredTraining": [
        "Formation spécifique 1 (Organisme marocain réel - durée précise)",
        "Certification 2 (ANAPEC/OFPPT/AREF/ISTA - durée)",
        "Formation complémentaire 3 (organisme vérifié - durée)"
      ],
      "estimatedDuration": 12,
      "salaryRange": "2.800-3.800€ brut",
      "demandRegions": ["Grand Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Souss-Massa", "Fès-Meknès", "Tanger-Tétouan-Al Hoceïma"],
      "isReconversion": true
    }
  ]
}`;

      const response = await chatCompletions('openai', {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.3,
          max_tokens: 3000
      });

      if (!response.ok) {
        const error = new Error(`OpenAI API error: ${response.statusText}`) as any;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Pas de réponse de OpenAI');
      }

      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedContent);

      return result.suggestions || [];
    } catch (error: any) {
      console.error('Erreur OpenAI reconversion:', error);
      
      // Si erreur 429 (quota épuisé) ou 401 (unauthorized) OpenAI, basculer vers DeepSeek
      if (error.status === 429 || error.status === 401) {
        console.log(`🔄 OpenAI ${error.status === 401 ? 'non autorisé' : 'quota épuisé'}, basculement vers DeepSeek...`);
        return this.suggestReconversionJobsWithDeepSeek(cvText, userLocation);
      }
      
      throw error;
    }
  }

  // Version DeepSeek pour les reconversions
  async suggestReconversionJobsWithDeepSeek(cvText: string, userLocation: string = 'Maroc'): Promise<any[]> {
    try {
      console.log('🚀 Utilisation de DeepSeek API pour reconversions...');
      
      const timestamp = Date.now();
      const cacheBreaker = `[Reconversion-DeepSeek-${timestamp}]`;
      
      const systemMessage = `Tu es un EXPERT SENIOR en reconversion professionnelle avec 15+ années d'expérience, spécialisé dans le marché de l'emploi marocain. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

COMPÉTENCES EXPERTES:
- Analyse psycho-professionnelle approfondie
- Connaissance exhaustive des métiers en tension Maroc 2024-2025
- Expertise des organismes de formation marocains (ANAPEC, OFPPT, AREF, ISTA, IFMIA)
- Conseil en transitions de carrière
- Financement des formations (CPF, aides régionales)

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Données factuelles vérifiées et actualisées
- Français impeccable en toute circonstance
- Vérification systématique avant réponse`;

      // Données métiers en tension spécifiques au Maroc (DeepSeek fallback)
      const belgianJobMarketData = `
📊 MÉTIERS EN TENSION MAROC 2024-2025 (Sources : ANAPEC, OFPPT, HCP) :

🏨 TOURISME & HÔTELLERIE (Vision 2030 — objectif 26M touristes) :
- Guide touristique spécialisé : 6.000-12.000 DH/mois, Formation ISITT 2 ans
- Manager hôtelier : 8.000-18.000 DH/mois, BTS Hôtellerie-Restauration OFPPT
- Chef cuisinier : 7.000-15.000 DH/mois, Formation restauration OFPPT

🏗️ BTP & INFRASTRUCTURES (Coupe du Monde 2030 + Grand Stade) :
- Ingénieur génie civil : 12.000-25.000 DH/mois, École d'ingénieurs 5 ans
- Chef de chantier BTP : 8.000-16.000 DH/mois, BTS construction
- Électricien industriel : 5.000-10.000 DH/mois, Formation OFPPT 18-24 mois

💻 IT & OFFSHORING (Croissance 15% annuelle) :
- Développeur Full-Stack : 8.000-20.000 DH/mois, Bootcamp 6-12 mois
- Ingénieur DevOps/Cloud : 12.000-25.000 DH/mois, Certifications AWS/Azure
- Data Scientist / IA : 15.000-30.000 DH/mois, Formation Data Science

🏭 INDUSTRIE AUTOMOBILE & TEXTILE :
- Technicien qualité automobile : 7.000-13.000 DH/mois, Formation IFMIA
- Opérateur CNC / Usinage : 4.500-8.000 DH/mois, Formation OFPPT 12 mois

🎓 ORGANISMES DE FORMATION MAROC (Vérifiés 2024) :
- ANAPEC : Accompagnement insertion, bilan compétences, formations subventionnées
- OFPPT : 350+ établissements, formations courtes et longues (BTS, Technicien)
- ISTA : Institut Spécialisé de Technologie Appliquée
- IFMIA : Formation métiers automobile
- ISITT : Institut Supérieur International du Tourisme de Tanger
`;

      const userMessage = `${cacheBreaker} MISSION CRITIQUE : Analyse ce CV et propose 10 métiers de RECONVERSION professionnelle accessibles au MAROC avec formations marocaines spécifiques. ZÉRO ERREUR LINGUISTIQUE TOLÉRÉE.

LOCALISATION UTILISATEUR : ${userLocation}

CV À ANALYSER :
${cvText}

${belgianJobMarketData}

🎯 INSTRUCTIONS ULTRA-PRÉCISES :

1. ANALYSE le profil actuel avec expertise psycho-professionnelle
2. IDENTIFIE les compétences transférables factuelles
3. PROPOSE 10 reconversions réalistes et documentées
4. FOURNIT formations marocains réelles et vérifiées
5. CALCULE scores de transition basés sur données objectives
6. VÉRIFIE orthographe, grammaire et syntaxe deux fois

CRITÈRES DE SÉLECTION PROFESSIONNELS :
- Métiers en tension avérée (données ANAPEC/OFPPT/AREF)
- Compétences transférables identifiables
- Formations accessibles et financées
- Débouchés réels sur le marché marocain
- Cohérence avec profil et motivations

POUR CHAQUE MÉTIER DE RECONVERSION :
- Titre exact du poste (français + arabe si applicable)
- Secteur d'activité précis
- Explication factuelle de la pertinence (2-3 phrases parfaites)
- Score de facilité de transition objectif (basé sur compétences transférables)
- Formations marocains spécifiques avec organismes réels
- Durée réaliste en mois
- Salaire approximatif vérifié (Maroc 2024, en DH/mois)
- Régions de forte demande documentées

FORMAT DE RÉPONSE OBLIGATOIRE (JSON EXACT) :
{
  "suggestions": [
    {
      "title": "Nom précis du métier de reconversion",
      "titleAR": "المسمى الوظيفي بالعربية (si pertinent pour Maroc)",
      "sector": "Secteur d'activité spécifique", 
      "explanation": "Explication factuelle en 2-3 phrases parfaites : pourquoi cette reconversion est pertinente pour ce profil (orthographe irréprochable, grammaire impeccable)",
      "compatibilityScore": 75,
      "requiredTraining": [
        "Formation spécifique 1 (Organisme marocain réel - durée précise)",
        "Certification 2 (ANAPEC/OFPPT/AREF/ISTA - durée)",
        "Formation complémentaire 3 (organisme vérifié - durée)"
      ],
      "estimatedDuration": 12,
      "salaryRange": "2.800-3.800€ brut",
      "demandRegions": ["Grand Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Souss-Massa", "Fès-Meknès", "Tanger-Tétouan-Al Hoceïma"],
      "isReconversion": true
    }
  ]
}`;

      const response = await chatCompletions('deepseek', {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "deepseek-chat",
          temperature: 0.7,
          max_tokens: 3000
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Pas de réponse de DeepSeek');
      }

      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedContent);

      console.log('✅ DeepSeek API reconversion réponse reçue avec succès');
      return result.suggestions || [];
    } catch (error: any) {
      console.error('Erreur DeepSeek reconversion:', error);
      
      // Fallback avec suggestions génériques de reconversion
      return this.getFallbackReconversionSuggestions();
    }
  }

  // Fallback suggestions pour reconversion spécifiques au Maroc
  private getFallbackReconversionSuggestions(): any[] {
    return [
      {
        title: "Support informatique",
        titleAR: "دعم تقني",
        sector: "Informatique et télécommunications",
        explanation: "Secteur en forte demande au Maroc. Accessible via formations OFPPT courtes et certifications techniques.",
        compatibilityScore: 75,
        requiredTraining: [
          "Formation Support IT (OFPPT/ISTA - 6 mois)",
          "Certification Microsoft/CompTIA (centre agréé - 3 mois)",
          "Formation réseaux informatiques (OFPPT - 4 mois)"
        ],
        estimatedDuration: 8,
        salaryRange: "4000-7000 DH/mois",
        demandRegions: ["Grand Casablanca", "Rabat", "Tanger", "Agadir", "Marrakech"],
        isReconversion: true
      },
      {
        title: "Aide-soignant",
        titleAR: "مساعد طبي",
        sector: "Santé et action sociale",
        explanation: "Métier en forte demande au Maroc. Reconversion accessible avec formation d'1 an via OFPPT ou instituts de santé.",
        compatibilityScore: 80,
        requiredTraining: [
          "Formation Aide-soignant (OFPPT/Institut santé - 12 mois)",
          "Stage pratique (hôpitaux/cliniques - 3 mois)",
          "Formation gestes et soins d'urgence (Croissant-Rouge - 1 mois)"
        ],
        estimatedDuration: 12,
        salaryRange: "3500-5000 DH/mois",
        demandRegions: ["Grand Casablanca", "Rabat", "Tanger", "Agadir", "Marrakech"],
        isReconversion: true
      },
      {
        title: "Électricien installateur",
        titleAR: "كهربائي",
        sector: "Construction et travaux publics",
        explanation: "Métier technique très demandé au Maroc. Formation OFPPT disponible dans toutes les régions.",
        compatibilityScore: 70,
        requiredTraining: [
          "Formation Électricien bâtiment (OFPPT - 18 mois)",
          "Formation installations industrielles (ISTA - 6 mois)",
          "Habilitation électrique (organisme agréé - 1 mois)"
        ],
        estimatedDuration: 20,
        salaryRange: "4500-7000 DH/mois",
        demandRegions: ["Grand Casablanca", "Rabat", "Tanger", "Agadir", "Marrakech"],
        isReconversion: true
      },
      {
        title: "Cuisinier",
        titleAR: "طاهٍ",
        sector: "Hôtellerie Restauration Tourisme",
        explanation: "Secteur tourisme en forte croissance au Maroc. Formations disponibles dans les instituts spécialisés (ISITT, IFMIA).",
        compatibilityScore: 75,
        requiredTraining: [
          "Formation cuisine (ISITT/IFMIA - 12 mois)",
          "Hygiène alimentaire HACCP (centre agréé - 1 semaine)",
          "Spécialisation cuisine marocaine/internationale (OFPPT - 6 mois)"
        ],
        estimatedDuration: 15,
        salaryRange: "3500-6000 DH/mois",
        demandRegions: ["Marrakech", "Agadir", "Fès", "Casablanca"],
        isReconversion: true
      },
      {
        title: "Conducteur poids lourd",
        titleAR: "سائق شاحنة",
        sector: "Transport et logistique",
        explanation: "Métier en tension avec excellentes perspectives d'emploi au Maroc. Fort besoin dans la logistique et l'export.",
        compatibilityScore: 85,
        requiredTraining: [
          "Permis poids lourd (Auto-école agréée - 3 mois)",
          "Formation ADR matières dangereuses (2 semaines)",
          "Carte de qualification conducteur (obligatoire)"
        ],
        estimatedDuration: 4,
        salaryRange: "4000-6500 DH/mois",
        demandRegions: ["Casablanca", "Tanger", "Kénitra", "Tanger Med"],
        isReconversion: true
      }
    ];
  }

  // Méthode de basculement vers DeepSeek en cas d'erreur OpenAI
  async suggestJobsWithDeepSeek(cvText: string, isCustomOffer: boolean = false, jobOffer: string = ''): Promise<any[]> {
    try {
      console.log('🚀 Utilisation de DeepSeek API...');
      
      // Ajouter un timestamp pour éviter le cache des réponses identiques
      const timestamp = Date.now();
      const cacheBreaker = `[Analyse-DeepSeek-${timestamp}]`;
      
      const systemMessage = isCustomOffer 
        ? `Tu es un EXPERT SENIOR en analyse de CV et matching d'offres d'emploi avec 15+ années d'expérience en recrutement. Tu analyses la compatibilité entre un CV et une offre d'emploi spécifique avec une PRÉCISION CHIRURGICALE.

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Analyse FACTUELLE basée uniquement sur les données fournies
- Vocabulaire professionnel et terminologie RH précise
- Français impeccable (orthographe Larousse/Robert)
- DOUBLE VÉRIFICATION avant chaque réponse`
        : `Tu es un CONSEILLER D'ORIENTATION PROFESSIONNEL SENIOR certifié avec 15+ années d'expérience. Tu analyses les CV avec une PRÉCISION CHIRURGICALE et proposes des métiers pertinents.

EXIGENCES ABSOLUES:
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Analyse FACTUELLE basée uniquement sur les données du CV
- Terminologie professionnelle précise et actuelle
- Français impeccable (orthographe Larousse/Robert)
- DOUBLE VÉRIFICATION avant chaque réponse`;

      const userMessage = isCustomOffer
        ? `${cacheBreaker} MISSION CRITIQUE : Analyse ce CV par rapport à cette offre d'emploi et fournis un score de compatibilité détaillé avec ZÉRO ERREUR.

CV À ANALYSER:
${cvText}

OFFRE D'EMPLOI CIBLÉE:
${jobOffer}

🎯 INSTRUCTIONS ULTRA-PRÉCISES :

1. ANALYSE le CV avec une précision de consultant senior
2. IDENTIFIE les correspondances exactes avec l'offre
3. CALCULE un score de compatibilité factuel (0-100)
4. FORMULE des phrases parfaites grammaticalement
5. VÉRIFIE deux fois l'orthographe et la syntaxe

FORMAT DE RÉPONSE OBLIGATOIRE (JSON EXACT) :
{
  "suggestions": [
    {
      "title": "Titre exact du poste (copié de l'offre)",
      "sector": "Secteur précis de l'offre",
      "explanation": "Analyse détaillée de compatibilité en 3-4 phrases parfaites, orthographe irréprochable, grammaire impeccable",
      "compatibilityScore": 85,
      "strengths": ["Point fort 1 formulé parfaitement", "Point fort 2 sans faute", "Point fort 3 grammaire parfaite"],
      "improvementAreas": ["Zone d'amélioration 1 formulée clairement", "Zone d'amélioration 2 sans erreur"]
    }
  ]
}`
        : `${cacheBreaker} MISSION CRITIQUE : Analyse ce CV et propose 10 métiers/postes très pertinents avec ZÉRO ERREUR linguistique.

CV À ANALYSER:
${cvText}

🎯 INSTRUCTIONS ULTRA-PRÉCISES :

1. ANALYSE le profil avec expertise de consultant senior
2. IDENTIFIE 10 métiers parfaitement adaptés au profil
3. CALCULE des scores de compatibilité factuels (basés sur expérience + compétences + formation)
4. FORMULE chaque explication en français impeccable
5. VÉRIFIE deux fois l'orthographe et la grammaire

CRITÈRES D'ANALYSE PROFESSIONNELLE :
- Cohérence entre formation et expériences
- Progression de carrière logique  
- Adéquation compétences techniques/métier
- Niveau de responsabilité approprié
- Secteurs d'activité pertinents

FORMAT DE RÉPONSE OBLIGATOIRE (JSON EXACT) :
{
  "suggestions": [
    {
      "title": "Nom précis du métier/poste",
      "sector": "Secteur d'activité spécifique", 
      "explanation": "Explication en 2-3 phrases parfaites : pourquoi ce métier correspond au profil (orthographe irréprochable)",
      "compatibilityScore": 85,
      "strengths": ["Point fort 1 grammaire parfaite", "Point fort 2 orthographe correcte", "Point fort 3 syntaxe impeccable"],
      "improvementAreas": ["Zone d'amélioration 1 formulée clairement", "Zone d'amélioration 2 sans faute"]
    }
  ]
}`;

      const response = await chatCompletions('deepseek', {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "deepseek-chat",
          temperature: 0.7,
          max_tokens: 3000
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Pas de réponse de DeepSeek');
      }

      // Nettoyer le JSON de potentiels backticks markdown
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedContent);

      console.log('✅ DeepSeek API réponse reçue avec succès');
      return result.suggestions || [];
    } catch (error: any) {
      console.error('Erreur DeepSeek:', error);
      
      // Si DeepSeek aussi a un problème 429 ou 401, utiliser le fallback final
      if (error.message?.includes('429') || error.status === 429 || 
          error.message?.includes('401') || error.status === 401) {
        console.log('💥 DeepSeek aussi en limite - Activation fallback final');
        // Fallback simple en cas d'erreur
      return [{
        title: "Analyse indisponible",
        sector: "Général",
        explanation: "L'analyse détaillée sera disponible dès que nos services seront rétablis.",
        compatibilityScore: 50,
        strengths: ["À déterminer"],
        improvementAreas: ["En cours d'analyse"]
      }];
      }
      
      throw new Error('Erreur avec DeepSeek API');
    }
  }

  async parseCV(cvText: string) {
    try {
      const systemMessage = `Tu es un EXPERT SENIOR en analyse et extraction de données CV avec 15+ années d'expérience en recrutement. PRÉCISION CHIRURGICALE requise.

COMPÉTENCES EXPERTES :
- Reconnaissance de tous formats CV (français, européens, anglo-saxons)
- Extraction de données complexes et variées (dates, noms, coordonnées)
- Analyse sectorielle et terminologique approfondie
- Détection automatique de la langue et des standards

EXIGENCES ABSOLUES :
- ZÉRO erreur d'extraction ou d'interprétation
- Respect STRICT du format JSON demandé
- Extraction COMPLÈTE de toutes les données disponibles
- Cohérence et logique des informations extraites
- DOUBLE VÉRIFICATION avant réponse`;
      
      const userMessage = `🎯 MISSION CRITIQUE : Analyse ce CV avec une PRÉCISION CHIRURGICALE et extrais TOUTES les informations dans le format JSON EXACT suivant.

CV À ANALYSER :
${cvText}

🚨 INSTRUCTIONS ULTRA-PRÉCISES :

1. **INFORMATIONS PERSONNELLES** : Extrais EXACTEMENT le prénom, nom, email, téléphone, adresse
2. **EXPÉRIENCES PROFESSIONNELLES** : TOUTES les expériences avec dates précises, postes exacts, entreprises, descriptions complètes
3. **FORMATION** : TOUS les diplômes, établissements, années, spécialisations
4. **COMPÉTENCES** : TOUTES les compétences techniques, logiciels, certifications mentionnées
5. **LANGUES** : TOUTES les langues avec niveaux exacts (traduis en format standardisé)

🔍 CRITÈRES D'EXTRACTION PROFESSIONNELLE :
- Noms/prénoms : Respecte la casse exacte, détecte les noms composés
- Dates : Format standardisé MM/YYYY, gère "Actuellement", "En cours", dates approximatives
- Entreprises : Noms complets sans abréviations, secteur si mentionné
- Postes : Titres exacts sans modification
- Compétences : Distingue hard skills et soft skills
- Langues : Niveaux CECRL si possibles (Débutant→A1, Intermédiaire→B1, Avancé→C1, etc.)

⚠️ FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "personalInfo": {
    "firstName": "Prénom EXACT extrait du CV",
    "lastName": "Nom EXACT extrait du CV", 
    "email": "email@exact.extrait",
    "phone": "numéro exact avec formatage original",
    "location": "adresse complète ou ville, pays"
  },
  "experiences": [
    {
      "company": "Nom EXACT de l'entreprise",
      "position": "Titre EXACT du poste",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY ou Actuellement", 
      "description": "Description COMPLÈTE des missions et responsabilités extraites",
      "isCurrentJob": true/false
    }
  ],
  "education": [
    {
      "institution": "Nom EXACT de l'établissement",
      "degree": "Titre EXACT du diplôme/certification",
      "field": "Domaine/spécialisation EXACT",
      "year": "YYYY"
    }
  ],
  "skills": ["toutes", "les", "compétences", "techniques", "mentionnées", "logiciels", "certifications"],
  "languages": [
    {
      "language": "Nom exact langue",
      "level": "Niveau exact mentionné ou traduit"
    }
  ]
}

🎯 OBJECTIF QUALITÉ : Cette extraction doit être PARFAITE pour alimenter la génération de CV professionnels.

RÉPONDS UNIQUEMENT AVEC LE JSON, AUCUN TEXTE ADDITIONNEL.`;

      const response = await chatCompletions('openai', {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.1,
          max_tokens: 3000
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Pas de réponse de OpenAI');
      }

      // Nettoyer le JSON de potentiels backticks markdown
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      // Vérifier si OpenAI retourne du texte au lieu de JSON (commence par des mots français)
      if (cleanedContent.startsWith('Désolé') || cleanedContent.startsWith('Je ne peux') || 
          cleanedContent.startsWith('Il me faut') || !cleanedContent.startsWith('{')) {
        console.log('⚠️ OpenAI retourne du texte au lieu de JSON, basculement vers DeepSeek...');
        return this.parseCVWithDeepSeek(cvText);
      }
      
      const result = JSON.parse(cleanedContent);

      return result;
    } catch (error: any) {
      console.error('Erreur parsing CV OpenAI:', error);
      
      // Si erreur JSON, 429 ou 401 OpenAI, basculer vers DeepSeek pour le parsing
      if (error.message?.includes('429') || error.status === 429 || 
          error.message?.includes('401') || error.status === 401 ||
          error.message?.includes('Unexpected token') || error.name === 'SyntaxError') {
        console.log('🔄 Basculement vers DeepSeek pour parsing CV...');
        return this.parseCVWithDeepSeek(cvText);
      }
      
      throw error;
    }
  }

  // Parsing CV avec DeepSeek en cas d'erreur OpenAI
  async parseCVWithDeepSeek(cvText: string) {
    try {
      console.log('🚀 Parsing CV avec DeepSeek...');
      
      const systemMessage = `Tu es un EXPERT SENIOR en analyse et extraction de données CV avec 15+ années d'expérience en recrutement. PRÉCISION CHIRURGICALE requise.

COMPÉTENCES EXPERTES :
- Reconnaissance de tous formats CV (français, européens, anglo-saxons)
- Extraction de données complexes et variées (dates, noms, coordonnées)
- Analyse sectorielle et terminologique approfondie
- Détection automatique de la langue et des standards

EXIGENCES ABSOLUES :
- ZÉRO erreur d'extraction ou d'interprétation
- Respect STRICT du format JSON demandé
- Extraction COMPLÈTE de toutes les données disponibles
- Cohérence et logique des informations extraites
- DOUBLE VÉRIFICATION avant réponse`;
      
      const userMessage = `🎯 MISSION CRITIQUE : Analyse ce CV avec une PRÉCISION CHIRURGICALE et extrais TOUTES les informations dans le format JSON EXACT suivant.

CV À ANALYSER :
${cvText}

🚨 INSTRUCTIONS ULTRA-PRÉCISES :

1. **INFORMATIONS PERSONNELLES** : Extrais EXACTEMENT le prénom, nom, email, téléphone, adresse
2. **EXPÉRIENCES PROFESSIONNELLES** : TOUTES les expériences avec dates précises, postes exacts, entreprises, descriptions complètes
3. **FORMATION** : TOUS les diplômes, établissements, années, spécialisations
4. **COMPÉTENCES** : TOUTES les compétences techniques, logiciels, certifications mentionnées
5. **LANGUES** : TOUTES les langues avec niveaux exacts (traduis en format standardisé)

🔍 CRITÈRES D'EXTRACTION PROFESSIONNELLE :
- Noms/prénoms : Respecte la casse exacte, détecte les noms composés
- Dates : Format standardisé MM/YYYY, gère "Actuellement", "En cours", dates approximatives
- Entreprises : Noms complets sans abréviations, secteur si mentionné
- Postes : Titres exacts sans modification
- Compétences : Distingue hard skills et soft skills
- Langues : Niveaux CECRL si possibles (Débutant→A1, Intermédiaire→B1, Avancé→C1, etc.)

⚠️ FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "personalInfo": {
    "firstName": "Prénom EXACT extrait du CV",
    "lastName": "Nom EXACT extrait du CV", 
    "email": "email@exact.extrait",
    "phone": "numéro exact avec formatage original",
    "location": "adresse complète ou ville, pays"
  },
  "experiences": [
    {
      "company": "Nom EXACT de l'entreprise",
      "position": "Titre EXACT du poste",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY ou Actuellement", 
      "description": "Description COMPLÈTE des missions et responsabilités extraites",
      "isCurrentJob": true/false
    }
  ],
  "education": [
    {
      "institution": "Nom EXACT de l'établissement",
      "degree": "Titre EXACT du diplôme/certification",
      "field": "Domaine/spécialisation EXACT",
      "year": "YYYY"
    }
  ],
  "skills": ["toutes", "les", "compétences", "techniques", "mentionnées", "logiciels", "certifications"],
  "languages": [
    {
      "language": "Nom exact langue",
      "level": "Niveau exact mentionné ou traduit"
    }
  ]
}

🎯 OBJECTIF QUALITÉ : Cette extraction doit être PARFAITE pour alimenter la génération de CV professionnels.

RÉPONDS UNIQUEMENT AVEC LE JSON, AUCUN TEXTE ADDITIONNEL.`;

      const response = await chatCompletions('deepseek', {
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "deepseek-chat",
          temperature: 0.1, // Température très basse pour cohérence maximale
          max_tokens: 3000 // Augmentation pour extractions complètes
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Pas de réponse de DeepSeek');
      }

      // Nettoyer le JSON de potentiels backticks markdown
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      // Vérifier si DeepSeek retourne du texte au lieu de JSON
      if (cleanedContent.startsWith('Désolé') || cleanedContent.startsWith('Je ne peux') || 
          cleanedContent.startsWith('Il me faut') || cleanedContent.startsWith('Sorry') || 
          !cleanedContent.startsWith('{')) {
        console.log('⚠️ DeepSeek retourne du texte au lieu de JSON, fallback parsing basique...');
        return this.getFallbackParsing(cvText);
      }
      
      const result = JSON.parse(cleanedContent);

      console.log('✅ CV parsé avec succès via DeepSeek');
      return result;
    } catch (error: any) {
      console.error('Erreur parsing CV DeepSeek:', error);
      
      // Si DeepSeek aussi échoue, utiliser un fallback de parsing basique
      if (error.message?.includes('429') || error.status === 429 || 
          error.message?.includes('401') || error.status === 401 ||
          error.message?.includes('Unexpected token') || error.name === 'SyntaxError') {
        console.log('💥 DeepSeek parsing aussi en erreur - Fallback parsing basique');
        return this.getFallbackParsing(cvText);
      }
      
      throw error;
    }
  }

  // Fallback parsing basique si les APIs échouent
  private getFallbackParsing(cvText: string) {
    console.log('🛡️ Parsing basique activé - Extraction locale sans API');
    
    const lines = cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extraction basique des informations
    let firstName = "Prénom";
    let lastName = "Nom";
    let email = "";
    let phone = "";
    let location = "";
    
    // Recherche d'email
    const emailMatch = cvText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
    
    // Recherche de téléphone
    const phoneMatch = cvText.match(/(\+33|0)[1-9](\d{8}|\s\d{2}\s\d{2}\s\d{2}\s\d{2})/);
    if (phoneMatch) phone = phoneMatch[0];
    
    // Tentative d'extraction du nom (souvent en début)
    const firstLines = lines.slice(0, 5);
    for (const line of firstLines) {
      if (line.length > 3 && line.length < 50 && !line.includes('@') && !line.match(/\d{4}/)) {
        const words = line.split(' ').filter(w => w.length > 1);
        if (words.length >= 2) {
          firstName = words[0];
          lastName = words.slice(1).join(' ');
          break;
        }
      }
    }
    
    // Extraction basique des expériences
    const experiences = [];
    const expKeywords = ['expérience', 'poste', 'emploi', 'travail', 'stage', 'mission'];
    let currentExp = null;
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      
      // Détection de dates (format YYYY ou MM/YYYY)
      const dateMatch = line.match(/\b(20\d{2}|19\d{2})\b/);
      if (dateMatch && currentExp) {
        currentExp.startDate = dateMatch[0];
      }
      
      // Détection d'entreprise/poste potentiel
      if (line.length > 10 && line.length < 100 && !line.includes('@')) {
        if (expKeywords.some(keyword => lower.includes(keyword)) || dateMatch) {
          if (currentExp) {
            experiences.push(currentExp);
          }
          currentExp = {
            company: "Entreprise",
            position: line,
            startDate: dateMatch ? dateMatch[0] : "2020",
            endDate: "2024",
            description: "Description des missions et responsabilités",
            isCurrentJob: false
          };
        }
      }
    }
    
    if (currentExp) {
      experiences.push(currentExp);
    }
    
    // Si aucune expérience trouvée, créer une expérience par défaut
    if (experiences.length === 0) {
      experiences.push({
        company: "Entreprise précédente",
        position: "Poste occupé",
        startDate: "2020",
        endDate: "2024",
        description: "Missions et responsabilités principales",
        isCurrentJob: false
      });
    }
    
    return {
      personalInfo: {
        firstName,
        lastName,
        email: email || "email@exemple.com",
        phone: phone || "01 23 45 67 89",
        location: location || "Ville, Pays"
      },
      experiences: experiences.slice(0, 3), // Limiter à 3 expériences
      education: [
        {
          institution: "Établissement de formation",
          degree: "Diplôme obtenu",
          field: "Domaine d'études",
          year: "2020"
        }
      ],
      skills: ["Compétence 1", "Compétence 2", "Compétence 3", "Communication", "Organisation"],
      languages: [
        {
          language: "Français",
          level: "Natif"
        },
        {
          language: "Anglais",
          level: "Intermédiaire"
        }
      ]
    };
  }

  async generateDocument(type: string, validatedData: any, selectedJob: any, language: string, jobOffer?: string, userLocation: string = 'Maroc') {
    try {
      let prompt = '';
      
      if (type === 'cv') {
        prompt = `🎯 MISSION CRITIQUE : Génère un CV moderne et professionnel IMPECCABLE en ${language} pour ce profil qui postule pour : ${selectedJob.title}

Tu es un EXPERT SENIOR en rédaction de CV avec 15+ années d'expérience en recrutement et conseil en carrière. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

DONNÉES CANDIDAT À UTILISER OBLIGATOIREMENT :
${JSON.stringify(validatedData, null, 2)}

${jobOffer ? `
🎯 OFFRE D'EMPLOI CIBLÉE À ADAPTER :
${jobOffer}

ADAPTATION OBLIGATOIRE : Utilise EXACTEMENT les mots-clés de l'offre et adapte le CV à cette offre spécifique.
` : ''}

🚨 EXIGENCES ABSOLUES ZÉRO TOLÉRANCE :
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Français impeccable selon standards Larousse/Robert  
- Terminologie professionnelle précise et actuelle
- Cohérence parfaite des dates et informations
- Respect strict des standards CV marocains/européens
- DOUBLE VÉRIFICATION avant livraison

📋 STRUCTURE OBLIGATOIRE (Format marocain optimisé) :

**[PRÉNOM NOM]**
[Adresse complète] | [Téléphone] | [Email professionnel]

**PROFIL PROFESSIONNEL**
[3-4 lignes synthétiques résumant l'expertise, l'expérience et la motivation spécifique pour le poste ciblé. Utilise les mots-clés du métier. Style dynamique et orienté résultats.]

**EXPÉRIENCE PROFESSIONNELLE** [Ordre chronologique inverse]

[POSTE] - [ENTREPRISE] 
[Dates : MM/AAAA - MM/AAAA ou "Actuallement"]
[Secteur d'activité de l'entreprise]
• [Responsabilité principale avec verbe d'action au passé composé]
• [Réalisation quantifiée avec chiffres/pourcentages si possible]  
• [Compétence technique développée en lien avec le poste ciblé]
• [Résultat/impact obtenu dans cette fonction]

[Répéter pour chaque expérience de validatedData.experiences]

**FORMATION & CERTIFICATIONS**

[DIPLÔME/CERTIFICATION] - [ÉTABLISSEMENT]
[Année d'obtention] | [Spécialisation/mention si pertinente]

[Répéter pour chaque formation de validatedData.education]

**COMPÉTENCES PERSONNELLES**

**Langue(s) maternelle(s):** ${language === 'fr' ? 'Français' : language === 'ar' ? 'Arabe' : 'Anglais'}

**Autres langues:**
[Utilise validatedData.languages avec niveaux CECRL appropriés]
${validatedData.languages ? validatedData.languages.map((lang: any) => `${lang.language}: Comprendre ${lang.level}, Parler ${lang.level}, Écrire ${lang.level}`).join('\n') : ''}

**INFORMATIONS COMPLÉMENTAIRES**
[Permis de conduire si pertinent] | [Mobilité géographique] | [Disponibilité]

🔍 INSTRUCTIONS TECHNIQUES CRITIQUES :

1. **CONTENU FACTUEL** : Utilise UNIQUEMENT les données de validatedData fourni
2. **SOURCES VÉRIFIÉES** : Référence des organismes et données officielles ${userLocation}
3. **PERSONNALISATION MAXIMALE** : Chaque section adaptée au profil individuel
4. **ACTIONNABLE** : Chaque recommandation doit être concrètement réalisable
5. **COHÉRENCE TEMPORELLE** : Respect des durées et plannings réalistes
6. **SPÉCIFICITÉ GÉOGRAPHIQUE** : Adaptation parfaite au marché ${userLocation}

🎯 OBJECTIF QUALITÉ : Ce CV doit être PARFAIT pour candidatures européennes.

Génère maintenant le CV PARFAIT sans aucune balise de code.`;

      } else if (type === 'letter') {
        prompt = `🎯 MISSION CRITIQUE : Génère une lettre de motivation PERCUTANTE et IMPECCABLE en ${language} pour ce candidat qui postule pour : ${selectedJob.title}

Tu es un EXPERT SENIOR en rédaction de lettres de motivation avec 15+ années d'expérience en communication professionnelle. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

DONNÉES CANDIDAT À UTILISER :
${JSON.stringify(validatedData, null, 2)}

${jobOffer ? `
🎯 OFFRE D'EMPLOI CIBLÉE À ADAPTER :
${jobOffer}

ADAPTATION OBLIGATOIRE : Reprend EXACTEMENT les termes de l'offre et démontre la correspondance parfaite avec le profil.
` : ''}

🚨 EXIGENCES ABSOLUES ZÉRO TOLÉRANCE :
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Français impeccable selon standards Larousse/Robert
- Style professionnel mais authentique et engageant
- Personnalisation parfaite selon le profil et le poste
- Argumentation structurée et convaincante
- DOUBLE VÉRIFICATION avant livraison

📋 STRUCTURE OBLIGATOIRE (Format marocain) :

**[Prénom Nom]**
[Adresse complète]
[Téléphone] | [Email]

[Nom de l'entreprise]
[Service/Département si connu]
[Adresse entreprise]

[Ville], le [Date actuelle]

**Objet : Candidature pour le poste de ${selectedJob.title}**

Madame, Monsieur,

**INTRODUCTION** [2-3 lignes]
[Mention du poste, source de l'annonce, accroche personnalisée montrant votre intérêt spécifique pour cette entreprise/ce secteur]

**DÉVELOPPEMENT PARTIE 1** [3-4 lignes] 
[Présentation de votre profil en lien direct avec le poste : expérience pertinente, compétences clés, réalisations concrètes avec chiffres si possible. Utilise les données de validatedData.experiences]

**DÉVELOPPEMENT PARTIE 2** [3-4 lignes]
[Argumentation de votre motivation : pourquoi ce poste, pourquoi cette entreprise, ce que vous apportez de unique. Projection dans le poste avec exemples concrets]

**CONCLUSION** [2 lignes]
[Demande d'entretien, formule de politesse active, disponibilité]

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Prénom Nom]

🔍 INSTRUCTIONS TECHNIQUES CRITIQUES :

1. **PERSONNALISATION MAXIMALE** : Chaque phrase doit être spécifique au profil et au poste
2. **PREUVES CONCRÈTES** : Utilise les expériences de validatedData pour illustrer les compétences
3. **MOTS-CLÉS STRATÉGIQUES** : Reprend la terminologie exacte du poste ${selectedJob.title}
4. **TON PROFESSIONNEL** : Équilibre entre respect et conviction, évite la familiarité
5. **LONGUEUR OPTIMALE** : Maximum 300 mots, synthèse percutante
6. **COHÉRENCE CV** : Assure-toi que la lettre complète parfaitement le CV

🎯 OBJECTIF QUALITÉ : Cette lettre doit CONVAINCRE le recruteur et décrocher un entretien.

Génère maintenant la lettre de motivation PARFAITE sans aucune balise de code.`;

      } else if (type === 'email') {
        prompt = `🎯 MISSION CRITIQUE : Génère un email de candidature PROFESSIONNEL et IMPECCABLE en ${language} pour ce candidat qui postule pour : ${selectedJob.title}

Tu es un EXPERT SENIOR en communication professionnelle avec 15+ années d'expérience en recrutement. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

DONNÉES CANDIDAT À UTILISER :
${JSON.stringify(validatedData, null, 2)}

${jobOffer ? `
🎯 OFFRE D'EMPLOI CIBLÉE :
${jobOffer}
` : ''}

🚨 EXIGENCES ABSOLUES ZÉRO TOLÉRANCE :
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Français impeccable selon standards Larousse/Robert
- Ton professionnel et respectueux
- Concision et efficacité maximales
- DOUBLE VÉRIFICATION avant livraison

📧 FORMAT EMAIL OBLIGATOIRE :

**Objet :** [Objet percutant et professionnel mentionnant le poste exact et le nom du candidat]

Madame, Monsieur,

[Introduction concise : présentation + objet de l'email]

[Corps : 2-3 phrases synthétisant le profil, l'adéquation avec le poste, et la motivation]

[Mention des pièces jointes]

[Formule de politesse et disponibilité]

Cordialement,
${validatedData.personalInfo?.firstName || 'Prénom'} ${validatedData.personalInfo?.lastName || 'Nom'}
${validatedData.personalInfo?.phone || 'Téléphone'}
${validatedData.personalInfo?.email || 'Email'}

🔍 INSTRUCTIONS TECHNIQUES CRITIQUES :

1. **OBJET PERCUTANT** : Maximum 60 caractères, inclus le nom du candidat et le poste exact
2. **PREMIER IMPACT** : La première phrase doit capter l'attention immédiatement
3. **SYNTHÈSE EFFICACE** : Résume en 2-3 phrases l'essentiel du profil et de la motivation
4. **PIÈCES JOINTES** : Mentionne clairement "CV et lettre de motivation en pièces jointes"
5. **PROFESSIONNALISME** : Équilibre entre concision et complétude
6. **LONGUEUR TOTALE** : Maximum 150 mots corps de l'email

🎯 OBJECTIF QUALITÉ : Cet email doit donner ENVIE d'ouvrir les pièces jointes et de contacter le candidat.

Génère maintenant l'email de candidature PARFAIT sans aucune balise de code.`;

      } else if (type === 'reconversion_report') {
        // Contexte spécifique selon la localisation
        const locationContext = userLocation === 'Maroc' ? `
🇲🇦 CONTEXTE MAROCAIN SPÉCIFIQUE VÉRIFIÉ 2024 :
- Organismes formation référencés : OFPPT (réseau national), ANAPEC (emploi), AREF (éducation), ISTA, IFMIA, ISITT
- Financement disponible : Formations gratuites OFPPT, programmes INDH, aide ANAPEC pour demandeurs emploi
- Spécificités marché : Bilinguisme FR/AR fortement valorisé, marché en forte croissance
- Secteurs forte demande : IT/Offshoring (croissance 20%), BTP (12-18%), Tourisme, Industrie automobile/textile
- Salaires moyens secteur : ${selectedJob.salaryRange || '4.000-8.000 DH/mois'}
- Régions d'opportunités : ${selectedJob.demandRegions ? selectedJob.demandRegions.join(', ') : 'Grand Casablanca, Rabat-Salé-Kénitra, Tanger-Tétouan-Al Hoceïma'}
` : userLocation === 'France' ? `
🇫🇷 CONTEXTE FRANÇAIS SPÉCIFIQUE :
- Organismes formation : Pôle Emploi, AFPA, CNAM, CFA régionaux
- Financement : CPF (Compte Personnel Formation), OPCO sectoriels, aides régionales
- Spécificités : Grande diversité sectorielle, mobilité géographique étendue
- Secteurs porteurs : Numérique, Santé-Social, BTP, Services à la personne
- Données : France Travail, DARES, observatoires branches professionnelles
` : `
🇲🇦 CONTEXTE MAROCAIN SPÉCIFIQUE :
- Organismes formation : OFPPT, ANAPEC, AREF, centres de formation privés agréés
- Financement : Programmes OFPPT gratuits, aide ANAPEC, co-financement employeur
- Spécificités : Maîtrise FR/AR valorisée, fort développement économique, zones franches
- Secteurs excellence : IT/Offshoring, Automobile, Tourisme, Agroalimentaire
`;

        prompt = `🎯 MISSION CRITIQUE : Génère un rapport de reconversion professionnelle COMPLET et IMPECCABLE en ${language} pour ce candidat souhaitant se reconvertir vers : ${selectedJob.title}

Tu es un EXPERT SENIOR en reconversion professionnelle avec 15+ années d'expérience, spécialiste certifié en accompagnement de transitions de carrière. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

LOCALISATION CANDIDAT : ${userLocation}
${locationContext}

PROFIL ACTUEL CANDIDAT À ANALYSER :
${JSON.stringify(validatedData, null, 2)}

MÉTIER DE RECONVERSION CIBLÉ :
- Titre exact : ${selectedJob.title}
${selectedJob.titleAR && userLocation === 'Maroc' ? `- Titre arabe : ${selectedJob.titleAR}` : ''}
- Secteur d'activité : ${selectedJob.sector || 'À spécifier selon analyse'}
- Facilité de transition : ${selectedJob.compatibilityScore || 70}%
${selectedJob.salaryRange ? `- Rémunération ${userLocation} : ${selectedJob.salaryRange}` : ''}
${selectedJob.demandRegions ? `- Régions de forte demande : ${selectedJob.demandRegions.join(', ')}` : ''}
${selectedJob.requiredTraining ? `- Formations recommandées : ${selectedJob.requiredTraining.join(', ')}` : ''}
${selectedJob.estimatedDuration ? `- Durée estimée : ${selectedJob.estimatedDuration} mois` : ''}

🚨 EXIGENCES ABSOLUES ZÉRO TOLÉRANCE :
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Français impeccable selon standards Larousse/Robert
- Données factuelles vérifiées et sources fiables
- Analyse psycho-professionnelle rigoureuse
- Recommandations pratiques et actionnables
- Ton professionnel, bienveillant et motivant
- DOUBLE VÉRIFICATION avant livraison

📋 STRUCTURE RAPPORT OBLIGATOIRE (Adaptée ${userLocation.toUpperCase()}) :

# RAPPORT DE RECONVERSION PROFESSIONNELLE
**Candidat :** ${validatedData.personalInfo?.firstName || 'Prénom'} ${validatedData.personalInfo?.lastName || 'Nom'}
**Métier ciblé :** ${selectedJob.title}
**Date :** ${new Date().toLocaleDateString('fr-FR')}

## 1. ANALYSE DU PROFIL ACTUEL (150 mots minimum)

### Synthèse Expérience Professionnelle
[Analyse factuelle des expériences de validatedData.experiences : secteurs, responsabilités, progression, durées]

### Compétences Transférables Identifiées  
[Liste précise des compétences réutilisables pour ${selectedJob.title} basée sur validatedData.skills et expériences]

### Points Forts pour la Reconversion
[3-4 atouts majeurs du profil pour réussir cette transition]

## 2. ANALYSE DE LA RECONVERSION (200 mots minimum)

### Pertinence de la Transition
[Argumentation factuelle : pourquoi cette reconversion vers ${selectedJob.title} est cohérente avec le profil]

### Passerelles Naturelles
[Liens concrets entre expérience actuelle et métier cible, compétences communes]

### Opportunités Marché ${userLocation}
[Données précises sur la demande, évolution secteur, perspectives d'emploi]

### Score de Faisabilité Détaillé
[Justification du score ${selectedJob.compatibilityScore || 70}% avec critères objectifs]

## 3. PLAN DE FORMATION DÉTAILLÉ (250 mots minimum)

${selectedJob.requiredTraining ? `
### Formations Prioritaires Identifiées
${selectedJob.requiredTraining.map((training: string, index: number) => `
**${index + 1}. ${training}**
- Objectifs pédagogiques précis
- Modalités (présentiel/distanciel/mixte)
- Prérequis et niveau requis
- Coût estimé et financements possibles (CPF, employeur, etc.)
`).join('')}

### Calendrier de Formation Recommandé
[Planning détaillé sur ${selectedJob.estimatedDuration || 12} mois avec étapes clés]
` : `
### Formations et Certifications Recommandées
[Programmes spécifiques au métier ${selectedJob.title} disponibles en ${userLocation}]

### Compétences Techniques à Acquérir
[Liste détaillée des hard skills indispensables]

### Compétences Comportementales à Développer
[Soft skills spécifiques au secteur ${selectedJob.sector || 'ciblé'}]

### Ressources de Formation
[Organismes, plateformes, modalités d'apprentissage recommandées]
`}

### Financement et Aides Disponibles
[Options de financement spécifiques ${userLocation} : CPF, employeur, régions, etc.]

## 4. STRATÉGIE DE TRANSITION (200 mots minimum)

### Planning Reconversion
${selectedJob.estimatedDuration ? `
[Roadmap détaillée sur ${selectedJob.estimatedDuration} mois avec jalons]
` : `
[Roadmap estimée 6-12 mois avec phases de transition]
`}

### Valorisation Expérience Actuelle
[Comment présenter positivement le parcours lors de candidatures]

### Développement Réseau Professionnel
[Stratégies networking secteur ${selectedJob.sector || 'ciblé'}, événements, associations]

### Premiers Postes Cibles
[Types de postes accessibles immédiatement après formation]

## 5. RECOMMANDATIONS PRATIQUES (150 mots minimum)

### Actions Immédiates (0-3 mois)
- [Action concrète 1 avec délai précis]
- [Action concrète 2 avec ressources spécifiques]
- [Action concrète 3 avec indicateurs de succès]

### Ressources Utiles ${userLocation}
[Sites spécialisés, associations professionnelles, réseaux pertinents]

### Erreurs à Éviter Absolument
[Pièges courants dans cette reconversion spécifique]

### Indicateurs de Réussite
[KPIs pour mesurer l'avancement de la reconversion]

---
**Rapport généré par CVBoost - ${new Date().toLocaleDateString('fr-FR')}**
*Expertise reconversion professionnelle depuis 2009*

🔍 INSTRUCTIONS TECHNIQUES CRITIQUES :

1. **DONNÉES FACTUELLES** : Base l'analyse uniquement sur validatedData fourni
2. **SOURCES VÉRIFIÉES** : Référence des organismes et données officielles ${userLocation}
3. **PERSONNALISATION MAXIMALE** : Chaque section adaptée au profil individuel
4. **ACTIONNABLE** : Chaque recommandation doit être concrètement réalisable
5. **COHÉRENCE TEMPORELLE** : Respect des durées et plannings réalistes
6. **SPÉCIFICITÉ GÉOGRAPHIQUE** : Adaptation parfaite au marché ${userLocation}

🎯 OBJECTIF QUALITÉ : Ce rapport doit être un GUIDE COMPLET pour réussir cette reconversion.

Génère maintenant le rapport PARFAIT sans aucune balise de code.`;

      } else if (type === 'europass') {
        prompt = `🎯 MISSION CRITIQUE : Génère un CV Europass COMPLET et IMPECCABLE en ${language} selon format officiel CEDEFOP pour ce candidat qui postule pour : ${selectedJob.title}

Tu es un EXPERT SENIOR certifié Europass avec 15+ années d'expérience dans les standards européens de CV. MAÎTRISE PARFAITE du français (orthographe Larousse/Robert).

DONNÉES CANDIDAT À UTILISER OBLIGATOIREMENT :
${JSON.stringify(validatedData, null, 2)}

${jobOffer ? `
🎯 OFFRE D'EMPLOI CIBLÉE À ADAPTER :
${jobOffer}
` : ''}

🚨 EXIGENCES ABSOLUES ZÉRO TOLÉRANCE :
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Français impeccable selon standards Larousse/Robert
- Respect STRICT du format Europass officiel CEDEFOP
- Toutes les sections obligatoires complètement renseignées
- Niveaux CECRL corrects pour les langues
- Dates cohérentes format européen
- DOUBLE VÉRIFICATION avant livraison

📋 GÉNÈRE UN CV EUROPASS COMPLET SELON FORMAT OFFICIEL :

🇪🇺 **Curriculum vitae Europass**

## INFORMATIONS PERSONNELLES

**Nom(s) / Prénom(s) :** ${validatedData.personalInfo?.firstName || 'À compléter'} ${validatedData.personalInfo?.lastName || 'À compléter'}

**Adresse :** ${validatedData.personalInfo?.location || 'À compléter selon localisation candidat'}

**Téléphone :** ${validatedData.personalInfo?.phone || 'À compléter selon données'}

**Courriel :** ${validatedData.personalInfo?.email || 'À compléter selon données'}

**Nationalité :** [À déduire de la localisation ou spécifier selon contexte européen]

**Date de naissance :** [À indiquer si disponible dans les données, sinon omettre]

## EMPLOI RECHERCHÉ / DOMAINE DE COMPÉTENCES

**Poste recherché :** ${selectedJob.title}

**Secteur d'activité :** ${selectedJob.sector || 'À spécifier selon analyse du poste'}

**Niveau d'études :** [À déduire de validatedData.education]

**Niveau d'expérience :** [À calculer selon validatedData.experiences]

## EXPÉRIENCE PROFESSIONNELLE

[OBLIGATOIRE : Utilise TOUTES les expériences de validatedData.experiences - Format chronologique inverse]

**Dates :** [MM/AAAA – MM/AAAA format européen]
**Fonction ou poste occupé :** [Titre exact du poste]
**Principales activités et responsabilités :** [Description détaillée 2-3 phrases minimum avec verbes d'action, responsabilités précises et réalisations quantifiées si possible]
**Nom et adresse de l'employeur :** [Nom complet entreprise + ville/pays]
**Type ou secteur d'activité :** [Secteur précis de l'entreprise]

[Répéter ce format pour chaque expérience professionnelle]

## ÉDUCATION ET FORMATION

[OBLIGATOIRE : Utilise TOUTES les formations de validatedData.education - Format chronologique inverse]

**Dates :** [MM/AAAA – MM/AAAA]
**Intitulé du certificat ou diplôme délivré :** [Titre exact diplôme/certification]
**Principales matières/compétences professionnelles couvertes :** [Spécialisations, matières principales, compétences acquises]
**Nom et type de l'établissement d'enseignement ou de formation :** [Nom complet + type d'établissement]
**Niveau dans la classification nationale ou internationale :** [Bac+X, Licence, Master, etc.]

[Répéter pour chaque formation]

## COMPÉTENCES PERSONNELLES

### Langue(s) maternelle(s)
${language === 'fr' ? 'Français' : language === 'ar' ? 'Arabe' : language === 'en' ? 'Anglais' : 'Français'}

### Autres langues
[OBLIGATOIRE : Utilise validatedData.languages avec niveaux CECRL]

${validatedData.languages ? validatedData.languages.map((lang: any) => `
**${lang.language} :**
- Compréhension : Écoute [${this.convertToEuropeanLevel(lang.level)}] | Lecture [${this.convertToEuropeanLevel(lang.level)}]
- Expression : Interaction orale [${this.convertToEuropeanLevel(lang.level)}] | Expression orale [${this.convertToEuropeanLevel(lang.level)}] | Expression écrite [${this.convertToEuropeanLevel(lang.level)}]
`).join('') : `
**Anglais :**
- Compréhension : Écoute [B2] | Lecture [B2]  
- Expression : Interaction orale [B1] | Expression orale [B1] | Expression écrite [B2]
`}

**Niveaux :** A1/A2 : utilisateur élémentaire - B1/B2 : utilisateur indépendant - C1/C2 : utilisateur expérimenté
*Cadre européen commun de référence pour les langues*

### Compétences en communication
[OBLIGATOIRE : Génère 2-3 compétences communication spécifiques basées sur validatedData.experiences]
- [Compétence communication 1 avec exemple concret d'expérience]
- [Compétence communication 2 basée sur rôles occupés]
- [Compétence communication 3 en lien avec secteur ${selectedJob.sector || 'ciblé'}]

### Compétences organisationnelles
[OBLIGATOIRE : Génère 2-3 compétences organisationnelles déduites des expériences]
- [Compétence organisationnelle 1 avec contexte professionnel]
- [Compétence organisationnelle 2 illustrée par expérience]
- [Compétence organisationnelle 3 adaptée au poste ${selectedJob.title}]

### Compétences liées à l'emploi
[OBLIGATOIRE : Utilise validatedData.skills et adapte au poste ${selectedJob.title}]
${validatedData.skills ? validatedData.skills.map((skill: string) => `- ${skill}`).join('\n') : '- [Compétences techniques spécifiques au métier]\n- [Compétences sectorielles pertinentes]\n- [Savoir-faire professionnel développé]'}

### Compétences numériques
[OBLIGATOIRE : Génère compétences informatiques pertinentes selon expériences et métier ciblé]
- Bureautique : [Niveau et logiciels maîtrisés]
- Internet/Web : [Compétences digitales professionnelles]
- Logiciels spécialisés : [Outils métier si pertinents pour ${selectedJob.title}]

### Autres compétences
[OBLIGATOIRE : Compétences additionnelles pertinentes pour ${selectedJob.title}]
- [Compétence transversale 1]
- [Compétence technique spécialisée]
- [Atout différenciant pour le poste]

## INFORMATIONS COMPLÉMENTAIRES

**Permis de conduire :** [Indiquer B si pertinent pour le poste]

[Ajouter si pertinent selon expérience : publications, projets, distinctions, activités bénévoles]

---
© Union européenne, 2002-2024 | http://europass.cedefop.europa.eu
*CV généré par CVBoost le ${new Date().toLocaleDateString('fr-FR')}*

🔍 INSTRUCTIONS TECHNIQUES CRITIQUES :

1. **UTILISATION COMPLÈTE DONNÉES** : Intègre TOUTES les informations de validatedData
2. **FORMAT OFFICIEL STRICT** : Respecte la structure Europass CEDEFOP exacte
3. **SECTIONS COMPLÈTES** : Aucune section vide, développe chaque partie
4. **EXPÉRIENCES DÉTAILLÉES** : Minimum 2-3 phrases par expérience professionnelle
5. **NIVEAUX CECRL CORRECTS** : A1-C2 pour langues selon standards européens
6. **ADAPTATION POSTE** : Vocabulaire et compétences orientés ${selectedJob.title}
7. **LONGUEUR MINIMALE** : CV complet minimum 1,5 page selon standards Europass
8. **COHÉRENCE EUROPÉENNE** : Terminologie et références adaptées contexte UE

🎯 OBJECTIF QUALITÉ : Ce CV Europass doit être PARFAIT pour candidatures européennes.

Génère maintenant le CV Europass COMPLET et IMPECCABLE sans aucune balise de code.`;
      }

      const response = await chatCompletions('openai', {
          messages: [
            { 
              role: "system", 
              content: `Tu es un EXPERT SENIOR en rédaction professionnelle avec 15+ années d'expérience. EXCELLENCE LINGUISTIQUE ABSOLUE requise.

MISSION : Génération de documents professionnels PARFAITS (CV, lettres, emails, rapports) avec ZÉRO ERREUR.

EXIGENCES CRITIQUES :
- ZÉRO coquille, faute d'orthographe, de grammaire ou de syntaxe
- Français impeccable selon standards Larousse/Robert  
- Terminologie professionnelle précise et actuelle
- Adaptation parfaite au poste ciblé
- Respect strict des formats demandés
- DOUBLE VÉRIFICATION systématique avant réponse

CONTRÔLE QUALITÉ : Chaque document généré doit être prêt pour envoi direct sans aucune correction nécessaire.` 
            },
            { role: "user", content: prompt }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.2,
          max_tokens: 4000
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Erreur lors de la génération';
    } catch (error) {
      console.error('Erreur génération document:', error);
      return `Erreur lors de la génération du ${type}. Veuillez réessayer.`;
    }
  }

  // Génération de script de CV vidéo à faible coût (concis, structuré)
  async generateVideoCVScript(params: { jobOffer: string; cvText: string; country?: 'Maroc' | 'France'; language?: 'fr' | 'en' | 'ar' }) {
    const { jobOffer, cvText } = params;
    const country = params.country || 'Maroc';
    const language = params.language || 'fr';

    // Limiter la taille d'entrée pour réduire le coût
    const maxChars = 4000;
    const trimmedOffer = (jobOffer || '').slice(0, maxChars);
    const trimmedCV = (cvText || '').slice(0, maxChars);

    const system = `Tu es un coach carrière senior spécialisé en CV vidéo pour le marché ${country}. Tu fournis un script TÉLÉPROMPTEUR prêt à lire (350–600 mots), avec indications d’intonation, pauses et respiration, ainsi qu’une check‑list de tournage smartphone. ${language.toUpperCase()} impeccable, ton professionnel et bienveillant.`;
    const user = `OFFRE D'EMPLOI (extrait) :\n${trimmedOffer}\n\nCV (extrait) :\n${trimmedCV}\n\nMISSION : Génère un plan complet de CV vidéo en JSON COMPACT. Le téléprompteur doit contenir des balises de jeu : [SOURIRE], [PAUSE 0.5s], [PAUSE 1s], [INSPIRE], [REGARD CAMÉRA], [VOIX BASSE], [APPUI], [SOURIRE FIN]. Évite les généralisations et ancre le discours dans les éléments fournis.\n\nRESPECTE STRICTEMENT CE FORMAT JSON :\n{
  "script": {
    "intro": "Accroche 20–30s adaptée à l’offre, promettre valeur",
    "corps": ["3–4 idées forces alignées à l’offre (phrases concises et factuelles)"],
    "conclusion": "Appel à l’action 10–15s (dispo/merci)"
  },
  "structure": ["Hook 3s", "Titre+Nom 5s", "Pourquoi moi 20s", "Preuves 45s", "Soft skills 15s", "CTA 10s"],
  "shots": [
    {"plan": "buste", "conseils": "caméra hauteur yeux, fond neutre"},
    {"plan": "mains/gestuelle", "conseils": "gestes calmes, synchrones"}
  ],
  "tips": {
    "lumiere": ["face fenêtre", "éviter contre‑jour", "mode HDR si dispo"],
    "audio": ["pièce calme", "micro casque", "test 10s"],
    "cadre": ["règle des tiers", "espace au‑dessus de la tête"],
    "tenue": ["sobre/contrastée selon secteur"],
    "decor": ["fond neutre/bibliothèques", "aucun élément distrayant"],
    "duree": "60–90s",
    "teleprompter": ["police 18–22", "120–140 wpm"]
  },
  "teleprompter": "Monologue complet 350–600 mots prêt à lire AVEC balises [PAUSE], [INSPIRE], [REGARD CAMÉRA], [SOURIRE], [APPUI] positionnées intelligemment."
}`;

    try {
      const response = await chatCompletions('openai', {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.25,
          max_tokens: 2000
      });

      if (!response.ok) {
        const err = new Error(`OpenAI error: ${response.status}`) as any;
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      const jsonStr = cleaned.includes('{') ? cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);
      if ((!parsed.teleprompter || parsed.teleprompter.trim().length < 80) && parsed.script) {
        parsed.teleprompter = this.composeTeleprompterFromSegments(parsed.script);
      }
      return parsed;
    } catch (e: any) {
      // Fallback DeepSeek en cas d’erreur coût/quota
      try {
        const response = await chatCompletions('deepseek', {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          model: 'deepseek-chat',
          temperature: 0.3,
          max_tokens: 2000
        });
        if (!response.ok) throw new Error('DeepSeek error');
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const cleaned = content.replace(/```json\n?|```/g, '').trim();
        const jsonStr = cleaned.includes('{') ? cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1) : cleaned;
        const parsed = JSON.parse(jsonStr);
        if ((!parsed.teleprompter || parsed.teleprompter.trim().length < 80) && parsed.script) {
          parsed.teleprompter = this.composeTeleprompterFromSegments(parsed.script);
        }
        return parsed;
      } catch {
        return {
          script: { intro: 'Présentez-vous brièvement et annoncez le poste visé.', corps: ['Mettez en avant 3-4 réussites concrètes liées à l’offre.'], conclusion: 'Remerciez et indiquez votre disponibilité.' },
          structure: ["Hook", "Titre+Nom", "Pourquoi moi", "Preuves", "Soft skills", "CTA"],
          shots: [{ plan: 'buste', conseils: 'fond neutre, lumière face' }],
          tips: { lumiere: ["face fenêtre"], audio: ["pièce calme"], cadre: ["règle des tiers"], tenue: ["sobre"], decor: ["fond neutre"], duree: '60-90s', teleprompter: ["police 18–22", "120–140 wpm"] },
          teleprompter: this.composeTeleprompterFromSegments({ intro: 'Accroche courte', corps: ['Idée force 1', 'Idée force 2'], conclusion: 'CTA' })
        } as any;
      }
    }
  }

  private composeTeleprompterFromSegments(script: { intro?: string; corps?: string[]; conclusion?: string }) {
    const parts: string[] = [];
    if (script.intro) parts.push(`[REGARD CAMÉRA] [SOURIRE] ${script.intro} [PAUSE 1s]`);
    if (Array.isArray(script.corps)) {
      for (const idea of script.corps) {
        parts.push(`[APPUI] ${idea} [PAUSE 0.5s]`);
      }
    }
    if (script.conclusion) parts.push(`[VOIX BASSE] ${script.conclusion} [SOURIRE FIN]`);
    return parts.join('\n\n');
  }
}

export const openaiClient = new OpenAIClientService();

// Interfaces et fonctions pour la génération de landing pages
export interface GenerateLandingPageRequest {
  keyword: string;
  intent: 'transactional' | 'informational' | 'navigational';
  volume: number;
  difficulty: number;
  suggestedTitle: string;
  suggestedUrl: string;
  competition: number;
}

export interface GeneratedLandingPage {
  title: string;
  metaDescription: string;
  content: string;
  keywords: string[];
  url: string;
  structure: {
    h1: string;
    sections: Array<{
      title: string;
      content: string;
      type: 'introduction' | 'main_content' | 'tips' | 'faq' | 'cta';
    }>;
  };
}

export async function generateLandingPageContent(
  request: GenerateLandingPageRequest
): Promise<GeneratedLandingPage> {
  try {
    const prompt = `Tu es un expert en rédaction SEO et en marketing digital spécialisé dans le marché de l'emploi marocain.

CONTEXTE DE GÉNÉRATION :
- Mot-clé principal: "${request.keyword}"
- Volume de recherche: ${request.volume}/mois
- Intention de recherche: ${request.intent}
- Difficulté SEO: ${request.difficulty}/100
- Compétition: ${request.competition}/100
- Titre suggéré: "${request.suggestedTitle}"
- URL suggérée: "${request.suggestedUrl}"

MISSION :
Génère une landing page complète et optimisée SEO pour le marché marocain de l'emploi, spécifiquement axée sur les CV et la recherche d'emploi.

EXIGENCES SPÉCIFIQUES :
1. Contenu 100% original et pertinent pour le Maroc
2. Optimisation SEO naturelle (pas de bourrage de mots-clés)
3. Structure claire avec titres H2, H3
4. Appels à l'action pertinents vers notre générateur de CV IA
5. Informations factuelles sur le marché marocain de l'emploi
6. Ton professionnel mais accessible
7. Longueur optimale pour SEO (1500-2500 mots)

FORMAT DE RÉPONSE (JSON strict) :
{
  "title": "Titre de la page (60 caractères max)",
  "metaDescription": "Description meta (155 caractères max)",
  "content": "Contenu Markdown complet de la page",
  "keywords": ["mot-clé principal", "mots-clés secondaires"],
  "url": "${request.suggestedUrl}",
  "structure": {
    "h1": "Titre principal H1",
    "sections": [
      {
        "title": "Titre de section",
        "content": "Contenu de la section",
        "type": "introduction|main_content|tips|faq|cta"
      }
    ]
  }
}

CONTENU À INCLURE :
- Introduction accrocheuse sur le sujet
- Statistiques réelles du marché marocain de l'emploi
- Conseils pratiques et actionnables
- FAQ pertinente
- Appels à l'action vers notre outil IA
- Mentions légales et conformité RGPD si pertinent

Réponds UNIQUEMENT avec le JSON, aucun texte additionnel.`;

    const response = await chatCompletions('openai', {
      messages: [
        {
          role: "system",
          content: "Tu es un expert en SEO et en rédaction de contenu pour le marché marocain de l'emploi. Tu génères du contenu optimisé, original et pertinent."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 4000
    });

    if (!response.ok) {
      throw new Error(`Erreur API OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Aucune réponse de OpenAI');
    }

    // Nettoyer la réponse des backticks markdown si présents
    const cleanedResponse = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      console.log('Réponse brute:', content);
      throw new Error('Réponse JSON invalide de OpenAI');
    }

  } catch (error) {
    console.error('Erreur génération landing page:', error);
    throw error;
  }
} 