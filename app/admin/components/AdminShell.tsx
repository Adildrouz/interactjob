"use client";
import { useState, useCallback, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TooltipProvider } from "./ui/tooltip";
import { AdminToaster, useToast as useToastImpl, type ToastType } from "./ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { CommandPaletteProvider } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// ── Toast (re-exported for backward compatibility with existing admin pages) ──
export function useToast() {
  return useToastImpl();
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
interface ConfirmOptions { title: string; message: string; danger?: boolean; }
interface ConfirmCtx { confirm: (opts: ConfirmOptions) => Promise<boolean>; }
const ConfirmContext = createContext<ConfirmCtx>({ confirm: async () => false });
export function useConfirm() {
  return useContext(ConfirmContext);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
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

  // Login page renders without the shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      <CommandPaletteProvider>
        <TooltipProvider delayDuration={300}>
          <div className="flex h-screen overflow-hidden bg-[var(--ad-bg)] text-[var(--ad-text)]">
            <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onLogout={logout} />

            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar onOpenMobileNav={() => setMobileOpen(true)} onLogout={logout} />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
            </div>
          </div>

          <AdminToaster />

          <Dialog open={!!confirmOpts} onOpenChange={(open) => !open && resolveConfirm(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{confirmOpts?.title}</DialogTitle>
                <DialogDescription>{confirmOpts?.message}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => resolveConfirm(false)}>Annuler</Button>
                <Button variant={confirmOpts?.danger ? "destructive" : "default"} onClick={() => resolveConfirm(true)}>
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TooltipProvider>
      </CommandPaletteProvider>
    </ConfirmContext.Provider>
  );
}

export type { ToastType };
