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

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (pathname === "/" || pathname === "/sign-in") return null;

  return (
    <header className="h-25 bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 flex items-center justify-between shrink-0">
      <div className="hidden pl-50 md:flex items-center gap-40 text-gray-700 dark:text-gray-300">
        <Link href="/">Feed</Link>
        <Link href="/">Faculty</Link>
        <Link href="/">Org</Link>
      </div>

      <div className="flex items-center gap-4">
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

        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
// push