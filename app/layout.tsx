import type { Metadata } from "next";
import { Inter, Raleway } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-inter",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-raleway-face",
  display: "swap",
});

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
    <html lang="en">
      <body className={`${inter.variable} ${raleway.variable} font-roobert antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-paper text-obsidian">
            <div className="flex-grow">{children}</div>
            <SpeedInsights />
            <footer className="mt-auto border-t border-obsidian bg-paper">
              <div className="page-container py-[68px]">
                <div className="grid grid-cols-1 gap-[46px] md:grid-cols-3">
                  <div>
                    <p className="label-micro text-obsidian">Studio</p>
                    <div className="mt-8 space-y-2 text-[11px] leading-[1.36] text-felt-gray">
                      <p>Connecto</p>
                      <p>A community for sharing work,</p>
                      <p>events, and quiet conversation.</p>
                    </div>
                  </div>

                  <div>
                    <p className="label-micro text-obsidian">Index</p>
                    <ul className="mt-8 space-y-2 text-[11px] leading-[1.36]">
                      <li>
                        <Link href="/feed" className="nav-link text-felt-gray">
                          Feed
                        </Link>
                      </li>
                      <li>
                        <Link href="/events" className="nav-link text-felt-gray">
                          Events
                        </Link>
                      </li>
                      <li>
                        <Link href="/chat" className="nav-link text-felt-gray">
                          Messages
                        </Link>
                      </li>
                      <li>
                        <Link href="/profile" className="nav-link text-felt-gray">
                          Profile
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="label-micro text-obsidian">Contact</p>
                    <div className="mt-8 space-y-2 text-[11px] leading-[1.36] text-felt-gray">
                      <p>support@connecto.app</p>
                      <p>Privacy · Terms</p>
                      <p>© {new Date().getFullYear()} Connecto</p>
                      <p>Developed by Agnibha Ray</p>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          <Toaster
            toastOptions={{
              className: "toast-mono",
              style: {
                borderRadius: 0,
                background: "#ffffff",
                color: "#000000",
                border: "1px solid #000000",
                fontSize: "12px",
                boxShadow: "none",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
