import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhotoDrop",
  description: "Local crowd-sourced event photo organizer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-stone-200 bg-white/80">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-xl font-black tracking-tight">
              PhotoDrop
            </Link>
            <div className="flex gap-3 text-sm font-semibold">
              <Link href="/register" className="rounded-md px-3 py-2 hover:bg-stone-100">
                Register
              </Link>
              <Link href="/upload" className="rounded-md px-3 py-2 hover:bg-stone-100">
                Upload
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
