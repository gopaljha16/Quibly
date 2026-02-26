import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@livekit/components-styles";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { GoogleAuthProvider } from "@/providers/GoogleAuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "sonner";
import { NotificationManager } from "@/components/NotificationManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quibly - Connect & Chat",
  description: "A modern communication platform built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* TEMPORARILY DISABLED - UNCOMMENT AFTER CLEARING TOKEN */}
        {/* <Script
          id="auth-check"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const protectedRoutes = ['/channels', '/invite'];
                const currentPath = window.location.pathname;
                const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
                
                if (isProtectedRoute) {
                  const hasToken = document.cookie.includes('token=');
                  if (!hasToken) {
                    console.log('No token - redirecting to login');
                    window.location.href = '/login';
                  }
                }
              })();
            `
          }}
        /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <GoogleAuthProvider>
                <AuthGuard>
                  <NotificationManager />
                  {children}
                </AuthGuard>
              </GoogleAuthProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
