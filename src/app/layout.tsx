import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notas Inteligentes",
  description: "Lançamento e relatórios de notas acadêmicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <header className="border-b">
            <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
              <Link href="/" className="text-sm font-medium hover:opacity-80">
                Notas Inteligentes
              </Link>
              <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="/classes" className="hover:underline">Turmas</Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-6">
            {children}
          </main>
          <Toaster richColors expand />
        </ThemeProvider>
      </body>
    </html>
  );
}
