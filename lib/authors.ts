const BASE_URL = "https://www.interactjob.ma";

export interface Author {
  slug: string;
  name: string;
  jobTitle: string;
  bio: string;
  url: string;
  image: string;
  sameAs: string[];
  /** Schema.org Person @id — used in Article + BlogPosting schemas */
  schemaId: string;
}

export const AUTHORS: Record<string, Author> = {
  "adil-drouz": {
    slug: "adil-drouz",
    name: "Adil Drouz",
    jobTitle: "Expert RH & Recrutement",
    bio: "Fondateur d'InteractJob et expert en recrutement avec plus de 10 ans d'expérience dans les ressources humaines au Maroc. Adil accompagne les candidats et les entreprises dans leurs démarches emploi : rédaction de CV, préparation aux entretiens, stratégie de recrutement et veille sur le marché du travail marocain.",
    url: `${BASE_URL}/auteurs/adil-drouz`,
    image: `${BASE_URL}/InteractJob-Logo.png`,
    sameAs: [
      "https://www.linkedin.com/in/adildrouz/",
      `${BASE_URL}/a-propos`,
    ],
    schemaId: `${BASE_URL}/#author-adil-drouz`,
  },
};

export function getAuthorSchema(slug: string) {
  const a = AUTHORS[slug];
  if (!a) return null;
  return {
    "@type": "Person",
    "@id": a.schemaId,
    name: a.name,
    jobTitle: a.jobTitle,
    description: a.bio,
    url: a.url,
    image: { "@type": "ImageObject", url: a.image },
    sameAs: a.sameAs,
    worksFor: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "InteractJob",
    },
  };
}
