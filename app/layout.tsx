import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VisitorTracker from "@/components/VisitorTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omnix Lab | Premium Development Studio",
  description: "Elite software development, trading bots, web applications & digital solutions. Founded by Akomolafe Nathaniel.",
  keywords: "web development, trading bots, software development, Omnix Lab, Akomolafe Nathaniel, Nigeria",
  openGraph: {
    title: "Omnix Lab | Premium Development Studio",
    description: "Elite software development & digital solutions for forward-thinking businesses worldwide.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <VisitorTracker />
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}