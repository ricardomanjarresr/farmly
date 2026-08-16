import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farmly",
  description: "Fresh produce, straight from local farmers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
