import type { Metadata } from 'next';
import Link from 'next/link';
import jobsData from '@/data/jobs.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  sector: string;
  contractType: string;
  slug: string;
  date_posted?: string;
  postedAt?: string;
  expired: boolean;
}

// ---------------------------------------------------------------------------
// City configuration
// ---------------------------------------------------------------------------
const CITY_CONFIG: Record<
  string,
  { displayName: string; aliases: string[]; intro: string }
> = {
  casablanca: {
    displayName: 'Casablanca',
    aliases: ['casablanca', 'mohammedia'],
    intro:
      "Casablanca, capitale économique du Maroc et plus grande ville du pays, concentre la majorité des opportunités professionnelles à l'échelle nationale. Avec plus de 4,5 millions d'habitants dans l'agglomération, la métropole abrite les sièges sociaux des principaux groupes marocains et internationaux, ainsi qu'un tissu industriel dense. Les secteurs les plus recruteurs incluent la finance, le BTP, le commerce, l'industrie manufacturière (aéronautique, automobile, textile), les services aux entreprises et les nouvelles technologies. Casablanca Finance City (CFC) attire les multinationales cherchant à s'implanter en Afrique, générant une forte demande de profils bilingues et qualifiés. Les zones industrielles d'Ain Sebaâ, Lissasfa, Bouskoura et Nouaceur proposent des milliers de postes techniques chaque année. Le secteur tertiaire — banques, assurances, cabinets de conseil, agences de communication — est particulièrement dynamique dans les quartiers de Maarif, Gauthier et le boulevard Zerktouni. Pour les jeunes diplômés, Casablanca offre les meilleures perspectives d'évolution de carrière au Maroc. InteractJob met à jour quotidiennement toutes les offres d'emploi à Casablanca pour vous connecter directement avec les employeurs.",
  },
  rabat: {
    displayName: 'Rabat',
    aliases: ['rabat'],
    intro:
      "Rabat, capitale administrative du Royaume du Maroc, présente un marché de l'emploi dominé par le secteur public et les institutions gouvernementales, mais qui s'ouvre progressivement au secteur privé et à l'économie numérique. Les ministères, agences gouvernementales et organisations internationales (ONU, Banque mondiale, ambassades) constituent les premiers employeurs de la ville. La ville abrite également plusieurs universités et grandes écoles qui alimentent un vivier de jeunes talents. Le secteur privé se développe rapidement, notamment dans les domaines du digital, de la fintech, de la e-santé et des services aux collectivités. Rabat-Salé-Kénitra bénéficie d'importants programmes d'investissement public qui créent des opportunités dans le BTP, l'ingénierie et la gestion de projets. La technopole de Rabat (Rabat Technopolis) concentre des entreprises IT et des centres d'appels employant plusieurs milliers de personnes. Les profils juridiques, économiques, en sciences politiques et en management public sont particulièrement recherchés. Pour les profils techniques, l'industrie en expansion à Salé et Kénitra offre de nombreuses opportunités. Retrouvez toutes les offres d'emploi à Rabat sur InteractJob, la plateforme marocaine de référence pour votre recherche d'emploi.",
  },
  marrakech: {
    displayName: 'Marrakech',
    aliases: ['marrakech'],
    intro:
      "Marrakech, cité impériale et première destination touristique d'Afrique, offre un marché de l'emploi largement dominé par le secteur du tourisme et de l'hôtellerie, mais qui se diversifie rapidement. Les hôtels de luxe, palaces, riads haut de gamme et resorts internationaux recrutent massivement des profils dans la restauration, la réception, le spa, l'animation et la gestion hôtelière. Le secteur de l'immobilier et du BTP est également très actif, porté par la forte demande en résidences secondaires et projets de développement. Le commerce, la restauration gastronomique et l'artisanat d'art emploient un nombre important de Marrakechi. La ville attire également des startups et entrepreneurs dans l'événementiel, la tech et le tourisme durable. L'aéroport Menara, l'un des plus fréquentés d'Afrique, génère des emplois dans la logistique, le transport et les services aéroportuaires. La nouvelle médina et les quartiers de Guéliz et Hivernage concentrent les sièges des opérateurs touristiques et agences de voyages. Le Festival International du Film et autres événements culturels créent une économie événementielle dynamique. InteractJob recense toutes les offres d'emploi à Marrakech pour vous aider à trouver votre prochaine opportunité.",
  },
  agadir: {
    displayName: 'Agadir',
    aliases: ['agadir'],
    intro:
      "Agadir, métropole du sud marocain et capitale régionale de Souss-Massa, possède un marché de l'emploi articulé autour de trois piliers majeurs : le tourisme balnéaire, la pêche et l'agriculture d'exportation. La ville dispose de l'un des premiers ports de pêche d'Afrique, générant des emplois dans la transformation des produits de la mer, la conserverie et la logistique maritime. Le secteur agricole de la région — cultures maraîchères, agrumes, primeurs — crée une forte demande de main-d'œuvre qualifiée dans l'agro-industrie et l'export. Le tourisme balnéaire est un moteur économique essentiel : les hôtels, résidences touristiques et complexes de loisirs recrutent chaque saison des milliers de collaborateurs. La zone industrielle d'Agadir accueille des unités de production agroalimentaire, pharmaceutique et de matériaux de construction. La ville connaît un développement immobilier soutenu, avec une forte demande dans le BTP et l'architecture. Les profils bilingues français-espagnol-anglais sont très recherchés dans le tourisme et le commerce international. La technopole d'Agadir ambitionne d'attirer des entreprises technologiques et centres de services. Retrouvez toutes les offres d'emploi à Agadir sur InteractJob, mises à jour quotidiennement.",
  },
  fes: {
    displayName: 'Fès',
    aliases: ['fes'],
    intro:
      "Fès, capitale spirituelle et culturelle du Maroc, possède un marché de l'emploi qui conjugue tradition et modernité. La ville est le berceau de l'artisanat marocain de haute qualité — travail du cuir, zellige, broderie, dinanderie — qui emploie des milliers d'artisans et génère une filière d'exportation importante. L'Université Al-Quaraouiyine, la plus ancienne du monde, et ses nombreuses facultés font de Fès une ville universitaire majeure, avec une forte demande d'enseignants et de chercheurs. Le secteur éducatif est l'un des premiers employeurs de la ville. Le tourisme culturel, attiré par la médina classée au patrimoine mondial de l'UNESCO, crée des emplois dans le guidage, l'hôtellerie, la restauration et le transport. La zone industrielle de Sidi Brahim accueille des unités de production agro-alimentaire, chimique et de matériaux. Fès bénéficie d'investissements croissants dans le secteur automobile et aéronautique, avec l'implantation de fournisseurs de rang 2 et 3. Le secteur de la santé et des professions médicales est en fort développement. Les profils en ingénierie, management et langues sont particulièrement valorisés. Consultez toutes les offres d'emploi à Fès sur InteractJob.",
  },
  meknes: {
    displayName: 'Meknès',
    aliases: ['meknes'],
    intro:
      "Meknès, ville impériale nichée au cœur du Maroc, est la capitale de l'agriculture et de l'agro-industrie marocaine. La région Fès-Meknès est l'un des premiers bassins de production agricole du Royaume, avec une spécialisation dans les olives, les céréales, les légumineuses et la viticulture. Les industries de transformation agroalimentaire — huileries, conserveries, caves vinicoles, minoteries — constituent les principaux employeurs industriels. Meknès abrite également une importante garnison militaire et plusieurs grandes écoles militaires, qui génèrent des emplois civils et techniques. Le secteur du commerce est particulièrement actif, avec un marché central qui rayonne sur toute la région. L'artisanat meknassi — broderie, menuiserie, travail du bois — perpétue une tradition séculaire et alimente une filière d'export. La ville est un centre éducatif régional avec l'Université Moulay Ismaïl et ses nombreux établissements d'enseignement supérieur. Le BTP et les travaux publics bénéficient des grands chantiers de rénovation urbaine. Le secteur de la santé est en développement, avec la construction de nouveaux établissements hospitaliers. InteractJob recense toutes les offres d'emploi à Meknès pour faciliter votre recherche dans la région.",
  },
  tanger: {
    displayName: 'Tanger',
    aliases: ['tanger'],
    intro:
      "Tanger, métropole du Nord et porte de l'Afrique vers l'Europe, connaît l'une des croissances économiques les plus dynamiques du Maroc. La ville est le premier hub industriel du Royaume, dopé par l'implantation de Renault, Delphi, Lear Corporation et des centaines d'équipementiers automobiles dans la zone franche de Tanger Med. Le port de Tanger Med, premier port de conteneurs d'Afrique et de la Méditerranée, génère une activité intense dans la logistique, le transit, la manutention et les services portuaires. La zone franche accueille également des unités aéronautiques, textiles, agroalimentaires et électroniques. Le secteur tertiaire est en pleine expansion : banques, assurances, centres de services partagés, call centers notamment pour le marché espagnol. Le tourisme balnéaire et culturel se développe rapidement, attirant visiteurs européens et investisseurs internationaux. Les profils ingénieurs, techniciens, logisticiens et bilingues français-espagnol-anglais sont très recherchés. Tanger attire chaque année des milliers de candidats du Maroc entier en quête d'opportunités dans l'industrie et la logistique. Retrouvez toutes les offres d'emploi à Tanger sur InteractJob, actualisées chaque jour.",
  },
  tetouan: {
    displayName: 'Tétouan',
    aliases: ['tetouan'],
    intro:
      "Tétouan, ville du Nord marocain à 40 km de Tanger, est une cité à l'identité méditerranéenne unique, marquée par son héritage hispano-marocain. Le marché de l'emploi à Tétouan est en mutation profonde, porté par la proximité de Tanger Med et du bassin industriel tangerois. La zone industrielle de Martil et les environs de M'diq accueillent des unités de production textile, agroalimentaire et de matériaux de construction. Le tourisme balnéaire — grâce aux plages de Martil, Cabo Negro et M'diq — génère des emplois dans l'hôtellerie et la restauration, ainsi que des postes permanents dans les grandes résidences touristiques. Le secteur informel et le commerce transfrontalier avec Ceuta constituent une réalité économique importante. L'Université Abdelmalek Essaâdi forme des diplômés dans les sciences, les lettres et le droit. Le secteur de l'enseignement est l'un des premiers employeurs publics de la ville. La construction et l'immobilier connaissent une forte expansion. Les profils hispanisants sont particulièrement valorisés dans cette région. InteractJob vous aide à trouver votre prochaine opportunité à Tétouan et dans la région du Nord du Maroc.",
  },
  kenitra: {
    displayName: 'Kénitra',
    aliases: ['kenitra'],
    intro:
      "Kénitra, ville côtière de l'Atlantique à 40 km de Rabat, est devenue un pôle industriel majeur grâce à l'implantation de PSA (Stellantis) et de son écosystème de sous-traitants automobiles. La plateforme industrielle PSA de Kénitra a attiré plus de 50 équipementiers automobiles dans la zone franche, créant des milliers d'emplois directs et indirects. En dehors de l'automobile, Kénitra dispose d'un tissu industriel diversifié : agro-industrie, chimie, papeterie, textile et industries métallurgiques. La ville est également un important centre agricole, avec une plaine fertile produisant des céréales, des betteraves et des cultures maraîchères. Le port de Kénitra sur l'oued Sebou contribue à l'activité économique régionale. Le secteur de l'enseignement et de la santé est en développement continu. L'Université Ibnou Tofail forme des ingénieurs, médecins et juristes qui alimentent le marché local et national. Les profils techniciens, opérateurs de production et ingénieurs process sont très demandés dans la zone industrielle. Retrouvez toutes les offres d'emploi à Kénitra sur InteractJob, la plateforme de référence pour l'emploi au Maroc.",
  },
  oujda: {
    displayName: 'Oujda',
    aliases: ['oujda'],
    intro:
      "Oujda, métropole de l'Oriental marocain à la frontière algérienne, est la capitale économique et administrative de la région de l'Oriental. Le marché de l'emploi oujdi est dominé par le secteur public — administration territoriale, enseignement, santé — mais connaît une diversification progressive grâce aux investissements dans l'industrie et les services. Les phosphates constituent une richesse naturelle de la région, avec des activités d'extraction et de traitement qui emploient des techniciens et ingénieurs spécialisés. La zone industrielle d'Oujda accueille des unités agroalimentaires, pharmaceutiques et de matériaux de construction. L'Université Mohammed Premier est l'un des plus grands employeurs de la ville et forme chaque année des milliers de diplômés. Le secteur du BTP bénéficie des grands projets d'infrastructure régionaux. La ville connaît un essor du secteur numérique, avec des centres de formation en informatique et des startups locales. Les profils bilingues et trilingues sont particulièrement appréciés pour les postes dans les services et l'export. Le commerce transfrontalier, bien que fragilisé, reste un facteur économique important. InteractJob vous présente toutes les offres d'emploi disponibles à Oujda et dans la région de l'Oriental.",
  },
  mohammedia: {
    displayName: 'Mohammedia',
    aliases: ['mohammedia'],
    intro:
      "Mohammedia, ville côtière entre Casablanca et Kénitra, est connue comme la capitale pétrolière du Maroc. La ville abrite une concentration d'industries chimiques, pétrochimiques et pharmaceutiques qui génèrent des emplois hautement qualifiés dans l'ingénierie de procédés, la maintenance industrielle et la sécurité. Le port de Mohammedia, spécialisé dans les hydrocarbures et les marchandises diverses, est un employeur important dans la manutention et la logistique. La zone industrielle accueille des unités de plasturgie, d'emballage et de transformation métallique. Le secteur du BTP est dynamique, porté par des projets de développement résidentiel et commercial. Mohammedia est réputée pour ses plages et attire une population aisée de Casablanca, générant une économie de services, de restauration et de loisirs. La ville bénéficie de la proximité de Casablanca tout en offrant un coût de vie moindre, ce qui attire des entreprises souhaitant s'installer à moindre coût. Les profils en ingénierie chimique, maintenance et logistique sont les plus recherchés. Retrouvez toutes les offres d'emploi à Mohammedia sur InteractJob, la plateforme de référence pour l'emploi au Maroc.",
  },
  temara: {
    displayName: 'Témara',
    aliases: ['temara'],
    intro:
      "Témara, ville de la région Rabat-Salé-Kénitra, est l'une des communes urbaines à la croissance démographique la plus rapide du Maroc. Ville satellite de Rabat, Témara accueille de nombreuses familles et actifs qui travaillent dans la capitale administrative et recherchent un cadre de vie plus abordable. Le marché de l'emploi à Témara est largement connecté à celui de Rabat, avec de nombreux travailleurs qui font la navette quotidiennement. Les principaux secteurs employeurs sont l'administration locale, l'enseignement, la santé, le commerce de proximité et le BTP. Plusieurs zones d'activité accueillent des PME dans l'industrie légère, l'artisanat et les services. Le secteur de la grande distribution se développe rapidement, avec l'implantation de centres commerciaux et grandes surfaces. L'urbanisation rapide génère une forte demande de services publics et privés — crèches, écoles, cliniques, pharmacies. Les profils en vente, services à la personne, BTP et administration sont particulièrement recherchés. La ville dispose d'établissements d'enseignement secondaire et supérieur qui alimentent le marché local. InteractJob vous propose toutes les offres d'emploi à Témara et dans la région de Rabat-Salé-Kénitra pour faciliter votre recherche.",
  },
  'el-jadida': {
    displayName: 'El Jadida',
    aliases: ['el jadida', 'el-jadida', 'jadida'],
    intro:
      "El Jadida, cité balnéaire de la côte atlantique à 100 km au sud de Casablanca, possède un marché de l'emploi articulé autour de l'industrie chimique, du port, de l'agriculture et du tourisme. L'Office Chérifien des Phosphates (OCP) et ses filiales sont les principaux employeurs industriels de la région, avec d'importantes installations de traitement à Jorf Lasfar. Le complexe industriel de Jorf Lasfar, comprenant un port industriel et des unités de production d'engrais et d'acide phosphorique, génère des milliers d'emplois directs et indirects. La plaine de Doukkala est l'une des plus fertiles du Maroc, avec une production intense de betterave à sucre, céréales et cultures maraîchères qui alimente une industrie agroalimentaire active. Le tourisme balnéaire génère des emplois saisonniers dans les hôtels, restaurants et services de loisirs. La ville historique, avec sa citadelle portugaise classée au patrimoine UNESCO, attire un tourisme culturel en développement. Le BTP est actif grâce aux grands projets d'infrastructure de la région. Les profils chimistes, ingénieurs des procédés et techniciens de maintenance sont très demandés. Consultez toutes les offres d'emploi à El Jadida sur InteractJob.",
  },
  essaouira: {
    displayName: 'Essaouira',
    aliases: ['essaouira'],
    intro:
      "Essaouira, la Ville des Alizés, est une destination magique de la côte atlantique marocaine qui conjugue patrimoine historique, art et tourisme de qualité. Le marché de l'emploi à Essaouira est dominé par le secteur touristique, avec une offre d'hébergements variée allant des maisons d'hôtes de charme aux hôtels boutique branchés. L'artisanat essaouirien — marqueterie de thuya, bijouterie berbère, musique gnaoua — est une filière économique à part entière qui attire collectionneurs et acheteurs du monde entier. Le Festival Gnaoua et Musiques du Monde, l'un des plus grands festivals d'Afrique, génère une économie événementielle importante. La pêche artisanale reste une activité économique fondamentale, avec le port de pêche comme point névralgique de l'économie locale. Le secteur de la restauration gastronomique connaît un essor remarquable, attirant chefs et entrepreneurs culinaires. La communauté internationale d'artistes et d'expatriés vivant à Essaouira génère une demande de services personnalisés et de qualité. Les profils dans le tourisme, la restauration, la communication et la création sont particulièrement valorisés. Retrouvez toutes les offres d'emploi à Essaouira sur InteractJob, votre partenaire emploi au Maroc.",
  },
};

const ALL_CITY_SLUGS = Object.keys(CITY_CONFIG);

// ---------------------------------------------------------------------------
// Helper: normalize a string (strip accents, lowercase, trim)
// ---------------------------------------------------------------------------
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Filter jobs for a given city slug
// ---------------------------------------------------------------------------
function getJobsForCity(citySlug: string): Job[] {
  const config = CITY_CONFIG[citySlug];
  if (!config) return [];

  const aliases = config.aliases; // already normalized

  const jobs = (jobsData as unknown as Job[]).filter((job) => {
    if (job.expired) return false;
    const normalizedCity = normalizeStr(job.city);
    // Check if city matches any alias or contains one
    return aliases.some(
      (alias) =>
        normalizedCity === alias ||
        normalizedCity.includes(alias) ||
        alias.includes(normalizedCity)
    );
  });

  // Sort by most recent
  return jobs.sort(
    (a, b) => new Date(b.date_posted ?? b.postedAt ?? '').getTime() - new Date(a.date_posted ?? a.postedAt ?? '').getTime()
  );
}

// ---------------------------------------------------------------------------
// generateStaticParams
// ---------------------------------------------------------------------------
export function generateStaticParams(): { city: string }[] {
  return ALL_CITY_SLUGS.map((slug) => ({ city: slug }));
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const config = CITY_CONFIG[city];
  if (!config) {
    return { title: 'Offres d\'Emploi — InteractJob.ma' };
  }

  const jobs = getJobsForCity(city);
  const count = jobs.length;
  const { displayName } = config;
  const canonical = `https://www.interactjob.ma/offres-emploi-${city}`;

  return {
    title: `Offres d'Emploi ${displayName} 2026 — InteractJob.ma`,
    description: `Découvrez ${count} offres d'emploi à ${displayName} 2026. CDI, CDD, stage — postes dans tous les secteurs. Postulez directement sur InteractJob.ma`,
    alternates: { canonical },
    openGraph: {
      title: `Offres d'Emploi ${displayName} 2026 — InteractJob.ma`,
      description: `Découvrez ${count} offres d'emploi à ${displayName} 2026. CDI, CDD, stage — postes dans tous les secteurs.`,
      url: canonical,
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

// ---------------------------------------------------------------------------
// Related city links (4 others)
// ---------------------------------------------------------------------------
function getRelatedCities(currentSlug: string): { slug: string; displayName: string }[] {
  return ALL_CITY_SLUGS.filter((s) => s !== currentSlug)
    .slice(0, 4)
    .map((s) => ({ slug: s, displayName: CITY_CONFIG[s].displayName }));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function CityJobsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const config = CITY_CONFIG[city];

  if (!config) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ville introuvable</h1>
          <Link href="/offres" className="text-indigo-400 hover:underline">
            Voir toutes les offres
          </Link>
        </div>
      </main>
    );
  }

  const { displayName, intro } = config;
  const jobs = getJobsForCity(city);
  const count = jobs.length;
  const relatedCities = getRelatedCities(city);

  // Schema.org: simple ItemList of WebPage links (not JobPosting — individual /offres/[slug] pages
  // already have their own JobPosting schemas; embedding them here causes GSC validation failures)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Offres d'Emploi à ${displayName} 2026`,
    url: `https://www.interactjob.ma/offres-emploi-${city}`,
    numberOfItems: count,
    itemListElement: jobs
      .filter((job) => job.slug)
      .slice(0, 50)
      .map((job, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://www.interactjob.ma/offres/${job.slug}`,
        name: job.title,
      })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/offres" className="hover:text-white transition-colors">
            Offres d&apos;Emploi
          </Link>
          <span>/</span>
          <span className="text-white">{displayName}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Offres d&apos;Emploi à {displayName} 2026
          </h1>
          <p className="text-indigo-400 font-semibold text-lg">
            {count} offre{count !== 1 ? 's' : ''} d&apos;emploi disponible{count !== 1 ? 's' : ''} à {displayName}
          </p>
        </header>

        {/* Intro */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 mb-8">
          <p className="text-slate-300 leading-relaxed">{intro}</p>
        </section>

        {/* Jobs list or empty state */}
        {count === 0 ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center mb-8">
            <p className="text-slate-300 mb-4">
              Aucune offre disponible pour l&apos;instant à {displayName}. Consultez nos offres nationales.
            </p>
            <Link
              href="/offres"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-2 font-medium hover:bg-indigo-500 transition-colors"
            >
              Voir toutes les offres
            </Link>
          </section>
        ) : (
          <section className="space-y-4 mb-10">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-base leading-snug mb-1 truncate">
                    {job.title}
                  </h2>
                  <p className="text-slate-400 text-sm mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                      {job.city}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-indigo-900/50 border border-indigo-700/50 px-2.5 py-0.5 text-xs text-indigo-300">
                      {job.contractType}
                    </span>
                    {job.sector && job.sector !== 'Autre' && (
                      <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                        {job.sector}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/offres/${job.slug}`}
                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors text-center"
                >
                  Voir l&apos;offre
                </Link>
              </article>
            ))}
          </section>
        )}

        {/* See also */}
        <section className="border-t border-slate-800 pt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Voir aussi :</h2>
          <div className="flex flex-wrap gap-3">
            {relatedCities.map(({ slug, displayName: relName }) => (
              <Link
                key={slug}
                href={`/offres-emploi-${slug}`}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-colors"
              >
                Offres emploi {relName}
              </Link>
            ))}
            <Link
              href="/offres"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-colors"
            >
              Toutes les offres
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
