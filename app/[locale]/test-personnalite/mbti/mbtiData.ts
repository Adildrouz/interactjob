export type Dichotomy = "EI" | "SN" | "TF" | "JP";

export type MBTIQuestion = {
  axis: Dichotomy;
  text: string;
  // optionA maps to the first letter of the axis (E/S/T/J),
  // optionB maps to the second (I/N/F/P)
  a: string;
  b: string;
};

export type MBTIType = {
  name: string;
  tagline: string;
  description: string[]; // 4 paragraphs
  strengths: string[]; // 5
  weaknesses: string[]; // 4
  careers: string[]; // 6
  famous: string[]; // 3
  color: string;
};

// 60 questions: 15 per axis
const EI: [string, string, string][] = [
  ["En soirée, vous préférez…", "Rencontrer plein de nouvelles personnes", "Discuter en profondeur avec quelques proches"],
  ["Après une longue journée, vous vous ressourcez en…", "Sortant voir des amis", "Restant seul au calme"],
  ["Au travail, vous êtes plus efficace…", "En équipe et à l'oral", "Seul, en réfléchissant"],
  ["On vous décrit souvent comme…", "Sociable et expressif", "Réservé et posé"],
  ["Face à un problème, vous avez tendance à…", "En parler autour de vous", "Y réfléchir intérieurement"],
  ["Dans un groupe, vous…", "Prenez facilement la parole", "Attendez le bon moment"],
  ["Vous préférez un week-end…", "Rempli d'activités sociales", "Calme et reposant"],
  ["Les nouvelles rencontres vous…", "Stimulent", "Fatiguent un peu"],
  ["Vous pensez mieux…", "En parlant à voix haute", "En silence"],
  ["Votre énergie vient surtout…", "Des autres", "De vous-même"],
  ["En réunion, vous…", "Intervenez spontanément", "Préférez écouter"],
  ["Vous vous sentez à l'aise…", "Au centre de l'attention", "En retrait"],
  ["Pour décompresser, vous…", "Appelez quelqu'un", "Profitez d'un moment solo"],
  ["Votre cercle d'amis est plutôt…", "Large et varié", "Restreint mais proche"],
  ["Le télétravail prolongé vous…", "Manque de contact", "Convient très bien"],
];

const SN: [string, string, string][] = [
  ["Vous faites davantage confiance à…", "Vos expériences concrètes", "Votre intuition"],
  ["Vous êtes plus attiré par…", "Les faits et détails", "Les idées et possibilités"],
  ["On vous décrit comme…", "Pragmatique", "Imaginatif"],
  ["Pour apprendre, vous préférez…", "Des exemples concrets", "Des concepts abstraits"],
  ["Vous remarquez surtout…", "Ce qui est, ici et maintenant", "Ce qui pourrait être"],
  ["Vos décisions reposent sur…", "Le réel et le vécu", "Les schémas et le sens"],
  ["Vous préférez les tâches…", "Précises et définies", "Ouvertes et créatives"],
  ["Vous êtes plus à l'aise avec…", "Les procédures établies", "Les nouvelles approches"],
  ["Une bonne idée doit d'abord être…", "Réaliste", "Originale"],
  ["Vous vous fiez à…", "Ce que vous observez", "Ce que vous pressentez"],
  ["Les détails vous semblent…", "Essentiels", "Parfois secondaires"],
  ["Vous parlez plutôt de…", "Faits concrets", "Concepts et théories"],
  ["Votre regard se porte sur…", "Le présent", "L'avenir"],
  ["Vous appréciez les explications…", "Étape par étape", "Vue d'ensemble"],
  ["Le changement vous semble…", "À encadrer prudemment", "Source d'opportunités"],
];

const TF: [string, string, string][] = [
  ["Pour décider, vous privilégiez…", "La logique", "Les sentiments"],
  ["On vous décrit comme…", "Objectif", "Empathique"],
  ["Un bon argument est avant tout…", "Cohérent", "Bienveillant"],
  ["En cas de conflit, vous cherchez…", "La solution juste", "L'harmonie"],
  ["Vous accordez plus d'importance à…", "L'équité", "La compassion"],
  ["Critiquer un travail vous semble…", "Normal et utile", "Délicat"],
  ["Vous jugez surtout sur…", "Les principes", "Les personnes"],
  ["On vous reproche parfois d'être…", "Trop direct", "Trop sensible"],
  ["Une décision difficile se prend avec…", "La tête", "Le cœur"],
  ["Vous valorisez chez les autres…", "La compétence", "La gentillesse"],
  ["Face à une erreur, vous pensez d'abord à…", "La corriger", "Rassurer la personne"],
  ["Vous préférez un manager…", "Juste et rigoureux", "Attentionné et humain"],
  ["Vos choix sont guidés par…", "L'analyse", "Les valeurs"],
  ["Pour vous, il vaut mieux…", "Dire la vérité même si ça blesse", "Ménager les sentiments d'abord"],
  ["Vous tranchez un débat par…", "Les faits", "Le consensus"],
];

const JP: [string, string, string][] = [
  ["Vous préférez…", "Planifier à l'avance", "Garder vos options ouvertes"],
  ["Votre espace de travail est plutôt…", "Organisé", "Flexible"],
  ["Les délais sont pour vous…", "À respecter strictement", "Indicatifs"],
  ["Vous vous sentez mieux quand…", "Les choses sont décidées", "Tout reste possible"],
  ["Vous abordez un projet en…", "Suivant un plan", "Improvisant au besoin"],
  ["Les listes de tâches vous…", "Rassurent", "Contraignent"],
  ["Vous prenez vos décisions…", "Tôt et fermement", "Le plus tard possible"],
  ["Votre emploi du temps est…", "Structuré", "Souple"],
  ["Le changement de dernière minute vous…", "Dérange", "Convient"],
  ["Vous aimez que les choses soient…", "Réglées", "Spontanées"],
  ["Avant de partir en voyage, vous…", "Préparez tout", "Voyez sur place"],
  ["Vous travaillez mieux…", "Avec une échéance claire", "Sous la pression du moment"],
  ["Une journée idéale est…", "Bien planifiée", "Libre et ouverte"],
  ["Vous terminez vos tâches…", "En avance", "Au dernier moment"],
  ["Face aux règles, vous êtes…", "Respectueux du cadre", "Adaptable"],
];

function build(axis: Dichotomy, rows: [string, string, string][]): MBTIQuestion[] {
  return rows.map(([text, a, b]) => ({ axis, text, a, b }));
}

export const MBTI_QUESTIONS: MBTIQuestion[] = [
  ...build("EI", EI),
  ...build("SN", SN),
  ...build("TF", TF),
  ...build("JP", JP),
];

export const MBTI_TYPES: Record<string, MBTIType> = {
  INTJ: {
    name: "L'Architecte",
    tagline: "Stratège imaginatif, tout est planifié.",
    description: [
      "Les INTJ sont des penseurs stratégiques, animés par une vision claire de l'avenir. Ils analysent les systèmes complexes pour les améliorer.",
      "Indépendants et déterminés, ils font confiance à leur logique et à leur intuition plus qu'aux opinions reçues.",
      "Au travail, ils excellent dans la conception de plans à long terme et la résolution de problèmes abstraits.",
      "Leur exigence élevée envers eux-mêmes et les autres en fait des moteurs d'innovation, parfois perçus comme distants.",
    ],
    strengths: ["Vision stratégique", "Esprit analytique", "Autonomie", "Détermination", "Capacité d'innovation"],
    weaknesses: ["Trop critique", "Impatient face à l'inefficacité", "Difficulté à exprimer ses émotions", "Perfectionnisme"],
    careers: ["Architecte", "Ingénieur", "Chercheur scientifique", "Stratège d'entreprise", "Data scientist", "Consultant"],
    famous: ["Elon Musk", "Isaac Newton", "Michelle Obama"],
    color: "#5E35B1",
  },
  INTP: {
    name: "Le Logicien",
    tagline: "Innovateur curieux, assoiffé de connaissance.",
    description: [
      "Les INTP sont des esprits curieux qui aiment décortiquer les idées et explorer les théories.",
      "Ils valorisent la cohérence intellectuelle et remettent volontiers en question les évidences.",
      "Au travail, ils brillent dans l'analyse, la recherche et la conceptualisation de solutions originales.",
      "Plus à l'aise avec les idées qu'avec la routine, ils peuvent négliger les aspects pratiques du quotidien.",
    ],
    strengths: ["Pensée analytique", "Créativité conceptuelle", "Objectivité", "Curiosité", "Honnêteté intellectuelle"],
    weaknesses: ["Procrastination", "Difficulté à finaliser", "Distrait", "Peu attentif aux émotions"],
    careers: ["Développeur", "Chercheur", "Mathématicien", "Analyste", "Philosophe", "Architecte logiciel"],
    famous: ["Albert Einstein", "Bill Gates", "Marie Curie"],
    color: "#5E35B1",
  },
  ENTJ: {
    name: "Le Commandant",
    tagline: "Leader audacieux, rien ne lui résiste.",
    description: [
      "Les ENTJ sont des leaders nés, organisés et orientés vers les résultats.",
      "Ils savent mobiliser les équipes autour d'objectifs ambitieux.",
      "Au travail, ils excellent dans la direction, la stratégie et la prise de décision rapide.",
      "Leur assurance peut être perçue comme de l'autoritarisme s'ils n'écoutent pas suffisamment.",
    ],
    strengths: ["Leadership", "Efficacité", "Esprit stratégique", "Confiance", "Charisme"],
    weaknesses: ["Impatient", "Autoritaire", "Intolérant à l'erreur", "Peu sensible"],
    careers: ["Directeur général", "Entrepreneur", "Avocat", "Manager", "Consultant", "Chef de projet"],
    famous: ["Steve Jobs", "Margaret Thatcher", "Gordon Ramsay"],
    color: "#5E35B1",
  },
  ENTP: {
    name: "L'Innovateur",
    tagline: "Débatteur malin, adore les défis intellectuels.",
    description: [
      "Les ENTP sont des esprits vifs qui adorent débattre et explorer de nouvelles possibilités.",
      "Ils remettent en question le statu quo et génèrent des idées en permanence.",
      "Au travail, ils excellent dans l'innovation, la vente d'idées et la résolution créative de problèmes.",
      "Leur goût du changement peut nuire à la constance et au suivi des projets.",
    ],
    strengths: ["Créativité", "Aisance verbale", "Adaptabilité", "Esprit vif", "Enthousiasme"],
    weaknesses: ["Dispersé", "Argumentatif", "Difficulté à finir", "Insensible aux détails"],
    careers: ["Entrepreneur", "Avocat", "Consultant", "Publicitaire", "Inventeur", "Chef produit"],
    famous: ["Thomas Edison", "Walt Disney", "Leonardo da Vinci"],
    color: "#5E35B1",
  },
  INFJ: {
    name: "L'Avocat",
    tagline: "Idéaliste discret, guidé par ses convictions.",
    description: [
      "Les INFJ sont des idéalistes profonds, animés par le désir d'aider les autres.",
      "Intuitifs et empathiques, ils perçoivent les motivations cachées des gens.",
      "Au travail, ils excellent dans l'accompagnement, le conseil et les missions porteuses de sens.",
      "Leur quête de perfection et leur sensibilité peuvent les épuiser s'ils ne se protègent pas.",
    ],
    strengths: ["Empathie profonde", "Vision", "Détermination", "Créativité", "Sens de l'écoute"],
    weaknesses: ["Trop perfectionniste", "Sensible à la critique", "Tendance au surmenage", "Réservé"],
    careers: ["Psychologue", "Conseiller", "Écrivain", "RH", "Médecin", "Enseignant"],
    famous: ["Nelson Mandela", "Mère Teresa", "Martin Luther King"],
    color: "#00897B",
  },
  INFP: {
    name: "Le Médiateur",
    tagline: "Rêveur altruiste, fidèle à ses valeurs.",
    description: [
      "Les INFP sont des idéalistes guidés par des valeurs fortes et une grande imagination.",
      "Ils cherchent l'authenticité et l'harmonie dans tout ce qu'ils entreprennent.",
      "Au travail, ils s'épanouissent dans les métiers créatifs ou tournés vers l'humain.",
      "Leur idéalisme peut se heurter aux réalités pratiques et à l'autocritique.",
    ],
    strengths: ["Créativité", "Empathie", "Idéalisme", "Ouverture d'esprit", "Loyauté"],
    weaknesses: ["Trop idéaliste", "Difficulté à se concentrer sur le concret", "Autocritique", "Sensible"],
    careers: ["Écrivain", "Artiste", "Psychologue", "Travailleur social", "Designer", "Traducteur"],
    famous: ["William Shakespeare", "J.R.R. Tolkien", "Björk"],
    color: "#00897B",
  },
  ENFJ: {
    name: "Le Protagoniste",
    tagline: "Leader charismatique, inspire les autres.",
    description: [
      "Les ENFJ sont des leaders inspirants, attentifs au bien-être de leur entourage.",
      "Charismatiques et altruistes, ils savent fédérer autour d'une vision commune.",
      "Au travail, ils excellent dans le management humain, l'enseignement et la communication.",
      "Leur dévouement peut les amener à négliger leurs propres besoins.",
    ],
    strengths: ["Charisme", "Empathie", "Leadership", "Communication", "Altruisme"],
    weaknesses: ["Trop idéaliste", "Sensible à la critique", "S'oublie pour les autres", "Indécis sous pression"],
    careers: ["Manager", "Enseignant", "Coach", "RH", "Politicien", "Formateur"],
    famous: ["Barack Obama", "Oprah Winfrey", "Nelson Mandela"],
    color: "#00897B",
  },
  ENFP: {
    name: "L'Inspirateur",
    tagline: "Esprit libre, enthousiaste et créatif.",
    description: [
      "Les ENFP sont des esprits enthousiastes, créatifs et chaleureux.",
      "Ils débordent d'idées et adorent connecter les gens entre eux.",
      "Au travail, ils brillent dans les métiers créatifs, relationnels et entrepreneuriaux.",
      "Leur énergie peut se disperser et leur enthousiasme retomber face à la routine.",
    ],
    strengths: ["Enthousiasme", "Créativité", "Empathie", "Aisance sociale", "Curiosité"],
    weaknesses: ["Dispersé", "Difficulté à se concentrer", "Sensible au stress", "Procrastination"],
    careers: ["Journaliste", "Publicitaire", "Coach", "Entrepreneur", "Animateur", "Chargé de communication"],
    famous: ["Robin Williams", "Walt Disney", "Ellen DeGeneres"],
    color: "#00897B",
  },
  ISTJ: {
    name: "Le Logisticien",
    tagline: "Fiable et méthodique, le sens du devoir.",
    description: [
      "Les ISTJ sont des personnes fiables, organisées et respectueuses des règles.",
      "Ils valorisent la tradition, la rigueur et la responsabilité.",
      "Au travail, ils excellent dans les fonctions structurées exigeant précision et constance.",
      "Leur attachement aux procédures peut les rendre rigides face au changement.",
    ],
    strengths: ["Fiabilité", "Sens du devoir", "Rigueur", "Patience", "Sens pratique"],
    weaknesses: ["Rigidité", "Résistance au changement", "Trop critique", "Difficulté à déléguer"],
    careers: ["Comptable", "Auditeur", "Juriste", "Administrateur", "Logisticien", "Ingénieur qualité"],
    famous: ["Angela Merkel", "George Washington", "Warren Buffett"],
    color: "#1565C0",
  },
  ISFJ: {
    name: "Le Défenseur",
    tagline: "Protecteur dévoué, toujours prêt à aider.",
    description: [
      "Les ISFJ sont des personnes chaleureuses, loyales et dévouées.",
      "Ils prennent soin des autres avec discrétion et constance.",
      "Au travail, ils excellent dans les métiers du soin, du service et du support.",
      "Leur altruisme peut les amener à se sacrifier et à éviter les conflits.",
    ],
    strengths: ["Loyauté", "Sens du service", "Patience", "Fiabilité", "Attention aux autres"],
    weaknesses: ["S'oublie pour les autres", "Évite les conflits", "Sensible à la critique", "Résistance au changement"],
    careers: ["Infirmier", "Enseignant", "Assistant administratif", "RH", "Travailleur social", "Bibliothécaire"],
    famous: ["Mère Teresa", "Kate Middleton", "Rosa Parks"],
    color: "#1565C0",
  },
  ESTJ: {
    name: "Le Directeur",
    tagline: "Organisateur né, gère et structure tout.",
    description: [
      "Les ESTJ sont des organisateurs efficaces, orientés vers l'action et les résultats.",
      "Ils valorisent l'ordre, la tradition et la clarté des responsabilités.",
      "Au travail, ils excellent dans la gestion d'équipes et de processus.",
      "Leur fermeté peut être perçue comme de l'inflexibilité.",
    ],
    strengths: ["Organisation", "Leadership", "Sens des responsabilités", "Détermination", "Loyauté"],
    weaknesses: ["Rigide", "Impatient", "Peu sensible aux émotions", "Autoritaire"],
    careers: ["Manager", "Chef de projet", "Officier", "Directeur des opérations", "Banquier", "Juge"],
    famous: ["Henry Ford", "Sonia Sotomayor", "John D. Rockefeller"],
    color: "#1565C0",
  },
  ESFJ: {
    name: "Le Consul",
    tagline: "Hôte attentionné, soucieux de l'harmonie.",
    description: [
      "Les ESFJ sont des personnes sociables, attentionnées et serviables.",
      "Ils accordent une grande importance à l'harmonie et aux relations.",
      "Au travail, ils excellent dans les métiers relationnels et de coordination.",
      "Leur besoin d'approbation peut les rendre sensibles aux critiques.",
    ],
    strengths: ["Sens du contact", "Loyauté", "Organisation", "Empathie", "Sens pratique"],
    weaknesses: ["Besoin d'approbation", "Évite les conflits", "Sensible à la critique", "Inflexible parfois"],
    careers: ["RH", "Commercial", "Enseignant", "Infirmier", "Événementiel", "Chargé de clientèle"],
    famous: ["Taylor Swift", "Bill Clinton", "Jennifer Garner"],
    color: "#1565C0",
  },
  ISTP: {
    name: "Le Virtuose",
    tagline: "Bricoleur audacieux, maître des outils.",
    description: [
      "Les ISTP sont des esprits pratiques qui aiment comprendre comment les choses fonctionnent.",
      "Indépendants et calmes, ils résolvent les problèmes concrets avec efficacité.",
      "Au travail, ils excellent dans la technique, la mécanique et les situations d'urgence.",
      "Leur goût de la liberté peut les rendre réticents aux règles rigides.",
    ],
    strengths: ["Sens pratique", "Calme sous pression", "Adaptabilité", "Logique", "Habileté technique"],
    weaknesses: ["Réticent aux règles", "Réservé émotionnellement", "S'ennuie vite", "Impulsif"],
    careers: ["Mécanicien", "Ingénieur", "Pilote", "Technicien", "Chirurgien", "Développeur"],
    famous: ["Clint Eastwood", "Michael Jordan", "Bear Grylls"],
    color: "#EF6C00",
  },
  ISFP: {
    name: "L'Aventurier",
    tagline: "Artiste sensible, vit l'instant présent.",
    description: [
      "Les ISFP sont des esprits artistiques, sensibles et tournés vers l'expérience.",
      "Ils valorisent la liberté, la beauté et l'authenticité.",
      "Au travail, ils s'épanouissent dans les métiers créatifs et concrets.",
      "Leur spontanéité peut compliquer la planification à long terme.",
    ],
    strengths: ["Créativité", "Sensibilité", "Adaptabilité", "Sens esthétique", "Chaleur humaine"],
    weaknesses: ["Difficulté à planifier", "Évite les conflits", "Trop indépendant", "Sensible au stress"],
    careers: ["Designer", "Photographe", "Cuisinier", "Artisan", "Vétérinaire", "Musicien"],
    famous: ["Frida Kahlo", "David Bowie", "Michael Jackson"],
    color: "#EF6C00",
  },
  ESTP: {
    name: "L'Entrepreneur",
    tagline: "Fonceur énergique, aime l'action et le risque.",
    description: [
      "Les ESTP sont des personnes énergiques, pragmatiques et amatrices d'action.",
      "Ils excellent dans la prise de décision rapide et l'adaptation immédiate.",
      "Au travail, ils brillent dans la vente, la négociation et les environnements dynamiques.",
      "Leur goût du risque peut les pousser à négliger les conséquences à long terme.",
    ],
    strengths: ["Réactivité", "Pragmatisme", "Audace", "Aisance sociale", "Sens de la persuasion"],
    weaknesses: ["Impulsif", "Impatient", "Aversion pour la routine", "Peu attentif aux détails"],
    careers: ["Commercial", "Entrepreneur", "Négociateur", "Sportif", "Agent immobilier", "Chef de chantier"],
    famous: ["Donald Trump", "Madonna", "Ernest Hemingway"],
    color: "#EF6C00",
  },
  ESFP: {
    name: "L'Amuseur",
    tagline: "Animateur spontané, la vie est une fête.",
    description: [
      "Les ESFP sont des personnes joyeuses, spontanées et chaleureuses.",
      "Ils adorent divertir, partager et vivre le moment présent.",
      "Au travail, ils excellent dans les métiers relationnels et créatifs.",
      "Leur spontanéité peut nuire à l'organisation et à la planification.",
    ],
    strengths: ["Enthousiasme", "Sens du contact", "Créativité", "Adaptabilité", "Générosité"],
    weaknesses: ["Difficulté à planifier", "Distrait", "Sensible à la critique", "Impulsif"],
    careers: ["Animateur", "Acteur", "Commercial", "Événementiel", "Coach sportif", "Hôtellerie"],
    famous: ["Marilyn Monroe", "Elvis Presley", "Adele"],
    color: "#EF6C00",
  },
};

export type AxisScores = { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number };
