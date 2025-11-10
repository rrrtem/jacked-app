import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jacked — Personal Workout Tracker",
  description: "App for tracking workouts with adaptive setups, progress analytics, and AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
