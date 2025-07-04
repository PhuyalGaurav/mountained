import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "./services/auth-context";
import { Toaster } from "../components/ui/toaster";
import { ClientLayout } from "../components/ClientLayout";

export const metadata = {
  title: "Mountain Ed",
  description: "Educational platform for learning",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
