"use client";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, Sun, Moon, Plus, PlusCircle, Newspaper, Megaphone, LogOut, ChevronRight } from "lucide-react";
import { useAdminTheme } from "./theme-provider";
import { useCommandPalette } from "./command-palette";
import { NotificationsMenu } from "./notifications";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "./ui/dropdown-menu";

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: "Admin",
  offres: "Offres publiées",
  candidatures: "Candidatures",
  candidats: "Talent Pool",
  employeurs: "Employeurs",
  marketing: "Marketing",
  linkedin: "LinkedIn Messages",
  blog: "Blog",
  ajouter: "Ajouter",
  login: "Connexion",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return <span className="text-sm font-semibold text-[var(--ad-text)]">Vue d&apos;ensemble</span>;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = BREADCRUMB_LABELS[seg] ?? seg;
        if (i === 0) return null; // skip the leading "admin" crumb — sidebar already frames this as the admin area
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 1 && <ChevronRight className="h-3.5 w-3.5 text-[var(--ad-text-muted)]" />}
            <span className={isLast ? "font-semibold text-[var(--ad-text)]" : "text-[var(--ad-text-muted)]"}>
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function Topbar({ onOpenMobileNav, onLogout }: { onOpenMobileNav: () => void; onLogout: () => void }) {
  const { theme, toggle } = useAdminTheme();
  const { setOpen: openPalette } = useCommandPalette();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--ad-border)] bg-[var(--ad-surface)]/80 px-4 backdrop-blur-md">
      <button
        onClick={onOpenMobileNav}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--ad-radius-sm)] text-[var(--ad-text-secondary)] hover:bg-[var(--ad-surface-hover)] lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <Breadcrumb />

      <div className="flex-1" />

      {/* Search (desktop) */}
      <button
        onClick={() => openPalette(true)}
        className="hidden items-center gap-2 rounded-[var(--ad-radius-sm)] border border-[var(--ad-border)] bg-[var(--ad-surface-2)] px-3 py-1.5 text-xs text-[var(--ad-text-muted)] transition-colors hover:border-[var(--ad-accent)] sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Rechercher
        <kbd className="ml-2 rounded border border-[var(--ad-border)] bg-[var(--ad-surface)] px-1 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      {/* Quick create */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Créer
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Créer</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/admin/offres/ajouter")}>
            <PlusCircle className="h-4 w-4" /> Offre manuelle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/admin/blog")}>
            <Newspaper className="h-4 w-4" /> Article de blog
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/admin/marketing")}>
            <Megaphone className="h-4 w-4" /> Campagne marketing
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--ad-radius-sm)] text-[var(--ad-text-secondary)] transition-colors hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]"
        aria-label="Changer de thème"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <NotificationsMenu />

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]">
          <Avatar>
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Compte admin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={onLogout}>
            <LogOut className="h-4 w-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
