import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import articles from "@/data/articles.json";
import { AUTHORS, getAuthorSchema } from "@/lib/authors";

const BASE_URL = "https://www.interactjob.ma";
const NAVY = "#00347A";
const TURQ = "#00C2CB";

export async function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = AUTHORS[slug];
  if (!author) return {};
  return {
    title: `${author.name} — ${author.jobTitle} | InteractJob`,
    description: author.bio,
    alternates: { canonical: `${BASE_URL}/auteurs/${slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${author.name} — ${author.jobTitle}`,
      description: author.bio,
      url: `${BASE_URL}/auteurs/${slug}`,
      type: "profile",
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = AUTHORS[slug];
  if (!author) notFound();

  const authorArticles = (articles as any[])
    .filter((a) => (a.lang ?? "fr") === "fr" && a.published !== false)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  const personJsonLd = getAuthorSchema(slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog RH",
        item: `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: author.name,
        item: `${BASE_URL}/auteurs/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...personJsonLd,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="text-white py-16" style={{ background: NAVY }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <nav className="text-sm text-white/60 mb-6 flex items-center gap-2">
              <Link href="/" className="hover:text-white transition-colors">
                Accueil
              </Link>
              <span>/</span>
              <Link
                href="/blog"
                className="hover:text-white transition-colors"
              >
                Blog RH
              </Link>
              <span>/</span>
              <span className="text-white/80">{author.name}</span>
            </nav>

            <div className="flex items-center gap-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: TURQ }}
              >
                {author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{author.name}</h1>
                <p className="mt-1 font-medium" style={{ color: TURQ }}>
                  {author.jobTitle}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {author.sameAs.map((url) => {
                    const isLinkedIn = url.includes("linkedin");
                    return (
                      <a
                        key={url}
                        href={url}
                        target={isLinkedIn ? "_blank" : undefined}
                        rel={isLinkedIn ? "noopener noreferrer" : undefined}
                        className="text-sm font-medium text-white/80 hover:text-white underline transition-colors"
                      >
                        {isLinkedIn ? "LinkedIn" : "À propos"}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Bio */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-10">
            <h2 className="text-lg font-bold mb-3" style={{ color: NAVY }}>
              À propos
            </h2>
            <p className="text-gray-600 leading-relaxed">{author.bio}</p>
          </section>

          {/* Article list */}
          <section>
            <h2 className="text-xl font-bold mb-6" style={{ color: NAVY }}>
              Articles publiés ({authorArticles.length})
            </h2>
            <div className="space-y-4">
              {authorArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-primary transition-colors"
                >
                  <div
                    className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: "#f0f4ff" }}
                  >
                    {article.coverEmoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-1">
                      {article.category} ·{" "}
                      {formatDate(article.publishedAt)}
                    </p>
                    <h3
                      className="font-bold text-gray-900 group-hover:underline leading-snug"
                      style={{ color: NAVY }}
                    >
                      {article.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
