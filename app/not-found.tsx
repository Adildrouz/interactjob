import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="fr">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <Link href="/" className="inline-flex items-center gap-1.5 mb-8">
            <span className="text-2xl font-black text-primary">InteractJob</span>
            <span className="text-xs font-bold text-accent bg-accent-light px-2 py-0.5 rounded-full">.ma</span>
          </Link>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-3">404</h1>
          <p className="text-gray-500 mb-8">Cette page n&apos;existe plus ou a été déplacée.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
