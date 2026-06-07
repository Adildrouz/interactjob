"use client";
import { useState, useCallback, createContext, useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// ── Toast system ──────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType; }

interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

// ── Confirm modal ─────────────────────────────────────────────────────────────
interface ConfirmOptions { title: string; message: string; danger?: boolean; }
interface ConfirmCtx { confirm: (opts: ConfirmOptions) => Promise<boolean>; }
const ConfirmContext = createContext<ConfirmCtx>({ confirm: async () => false });
export function useConfirm() { return useContext(ConfirmContext); }

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV = [
  { href: "/admin",             label: "Tableau de bord",  icon: "📊" },
  { href: "/admin/offres",      label: "Offres publiées",  icon: "📋" },
  { href: "/admin/candidats",   label: "Talent Pool",      icon: "👥" },
  { href: "/admin/candidatures",label: "Candidatures",     icon: "📬" },
  { href: "/admin/blog",        label: "Blog",             icon: "✍️" },
];

// ── AdminShell ────────────────────────────────────────────────────────────────
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const [sideOpen,   setSideOpen]   = useState(false);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<((v: boolean) => void) | null>(null);

  // Toast helpers
  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  // Confirm helper
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmOpts(opts);
      setConfirmResolve(() => resolve);
    });
  }, []);

  function resolveConfirm(val: boolean) {
    confirmResolve?.(val);
    setConfirmOpts(null);
    setConfirmResolve(null);
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Login page renders without the shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <ConfirmContext.Provider value={{ confirm }}>
        <div className="min-h-screen bg-[#F4F6F9] flex">
          {/* ── Sidebar ───────────────────────────────────────────────── */}
          {/* Mobile overlay */}
          {sideOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSideOpen(false)} />
          )}

          <aside className={`
            fixed top-0 left-0 h-full z-50 w-60 flex flex-col
            bg-[#0A2D6E] text-white transition-transform duration-200
            lg:translate-x-0 lg:static lg:z-auto
            ${sideOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-[#00BCD4] font-black text-lg tracking-tight">InteractJob</span>
                <span className="text-white/60 text-xs font-medium mt-0.5">Admin</span>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSideOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? "bg-[#00BCD4] text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"}
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-white/10 mt-4">
                <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/75 transition-colors">
                  <span>🌐</span> Voir le site
                </a>
              </div>
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-white/10">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-red-500/20 transition-colors"
              >
                <span>🚪</span> Déconnexion
              </button>
            </div>
          </aside>

          {/* ── Main area ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top bar */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
              {/* Hamburger (mobile) */}
              <button
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setSideOpen(true)}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex-1" />

              <span className="text-xs text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0A2D6E] flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </main>
          </div>

          {/* ── Toast notifications ────────────────────────────────────── */}
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
              <div
                key={t.id}
                className={`
                  pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                  flex items-center gap-2 animate-in slide-in-from-right duration-200
                  ${t.type === "success" ? "bg-green-600 text-white" : ""}
                  ${t.type === "error"   ? "bg-red-600 text-white"   : ""}
                  ${t.type === "info"    ? "bg-[#0A2D6E] text-white" : ""}
                `}
              >
                {t.type === "success" && "✅"}
                {t.type === "error"   && "❌"}
                {t.type === "info"    && "ℹ️"}
                {t.message}
              </div>
            ))}
          </div>

          {/* ── Confirm modal ──────────────────────────────────────────── */}
          {confirmOpts && (
            <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmOpts.title}</h3>
                <p className="text-sm text-gray-600 mb-6">{confirmOpts.message}</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => resolveConfirm(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => resolveConfirm(true)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      confirmOpts.danger
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-[#0A2D6E] text-white hover:bg-[#0d3a8e]"
                    }`}
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
