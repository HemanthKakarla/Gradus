import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Card from "../components/card";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gladus",
  description: "This is an app to track all your daily goals and build new habits through periodic achievements and milestones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="center">
          <nav className="navbar ">
            <Link href="/">Home</Link>
            <Link href="/checkin">Check-in</Link>
            <Link href="/goals">My Goals</Link>
            <Link href="/settings">Settings</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
        <main className="pt-30">
          {children}
        </main>
        
      </body>
    </html>
  );
}
