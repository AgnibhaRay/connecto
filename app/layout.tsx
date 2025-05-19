import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Connecto+",
  description: "Connect and engage with the community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
            <SpeedInsights />
            <footer className="bg-gray-50 border-t">
              <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* About Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">About</h3>
                    <p className="text-base text-gray-500">
                      Connect with friends, share experiences, and stay updated with the latest events.
                    </p>
                  </div>

                  {/* Quick Links */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Quick Links</h3>
                    <ul className="space-y-2">
                      <li><Link href="/feed" className="text-base text-gray-500 hover:text-gray-900">Feed</Link></li>
                      <li><Link href="/events" className="text-base text-gray-500 hover:text-gray-900">Events</Link></li>
                      <li><Link href="/profile" className="text-base text-gray-500 hover:text-gray-900">Profile</Link></li>
                    </ul>
                  </div>

                  {/* Contact */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Contact</h3>
                    <ul className="space-y-2">
                      <li className="text-base text-gray-500">Email: support@example.com</li>
                      <li className="text-base text-gray-500">Follow us on social media</li>
                    </ul>
                  </div>

                  {/* Legal */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Legal</h3>
                    <ul className="space-y-2">
                      <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy Policy</Link></li>
                      <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900">Terms of Service</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8">
                  <p className="text-center text-base text-gray-400">
                    © {new Date().getFullYear()} Connecto+. All rights reserved.
                  </p>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Developed by Agnibha Ray
                  </p>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Powered by Google Cloud Platform
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
