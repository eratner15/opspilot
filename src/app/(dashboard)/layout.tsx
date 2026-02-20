import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <div className="lg:pl-64">
          <Topbar />
          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </TRPCProvider>
  );
}
