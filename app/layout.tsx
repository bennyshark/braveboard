import ThemeWrapper from "@/components/common/ThemeWrapper";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Only the app content is hydrated on the client */}
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}