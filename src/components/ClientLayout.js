"use client";

import { useAuth } from "@/app/services/auth-context";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";

const publicRoutes = ["/login", "/register", "/"];

export function ClientLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.includes(pathname);
  const showSidebar = isAuthenticated && !isPublicRoute && !isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSidebar) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-auto">{children}</main>
      </div>
    );
  }

  return <>{children}</>;
}
