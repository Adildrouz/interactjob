import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | InteractJob",
  description: "Contactez l'équipe InteractJob pour toute question, partenariat ou offre à publier.",
  robots: { index: true, follow: true },
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as "fr" | "en" | "ar";
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Support</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Contactez-nous</h1>
        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
          Une question, un partenariat ou une offre d'emploi à publier ?
          Notre équipe vous répond dans les 24h.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <a
          href="mailto:contact@interactjob.ma"
          className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">✉️</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
          <p className="text-sm font-medium text-primary group-hover:underline">
            contact@interactjob.ma
          </p>
        </a>

        <a
          href="https://www.linkedin.com/company/interact-job/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:border-[#0077B5] hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">💼</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">LinkedIn</p>
          <p className="text-sm font-medium text-[#0077B5] group-hover:underline">
            InteractJob
          </p>
        </a>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
          <div className="text-3xl mb-3">📍</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Localisation</p>
          <p className="text-sm font-medium text-gray-700">Essaouira, Maroc</p>
        </div>
      </div>

      {/* Working contact form */}
      <div className="mb-8">
        <ContactForm locale={l} />
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-primary-light to-accent-light rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">Publier une offre d'emploi</h2>
          <p className="text-sm text-gray-500 mb-4">
            Recruteur ? Diffusez votre offre gratuitement sur InteractJob et touchez des milliers
            de candidats marocains qualifiés.
          </p>
          <Link
            href="/publier"
            className="inline-block bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Publier une offre →
          </Link>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">Partenariat &amp; presse</h2>
          <p className="text-sm text-gray-500 mb-3">
            Pour toute demande de partenariat, collaboration éditoriale ou contact presse :
          </p>
          <a
            href="mailto:contact@interactjob.ma?subject=Partenariat InteractJob"
            className="text-sm font-medium text-primary hover:underline"
          >
            contact@interactjob.ma
          </a>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">Signaler un problème</h2>
          <p className="text-sm text-gray-500 mb-3">
            Offre expirée, lien cassé ou contenu inapproprié ? Signalez-le et nous corrigerons
            dans les plus brefs délais.
          </p>
          <a
            href="mailto:contact@interactjob.ma?subject=Signalement InteractJob"
            className="text-sm font-medium text-primary hover:underline"
          >
            Envoyer un signalement
          </a>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-sm">
        <Link href="/politique-confidentialite" className="text-gray-400 hover:text-gray-600">
          Politique de confidentialité
        </Link>
        <Link href="/mentions-legales" className="text-gray-400 hover:text-gray-600">
          Mentions légales
        </Link>
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
