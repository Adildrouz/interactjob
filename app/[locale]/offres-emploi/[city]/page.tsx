import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import jobs from '@/data/jobs.json';
import { cities, getCityBySlug } from '@/lib/cities';

const BASE_URL = 'https://www.interactjob.ma';

const cityIntros: Record<string, string> = {
  casablanca: `Casablanca, métropole économique du Maroc et capitale financière de l'Afrique du Nord, concentre plus de 50 000 offres d'emploi par an. Hub des sièges sociaux, banques, multinationales et startups tech, la ville offre des opportunités dans tous les secteurs : finance, IT, commerce, industrie et services. Le Grand Casablanca-Settat génère près de 35 % du PIB national. En 2027, la demande en profils digitaux, ingénieurs et commerciaux reste très forte. InteractJob.ma recense quotidiennement les meilleures offres à Casablanca pour accélérer votre recherche d'emploi.`,
  rabat: `Rabat, capitale administrative du Maroc, offre un marché de l'emploi dominé par la fonction publique, les ambassades, les organisations internationales et un tissu de PME dynamiques. La ville abrite les ministères, la Banque Al-Maghrib et de nombreuses administrations. En 2027, la demande en profils juridiques, administratifs, IT et diplomatie reste soutenue. Rabat-Salé-Kénitra constitue la deuxième région économique du pays. Retrouvez toutes les offres d'emploi à Rabat sur InteractJob.ma, mises à jour chaque jour.`,
  marrakech: `Marrakech, capitale touristique et culturelle du Maroc, génère des milliers d'emplois dans l'hôtellerie, la restauration, l'artisanat, l'événementiel et le tourisme d'affaires. La ville accueille chaque année des millions de visiteurs et voit émerger un écosystème tech et startup. En 2027, les secteurs hôtelier, immobilier et digital recrutent activement. Avec InteractJob.ma, trouvez rapidement un emploi à Marrakech dans tous les secteurs, de l'opérationnel au management.`,
  agadir: `Agadir, capitale du Souss-Massa, est un pôle économique majeur axé sur la pêche, l'agro-alimentaire, le tourisme balnéaire et le commerce. La ville connaît une croissance soutenue avec le développement du port, des zones industrielles et du secteur hôtelier. En 2027, les recruteurs agadirois cherchent des profils en logistique, hôtellerie, agriculture et BTP. InteractJob.ma publie quotidiennement les offres d'emploi à Agadir pour vous connecter aux meilleurs employeurs de la région.`,
  tanger: `Tanger, ville stratégique au carrefour Europe-Afrique, est devenue l'une des villes les plus dynamiques du Maroc grâce au port Tanger Med, aux zones industrielles Renault-Dacia et à l'essor des services. La région Tanger-Tétouan-Al Hoceïma attire investisseurs nationaux et internationaux. En 2027, l'industrie automobile, la logistique, le textile et l'IT recrutent massivement. Consultez les offres d'emploi à Tanger sur InteractJob.ma et postulez directement en ligne.`,
  fes: `Fès, capitale spirituelle et universitaire du Maroc, dispose d'un marché de l'emploi ancré dans l'éducation, l'artisanat, la fonction publique et l'industrie textile. La ville abrite plusieurs grandes universités et centres de formation. En 2027, les secteurs de l'enseignement, de la santé, de l'industrie et des services connaissent une demande croissante. InteractJob.ma recense les offres d'emploi à Fès pour faciliter votre insertion professionnelle dans la région Fès-Meknès.`,
  meknes: `Meknès, ville impériale au cœur du Maroc, développe son économie autour de l'agro-alimentaire, la viticulture, l'industrie et le commerce. La région Fès-Meknès concentre un tissu industriel et agricole important. En 2027, les profils en agroalimentaire, BTP, commerce et administration sont très recherchés. Avec InteractJob.ma, accédez facilement aux offres d'emploi à Meknès et dans sa région, publiées et actualisées chaque jour.`,
  oujda: `Oujda, capitale de la région Oriental, est une ville carrefour à la frontière algérienne avec un tissu économique en développement dans le commerce, les services et l'industrie. La ville bénéficie d'investissements croissants dans les zones industrielles et l'université Mohammed Premier. En 2027, les secteurs de l'administration, du commerce et de la santé recrutent activement. Retrouvez toutes les offres d'emploi à Oujda sur InteractJob.ma.`,
  kenitra: `Kénitra, ville industrielle de la région Rabat-Salé-Kénitra, se distingue par son port, ses zones industrielles automobiles (SNOPAKE, fournisseurs Renault) et son agriculture. La proximité de Rabat en fait un bassin d'emploi attractif. En 2027, l'industrie, la logistique, l'agroalimentaire et les services publics recrutent. InteractJob.ma publie les meilleures offres d'emploi à Kénitra pour vous connecter aux recruteurs locaux.`,
  tetouan: `Tétouan, ville du nord marocain proche de Tanger et de Ceuta, développe son économie dans le tourisme, l'artisanat, le commerce et le secteur informel. La région connaît un essor dans la construction et les services. En 2027, l'hôtellerie, le BTP et le commerce offrent de belles opportunités. InteractJob.ma référence les offres d'emploi à Tétouan pour faciliter votre recherche dans la région Tanger-Tétouan.`,
  mohammedia: `Mohammedia, ville industrielle de la région du Grand Casablanca, abrite la plus grande raffinerie du Maroc (SAMIR), des industries chimiques et pétrochimiques, ainsi qu'un tissu de PME. Sa proximité immédiate avec Casablanca en fait un marché de l'emploi dynamique. En 2027, l'industrie, la chimie, la logistique et les services recrutent. InteractJob.ma recense toutes les offres d'emploi à Mohammedia et ses environs.`,
  'el-jadida': `El Jadida, ville côtière de la région Grand Casablanca-Settat, conjugue industrie phosphatière (OCP), pêche, tourisme et agriculture. Le port Jorf Lasfar est l'un des plus importants du Maroc. En 2027, les secteurs miniers, industriels et du BTP offrent de nombreuses opportunités. Consultez les offres d'emploi à El Jadida sur InteractJob.ma et postulez en quelques clics.`,
  safi: `Safi, ville portuaire de la côte atlantique, est un centre industriel et artisanal majeur, connu pour sa poterie, ses industries chimiques et sa pêche. Le complexe phosphatier OCP y est très présent. En 2027, l'industrie, la chimie, la logistique et la pêche sont les principaux pourvoyeurs d'emploi. InteractJob.ma publie quotidiennement les offres d'emploi à Safi pour accélérer votre recherche.`,
  essaouira: `Essaouira, joyau de la côte atlantique marocaine, est une ville touristique, artisanale et culturelle en plein essor. Le secteur hôtelier, la restauration, l'artisanat et les sports nautiques sont les principaux employeurs. En 2027, le tourisme durable et l'économie créative ouvrent de nouvelles perspectives. Retrouvez les offres d'emploi à Essaouira sur InteractJob.ma et rejoignez cette ville unique au marché du travail en pleine croissance.`,
};

interface Props {
  params: Promise<{ city: string; locale: string }>;
}

export async function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  return {
    title: `Offres d'Emploi ${city.name} 2027 | InteractJob.ma`,
    description: `Offres d'emploi à ${city.name} en 2027. CDI, CDD, stage — mis à jour quotidiennement. Trouvez votre prochain poste dans la région ${city.region} sur InteractJob.ma.`,
    keywords: [`emploi ${city.name.toLowerCase()}`, `offre emploi ${city.name.toLowerCase()} 2027`, `recrutement ${city.name.toLowerCase()}`, `travail ${city.name.toLowerCase()}`],
    alternates: { canonical: `${BASE_URL}/offres-emploi/${citySlug}` },
    openGraph: {
      title: `Offres d'Emploi ${city.name} 2027 | InteractJob.ma`,
      description: `Trouvez un emploi à ${city.name} en 2027. CDI, CDD, stage dans la région ${city.region}.`,
      url: `${BASE_URL}/offres-emploi/${citySlug}`,
      siteName: 'InteractJob.ma',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const allJobs = jobs as any[];

  // Filter by city (case-insensitive match)
  let cityJobs = allJobs.filter(
    (j) => !j.expired && j.city?.toLowerCase().includes(city.name.toLowerCase())
  );
  // Fallback: latest 5 jobs
  if (cityJobs.length < 3) {
    cityJobs = allJobs.filter((j) => !j.expired).slice(0, 5);
  }

  const displayJobs = cityJobs.slice(0, 12);
  const nearbyNames = (city.nearby || []).map((s) => getCityBySlug(s)).filter(Boolean) as typeof cities;

  const intro = cityIntros[citySlug] ?? `${city.name} offre de nombreuses opportunités professionnelles dans la région ${city.region}. Retrouvez toutes les offres d'emploi à ${city.name} sur InteractJob.ma, mises à jour quotidiennement.`;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-blue-600">Accueil</a>
            <span className="mx-1">›</span>
            <span>Offres d'emploi {city.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Offres d&apos;Emploi {city.name} 2027 — InteractJob.ma
          </h1>
          <p className="text-gray-500 text-sm mb-2">{city.region}</p>
          <p className="text-gray-700 leading-relaxed max-w-2xl text-sm md:text-base">{intro}</p>
        </div>
      </section>

      {/* Jobs */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          {displayJobs.length} offre{displayJobs.length > 1 ? 's' : ''} d&apos;emploi à {city.name}
        </h2>

        <div className="space-y-3">
          {displayJobs.map((job: any) => (
            <a
              key={job.id || job.slug}
              href={`/offres/${job.slug}`}
              className="flex items-start justify-between bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm md:text-base truncate">
                  {job.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {job.company} · {job.city} · {job.contractType || job.contract_type}
                </p>
              </div>
              <span className="ml-3 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                Voir →
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/offres"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Toutes les offres →
          </a>
        </div>
      </section>

      {/* Nearby cities */}
      {nearbyNames.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-10">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Villes proches</h2>
          <div className="flex flex-wrap gap-2">
            {nearbyNames.map((c) => (
              <a
                key={c.slug}
                href={`/offres-emploi/${c.slug}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                Emploi {c.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Schema.org — EmployerAggregateRating / ItemList (NOT JobPosting — city pages are not individual job listings) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `Offres d'emploi ${city.name} 2027`,
            description: `Toutes les offres d'emploi à ${city.name} en 2027 — CDI, CDD, Stage sur InteractJob.ma`,
            url: `${BASE_URL}/offres-emploi/${city.slug ?? city.name.toLowerCase()}`,
            inLanguage: 'fr-MA',
            about: {
              '@type': 'City',
              name: city.name,
              containedInPlace: {
                '@type': 'AdministrativeArea',
                name: city.region,
                addressCountry: 'MA',
              },
            },
          }),
        }}
      />
    </main>
  );
}
