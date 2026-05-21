import type { PersonalityType } from '@/types/personality';

export interface ProfileMeta {
  summary: string;
  strengths: string[];
}

export const PROFILES: Record<PersonalityType, ProfileMeta> = {
  VISIONARY_LEADER: {
    summary: 'Vous êtes un leader naturel doté d\'une vision stratégique claire. Vous inspirez et mobilisez les équipes avec aisance, et excellez dans les environnements où votre capacité à anticiper fait la différence. Votre profil est particulièrement adapté aux rôles de direction, d\'entrepreneuriat et de management stratégique.',
    strengths: ['Vision stratégique', 'Leadership', 'Prise de décision', 'Influence'],
  },
  DYNAMIC_INFLUENCER: {
    summary: 'Vous possédez un charisme naturel qui vous permet de convaincre et d\'inspirer votre entourage. Votre énergie communicative crée une dynamique positive dans tous les groupes. Vous êtes dans votre élément dans les fonctions commerciales, la communication, le marketing et la gestion de communautés.',
    strengths: ['Charisme', 'Communication', 'Persuasion', 'Créativité'],
  },
  SUPPORTIVE_ANCHOR: {
    summary: 'Vous êtes le pilier sur lequel les équipes s\'appuient dans les moments difficiles. Votre fiabilité, votre empathie et votre sens du soutien créent des environnements de travail stables et harmonieux. Vous excellez dans les rôles de coordination, de ressources humaines et de gestion de projet.',
    strengths: ['Fiabilité', 'Empathie', 'Coopération', 'Stabilité'],
  },
  STRATEGIC_ANALYST: {
    summary: 'Vous transformez des données complexes en décisions claires et pertinentes. Votre rigueur analytique et votre attention aux détails font de vous un atout inestimable dans tout projet exigeant de la précision. Vous êtes particulièrement efficace dans la finance, l\'analyse de données, l\'ingénierie et la recherche.',
    strengths: ['Analyse', 'Rigueur', 'Précision', 'Résolution de problèmes'],
  },
  INSPIRING_COMMANDER: {
    summary: 'Vous combinez un leadership affirmé avec une capacité remarquable à rallier les personnes autour de votre vision. Vous prenez des décisions avec confiance tout en restant attentif à l\'humain. Vous vous épanouissez dans des rôles de direction opérationnelle, de gestion d\'équipes et de projets ambitieux.',
    strengths: ['Leadership', 'Charisme', 'Décision', 'Mobilisation'],
  },
  METHODICAL_LEADER: {
    summary: 'Vous bâtissez des résultats durables grâce à une exécution disciplinée et méthodique. Vous combinez la rigueur analytique avec une capacité à guider les équipes vers leurs objectifs. Vous excellez dans la gestion de projets complexes, le management et les rôles qui exigent précision et leadership.',
    strengths: ['Méthode', 'Leadership', 'Organisation', 'Fiabilité'],
  },
  EMPOWERED_BUILDER: {
    summary: 'Vous créez de la valeur durable en alliant leadership humain et sens du travail bien fait. Votre approche team-first génère des environnements de travail épanouissants et productifs. Vous êtes particulièrement performant dans la gestion de projets, le management intermédiaire et les rôles de développement d\'équipes.',
    strengths: ['Esprit d\'équipe', 'Leadership', 'Construction', 'Engagement'],
  },
  HARMONIOUS_ENERGIZER: {
    summary: 'Vous apportez chaleur, énergie et cohésion à chaque groupe que vous rejoignez. Votre capacité à connecter les personnes et à maintenir une atmosphère positive est un avantage concurrentiel rare. Vous brillez dans les fonctions liées aux ressources humaines, à la communication interne, à la formation et au coaching.',
    strengths: ['Harmonie', 'Énergie', 'Connexion', 'Motivation'],
  },
  CREATIVE_STRATEGIST: {
    summary: 'Vous concevez des solutions innovantes avec une précision analytique remarquable. Votre capacité à penser en dehors des sentiers battus tout en restant ancré dans les données fait de vous un profil rare et très recherché. Vous excellez dans le conseil, l\'innovation, le marketing stratégique et le développement produit.',
    strengths: ['Créativité', 'Stratégie', 'Innovation', 'Analyse'],
  },
  RELIABLE_ARCHITECT: {
    summary: 'Vous concevez des systèmes et des processus en lesquels les équipes peuvent avoir confiance. Votre rigueur, votre fiabilité et votre sens de l\'organisation créent des structures solides et pérennes. Vous êtes dans votre élément dans les fonctions d\'ingénierie, de qualité, d\'opérations et d\'architecture système.',
    strengths: ['Fiabilité', 'Architecture', 'Rigueur', 'Organisation'],
  },
  ADAPTIVE_PROFESSIONAL: {
    summary: 'Vous avez la rare capacité de lire les situations et d\'adapter votre style en conséquence. Cette flexibilité vous rend efficace dans des environnements changeants et des équipes diverses. Vous vous épanouissez dans des rôles qui demandent polyvalence, gestion du changement et intelligence situationnelle.',
    strengths: ['Adaptabilité', 'Polyvalence', 'Intelligence situationnelle', 'Flexibilité'],
  },
};
