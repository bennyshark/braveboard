"use client";

import { Bell } from "lucide-react";

interface Update {
  id: number;
  title: string;
  description?: string;
  time?: string;
}

export default function UpdatesPanel({ updates }: { updates: Update[] }) {
  return (
    <aside className="hidden lg:flex flex-col w-100 h-full border-l dark:border-gray-700 bg-white dark:bg-gray-900">

      {/* Sticky header */}
      <div className="sticky top-0 bg-whie dark:bg-gray-900 z-10 mb-4 p-4">
        <h2 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
          <Bell className="h-5 w-5 mr-2" /> Updates
        </h2>
      </div>

      {/* inner scroll area */}
      <div className="p-4 flex flex-col flex-1 overflow-auto min-h-0">
        <div className="flex flex-col gap-3">
          {updates.map((u) => (
            <div
              key={u.id}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {u.title}
              </p>
              {u.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {u.description}
                </p>
              )}
              {u.time && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {u.time}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
