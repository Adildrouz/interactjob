import type { PersonalityType } from '@/types/personality';

export interface ProfileMeta {
  summary: string;
  strengths: string[];
  sectors: string[];
  reportTeaser: string;
}

export const PROFILES: Record<PersonalityType, ProfileMeta> = {
  VISIONARY_LEADER: {
    summary: 'Vous êtes un leader naturel doté d\'une vision stratégique claire. Vous inspirez et mobilisez les équipes avec aisance, et excellez dans les environnements où votre capacité à anticiper fait la différence. Votre profil est particulièrement adapté aux rôles de direction, d\'entrepreneuriat et de management stratégique.',
    strengths: ['Vision stratégique', 'Leadership', 'Prise de décision', 'Influence'],
    sectors: ['Direction générale', 'Entrepreneuriat', 'Conseil stratégique', 'Management'],
    reportTeaser: 'En tant que Leader Visionnaire, vous incarnez l\'un des profils les plus rares et les plus recherchés sur le marché du travail. Votre capacité à projeter une vision claire tout en mobilisant les équipes autour d\'objectifs communs vous positionne naturellement comme référence dans vos environnements professionnels. Votre rapport détaillé révèle comment exploiter ce potentiel dans...',
  },
  DYNAMIC_INFLUENCER: {
    summary: 'Vous possédez un charisme naturel qui vous permet de convaincre et d\'inspirer votre entourage. Votre énergie communicative crée une dynamique positive dans tous les groupes. Vous êtes dans votre élément dans les fonctions commerciales, la communication, le marketing et la gestion de communautés.',
    strengths: ['Charisme', 'Communication', 'Persuasion', 'Créativité'],
    sectors: ['Commercial', 'Marketing', 'Communication', 'Relations publiques'],
    reportTeaser: 'En tant qu\'Influenceur Dynamique, vous disposez d\'un atout professionnel exceptionnel : la capacité naturelle à connecter avec n\'importe quel interlocuteur et à transformer un échange en opportunité. Votre énergie communicative est un avantage concurrentiel que peu de professionnels possèdent. Votre rapport complet détaille comment amplifier ce pouvoir dans...',
  },
  SUPPORTIVE_ANCHOR: {
    summary: 'Vous êtes le pilier sur lequel les équipes s\'appuient dans les moments difficiles. Votre fiabilité, votre empathie et votre sens du soutien créent des environnements de travail stables et harmonieux. Vous excellez dans les rôles de coordination, de ressources humaines et de gestion de projet.',
    strengths: ['Fiabilité', 'Empathie', 'Coopération', 'Stabilité'],
    sectors: ['Ressources humaines', 'Gestion de projet', 'Coordination', 'Service client'],
    reportTeaser: 'En tant qu\'Ancre Bienveillante, vous représentez le profil que chaque équipe performante cherche désespérément. Votre capacité à maintenir la cohésion sous pression et à soutenir vos collègues avec une empathie authentique crée une valeur ajoutée que les chiffres ne capturent pas toujours. Votre rapport détaille précisément comment valoriser cette force dans...',
  },
  STRATEGIC_ANALYST: {
    summary: 'Vous transformez des données complexes en décisions claires et pertinentes. Votre rigueur analytique et votre attention aux détails font de vous un atout inestimable dans tout projet exigeant de la précision. Vous êtes particulièrement efficace dans la finance, l\'analyse de données, l\'ingénierie et la recherche.',
    strengths: ['Analyse', 'Rigueur', 'Précision', 'Résolution de problèmes'],
    sectors: ['Finance', 'Data & Analyse', 'Ingénierie', 'Recherche & Développement'],
    reportTeaser: 'En tant qu\'Analyste Stratégique, vous possédez une capacité rare à démêler la complexité et à en extraire des décisions pertinentes. Dans un monde saturé d\'informations, ce profil est devenu l\'un des plus valorisés par les organisations. Votre rapport complet révèle comment positionner cette rigueur analytique pour accélérer votre carrière dans...',
  },
  INSPIRING_COMMANDER: {
    summary: 'Vous combinez un leadership affirmé avec une capacité remarquable à rallier les personnes autour de votre vision. Vous prenez des décisions avec confiance tout en restant attentif à l\'humain. Vous vous épanouissez dans des rôles de direction opérationnelle, de gestion d\'équipes et de projets ambitieux.',
    strengths: ['Leadership', 'Charisme', 'Décision', 'Mobilisation'],
    sectors: ['Direction opérationnelle', 'Management', 'Startups', 'Gestion de projet'],
    reportTeaser: 'En tant que Commandant Inspirant, vous possédez la combinaison la plus puissante en leadership : la force de décision d\'un dirigeant et le magnétisme d\'un rassembleur. Ce profil hybride, à la fois stratège et humain, est celui que les organisations cherchent pour piloter leurs transformations critiques. Votre rapport révèle comment...',
  },
  METHODICAL_LEADER: {
    summary: 'Vous bâtissez des résultats durables grâce à une exécution disciplinée et méthodique. Vous combinez la rigueur analytique avec une capacité à guider les équipes vers leurs objectifs. Vous excellez dans la gestion de projets complexes, le management et les rôles qui exigent précision et leadership.',
    strengths: ['Méthode', 'Leadership', 'Organisation', 'Fiabilité'],
    sectors: ['Gestion de projet', 'Ingénierie', 'Opérations', 'Qualité'],
    reportTeaser: 'En tant que Leader Méthodique, vous représentez le profil sur lequel les organisations s\'appuient pour transformer les ambitions en résultats concrets. Là où d\'autres voient de la complexité, vous voyez un processus à structurer. Cette combinaison de rigueur et de leadership fait de vous un atout irremplaçable dans...',
  },
  EMPOWERED_BUILDER: {
    summary: 'Vous créez de la valeur durable en alliant leadership humain et sens du travail bien fait. Votre approche team-first génère des environnements de travail épanouissants et productifs. Vous êtes particulièrement performant dans la gestion de projets, le management intermédiaire et les rôles de développement d\'équipes.',
    strengths: ['Esprit d\'équipe', 'Leadership', 'Construction', 'Engagement'],
    sectors: ['Management intermédiaire', 'Ressources humaines', 'Opérations', 'Formation'],
    reportTeaser: 'En tant que Bâtisseur Engagé, vous incarnez le type de leader dont les équipes se souviennent toute leur carrière. Votre approche centrée sur les personnes, combinée à un sens aigu du résultat, crée des environnements où performance et bien-être coexistent. Votre rapport analyse en profondeur comment capitaliser sur ce profil pour...',
  },
  HARMONIOUS_ENERGIZER: {
    summary: 'Vous apportez chaleur, énergie et cohésion à chaque groupe que vous rejoignez. Votre capacité à connecter les personnes et à maintenir une atmosphère positive est un avantage concurrentiel rare. Vous brillez dans les fonctions liées aux ressources humaines, à la communication interne, à la formation et au coaching.',
    strengths: ['Harmonie', 'Énergie', 'Connexion', 'Motivation'],
    sectors: ['Ressources humaines', 'Formation & Coaching', 'Communication interne', 'Événementiel'],
    reportTeaser: 'En tant que Dynamiseur Harmonieux, vous possédez le don le plus sous-estimé en milieu professionnel : transformer l\'atmosphère d\'un groupe simplement par votre présence. Ce talent, souvent mal valorisé sur un CV, est pourtant l\'un des facteurs les plus déterminants de la performance collective. Votre rapport détaille comment le monétiser dans...',
  },
  CREATIVE_STRATEGIST: {
    summary: 'Vous concevez des solutions innovantes avec une précision analytique remarquable. Votre capacité à penser en dehors des sentiers battus tout en restant ancré dans les données fait de vous un profil rare et très recherché. Vous excellez dans le conseil, l\'innovation, le marketing stratégique et le développement produit.',
    strengths: ['Créativité', 'Stratégie', 'Innovation', 'Analyse'],
    sectors: ['Conseil', 'Innovation', 'Marketing stratégique', 'Développement produit'],
    reportTeaser: 'En tant que Stratège Créatif, vous représentez le profil T-shaped le plus complet : vous imaginez des solutions que personne d\'autre ne voit, et vous les ancrez dans une réalité analytique solide. Cette dualité créativité-rigueur est extraordinairement rare et constitue votre avantage compétitif majeur. Votre rapport révèle comment...',
  },
  RELIABLE_ARCHITECT: {
    summary: 'Vous concevez des systèmes et des processus en lesquels les équipes peuvent avoir confiance. Votre rigueur, votre fiabilité et votre sens de l\'organisation créent des structures solides et pérennes. Vous êtes dans votre élément dans les fonctions d\'ingénierie, de qualité, d\'opérations et d\'architecture système.',
    strengths: ['Fiabilité', 'Architecture', 'Rigueur', 'Organisation'],
    sectors: ['Ingénierie systèmes', 'Architecture IT', 'Qualité', 'Opérations'],
    reportTeaser: 'En tant qu\'Architecte Fiable, vous incarnez la colonne vertébrale de toute organisation qui dure. Votre capacité à concevoir des systèmes robustes et des processus que tout le monde peut suivre est ce qui sépare les entreprises qui tiennent de celles qui s\'effondrent. Votre rapport analyse en détail comment positionner cette expertise pour...',
  },
  ADAPTIVE_PROFESSIONAL: {
    summary: 'Vous avez la rare capacité de lire les situations et d\'adapter votre style en conséquence. Cette flexibilité vous rend efficace dans des environnements changeants et des équipes diverses. Vous vous épanouissez dans des rôles qui demandent polyvalence, gestion du changement et intelligence situationnelle.',
    strengths: ['Adaptabilité', 'Polyvalence', 'Intelligence situationnelle', 'Flexibilité'],
    sectors: ['Conseil', 'Gestion du changement', 'Management de transition', 'Startups'],
    reportTeaser: 'En tant que Professionnel Adaptable, vous disposez d\'une intelligence situationnelle que la plupart des professionnels développent — si jamais — après des décennies d\'expérience. Votre capacité naturelle à lire l\'environnement et à ajuster votre approche fait de vous un acteur précieux dans les contextes les plus complexes. Votre rapport détaille comment...',
  },
};
