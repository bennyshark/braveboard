"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Search, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Prevent SSR/client mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Hide navbar on root or login page
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav className="
  fixed top-0 left-0 right-0 
  md:left-64 
  z-40
  border-b bg-white dark:bg-gray-900 dark:border-gray-700 
  px-6 py-6 
  flex items-center justify-between
">

      {/* Left: Logo + Links */}

      <div className="hidden md:flex items-center pl-50 gap-40 text-gray-700 dark:text-gray-300">
          <Link href="/feed">Feed</Link>
          <Link href="/faculty">Faculty</Link>
          <Link href="/org">Org</Link>
        </div>

    <div className="flex gap-5">
          {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          aria-label="Search"
          autoComplete="off"
          className="pl-10 pr-4 py-2 border rounded-lg w-64 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>
    </div>
    
    </nav>
  );
}
