import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Mentions Légales & CGU | InteractJob",
  description: "Mentions légales, conditions générales d'utilisation et informations légales d'InteractJob.ma",
  robots: { index: true, follow: true },
};

const EMAIL = "jobinteract@gmail.com";

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Légal</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Mentions légales &amp; CGU</h1>
        <p className="text-sm text-gray-400 mt-2">En vigueur au 12 mai 2026</p>
      </div>

      <div className="space-y-10 text-gray-600 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Éditeur du site</h2>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-sm space-y-1.5">
            <p><strong>Nom du site :</strong> InteractJob</p>
            <p><strong>URL :</strong> https://www.interactjob.ma</p>
            <p><strong>Responsable de publication :</strong> Adil Drouz</p>
            <p><strong>Email :</strong>{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>
            </p>
            <p><strong>Adresse :</strong> Essaouira, Maroc</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Hébergement</h2>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-sm space-y-1.5">
            <p><strong>Hébergeur :</strong> Vercel Inc.</p>
            <p><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
            <p><strong>Site :</strong>{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                vercel.com
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Objet du service</h2>
          <p className="text-sm">
            InteractJob est une plateforme d'intermédiation entre candidats et employeurs au Maroc.
            Elle propose des offres d'emploi agrégées et directes, des articles de conseils carrière,
            et des ressources sur le droit du travail marocain.
          </p>
          <p className="mt-3 text-sm">
            Le site est accessible gratuitement à tout utilisateur disposant d'un accès à Internet.
            Tous les frais afférents à l'accès au service sont exclusivement à la charge de
            l'utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Conditions d'utilisation</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              L'utilisation du site implique l'acceptation pleine et entière des présentes conditions.
            </li>
            <li>
              Le contenu du site (articles, descriptions d'offres, ressources juridiques) est fourni
              à titre informatif. Il ne constitue pas un conseil juridique ou professionnel.
            </li>
            <li>
              Les offres d'emploi publiées sont sous la responsabilité de leurs auteurs. InteractJob
              ne garantit pas l'exactitude ou l'actualité des offres tierces agrégées.
            </li>
            <li>
              Toute reproduction ou diffusion du contenu d'InteractJob sans autorisation expresse
              est interdite.
            </li>
            <li>
              InteractJob se réserve le droit de modifier ou interrompre le service à tout moment,
              sans préavis.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Propriété intellectuelle</h2>
          <p className="text-sm">
            Les articles de blog, visuels, logo et contenu éditorial d'InteractJob sont la propriété
            exclusive d'Adil Drouz. Toute reproduction partielle ou totale sans autorisation est
            interdite et constitue une contrefaçon sanctionnée par la loi marocaine.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Limitation de responsabilité</h2>
          <p className="text-sm">
            InteractJob ne peut être tenu responsable de dommages directs ou indirects résultant
            de l'utilisation du site, d'inexactitudes dans les offres d'emploi tierces, ou
            d'interruptions de service. Les liens vers des sites externes sont fournis à titre
            informatif — InteractJob n'est pas responsable de leur contenu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Droit applicable</h2>
          <p className="text-sm">
            Les présentes mentions légales sont soumises au droit marocain. En cas de litige,
            les tribunaux marocains seront seuls compétents.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Contact</h2>
          <p className="text-sm">
            Pour toute question légale ou réclamation :{" "}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline font-medium">
              {EMAIL}
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-sm">
        <Link href="/politique-confidentialite" className="text-primary hover:underline">
          Politique de confidentialité
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
