import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | InteractJob",
  description: "Politique de confidentialité et protection des données personnelles d'InteractJob.ma",
  robots: { index: true, follow: true },
};

const LAST_UPDATE = "12 mai 2026";
const EMAIL = "contact@interactjob.ma";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Légal</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-400 mt-2">Dernière mise à jour : {LAST_UPDATE}</p>
      </div>

      <div className="space-y-10 text-gray-600 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Qui sommes-nous ?</h2>
          <p>
            InteractJob (<strong>interactjob.ma</strong>) est une plateforme d'emploi dédiée au marché
            marocain, éditée par Adil Drouz, basé à Essaouira, Maroc. Contact :{" "}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données collectées</h2>
          <p>Lors de votre visite, nous collectons automatiquement :</p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-sm">
            <li>Pages visitées et durée de visite</li>
            <li>Pays et ville approximatifs (IP non précise)</li>
            <li>Type d'appareil, navigateur et système d'exploitation</li>
            <li>Source de visite (moteur de recherche, réseau social, lien direct)</li>
          </ul>
          <p className="mt-3">
            Si vous soumettez une offre via notre formulaire, nous collectons votre email et les
            informations relatives à l'offre.
          </p>
          <p className="mt-3">
            <strong>Nous ne collectons pas</strong> de nom, prénom, numéro de téléphone ou données
            sensibles sans votre consentement explicite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Finalités du traitement</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Améliorer les performances et le contenu du site</li>
            <li>Analyser l'audience pour adapter nos offres et articles</li>
            <li>Assurer la sécurité et le bon fonctionnement du service</li>
            <li>Afficher des publicités pertinentes via Google AdSense</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Cookies</h2>
          <p className="text-sm mb-4">InteractJob utilise les types de cookies suivants :</p>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">Cookies analytiques — Vercel Analytics</p>
              <p className="text-sm mt-1 text-gray-500">
                Statistiques d'audience anonymisées. Aucune donnée personnelle identifiable.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">Cookies publicitaires — Google AdSense</p>
              <p className="text-sm mt-1 text-gray-500">
                Google utilise des cookies pour afficher des annonces personnalisées. Vous pouvez
                désactiver la personnalisation sur{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  google.com/settings/ads
                </a>.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">Cookies de session</p>
              <p className="text-sm mt-1 text-gray-500">
                Navigation et préférences de langue. Supprimés à la fermeture du navigateur.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Google AdSense</h2>
          <p className="text-sm">
            InteractJob utilise Google AdSense pour afficher des publicités. Google utilise des cookies
            pour diffuser des annonces basées sur vos visites sur notre site et d'autres sites.
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
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Partage des données</h2>
          <p className="text-sm">
            Nous ne vendons ni ne partageons vos données personnelles à des fins commerciales, sauf avec :
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-sm">
            <li><strong>Vercel Inc.</strong> — hébergement et analytics anonymisés</li>
            <li><strong>Google LLC</strong> — publicité AdSense (données agrégées)</li>
            <li>Obligations légales marocaines</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Conservation des données</h2>
          <p className="text-sm">
            Données analytiques : <strong>24 mois</strong> maximum.
            Données du formulaire d'offre : supprimées après fin de publication.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Vos droits</h2>
          <p className="text-sm">
            Conformément à la loi marocaine 09-08 sur la protection des données personnelles, vous
            disposez des droits d'accès, rectification, suppression, opposition et portabilité.
          </p>
          <p className="mt-3 text-sm">
            Pour exercer ces droits :{" "}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Sécurité</h2>
          <p className="text-sm">
            Site hébergé sur l'infrastructure sécurisée de Vercel (SSL/TLS, CDN mondial).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Modifications</h2>
          <p className="text-sm">
            Cette politique peut être modifiée à tout moment. Date de mise à jour indiquée en haut.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">11. Contact</h2>
          <p className="text-sm">
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline font-medium">
              {EMAIL}
            </a>
            <br />InteractJob — Essaouira, Maroc
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-sm">
        <Link href="/mentions-legales" className="text-primary hover:underline">
          Mentions légales &amp; CGU
        </Link>
        <Link href="/contact" className="text-primary hover:underline">
          Nous contacter
        </Link>
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
