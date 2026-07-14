"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Briefcase, Inbox, Users, Building2, Megaphone, MessageCircle,
  Newspaper, Search, ChevronsLeft, ChevronsRight, LogOut, Star, Globe, Command,
  Gauge, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "./command-palette";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { label: null, items: [{ href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard }] },
  {
    label: "Recrutement",
    items: [
      { href: "/admin/offres", label: "Offres publiées", icon: Briefcase },
      { href: "/admin/candidatures", label: "Candidatures", icon: Inbox },
      { href: "/admin/candidats", label: "Talent Pool", icon: Users },
    ],
  },
  {
    label: "Croissance",
    items: [
      { href: "/admin/employeurs", label: "Employeurs", icon: Building2 },
      { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
      { href: "/admin/linkedin", label: "LinkedIn Messages", icon: MessageCircle },
      { href: "/admin/outils", label: "Outils & Conversions", icon: Gauge },
      { href: "/admin/alertes", label: "Alertes Email", icon: Bell },
    ],
  },
  { label: "Contenu", items: [{ href: "/admin/blog", label: "Blog", icon: Newspaper }] },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);
const PIN_KEY = "ij_admin_pinned";
const COLLAPSE_KEY = "ij_admin_sidebar_collapsed";

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  onLogout,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpen: openPalette } = useCommandPalette();
  const [collapsed, setCollapsed] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    try {
      const raw = window.localStorage.getItem(PIN_KEY);
      if (raw) setPinned(JSON.parse(raw));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      window.localStorage.setItem(COLLAPSE_KEY, !v ? "1" : "0");
      return !v;
    });
  }

  function togglePin(href: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPinned((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      window.localStorage.setItem(PIN_KEY, JSON.stringify(next));
      return next;
    });
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const pinnedItems = useMemo(
    () => ALL_ITEMS.filter((i) => pinned.includes(i.href)),
    [pinned]
  );

  const width = collapsed ? 72 : 248;

  const body = (
    <>
      {/* Workspace header */}
      <div className={cn("flex items-center gap-2.5 border-b border-[var(--ad-sidebar-border)] px-4 py-4", collapsed && "justify-center px-0")}>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--ad-radius-sm)] p-1 text-left outline-none transition-colors hover:bg-[var(--ad-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md">
              <Image src="/InteractJob-Logo.png" alt="" fill className="object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ad-text)]">InteractJob</p>
                <p className="truncate text-[11px] text-[var(--ad-text-muted)]">Espace Admin</p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onSelect={() => window.open("/", "_blank")}>
              <Globe className="h-4 w-4" /> Voir le site public
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onLogout}>
              <LogOut className="h-4 w-4" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search trigger */}
      <div className={cn("px-3 pt-3", collapsed && "px-2")}>
        <button
          onClick={() => openPalette(true)}
          className={cn(
            "flex w-full items-center gap-2 rounded-[var(--ad-radius-sm)] border border-[var(--ad-border)] bg-[var(--ad-surface-2)] px-2.5 py-2 text-sm text-[var(--ad-text-muted)] transition-colors hover:border-[var(--ad-accent)]",
            collapsed && "justify-center px-0"
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Rechercher…</span>
              <kbd className="flex items-center gap-0.5 rounded border border-[var(--ad-border)] bg-[var(--ad-surface)] px-1.5 py-0.5 text-[10px] font-medium">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-5 overflow-y-auto px-3 py-4", collapsed && "px-2")}>
        {mounted && pinnedItems.length > 0 && (
          <NavSection label={collapsed ? null : "Épinglés"} collapsed={collapsed}>
            {pinnedItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed}
                pinned onTogglePin={togglePin} onNavigate={onCloseMobile} />
            ))}
          </NavSection>
        )}
        {NAV.map((group, gi) => (
          <NavSection key={gi} label={collapsed ? null : group.label} collapsed={collapsed}>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                pinned={pinned.includes(item.href)}
                onTogglePin={togglePin}
                onNavigate={onCloseMobile}
              />
            ))}
          </NavSection>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--ad-sidebar-border)] p-3">
        <button
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center gap-2 rounded-[var(--ad-radius-sm)] px-2.5 py-2 text-xs font-medium text-[var(--ad-text-muted)] transition-colors hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Réduire</>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative z-30 hidden shrink-0 flex-col border-r border-[var(--ad-sidebar-border)] bg-[var(--ad-sidebar-bg)] lg:flex"
      >
        {body}
      </motion.aside>

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-[var(--ad-sidebar-border)] bg-[var(--ad-sidebar-bg)] lg:hidden"
      >
        {body}
      </motion.aside>
    </>
  );
}

function NavSection({ label, collapsed, children }: { label?: string | null; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ad-text-muted)]">
          {label}
        </p>
      )}
      <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center gap-1 space-y-0")}>{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  pinned,
  onTogglePin,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  pinned: boolean;
  onTogglePin: (href: string, e: React.MouseEvent) => void;
  onNavigate: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-[var(--ad-radius-sm)] px-2.5 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0 py-2.5",
        active
          ? "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]"
          : "text-[var(--ad-text-secondary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]"
      )}
    >
      {active && !collapsed && (
        <motion.span layoutId="ad-nav-active" className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--ad-accent)]" />
      )}
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && (
        <button
          onClick={(e) => onTogglePin(item.href, e)}
          className={cn(
            "ml-auto shrink-0 rounded p-0.5 text-[var(--ad-text-muted)] opacity-0 transition-opacity hover:text-[var(--ad-warning)] group-hover:opacity-100",
            pinned && "opacity-100 text-[var(--ad-warning)]"
          )}
          aria-label={pinned ? "Désépingler" : "Épingler"}
        >
          <Star className="h-3 w-3" fill={pinned ? "currentColor" : "none"} />
        </button>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
