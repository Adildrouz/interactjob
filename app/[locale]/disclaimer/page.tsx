import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Disclaimer — Avis de non-responsabilité | InteractJob",
  description:
    "Avis de non-responsabilité d'InteractJob.ma concernant les offres d'emploi, la publicité Google AdSense, les liens externes et la précision des informations publiées.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.interactjob.ma/disclaimer" },
};

const EMAIL = "contact@interactjob.ma";
const DATE  = "1er juin 2026";

export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Légal</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Avis de non-responsabilité
        </h1>
        <p className="text-sm text-gray-400 mt-2">En vigueur au {DATE}</p>
      </div>

      <div className="space-y-10 text-gray-600 leading-relaxed text-sm">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Généralités</h2>
          <p>
            Les informations publiées sur <strong>InteractJob.ma</strong> (offres d&apos;emploi,
            articles de blog, guides pratiques, outils d&apos;aide à la candidature) sont fournies
            à titre indicatif uniquement. InteractJob ne garantit pas l&apos;exactitude,
            l&apos;exhaustivité ou l&apos;actualité des contenus et décline toute responsabilité
            en cas d&apos;erreur, d&apos;omission ou de préjudice résultant de l&apos;utilisation
            de ces informations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Offres d&apos;emploi</h2>
          <p>
            Les offres d&apos;emploi publiées proviennent de recruteurs tiers, de flux RSS
            de sites spécialisés ou de soumissions directes. InteractJob agit en qualité
            d&apos;intermédiaire et ne peut être tenu responsable :
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1.5 pl-2">
            <li>de l&apos;exactitude des descriptions de poste,</li>
            <li>des conditions de recrutement ou de rémunération,</li>
            <li>de l&apos;authenticité des recruteurs ou des entreprises mentionnées,</li>
            <li>des résultats d&apos;un processus de candidature.</li>
          </ul>
          <p className="mt-3">
            Nous vous invitons à vérifier l&apos;identité de tout recruteur avant de
            transmettre des informations personnelles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Publicités Google AdSense</h2>
          <p>
            Ce site utilise <strong>Google AdSense</strong> pour afficher des publicités
            fournies par Google LLC et ses partenaires. Ces annonces peuvent être
            personnalisées en fonction de votre navigation.
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1.5 pl-2">
            <li>
              InteractJob ne contrôle pas le contenu des annonces affichées et
              n&apos;endosse pas les produits ou services annoncés.
            </li>
            <li>
              Google peut utiliser des cookies pour diffuser des publicités pertinentes.
              Consultez la{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                politique de confidentialité de Google
              </a>{" "}
              pour en savoir plus.
            </li>
            <li>
              Vous pouvez personnaliser vos préférences publicitaires via{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                les paramètres des annonces Google
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Liens externes</h2>
          <p>
            Notre site contient des liens vers des sites tiers (offres d&apos;emploi,
            sources officielles, réseaux sociaux). Ces liens sont fournis pour votre
            commodité. InteractJob n&apos;est pas responsable du contenu, de la
            disponibilité ou des pratiques de confidentialité de ces sites.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Outils IA (Générateur CV)</h2>
          <p>
            Notre générateur de CV est alimenté par des modèles d&apos;intelligence
            artificielle. Les documents générés (CV, lettre de motivation, email de
            candidature) sont des suggestions automatisées. InteractJob ne garantit
            pas leur adéquation à un poste ou à une candidature particulière et décline
            toute responsabilité quant à leur utilisation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus originaux du site (textes, graphiques, logos,
            structure) est la propriété d&apos;InteractJob et est protégé par le droit
            d&apos;auteur. Toute reproduction, même partielle, sans autorisation préalable
            est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Limitation de responsabilité</h2>
          <p>
            Dans les limites autorisées par la loi applicable, InteractJob ne pourra
            être tenu responsable de tout dommage direct ou indirect résultant de
            l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le site, y compris
            la perte de données, de revenus ou d&apos;opportunités professionnelles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Contact</h2>
          <p>
            Pour toute question relative à cet avis, contactez-nous à :{" "}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
              {EMAIL}
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <Link href="/politique-confidentialite" className="hover:text-primary transition-colors">
            Politique de confidentialité
          </Link>
          <Link href="/mentions-legales" className="hover:text-primary transition-colors">
            Mentions légales
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
