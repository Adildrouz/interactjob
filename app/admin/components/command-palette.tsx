"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, Briefcase, Inbox, Users, Building2, Megaphone, MessageCircle,
  Newspaper, PlusCircle, ExternalLink, Globe, RefreshCw, Sparkles, Search,
} from "lucide-react";

interface PaletteCtx { open: boolean; setOpen: (v: boolean) => void; }
const PaletteContext = createContext<PaletteCtx>({ open: false, setOpen: () => {} });
export function useCommandPalette() {
  return useContext(PaletteContext);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <PaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} setOpen={setOpen} />
    </PaletteContext.Provider>
  );
}

const PAGES = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, keywords: "overview dashboard accueil" },
  { href: "/admin/offres", label: "Offres publiées", icon: Briefcase, keywords: "jobs annonces" },
  { href: "/admin/candidatures", label: "Candidatures", icon: Inbox, keywords: "applications" },
  { href: "/admin/candidats", label: "Talent Pool", icon: Users, keywords: "candidats cv" },
  { href: "/admin/employeurs", label: "Employeurs", icon: Building2, keywords: "entreprises recruteurs" },
  { href: "/admin/marketing", label: "Marketing Employeurs", icon: Megaphone, keywords: "campagnes email" },
  { href: "/admin/linkedin", label: "LinkedIn Messages", icon: MessageCircle, keywords: "reseau social" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, keywords: "articles contenu" },
];

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();

  const go = useCallback((href: string, external?: boolean) => {
    setOpen(false);
    if (external) window.open(href, "_blank", "noreferrer");
    else router.push(href);
  }, [router, setOpen]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Recherche globale"
      shouldFilter
      contentClassName="ad-anim-zoom fixed left-1/2 top-[18%] z-[300] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--ad-radius-lg)] border border-[var(--ad-border)] bg-[var(--ad-surface)] shadow-[var(--ad-shadow-lg)] outline-none"
      overlayClassName="ad-anim-in fixed inset-0 z-[299] bg-slate-950/50 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-2.5 border-b border-[var(--ad-border)] px-4">
        <Search className="h-4 w-4 shrink-0 text-[var(--ad-text-muted)]" />
        <Command.Input
          placeholder="Rechercher une page, une action..."
          className="h-12 w-full bg-transparent text-sm text-[var(--ad-text)] placeholder:text-[var(--ad-text-muted)] outline-none"
        />
        <kbd className="hidden shrink-0 rounded border border-[var(--ad-border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ad-text-muted)] sm:block">
          Échap
        </kbd>
      </div>

      <Command.List className="max-h-[420px] overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-sm text-[var(--ad-text-muted)]">
          Aucun résultat.
        </Command.Empty>

        <Command.Group heading="Navigation" className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-muted)] [&_[cmdk-group-items]]:mt-1.5">
          {PAGES.map((p) => (
            <Command.Item
              key={p.href}
              value={`${p.label} ${p.keywords}`}
              onSelect={() => go(p.href)}
              className="flex cursor-pointer items-center gap-3 rounded-[var(--ad-radius-sm)] px-3 py-2.5 text-sm text-[var(--ad-text)] data-[selected=true]:bg-[var(--ad-surface-hover)]"
            >
              <p.icon className="h-4 w-4 text-[var(--ad-text-muted)]" />
              {p.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator className="my-1.5 h-px bg-[var(--ad-border-subtle)]" />

        <Command.Group heading="Actions rapides" className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-muted)] [&_[cmdk-group-items]]:mt-1.5">
          <Command.Item
            value="ajouter offre manuelle nouvelle annonce"
            onSelect={() => go("/admin/offres/ajouter")}
            className="flex cursor-pointer items-center gap-3 rounded-[var(--ad-radius-sm)] px-3 py-2.5 text-sm text-[var(--ad-text)] data-[selected=true]:bg-[var(--ad-surface-hover)]"
          >
            <PlusCircle className="h-4 w-4 text-[var(--ad-text-muted)]" />
            Ajouter une offre manuelle
          </Command.Item>
          <Command.Item
            value="publier article blog nouveau"
            onSelect={() => go("/admin/blog")}
            className="flex cursor-pointer items-center gap-3 rounded-[var(--ad-radius-sm)] px-3 py-2.5 text-sm text-[var(--ad-text)] data-[selected=true]:bg-[var(--ad-surface-hover)]"
          >
            <Newspaper className="h-4 w-4 text-[var(--ad-text-muted)]" />
            Publier un article de blog
          </Command.Item>
          <Command.Item
            value="forcer enrichissement ia haiku"
            onSelect={() => go("/admin")}
            className="flex cursor-pointer items-center gap-3 rounded-[var(--ad-radius-sm)] px-3 py-2.5 text-sm text-[var(--ad-text)] data-[selected=true]:bg-[var(--ad-surface-hover)]"
          >
            <Sparkles className="h-4 w-4 text-[var(--ad-text-muted)]" />
            Aller au tableau de bord pour enrichir les offres
          </Command.Item>
        </Command.Group>

        <Command.Separator className="my-1.5 h-px bg-[var(--ad-border-subtle)]" />

        <Command.Group heading="Externe" className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-muted)] [&_[cmdk-group-items]]:mt-1.5">
          <Command.Item
            value="voir le site public interactjob"
            onSelect={() => go("/", true)}
            className="flex cursor-pointer items-center justify-between rounded-[var(--ad-radius-sm)] px-3 py-2.5 text-sm text-[var(--ad-text)] data-[selected=true]:bg-[var(--ad-surface-hover)]"
          >
            <span className="flex items-center gap-3"><Globe className="h-4 w-4 text-[var(--ad-text-muted)]" /> Voir le site public</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--ad-text-muted)]" />
          </Command.Item>
          <Command.Item
            value="railway logs scraper"
            onSelect={() => go("https://railway.app/dashboard", true)}
            className="flex cursor-pointer items-center justify-between rounded-[var(--ad-radius-sm)] px-3 py-2.5 text-sm text-[var(--ad-text)] data-[selected=true]:bg-[var(--ad-surface-hover)]"
          >
            <span className="flex items-center gap-3"><RefreshCw className="h-4 w-4 text-[var(--ad-text-muted)]" /> Logs Railway (scrapers)</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--ad-text-muted)]" />
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
