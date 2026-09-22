import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono } from "next/font/google";
import { ConsoleShell } from "@/components/layout/console-shell";
import { cn } from "@/lib/utils";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NPM Desk — AI-assisted network performance decisions",
  description:
    "Proof of concept for Telkom AI-assisted Network Performance Management decision support. Facts, inferences, and recommendations stay separate.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", figtree.variable, geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-full font-sans">
        <ConsoleShell>{children}</ConsoleShell>
      </body>
    </html>
  );
}
