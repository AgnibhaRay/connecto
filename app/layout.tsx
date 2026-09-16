import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Connecto",
  description: "Connect and engage with the community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="font-system-ui antialiased" suppressHydrationWarning>
        <AuthProvider>
          <div className="min-h-screen bg-paper text-ink">
            {children}
            <SpeedInsights />
          </div>
          <Toaster
            toastOptions={{
              className: "toast-mono",
              style: {
                borderRadius: 1000,
                background: "#ffffff",
                color: "#000000",
                border: "1px solid #d5d5d5",
                fontSize: "13px",
                boxShadow: "none",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
