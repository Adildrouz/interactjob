import { Geist } from "next/font/google";
import "./admin-theme.css";
import { AdminThemeProvider } from "./components/theme-provider";
import AdminShell from "./components/AdminShell";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={geist.variable}>
      <AdminThemeProvider>
        <AdminShell>{children}</AdminShell>
      </AdminThemeProvider>
    </div>
  );
}
