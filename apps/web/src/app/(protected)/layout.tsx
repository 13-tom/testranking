import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
