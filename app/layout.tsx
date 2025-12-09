// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/navbar";
import Sidebar from "@/components/common/sidebar";
import UpdatesSection from "@/components/common/updates-section";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Braveboard | First Asia Institute",
  description: "First Asia Institute Portal",
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
        {/* Fixed Navbar */}
        <Navbar />
        
        <div className="flex h-[calc(100vh-64px)] mt-16"> {/* 64px for navbar height */}
          {/* Fixed Sidebar */}
          <div className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64">
            <Sidebar />
          </div>
          
          {/* Scrollable Main Content */}
          <div className="flex-1 ml-64 overflow-y-auto">
            {children}
          </div>
          
          {/* Fixed Updates Section */}
          <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80">
            <UpdatesSection />
          </div>
          
          {/* Spacer for updates section */}
          <div className="w-80" />
        </div>
      </body>
    </html>
  );
}