import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/EditorialUI";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhotoDrop",
  description: "Local crowd-sourced event photo organizer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-shell">
          <header className="topbar">
            <nav className="topbar-inner wrap">
              <Wordmark />
              <div className="topbar-nav">
                <Link href="/" className="topbar-link">
                  The roll
                </Link>
                <Link href="/register" className="topbar-link">
                  Register
                </Link>
                <Link href="/upload" className="topbar-link">
                  Upload
                </Link>
                <span className="pill">
                  <span className="dot-live" />
                  Local album
                </span>
              </div>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
