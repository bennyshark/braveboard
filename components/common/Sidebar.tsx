"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  Calendar,
  Image as Gallery,
  User,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Events", href: "/events", icon: Users },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Gallery", href: "/gallery", icon: Gallery },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 border-r bg-white dark:bg-gray-900 dark:border-gray-700 px-6 py-8">
      
      {/* App Name */}
      <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-10">
        BraveBoard
      </h1>

      {/* Navigation */}
      <nav className="flex flex-col gap-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${
                active
                  ? "bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            `}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto pt-6 border-t dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              John Doe
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Student
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
