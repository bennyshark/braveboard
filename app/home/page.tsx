"use client"

export default function Home() {
  // Generate filler content
  const fillerItems = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

  return (
    <main className="flex-1 overflow-auto p-6 min-h-[calc(100vh-4rem)] w-full">
      <h1 className="text-2xl font-bold mb-6">Home - Scroll Test</h1>
      <div className="flex flex-col gap-4">
        {fillerItems.map((item) => (
          <div
            key={item}
            className="p-4 rounded-lg border dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
          >
            {item} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </div>
        ))}
      </div>
    </main>
  );
}
