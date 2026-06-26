import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { JobOffer } from '@/lib/models/JobOffer';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectEmployerDB();
  const employer = await Employer.findOne({ slug }).lean() as any;
  if (!employer) return { title: 'Entreprise introuvable' };
  return {
    title: `${employer.company_name} — Offres d'emploi | InteractJob`,
    description: employer.description
      ? employer.description.slice(0, 155)
      : `Découvrez les offres d'emploi de ${employer.company_name} sur InteractJob.ma`,
    alternates: { canonical: `https://www.interactjob.ma/entreprises/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function EntreprisePage({ params }: Props) {
  const { slug } = await params;
  await connectEmployerDB();

  const employer = await Employer.findOne({ slug }).lean() as any;
  if (!employer) notFound();

  const offers = await JobOffer.find({ employer_id: employer._id, status: 'active' })
    .sort({ is_sponsored: -1, created_at: -1 })
    .limit(20)
    .lean() as any[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: employer.company_name,
    url: employer.website || `https://www.interactjob.ma/entreprises/${slug}`,
    logo: employer.logo_url || undefined,
    description: employer.description || undefined,
    address: employer.location ? {
      '@type': 'PostalAddress',
      addressLocality: employer.location,
      addressCountry: 'MA',
    } : undefined,
    sameAs: employer.website ? [employer.website] : undefined,
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex gap-2">
          <Link href="/" className="hover:text-[#00347A]">Accueil</Link>
          <span>/</span>
          <Link href="/offres" className="hover:text-[#00347A]">Offres</Link>
          <span>/</span>
          <span className="text-gray-600">{employer.company_name}</span>
        </nav>

        {/* Company header */}
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-8 mb-6">
          <div className="flex items-start gap-6">
            {employer.logo_url ? (
              <img src={employer.logo_url} alt={employer.company_name} className="w-20 h-20 rounded-xl object-contain border border-[#D0E4F0]" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#00347A] flex items-center justify-center text-3xl text-white font-bold">
                {employer.company_name[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#00347A]">{employer.company_name}</h1>
                {employer.verified && (
                  <span className="bg-[#00C2CB] text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Vérifié</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                {employer.sector && <span>🏭 {employer.sector}</span>}
                {employer.location && <span>📍 {employer.location}</span>}
                {employer.size && <span>👥 {employer.size}</span>}
                {employer.website && (
                  <a href={employer.website} target="_blank" rel="noopener noreferrer" className="text-[#00C2CB] hover:underline">
                    🌐 Site web
                  </a>
                )}
              </div>
            </div>
          </div>

          {employer.description && (
            <div className="mt-6 border-t border-[#D0E4F0] pt-6">
              <h2 className="font-semibold text-gray-800 mb-2">À propos</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{employer.description}</p>
            </div>
          )}
        </div>

        {/* Offers */}
        <div>
          <h2 className="text-xl font-bold text-[#00347A] mb-4">
            Offres d&apos;emploi ({offers.length})
          </h2>
          {offers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D0E4F0] p-8 text-center text-gray-400">
              Aucune offre active pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer: any) => (
                <div key={offer._id.toString()} className="bg-white rounded-2xl border border-[#D0E4F0] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                        {offer.is_sponsored && (
                          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Sponsorisé</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                        <span>📍 {offer.location}</span>
                        <span>📄 {offer.contract_type}</span>
                        {offer.salary && <span>💰 {offer.salary}</span>}
                        {offer.level && <span>🎯 {offer.level}</span>}
                      </div>
                    </div>
                    {offer.application_method === 'email' ? (
                      <a
                        href={`mailto:${offer.application_email}?subject=Candidature — ${offer.title}`}
                        className="shrink-0 bg-[#00347A] hover:bg-[#00285e] text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                      >
                        Postuler
                      </a>
                    ) : (
                      <a
                        href={offer.application_url}
                        target="_blank" rel="noopener noreferrer"
                        className="shrink-0 bg-[#00347A] hover:bg-[#00285e] text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                      >
                        Postuler
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
