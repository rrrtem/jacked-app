import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jacked — Персональный дневник тренировок",
  description: "Приложение для отслеживания тренировок с адаптивными сетапами, аналитикой прогресса и AI-помощником",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
